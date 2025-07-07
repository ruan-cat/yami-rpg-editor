GL.createTextureFBO = function (texture) {
  const fbo = this.createFramebuffer()
  this.bindFramebuffer(this.FRAMEBUFFER, fbo)

  // 绑定纹理到颜色缓冲区
  this.framebufferTexture2D(this.FRAMEBUFFER, this.COLOR_ATTACHMENT0, this.TEXTURE_2D, texture.base.glTexture, 0)

  // 创建深度模板缓冲区
  const depthStencilBuffer = this.createRenderbuffer()
  this.bindRenderbuffer(this.RENDERBUFFER, depthStencilBuffer)
  this.framebufferRenderbuffer(this.FRAMEBUFFER, this.DEPTH_STENCIL_ATTACHMENT, this.RENDERBUFFER, depthStencilBuffer)
  this.renderbufferStorage(this.RENDERBUFFER, this.DEPTH_STENCIL, texture.base.width, texture.base.height)
  this.bindRenderbuffer(this.RENDERBUFFER, null)
  this.bindFramebuffer(this.FRAMEBUFFER, null)
  texture.depthStencilBuffer = depthStencilBuffer

  // 重写纹理方法 - 调整大小
  texture.resize = (width, height) => {
    Texture.prototype.resize.call(texture, width, height)

    // 调整深度模板缓冲区大小
    this.bindRenderbuffer(this.RENDERBUFFER, depthStencilBuffer)
    this.renderbufferStorage(this.RENDERBUFFER, this.DEPTH_STENCIL, width, height)
    this.bindRenderbuffer(this.RENDERBUFFER, null)
  }
  // 还需要一个方法来恢复
  return fbo
}

// 扩展方法 - 调整画布大小
CanvasRenderingContext2D.prototype.resize = function (width, height) {
  const canvas = this.canvas
  if (canvas.width === width &&
    canvas.height === height) {
    // 宽高不变时重置画布
    canvas.width = width
  } else {
    // 尽量少的画布缓冲区重置次数
    if (canvas.width !== width) {
      canvas.width = width
    }
    if (canvas.height !== height) {
      canvas.height = height
    }
  }
}

// ******************************** 基础纹理类 ********************************
