GL.bindFBO = function (fbo) {
  this.binding = fbo
  this.flip = 1
  this.bindFramebuffer(this.FRAMEBUFFER, fbo)
}

// WebGL上下文方法 - 解除帧缓冲对象的绑定