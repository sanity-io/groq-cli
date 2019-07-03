# groq-cli

> Run GROQ on JSON documents in the command line

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
