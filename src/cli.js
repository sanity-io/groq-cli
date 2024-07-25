#!/usr/bin/env node

/* eslint-disable id-length, no-process-exit */
require('regenerator-runtime/runtime')
const fs = require('fs/promises')
const meow = require('meow')
const {parse, evaluate, typeEvaluate} = require('groq-js')
const getStdin = require('get-stdin')
const chalk = require('chalk')
const ndjson = require('ndjson')
require('./gracefulQuit')
const colorizeJson = require('./colorizeJson')
const S2A = require('stream-to-async-iterator').default
const cli = meow(
  `
Usage
  ${chalk.green(`$ groq '*[<filter>]{<projection>}'`)}
  ${chalk.grey(`# Remember to alternate quotation marks inside of the query`)}

Options
  ${chalk.green(`-i, --input`)}   One of: ndjson, json, null
  ${chalk.green(`-o, --output`)}  One of: ndjson, json, pretty, type-nodes
  ${chalk.green(`-p, --pretty`)}  Shortcut for --output=pretty
  ${chalk.green(`-n, --ndjson`)}  Shortcut for --input=ndjson --output=ndjson
  ${chalk.green(`-s, --schema`)}  Path to a schema file, only required when output is set to "type-nodes"

Input formats
  ${chalk.green(`json`)}      Reads a JSON object from stdin.
  ${chalk.green(`ndjson`)}    Reads a JSON stream from stdin.
  ${chalk.green(`null`)}      Reads nothing.

Output formats
  ${chalk.green(`json`)}      Formats the output as JSON.
  ${chalk.green(`pretty`)}    Formats the output as pretty JSON.
  ${chalk.green(`ndjson`)}    Streams the result as NDJSON.

Examples
  ${chalk.grey(`# Query data in a file`)}
  ${chalk.green(`$ cat blog.json | groq 'count(posts)' `)}

  ${chalk.grey(`# Query data in a NDJSON file`)}
  ${chalk.green(`$ cat blog.ndjson | groq --input ndjson '*[_type == "post"]{title}' `)}

  ${chalk.grey(`# Query JSON data from an URL`)}
  ${chalk.green(
    `$ curl -s https://jsonplaceholder.typicode.com/todos | groq  --pretty '*[completed == false]{title}'`,
  )}
`,
  {
    flags: {
      pretty: {
        type: 'boolean',
        alias: 'p',
        default: false,
      },
      ndjson: {
        type: 'boolean',
        alias: 'n',
        default: false,
      },
      input: {
        type: 'string',
        alias: 'i',
        default: 'json',
      },
      output: {
        type: 'string',
        alias: 'o',
        default: 'json',
      },
      schema: {
        type: 'string',
        alias: 's',
        default: '',
      },
    },
  },
)

function handleError(error) {
  console.error(chalk.red(error))
  process.emit('SIGINT')
}

function validateChoice(title, input, choices) {
  if (!choices.includes(input)) {
    throw Error(
      chalk.yellow(`Unknown ${title}: ${input}. Valid choices are: ${choices.join(', ')}.`),
    )
  }
}

function check({query, inputFormat, outputFormat, schemaPath}) {
  if (!query) {
    throw Error(chalk.yellow('You must add a query. To learn more, run\n\n  $ groq --help'))
  }

  validateChoice('input format', inputFormat, ['json', 'ndjson', 'null'])
  validateChoice('output format', outputFormat, ['json', 'ndjson', 'pretty', 'type-nodes'])

  if (outputFormat === 'type-nodes' && schemaPath === '') {
    throw Error(chalk.yellow('You must provide a schema file with the --schema flag'))
  }

  return true
}

async function* outputJSON(result) {
  yield JSON.stringify(await result.get())
  yield '\n'
}

async function* outputPrettyJSON(result) {
  yield colorizeJson(await result.get())
  yield '\n'
}

async function* outputNDJSON(result) {
  if (result.type == 'stream') {
    for await (const value of result) {
      yield JSON.stringify(await value.get())
      yield '\n'
    }
  } else {
    yield JSON.stringify(await result.get())
    yield '\n'
  }
}

const OUTPUTTERS = {
  json: outputJSON,
  pretty: outputPrettyJSON,
  ndjson: outputNDJSON,
}

async function inputJSON() {
  const input = await getStdin()
  const dataset = input === '' ? null : JSON.parse(input)
  return {dataset, root: dataset}
}

function inputNDJSON() {
  const dataset = new S2A(process.stdin.pipe(ndjson.parse()))
  return {dataset}
}

function inputNull() {
  return {}
}

const INPUTTERS = {
  json: inputJSON,
  ndjson: inputNDJSON,
  null: inputNull,
}

async function* runQuery() {
  const {flags, input} = cli
  const {pretty, ndjson: isNdjson} = flags
  let {input: inputFormat, output: outputFormat, schema: schemaPath} = flags

  const query = input[0]

  if (pretty) {
    outputFormat = 'pretty'
  }

  if (isNdjson) {
    outputFormat = 'ndjson'
    inputFormat = 'ndjson'
  }

  check({query, inputFormat, outputFormat, schemaPath})

  // Parse query
  const tree = parse(query)

  // Read input
  const inputter = INPUTTERS[inputFormat]
  const options = await inputter()
  console.log(outputFormat)
  if (outputFormat === 'type-nodes') {
    const schemaData = JSON.parse(await fs.readFile(schemaPath))
    const result = typeEvaluate(tree, schemaData)
    yield colorizeJson(result)
    return
  }

  // Execute query
  const result = await evaluate(tree, options)

  // Stream output
  const streamer = OUTPUTTERS[outputFormat]
  yield* await streamer(result)
}

async function main() {
  for await (const data of runQuery()) {
    process.stdout.write(data)
  }
}

main().catch(handleError)
