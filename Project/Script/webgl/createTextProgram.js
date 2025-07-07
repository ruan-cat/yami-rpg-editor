GL.createTextProgram = function () {
  const program = this.createProgramWithShaders(
    `
    attribute   vec2        a_Position;
    attribute   vec2        a_TexCoord;
    attribute   vec4        a_TextColor;
    varying     vec2        v_TexCoord;
    varying     vec4        v_TextColor;

    void main() {
      gl_Position.xyw = vec3(a_Position, 1.0);
      v_TexCoord = a_TexCoord;
      v_TextColor = a_TextColor;
    }
    `,
    `
    precision   highp       float;
    varying     vec2        v_TexCoord;
    varying     vec4        v_TextColor;
    uniform     float       u_Alpha;
    uniform     sampler2D   u_Sampler;

    void main() {
      float texAlpha = texture2D(u_Sampler, v_TexCoord).a;
      if (texAlpha == 0.0) {
        discard;
      }
      gl_FragColor.rgb = v_TextColor.rgb;
      gl_FragColor.a = v_TextColor.a * texAlpha * u_Alpha;
    }
    `,
  )
  this.useProgram(program)

  // 顶点着色器属性
  const a_Position = this.getAttribLocation(program, 'a_Position')
  const a_TexCoord = this.getAttribLocation(program, 'a_TexCoord')
  const a_TextColor = this.getAttribLocation(program, 'a_TextColor')

  // 片元着色器属性
  const u_Alpha = this.getUniformLocation(program, 'u_Alpha')

  // 创建顶点数组对象
  const vao = this.createVertexArray()
  this.bindVertexArray(vao)
  this.enableVertexAttribArray(a_Position)
  this.enableVertexAttribArray(a_TexCoord)
  this.enableVertexAttribArray(a_TextColor)
  this.bindBuffer(this.ARRAY_BUFFER, this.vertexBuffer)
  this.vertexAttribPointer(a_Position, 2, this.FLOAT, false, 20, 0)
  this.vertexAttribPointer(a_TexCoord, 2, this.FLOAT, false, 20, 8)
  this.vertexAttribPointer(a_TextColor, 4, this.UNSIGNED_BYTE, true, 20, 16)
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
  program.a_TexCoord = a_TexCoord
  program.a_TextColor = a_TextColor
  return program
}

// WebGL上下文方法 - 创建精灵程序