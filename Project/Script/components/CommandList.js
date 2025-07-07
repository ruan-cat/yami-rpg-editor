class CommandList extends HTMLElement {
  data              //:array
  elements          //:array
  selections        //:array
  start             //:number
  end               //:number
  origin            //:number
  active            //:number
  anchor            //:number
  inserting         //:boolean
  focusing          //:boolean
  dragging          //:event
  windowPointerup   //:function
  windowPointermove //:function

  constructor() {
    super()

    // 设置属性
    this.tabIndex = 0
    this.data = null
    this.varList = null
    this.varMap = null
    this.elements = []
    this.elements.versionId = 0
    this.elements.count = 0
    this.elements.start = -1
    this.elements.end = -1
    this.elements.head = null
    this.elements.foot = null
    this.selections = []
    this.selections.count = 0
    this.start = null
    this.end = null
    this.origin = null
    this.active = null
    this.anchor = null
    this.inserting = false
    this.focusing = false
    this.dragging = null
    this.windowPointerup = CommandList.windowPointerup.bind(this)
    this.windowPointermove = CommandList.windowPointermove.bind(this)
    this.windowVariableChange = CommandList.windowVariableChange.bind(this)

    // 侦听事件
    this.on('scroll', this.resize)
    this.on('focus', this.listFocus)
    this.on('blur', this.listBlur)
    this.on('keydown', this.keydown)
    this.on('pointerdown', this.pointerdown)
    this.on('pointerup', this.pointerup)
    this.on('doubleclick', this.doubleclick)
    window.on('variablechange', this.windowVariableChange)
  }

  // 读取操作历史
  get history() {
    return this.data.history
  }

  // 读取上边距
  get paddingTop() {
    let pt = this._paddingTop
    if (pt === undefined) {
      pt = this._paddingTop =
      parseInt(this.css().paddingTop)
    }
    return pt
  }

  // 读取数据
  read() {
    return this.data
  }

  // 写入数据
  write(data) {
    this.data = data
    this.textContent = ''
    this.update()
    if (!data.history) {
      Object.defineProperty(data, 'history', {
        configurable: true,
        value: new CommandHistory(this),
      })
    }
    Promise.resolve().then(() => {
      this.scrollTop = 0
    })
  }

  // 更新列表
  update() {
    // 分析变量数据
    this.analyzeVariables()

    const {elements} = this
    elements.start = -1
    elements.count = 0

    // 创建列表项
    this.createItems(this.data, 0)

    // 写入索引
    const {count} = elements
    for (let i = 0; i < count; i++) {
      elements[i].dataValue = i
    }

    // 清除多余的元素
    this.clearElements(elements.count)

    // 发送更新事件
    this.dispatchUpdateEvent()

    // 重新调整
    this.resize()
  }

  // 重新调整
  resize() {
    CommonList.resize(this)

    // 检查变量有效性
    this.checkVariables()
  }

  // 更新头部和尾部元素
  updateHeadAndFoot() {
    return CommonList.updateHeadAndFoot(this)
  }

  // 在重新调整时更新
  updateOnResize(element) {
    if (element.contents !== null) {
      this.updateCommandElement(element)
    }
  }

  // 创建折叠的指令缓存
  createFoldedCommandBuffer(buffer, indent, parent) {
    for (const commands of buffer) {
      if (commands instanceof Array) {
        const length = commands.length
        for (let i = 0; i < length; i++) {
          this.createFoldedCommandBuffer(
            this.createCommandBuffer(commands, i, indent, parent),
            indent + 1,
            commands[i],
          )
        }
      }
    }
  }

  // 创建项目
  createItems(commands, indent, parent = null) {
    const elements = this.elements
    const length = commands.length
    for (let i = 0; i < length; i++) {
      const buffer = this.createCommandBuffer(commands, i, indent, parent)
      if (buffer[0].dataItem?.folded) {
        elements[elements.count++] = buffer[0]
        this.createFoldedCommandBuffer(buffer, indent + 1, commands[i])
        continue
      }
      for (const target of buffer) {
        if (target instanceof HTMLElement) {
          elements[elements.count++] = target
          continue
        }
        if (target instanceof Array) {
          this.createItems(target, indent + 1, commands[i])
          continue
        }
      }
    }

    // 创建空项目
    elements[elements.count++] = this.createBlankElement(commands, length, indent, parent)
  }

  // 创建指令缓冲区
  createCommandBuffer(commands, index, indent, parent) {
    const command = commands[index]
    let buffer = command.buffer
    if (buffer === undefined) {
      buffer = []
      buffer.enabled = true
      Object.defineProperty(
        command, 'buffer', {
          configurable: true,
          value: buffer,
        }
      )

      // 创建列表项
      let li
      let textId = ''
      let tooltip = ''
      let className = ''
      let color = ''
      let mainColor = 'normal'
      li = document.createElement('command-item')
      li.contents = []
      li.dataKey = true
      li.dataParent = parent
      li.dataList = commands
      li.dataItem = command
      li.dataIndex = index
      li.dataIndent = indent
      buffer.push(li)

      // 创建内容
      const contents = Command.parse(command, this.varMap)
      const length = contents.length
      for (let i = 0; i < length; i++) {
        const content = contents[i]

        // 保存内容
        if (content.text !== undefined) {
          content.color = color
          content.textId = textId
          content.tooltip = tooltip
          content.class = className
          li.contents.push(content)
          // 重置文本ID和工具提示
          if (textId) textId = ''
          if (tooltip) tooltip = ''
          if (className) className = ''
        }

        // 改变颜色
        if (content.color !== undefined) {
          switch (content.color) {
            // 恢复颜色
            case 'restore':
              color = mainColor
              continue
            // 保存颜色
            case 'save':
              mainColor = color
              continue
            default:
              color = content.color
              continue
          }
        }

        // 设置文本ID
        if (content.textId !== undefined) {
          textId = content.textId
        }

        // 设置工具提示
        if (content.tooltip !== undefined) {
          tooltip = content.tooltip
        }

        // 设置自定义类名
        if (content.class !== undefined) {
          className = content.class
        }

        // 换行
        if (content.break !== undefined) {
          li = document.createElement('command-item')
          li.contents = []
          li.dataKey = false
          li.dataList = commands
          li.dataItem = command
          li.dataIndex = index
          li.dataIndent = indent
          buffer.push(li)
          continue
        }

        // 折叠
        if (content.fold !== undefined) {
          li.fold = document.createElement('command-fold')
          li.appendChild(li.fold)
        }

        // 创建子项目
        if (content.children !== undefined) {
          buffer.push(content.children)

          if (i < length) {
            li = document.createElement('command-item')
            li.contents = []
            li.dataKey = false
            li.dataList = commands
            li.dataItem = command
            li.dataIndex = index
            li.dataIndent = indent
            buffer.push(li)
            continue
          }
        }

        // 创建脚本项目
        if (content.script !== undefined) {
          const MAX_LINES = 20
          let code = content.script
          const matches = code.match(/\n/g)
          const lines = (matches?.length ?? 0) + 1
          if (lines > MAX_LINES) {
            let count = 0
            const chars = code
            const length = chars.length
            for (let i = 0; i < length; i++) {
              if (chars[i] === '\n' && ++count === MAX_LINES) {
                code = chars.slice(0, i)
                break
              }
            }
          }
          const length = Math.min(lines, MAX_LINES + 1)
          const items = new Array(length)
          items[0] = li
          for (let i = 1; i < length; i++) {
            li = document.createElement('command-item')
            li.contents = []
            li.dataKey = false
            li.dataList = commands
            li.dataItem = command
            li.dataIndex = index
            li.dataIndent = indent
            buffer.push(li)
            items[i] = li
          }
          if (lines > MAX_LINES) {
            const text = document.createElement('text')
            text.textContent = `... ${lines} lines`
            text.addClass('gray')
            li.appendChild(text)
          }
          Command.cases.script.colorizeCodeLines(items, code)
        }
      }
    }

    // 设置数据索引
    if (buffer[0].dataIndex !== index) {
      for (const target of buffer) {
        if (target instanceof HTMLElement) {
          target.dataIndex = index
        }
      }
    }

    // 更新开关状态
    const enabled = command.id[0] !== '!'
    if (buffer.enabled !== enabled) {
      buffer.enabled = enabled
      if (enabled) {
        for (const target of buffer) {
          if (target instanceof HTMLElement) {
            target.removeClass('disabled')
          }
        }
      } else {
        for (const target of buffer) {
          if (target instanceof HTMLElement) {
            target.addClass('disabled')
          }
        }
      }
    }

    return buffer
  }

  // 更新指令元素
  updateCommandElement(element) {
    // 设置文本缩进
    element.style.textIndent = this.computeTextIndent(element.dataIndent)

    // 创建标记
    if (element.dataKey) {
      const mark = document.createElement('command-mark-major')
      mark.textContent = '>'
      element.insertBefore(mark, element.firstElementChild)
    } else {
      const mark = document.createElement('command-mark-minor')
      mark.textContent = ':'
      element.insertBefore(mark, element.firstElementChild)
    }

    // 创建内容元素
    for (const content of element.contents) {
      // 创建文本
      if (content.text !== undefined) {
        const text = document.createElement('command-text')
        text.textContent = content.text
        text.addClass(content.color)
        // 如果存在文本ID，添加类名并侦听相关事件
        if (content.textId) {
          let id = content.textId
          const i = id.indexOf('-')
          const j = id.indexOf('-', i + 1)
          text.varSpace = id.slice(0, i)
          text.varType = id.slice(i + 1, j)
          text.varKey = id.slice(j + 1)
          // 如果是本地变量，添加一个特殊类名用于检查有效性
          switch (text.varSpace) {
            case 'local':
              text.currentType = text.varType
              text.addClass('local-variable-identifier')
              break
            case 'global':
              text.addClass('global-variable-identifier')
              break
            case 'attribute':
            case 'enum': {
              const string = text.varKey
              const i = string.lastIndexOf('-')
              text.varKey = string.slice(0, i)
              text.varId = string.slice(i + 1)
              text.addClass(`${text.varSpace}-identifier`)
              id = id.slice(0, id.lastIndexOf('-'))
              break
            }
            case 'file':
              text.addClass('file-identifier')
              break
            case 'scene':
              text.addClass('scene-identifier')
              break
            case 'ui':
              text.addClass('ui-identifier')
              break
          }
          // 使用name代替class可包含空格问号等特殊字符
          text.name = id
          text.addClass(text.varType + '-type')
          text.addClass('command-text-identifier')
          text.onpointerenter = CommandList.textPointerenter
          text.onpointerleave = CommandList.textPointerleave
        }
        // 如果存在工具提示
        if (content.tooltip) {
          text.setTooltip(content.tooltip)
          text.addClass('plugin-link')
        }
        // 如果存在自定义类名
        if (content.class) {
          if (content.class.indexOf('parent:') === 0) {
            element.addClass(content.class.replace('parent:', ''))
          } else {
            text.addClass(content.class)
          }
        }
        element.appendChild(text)
        continue
      }
    }
    element.contents = null

    // 更新折叠状态
    this.updateCommandElementFold(element)
  }

  // 更新指令元素折叠状态
  updateCommandElementFold(element) {
    if (element?.fold) {
      const command = element.dataItem
      const folded = !!command.folded
      if (element.folded !== folded) {
        element.folded = folded
        if (folded) {
          element.fold.textContent = '+'
          // 在头部列表项中添加省略号
          if (!element.ellipsis) {
            element.ellipsis = document.createElement('command-text')
            element.ellipsis.textContent = ' ......'
            element.appendChild(element.ellipsis)
          }
        } else {
          element.fold.textContent = '-'
          // 在头部列表项中移除省略号
          if (element.ellipsis) {
            element.ellipsis.remove()
            element.ellipsis = null
          }
        }
      }
    }
  }

  // 删除指令缓冲区
  deleteCommandBuffers(commands) {
    for (const command of commands) {
      const {buffer} = command
      if (!buffer) continue
      for (const item of buffer) {
        if (item instanceof Array) {
          this.deleteCommandBuffers(item)
        }
      }
      delete command.buffer
    }
  }

  // 创建空项目
  createBlankElement(commands, index, indent, parent) {
    let blank = commands.blank
    if (blank === undefined) {
      // 创建列表项
      blank = document.createElement('command-item')

      // 设置元素属性
      blank.contents = Array.empty
      blank.enabled = true
      blank.dataKey = true
      blank.dataParent = parent
      blank.dataList = commands
      blank.dataItem = null
      blank.dataIndex = index
      blank.dataIndent = indent
      Object.defineProperty(
        commands, 'blank', {
          value: blank,
        }
      )
    }

    // 更新数据索引
    if (blank.dataIndex !== index) {
      blank.dataIndex = index
    }

    // 更新开关状态
    if (parent) {
      const {enabled} = parent.buffer
      if (blank.enabled !== enabled) {
        blank.enabled = enabled
        if (enabled) {
          blank.removeClass('disabled')
        } else {
          blank.addClass('disabled')
        }
      }
    }

    return blank
  }

  // 计算文本缩进
  computeTextIndent(indent) {
    switch (Local.language) {
      case 'en-US':
        return indent * 4 + 'ch'
      default:
        return indent * 2 + 'em'
    }
  }

  // 选择项目
  select(start, end = start) {
    if (start > end) {
      [start, end] = [end, start]
    }

    // 限制范围
    const elements = this.elements
    const count = elements.count
    start = Math.clamp(start, 0, count - 1)
    end = Math.clamp(end, 0, count - 1)
    let indent = Infinity
    for (let i = start; i <= end; i++) {
      const {dataIndent} = elements[i]
      if (dataIndent < indent) {
        indent = dataIndent
      }
    }
    for (let i = start; i >= 0; i--) {
      const element = elements[i]
      if (element.dataIndent === indent &&
        element.dataKey === true) {
        start = i
        break
      }
    }
    for (let i = end + 1; i < count; i++) {
      const element = elements[i]
      if (element.dataIndent < indent ||
        element.dataIndent === indent &&
        element.dataKey === true) {
        end = i - 1
        break
      }
    }
    if (start !== end) {
      const element = elements[end]
      if (!element.dataItem) {
        end--
      }
    }

    // 取消选择
    this.unselect()

    // 更新属性
    this.start = start
    this.end = end
    this.origin = start
    this.active = start
    this.anchor = null

    // 选择目标
    this.reselect()
  }

  // 选择多个项目
  selectMultiple(active) {
    const origin = this.origin
    this.select(origin, active)
    this.origin = origin
    this.active = Math.clamp(
      active,
      this.start,
      this.end,
    )
  }

  // 选择全部项目
  selectAll() {
    this.select(0, Infinity)
    this.active = this.getRangeByIndex(this.end)[0]
  }

  // 取消选择
  unselect() {
    if (this.start !== null) {
      const {selections} = this
      const {count} = selections
      for (let i = 0; i < count; i++) {
        selections[i].removeClass('selected')
        selections[i] = undefined
      }
      selections.count = 0
      if (count > 256) {
        selections.length = 0
      }
    }
  }

  // 重新选择
  reselect() {
    if (this.focusing &&
      this.start !== null) {
      const {selections} = this
      const elements = this.elements
      const start = this.start
      const end = this.end
      let count = 0
      for (let i = start; i <= end; i++) {
        const element = elements[i]
        selections[count++] = element
        element.addClass('selected')
      }
      selections.count = count
    }
  }

  // 向上选择项目
  selectUp() {
    if (this.start !== null) {
      const elements = this.elements
      const sData = elements[this.start].dataItem
      const eData = elements[this.end].dataItem
      let i = this.start
      if (sData === eData) {
        while (--i >= 0) {
          if (elements[i].dataKey) {
            break
          }
        }
      }
      this.select(i)
      this.scrollToSelection()
    }
  }

  // 向下选择
  selectDown() {
    if (this.start !== null) {
      const elements = this.elements
      const sData = elements[this.start].dataItem
      const eData = elements[this.end].dataItem
      let i = this.end
      if (sData === eData) {
        const eElement = elements[i]
        if (!eElement.dataKey) {
          const data = eElement.dataItem
          while (--i >= 0) {
            const element = elements[i]
            if (element.dataItem === data &&
              element.dataKey === true) {
              break
            }
          }
        }
        const {count} = elements
        while (++i < count) {
          if (elements[i].dataKey) {
            break
          }
        }
      }
      this.select(i)
      this.scrollToSelection()
    }
  }

  // 向上翻页
  pageUp(select) {
    let anchor = this.anchor
    if (anchor === null) {
      anchor = this.active
    }
    if (anchor !== null) {
      const scrollLines = Math.floor(this.innerHeight / 20) - 1
      const scrollTop = Math.max(this.scrollTop - scrollLines * 20, 0)
      if (select) {
        const bottom = this.scrollTop + this.innerHeight
        const bottomIndex = Math.floor(bottom / 20) - 1
        const targetIndex = Math.min(anchor, bottomIndex) - scrollLines
        this.select(targetIndex)
        this.anchor = Math.max(targetIndex, this.start)
      }
      this.scroll(0, scrollTop)
    }
  }

  // 向下翻页
  pageDown(select) {
    let anchor = this.anchor
    if (anchor === null) {
      anchor = this.active
    }
    if (anchor !== null) {
      const top = this.scrollTop
      const scrollLines = Math.floor(this.innerHeight / 20) - 1
      let scrollTop = top + scrollLines * 20
      if (select) {
        const topIndex = Math.floor(top / 20)
        const targetIndex = Math.max(anchor, topIndex) + scrollLines
        const scrollBottom = this.elements.count * 20
        const scrollTopMax = scrollBottom - this.innerHeight
        this.select(targetIndex)
        this.anchor = Math.min(targetIndex, this.end)
        scrollTop = Math.min(scrollTop, scrollTopMax)
      }
      this.scroll(0, Math.max(top, scrollTop))
    }
  }

  // 选择指定位置的多个项目
  selectMultipleTo(index) {
    if (this.start !== null) {
      this.selectMultiple(index)
      const elements = this.elements
      const sElement = elements[this.start]
      const aElement = elements[this.active]
      const sIndent = sElement.dataIndent
      const aIndent = aElement.dataIndent
      let n = this.active
      if (sIndent < aIndent) {
        for (let i = n - 1; i >= 0; i--) {
          const element = elements[i]
          if (element.dataIndent === sIndent &&
            element.dataKey === true) {
            n = i
            break
          }
        }

      }
      const range = this.getRangeByIndex(n)
      if (this.origin < this.active &&
        this.origin > range[0] &&
        this.origin < range[1]) {
        this.active = range[1]
      } else {
        this.active = range[0]
      }
    }
  }

  // 向上选择多个项目
  selectMultipleUp() {
    if (this.start !== null) {
      const elements = this.elements
      if (this.active <= this.origin) {
        const sElement = elements[this.start]
        const indent = sElement.dataIndent
        let i = this.start
        while (--i >= 0) {
          const element = elements[i]
          if (element.dataIndent <= indent &&
            element.dataKey === true) {
            this.selectMultiple(i)
            break
          }
        }
      } else {
        const eElement = elements[this.end]
        const data = eElement.dataItem
        const end = this.end
        let indent = Infinity
        let n = this.origin
        for (let i = n; i < end; i++) {
          const element = elements[i]
          if (element.dataIndent < indent) {
            indent = element.dataIndent
          }
          if (element.dataIndent === indent &&
            element.dataItem !== data &&
            element.dataItem !== null) {
            n = i
          }
        }
        const range = this.getRangeByIndex(n)
        if (this.origin < n &&
          this.origin > range[0] &&
          this.origin < range[1]) {
          n = range[1]
        } else {
          n = range[0]
        }
        this.selectMultiple(n)
      }
      this.scrollToSelection()
    }
  }

  // 向下选择多个项目
  selectMultipleDown() {
    if (this.start !== null) {
      const elements = this.elements
      if (this.active >= this.origin) {
        const eElement = elements[this.end]
        const indent = eElement.dataIndent
        const count = elements.count
        let i = this.end
        while (++i < count) {
          const element = elements[i]
          if (element.dataIndent < indent) {
            i = this.getRangeByIndex(i)[1]
            break
          }
          if (element.dataIndent === indent &&
            element.dataKey === true &&
            element.dataItem !== null) {
            break
          }
        }
        this.selectMultiple(i)
      } else {
        const start = this.start
        let indent = Infinity
        let n = this.origin
        for (let i = n; i > start; i--) {
          const element = elements[i]
          if (element.dataIndent < indent) {
            indent = element.dataIndent
          }
          if (element.dataIndent === indent &&
            element.dataKey === true) {
            n = i
          }
        }
        this.selectMultiple(n)
      }
      this.scrollToSelection()
    }
  }

  // 滚动到选中项
  scrollToSelection(mode = 'active') {
    if (this.start !== null) {
      let scrollTop
      switch (mode) {
        case 'active': {
          const range = this.getRangeByIndex(this.active)
          const top = this.scrollTop
          const max = range[0] * 20
          const min = range[1] * 20 + 20 - this.innerHeight
          scrollTop = (
            this.active <= this.origin
          ? Math.min(Math.max(top, min), max)
          : Math.max(Math.min(top, max), min)
          )
          break
        }
        case 'alter': {
          const top = this.scrollTop
          const max = this.active * 20
          const min = this.active * 20 + 20 - this.innerHeight
          scrollTop = Math.max(Math.min(top, max), min)
          break
        }
        case 'restore': {
          const top = this.scrollTop
          const max = this.start * 20
          const min = this.end * 20 + 20 - this.innerHeight
          scrollTop = Math.min(Math.max(top, min), max)
          break
        }
        default:
          return
      }
      if (this.scrollTop !== scrollTop) {
        this.scrollTop = scrollTop
      }
    }
  }

  // 滚动并重新调整
  scrollAndResize() {
    const scrolltop = this.scrollTop
    this.scrollToSelection('active')
    if (this.scrollTop !== scrolltop) {
      this.resize()
    }
  }

  // 获取指定索引的项目范围
  getRangeByIndex(index) {
    const elements = this.elements
    const count = elements.count
    const element = elements[index]
    const data = element.dataItem
    const indent = element.dataIndent
    let start = index
    let end = index
    for (let i = index; i >= 0; i--) {
      const element = elements[i]
      if (element.dataItem === data &&
        element.dataKey === true) {
        start = i
        break
      }
    }
    for (let i = index + 1; i < count; i++) {
      const element = elements[i]
      if (element.dataIndent < indent ||
        element.dataIndent === indent &&
        element.dataKey === true) {
        end = i - 1
        break
      }
    }
    return [start, end]
  }

  // 获取指定数据的项目范围
  getRangeByData(data) {
    const elements = this.elements
    const count = elements.count
    let indent
    let start = 0
    let end = 0
    for (let i = 0; i < count; i++) {
      const element = elements[i]
      if (element.dataItem === data) {
        indent = element.dataIndent
        start = i
        break
      }
    }
    for (let i = start + 1; i < count; i++) {
      const element = elements[i]
      if (element.dataIndent < indent ||
        element.dataIndent === indent &&
        element.dataKey === true) {
        end = i - 1
        break
      }
    }
    return [start, end]
  }

  // 判断列表项父对象是否启用
  isParentEnabled(element) {
    return element.dataParent?.buffer?.enabled ?? true
  }

  // 插入指令
  insert(id = '') {
    if (this.start !== null) {
      const elements = this.elements
      const element = elements[this.start]
      if (!this.isParentEnabled(element)) {
        return
      }
      this.inserting = true
      Command.insert(this, id)
    }
  }

  // 编辑指令
  edit() {
    if (this.start !== null) {
      const elements = this.elements
      const element = elements[this.start]
      if (!this.isParentEnabled(element)) {
        return
      }
      this.inserting = element.dataItem === null
      switch (this.inserting) {
        case true:
          Command.insert(this, '')
          break
        case false: {
          const command = element.dataItem
          if (command.buffer.enabled) {
            Command.edit(this, command)
          }
          break
        }
      }
    }
  }

  // 折叠指令
  fold(element) {
    if (element === undefined && this.start !== null) {
      const elements = this.elements
      const startItem = elements[this.start].dataItem
      const endItem = elements[this.end].dataItem
      if (startItem === endItem) {
        element = elements[this.start]
      }
    }
    if (element && element.fold) {
      const command = element.dataItem
      if (element.dataKey && command) {
        if (command.folded) {
          delete command.folded
        } else {
          command.folded = true
        }
        this.update()
        this.updateCommandElementFold(element)
        this.reselectAfterFolding()
        this.dispatchChangeEvent()
      }
    }
  }

  // 展开指令
  unfoldCommand(command) {
    let changed = false
    const commands = []
    // 似乎粘贴撤销后，可能因为dataParent重复而陷入死循环，因此检查command的重复性
    while (command && !commands.includes(command)) {
      commands.push(command)
      const element = command.buffer?.[0]
      if (command.folded) {
        delete command.folded
        this.updateCommandElementFold(element)
        changed = true
      }
      if (element) {
        command = element.dataParent
      }
    }
    if (changed) {
      this.update()
    }
  }

  // 折叠后重新选择列表项
  reselectAfterFolding() {
    let head
    let foot
    const {selections} = this
    const {count} = selections
    for (let i = 0; i < count; i++) {
      const element = selections[i]
      if (element.parentNode) {
        if (head === undefined) {
          head = element
        }
        foot = element
      }
    }
    if (head) {
      const start = this.elements.indexOf(head)
      const end = this.elements.indexOf(foot)
      this.select(start, end)
    } else {
      this.unselect()
      this.start = null
      this.end = null
    }
  }

  // 开关指令
  toggle() {
    if (this.start !== null) {
      const {elements, start, end} = this
      const element = elements[start]
      if (!this.isParentEnabled(element)) {
        return
      }
      let method = 'disable'
      const commands = []
      const append = element => {
        if (element.dataKey && element.dataItem) {
          const command = element.dataItem
          // 直接使用指令ID判断，避免使用折叠后未刷新的状态
          const enabled = command.id[0] !== '!'
          switch (method) {
            case 'disable':
              if (!enabled) {
                method = 'enable'
                commands.length = 0
              }
              commands.append(command)
              break
            case 'enable':
              if (!enabled) {
                commands.append(command)
              }
              break
          }
          if (command.folded) {
            for (const object of command.buffer) {
              if (!Array.isArray(object)) continue
              for (const child of object) {
                if (!child.buffer) continue
                for (const element of child.buffer) {
                  if (element instanceof HTMLElement) {
                    append(element)
                  }
                }
              }
            }
          }
        }
      }
      for (let i = start; i <= end; i++) {
        append(elements[i])
      }
      if (commands.length !== 0) {
        this.history.save({
          type: 'toggle',
          parent: element.dataParent,
          method: method,
          commands: commands,
        })
        switch (method) {
          case 'enable':
            this.enableItems(commands)
            break
          case 'disable':
            this.disableItems(commands)
            break
        }
        this.update()
        this.dispatchChangeEvent()
      }
    }
  }

  // 启用项目
  enableItems(commands) {
    for (const command of commands) {
      if (command.id[0] === '!') {
        command.id = command.id.slice(1)
      }
    }
  }

  // 禁用项目
  disableItems(commands) {
    for (const command of commands) {
      if (command.id[0] !== '!') {
        command.id = '!' + command.id
      }
    }
  }

  // 复制项目
  copy() {
    if (this.start !== null) {
      const elements = this.elements
      const sElement = elements[this.start]
      const eElement = elements[this.end]
      const list = sElement.dataList
      const start = sElement.dataIndex
      const end = eElement.dataIndex + 1
      const copies = list.slice(start, end)
      if (copies.length > 0) {
        Clipboard.write('yami.commands', copies)
      }
    }
  }

  // 复制为文本
  copyAsText() {
    if (this.start !== null) {
      let string = ''
      let lastIndent
      const {start, end, elements} = this
      for (let i = start; i <= end; i++) {
        const element = elements[i]
        if (element.contents !== null) {
          this.updateCommandElement(element)
        }
        let indent = element.dataIndent
        // 如果当前缩进已经打印过至少一条指令，跳过无效指令
        if (element.dataItem === null && lastIndent === indent) {
          continue
        }
        lastIndent = indent
        while (indent-- > 0) string += '　　'
        for (const node of element.children) {
          if (node.tagName === 'COMMAND-FOLD') {
            continue
          }
          if (node.hasClass('transparent')) {
            // 添加空白指令字符
            string += ''.padStart(
              node.textContent.length,
              Local.get('command.blankCommandChar'),
            )
          } else if (node.hasClass('comment')) {
            // 添加注释指令前缀
            string = string.slice(0, -1) + '#' + node.textContent
          } else {
            string += node.textContent
          }
        }
        string += '\n'
      }
      navigator.clipboard.writeText(string.trim())
    }
  }

  // 粘贴项目
  paste() {
    if (this.start !== null) {
      const elements = this.elements
      const element = elements[this.start]
      if (!this.isParentEnabled(element)) {
        return
      }
      const copies = Clipboard.read('yami.commands')
      if (copies) {
        const parent = element.dataParent
        const list = element.dataList
        const start = element.dataIndex
        const count = elements.count
        this.history.save({
          type: 'insert',
          parent: parent,
          array: list,
          index: start,
          commands: copies,
        })
        list.splice(start, 0, ...copies)
        this.update()
        this.select(this.start + elements.count - count)
        this.scrollToSelection('alter')
        this.dispatchChangeEvent()
      }
    }
  }

  // 删除项目
  delete() {
    if (this.start !== null) {
      const elements = this.elements
      const sElement = elements[this.start]
      const eElement = elements[this.end]
      const parent = sElement.dataParent
      const list = sElement.dataList
      const start = sElement.dataIndex
      const end = eElement.dataIndex + 1
      const commands = list.slice(start, end)
      if (commands.length > 0) {
        this.history.save({
          type: 'delete',
          parent: parent,
          array: list,
          index: start,
          commands: commands,
        })
        list.splice(start, end - start)
        this.update()
        this.select(this.start)
        this.scrollToSelection('alter')
        this.dispatchChangeEvent()
      }
    }
  }

  // 撤销操作
  undo() {
    if (!this.dragging &&
      this.history.canUndo()) {
      this.history.restore('undo')
    }
  }

  // 重做操作
  redo() {
    if (!this.dragging &&
      this.history.canRedo()) {
      this.history.restore('redo')
    }
  }

  // 保存指令
  save(command) {
    if (this.start !== null) {
      const elements = this.elements
      const element = elements[this.start]
      const parent = element.dataParent
      const list = element.dataList
      const index = element.dataIndex
      switch (this.inserting) {
        case true:
          this.history.save({
            type: 'insert',
            parent: parent,
            array: list,
            index: index,
            commands: [command],
          })
          this.end = this.start
          list.splice(index, 0, command)
          this.update()
          this.selectDown()
          break
        case false:
          // 将新旧指令打包到一个数组中
          // 便于切换语言删除缓存时使用
          this.history.save({
            type: 'replace',
            parent: parent,
            array: list,
            index: index,
            commands: [list[index], command],
          })
          list[index] = command
          this.update()
          this.select(this.start)
          break
      }
      this.scrollToSelection('alter')
      this.dispatchChangeEvent()
    }
  }

  // 获取选中项的位置
  getSelectionPosition() {
    if (this.start === null) {
      return null
    }
    const elements = this.elements
    const element = elements[this.start]
    if (!element.parentNode) {
      return null
    }
    let x = element.childNodes[0].rect().left
    let y = element.rect().top
    // 应用窗口带边框需要减去1px的margin
    if (document.body.hasClass('border')) {
      const dpx = 1 / window.devicePixelRatio
      x -= dpx
      y -= dpx
    }
    return {x, y}
  }

  // 清除元素
  clearElements(start) {
    return CommonList.clearElements(this, start)
  }

  // 清除列表
  clear() {
    this.unselect()
    this.textContent = ''
    this.data = null
    this.varList = null
    this.varMap = null
    this.start = null
    this.end = null
    this.origin = null
    this.active = null
    this.anchor = null
    this.clearElements(0)
    this.elements.count = 0
    this.elements.start = -1
    this.elements.end = -1
    this.updateHeadAndFoot()
    return this
  }

  // 分析变量数据
  analyzeVariables() {
    // 检查左值变量
    function checkLeftValue(variable) {
      const {name, type} = variable
      if (flags[name]) {
        // 如果已经存在同名变量
        let varItem = varMap[name + type]
        if (varItem === undefined) {
          if (type !== 'any') {
            varItem = varMap[name + 'any']
            // 修改any类型的变量为具体类型
            if (varItem) varItem.type = type
          } else {
            varItem =
            varMap[name + 'boolean'] ??
            varMap[name + 'number'] ??
            varMap[name + 'string'] ??
            varMap[name + 'object']
          }
        }
        // 增加变量的引用计数
        if (varItem) varItem.refCount++
      } else {
        // 首次添加该左值变量
        flags[name] = true
        varMap[name + type] = variable
        varList.push(variable)
      }
    }

    // 检查操作数变量
    function checkOperator(variable) {
      const {name, type} = variable
      if (flags[name]) {
        // 如果已经存在同名变量
        const varItem = type !== 'any'
        ? varMap[name + type] ??
          varMap[name + 'any']
        : varMap[name + type] ??
          varMap[name + 'boolean'] ??
          varMap[name + 'number'] ??
          varMap[name + 'string'] ??
          varMap[name + 'object']
        // 增加变量的引用计数
        if (varItem) varItem.refCount++
      } else {
        // 如果不存在变量，添加并提示用户
        flags[name] = true
        varMap[name + type] = variable
        varList.push(variable)
        variable.class = 'error'
        variable.refCount++
      }
    }

    // 初始化相关变量
    const varMap = {}
    const varList = []
    const leftValues = []
    const operators = []
    const flags = {'': true}

    // 获取指令列表中的所有变量
    for (const variable of Command.fetchVariables(this.read())) {
      (variable.isLeftValue ? leftValues : operators).push(variable)
    }

    // 检查左值列表中的变量
    for (const variable of leftValues) {
      checkLeftValue(variable)
    }

    // 检查操作数列表中的变量
    for (const variable of operators) {
      checkOperator(variable)
    }

    // 设置变量的图标类名
    for (const variable of varList) {
      variable.icon = `icon-${variable.type}`
    }

    // 按类型和名称排序列表项，并返回
    const orders = {
      boolean: 0,
      number: 1,
      string: 2,
      object: 3,
      any: 4,
    }
    varList.sort((a, b) => {
      if (a.evIndex !== b.evIndex) {
        return a.evIndex - b.evIndex
      }
      if (a.type !== b.type) {
        return orders[a.type] - orders[b.type]
      }
      return a.name.localeCompare(b.name)
    })
    this.varList = varList
    this.varMap = varMap
    return {varList, varMap}
  }

  // 检查变量有效性
  checkVariables() {
    // 检查本地变量
    const varMap = this.varMap
    const varTypes = ['boolean', 'number', 'string', 'object', 'any']
    for (const text of document.getElementsByClassName('local-variable-identifier')) {
      const type = text.varType
      const key = text.varKey
      // 排除none变量
      if (!key) continue
      let varItem
      if (type !== 'any') {
        varItem = varMap[key + type] ?? varMap[key + 'any']
      } else {
        for (const varType of varTypes) {
          if (varItem = varMap[key + varType]) {
            if (text.currentType !== varType) {
              text.removeClass(text.currentType + '-type')
              text.currentType = varType
              text.addClass(varType + '-type')
            }
            break
          }
        }
      }
      if (varItem ? varItem.isLeftValue && varItem.refCount === 0 : false) {
        text.addClass('no-ref')
      } else {
        text.removeClass('no-ref')
      }
      if (varItem ? varItem.class !== 'error' : false) {
        text.removeClass('invalid')
      } else {
        text.addClass('invalid')
      }
    }

    // 检查全局变量
    for (const text of document.getElementsByClassName('global-variable-identifier')) {
      const key = text.varKey
      if (key === '') continue
      const variable = Data.variables.map[key]
      if (variable) {
        text.removeClass('invalid')
      } else {
        text.addClass('invalid')
      }
      const varName = variable ? variable.name : Command.parseUnlinkedId(key)
      if (text.textContent !== varName) {
        text.textContent = varName
      }
    }

    // 检查属性
    for (const text of document.getElementsByClassName('attribute-identifier')) {
      const id = text.varId
      const attr = Attribute.getAttribute(id)
      if (attr) {
        text.removeClass('invalid')
      } else {
        text.addClass('invalid')
      }
      // 忽略textId的更新，重开一下事件编辑器就好了
      const attrName = attr
      ? GameLocal.replace(attr.name)
      : Command.parseUnlinkedId(id)
      if (text.textContent !== attrName) {
        text.textContent = attrName
      }
    }

    // 检查枚举
    for (const text of document.getElementsByClassName('enum-identifier')) {
      const id = text.varId
      const string = Enum.getString(id)
      if (string) {
        text.removeClass('invalid')
      } else {
        text.addClass('invalid')
      }
      // 忽略textId的更新，重开一下事件编辑器就好了
      const stringName = string
      ? GameLocal.replace(string.name)
      : Command.parseUnlinkedId(id)
      if (text.textContent !== stringName) {
        text.textContent = stringName
      }
    }

    // 检查文件
    for (const text of document.getElementsByClassName('file-identifier')) {
      const fileId = text.varKey
      if (fileId === '') continue
      const meta = Data.manifest.guidMap[fileId]
      if (meta) {
        text.removeClass('invalid')
      } else {
        text.addClass('invalid')
      }
      const fileName = meta ? meta.file.basename : Command.parseUnlinkedId(fileId)
      if (text.textContent !== fileName) {
        text.textContent = fileName
      }
    }

    // 检查场景对象
    for (const text of document.getElementsByClassName('scene-identifier')) {
      const presetId = text.varKey
      if (presetId === '') continue
      const preset = Data.scenePresets[presetId]
      if (preset) {
        text.removeClass('invalid')
      } else {
        text.addClass('invalid')
      }
    }

    // 检查界面元素
    for (const text of document.getElementsByClassName('ui-identifier')) {
      const presetId = text.varKey
      if (presetId === '') continue
      const preset = Data.uiPresets[presetId]
      if (preset) {
        text.removeClass('invalid')
      } else {
        text.addClass('invalid')
      }
    }
  }

  // 尝试从数据中获取事件ID
  tryGetEventId(data) {
    const id = data?.id
    if (id === 'callEvent' || id === '!callEvent') {
      if (data.params.type === 'global') {
        return data.params.eventId
      }
    }
    return undefined
  }

  // 获得焦点事件
  listFocus(event) {
    if (!this.focusing) {
      this.focusing = true
      this.start !== null
      ? this.reselect()
      : this.select(0)
    }
  }

  // 失去焦点事件
  listBlur(event) {
    if (this.dragging) {
      this.windowPointerup(this.dragging)
    }
    if (this.focusing) {
      let element = this
      while (element = element.parentNode) {
        if (element instanceof WindowFrame) {
          if (element.hasClass('blur')) {
            return
          } else {
            break
          }
        }
      }
      this.focusing = false
      this.unselect()
    }
  }

  // 键盘按下事件
  keydown(event) {
    if (event.cmdOrCtrlKey) {
      switch (event.code) {
        case 'KeyX':
          this.copy()
          this.delete()
          break
        case 'KeyC':
          this.copy()
          break
        case 'KeyV':
          this.paste()
          break
        case 'KeyA':
          this.selectAll()
          break
        case 'KeyZ':
          if (!event.macRedoKey) {
            this.undo()
            break
          }
        case 'KeyY':
          this.redo()
          break
        case 'ArrowUp':
          this.scrollTop -= 20
          break
        case 'ArrowDown':
          this.scrollTop += 20
          break
        case 'Home':
          // Ctrl+Home会触发默认行为
          event.preventDefault()
          this.scroll(0, 0)
          break
        case 'End':
          // Ctrl+End会触发默认行为
          event.preventDefault()
          this.scroll(0, this.scrollHeight)
          break
        case 'PageUp':
          this.pageUp(false)
          break
        case 'PageDown':
          this.pageDown(false)
          break
      }
    } else if (event.altKey) {
      return
    } else if (event.shiftKey) {
      switch (event.code) {
        case 'ArrowUp':
          this.selectMultipleUp()
          break
        case 'ArrowDown':
          this.selectMultipleDown()
          break
        case 'Home':
          this.selectMultipleTo(0)
          this.scrollToSelection()
          break
        case 'End':
          this.selectMultipleTo(Infinity)
          this.scrollToSelection()
          break
      }
    } else {
      switch (event.code) {
        case 'Space':
          event.preventDefault()
          this.insert()
          return
        case 'Enter':
        case 'NumpadEnter':
          if (this.start !== null) {
            event.stopPropagation()
            const elements = this.elements
            const sData = elements[this.start].dataItem
            const eData = elements[this.end].dataItem
            if (sData === eData) {
              this.edit()
            }
          }
          break
        case 'Insert':
          this.insert()
          break
        case 'Slash':
          this.toggle()
          break
        case 'Backslash':
          this.insert('script')
          break
        case 'Delete':
          this.delete()
          break
        case 'ArrowUp':
          event.preventDefault()
          this.selectUp()
          break
        case 'ArrowDown':
          event.preventDefault()
          this.selectDown()
          break
        case 'ArrowRight':
          this.fold()
          break
        case 'Home':
          event.preventDefault()
          this.scroll(0, 0)
          this.select(0)
          break
        case 'End': {
          event.preventDefault()
          const scrollBottom = this.elements.count * 20
          const scrollTop = scrollBottom - this.innerHeight
          this.scroll(0, Math.max(this.scrollTop, scrollTop))
          this.select(Infinity)
          break
        }
        case 'PageUp':
          event.preventDefault()
          this.pageUp(true)
          break
        case 'PageDown':
          event.preventDefault()
          this.pageDown(true)
          break
        default:
          if (CommandList.alphabetCode.test(event.code)) {
            this.insert()
            // 获取搜索框焦点可以捕获这次输入
            CommandSuggestion.searcher.input.focus()
          }
          break
      }
    }
  }

  // 指针按下事件
  pointerdown(event) {
    if (this.dragging) {
      return
    }
    switch (event.button) {
      case 0: {
        let element = event.target
        let index
        if (element === this) {
          if (element.isInContent(event)) {
            index = this.elements.count - 1
          }
        } else if (element.tagName === 'COMMAND-FOLD') {
          this.fold(element.parentNode)
          break
        } else {
          element = element.seek('command-item', 2)
          if (element.tagName === 'COMMAND-ITEM') {
            index = element.read()
          }
        }
        if (index >= 0) {
          element = this.elements[index]
          if (event.shiftKey &&
            this.start !== null) {
            this.selectMultipleTo(index)
          } else {
            this.select(index)
            if (event.altKey) {
              const eventId = this.tryGetEventId(element.dataItem)
              if (eventId) {
                EventEditor.openGlobalEvent(eventId)
                // 阻止focus后快捷键不被禁用的情况
                event.preventDefault()
                event.stopImmediatePropagation()
                return
              }
            }
          }
          this.dragging = event
          event.mode = 'select'
          event.itemIndex = index
          event.itemHeight = element.clientHeight
          window.on('pointerup', this.windowPointerup)
          window.on('pointermove', this.windowPointermove)
          this.addScrollListener('vertical', 2, true, () => {
            this.windowPointermove(event.latest)
          })
        }
        break
      }
      case 2: {
        let element = event.target
        let index
        if (element === this) {
          if (element.isInContent(event)) {
            index = this.elements.count - 1
          }
        } else {
          element = element.seek('command-item')
          if (element.tagName === 'COMMAND-ITEM') {
            index = element.read()
          }
        }
        if (index >= 0) {
          const element = this.elements[index]
          if (!element.hasClass('selected')) {
            this.select(index)
          }
        }
        break
      }
    }
  }

  // 指针弹起事件
  pointerup(event) {
    if (this.dragging) {
      return
    }
    switch (event.button) {
      case 2:
        if (this.start !== null &&
          document.activeElement === this) {
          const elements = this.elements
          const sElement = elements[this.start]
          const dElement = elements[this.end]
          const sData = sElement.dataItem
          const eData = dElement.dataItem
          const valid = !!sData
          const pEnabled = this.isParentEnabled(sElement)
          const sEnabled = valid ? sData.buffer.enabled : pEnabled
          const editable = sEnabled && sData === eData
          const pastable = pEnabled && Clipboard.has('yami.commands')
          const allSelectable = this.data.length > 0
          const undoable = this.history.canUndo()
          const redoable = this.history.canRedo()
          const get = Local.createGetter('menuCommandList')
          const menuItems = [{
            label: get('edit'),
            accelerator: 'Enter',
            enabled: editable,
            click: () => {
              this.edit()
            },
          }, {
            label: get('insert'),
            accelerator: 'Insert',
            enabled: pEnabled,
            click: () => {
              this.insert()
            },
          }, {
            label: get('toggle'),
            accelerator: '/',
            enabled: pEnabled && valid,
            click: () => {
              this.toggle()
            },
          }, {
            label: get('script'),
            accelerator: '\\',
            enabled: pEnabled,
            click: () => {
              this.insert('script')
            },
          }, {
            type: 'separator',
          }, {
            label: get('cut'),
            accelerator: ctrl('X'),
            enabled: valid,
            click: () => {
              this.copy()
              this.delete()
            },
          }, {
            label: get('copy'),
            accelerator: ctrl('C'),
            enabled: valid,
            click: () => {
              this.copy()
            },
          }, {
            label: get('paste'),
            accelerator: ctrl('V'),
            enabled: pastable,
            click: () => {
              this.paste()
            },
          }, {
            label: get('delete'),
            accelerator: 'Delete',
            enabled: valid,
            click: () => {
              this.delete()
            },
          }, {
            label: get('selectAll'),
            accelerator: ctrl('A'),
            enabled: allSelectable,
            click: () => {
              this.select(0, Infinity)
            },
          }, {
            label: get('undo'),
            accelerator: ctrl('Z'),
            enabled: undoable,
            click: () => {
              this.undo()
            },
          }, {
            label: get('redo'),
            accelerator: ctrl('Y'),
            enabled: redoable,
            click: () => {
              this.redo()
            },
          }]
          // 添加跳转到事件选项
          if (sData === eData) {
            const eventId = this.tryGetEventId(sData)
            if (eventId) {
              menuItems.push({
                label: get('open-event'),
                accelerator: 'Alt+LB',
                click: () => {
                  EventEditor.openGlobalEvent(eventId)
                },
              })
            }
          }
          menuItems.push({
            label: get('copy-as-text'),
            enabled: valid,
            click: () => {
              this.copyAsText()
            },
          })
          Menu.popup({
            x: event.clientX,
            y: event.clientY,
          }, menuItems)
        }
        break
    }
  }

  // 鼠标双击事件
  doubleclick(event) {
    if (this.start !== null &&
      event.target.tagName !== 'COMMAND-FOLD') {
      const elements = this.elements
      const sData = elements[this.start].dataItem
      const eData = elements[this.end].dataItem
      if (sData === eData) {
        this.edit(sData)
      }
    }
  }

  // 正则表达式 - 英文字母键码
  static alphabetCode = /^Key[A-Z]$/

  // 窗口 - 指针弹起事件
  static windowPointerup(event) {
    const {dragging} = this
    if (dragging.relate(event)) {
      switch (dragging.mode) {
        case 'select':
          this.removeScrollListener()
          break
      }
      this.dragging = null
      window.off('pointerup', this.windowPointerup)
      window.off('pointermove', this.windowPointermove)
    }
  }

  // 窗口 - 指针移动事件
  static windowPointermove(event) {
    const {dragging} = this
    if (dragging.relate(event)) {
      switch (dragging.mode) {
        case 'select': {
          dragging.latest = event
          const elements = this.elements
          const count = elements.count
          if (count > 0) {
            const pt = this.paddingTop
            const {itemHeight} = dragging
            const {y} = event.getRelativeCoords(this)
            const line = Math.floor((y - pt) / itemHeight)
            const index = Math.clamp(line, 0, count - 1)
            if (dragging.itemIndex !== index) {
              dragging.itemIndex = index
              this.selectMultipleTo(index)
            }
          }
          break
        }
      }
    }
  }

  // 窗口 - 变量改变事件
  static windowVariableChange(event) {
    if (this.read()) {
      this.checkVariables()
    }
  }

  // 高亮文本元素列表
  static highlightedTexts = Array.empty

  // 高亮显示文本元素
  static highlightTexts({varSpace, varType, varKey}) {
    switch (varType) {
      case 'boolean':
      case 'number':
      case 'string':
      case 'object':
        CommandList.highlightedTexts = [
          ...document.getElementsByName(`${varSpace}-${varType}-${varKey}`),
          ...document.getElementsByName(`${varSpace}-any-${varKey}`),
        ]
        break
      case 'any':
        CommandList.highlightedTexts = [
          ...document.getElementsByName(`${varSpace}-${varType}-${varKey}`),
          ...document.getElementsByName(`${varSpace}-boolean-${varKey}`),
          ...document.getElementsByName(`${varSpace}-number-${varKey}`),
          ...document.getElementsByName(`${varSpace}-string-${varKey}`),
          ...document.getElementsByName(`${varSpace}-object-${varKey}`),
        ]
        break
    }
    for (const text of CommandList.highlightedTexts) {
      text.addClass('command-text-highlight')
    }
  }

  // 取消高亮显示文本元素
  static unhighlightTexts() {
    if (CommandList.highlightedTexts.length !== 0) {
      for (const text of CommandList.highlightedTexts) {
        text.removeClass('command-text-highlight')
      }
      CommandList.highlightedTexts = Array.empty
    }
  }

  // 文本 - 指针进入事件
  static textPointerenter(event) {
    CommandList.unhighlightTexts()
    CommandList.highlightTexts(this)
  }

  // 文本 - 指针离开事件
  static textPointerleave(event) {
    CommandList.unhighlightTexts()
  }
}

customElements.define('command-list', CommandList)

// ******************************** 脚本参数面板 ********************************
