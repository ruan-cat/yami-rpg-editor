const fs = require('fs')
const fsp = require('fs').promises
const path = require('path')
const { parseString, Builder } = require('xml2js')
const util = require('util')
const exec = require('child_process').exec
const execPromise = util.promisify(exec)
const sharp = require('sharp')

// 构建状态跟踪
let isBuilding = false
let currentChildProcess = null
let abortController = null

// 默认配置参数
const defaultConfig = {
	apkPath: '@/app-release.apk', // 原始APK路径
	outputDir: '$/decompiled', // 反编译输出目录
	newApkPath: '$/app-release-re.apk', // 新APK输出路径
	apktoolPath: '@/apktool.jar', // apktool.jar路径

	// 自定义选项
	packageName: 'com.xuran.newapp', // 新包名
	appName: 'New App Name', // 新应用名称
	iconPath: '~/Icon/icon.png', // 新图标路径
	versionName: '1.0.0', // 版本名称
	versionCode: 1, // 版本号（整数）

	// 签名配置
	isSign: true,
	jksPath: '@/release.jks', // JKS密钥库路径
	keyStorePassword: '123456', // 密钥库密码
	keyAlias: 'xuran', // 密钥别名
	keyPassword: '123456', // 密钥密码
	apksignerPath: '@/apksigner.bat', // apksigner路径
	signedApkPath: '$/app-debug-signed.apk', // 签名后APK路径
	zipalignPath: '@/zipalign.exe',

	// 项目路径
	projectPath: ''
}

// Android图标尺寸规范
const ICON_SIZES = {
	'mipmap-mdpi': 48,
	'mipmap-hdpi': 72,
	'mipmap-xhdpi': 96,
	'mipmap-xxhdpi': 144,
	'mipmap-xxxhdpi': 192,
	'drawable-mdpi': 48,
	'drawable-hdpi': 72,
	'drawable-xhdpi': 96,
	'drawable-xxhdpi': 144,
	'drawable-xxxhdpi': 192
}

// 文件存在性检查
function fileExists(filePath) {
	return fs.existsSync(filePath)
}

// 复制文件夹
async function copyFolderAsync(source, destination) {
	try {
		// 创建目标目录 (recursive: true 确保父目录存在)
		await fsp.mkdir(destination, { recursive: true })
		// 读取源目录内容
		const items = await fsp.readdir(source)
		// 并行处理所有文件和子目录
		await Promise.all(
			items.map(async (item) => {
				const sourcePath = path.join(source, item)
				const destPath = path.join(destination, item)

				const stats = await fsp.stat(sourcePath)

				if (stats.isDirectory()) {
					// 递归处理子目录
					await copyFolderAsync(sourcePath, destPath)
				} else {
					// 异步复制文件
					await fsp.copyFile(sourcePath, destPath)
					console.log(`📄 已复制: ${item}`)
				}
			})
		)
	} catch (err) {
		console.error(`❌ 复制出错: ${err.message}`)
		throw err // 可选择抛出错误或处理
	}
}

// 发送日志函数
function sendLog(msg, percentage = null, isError = false) {
	if (global.editor && typeof global.editor.send === 'function') {
		global.editor.send('apk-log', {
			done: isError,
			msg: percentage !== null ? `[${percentage}%] ${msg}` : msg
		})
	}
}

// 主执行函数
async function main(options = {}) {
	// 如果正在构建中，拒绝新的构建请求
	if (isBuilding) {
		sendLog('当前已有构建任务正在进行中', null, false)
		return false
	}

	const { config: userConfig, onProgress, signal } = options
	// 合并默认配置和用户传入配置
	const config = { ...defaultConfig, ...userConfig }
	let currentProgress = 0
	abortController = new AbortController()
	isBuilding = true

	// 监听外部中止信号
	if (signal) {
		signal.addEventListener('abort', () => {
			abortBuild()
		})
	}

	try {
		sendLog('开始处理APK...')

		// 验证必要文件是否存在
		const requiredFiles = [
			{ path: config.apkPath, name: 'APK' },
			{ path: config.apktoolPath, name: 'apktool.jar' },
			{ path: config.iconPath, name: '图标' }
		]

		for (const file of requiredFiles) {
			if (!fileExists(file.path)) {
				sendLog(
					`${file.name}文件不存在: ${file.path}`,
					currentProgress,
					true
				)
				return false
			}
		}

		currentProgress = 5
		onProgress?.('文件验证通过', currentProgress)
		sendLog('文件验证通过', currentProgress)

		// 删除旧的反编译目录
		if (fs.existsSync(config.outputDir)) {
			await fs.promises.rm(config.outputDir, {
				recursive: true,
				force: true
			})
		}
		currentProgress += 5 // 10%
		onProgress?.('删除旧目录', currentProgress)
		sendLog('删除旧目录完成', currentProgress)

		// 反编译APK
		const decompileResult = await decompileApk(config)
		if (!decompileResult.success) {
			sendLog(decompileResult.error, currentProgress, true)
			return false
		}
		currentProgress += 15 // 25%
		onProgress?.('反编译APK完成', currentProgress)
		sendLog('反编译APK完成', currentProgress)

		// 修改AndroidManifest.xml
		const manifestResult = await modifyManifest(config)
		if (!manifestResult.success) {
			sendLog(manifestResult.error, currentProgress, true)
			return false
		}
		currentProgress += 10 // 35%
		onProgress?.('修改AndroidManifest.xml完成', currentProgress)
		sendLog('修改AndroidManifest.xml完成', currentProgress)

		// 修改所有语言的应用名称
		const stringsResult = await modifyStrings(config)
		if (!stringsResult.success) {
			sendLog(stringsResult.error, currentProgress, true)
			return false
		}
		currentProgress += 10 // 45%
		onProgress?.('修改应用名称完成', currentProgress)
		sendLog('修改应用名称完成', currentProgress)

		// 替换应用图标
		const iconsResult = await replaceIconsWithSharp(config)
		if (!iconsResult.success) {
			sendLog(iconsResult.error, currentProgress, true)
			return false
		}
		currentProgress += 15 // 60%
		onProgress?.('替换应用图标完成', currentProgress)
		sendLog('替换应用图标完成', currentProgress)

		// 完全移除圆形图标资源
		const roundIconsResult = await removeRoundIcons(config)
		if (!roundIconsResult.success) {
			sendLog(roundIconsResult.error, currentProgress, true)
			return false
		}
		currentProgress += 5 // 65%
		onProgress?.('移除圆形图标资源完成', currentProgress)
		sendLog('移除圆形图标资源完成', currentProgress)

		// 修复资源引用问题
		const resourceResult = await fixResourceReferences(config)
		if (!resourceResult.success) {
			sendLog(resourceResult.error, currentProgress, true)
			return false
		}
		currentProgress += 10 // 75%
		onProgress?.('修复资源引用完成', currentProgress)
		sendLog('修复资源引用完成', currentProgress)

		// 复制项目资源文件
		try {
			await copyFolderAsync(
				path.resolve(config.projectPath, '.preview'),
				path.resolve(config.outputDir, 'assets')
			)
			onProgress?.('资源合并完成', currentProgress)
			sendLog('资源合并完成', currentProgress)
		} catch (err) {
			sendLog(`资源合并失败: ${err.message}`, currentProgress, true)
			return false
		}

		// 重新编译APK
		const rebuildResult = await rebuildApk(config)
		if (!rebuildResult.success) {
			sendLog(rebuildResult.error, currentProgress, true)
			return false
		}
		currentProgress += 15 // 90%
		onProgress?.('重新编译APK完成', currentProgress)
		sendLog('重新编译APK完成', currentProgress)

		// 新增：执行zipalign对齐（关键步骤）
		const zipalignResult = await zipalignApk(config)
		if (!zipalignResult.success) {
			sendLog(zipalignResult.error, currentProgress, true)
			return false
		}
		currentProgress += 5 // 95%
		onProgress?.('APK对齐处理完成', currentProgress)
		sendLog('APK对齐处理完成', currentProgress)

		// 签名
		if (config.isSign) {
			const signResult = await signApk(config)
			if (!signResult.success) {
				sendLog(signResult.error, currentProgress, true)
				return false
			}
		}
		currentProgress = 100
		onProgress?.('APK处理完成', currentProgress)
		sendLog('APK处理完成', currentProgress)

		sendLog(
			`✅ APK修改完成! 新文件: ${config.signedApkPath}\n可以直接安装到设备`
		)
		return true
	} catch (err) {
		onProgress?.('处理失败: ' + err.message, currentProgress, true)
		sendLog(`处理失败: ${err.message}`, currentProgress, true)
		return false
	} finally {
		isBuilding = false
	}
}

// 反编译APK
async function decompileApk(config) {
	// console.log("开始反编译APK...");
	const cmd = `java -jar "${config.apktoolPath}" d "${config.apkPath}" -o "${config.outputDir}" -f --only-main-classes`

	return new Promise((resolve) => {
		const child = exec(cmd, (error, stdout, stderr) => {
			currentChildProcess = null
			if (error) {
				resolve({
					success: false,
					error: `反编译失败: ${error.stderr || error.message}`
				})
			} else {
				// console.log("反编译成功");
				resolve({ success: true })
			}
		})

		currentChildProcess = child

		// 监听中止信号
		abortController.signal.addEventListener('abort', () => {
			if (child) {
				child.kill('SIGINT')
				resolve({
					success: false,
					error: '构建已被用户中断'
				})
			}
		})
	})
}

// 修改AndroidManifest.xml
async function modifyManifest(config) {
	// console.log("修改包名、应用名称和版本信息...");
	const manifestPath = path.join(config.outputDir, 'AndroidManifest.xml')

	try {
		// 读取原始XML
		let xml = await fs.promises.readFile(manifestPath, 'utf8')

		// 【关键】直接通过字符串替换删除roundIcon属性
		xml = xml.replace(/android:roundIcon="[^"]*"/g, '')

		// 再通过XML解析器处理包名和其他属性
		const result = await parseXml(xml)
		result.manifest.$.package = config.packageName

		// 新增：设置版本名称和版本号
		if (config.versionName) {
			result.manifest.$['android:versionName'] = config.versionName
		}
		if (config.versionCode !== undefined) {
			result.manifest.$['android:versionCode'] =
				config.versionCode.toString()
		}
		// 确保application标签中只保留正确的icon引用和设置应用名称
		if (result.manifest.application) {
			const app = Array.isArray(result.manifest.application)
				? result.manifest.application[0]
				: result.manifest.application
			app.$.icon = '@mipmap/ic_launcher' // 强制指定主图标
			app.$['android:label'] = '@string/app_name' // 确保使用字符串资源中的名称
			delete app.$.roundIcon // 删除可能残留的roundIcon

			// 删除任何硬编码的应用名称
			if (
				app.$['android:label'] &&
				app.$['android:label'].startsWith('"')
			) {
				app.$['android:label'] = '@string/app_name'
			}
		}

		// 生成新XML并写入
		const builder = new Builder({ headless: true })
		const newXml = builder.buildObject(result)
		await fs.promises.writeFile(manifestPath, newXml)

		// 验证修改结果
		const modifiedXml = await fs.promises.readFile(manifestPath, 'utf8')
		// if (modifiedXml.includes("roundIcon")) {
		//   console.warn("警告：仍检测到roundIcon引用，可能未完全删除");
		// } else {
		//   console.log("AndroidManifest.xml中roundIcon引用已完全删除");
		// }

		// console.log("包名、应用名称和版本信息修改完成");
		return { success: true }
	} catch (err) {
		return {
			success: false,
			error: `修改AndroidManifest.xml失败: ${err.message}`
		}
	}
}

// 修改所有语言的应用名称
async function modifyStrings(config) {
	// console.log("修改所有语言的应用名称...");
	const resDir = path.join(config.outputDir, 'res')

	try {
		// 查找所有values目录
		const valuesDirs = await fs.promises.readdir(resDir, {
			withFileTypes: true
		})

		for (const dirent of valuesDirs) {
			if (dirent.isDirectory() && dirent.name.startsWith('values')) {
				const stringsPath = path.join(
					resDir,
					dirent.name,
					'strings.xml'
				)

				if (fileExists(stringsPath)) {
					await updateStringsFile(stringsPath, config)
				}
			}
		}

		// console.log("所有语言的应用名称修改完成");
		return { success: true }
	} catch (err) {
		return {
			success: false,
			error: `修改strings.xml失败: ${err.message}`
		}
	}
}

// 更新单个strings.xml文件
async function updateStringsFile(stringsPath, config) {
	try {
		const xml = await fs.promises.readFile(stringsPath, 'utf8')
		const result = await parseXml(xml)

		// 查找并替换app_name
		const resources = result.resources
		let found = false

		if (resources.string) {
			resources.string.forEach((item) => {
				if (item.$.name === 'app_name') {
					item._ = config.appName
					found = true
				} else if (item.$.name === 'title_activity_yami') {
					item._ = config.appName
				}
			})
		}

		// 如果没有找到app_name，创建一个
		if (!found) {
			if (!resources.string) resources.string = []
			resources.string.push({
				$: { name: 'app_name' },
				_: config.appName
			})
		}

		const builder = new Builder()
		const newXml = builder.buildObject(result)
		await fs.promises.writeFile(stringsPath, newXml)

		// console.log(`已更新: ${stringsPath}`);
	} catch (err) {
		// console.error(`更新 ${stringsPath} 失败: ${err.message}`);
		throw err
	}
}

// 使用sharp库安全替换应用图标
async function replaceIconsWithSharp(config) {
	console.log('使用sharp处理并替换应用图标...')

	try {
		const resDir = path.join(config.outputDir, 'res')
		if (!fs.existsSync(resDir)) {
			throw new Error('资源目录res不存在，可能反编译失败')
		}

		// 验证源图标文件
		if (!fileExists(config.iconPath)) {
			throw new Error(`源图标文件不存在: ${config.iconPath}`)
		}

		// 加载源图标并验证
		let sourceImage
		try {
			sourceImage = sharp(config.iconPath)
			const metadata = await sourceImage.metadata()
			if (!metadata.width || !metadata.height) {
				throw new Error('无法读取图标尺寸')
			}
			// console.log(`源图标尺寸: ${metadata.width}x${metadata.height}`);
		} catch (err) {
			throw new Error(`源图标文件无效: ${err.message}`)
		}

		// 查找所有图标目录（不包括anydpi目录）
		const iconDirs = Object.keys(ICON_SIZES)
			.map((dir) => path.join(resDir, dir))
			.filter((dir) => fs.existsSync(dir) && !dir.includes('anydpi'))

		if (iconDirs.length === 0) {
			throw new Error(
				'未找到任何图标目录（mipmap/drawable），无法替换图标'
			)
		}
		console.log(`找到图标目录: ${iconDirs.join(', ')}`)

		// 处理每个目录
		for (const dirPath of iconDirs) {
			// console.log(`处理目录: ${dirPath}`);

			// 获取目录对应的尺寸
			const dirName = path.basename(dirPath)
			const targetSize = ICON_SIZES[dirName] || 192 // 默认尺寸

			// 1. 删除旧图标（包括XML和PNG文件）
			const files = await fs.promises.readdir(dirPath)
			for (const file of files) {
				if (file.startsWith('ic_launcher')) {
					const filePath = path.join(dirPath, file)
					await fs.promises.unlink(filePath)
					// console.log(`已删除旧图标: ${filePath}`);
				}
			}

			// 2. 生成并保存新图标为PNG
			const destPath = path.join(dirPath, 'ic_launcher.png')

			// 生成对应尺寸的图标
			await sourceImage
				.resize(targetSize, targetSize, {
					fit: 'contain',
					background: { r: 0, g: 0, b: 0, alpha: 0 }
				})
				.toFile(destPath)
			// console.log(`已生成 ${targetSize}x${targetSize} 图标: ${destPath}`);
		}

		// 3. 删除anydpi目录中的自适应图标配置
		await removeAdaptiveIconConfigs(config)

		console.log('所有图标目录处理完成')
		return { success: true }
	} catch (err) {
		return {
			success: false,
			error: `替换图标失败: ${err.message}`
		}
	}
}

// 删除自适应图标配置文件
async function removeAdaptiveIconConfigs(config) {
	const resDir = path.join(config.outputDir, 'res')

	// 查找所有anydpi目录
	const dirs = await fs.promises.readdir(resDir)
	for (const dir of dirs) {
		if (dir.includes('anydpi')) {
			const anydpiPath = path.join(resDir, dir)

			// 删除ic_launcher.xml和ic_launcher_round.xml
			const files = await fs.promises.readdir(anydpiPath)
			for (const file of files) {
				if (
					file === 'ic_launcher.xml' ||
					file === 'ic_launcher_round.xml'
				) {
					const filePath = path.join(anydpiPath, file)
					await fs.promises.unlink(filePath)
					// console.log(`已删除自适应图标配置: ${filePath}`);
				}
			}
		}
	}
}

// 完全移除圆形图标资源
async function removeRoundIcons(config) {
	// console.log("移除圆形图标资源...");

	try {
		const resDir = path.join(config.outputDir, 'res')
		const resDirs = await fs.promises.readdir(resDir)

		for (const dir of resDirs) {
			const dirPath = path.join(resDir, dir)

			// 检查是否是图标目录
			if (dir.startsWith('drawable') || dir.startsWith('mipmap')) {
				if (!fs.existsSync(dirPath)) continue

				const files = await fs.promises.readdir(dirPath)

				// 删除所有圆形图标文件
				for (const file of files) {
					if (file.includes('_round')) {
						await fs.promises.unlink(path.join(dirPath, file))
						console.log(
							`已删除圆形图标: ${path.join(dirPath, file)}`
						)
					}
				}
			}
		}

		// console.log("圆形图标资源已移除");
		return { success: true }
	} catch (err) {
		return {
			success: false,
			error: `移除圆形图标失败: ${err.message}`
		}
	}
}

// 修复资源引用问题
async function fixResourceReferences(config) {
	// console.log("修复资源引用问题...");

	try {
		// 1. 清理public.xml中的无效引用
		const publicXmlPath = path.join(
			config.outputDir,
			'res',
			'values',
			'public.xml'
		)
		if (fs.existsSync(publicXmlPath)) {
			// console.log("清理 public.xml 中的无效引用...");
			await cleanPublicXml(publicXmlPath)
		}

		// 2. 处理styles.xml中的可能引用
		const stylesPath = path.join(
			config.outputDir,
			'res',
			'values',
			'styles.xml'
		)
		if (fs.existsSync(stylesPath)) {
			console.log('检查 styles.xml 中的圆形图标引用...')
			await cleanStylesXml(stylesPath)
		}

		// console.log("资源引用修复完成");
		return { success: true }
	} catch (err) {
		return {
			success: false,
			error: `修复资源引用失败: ${err.message}`
		}
	}
}

// 清理styles.xml中的圆形图标引用
async function cleanStylesXml(stylesPath) {
	const xml = await fs.promises.readFile(stylesPath, 'utf8')
	const result = await parseXml(xml)

	if (result.resources && result.resources.style) {
		// 检查所有style节点
		result.resources.style.forEach((style) => {
			if (style.$ && style.$.name === 'AppTheme') {
				// 移除可能存在的圆形图标引用
				if (style.item) {
					style.item = style.item.filter((item) => {
						return !(
							item.$.name === 'android:roundIcon' &&
							item._ === '@mipmap/ic_launcher_round'
						)
					})
				}
			}
		})
	}

	const builder = new Builder()
	const newXml = builder.buildObject(result)
	await fs.promises.writeFile(stylesPath, newXml)
}

// 清理 public.xml 中的无效引用
async function cleanPublicXml(publicXmlPath) {
	const xml = await fs.promises.readFile(publicXmlPath, 'utf8')
	const result = await parseXml(xml)

	if (result.resources && result.resources.public) {
		result.resources.public = result.resources.public.filter((item) => {
			const name = item.$.name
			const type = item.$.type

			// 只保留ic_launcher的资源映射，删除其他 launcher 相关资源
			if (
				name === 'ic_launcher' &&
				(type === 'mipmap' || type === 'drawable')
			) {
				return true // 保留新图标的资源映射
			}
			// 删除其他 launcher 相关资源（如ic_launcher_round）
			return !(
				name.includes('ic_launcher') &&
				(type === 'mipmap' || type === 'drawable')
			)
		})
	}

	const builder = new Builder()
	const newXml = builder.buildObject(result)
	await fs.promises.writeFile(publicXmlPath, newXml)
	// console.log("public.xml已更新，保留ic_launcher资源映射");
}

// 重新编译APK
async function rebuildApk(config) {
	console.log('重新编译APK...')
	const cmd = `java -jar "${config.apktoolPath}" b "${config.outputDir}" -o "${config.newApkPath}"`

	try {
		// console.log(`执行命令: ${cmd}`);
		const { stdout, stderr } = await execPromise(cmd)

		// 检查是否有警告或错误
		if (stderr && (stderr.includes('W:') || stderr.includes('error:'))) {
			// console.error("编译警告/错误:", stderr);

			// 不是所有警告都是致命的，所以尝试继续
			if (
				!stderr.includes('failed linking references') &&
				!stderr.includes('Exception in thread "main"')
			) {
				console.log('重新编译成功（有警告）')
				return { success: true }
			}

			return {
				success: false,
				error: `重新编译失败: ${stderr}`
			}
		}

		// console.log("重新编译成功");
		return { success: true }
	} catch (error) {
		// 提供更详细的错误信息
		const errorMsg =
			`重新编译失败: ${error.stderr || error.message}\n` +
			`可能原因:\n` +
			`1. 资源冲突(如图标格式不统一)\n` +
			`2. AndroidManifest.xml格式错误\n` +
			`3. 缺少依赖框架\n` +
			`4. public.xml 中的资源引用问题\n` +
			`建议: 检查反编译目录中的错误日志`
		return {
			success: false,
			error: errorMsg
		}
	}
}

// 对APK进行zipalign对齐处理（Android 11+要求）
async function zipalignApk(config) {
	console.log('执行zipalign对齐处理...')

	if (!fileExists(config.zipalignPath)) {
		return {
			success: false,
			error: `zipalign工具不存在: ${config.zipalignPath}`
		}
	}

	// 对齐后的临时文件路径
	const alignedTempPath = `${config.newApkPath}.aligned`

	// zipalign命令：-f 强制覆盖；4 按4字节对齐
	const cmd = `"${config.zipalignPath}" -f 4 "${config.newApkPath}" "${alignedTempPath}"`

	try {
		// console.log(`执行zipalign命令: ${cmd}`);
		const { stdout, stderr } = await execPromise(cmd)

		// 替换原始文件为对齐后的文件
		await fs.promises.unlink(config.newApkPath)
		await fs.promises.rename(alignedTempPath, config.newApkPath)

		console.log('✅ zipalign对齐处理完成')
		return { success: true }
	} catch (error) {
		return {
			success: false,
			error: `zipalign处理失败: ${error.stderr || error.message}`
		}
	}
}

// 签名APK
async function signApk(config) {
	// console.log("签名APK...");

	// 使用apksigner进行签名
	const signCmd = `${config.apksignerPath} sign --ks "${config.jksPath}" --ks-pass pass:"${config.keyStorePassword}" --key-pass pass:"${config.keyPassword}" --ks-key-alias ${config.keyAlias} --out "${config.signedApkPath}" "${config.newApkPath}"`

	// 备选方案：使用jarsigner
	const jarsignerCmd = `jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore "${config.jksPath}" -storepass "${config.keyStorePassword}" -keypass "${config.keyPassword}" "${config.newApkPath}" ${config.keyAlias}`

	try {
		// 首先尝试使用apksigner
		// console.log("使用apksigner进行签名...");
		// console.log(`执行命令: ${signCmd}`);
		const { stdout, stderr } = await execPromise(signCmd)
		// console.log("apksigner签名成功");
	} catch (apksignerError) {
		// console.warn("apksigner签名失败，尝试使用jarsigner...");

		try {
			// 如果apksigner失败，尝试使用jarsigner
			console.log(`执行命令: ${jarsignerCmd}`)
			const { stdout, stderr } = await execPromise(jarsignerCmd)

			// 将签名后的文件移动到最终位置
			await fs.promises.rename(config.newApkPath, config.signedApkPath)

			// console.log("jarsigner签名成功");
		} catch (jarsignerError) {
			return {
				success: false,
				error: `签名失败:\nAPKSigner错误: ${
					apksignerError.stderr || apksignerError.message
				}\nJarSigner错误: ${jarsignerError.stderr || jarsignerError.message}`
			}
		}
	}

	// 验证签名
	await verifySignature(config)
	return { success: true }
}

// 验证签名
async function verifySignature(config) {
	console.log('验证APK签名...')

	try {
		// 使用apksigner验证
		const verifyCmd = `${config.apksignerPath} verify -v "${config.signedApkPath}"`
		const { stdout, stderr } = await execPromise(verifyCmd)

		if (stdout.includes('Verified')) {
			console.log('✅ APK签名验证成功')
		} else {
			console.warn('⚠️ APK签名验证结果不确定')
		}
	} catch (error) {
		console.warn('无法验证签名:', error.message)
	}
}

// XML解析辅助函数
function parseXml(xml) {
	return new Promise((resolve, reject) => {
		parseString(xml, (err, result) => {
			if (err) reject(err)
			else resolve(result)
		})
	})
}

// 中断当前构建
function abortBuild() {
	if (!isBuilding) return false

	// console.log("正在中止构建任务...");
	abortController?.abort()

	// 终止当前子进程
	if (currentChildProcess) {
		currentChildProcess.kill('SIGINT')
		currentChildProcess = null
	}

	// 重置构建状态
	isBuilding = false
	return true
}

// 查询是否正在构建中
function isBuildingStatus() {
	return isBuilding
}

// 导出构建函数及方法
module.exports = {
	main,
	abortBuild,
	isBuilding: isBuildingStatus,
	decompileApk,
	modifyManifest,
	modifyStrings,
	replaceIconsWithSharp,
	removeRoundIcons,
	fixResourceReferences,
	rebuildApk,
	signApk,
	verifySignature,
	parseXml
}
