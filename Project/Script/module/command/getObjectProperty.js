const IndexBind = {
	target: null,
	type: null,
	initialize() {
		this.target = null
		this.type = 'get-object-index'
		// 侦听事件
		$('#ObjectProperty-index-confirm').on('click', this.confirm)
	},
	parse(item) {
		return `${item.text}`
	},
	open() {
		Window.open('ObjectProperty-index')
		$('#ObjectProperty-index-name').getFocus()
	},
	save() {
		const read = getElementReader('ObjectProperty-index')
		const data = { text: read('name') }
		Window.close('ObjectProperty-index')
		return data
	},
	confirm() {
		return IndexBind.target.save()
	}
}

// 获取对象属性
Command.cases.getObjectProperty = {
	initialize: function () {
		$('#getObjectProperty-confirm').on('click', this.save)
		// 绑定分支列表
		$('#getObjectProperty-list').bind(IndexBind)

		// 清理内存 - 窗口已关闭事件
		$('#getObjectProperty').on('closed', () => {
			$('#getObjectProperty-list').clear()
		})
	},
	parse: function ({ variable, saveVariable, properties }) {
		const contents = []
		for (const i of properties) {
			contents.push(
				{ text: ' , ' },
				{ color: 'normal' },
				{ text: i.text }
			)
		}
		return [
			{ color: 'variable' },
			{ text: Local.get('command.getObjectProperty') + ' ' },
			{ text: Command.parseVariable(variable, 'any') + ' -> ' }
		]
			.concat(contents.slice(1))
			.concat([
				{ text: ' -> ' + Command.parseVariable(saveVariable, 'any') }
			])
	},
	load: function ({
		variable = { type: 'local', key: '' },
		saveVariable = { type: 'local', key: '' },
		properties = []
	}) {
		$('#getObjectProperty-save-variable').write(saveVariable)
		$('#getObjectProperty-variable').write(variable)
		$('#getObjectProperty-variable').getFocus()
		const write = getElementWriter('getObjectProperty')
		write('list', properties)
	},
	save: function () {
		const elVariable = $('#getObjectProperty-variable')
		const variable = elVariable.read()
		if (VariableGetter.isNone(variable)) {
			return elVariable.getFocus()
		}
		const elsaveVariable = $('#getObjectProperty-save-variable')
		const saveVariable = elsaveVariable.read()
		if (VariableGetter.isNone(saveVariable)) {
			return elsaveVariable.getFocus()
		}
		const read = getElementReader('getObjectProperty')
		const properties = read('list')
		if (properties.length === 0) {
			return $('#getObjectProperty-list').getFocus()
		}
		Command.save({ variable, saveVariable, properties })
	}
}

// 设置对象属性
Command.cases.setObjectProperty = {
	initialize: function () {
		$('#setObjectProperty-confirm').on('click', this.save)
		// 绑定分支列表
		$('#setObjectProperty-list').bind(IndexBind)

		// 清理内存 - 窗口已关闭事件
		$('#setObjectProperty').on('closed', () => {
			$('#setObjectProperty-list').clear()
		})
	},
	parse: function ({ variable, valueVariable, properties }) {
		const contents = []
		for (const i of properties) {
			contents.push(
				{ text: ' , ' },
				{ color: 'normal' },
				{ text: i.text }
			)
		}
		return [
			{ color: 'variable' },
			{ text: Local.get('command.setObjectProperty') + ' ' },
			{ text: Command.parseVariable(variable, 'any') + ' -> ' }
		]
			.concat(contents.slice(1))
			.concat([
				{ text: ' -> ' + Command.parseVariable(valueVariable, 'any') }
			])
	},
	load: function ({
		variable = { type: 'local', key: '' },
		valueVariable = { type: 'local', key: '' },
		properties = []
	}) {
		$('#setObjectProperty-value-variable').write(valueVariable)
		$('#setObjectProperty-variable').write(variable)
		$('#setObjectProperty-variable').getFocus()
		const write = getElementWriter('setObjectProperty')
		write('list', properties)
	},
	save: function () {
		const elVariable = $('#setObjectProperty-variable')
		const variable = elVariable.read()
		if (VariableGetter.isNone(variable)) {
			return elVariable.getFocus()
		}
		const elvalueVariable = $('#setObjectProperty-value-variable')
		const valueVariable = elvalueVariable.read()
		if (VariableGetter.isNone(valueVariable)) {
			return elvalueVariable.getFocus()
		}
		const read = getElementReader('setObjectProperty')
		const properties = read('list')
		if (properties.length === 0) {
			return $('#setObjectProperty-list').getFocus()
		}
		Command.save({ variable, valueVariable, properties })
	}
}
