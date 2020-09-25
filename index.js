#!/usr/bin/env node

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

    let fileContent = Fs.readFileSync(path).toString().trim()

    if (!fileContent) {
      return
    }

    if (path.endsWith('.md')) {
      const swiftCodeReg = /`{3}swift.*\n([\w\W]+?)`{3}/g
      const swiftCodes = []

      for (let matchRes of fileContent.matchAll(swiftCodeReg)) {
        swiftCodes.push(matchRes[1])
      }

      if (swiftCodes.length === 0) {
        return
      }

      fileContent = swiftCodes.join(`\nprint("\\n--- split code ---\\n")\n`)
    }

    run(fileContent)
  })
}

ws.on('open', () => {
  fileChangeRun('*.(swift|md)', run)
})

ws.on('message', data => {
  const value = JSON.parse(data).output.value

  console.clear()
  console.log(value)
})
