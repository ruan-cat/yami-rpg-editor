GL.drawImage = function drawImage() {
const defTint = new Uint8Array(4)
return function (texture, dx, dy, dw, dh, tint = defTint) {
  if (!texture.complete) return

  const program = this.imageProgram.use()
  const vertices = this.arrays[0].float32
  const base = texture.base
  const sx = texture.x
  const sy = texture.y
  const sw = texture.width
  const sh = texture.height
  const tw = base.width
  const th = base.height

  // 计算变换矩阵
  const matrix = Matrix.instance.project(
    this.flip,
    this.width,
    this.height,
  ).multiply(this.matrix)

  // 计算顶点数据
  const dl = dx + 0.004
  const dt = dy + 0.004
  const dr = dl + dw
  const db = dt + dh
  const sl = sx / tw
  const st = sy / th
  const sr = (sx + sw) / tw
  const sb = (sy + sh) / th
  vertices[0] = dl
  vertices[1] = dt
  vertices[2] = sl
  vertices[3] = st
  vertices[4] = dl
  vertices[5] = db
  vertices[6] = sl
  vertices[7] = sb
  vertices[8] = dr
  vertices[9] = db
  vertices[10] = sr
  vertices[11] = sb
  vertices[12] = dr
  vertices[13] = dt
  vertices[14] = sr
  vertices[15] = st

  // 色调归一化
  const red = tint[0] / 255
  const green = tint[1] / 255
  const blue = tint[2] / 255
  const gray = tint[3] / 255

  // 绘制图像
  this.bindVertexArray(program.vao)
  this.uniformMatrix3fv(program.u_Matrix, false, matrix)
  this.uniform1i(program.u_LightMode, 0)
  this.uniform1i(program.u_ColorMode, 0)
  this.uniform4f(program.u_Tint, red, green, blue, gray)
  this.bufferData(this.ARRAY_BUFFER, vertices, this.STREAM_DRAW, 0, 16)
  this.bindTexture(this.TEXTURE_2D, base.glTexture)
  this.drawArrays(this.TRIANGLE_FAN, 0, 4)
}
}()

// WebGL上下文方法 - 绘制指定颜色的图像