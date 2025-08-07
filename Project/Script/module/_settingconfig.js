const { homedir } = require('os')
const path = require('path')
const fs = require('fs')

const SettingConfig = {
	get defaultConfig() {
		return {
			server: {
				port: 5959
			},
			apkbuild: {
				apkPath: '@/app-release.apk', // 原始APK路径
				outputDir: '$/decompiled', // 反编译输出目录
				newApkPath: '$/app-release-re.apk', // 新APK输出路径
				apktoolPath: '@/apktool.jar' // apktool.jar路径
			},
			sgined: {
				isSign: true,
				jksPath: '@/release.jks', // JKS密钥库路径
				keyStorePassword: '123456', // 密钥库密码
				keyAlias: 'xuran', // 密钥别名
				keyPassword: '123456', // 密钥密码
				apksignerPath: '@/apksigner.bat', // apksigner路径
				zipalignPath: '@/zipalign.exe',
				signedApkPath: '$/app-debug-signed.apk' // 签名后APK路径
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
		// 比对，如果有新增字段，则合并
		const patch = (_p_obj, _t_obj) => {
			for (const key in _p_obj) {
				if (!_t_obj[key]) {
					_t_obj[key] = _p_obj[key]
				}
				if (typeof _p_obj[key] === 'object') {
					patch(_p_obj[key], _t_obj[key])
				}
			}
		}
		patch(this.defaultConfig, this.config)
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
