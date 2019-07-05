#!/usr/bin/env node

/* eslint-disable id-length, no-console, no-process-env, no-sync, no-process-exit */
const meow = require('meow')
const fs = require('fs')
const { query } = require('groq-js') // manually linked
const getStdin = require('get-stdin')
const chalk = require('chalk')
const colorizeJson = require('./colorizeJson')
const output = require('./cliOutputter')
const cli = meow(
  `
	Usage
		$ groq '*[<filter>]{<projection>}'
		# Remember to alternate quotation marks inside of the query

	Options
	  --file  ./path/to/file [Default: ./]
	  --pretty colorized JSON output

	Examples
	  # Query data in a ndjson-file
	  $ groq '*[_type == "post"]{title}' --file ./blog.ndjson

	  # Query data from stdIn
	  $ curl -s https://jsonplaceholder.typicode.com/todos | groq "*[completed == false]{'mainTitle': title, ...}" --pretty

`,
  {
    flags: {
      file: {
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
function parseDocuments (data) {
  try {
    return JSON.parse(data)
  } catch (err) {
    return data
      .toString()
      .trim()
      .split('\n')
      .map(JSON.parse)
  }
}
async function parseQuery () {
  const spinner = output.spinner('Loading data').start()
  const { flags, input } = cli
  const { file, pretty } = flags
  const stdIn = await getStdin()

  let docs = ''
  if (file) {
    const fileContent = await fs.readFileSync(file, 'utf-8')
    docs = await parseDocuments(fileContent)
  }
  if (stdIn) {
    docs = await parseDocuments(stdIn)
  }

  spinner.text = 'Perfoming query'

  const result = await query({
    source: input[0],
    params: {},
    globalFilter: true,
    fetcher: () => ({
      results: docs
      /* start: 0 */
    })
  }).then(data => data)
  spinner.text = 'Query done'
  spinner.succeed()
  if (pretty) {
	  return colorizeJson(result, chalk)
  }
  return chalk(JSON.stringify(result))
}

parseQuery().then(output.print)
