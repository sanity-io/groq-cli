const getIt = require('get-it')
const {promise, httpErrors} = require('get-it/middleware')
const request = getIt([promise({onlyBody: true}), httpErrors()])

const fromUrl = url => request({url})

module.exports = fromUrl
