GL.createLightProgram = function () {
  const program = this.createProgramWithShaders(
    `
    attribute   vec2        a_Position;
    attribute   vec2        a_LightCoord;
    uniform     mat3        u_Matrix;
    varying     vec2        v_LightCoord;

    void main() {
      gl_Position.xyw = u_Matrix * vec3(a_Position, 1.0);
      v_LightCoord = a_LightCoord;
    }
    `,
    `
    precision   highp       float;
    const       float       PI = 3.1415926536;
    varying     vec2        v_LightCoord;
    uniform     int         u_LightMode;
    uniform     vec4        u_LightColor;
    uniform     sampler2D   u_LightSampler;

    vec3 getLightColor() {
      if (u_LightMode == 0) {
        float dist = length(vec2(
          (v_LightCoord.x - 0.5),
          (v_LightCoord.y - 0.5)
        ));
        if (dist > 0.5) {
          discard;
        }
        float angle = dist * PI;
        float factor = mix(1.0 - sin(angle), cos(angle), u_LightColor.a);
        return u_LightColor.rgb * factor;
      }
      if (u_LightMode == 1) {
        vec4 lightColor = texture2D(u_LightSampler, v_LightCoord);
        if (lightColor.a == 0.0) {
          discard;
        }
        return u_LightColor.rgb * lightColor.rgb * lightColor.a;
      }
      if (u_LightMode == 2) {
        return u_LightColor.rgb;
      }
    }

    void main() {
      gl_FragColor = vec4(getLightColor(), 1.0);
    }
    `,
  )
  this.useProgram(program)

  // 顶点着色器属性
  const a_Position = this.getAttribLocation(program, 'a_Position')
  const a_LightCoord = this.getAttribLocation(program, 'a_LightCoord')
  const u_Matrix = this.getUniformLocation(program, 'u_Matrix')

  // 片元着色器属性
  const u_LightMode = this.getUniformLocation(program, 'u_LightMode')
  const u_LightColor = this.getUniformLocation(program, 'u_LightColor')

  // 创建顶点数组对象
  const vao = this.createVertexArray()
  this.bindVertexArray(vao)
  this.enableVertexAttribArray(a_Position)
  this.enableVertexAttribArray(a_LightCoord)
  this.bindBuffer(this.ARRAY_BUFFER, this.vertexBuffer)
  this.vertexAttribPointer(a_Position, 2, this.FLOAT, false, 16, 0)
  this.vertexAttribPointer(a_LightCoord, 2, this.FLOAT, false, 16, 8)

  // 使用程序对象
  const use = () => {
    if (this.program !== program) {
      this.program = program
      this.useProgram(program)
    }
    this.updateBlending()
    return program
  }

  // 保存程序对象
  program.use = use
  program.vao = vao
  program.a_Position = a_Position
  program.a_LightCoord = a_LightCoord
  program.u_Matrix = u_Matrix
  program.u_LightMode = u_LightMode
  program.u_LightColor = u_LightColor
  return program
}

// WebGL上下文方法 - 创建图形程序