'use strict'

// 检查缓冲区
Clipboard.has = function (format) {
  const {clipboard} = require('electron')
  const buffer = clipboard.readBuffer(format)
  return buffer.length !== 0
}

// 读取缓冲区
Clipboard.read = function (format) {
  const {clipboard} = require('electron')
  const buffer = clipboard.readBuffer(format)
  const string = buffer.toString()
  return string ? JSON.parse(string) : null
}

// 写入缓冲区
Clipboard.write = function (format, object) {
  const {clipboard} = require('electron')
  const string = JSON.stringify(object)
  const buffer = Buffer.from(string)
  clipboard.writeBuffer(format, buffer)
} 