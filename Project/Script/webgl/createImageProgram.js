GL.createImageProgram = function () {
  const program = this.createProgramWithShaders(
    `
    attribute   vec2        a_Position;
    attribute   vec2        a_TexCoord;
    uniform     float       u_Flip;
    uniform     mat3        u_Matrix;
    uniform     vec3        u_Ambient;
    uniform     int         u_LightMode;
    uniform     vec2        u_LightCoord;
    uniform     vec4        u_LightTexSize;
    uniform     sampler2D   u_LightSampler;
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
        vec2 anchorCoord = (u_Matrix * vec3(u_LightCoord, 1.0)).xy;
        vec2 lightCoord = vec2(
          anchorCoord.x / u_LightTexSize.x + u_LightTexSize.z,
          anchorCoord.y / u_LightTexSize.y * u_Flip + u_LightTexSize.w
        );
        return texture2D(u_LightSampler, lightCoord).rgb;
      }
      if (u_LightMode == 3) {
        return u_Ambient;
      }
    }

    void main() {
      gl_Position.xyw = u_Matrix * vec3(a_Position, 1.0);
      v_TexCoord = a_TexCoord;
      v_LightColor = getLightColor();
    }
    `,
    `
    precision   highp       float;
    varying     vec2        v_TexCoord;
    varying     vec3        v_LightColor;
    uniform     vec2        u_Viewport;
    uniform     int         u_Masking;
    uniform     float       u_Alpha;
    uniform     int         u_ColorMode;
    uniform     vec4        u_Color;
    uniform     vec4        u_Tint;
    uniform     vec4        u_Repeat;
    uniform     sampler2D   u_Sampler;
    uniform     sampler2D   u_MaskSampler;
    uniform     sampler2D   u_LightSampler;

    vec3 getLightColor() {
      if (v_LightColor.z != -1.0) return v_LightColor;
      return texture2D(u_LightSampler, v_LightColor.xy).rgb;
    }

    void main() {
      if (u_ColorMode == 0) {
        gl_FragColor = texture2D(u_Sampler, fract(v_TexCoord));
        if (gl_FragColor.a == 0.0) discard;
        gl_FragColor.rgb = gl_FragColor.rgb * (1.0 - u_Tint.a) + u_Tint.rgb +
        dot(gl_FragColor.rgb, vec3(0.299, 0.587, 0.114)) * u_Tint.a;
      } else if (u_ColorMode == 1) {
        float alpha = texture2D(u_Sampler, v_TexCoord).a;
        if (alpha == 0.0) discard;
        gl_FragColor = vec4(u_Color.rgb, u_Color.a * alpha);
      } else if (u_ColorMode == 2) {
        vec2 uv = vec2(
          mod(v_TexCoord.x - u_Repeat.x, u_Repeat.z) + u_Repeat.x,
          mod(v_TexCoord.y - u_Repeat.y, u_Repeat.w) + u_Repeat.y
        );
        gl_FragColor = texture2D(u_Sampler, uv);
        if (gl_FragColor.a == 0.0) discard;
        gl_FragColor.rgb = gl_FragColor.rgb * (1.0 - u_Tint.a) + u_Tint.rgb +
        dot(gl_FragColor.rgb, vec3(0.299, 0.587, 0.114)) * u_Tint.a;
      }
      gl_FragColor.rgb *= getLightColor();
      gl_FragColor.a *= u_Alpha;
      if (u_Masking == 1) {
        vec2 fragCoord = vec2(gl_FragCoord.x, (u_Viewport.y - gl_FragCoord.y));
        gl_FragColor.a *= texture2D(u_MaskSampler, fragCoord / u_Viewport).a;
      }
    }
    `,
  )
  this.useProgram(program)

  // 顶点着色器属性
  const a_Position = this.getAttribLocation(program, 'a_Position')
  const a_TexCoord = this.getAttribLocation(program, 'a_TexCoord')
  const u_Flip = this.getUniformLocation(program, 'u_Flip')
  const u_Matrix = this.getUniformLocation(program, 'u_Matrix')
  const u_Ambient = this.getUniformLocation(program, 'u_Ambient')
  const u_LightMode = this.getUniformLocation(program, 'u_LightMode')
  const u_LightCoord = this.getUniformLocation(program, 'u_LightCoord')
  const u_LightTexSize = this.getUniformLocation(program, 'u_LightTexSize')
  this.uniform1i(this.getUniformLocation(program, 'u_LightSampler'), this.maxTexUnits - 1)

  // 片元着色器属性
  const u_Viewport = this.getUniformLocation(program, 'u_Viewport')
  const u_Masking = this.getUniformLocation(program, 'u_Masking')
  const u_Alpha = this.getUniformLocation(program, 'u_Alpha')
  const u_ColorMode = this.getUniformLocation(program, 'u_ColorMode')
  const u_Color = this.getUniformLocation(program, 'u_Color')
  const u_Tint = this.getUniformLocation(program, 'u_Tint')
  const u_Repeat = this.getUniformLocation(program, 'u_Repeat')
  const u_MaskSampler = this.getUniformLocation(program, 'u_MaskSampler')

  // 创建顶点数组对象
  const vao = this.createVertexArray()
  this.bindVertexArray(vao)
  this.enableVertexAttribArray(a_Position)
  this.enableVertexAttribArray(a_TexCoord)
  this.bindBuffer(this.ARRAY_BUFFER, this.vertexBuffer)
  this.vertexAttribPointer(a_Position, 2, this.FLOAT, false, 16, 0)
  this.vertexAttribPointer(a_TexCoord, 2, this.FLOAT, false, 16, 8)
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
    this.updateMasking()
    this.updateBlending()
    return program
  }

  // 保存程序对象
  program.use = use
  program.vao = vao
  program.alpha = 0
  program.masking = false
  program.a_Position = a_Position
  program.a_TexCoord = a_TexCoord
  program.u_Matrix = u_Matrix
  program.u_Ambient = u_Ambient
  program.u_LightMode = u_LightMode
  program.u_LightCoord = u_LightCoord
  program.u_LightTexSize = u_LightTexSize
  program.u_Viewport = u_Viewport
  program.u_Masking = u_Masking
  program.u_MaskSampler = u_MaskSampler
  program.u_ColorMode = u_ColorMode
  program.u_Color = u_Color
  program.u_Tint = u_Tint
  program.u_Repeat = u_Repeat
  return program
}

// WebGL上下文方法 - 创建图块程序