GL.createGraphicProgram = function () {
  const program = this.createProgramWithShaders(
    `
    attribute   vec2        a_Position;
    attribute   vec4        a_Color;
    uniform     mat3        u_Matrix;
    varying     vec4        v_Color;

    void main() {
      gl_Position.xyw = u_Matrix * vec3(a_Position, 1.0);
      v_Color = a_Color;
    }
    `,
    `
    precision   highp       float;
    varying     vec4        v_Color;
    uniform     float       u_Alpha;

    void main() {
      gl_FragColor.rgb = v_Color.rgb;
      gl_FragColor.a = v_Color.a * u_Alpha;
    }
    `,
  )
  this.useProgram(program)

  // 顶点着色器属性
  const a_Position = this.getAttribLocation(program, 'a_Position')
  const a_Color = this.getAttribLocation(program, 'a_Color')
  const u_Matrix = this.getUniformLocation(program, 'u_Matrix')

  // 片元着色器属性
  const u_Alpha = this.getUniformLocation(program, 'u_Alpha')

  // 创建顶点数组对象
  const vao = this.createVertexArray()
  this.bindVertexArray(vao)
  this.enableVertexAttribArray(a_Position)
  this.enableVertexAttribArray(a_Color)
  this.bindBuffer(this.ARRAY_BUFFER, this.vertexBuffer)
  this.vertexAttribPointer(a_Position, 2, this.FLOAT, false, 12, 0)
  this.vertexAttribPointer(a_Color, 4, this.UNSIGNED_BYTE, true, 12, 8)
  this.bindBuffer(this.ELEMENT_ARRAY_BUFFER, this.elementBuffer)

  // 创建顶点数组对象 - 属性[10]
  // 注意：未启用的属性不能初始化赋值一次
  // 因为：gl.vertexAttrib1f方法会影响到其他program
  vao.a10 = this.createVertexArray()
  this.bindVertexArray(vao.a10)
  this.enableVertexAttribArray(a_Position)
  this.bindBuffer(this.ARRAY_BUFFER, this.vertexBuffer)
  this.vertexAttribPointer(a_Position, 2, this.FLOAT, false, 0, 0)
  this.bindBuffer(this.ELEMENT_ARRAY_BUFFER, this.elementBuffer)

  // 使用程序对象
  const use = () => {
    if (this.program !== program) {
      this.program = program
      this.useProgram(program)
    }
    if (program.alpha !== this.alpha) {
      program.alpha = this.alpha
      this.uniform1f(u_Alpha, program.alpha)
    }
    this.updateBlending()
    return program
  }

  // 保存程序对象
  program.use = use
  program.vao = vao
  program.alpha = 0
  program.a_Position = a_Position
  program.a_Color = a_Color
  program.u_Matrix = u_Matrix
  return program
}

// WebGL上下文方法 - 创建虚线程序