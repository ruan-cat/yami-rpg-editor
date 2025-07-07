GL.createSpriteProgram = function () {
  const program = this.createProgramWithShaders(
    `
    attribute   vec2        a_Position;
    attribute   vec2        a_TexCoord;
    attribute   vec3        a_TexParam;
    attribute   vec4        a_Tint;
    attribute   vec2        a_LightCoord;
    uniform     float       u_Flip;
    uniform     mat3        u_Matrix;
    uniform     vec4        u_LightTexSize;
    uniform     sampler2D   u_LightSampler;
    varying     float       v_TexIndex;
    varying     float       v_Opacity;
    varying     vec4        v_Tint;
    varying     vec2        v_TexCoord;
    varying     vec3        v_LightColor;

    vec3 getLightColor() {
      if (a_TexParam.z == 0.0) {
        return vec3(1.0, 1.0, 1.0);
      }
      if (a_TexParam.z == 1.0) {
        return vec3(
          gl_Position.x / u_LightTexSize.x + u_LightTexSize.z,
          gl_Position.y / u_LightTexSize.y * u_Flip + u_LightTexSize.w,
          -1.0
        );
      }
      if (a_TexParam.z == 2.0) {
        return texture2D(u_LightSampler, a_LightCoord).rgb;
      }
    }

    void main() {
      gl_Position.xyw = u_Matrix * vec3(a_Position, 1.0);
      v_TexIndex = a_TexParam.x;
      v_Opacity = a_TexParam.y / 255.0;
      v_Tint = a_Tint / 255.0 - 1.0;
      v_TexCoord = a_TexCoord;
      v_LightColor = getLightColor();
    }
    `,
    `
    precision   highp       float;
    varying     float       v_TexIndex;
    varying     float       v_Opacity;
    varying     vec4        v_Tint;
    varying     vec2        v_TexCoord;
    varying     vec3        v_LightColor;
    uniform     float       u_Alpha;
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

    vec3 tint(vec3 color, vec4 tint) {
      return color.rgb * (1.0 - tint.a) + tint.rgb +
      dot(color.rgb, vec3(0.299, 0.587, 0.114)) * tint.a;
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
      gl_FragColor.rgb = tint(tint(gl_FragColor.rgb, v_Tint), u_Tint) * getLightColor();
      gl_FragColor.a *= v_Opacity * u_Alpha;
    }
    `,
  )
  this.useProgram(program)

  // 顶点着色器属性
  const a_Position = this.getAttribLocation(program, 'a_Position')
  const a_TexCoord = this.getAttribLocation(program, 'a_TexCoord')
  const a_TexParam = this.getAttribLocation(program, 'a_TexParam')
  const a_Tint = this.getAttribLocation(program, 'a_Tint')
  const a_LightCoord = this.getAttribLocation(program, 'a_LightCoord')
  const u_Flip = this.getUniformLocation(program, 'u_Flip')
  const u_Matrix = this.getUniformLocation(program, 'u_Matrix')
  const u_LightTexSize = this.getUniformLocation(program, 'u_LightTexSize')
  this.uniform1i(this.getUniformLocation(program, 'u_LightSampler'), this.maxTexUnits - 1)

  // 片元着色器属性
  const u_Alpha = this.getUniformLocation(program, 'u_Alpha')
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
  this.enableVertexAttribArray(a_TexParam)
  this.enableVertexAttribArray(a_Tint)
  this.enableVertexAttribArray(a_LightCoord)
  this.bindBuffer(this.ARRAY_BUFFER, this.vertexBuffer)
  this.vertexAttribPointer(a_Position, 2, this.FLOAT, false, 32, 0)
  this.vertexAttribPointer(a_TexCoord, 2, this.FLOAT, false, 32, 8)
  this.vertexAttribPointer(a_TexParam, 3, this.UNSIGNED_BYTE, false, 32, 16)
  this.vertexAttribPointer(a_Tint, 4, this.UNSIGNED_SHORT, false, 32, 20)
  this.vertexAttribPointer(a_LightCoord, 2, this.UNSIGNED_SHORT, true, 32, 28)
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
  program.a_TexParam = a_TexParam
  program.a_Tint = a_Tint
  program.a_LightCoord = a_LightCoord
  program.u_Matrix = u_Matrix
  program.u_LightTexSize = u_LightTexSize
  program.u_Tint = u_Tint
  program.u_Samplers = u_Samplers
  return program
}

// WebGL上下文方法 - 创建粒子程序