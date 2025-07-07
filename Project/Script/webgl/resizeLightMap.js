GL.resizeLightMap = function () {
  const width = this.width
  const height = this.height
  const texture = this.reflectedLightMap
  if (texture.innerWidth !== width ||
    texture.innerHeight !== height) {
    texture.innerWidth = width
    texture.innerHeight = height
    if (texture.paddingLeft === undefined) {
      const {lightArea} = Data.config
      // 计算光影纹理最大扩张值(4倍)
      // 避免频繁调整纹理尺寸
      texture.paddingLeft = Math.min(lightArea.expansionLeft * 4, 1024)
      texture.paddingTop = Math.min(lightArea.expansionTop * 4, 1024)
      texture.paddingRight = Math.min(lightArea.expansionRight * 4, 1024)
      texture.paddingBottom = Math.min(lightArea.expansionBottom * 4, 1024)
    }
    const pl = texture.paddingLeft
    const pt = texture.paddingTop
    const pr = texture.paddingRight
    const pb = texture.paddingBottom
    const tWidth = width + pl + pr
    const tHeight = height + pt + pb
    texture.scaleX = 0
    texture.scaleY = 0
    texture.resize(tWidth, tHeight)
    this.bindTexture(this.TEXTURE_2D, null)
    this.updateLightTexSize()
  }
}

// WebGL上下文方法 - 更新光照纹理大小