GL.setViewport = function (x, y, width, height) {
  this.width = width
  this.height = height
  this.viewport(x, y, width, height)
}

// 重置视口大小