const WebServer = {
	port: 5959,
	start(path) {
		require('electron').ipcRenderer.invoke('start-server', {
			port: this.port,
			path
		})
	},
	toDataUrl(url) {
		return require('electron').ipcRenderer.invoke('to-qrcode', url)
	},
	getIp() {
		return require('electron').ipcRenderer.invoke('get-local-ip')
	},
	stop() {
		require('electron').ipcRenderer.invoke('stop-server')
	},
	update(projectPath) {
		const path = Path.dirname(projectPath)
		const location = Path.join(path, '.preview')
		return FSP.mkdir(path, { recursive: true })
			.then((done) => {
				$('#deployment-platform').write('web')
				return Deployment.copyFilesTo(location)
			})
			.finally(() => {
				Window.close('copyProgress')
				if (Deployment.timer) {
					Deployment.timer.remove()
					Deployment.timer = null
				}
			})
			.then(() => {
				Editor.config.dialogs.deploy = Path.slash(
					Path.resolve(location)
				)
			})
			.catch((error) => {
				Log.throw(error)
				Window.confirm(
					{
						message: 'Failed to deploy project:\n' + error.message
					},
					[
						{
							label: 'Confirm'
						}
					]
				)
			})
	}
}

window.addEventListener('beforeunload', function () {
	WebServer.stop()
})
