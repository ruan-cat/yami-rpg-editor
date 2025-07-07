GL.fillTextWithOutline = function fillTextWithOutline() {
  const offsets = [
    {ox: -1, oy:  0, rgba: 0},
    {ox:  1, oy:  0, rgba: 0},
    {ox:  0, oy: -1, rgba: 0},
    {ox:  0, oy:  1, rgba: 0},
    {ox:  0, oy:  0, rgba: 0},
  ]
  return function (text, x, y, color, shadow) {
    const context = this.context2d
    const size = context.size
    const measureWidth = context.measureText(text).width
    x -= measureWidth / 2
    const padding = Math.ceil(size / 10)
    const left = Math.floor(x)
    const ox = x - left
    const oy = size * 0.85
    const height = size + padding
    const width = Math.min(this.maxTexSize, Math.ceil(measureWidth + ox))
    if (x + width > 0 && x < this.width &&
      y + height > 0 && y < this.height) {
      const font = context.font
      context.resize(width, height)
      context.font = font
      context.fillStyle = '#ffffff'
      context.fillText(text, ox, oy)
      offsets[0].rgba = shadow
      offsets[1].rgba = shadow
      offsets[2].rgba = shadow
      offsets[3].rgba = shadow
      offsets[4].rgba = color
      const program = this.textProgram.use()
      const vertices = this.arrays[0].float32
      const colors = this.arrays[0].uint32
      const matrix = this.matrix.project(
        this.flip,
        this.width,
        this.height,
      )
      const a = matrix[0]
      const b = matrix[1]
      const c = matrix[3]
      const d = matrix[4]
      const e = matrix[6]
      const f = matrix[7]
      let vi = 0
      for (const {ox, oy, rgba} of offsets) {
        const L = left + ox
        const T = y + oy
        const R = L + width
        const B = T + height
        const dl = a * L + c * T + e
        const dt = b * L + d * T + f
        const dr = a * R + c * B + e
        const db = b * R + d * B + f
        vertices[vi    ] = dl
        vertices[vi + 1] = dt
        vertices[vi + 2] = 0
        vertices[vi + 3] = 0
        colors  [vi + 4] = rgba
        vertices[vi + 5] = dl
        vertices[vi + 6] = db
        vertices[vi + 7] = 0
        vertices[vi + 8] = 1
        colors  [vi + 9] = rgba
        vertices[vi + 10] = dr
        vertices[vi + 11] = db
        vertices[vi + 12] = 1
        vertices[vi + 13] = 1
        colors  [vi + 14] = rgba
        vertices[vi + 15] = dr
        vertices[vi + 16] = dt
        vertices[vi + 17] = 1
        vertices[vi + 18] = 0
        colors  [vi + 19] = rgba
        vi += 20
      }
      this.stencilTexture.fromImage(context.canvas)
      this.bindVertexArray(program.vao)
      this.bufferData(this.ARRAY_BUFFER, vertices, this.STREAM_DRAW, 0, vi)
      this.drawElements(this.TRIANGLES, 30, this.UNSIGNED_INT, 0)
    }
  }
}()

// WebGL上下文方法 - 创建普通纹理