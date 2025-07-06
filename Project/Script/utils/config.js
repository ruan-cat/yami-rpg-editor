'use strict'

const {require} = window

// 提前读取配置文件以减少等待时间
// promise.then的执行顺序在main.js之后
const path = require('path').resolve(__dirname, 'config.json')
window.config = require('fs').promises.readFile(path, 'utf8')
.then(json => JSON.parse(json))
.catch(error => {
  // 如果不存在配置文件或加载出错
  return File.get({
    local: 'default.json',
    type: 'json',
  }).then(config => {
    // 设置默认配置属性
    config.theme = 'dark'
    config.language = ''
    config.project = ''
    config.recent = []
    config.scriptEditor = {
      mode: 'by-file-extension',
      path: '',
    }
    return require('electron').ipcRenderer
    .invoke('get-dir-path', 'documents')
    .catch(error => 'C:')
    .then(path => {
      for (const key of Object.keys(config.dialogs)) {
        config.dialogs[key] = Path.slash(path)
      }
      return config
    })
  })
}) 