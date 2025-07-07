class CustomBox extends HTMLElement {
  info              //:element
  dataValue         //:any
  writeEventEnabled //:boolean
  inputEventEnabled //:boolean

  constructor() {
    super()

    // 创建文本
    const text = document.createElement('text')
    text.addClass('custom-box-text')
    this.appendChild(text)

    // 设置属性
    this.tabIndex = 0
    this.info = text
    this.dataValue = null
    this.writeEventEnabled = false
    this.inputEventEnabled = false

    // 侦听事件
    this.on('keydown', this.keydown)
    this.on('click', this.click)
    this.on('dragenter', this.dragenter)
    this.on('dragleave', this.dragleave)
    this.on('dragover', this.dragover)
    this.on('drop', this.drop)
  }

  // 获取类型属性
  get type() {
    return this.getAttribute('type')
  }

  set type(value) {
    this.setAttribute('type', value)
  }

  // 获取过滤属性
  get filter() {
    return this.getAttribute('filter')
  }

  set filter(value) {
    this.setAttribute('filter', value)
  }

  // 读取数据
  read() {
    return this.dataValue
  }

  // 写入数据
  write(value) {
    this.dataValue = value
    this.update()
    if (this.writeEventEnabled) {
      const write = new Event('write')
      write.value = this.dataValue
      this.dispatchEvent(write)
    }
  }

  // 输入数据
  input(value) {
    if (this.dataValue !== value) {
      this.write(value)
      if (this.inputEventEnabled) {
        const input = new Event('input')
        input.value = this.dataValue
        this.dispatchEvent(input)
      }
      this.dispatchChangeEvent()
    } else {
      if (this.type === 'file') {
        this.update()
      }
    }
  }

  // 更新信息
  update() {
    this.info.removeClass('invalid')
    const value = this.dataValue
    switch (this.type) {
      case 'file':
        return this.updateFile(value)
      case 'clip':
        return this.updateClip(value)
      case 'variable':
        return this.updateVariable(value)
      case 'global-variable':
        return this.updateGlobalVariable(value)
      case 'actor':
        return this.updateActor(value)
      case 'skill':
        return this.updateSkill(value)
      case 'state':
        return this.updateState(value)
      case 'equipment':
        return this.updateEquipment(value)
      case 'item':
        return this.updateItem(value)
      case 'position':
        return this.updatePosition(value)
      case 'angle':
        return this.updateAngle(value)
      case 'trigger':
        return this.updateTrigger(value)
      case 'light':
        return this.updateLight(value)
      case 'region':
        return this.updateRegion(value)
      case 'tilemap':
        return this.updateTilemap(value)
      case 'object':
        return this.updateObject(value)
      case 'element':
      case 'ancestor-element':
        return this.updateElement(value)
      case 'preset-object':
        return this.updatePresetObject(value)
      case 'preset-element':
        return this.updatePresetElement(value)
      case 'array':
        return this.updateArray(value)
      case 'attribute':
        return this.updateAttribute(value)
      case 'attribute-group':
        return this.updateAttributeGroup(value)
      case 'enum-group':
        return this.updateEnumGroup(value)
      case 'enum-string':
        return this.updateEnumString(value)
    }
  }

  // 更新文件信息
  updateFile(guid) {
    Command.invalid = false
    this.info.textContent = Command.removeTextTags(Command.parseFileName(guid))
    if (Command.invalid) this.info.addClass('invalid')
  }

  // 更新图像剪辑信息
  updateClip(clip) {
    this.info.textContent = clip.join(', ')
  }

  // 更新变量信息
  updateVariable(variable) {
    // 类型是独立变量，或存在变量键，则判定为有效变量
    if (variable.type === 'self' || variable.key) {
      this.info.textContent = Command.removeTextTags(Command.parseVariable(variable))
    } else {
      this.info.textContent = Local.get('common.none')
    }
  }

  // 更新全局变量信息
  updateGlobalVariable(id) {
    this.info.textContent = Command.removeTextTags(Command.parseGlobalVariable(id))
  }

  // 更新角色信息
  updateActor(actor) {
    this.info.textContent = Command.removeTextTags(Command.parseActor(actor))
  }

  // 更新技能信息
  updateSkill(skill) {
    this.info.textContent = Command.removeTextTags(Command.parseSkill(skill))
  }

  // 更新状态信息
  updateState(state) {
    this.info.textContent = Command.removeTextTags(Command.parseState(state))
  }

  // 更新装备信息
  updateEquipment(equipment) {
    this.info.textContent = Command.removeTextTags(Command.parseEquipment(equipment))
  }

  // 更新物品信息
  updateItem(item) {
    this.info.textContent = Command.removeTextTags(Command.parseItem(item))
  }

  // 更新位置信息
  updatePosition(point) {
    this.info.textContent = Command.removeTextTags(Command.parsePosition(point))
  }

  // 更新角度信息
  updateAngle(angle) {
    this.info.textContent = Command.removeTextTags(Command.parseAngle(angle))
  }

  // 更新触发器信息
  updateTrigger(trigger) {
    this.info.textContent = Command.removeTextTags(Command.parseTrigger(trigger))
  }

  // 更新光源信息
  updateLight(light) {
    this.info.textContent = Command.removeTextTags(Command.parseLight(light))
  }

  // 更新区域信息
  updateRegion(region) {
    this.info.textContent = Command.removeTextTags(Command.parseRegion(region))
  }

  // 更新瓦片地图信息
  updateTilemap(tilemap) {
    this.info.textContent = Command.removeTextTags(Command.parseTilemap(tilemap))
  }

  // 更新场景对象信息
  updateObject(object) {
    this.info.textContent = Command.removeTextTags(Command.parseObject(object))
  }

  // 更新元素信息
  updateElement(element) {
    Command.invalid = false
    this.info.textContent = Command.removeTextTags(Command.parseElement(element))
    if (Command.invalid) this.info.addClass('invalid')
  }

  // 更新预设对象信息
  updatePresetObject(preset) {
    this.info.textContent = Command.removeTextTags(Command.parsePresetObject(preset))
  }

  // 更新预设元素信息
  updatePresetElement(preset) {
    this.info.textContent = Command.removeTextTags(Command.parsePresetElement(preset))
    if (Command.invalid) this.info.addClass('invalid')
  }

  // 更新数组信息
  updateArray(array) {
    this.info.textContent = array.length !== 0
    ? Command.parseMultiLineString(array.join(', '))
    : Local.get('common.empty')
  }

  // 更新属性群组信息
  updateAttributeGroup(groupId) {
    Command.invalid = false
    this.info.textContent = Command.removeTextTags(
      Command.parseAttributeGroup(groupId)
    )
    if (Command.invalid) this.info.addClass('invalid')
  }

  // 更新属性信息
  updateAttribute(attrId) {
    if (attrId === '') {
      this.info.textContent = Local.get('common.none')
      return
    }
    const attribute = Attribute.getAttribute(attrId)
    if (attribute) {
      this.info.textContent = GameLocal.replace(attribute.name)
    } else {
      this.info.textContent = Command.parseUnlinkedId(attrId)
      this.info.addClass('invalid')
    }
  }

  // 更新枚举群组信息
  updateEnumGroup(groupId) {
    Command.invalid = false
    this.info.textContent = Command.removeTextTags(
      Command.parseEnumGroup(groupId)
    )
    if (Command.invalid) this.info.addClass('invalid')
  }

  // 更新枚举字符串信息
  updateEnumString(stringId) {
    if (stringId === '') {
      this.info.textContent = Local.get('common.none')
      return
    }
    const string = Enum.getString(stringId)
    if (string) {
      this.info.textContent = GameLocal.replace(string.name)
    } else {
      this.info.textContent = Command.parseUnlinkedId(stringId)
      this.info.addClass('invalid')
    }
  }

  // 启用元素
  enable() {
    if (this.removeClass('disabled')) {
      this.tabIndex += 1
      this.showChildNodes()
    }
  }

  // 禁用元素
  disable() {
    if (this.addClass('disabled')) {
      this.tabIndex -= 1
      this.hideChildNodes()
    }
  }

  // 添加事件
  on(type, listener, options) {
    super.on(type, listener, options)
    switch (type) {
      case 'write':
        this.writeEventEnabled = true
        break
      case 'input':
        this.inputEventEnabled = true
        break
    }
  }

  // 键盘按下事件
  keydown(event) {
    switch (event.code) {
      case 'Enter':
      case 'NumpadEnter':
        if (!event.cmdOrCtrlKey) {
          event.stopPropagation()
          this.click(event)
        }
        break
    }
  }

  // 鼠标点击事件
  click(event) {
    switch (this.type) {
      case 'file':
        return Selector.open(this)
      case 'clip':
        return ImageClip.open(this)
      case 'variable':
        return VariableGetter.open(this)
      case 'global-variable':
        return Variable.open(this)
      case 'actor':
        return ActorGetter.open(this)
      case 'skill':
        return SkillGetter.open(this)
      case 'state':
        return StateGetter.open(this)
      case 'equipment':
        return EquipmentGetter.open(this)
      case 'item':
        return ItemGetter.open(this)
      case 'position':
        return PositionGetter.open(this)
      case 'angle':
        return AngleGetter.open(this)
      case 'trigger':
        return TriggerGetter.open(this)
      case 'light':
        return LightGetter.open(this)
      case 'region':
        return RegionGetter.open(this)
      case 'tilemap':
        return TilemapGetter.open(this)
      case 'object':
        return ObjectGetter.open(this)
      case 'element':
        return ElementGetter.open(this)
      case 'ancestor-element':
        return AncestorGetter.open(this)
      case 'preset-object':
        return PresetObject.open(this)
      case 'preset-element':
        return PresetElement.open(this)
      case 'array':
        return ArrayList.open(this)
      case 'attribute':
        return Attribute.open(this, 'attribute')
      case 'attribute-group':
        return Attribute.open(this, 'group')
      case 'enum-group':
        return Enum.open(this, 'group')
      case 'enum-string':
        return Enum.open(this, 'string')
    }
  }

  // 拖拽进入事件
  dragenter(event) {
    return this.dragover(event)
  }

  // 拖拽离开事件
  dragleave(event) {
    if (!this.contains(event.relatedTarget)) {
      this.removeClass('dragover')
    }
  }

  // 拖拽悬停事件
  dragover(event) {
    if (this.type === 'file' && Browser.dragging) {
      const file = Browser.body.activeFile
      if (file instanceof FileItem && (!this.filter || this.filter.indexOf(file.type) !== -1)) {
        event.dataTransfer.dropEffect = 'move'
        event.preventDefault()
        this.addClass('dragover')
      }
    }
  }

  // 拖拽释放事件
  drop(event) {
    const file = Browser.body.activeFile
    if (file instanceof FileItem) {
      this.focus()
      this.input(file.meta.guid)
      this.removeClass('dragover')
    }
  }
}

customElements.define('custom-box', CustomBox)

// ******************************** 数字变量框 ********************************
