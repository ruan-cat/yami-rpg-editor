GL.resize = function (width, height) {
  const canvas = this.canvas
  if (canvas.width !== width) {
    canvas.width = width
  }
  if (canvas.height !== height) {
    canvas.height = height
  }
  if (this.binding === null && (
    this.width !== width ||
    this.height !== height)) {
    this.width = width
    this.height = height
    this.viewport(0, 0, width, height)
    this.maskTexture.resize(width, height)
    this.directLightMap.resize(width, height)
  }
}

// WebGL上下文方法 - 绘制图像