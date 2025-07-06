'use strict'

// 测量文本大小
const measureText = function IIFE() {
  const size = {width: 0, lines: 0}
  const container = document.createElement('text')
  let appended = false
  let usedFont = ''
  let lineHeight = 0
  container.style.whiteSpace = 'pre'
  return function (text, font = '') {
    if (appended === false) {
      appended = true
      document.body.appendChild(container)
      container.textContent = 'a'
      lineHeight = container.offsetHeight
      Promise.resolve().then(() => {
        appended = false
        container.textContent = ''
        container.remove()
      })
    }
    if (usedFont !== font) {
      usedFont = font
      container.style.fontFamily = font ?? ''
    }
    container.textContent = text
    size.width = container.offsetWidth
    size.lines = container.offsetHeight / lineHeight
    return size
  }
}()

// 请求执行回调函数(过滤一帧内的重复事件)
const request = function IIFE() {
  const callbacks = []
  return function (callback) {
    if (callbacks.append(callback)) {
      requestAnimationFrame(() => {
        if (callbacks.remove(callback)) {
          callback()
        }
      })
    }
  }
}()

// CSS 选择器
const $ = function IIFE() {
  const regexp = /^#(\w|-)+$/
  return function (selector) {
    if (regexp.test(selector)) {
      return document.querySelector(selector)
    } else {
      return document.querySelectorAll(selector)
    }
  }
}()

// 获取元素读取器
const getElementReader = function (prefix) {
  return function (suffix) {
    return $(`#${prefix}-${suffix}`).read()
  }
}

// 获取元素写入器
const getElementWriter = function (prefix, bindingObject) {
  return function (suffix, value) {
    if (value === undefined) {
      const nodes = typeof suffix === 'string'
                  ? suffix.split('-')
                  : [suffix]
      value = bindingObject
      for (const node of nodes) {
        value = value[node]
      }
    }
    $(`#${prefix}-${suffix}`).write(value)
  }
}

// 生成整数颜色
const INTRGBA = function (hex) {
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  const a = parseInt(hex.slice(6, 8), 16)
  return r + (g + (b + a * 256) * 256) * 256
}

// 生成CSS颜色
const CSSRGBA = function (hex) {
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  const a = parseInt(hex.slice(6, 8), 16)
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

// 如果是MacOS系统，改变样式
if (process.platform === 'darwin') {
  document.documentElement.classList.add('darwin')
} 