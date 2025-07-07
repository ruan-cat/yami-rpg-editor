GL.createProgramWithShaders = function (vshader, fshader) {
  const vertexShader = this.loadShader(this.VERTEX_SHADER, vshader)
  const fragmentShader = this.loadShader(this.FRAGMENT_SHADER, fshader)
  if (!vertexShader || !fragmentShader) {
    return null
  }

  const program = this.createProgram()
  if (!program) {
    console.error('Failed to create program')
    return null
  }

  this.attachShader(program, vertexShader)
  this.attachShader(program, fragmentShader)
  this.linkProgram(program)
  if (!this.getProgramParameter(program, this.LINK_STATUS)) {
    const error = this.getProgramInfoLog(program)
    console.error(`Failed to link program: ${error}`)
    this.deleteProgram(program)
    this.deleteShader(fragmentShader)
    this.deleteShader(vertexShader)
    return null
  }
  return program
}

// WebGL上下文方法 - 加载着色器