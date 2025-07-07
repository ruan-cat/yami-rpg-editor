GL.restore = function () {
  const {ambient} = this
  this.textureManager.restore()
  this.initialize()
  this.setAmbientLight(ambient)
  this.updateLightTexSize()
}

// WebGL上下文方法 - 初始化