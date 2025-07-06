'use strict'

// 事件访问器
Object.defineProperties(Event.prototype, {
  dragKey: {
    get: function () {
      return this.spaceKey || this.altKey
    }
  },
  cmdOrCtrlKey: {
    get: process.platform === 'darwin'
    ? function () {return this.metaKey}
    : function () {return this.ctrlKey}
  },
  macRedoKey: {
    get: process.platform === 'darwin'
    ? function () {return this.metaKey && this.shiftKey && this.code === 'KeyZ'}
    : function () {return false}
  },
})

// 事件目标方法 - 添加事件
EventTarget.prototype.on = function (type, listener, options) {
  switch (type) {
    case 'doubleclick':
      this.addEventListener('pointerdown', pointerdown)
      this.addEventListener('doubleclick', listener, options)
      break
    default:
      this.addEventListener(type, listener, options)
      break
  }
}

// 事件目标方法 - 删除事件
EventTarget.prototype.off = function (type, listener, options) {
  switch (type) {
    case 'doubleclick':
      this.removeEventListener('pointerdown', pointerdown, options)
      this.removeEventListener('doubleclick', listener, options)
      break
    default:
      this.removeEventListener(type, listener, options)
      break
  }
}

// 鼠标事件方法 - 返回相对于元素的坐标
MouseEvent.prototype.getRelativeCoords = function IIFE() {
  const point = {x: 0, y: 0}
  return function (element) {
    const rect = element.getBoundingClientRect()
    point.x = (
      this.clientX
    - rect.left
    - element.clientLeft
    + element.scrollLeft
    )
    point.y = (
      this.clientY
    - rect.top
    - element.clientTop
    + element.scrollTop
    )
    return point
  }
}()

// 指针事件方法 - 判断两个事件是否有关联
PointerEvent.prototype.relate = function (event) {
  return this.pointerId === event.pointerId
}

// 数据传送方法 - 隐藏拖拽图像
DataTransfer.prototype.hideDragImage = function IIFE() {
  const image = document.createElement('no-drag-image')
  return function () {
    this.setDragImage(image, 0, 0)
  }
}()

// 节点列表 - 添加事件
NodeList.prototype.on = function (type, listener, options) {
  for (const element of this) {
    element.on(type, listener, options)
  }
  return this
}

// 节点列表 - 启用元素
NodeList.prototype.enable = function () {
  for (const element of this) {
    element.enable()
  }
}

// 节点列表 - 禁用元素
NodeList.prototype.disable = function () {
  for (const element of this) {
    element.disable()
  }
}

// 重写鼠标双击事件触发方式
let last = null
const pointerdown = function (event) {
  if (!event.cmdOrCtrlKey &&
    !event.altKey &&
    !event.shiftKey &&
    !event.doubleclickProcessed) {
    event.doubleclickProcessed = true
    switch (event.button) {
      case 0:
        if (last !== null &&
          event.target === last.target &&
          event.timeStamp - last.timeStamp < 500 &&
          Math.abs(event.clientX - last.clientX) < 4 &&
          Math.abs(event.clientY - last.clientY) < 4 &&
          this.isInContent(event)) {
          if (!event.target.dispatchEvent(
            new PointerEvent('doubleclick', event))) {
            event.preventDefault()
          }
          last = null
        } else {
          last = event
        }
        break
      default:
        last = null
        break
    }
  }
}

// 禁用撤销和重做
window.on('keydown', function (event) {
  if (event.cmdOrCtrlKey) {
    switch (event.code) {
      case 'KeyZ':
      case 'KeyY':
        event.preventDefault()
        break
      case 'KeyA':
        // 当存在css(user-select: text)元素时
        // 全选将选中该元素和文本框在内的所有文本块
        if (document.activeElement instanceof HTMLInputElement ||
          document.activeElement instanceof HTMLTextAreaElement) {
          break
        } else {
          event.preventDefault()
        }
        break
    }
  }
  // 监听空格键的按下状态
  switch (event.code) {
    case 'Space':
      Event.prototype.spaceKey = true
      break
  }
}, {capture: true})

window.on('keyup', function (event) {
  // 监听空格键的弹起状态
  switch (event.code) {
    case 'Space':
      Event.prototype.spaceKey = false
      break
  }
}, {capture: true})

// 侦听像素比率改变事件
window.on('resize', function IIFE() {
  let dpr = window.devicePixelRatio
  return event => {
    if (dpr !== window.devicePixelRatio) {
      dpr = window.devicePixelRatio
      window.dispatchEvent(new Event('dprchange'))
    }
  }
}()) 