GL.fillRect = function (dx, dy, dw, dh, color) {
  const program = this.graphicProgram.use()
  const vertices = this.arrays[0].float32
  const colors = this.arrays[0].uint32

  // 计算变换矩阵
  const matrix = Matrix.instance.project(
    this.flip,
    this.width,
    this.height,
  ).multiply(this.matrix)

  // 计算顶点数据
  const dl = dx
  const dt = dy
  const dr = dx + dw
  const db = dy + dh
  vertices[0] = dl
  vertices[1] = dt
  colors  [2] = color
  vertices[3] = dl
  vertices[4] = db
  colors  [5] = color
  vertices[6] = dr
  vertices[7] = db
  colors  [8] = color
  vertices[9] = dr
  vertices[10] = dt
  colors  [11] = color

  // 绘制图像
  this.bindVertexArray(program.vao)
  this.uniformMatrix3fv(program.u_Matrix, false, matrix)
  this.bufferData(this.ARRAY_BUFFER, vertices, this.STREAM_DRAW, 0, 12)
  this.drawArrays(this.TRIANGLE_FAN, 0, 4)
}

// WebGL上下文方法 - 创建2D上下文对象(绘制文字专用画布)