GL.resetViewport = function () {
  const width = this.drawingBufferWidth
  const height = this.drawingBufferHeight
  this.width = width
  this.height = height
  this.viewport(0, 0, width, height)
}

// WebGL上下文方法 - 调整画布大小