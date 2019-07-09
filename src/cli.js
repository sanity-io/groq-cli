#!/usr/bin/env node

/* eslint-disable id-length, no-process-exit */
const meow = require('meow')
const readFileStream = require('./readFileStream')
const {parse, evaluate} = require('groq-js')
const getStdin = require('get-stdin')
const chalk = require('chalk')
require('./gracefulQuit')
const colorizeJson = require('./colorizeJson')
const fromUrl = require('./fromUrl')
const cli = meow(
  `
Usage
  ${chalk.green(`$ groq '*[<filter>]{<projection>}'`)}
  ${chalk.grey(`# Remember to alternate quotation marks inside of the query`)}

Options
  ${chalk.green(`--file  ./path/to/file`)}
  ${chalk.green(`--url https://aniftyapi.dev/endpoint`)}
  ${chalk.green(`--pretty colorized JSON output [Default: false]`)}

Examples
  ${chalk.grey(`# Query data in a ndjson-file`)}
  ${chalk.green(`$ groq '*[_type == "post"]{title}' --file ./blog.ndjson`)}

  ${chalk.grey(`# Query JSON data from an URL`)}
  ${chalk.green(
    `$ groq '*[completed == false]{title}' --url https://jsonplaceholder.typicode.com/todos`
  )}

  ${chalk.grey(`# Query data from stdIn`)}
  ${chalk.green(
    `$ curl -s https://jsonplaceholder.typicode.com/todos | groq "*[completed == false]{'mainTitle': title, ...}" --pretty`
  )}

`,
  {
    flags: {
      file: {
        type: 'string',
        default: undefined
      },
      url: {
        type: 'string',
        default: undefined
      },
      pretty: {
        type: 'boolean',
        default: false
      }
    }
  }
)

function handleError(error) {
  console.error(chalk.red(error))
  process.emit('SIGINT')
}

function parseDocuments(data) {
  try {
    return JSON.parse(data)
  } catch (err) {
    try {
      return data
        .toString()
        .trim()
        .split('\n')
        .map(JSON.parse)
    } catch (error) {
      throw new Error(`Is the input valid JSON/NDJSON?\n\n${error}`)
    }
  }
}

function check({input, file, url, stdIn}) {
  if (input.length === 0) {
    return chalk.yellow('You must add a query. To learn more, run\n\n  $ groq --help')
  }
  if (!file && !url && !stdIn) {
    return chalk.yellow('There’s no data to query. To learn more, run\n\n  $ groq --help')
  }

  return true
}

async function parseQuery() {
  const {flags, input} = cli
  const {file, url, pretty} = flags
  const stdIn = await getStdin()
  if(!check({input, file, url, stdIn})) {
    return
  }
  let documents = []
  if (file) {
    const fileContent = await readFileStream(file).catch(handleError)
    documents = await parseDocuments(fileContent)
  } else if (url) {
    const urlContent = await fromUrl(url)
    documents = await parseDocuments(urlContent)
  } else if (stdIn) {
    documents = await parseDocuments(stdIn)
  }

  const query = input[0]
  const tree = parse(query)
  const result = await evaluate(tree, {documents}).get()


  if (pretty) {
    return colorizeJson(result)
  }

  return JSON.stringify(result)
}

parseQuery()
  .then(result => console.log(result))
  .catch(handleError)
