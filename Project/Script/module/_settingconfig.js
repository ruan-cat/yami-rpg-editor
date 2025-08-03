const { homedir } = require('os')
const path = require('path')
const fs = require('fs')

const SettingConfig = {
	get defaultConfig() {
		return {
			server: {
				port: 5959
			}
		}
	},
	config: {},
	homedir: homedir(),
	configPath: path.join(homedir(), 'yami-config.json'),
	open() {
		this.load()
		this.update()
		$('#setting-confirm').on('click', () => {
			this.save()
		})
	},
	close() {
		this.save()
	},
	load() {
		if (!fs.existsSync(this.configPath)) {
			fs.writeFileSync(
				this.configPath,
				JSON.stringify(this.defaultConfig),
				'utf-8'
			)
			this.config = this.defaultConfig
			return
		}
		this.config = JSON.parse(fs.readFileSync(this.configPath, 'utf-8'))
	},
	update() {
		const write = getElementWriter('setting-server')
		write('port', this.config.server.port)
	},
	save() {
		if (!fs.existsSync(this.configPath)) {
			return fs.writeFileSync(
				this.configPath,
				JSON.stringify(this.defaultConfig),
				'utf-8'
			)
		}
		fs.writeFileSync(this.configPath, JSON.stringify(this.config), 'utf-8')
		// 应用配置
		this.apply()
		Window.close('setting')
	},
	apply() {
		// server
		if (WebServer.port !== this.config.server.port) {
			WebServer.port = this.config.server.port
		}
	}
}
