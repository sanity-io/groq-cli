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
  Run GROQ in the command line

  Usage
    $ groq '*[<filter>]{<projection>}'
    # Remember to alternate quotation marks inside of the query

  Options
    -i, --input   One of: ndjson, json, null
    -o, --output  One of: ndjson, json, pretty
    -p, --pretty  Shortcut for --output=pretty

  Input formats
    json      Reads a JSON object from stdin.
    ndjson    Reads a JSON stream from stdin.
    null      Reads nothing.

  Output formats
    json      Formats the output as JSON.
    pretty    Formats the output as pretty JSON.
    ndjson    Streams the result as NDJSON.

  Examples
    # Query data in a file
    $ cat blog.json | groq 'count(posts)'

    # Query data in a NDJSON file
    $ cat blog.ndjson | groq --input ndjson '*[_type == "post"]{title}'

    # Query JSON data from an URL
    $ curl -s https://jsonplaceholder.typicode.com/todos | groq  --pretty '*[completed == false]{title}'
```

## Similar tools

GROQ-cli isn't the only tool to work with JSON data in the command line. If it doesn't do exactly what you need, you can check out these other tools that might help you:

- [jq](https://stedolan.github.io/jq/) — a lightweight and flexible command-line JSON processor.
- [gron](https://github.com/tomnomnom/gron) - Make JSON greppable!





## License

MIT – Copyright 2019–present Sanity Inc.
