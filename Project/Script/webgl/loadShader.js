GL.loadShader = function (type, source) {
  const shader = this.createShader(type)
  if (!shader) {
    console.error('Unable to create shader')
    return null
  }

  this.shaderSource(shader, source)
  this.compileShader(shader)
  if (!this.getShaderParameter(shader, this.COMPILE_STATUS)) {
    const error = this.getShaderInfoLog(shader)
    console.error(`Failed to compile shader: ${error}`)
    this.deleteShader(shader)
    return null
  }
  return shader
}

// WebGL上下文方法 - 创建图像程序