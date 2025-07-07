GL.drawSliceImage = function (texture, dx, dy, dw, dh, clip, border, tint) {
  if (!texture.complete) return

  // 计算变换矩阵
  const matrix = Matrix.instance.project(
    this.flip,
    this.width,
    this.height,
  ).multiply(this.matrix)
  .translate(dx + 0.004, dy + 0.004)

  // 更新切片数据
  const {sliceClip} = texture
  if (texture.sliceWidth !== dw ||
    texture.sliceHeight !== dh ||
    sliceClip[0] !== clip[0] ||
    sliceClip[1] !== clip[1] ||
    sliceClip[2] !== clip[2] ||
    sliceClip[3] !== clip[3] ||
    texture.sliceBorder !== border) {
    texture.updateSliceData(dw, dh, clip, border)
  }

  // 计算颜色
  const red = tint[0] / 255
  const green = tint[1] / 255
  const blue = tint[2] / 255
  const gray = tint[3] / 255

  // 绘制图像
  const program = this.imageProgram.use()
  const vertices = texture.sliceVertices
  const thresholds = texture.sliceThresholds
  const count = texture.sliceCount
  this.bindVertexArray(program.vao)
  this.uniformMatrix3fv(program.u_Matrix, false, matrix)
  this.uniform1i(program.u_LightMode, 0)
  this.uniform1i(program.u_ColorMode, 2)
  this.uniform4f(program.u_Tint, red, green, blue, gray)
  this.bufferData(this.ARRAY_BUFFER, vertices, this.STREAM_DRAW, 0, count * 16)
  this.bindTexture(this.TEXTURE_2D, texture.base.glTexture)

  // 绑定纹理并绘制图像
  for (let i = 0; i < count; i++) {
    const ti = i * 4
    const x = thresholds[ti]
    const y = thresholds[ti + 1]
    const w = thresholds[ti + 2]
    const h = thresholds[ti + 3]
    this.uniform4f(program.u_Repeat, x, y, w, h)
    this.drawArrays(this.TRIANGLE_FAN, i * 4, 4)
  }
}

// WebGL上下文方法 - 填充矩形