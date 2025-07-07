GL.createTileProgram = function () {
  const program = this.createProgramWithShaders(
    `
    attribute   vec2        a_Position;
    attribute   vec2        a_TexCoord;
    attribute   float       a_TexIndex;
    uniform     float       u_Flip;
    uniform     mat3        u_Matrix;
    uniform     vec3        u_Ambient;
    uniform     int         u_LightMode;
    uniform     vec4        u_LightTexSize;
    uniform     sampler2D   u_LightSampler;
    varying     float       v_TexIndex;
    varying     vec2        v_TexCoord;
    varying     vec3        v_LightColor;

    vec3 getLightColor() {
      if (u_LightMode == 0) {
        return vec3(1.0, 1.0, 1.0);
      }
      if (u_LightMode == 1) {
        return vec3(
          gl_Position.x / u_LightTexSize.x + u_LightTexSize.z,
          gl_Position.y / u_LightTexSize.y * u_Flip + u_LightTexSize.w,
          -1.0
        );
      }
      if (u_LightMode == 2) {
        return u_Ambient;
      }
    }

    void main() {
      gl_Position.xyw = u_Matrix * vec3(a_Position, 1.0);
      v_TexCoord = a_TexCoord;
      v_TexIndex = a_TexIndex;
      v_LightColor = getLightColor();
    }
    `,
    `
    precision   highp       float;
    varying     float       v_TexIndex;
    varying     vec2        v_TexCoord;
    varying     vec3        v_LightColor;
    uniform     float       u_Alpha;
    uniform     int         u_TintMode;
    uniform     vec4        u_Tint;
    uniform     sampler2D   u_Samplers[15];
    uniform     sampler2D   u_LightSampler;

    vec4 sampler(int index, vec2 uv) {
      for (int i = 0; i < 15; i++) {
        if (i == index) {
          return texture2D(u_Samplers[i], uv);
        }
      }
    }

    vec3 getLightColor() {
      if (v_LightColor.z != -1.0) return v_LightColor;
      return texture2D(u_LightSampler, v_LightColor.xy).rgb;
    }

    void main() {
      gl_FragColor = sampler(int(v_TexIndex), v_TexCoord);
      if (gl_FragColor.a == 0.0) {
        discard;
      }
      if (u_TintMode == 1) {
        gl_FragColor.rgb = gl_FragColor.rgb * (1.0 - u_Tint.a) + u_Tint.rgb +
        dot(gl_FragColor.rgb, vec3(0.299, 0.587, 0.114)) * u_Tint.a;
      }
      gl_FragColor.rgb *= getLightColor();
      gl_FragColor.a *= u_Alpha;
    }
    `,
  )
  this.useProgram(program)

  // 顶点着色器属性
  const a_Position = this.getAttribLocation(program, 'a_Position')
  const a_TexCoord = this.getAttribLocation(program, 'a_TexCoord')
  const a_TexIndex = this.getAttribLocation(program, 'a_TexIndex')
  const u_Flip = this.getUniformLocation(program, 'u_Flip')
  const u_Matrix = this.getUniformLocation(program, 'u_Matrix')
  const u_Ambient = this.getUniformLocation(program, 'u_Ambient')
  const u_LightMode = this.getUniformLocation(program, 'u_LightMode')
  const u_LightTexSize = this.getUniformLocation(program, 'u_LightTexSize')
  this.uniform1i(this.getUniformLocation(program, 'u_LightSampler'), this.maxTexUnits - 1)

  // 片元着色器属性
  const u_Alpha = this.getUniformLocation(program, 'u_Alpha')
  const u_TintMode = this.getUniformLocation(program, 'u_TintMode')
  const u_Tint = this.getUniformLocation(program, 'u_Tint')
  const u_SamplerLength = this.maxTexUnits - 1
  const u_Samplers = []
  for (let i = 0; i < u_SamplerLength; i++) {
    u_Samplers.push(this.getUniformLocation(program, `u_Samplers[${i}]`))
  }

  // 创建顶点数组对象
  const vao = this.createVertexArray()
  this.bindVertexArray(vao)
  this.enableVertexAttribArray(a_Position)
  this.enableVertexAttribArray(a_TexCoord)
  this.enableVertexAttribArray(a_TexIndex)
  this.bindBuffer(this.ARRAY_BUFFER, this.vertexBuffer)
  this.vertexAttribPointer(a_Position, 2, this.FLOAT, false, 20, 0)
  this.vertexAttribPointer(a_TexCoord, 2, this.FLOAT, false, 20, 8)
  this.vertexAttribPointer(a_TexIndex, 1, this.FLOAT, false, 20, 16)
  this.bindBuffer(this.ELEMENT_ARRAY_BUFFER, this.elementBuffer)

  // 使用程序对象
  const use = () => {
    if (this.program !== program) {
      this.program = program
      this.useProgram(program)
    }
    if (program.flip !== this.flip) {
      program.flip = this.flip
      this.uniform1f(u_Flip, program.flip)
    }
    if (program.alpha !== this.alpha) {
      program.alpha = this.alpha
      this.uniform1f(u_Alpha, program.alpha)
    }
    return program
  }

  // 保存程序对象
  program.use = use
  program.vao = vao
  program.flip = null
  program.alpha = 0
  program.samplerNum = 1
  program.a_Position = a_Position
  program.a_TexCoord = a_TexCoord
  program.a_TexIndex = a_TexIndex
  program.u_Matrix = u_Matrix
  program.u_Ambient = u_Ambient
  program.u_LightMode = u_LightMode
  program.u_LightTexSize = u_LightTexSize
  program.u_TintMode = u_TintMode
  program.u_Tint = u_Tint
  program.u_Samplers = u_Samplers
  return program
}

// WebGL上下文方法 - 创建文字程序