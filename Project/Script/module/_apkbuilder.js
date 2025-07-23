const ApkBuilder = new (class {
	isBindOn = false
	constructor() {
		this.isBindOn = false
		require('electron').ipcRenderer.on('apk-log', this.apkLog)
	}
	build(cfg) {
		$('#export-apk-content').clear()
		const config = this.process(cfg)
		require('electron').ipcRenderer.invoke('build-apk', config)
	}
	apkLog(event, log) {
		const text = document.createElement('text')
		text.textContent = log.msg
		text.addClass('export-apk-major')
		$('#export-apk-content').appendChild(text)
		if (log.done) {
			console.log('done', log)
			this.isBindOn = false
			$('#export-apk-button').enable()
		}
		console.log('log', log)
		$('#export-apk-container').scrollTo({
			top: $('#export-apk-container').scrollHeight
		})
	}
	reset() {
		$('#export-apk-content').clear()
		$('#export-apk-button').enable()
	}
	processPathOnly(line) {
		const pathPrefix = Path.resolve(
			Path.dirname(Editor.config.project),
			'apk'
		)
		if (typeof line === 'string' && line?.startsWith('@')) {
			return Path.resolve(__dirname, 'Apk', line.replace('@', '.'))
		} else if (typeof line === 'string' && line?.startsWith('$')) {
			return Path.resolve(pathPrefix, line.replace('$', '.'))
		} else if (typeof line === 'string' && line?.startsWith('~')) {
			return Path.resolve(
				Path.dirname(Editor.config.project),
				line.replace('~', '.')
			)
		}
		return line
	}
	process(cfg) {
		const config = JSON.parse(JSON.stringify(cfg))
		const list = Object.keys(config)
		list.forEach((v) => {
			config[v] = this.processPathOnly(config[v])
		})
		config.projectPath = Path.dirname(Editor.config.project)
		return config
	}
})()
