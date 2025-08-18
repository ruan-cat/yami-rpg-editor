const EditDataInstance = new (class {
	editor = null
	model = null
	versionId = null
	commandList = null
	changed = false
	fontSize = 14
	lineHeight = 14
	colorOptions = {
		mimeType: 'json',
		tabSize: 2,
		theme: ''
	}
	isCreated = false
	mark = $('#edit-data-mark')
	editorParent = $('#edit-data')
	editorDom = $('#edit-data-current')
	eventListDom = $('#event-commands')
	currentContent = null
	constructor() {
		$('#edit-data').on('resize', () => {
			this.resize()
		})
		$('#edit-data-confirm').on('click', this.save.bind(this))

		// 窗口关闭事件
		this.editorParent.on('close', (event) => {
			if (this.changed) {
				event.preventDefault()
				const get = Local.createGetter('confirmation')
				Window.confirm(
					{
						message: get('closeUnsavedData'),
						close: () => {
							this.editor.getFocus()
						}
					},
					[
						{
							label: get('yes'),
							click: () => {
								this.setChangeState(false)
								Window.close('edit-data')
							}
						},
						{
							label: get('no')
						}
					]
				)
			}
		})

		// 键盘按下事件
		this.editorParent.on('keydown', (event) => {
			if (event.target.hasClass('inputarea')) {
				switch (event.code) {
					case 'Enter':
						event.stopPropagation()
						break
				}
			}
		})

		this.editorParent.on('closed', () => {
			this.model.setValue('')
		})
	}
	isMaximized() {
		return $('#edit-data').hasClass('maximized')
	}
	resize() {
		const content = this.editorDom
		const parent = content.parentElement
		if (!this.isMaximized()) {
			content.style.width = ''
			content.style.height = ''
			const boundingRect = content.getBoundingClientRect()
			this.editor.layout({
				width: boundingRect.width,
				height: parent.clientHeight - 60
			})
		} else {
			const boundingRect = content.getBoundingClientRect()
			// 保持content左右间距相同
			content.style.width =
				parent.clientWidth - boundingRect.left * 2 + 'px'
			content.style.height = parent.clientHeight - 60 + 'px'
			this.editor.layout({
				width: parseFloat(content.style.width),
				height: parseFloat(content.style.height)
			})
		}
	}
	parseJSON(text) {
		try {
			const vaild = JSON.parse(text)
			if (vaild.id && vaild.params)
				return new (class {
					id = vaild.id
					params = vaild.params
				})()
			if (Array.isArray(vaild) && vaild.every((v) => v.id && v.params)) {
				return vaild.map(
					(v) =>
						new (class {
							id = v.id
							params = v.params
						})()
				)
			}
			return null
		} catch {
			return null
		}
	}
	save() {
		const modelValue = this.model.getValue()
		const parse = this.parseJSON(modelValue)
		if (!parse) return
		const history = this.eventListDom.history
		const originalStart = this.eventListDom.start
		const originalEnd = this.eventListDom.end
		if (Array.isArray(this.currentContent)) {
			for (const ind in this.currentContent) {
				const { node, value } = this.currentContent[ind]
				if (!(ind in parse)) continue
				const changeContent = parse[ind]
				if (JSON.stringify(value) === JSON.stringify(changeContent))
					continue
				const parent = node.dataParent
				const list = node.dataList

				const buffer = this.eventListDom.createCommandBuffer(
					list,
					node.dataIndex,
					node.dataIndent,
					parent
				)
				Object.defineProperty(changeContent, 'buffer', {
					value: buffer,
					configurable: true
				})
				const { id: originalId, target: originalTarget } = Command
				let originalIndex = history.index
				try {
					this.eventListDom.inserting = true
					this.eventListDom.start = node.dataIndex
					this.eventListDom.end = node.dataIndex
					Command.id = changeContent.id
					Command.target = this.eventListDom
					Command.save(changeContent.params)
					originalIndex = history.index
				} finally {
					this.eventListDom.end = this.eventListDom.start
					this.eventListDom.delete()
					const replaceObject =
						history.stack[history.stack.length - 1]
					history.stack.splice(history.stack.length - 2, 2)
					const index = node.dataIndex - 1
					/* 
					进行多行编辑时，按理来说循环并替换修改的项就可以
					但不知道为啥这会有问题，导致数据错乱（我猜是因为save时会导致列表重新排序？）
					这里我用 插入+删除 代替了替换操作并伪造了一个替换的操作历史
					*/
					history.save({
						type: 'replace',
						parent: parent,
						array: list,
						index,
						commands: [replaceObject.commands[0], changeContent]
					})
					history.index = originalIndex
					this.eventListDom.inserting = false
					Command.id = originalId
					Command.target = originalTarget
				}
			}
			this.eventListDom.select(originalStart, originalEnd)
		} else if (
			JSON.stringify(this.currentContent.value) !== JSON.stringify(parse)
		) {
			const node = this.currentContent.node
			const parent = node.dataParent
			const list = node.dataList

			const buffer = this.eventListDom.createCommandBuffer(
				list,
				node.dataIndex,
				node.dataIndent,
				parent
			)
			Object.defineProperty(parse, 'buffer', {
				value: buffer,
				configurable: true
			})
			this.currentContent.node.dataItem = parse
			const { id: originalId, target: originalTarget } = Command
			const originalInserting = this.eventListDom.inserting
			try {
				this.eventListDom.inserting = false
				Command.id = parse.id
				Command.target = this.eventListDom
				Command.save(parse.params)
			} finally {
				this.eventListDom.inserting = originalInserting
				Command.id = originalId
				Command.target = originalTarget
			}
		}
		this.currentContent = null
		this.setChangeState(false)
		Window.close('edit-data')
	}
	colorizeCodeLines(items, code) {
		const text = document.createElement('text')
		const options = this.colorOptions
		text.textContent = code
		options.theme = Title.theme
		this.createTheme(Title.theme)
		monaco.editor.colorizeElement(text, options)
		let index = setInterval(() => {
			if (text.children.length !== 0) {
				clearInterval(index)
				const nodes = text.childNodes
				const nLength = nodes.length
				const sLength = nLength >> 1
				const spans = new Array(sLength)
				for (let i = 0; i < nLength; i += 2) {
					spans[i >> 1] = nodes[i]
				}
				for (let i = 0; i < sLength; i++) {
					items[i].appendChild(spans[i])
				}
			}
		})
	}
	open(current) {
		if (!this.isCreated) {
			this.isCreated = true
			const { theme } = Title
			Command.cases.script.createTheme(theme)
			// 假设monaco对象已加载完毕
			this.editor = monaco.editor.create(this.editorDom, {
				language: 'json',
				theme: theme,
				tabSize: 2,
				fontSize: this.fontSize,
				lineHeight: this.lineHeight,
				mouseWheelScrollSensitivity: (this.lineHeight * 3) / 50,
				fastScrollSensitivity: 5,
				wordWrap: 'on',
				matchBrackets: 'never',
				folding: true,
				formatOnType: false,
				showDeprecated: false,
				selectionHighlight: true,
				detectIndentation: false,
				insertSpaces: true,
				roundedSelection: false,
				overviewRulerBorder: false,
				hideCursorInOverviewRuler: true,
				automaticLayout: false,
				hover: false,
				lightbulb: {
					enabled: false
				},
				minimap: {
					enabled: false
				},
				scrollbar: {
					useShadows: false,
					horizontalScrollbarSize: 12,
					verticalScrollbarSize: 12
				}
			})

			this.model = this.editor.getModel()

			// 编辑器 - 获得焦点
			this.editor.getFocus = function () {
				setTimeout(() => this.focus())
			}

			// 侦听键盘按下事件
			this.editor.onKeyDown((event) => {
				event = event.browserEvent
				if (event.ctrlKey) {
					switch (event.code) {
						case 'Enter':
							event.preventDefault()
							event.stopPropagation()
							// this.save()
							break
					}
				}
			})

			// 侦听内容改变事件
			this.editor.onDidChangeModelContent((event) => {
				if (event.isFlush) return
				if (event.isUndoing || event.isRedoing) {
					const versionId = this.model.getAlternativeVersionId()
					const changed = this.versionId !== versionId
					if (this.changed !== changed) {
						this.setChangeState(changed)
					}
				} else if (!this.changed) {
					this.setChangeState(true)
				}
			})
		}
		this.model.setValue('')
		this.versionId = this.model.getAlternativeVersionId()
		this.editor.setPosition(new monaco.Position(9999, 9999))
		this.editor.setScrollTop(0)
		this.editor.revealLine(9999)
		this.editor.getFocus()
		this.commandList = current
		this.loadData()
	}
	loadData() {
		this.currentContent = null
		const { elements, start, end } = this.commandList
		const sElement = elements[start]
		if (start === end) {
			const sData = sElement.dataItem
			this.currentContent = {
				node: sElement,
				value: { id: sData.id, params: sData.params }
			}
			// 单个
			this.model.setValue(
				JSON.stringify(this.currentContent.value, null, 2)
			)
		} else {
			const value = []
			const includeArr = []
			for (let index = start; index <= end; index++) {
				const elem = elements[index]
				const eData = elem.dataItem
				if (
					eData &&
					!includeArr.includes(elem.dataParent) &&
					elem.mark !== 'footer'
				)
					value.push({
						node: elem,
						value: {
							id: eData.id,
							params: eData.params
						}
					})
				if (elem.mark === 'header') includeArr.push(eData) // 将buffer也存储，这样能保证有唯一性
			}
			this.currentContent = value
			// 多个
			this.model.setValue(
				JSON.stringify(
					value.map((v) => v.value),
					null,
					2
				)
			)
		}
	}
	setChangeState(changed) {
		if (this.changed !== changed) {
			this.changed = changed
			if (changed) {
				this.mark.show()
			} else {
				this.mark.hide()
			}
		}
	}
})()
