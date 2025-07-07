GL.updateLightTexSize = function () {
  const texture = this.reflectedLightMap
  if (texture.width === 0) return
  const width = this.drawingBufferWidth
  const height = this.drawingBufferHeight
  const sizeX = texture.width / width * 2
  const sizeY = texture.height / height * 2
  const centerX = (texture.paddingLeft + width / 2) / texture.width
  const centerY = (texture.paddingTop + height / 2) / texture.height
  const program = this.program
  for (const program of [
    this.imageProgram,
    this.tileProgram,
    this.spriteProgram,
    this.particleProgram,
  ]) {
    this.useProgram(program)
    this.uniform4f(program.u_LightTexSize, sizeX, sizeY, centerX, centerY)
  }
  this.useProgram(program)
}

// WebGL上下文方法 - 更新采样器数量
// 避免chrome 69未绑定纹理警告