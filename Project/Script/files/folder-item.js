'use strict'

class FolderItem {
  name        //:string
  path        //:string
  stats       //:object
  parent      //:object
  children    //:array
  subfolders  //:array
  contexts    //:object

  constructor(name, path, parent) {
    this.name = name
    this.path = path
    this.stats = null
    this.parent = parent
    this.children = Array.empty
    this.subfolders = Array.empty
    this.contexts = null
  }

  // 获取上下文对象
  getContext(key) {
    let contexts = this.contexts
    if (contexts === null) {
      contexts = this.contexts = new Map()
    }
    let context = contexts.get(key)
    if (context === undefined) {
      contexts.set(key, context = {
        expanded: false,
      })
    }
    return context
  }

  // 更新目录
  async update(context = {changed: false, promises: []}) {
    const bigint = FolderItem.bigint
    const path = File.route(this.path)
    const pStat = FSP.stat(path, bigint)
    const pReaddir = this.readdir(context)
    const stats = await pStat
    if (this.stats?.mtimeMs !== stats.mtimeMs) {
      context.changed = true
    }
    this.stats = stats
    await pReaddir
    return context
  }

  // 读取目录
  async readdir(context) {
    // 创建旧的文件集合
    const map = {}
    const nodes = this.children
    if (nodes instanceof Array) {
      const length = nodes.length
      for (let i = 0; i < length; i++) {
        const item = nodes[i]
        map[item.path] = item
      }
    }

    // 读取新的文件目录
    const dir = this.path
    const path = File.route(dir)
    const files = await FSP.readdir(
      path, {withFileTypes: true},
    )
    const length = files.length
    const promises = new Array(length)
    const children = []
    const subfolders = []
    const bigint = FolderItem.bigint
    for (let i = 0; i < length; i++) {
      const file = files[i]
      const name = file.name
      const path = `${dir}/${name}`
      if (file.isDirectory()) {
        let item = map[path]
        if (!(item instanceof FolderItem)) {
          item = new FolderItem(name, path, this)
          context.changed = true
        }
        promises[i] = item.update(context)
        children.push(item)
        subfolders.push(item)
      } else {
        // 跳过MacOS隐藏文件
        if (name === '.DS_Store') {
          continue
        }
        const promise = FSP.stat(File.route(path), bigint)
        promise.path = path
        promises[i] = promise
      }
    }

    // 获取未改变的项目
    // 以及创建新的项目
    const {extnameToTypeMap} = FolderItem
    for (let i = 0; i < length; i++) {
      const promise = promises[i]
      const response = await promise
      // 跳过文件夹Promise
      if (promise?.path === undefined) {
        continue
      }
      const path = promise.path
      const stats = response
      let item = map[path]
      if (item === undefined ||
        item.stats.mtimeMs !== stats.mtimeMs) {
        const name = files[i].name
        const extname = Path.extname(name)
        const type = extnameToTypeMap[extname.toLowerCase()] ?? 'other'
        try {
          item = new FileItem(name, extname, path, type, stats)
          if (item.promise instanceof Promise) {
            context.promises.push(item.promise.finally(() => {
              delete item.promise
            }))
          }
        } catch (error) {
          console.warn(error)
          continue
        }
      }
      // 更新文件元数据版本，如果版本一致则已经被占用
      if (item.meta.versionId !== Meta.versionId) {
        item.meta.versionId = Meta.versionId
        children.push(item)
        context.changed = true
      }
    }
    this.children = children
    this.subfolders = subfolders
  }

  // 静态 - 扩展名 -> 类型映射表
  static extnameToTypeMap = {
    // 数据类型
    '.actor': 'actor',
    '.skill': 'skill',
    '.trigger': 'trigger',
    '.item': 'item',
    '.equip': 'equipment',
    '.state': 'state',
    '.event': 'event',
    '.scene': 'scene',
    '.tile': 'tileset',
    '.ui': 'ui',
    '.anim': 'animation',
    '.particle': 'particle',
    // 图像类型
    '.png': 'image',
    '.jpg': 'image',
    '.jpeg': 'image',
    '.cur': 'image',
    '.webp': 'image',
    // 音频类型
    '.mp3': 'audio',
    '.m4a': 'audio',
    '.ogg': 'audio',
    '.wav': 'audio',
    '.flac': 'audio',
    // 视频类型
    '.mp4': 'video',
    '.mkv': 'video',
    '.webm': 'video',
    // 脚本类型
    '.js': 'script',
    '.ts': 'script',
    // 字体类型
    '.ttf': 'font',
    '.otf': 'font',
    '.woff': 'font',
    '.woff2': 'font',
  }

  // FSP.stat选项 - 64位整数
  // 默认类型的stats因为精度问题可能产生相同的ino
  static bigint = {bigint: true}

  // 静态方法 - 创建项目
  static async create(path) {
    const name = Path.basename(path)
    const item = new FolderItem(name, path, null)
    return item
  }
} 