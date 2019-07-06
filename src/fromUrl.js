const getIt = require('get-it')
const promise = require('get-it/lib/middleware/promise')
const request = getIt([promise({onlyBody: true})])

const fromUrl = url => request({url})

module.exports = fromUrl
