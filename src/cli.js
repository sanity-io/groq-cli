#!/usr/bin/env node

/* eslint-disable id-length, no-process-exit */
require("regenerator-runtime/runtime")
const meow = require('meow')
const { parse, evaluate } = require('groq-js')
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
  ${chalk.green(`-i, --input   One of: ndjson, json, null`)}
  ${chalk.green(`-o, --output  One of: ndjson, json, pretty`)}
  ${chalk.green(`-p, --pretty  Shortcut for --output=pretty`)}

Input formats
  ${chalk.green(`json`)}      Reads a JSON object from stdin. Available as @ in query.
  ${chalk.green(`ndjson`)}    Reads a JSON stream from stdin. Available as * in query.
  ${chalk.green(`null`)}      Reads nothing.

Output formats
  ${chalk.green(`json`)}      Formats the output as JSON.
  ${chalk.green(`pretty`)}    Pretty prints the output.
  ${chalk.green(`ndjson`)}    Streams the result as NDJSON.

Examples
  ${chalk.grey(`# Query data in a file`)}
  ${chalk.green(`$ cat blog.json | groq 'count(posts.length)' `)}

  ${chalk.grey(`# Query data in a NDJSON file`)}
  ${chalk.green(`$ cat blog.ndjson | groq --input ndjson '*[_type == "post"]{title}' `)}

  ${chalk.grey(`# Query JSON data from an URL`)}
  ${chalk.green(
    `$ curl -s https://jsonplaceholder.typicode.com/todos | groq  --pretty '@[completed == false]{title}'`
  )}
`,
  {
    flags: {
      pretty: {
        type: 'boolean',
        alias: 'p',
        default: false
      },
      input: {
        type: 'string',
        alias: 'i',
        default: 'json'
      },
      output: {
        type: 'string',
        alias: 'o',
        default: 'json'
      }
    }
  }
)

function handleError (error) {
  console.error(chalk.red(error))
  process.emit('SIGINT')
}

function check ({ query, inputFormat, outputFormat }) {
  if (!query) {
    throw Error(
      chalk.yellow(
        'You must add a query. To learn more, run\n\n  $ groq --help'
      )
    )
  }

  if (!/^(json|ndjson|null)$/.test(inputFormat)) {
    throw Error(chalk.yellow(`Unknown input format: ${inputFormat}`))
  }

  if (!/^(json|ndjson|pretty)$/.test(outputFormat)) {
    throw Error(chalk.yellow(`Unknown output format: ${outputFormat}`))
  }

  return true
}

async function* runQuery() {
  const { flags, input } = cli
  const { input: inputFormat, pretty } = flags
  let { output: outputFormat } = flags

  const query = input[0]
  if (pretty) {
    outputFormat = 'pretty'
  }

  check({ query, inputFormat, outputFormat })

  const tree = parse(query)

  let documents
  let root

  switch (inputFormat) {
    case 'json':
      root = JSON.parse(await getStdin())
      break
    case 'ndjson':
      documents = new S2A(process.stdin.pipe(ndjson()))
      break
    default:
      // do nothing
  }

  const result = await evaluate(tree, { documents, root })

  switch (outputFormat) {
    case 'json':
      yield JSON.stringify(await result.get())
      break
    case 'pretty':
      yield colorizeJson(await result.get())
      break
    case 'ndjson':
      if (result.getType() == 'array') {
        // eslint-disable-next-line max-depth
        for await (const value of result) {
          yield JSON.stringify(await value.get())
          yield "\n"
        }
      } else {
        yield JSON.stringify(await result.get())
        yield "\n"
      }
      break
    default:
        // do nothing
  }
}

async function main() {
  for await (const data of runQuery()) {
    process.stdout.write(data)
  }
}

main().catch(handleError)
