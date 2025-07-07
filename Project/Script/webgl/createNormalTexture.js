GL.createNormalTexture = function (options = {}) {
  const magFilter = options.magFilter ?? this.NEAREST
  const minFilter = options.minFilter ?? this.LINEAR
  const texture = new BaseTexture()
  texture.magFilter = magFilter
  texture.minFilter = minFilter
  texture.format = options.format ?? GL.RGBA
  this.bindTexture(this.TEXTURE_2D, texture.glTexture)
  this.texParameteri(this.TEXTURE_2D, this.TEXTURE_MAG_FILTER, magFilter)
  this.texParameteri(this.TEXTURE_2D, this.TEXTURE_MIN_FILTER, minFilter)
  this.texParameteri(this.TEXTURE_2D, this.TEXTURE_WRAP_S, this.CLAMP_TO_EDGE)
  this.texParameteri(this.TEXTURE_2D, this.TEXTURE_WRAP_T, this.CLAMP_TO_EDGE)
  this.textureManager.append(texture)
  return texture
}

// WebGL上下文方法 - 创建图像纹理