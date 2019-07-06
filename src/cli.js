#!/usr/bin/env node

/* eslint-disable id-length, no-console, no-process-env, no-sync, no-process-exit */
const meow = require('meow')
const fs = require('fs')
const { query } = require('groq-js') // manually linked
const getStdin = require('get-stdin')
const chalk = require('chalk')
const colorizeJson = require('./colorizeJson')
const output = require('./cliOutputter')
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
  ${chalk.green(`$ groq '*[completed == false]{title}' --url https://jsonplaceholder.typicode.com/todos`)}

  ${chalk.grey(`# Query data from stdIn`)}
  ${chalk.green(`$ curl -s https://jsonplaceholder.typicode.com/todos | groq "*[completed == false]{'mainTitle': title, ...}" --pretty`)}

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

function parseDocuments (data) {
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
async function parseQuery () {
  const { flags, input } = cli
  const { file, url, pretty } = flags
  const stdIn = await getStdin()

	if (input.length === 0) {
		return chalk.yellow('You must add a query. To learn more, run\n\n  $ groq --help')
	}
	if (!file || !url || !stdIn) {
		return chalk.yellow('There’s no data to query. To learn more, run\n\n  $ groq --help')
	}

  let docs = ''
  if (file) {
    const fileContent = await fs.readFileSync(file, 'utf-8')
    docs = await parseDocuments(fileContent)
	}
	if (url) {
		const urlContent = await fromUrl(url)
    docs = await parseDocuments(urlContent)
	}
  if (stdIn) {
    docs = await parseDocuments(stdIn)
  }

  const result = await query({
    source: input[0],
    params: {},
    globalFilter: true,
    fetcher: () => ({
      results: docs
      /* start: 0 */
    })
  }).then(data => data)
  if (pretty) {
	  return colorizeJson(result, chalk)
  }
  return chalk(JSON.stringify(result))
}

parseQuery().then(output.print)
