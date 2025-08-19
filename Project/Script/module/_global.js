/* 小改动或者不确定放哪的都可以放这 */

CommandList.prototype.openEdit = function () {
	Window.open('edit-data')
	EditDataInstance.open(this)
}

function find_dItem(fn) {
	var list = this.selections || []
	var cur = list[list.length - 1]
	var next = cur?.element?.nextSibling?.item
	var insertBefore = false

	if (!cur) {
		//什么都没选，直接插入到最底下
		return fn()
	}
	if (cur.class == 'folder') {
		//选中了文件夹
		return fn(cur)
	}
	if (!next) {
		//没有下一个元素，但是当前元素在文件夹内
		if (cur.parent.class == 'folder') {
			return fn(cur.parent)
		}
		return fn()
	}

	//是和自己同一个文件夹内
	if (next.parent == cur.parent) {
		if (next.class == 'folder') {
			insertBefore = true
		}
		return fn(next, insertBefore)
	} else {
		return fn(cur.parent)
	}
}

// 列表 - 粘贴
Scene.list.paste = function (dItem, callback) {
	const copy = Clipboard.read('yami.scene.object')
	if (copy && this.data) {
		switch (copy.class) {
			case 'tilemap':
				Codec.decodeTilemap(copy)
				copy.shortcut = 0
				break
		}

		var insertBefore = false
		if (dItem === 'auto') {
			find_dItem.call(this, (a, b) => {
				dItem = a
				insertBefore = b
			})
		}
		callback?.(copy)
		this.addNodeTo(copy, dItem, insertBefore)
		Scene.requestRendering()
	}
}

// 列表 - 粘贴
Enum.list.paste = function (dItem) {
	const copy = Clipboard.read('yami.data.enumeration')
	if (copy) {
		// 只有冲突时进行更换ID
		// 支持跨项目复制保留ID
		if (Enum.idMap[copy.id]) {
			copy.id = Enum.createId()
			//如果需要去掉后面的 -copy，把下面这行注释就好了
			copy.name += ' - Copy'
		}

		find_dItem.call(this, (a, b) => {
			this.addNodeTo(copy, a, b)
		})
	}
}

// 列表 - 粘贴
Variable.list.paste = function (dItem) {
	const copy = Clipboard.read('yami.data.variable')
	if (copy) {
		// 只有冲突时进行更换ID
		// 支持跨项目复制保留ID
		if (Variable.idMap[copy.id]) {
			copy.id = Variable.createId()
			//如果需要去掉后面的 -copy，把下面这行注释就好了
			copy.name += ' - Copy'
		}

		find_dItem.call(this, (a, b) => {
			this.addNodeTo(copy, a, b)
		})
	}
}

// 列表 - 粘贴
Attribute.list.paste = function (dItem) {
	const copy = Clipboard.read('yami.data.attribute')
	if (copy) {
		// 只有冲突时进行更换ID
		// 支持跨项目复制保留ID
		if (Attribute.idMap[copy.id]) {
			copy.id = Attribute.createId()
			//如果需要去掉后面的 -copy，把下面这行注释就好了
			copy.name += ' - Copy'
		}

		find_dItem.call(this, (a, b) => {
			this.addNodeTo(copy, a, b)
		})
	}
}

// 列表 - 粘贴
Localization.list.paste = function (dItem) {
	const copy = Clipboard.read('yami.data.localization')
	if (copy) {
		// 只有冲突时进行更换ID
		// 支持跨项目复制保留ID
		if (Localization.idMap[copy.id]) {
			copy.id = Localization.createId()
			//如果需要去掉后面的 -copy，把下面这行注释就好了
			copy.name += ' - Copy'
		}
		find_dItem.call(this, (a, b) => {
			this.addNodeTo(copy, a, b)
		})
	}
}

// 列表 - 粘贴
UI.list.paste = function (_, callback) {
	const copy = Clipboard.read('yami.ui.object')
	if (copy && this.data) {
		callback?.(copy)
		this.addNodeTo(copy, UI.target)
		UI.requestRendering()
	}
}
