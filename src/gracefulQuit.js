if (process.platform === 'win32') {
  const rl = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  })

  rl.on('SIGINT', () => {
    process.emit('SIGINT')
  })
}

process.on('SIGINT', () => {
  // graceful shutdown
  process.exit()
})
