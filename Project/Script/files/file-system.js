'use strict'

const File = {
  // properties
  root: '',
  promises: {},
  // methods
  get: null,
  getPath: null,
  save: null,
  saveFile: null,
  planToSave: null,
  cancelSave: null,
  parseFileSize: null,
  getFileName: null,
  getImageResolution: null,
  openPath: null,
  openURL: null,
  showInExplorer: null,
  showOpenDialog: null,
  showSaveDialog: null,
  parseGUID: null,
  filterGUID: null,
  updateRoot: null,
  route: null,
}

// 获取文件
File.get = function (descriptor) {
  let path
  if (descriptor.path) {
    path = File.route(descriptor.path)
  } else if (descriptor.guid) {
    path = File.route(this.getPath(descriptor.guid))
  } else if (descriptor.local) {
    path = descriptor.local
  } else {
    Log.throw(new Error('Invalid parameter'))
  }
  const type = descriptor.type
  switch (type) {
    case 'image': {
      // 如果图像存在guid
      // 文件路径添加版本号
      if (descriptor.guid) {
        const meta = Data.manifest.guidMap[descriptor.guid]
        if (meta) path += `?ver=${meta.mtimeMs}`
      }
      const promises = this.promises
      return promises[path] || (
      promises[path] = new Promise(resolve => {
        const image = new Image()
        image.guid = descriptor.guid ?? ''
        image.onload = () => {
          delete promises[path]
          image.onload = null
          image.onerror = null
          resolve(image)
        }
        image.onerror = () => {
          delete promises[path]
          image.onload = null
          image.onerror = null
          image.src = ''
          resolve(image)
        }
        image.src = path
      }))
    }
    default:
      return new Promise((resolve, reject) => {
        const request = new XMLHttpRequest()
        request.onload = () => {
          resolve(request.response)
        }
        request.onerror = () => {
          reject(new URIError(path))
        }
        request.open('GET', path)
        request.responseType = type
        request.send()
      })
  }
}

// 获取路径
File.getPath = function (guid) {
  return Data.manifest.guidMap[guid]?.path ?? ''
}

// 保存项目
File.save = function (hint = true) {
  // 保存元数据清单文件
  Data.saveManifest()

  // 保存改变的文件
  const {guidMap, changes} = Data.manifest
  for (const meta of changes) {
    // 验证元数据有效性
    if (guidMap[meta.guid] === meta) {
      File.saveFile(meta)
    }
  }
  if (changes.length !== 0) {
    changes.length = 0
  }

  // 改变指针样式
  if (hint) {
    Cursor.open('cursor-wait')
    setTimeout(() => {
      Cursor.close('cursor-wait')
    }, 100)
  }

  // 这里没有考虑写入失败的情况
  return require('electron').ipcRenderer.invoke('wait-write-file')
}

// 保存文件
File.saveFile = function (meta) {
  switch (meta) {
    case Scene.meta:
      Scene.save()
      break
    case UI.meta:
      UI.save()
      break
    case Animation.meta:
      Animation.save()
      break
    case Particle.meta:
      Particle.save()
      break
    case Data.manifest.project.variables:
      Data.generateVariableEnumScript()
      break
  }
  let text
  const data = meta.dataMap?.[meta.guid]
  switch (typeof data) {
    case 'object':
      meta.tryFixGuid?.(data)
      text = JSON.stringify(data, null, 2)
      break
    default:
      return Promise.resolve()
  }
  const path = meta.path
  const route = File.route(path)
  return FSP.writeFile(
    route, text, true).then(() => {
    console.log(`write: ${path}`)
  }).catch(error => {
    console.warn(error)
  })
}

// 计划保存
File.planToSave = function (meta) {
  if (meta instanceof Object) {
    return Data.manifest.changes.append(meta)
  } else {
    throw new Error('Invalid file meta')
  }
}

// 取消保存
File.cancelSave = function (meta) {
  return Data.manifest.changes.remove(meta)
}

// 解析文件大小
File.parseFileSize = function (size) {
  let string
  let unit
  if (size < 1000) {
    unit = size === 1 ? 'byte' : 'bytes'
  } else {
    size /= 1024
    if (size < 1000) {
      unit = 'KB'
    } else {
      size /= 1024
      if (size < 1000) {
        unit = 'MB'
      } else {
        size /= 1024
        unit = 'GB'
      }
    }
  }
  switch (unit) {
    case 'byte':
    case 'bytes':
      string = size.toString()
      break
    default:
      if (size < 10) {
        string = size.toFixed(2)
      } else if (size < 100) {
        string = size.toFixed(1)
      } else {
        string = size.toFixed(0)
      }
      break
  }
  return `${string}${unit}`
}

// 获取文件名称
File.getFileName = function IIFE() {
  const struct = {path: '', route: ''}
  return function (dir, base, ext = '') {
    let path = `${dir}/${base}${ext}`
    let route = File.route(path)
    if (FS.existsSync(route)) {
      for (let i = 1; true; i++) {
        path = `${dir}/${base} ${i}${ext}`
        route = File.route(path)
        if (!FS.existsSync(route)) {
          break
        }
      }
    }
    struct.path = path
    struct.route = route
    return struct
  }
}()

// 获取图像尺寸
File.getImageResolution = function IIFE() {
  const promises = {}
  const resolution = {width: 0, height: 0}
  return function (path) {
    let promise = promises[path]
    if (promise === undefined) {
      promise = promises[path] =
      new Promise((resolve, reject) => {
        const image = new Image()
        image.src = File.route(path)
        const intervalIndex = setInterval(() => {
          if (image.naturalWidth !== 0) {
            resolution.width = image.naturalWidth
            resolution.height = image.naturalHeight
            delete promises[path]
            clearInterval(intervalIndex)
            resolve(resolution)
            image.src = ''
          } else if (image.complete) {
            delete promises[path]
            clearInterval(intervalIndex)
            reject(new URIError('Image load failed.'))
          }
        })
      })
    }
    return promise
  }
}()

// 打开资源管理器路径
File.openPath = function (path) {
  require('electron').ipcRenderer
  .send('open-path', path)
}

// 打开URL
File.openURL = function (url) {
  if (url) {
    require('electron').shell.openExternal(url)
  }
}

// 显示在资源管理器中
File.showInExplorer = function (path) {
  require('electron').ipcRenderer
  .send('show-item-in-folder', path)
}

// 显示打开对话框
File.showOpenDialog = function (options) {
  const {ipcRenderer} = require('electron')
  return ipcRenderer.invoke('show-open-dialog', options)
}

// 显示保存对话框
File.showSaveDialog = function (options) {
  const {ipcRenderer} = require('electron')
  return ipcRenderer.invoke('show-save-dialog', options)
}

// 解析元数据对应的文件名称
File.parseMetaName = function (meta) {
  const alias = File.filterGUID(meta.path)
  const extname = Path.extname(alias)
  return Path.basename(alias, extname)
}

// 解析文件名中的GUID
File.parseGUID = function IIFE() {
  const regexp = /(?<=\.)[0-9a-f]{16}(?=\.\S+$)/
  return function (filename) {
    const match = filename.match(regexp)
    return match ? match[0] : ''
  }
}()

// 过滤文件名中的GUID
File.filterGUID = function IIFE() {
  const regexp = /\.[0-9a-f]{16}(?=\.\S+$)/
  return function (filename) {
    return filename.replace(regexp, '')
  }
}()

// 更新根目录
File.updateRoot = function (path) {
  const index = path.lastIndexOf('/')
  this.root = path.slice(0, index + 1)
}

// 获取路径
File.route = function (relativePath) {
  return this.root + relativePath
}

const FS = require('fs')
const FSP = FS.promises

// 重写写入文件方法
FSP.writeFile = function (path, text, check = false) {
  const {invoke} = require('electron').ipcRenderer
  return invoke('write-file', path, text, check)
} 