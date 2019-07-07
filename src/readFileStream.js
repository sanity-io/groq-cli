const fs = require('fs')

function readFileStream (file) {
  return new Promise(resolve => {
    let chunks = ''
    const stream = fs.createReadStream(file, { encoding: 'utf8' })
    stream.on('data', chunk => {
      chunks += chunk
    })
    stream.on('close', () => {
      return resolve(chunks)
    })
    stream.on('error', err => {
      return resolve(err)
    })
  })
}

module.exports = readFileStream
