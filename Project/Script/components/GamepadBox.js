class GamepadBox extends HTMLElement {
  // 属性声明
  input     //:element
  dataValue //:array

  // 构造函数
  constructor() {
    super()

    // 创建输入框
    const input = document.createElement('input')
    input.addClass('gamepad-box-input')
    input.type = 'text'
    input.on('keydown', this.inputKeydown)
    input.on('focus', this.inputFocus)
    input.on('blur', this.inputBlur)
    this.appendChild(input)

    // 设置属性
    this.input = input
    this.dataValue = null
  }

  // 读取数据
  read() {
    return this.dataValue
  }

  // 写入数据
  write(button) {
    this.dataValue = button
    this.input.value = GamepadBox.getButtonName(button)
  }

  // 启用元素
  enable() {
    if (this.removeClass('disabled')) {
      this.showChildNodes()
    }
  }

  // 禁用元素
  disable() {
    if (this.addClass('disabled')) {
      this.hideChildNodes()
    }
  }

  // 获得焦点
  getFocus(mode) {
    return this.input.getFocus(mode)
  }

  // 输入框 - 键盘按下事件
  inputKeydown(event) {
    switch (event.code) {
      case 'Tab':
        break
      case 'Backspace':
        event.preventDefault()
        this.parentNode.write(-1)
        this.parentNode.dispatchChangeEvent()
        break
      default:
        event.preventDefault()
        break
    }
  }

  // 输入框 - 获得焦点事件
  inputFocus(event) {
    let lastPad = null

    // 输入键值
    const inputKeyCode = () => {
      const pads = navigator.getGamepads()
      const pad = pads[0] ||
                  pads[1] ||
                  pads[2] ||
                  pads[3] ||
                  null
      if (pad !== null) {
        if (lastPad === null) {
          lastPad = Object.clone(pad)
          for (const button of lastPad.buttons) {
            button.pressed = false
            button.value = 0
          }
        }
        if (lastPad.id === pad.id) {
          const lastButtons = lastPad.buttons
          const buttons = pad.buttons
          const length = buttons.length
          for (let code = 0; code < length; code++) {
            if (buttons[code].pressed && !lastButtons[code].pressed) {
              this.parentNode.write(code)
              this.parentNode.dispatchChangeEvent()
              break
            }
          }
        }
        lastPad = Object.clone(pad)
      }
    }

    GamepadBox.intervalIndex = setInterval(inputKeyCode)
  }

  // 输入框 - 失去焦点事件
  inputBlur(event) {
    clearInterval(GamepadBox.intervalIndex)
    GamepadBox.intervalIndex = null
  }

  // 获取按键名称
  static getButtonName = function IIFE() {
    // 键值 -> 键名
    const codeToName = {
      0: 'A',             1: 'B',             2: 'X',             3: 'Y',
      4: 'LB',            5: 'RB',            6: 'LT',            7: 'RT',
      8: 'View',          9: 'Menu',          10: 'LS',           11: 'RS',
      12: 'Up',           13: 'Down',         14: 'Left',         15: 'Right',
    }

    // 返回函数
    return function (code) {
      return code === -1 ? '' : codeToName[code] ?? `Button_${code}`
    }
  }()
}

customElements.define('gamepad-box', GamepadBox)

// ******************************** 颜色框 ********************************
