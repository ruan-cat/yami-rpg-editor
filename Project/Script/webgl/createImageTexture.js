GL.createImageTexture = function (image, options = {}) {
  const magFilter = options.magFilter ?? this.NEAREST
  const minFilter = options.minFilter ?? this.LINEAR
  const guid = image instanceof Image ? image.guid : image
  const manager = this.textureManager
  let texture = manager.images[guid]
  if (!texture) {
    texture = new BaseTexture()
    texture.guid = guid
    texture.image = null
    texture.refCount = 0
    texture.magFilter = magFilter
    texture.minFilter = minFilter
    manager.append(texture)
    manager.images[guid] = texture
    const initialize = image => {
      if (manager.images[guid] === texture && image) {
        texture.image = image
        texture.width = Math.min(image.naturalWidth, this.maxTexSize)
        texture.height = Math.min(image.naturalHeight, this.maxTexSize)
        this.bindTexture(this.TEXTURE_2D, texture.glTexture)
        this.texParameteri(this.TEXTURE_2D, this.TEXTURE_MAG_FILTER, magFilter)
        this.texParameteri(this.TEXTURE_2D, this.TEXTURE_MIN_FILTER, minFilter)
        this.texParameteri(this.TEXTURE_2D, this.TEXTURE_WRAP_S, this.CLAMP_TO_EDGE)
        this.texParameteri(this.TEXTURE_2D, this.TEXTURE_WRAP_T, this.CLAMP_TO_EDGE)
        this.texImage2D(this.TEXTURE_2D, 0, this.RGBA, texture.width, texture.height, 0, this.RGBA, this.UNSIGNED_BYTE, image)
        texture.reply('load')
      } else {
        texture.reply('error')
      }
    }
    image instanceof Image
    ? initialize(image)
    : File.get({
      guid: guid,
      type: 'image',
    }).then(initialize)
  }
  texture.refCount++
  return texture
}

// WebGL上下文方法 - 创建纹理帧缓冲对象