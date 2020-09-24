const WebSocket = require('ws')
const Chokidar = require('chokidar')
const Fs = require('fs')

const ws = new WebSocket('ws://online.swiftplayground.run/terminal')

const run = (code, version) => {
  ws.send(JSON.stringify({
    run: {
      toolchain: version || '5.1-RELEASE',
      value: code
    }
  }))
}

const fileChangeRun = (reg, run) => {
  Chokidar.watch(reg, {
    ignored: /node_modules/,
    persistent: true,
    cwd: '.',
  }).on('all', (eventType, path) => {
    if (eventType !== 'change') {
      return
    }

    const fileContent = Fs.readFileSync(path).toString().trim()

    if (!fileContent) {
      return
    }

    run(fileContent)
  })
}

ws.on('open', () => {
  fileChangeRun('*.swift', run)
})

ws.on('message', data => {
  const value = JSON.parse(data).output.value

  console.clear()
  console.log(value)
})
