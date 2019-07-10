# groq-cli

_Currently in alpha._

> Easy wrangling of JSON documents with [GROQ](https://github.com/sanity-io/groq) in the command line.

The CLI tool consumes both JSON and [NDJSON](http://www.ndjson.org) documents. You can pass in data from a local file, or from piping to standard input.

Read the [announcement blog post](https://www.sanity.io/blog/we-re-open-sourcing-groq-a-query-language-for-json-documents), and the [getting started guide](https://www.sanity.io/docs/data-store/how-queries-work).

## Install

```bash
npm install --global groq-cli
```

## Requirements

This CLI requires Node v10 or later.

## Usage

```bash
$ groq --help

  Usage
    $ groq '*[<filter>]{<projection>}'
    # Remember to alternate quotation marks inside of the query

  Options
    --file  ./path/to/file
    --url https://aniftyapi.dev/endpoint
    --pretty colorized JSON output [Default: false]

  Examples
    # Query data in a ndjson-file
    $ groq '*[_type == "post"]{title}' --file ./blog.ndjson

    # Query JSON data from an URL
    $ groq '*[completed == false]{title}' --url https://jsonplaceholder.typicode.com/todos

    # Query data from stdIn
    $ curl -s https://jsonplaceholder.typicode.com/todos | groq "*[completed == false]{'mainTitle': title, ...}" --pretty

```

## Similar tools

GROQ-cli isn't the only tool to work with JSON data in the command line. If it doesn't do exactly what you need, you can scheck out these other tools that might help you:

- [jq](https://stedolan.github.io/jq/) — a lightweight and flexible command-line JSON processor.
- [gron](https://github.com/tomnomnom/gron) - Make JSON greppable!





## License

MIT – Copyright 2019–present Sanity Inc.
