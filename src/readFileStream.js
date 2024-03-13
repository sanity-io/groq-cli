const fs = require('fs')

function readFileStream(file) {
  return new Promise((resolve, reject) => {
    const chunks = []
    const stream = fs.createReadStream(file)
    stream.on('error', (err) => reject(err))
    stream.on('data', (chunk) => chunks.push(chunk))
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
  })
}

module.exports = readFileStream
