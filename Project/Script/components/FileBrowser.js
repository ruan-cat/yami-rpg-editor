class FileBrowser extends HTMLElement {
  display       //:string
  directory     //:array
  dragging      //:event
  filters       //:array
  backupFolders //:array
  searchResults //:array
  nav           //:element
  head          //:element
  body          //:element
  links         //:array

  constructor() {
    super()

    // 设置属性
    this.display = 'normal'
    this.directory = null
    this.dragging = null
    this.filters = null
    this.keyword = null
    this.backupFolders = []
    this.searchResults = []
    this.nav = document.createElement('file-nav-pane')
    this.head = document.createElement('file-head-pane')
    this.body = document.createElement('file-body-pane')
    this.appendChild(this.nav)
    this.appendChild(this.head)
    this.appendChild(this.body)

    // 创建链接对象
    Promise.resolve().then(() => {
      const browser = this
      const nav = this.nav
      const head = this.head
      const body = this.body
      const links = {
        browser,
        nav,
        head,
        body,
      }
      this.links = links
      nav.links = links
      head.links = links
      body.links = links
    })

    // 侦听事件
    this.on('pointerdown', this.pointerdown)
    this.on('dragstart', this.dragstart)
    this.on('dragend', this.dragend)
    window.on('os-dragstart', this.osDragstart.bind(this))
    window.on('os-dragend', this.osDragend.bind(this))
    window.on('dirchange', this.dirchange.bind(this))
  }

  // 更新目录列表
  update() {
    this.body.updateFiles()
    this.head.updateAddress()
  }

  // 搜索文件: regexp or string
  searchFiles(keyword) {
    const {nav} = this
    if (keyword instanceof RegExp || keyword.length !== 0) {
      if (this.display === 'normal') {
        this.display = 'search'
        this.backupFolders = nav.selections
        nav.unselect()
      }
      if (typeof keyword === 'string') {
        keyword = keyword.replace(/[(){}\\^$*+?.|[\]]/g, '\\$&')
        keyword = new RegExp(keyword, 'i')
      }
      Directory.searchFiles(
        this.filters,
        this.keyword = keyword,
        this.directory,
        this.searchResults = [],
      )
      this.update()
    } else {
      if (this.display === 'search') {
        this.display = 'normal'
        nav.load(...this.backupFolders)
        this.keyword = null
        this.backupFolders = []
        this.searchResults = []
      }
    }
  }

  // 恢复显示模式
  restoreDisplay() {
    switch (this.display) {
      case 'normal':
        break
      case 'search':
        this.display = 'normal'
        this.backupFolders = []
        this.searchResults = []
        this.head.searcher.write('')
        break
    }
  }

  // 返回上一级目录
  backToParentFolder() {
    switch (this.display) {
      case 'normal': {
        const {nav} = this
        const folders = nav.selections
        if (folders.length === 1) {
          const path = folders[0].path
          const index = path.lastIndexOf('/')
          if (index !== -1) {
            nav.load(Directory.getFolder(
              path.slice(0, index)
            ))
            return true
          }
        }
        return false
      }
      case 'search': {
        const active = document.activeElement
        this.head.searcher.deleteInputContent()
        active.focus()
        return true
      }
    }
  }

  // 目录改变事件
  dirchange(event) {
    switch (this.display) {
      case 'normal':
        break
      case 'search':
        this.searchFiles(this.keyword)
        break
    }
    const body = this.body
    const files = Array.from(body.selections)
    if (files.length !== 0) {
      const {inoMap} = Directory
      let modified = false
      let i = files.length
      while (--i >= 0) {
        const sFile = files[i]
        const ino = sFile.stats.ino
        const dFile = inoMap[ino]
        if (sFile !== dFile) {
          modified = true
          if (dFile) {
            files[i] = dFile
          } else {
            files.splice(i, 1)
          }
        }
      }
      if (modified) {
        body.select(...files)
      }
    }
  }

  // 关闭
  close() {
    if (this.directory) {
      this.directory = null
      this.restoreDisplay()
      this.nav.clear()
      this.head.address.clear()
      this.body.clear()
    }
  }

  // 获取活动页面
  getActivePage(event) {
    const {nav, body} = this
    return nav.contains(event.target)  ? nav
         : body.contains(event.target) ? body
         : null
  }

  // 获取绝对路径列表
  getFilePaths(files) {
    const relativePaths = files.map(file => file.path)
    const absolutePaths = relativePaths.map(path => File.route(path))
    return {relativePaths, absolutePaths}
  }

  // 指针按下事件
  pointerdown(event) {
    // 如果丢失dragend事件，手动结束
    switch (this.dragging?.mode) {
      case 'drag': return this.dragend()
      case 'os-drag': return this.osDragend()
    }
  }

  // 拖拽开始事件
  dragstart(event) {
    const page = this.getActivePage(event)
    if (page && !this.dragging) {
      if (page.pressing) {
        page.pressing = null
      }
      const files = page.activeFile ? [page.activeFile] : page.selections
      if (!files.includes(Directory.assets) && !page.textBox.parentNode) {
        const {relativePaths, absolutePaths} = this.getFilePaths(files)
        this.dragging = event
        event.mode = 'drag'
        event.preventDefault = Function.empty
        event.allowMove = false
        event.allowCopy = false
        event.dragLeaved = false
        event.dropTarget = null
        event.dropPath = null
        event.dropMode = null
        event.page = page
        event.files = files
        event.filePaths = relativePaths
        event.promise = Directory.readdir(absolutePaths)
        event.promise.then(dir => {
          // 若文件已删除则结束拖拽
          if (dir.length === 0) {
            this.dragend()
          }
        })
        event.dataTransfer.effectAllowed = 'copyMove'
        event.dataTransfer.hideDragImage()
        this.on('dragenter', this.dragover)
        this.on('dragleave', this.dragleave)
        this.on('dragover', this.dragover)
        this.on('drop', this.drop)
        if (files.length === 1 && files[0] instanceof FileItem) {
          const name = files[0].basename + files[0].extname
          event.dataTransfer.setData('DownloadURL',
            `application/octet-stream:${name}:${absolutePaths[0]}`
          )
        }
      }
    }
  }

  // 拖拽结束事件
  dragend(event) {
    if (this.dragging) {
      const {dropTarget, page} = this.dragging
      if (dropTarget instanceof HTMLElement) {
        dropTarget.removeClass('drop-target')
      }
      // 取消激活文件
      if (this.dragging.dragLeaved) {
        page.deactivateFile?.()
      } else {
        page.selectActiveFile?.()
      }
      this.dragging = null
      this.off('dragenter', this.dragover)
      this.off('dragleave', this.dragleave)
      this.off('dragover', this.dragover)
      this.off('drop', this.drop)
    }
  }

  // 拖拽离开事件
  dragleave(event) {
    const {dragging} = this
    if (dragging?.dropTarget &&
      !this.contains(event.relatedTarget)) {
      dragging.dropTarget.removeClass('drop-target')
      dragging.dropTarget = null
      // 排除drop时触发的dragleave事件
      if (event.relatedTarget) {
        dragging.dragLeaved = true
      }
    }
  }

  // 拖拽悬停事件
  dragover(event) {
    const {dragging} = this
    if (dragging) {
      const {dropTarget} = dragging
      let element = event.target
      if (!dragging.allowCopy &&
        !dragging.target.contains(element)) {
        dragging.allowCopy = true
      }
      while (!(
        element instanceof FileBrowser ||
        element instanceof FileNavPane ||
        element instanceof FileBodyPane ||
        element.file instanceof FolderItem)) {
        element = element.parentNode
      }
      if (dropTarget !== element) {
        if (dropTarget instanceof HTMLElement) {
          dropTarget.removeClass('drop-target')
        }
        dragging.allowMove = false
        dragging.dropTarget = element
        if (element.file instanceof FolderItem) {
          element.addClass('drop-target')
          dragging.dropPath = element.file.path
          dragging.promise.then(dir => {
            const {path} = element.file
            const {filePaths} = dragging
            for (const filePath of filePaths) {
              if (path === filePath ||
                path.indexOf(filePath) === 0 &&
                path[filePath.length] === '/') {
                return true
              }
            }
            return Directory.existFiles(path, dir)
          }).then(existed => {
            if (!existed &&
              dragging.dropTarget === element) {
              dragging.allowMove = true
            }
          })
        } else {
          if (element instanceof FileBodyPane) {
            const {selections} = this.nav
            dragging.dropPath =
              selections.length === 1
            ? selections[0].path
            : null
          } else {
            dragging.dropPath = null
          }
        }
      }
      if (!dragging.dropPath) {
        return
      }
      if (event.cmdOrCtrlKey) {
        if (dragging.allowCopy) {
          dragging.dropMode = 'copy'
          event.dataTransfer.dropEffect = 'copy'
          event.preventDefault()
        }
      } else {
        if (dragging.allowMove) {
          dragging.dropMode = 'move'
          event.dataTransfer.dropEffect = 'move'
          event.preventDefault()
        }
      }
    }
  }

  // 拖拽释放事件
  drop(event) {
    const {dragging} = this
    if (dragging) {
      event.stopPropagation()
      if (!dragging.dropPath) return
      const dropPath = File.route(dragging.dropPath)
      const dropName = Path.basename(dropPath)
      const get = Local.createGetter('menuFileOnDrop')

      // 创建菜单选项
      const menuItems = []
      switch (dragging.dropMode) {
        case 'move':
          menuItems.push({
            label: get('moveTo').replace('<dirName>', dropName),
            click: () => {
              dragging.promise.then(
                dir => Directory.moveFiles(dropPath, dir)
              ).finally(() => {
                Directory.update()
              })
            }
          })
          break
        case 'copy':
          menuItems.push({
            label: get('copyTo').replace('<dirName>', dropName),
            click: () => {
              dragging.promise.then(
                dir => Directory.saveFiles(dragging.files).then(
                  () => Directory.copyFiles(dropPath, dir))
              ).finally(() => {
                Directory.update()
              })
            }
          })
          break
      }

      // 弹出菜单
      Menu.popup({
        x: event.clientX,
        y: event.clientY,
      }, menuItems)

      // 创建项目后不能触发拖拽结束事件
      this.dragend()
    }
  }

  // 操作系统 - 拖拽开始事件
  osDragstart(event) {
    if (!this.dragging) {
      this.dragging = event
      event.mode = 'os-drag'
      event.dropTarget = null
      event.dropPath = null
      this.on('dragenter', this.osDragover)
      this.on('dragleave', this.osDragleave)
      this.on('dragover', this.osDragover)
      this.on('drop', this.osDrop)
    }
  }

  // 操作系统 - 拖拽结束事件
  osDragend(event) {
    if (this.dragging) {
      const {dropTarget} = this.dragging
      if (dropTarget instanceof HTMLElement) {
        dropTarget.removeClass('drop-target')
      }
      this.dragging = null
      this.off('dragenter', this.osDragover)
      this.off('dragleave', this.osDragleave)
      this.off('dragover', this.osDragover)
      this.off('drop', this.osDrop)
    }
  }

  // 操作系统 - 拖拽离开事件
  osDragleave(event) {
    return this.dragleave(event)
  }

  // 操作系统 - 拖拽悬停事件
  osDragover(event) {
    const {dragging} = this
    if (dragging) {
      const {dropTarget} = dragging
      let element = event.target
      while (!(
        element instanceof FileBrowser ||
        element instanceof FileNavPane ||
        element instanceof FileBodyPane ||
        element.file instanceof FolderItem)) {
        element = element.parentNode
      }
      if (dropTarget !== element) {
        if (dropTarget instanceof HTMLElement) {
          dropTarget.removeClass('drop-target')
        }
        dragging.dropTarget = element
        if (element.file instanceof FolderItem) {
          element.addClass('drop-target')
          dragging.dropPath = element.file.path
        } else {
          if (element instanceof FileBodyPane) {
            const {selections} = this.nav
            dragging.dropPath =
              selections.length === 1
            ? selections[0].path
            : null
          } else {
            dragging.dropPath = null
          }
        }
      }
      if (dragging.dropPath) {
        event.preventDefault()
        event.dataTransfer.dropEffect = 'copy'
      }
    }
  }

  // 操作系统 - 拖拽释放事件
  osDrop(event) {
    const {files} = event.dataTransfer
    if (files.length === 0) {
      return
    }
    const {dragging} = this
    if (dragging) {
      let {dropPath} = dragging
      if (!dropPath) return
      dropPath = File.route(dropPath)
      const map = Array.prototype.map
      const paths = map.call(files, file => file.path)
      Directory.readdir(paths).then(dir => {
        return Directory.copyFiles(dropPath, dir, '')
      }).finally(() => {
        Directory.update()
      })
    }
  }
}

customElements.define('file-browser', FileBrowser)

// ******************************** 文件导航面板 ********************************
