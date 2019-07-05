# groq-cli

_Currently in alpha._

> Easy wrangling of JSON documents with [GROQ](https://github.com/sanity-io/groq) in the command line.

The CLI tool consumes both JSON and [NDJSON](http://www.ndjson.org) documents. You can pass in data from a local file, or from piping to standard input.

## Install

```bash
npm install --global groq-cli
```

## Usage

```bash
$ groq --help

  Usage
    $ groq *[<filter>]{<projection>}

  Options
    --file  ./path/to/file
    --pretty colorized JSON output [Default: false]

  Examples
    # Query data in a ndjson-file
    $ groq '*[_type == "post"]{title}' --file ./blog.ndjson

    # Query data from standard input
    $ curl -s https://jsonplaceholder.typicode.com/todos | groq "*[completed == false]{'mainTitle': title, ...}" --pretty

```

## License

MIT – Copyright 2019–present Sanity Inc.
