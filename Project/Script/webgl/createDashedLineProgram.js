GL.createDashedLineProgram = function () {
  const program = this.createProgramWithShaders(
    `
    attribute   vec2        a_Position;
    attribute   float       a_Distance;
    uniform     mat3        u_Matrix;
    varying     float       v_Distance;

    void main() {
      gl_Position.xyw = u_Matrix * vec3(a_Position, 1.0);
      v_Distance = a_Distance;
    }
    `,
    `
    precision   highp       float;
    const       float       REPEAT = 4.0;
    varying     float       v_Distance;
    uniform     float       u_Alpha;
    uniform     vec4        u_Color;

    void main() {
      float alpha = floor(2.0 * fract(v_Distance / REPEAT));
      gl_FragColor.rgb = u_Color.rgb;
      gl_FragColor.a = u_Color.a * alpha * u_Alpha;
    }
    `,
  )
  this.useProgram(program)

  // 顶点着色器属性
  const a_Position = this.getAttribLocation(program, 'a_Position')
  const a_Distance = this.getAttribLocation(program, 'a_Distance')
  const u_Matrix = this.getUniformLocation(program, 'u_Matrix')

  // 片元着色器属性
  const u_Alpha = this.getUniformLocation(program, 'u_Alpha')
  const u_Color = this.getUniformLocation(program, 'u_Color')

  // 创建顶点数组对象
  const vao = this.createVertexArray()
  this.bindVertexArray(vao)
  this.enableVertexAttribArray(a_Position)
  this.enableVertexAttribArray(a_Distance)
  this.bindBuffer(this.ARRAY_BUFFER, this.vertexBuffer)
  this.vertexAttribPointer(a_Position, 2, this.FLOAT, false, 12, 0)
  this.vertexAttribPointer(a_Distance, 1, this.FLOAT, false, 12, 8)

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
  program.a_Distance = a_Distance
  program.u_Matrix = u_Matrix
  program.u_Color = u_Color
  return program
}

// WebGL上下文方法 - 重置状态