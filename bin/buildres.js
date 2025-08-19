#!/usr/bin/env node
const fs = require('fs')
const archiver = require('archiver')
const path = require('path')
const crypto = require('crypto')

async function calculateMultipleHashes(
	filePath,
	algorithms = ['md5', 'sha1', 'sha256']
) {
	return new Promise((resolve, reject) => {
		if (!fs.existsSync(filePath)) {
			return reject(new Error(`文件不存在: ${filePath}`))
		}

		const hashes = {}
		const hashObjects = {}

		algorithms.forEach((algo) => {
			hashObjects[algo] = crypto.createHash(algo)
		})

		const stream = fs.createReadStream(filePath)

		stream.on('data', (chunk) => {
			algorithms.forEach((algo) => {
				hashObjects[algo].update(chunk)
			})
		})

		stream.on('end', () => {
			algorithms.forEach((algo) => {
				hashes[algo] = hashObjects[algo].digest('hex')
			})
			resolve(hashes)
		})

		stream.on('error', reject)
	})
}

const packageJson = {
	'arpg-ts-chinese': '1.0.0',
	'arpg-ts-english': '1.0.0',
	'arpg-ts-update': '1.0.0',
	'electron-mac-universal.app': '1.0.0',
	'electron-win-x64': '1.0.0',
	script: '1.0.0'
}

const tempaltePath = 'Project/Templates'

const resArray = fs
	.readdirSync(tempaltePath)
	.filter((v) => fs.statSync(path.resolve(tempaltePath, v)).isDirectory())
	.map((v) => ({
		path: v,
		realPath: path.resolve(tempaltePath, v),
		version: packageJson[v]
	}))

async function zipFolder(sourceDir, outPath) {
	return new Promise((resolve, reject) => {
		if (!fs.existsSync(sourceDir)) {
			return reject(new Error(`源目录不存在: ${sourceDir}`))
		}

		const outputDir = path.dirname(outPath)
		if (!fs.existsSync(outputDir)) {
			fs.mkdirSync(outputDir, { recursive: true })
		}

		const output = fs.createWriteStream(outPath)
		const archive = archiver('zip', {
			zlib: { level: 9 }
		})

		output.on('close', () => {
			console.log(`✅ 打包完成: ${archive.pointer()} 字节`)
			resolve()
		})

		archive.on('error', (err) => reject(err))
		archive.pipe(output)
		archive.directory(sourceDir, false)
		archive.finalize()
	})
}

const zipBuild = async (src, targetSrc) => {
	try {
		await zipFolder(src, targetSrc)
	} catch (err) {
		console.error('❌ 打包失败:', err)
	}
}

;(async () => {
	const promiseArray = resArray.map(async (v) => {
		console.log(`⌛ 开始处理: ${v.path}`)
		await zipBuild(
			v.realPath,
			path.resolve('build', 'resources', `${v.path}_pack.zip`)
		)
	})

	await Promise.all(promiseArray)

	const packageArray = await Promise.all(
		resArray.map(async (v) => {
			const zipPath = path.resolve(
				'build',
				'resources',
				`${v.path}_pack.zip`
			)
			return {
				...v,
				...(await calculateMultipleHashes(zipPath, [
					'md5',
					'sha1',
					'sha256'
				]))
			}
		})
	)

	console.log('📦 打包完成！')
	fs.writeFileSync('pack.json', JSON.stringify(packageArray, null, 2))
})()
