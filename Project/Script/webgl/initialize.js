GL.initialize = function () {
  // 设置初始属性
  this.flip = this.flip ?? -1
  this.alpha = this.alpha ?? 1
  this.blend = this.blend ?? 'normal'
  this.matrix = this.matrix ?? new Matrix()
  this.width = this.drawingBufferWidth
  this.height = this.drawingBufferHeight
  this.program = null
  this.binding = null
  this.masking = false
  this.depthTest = false

  // 创建环境光对象
  this.ambient = {red: -1, green: -1, blue: -1}

  // 创建纹理管理器
  this.textureManager = this.textureManager ?? new TextureManager()

  // 最大纹理尺寸(PC: 16384, Mobile: 4096，超过会出错)
  // 如果需要兼容移动设备，使用4096x4096分辨率以内的图像文件
  this.maxTexSize = this.getParameter(this.MAX_TEXTURE_SIZE)

  // 设置最大纹理数量(通常是16)
  this.maxTexUnits = this.getParameter(this.MAX_TEXTURE_IMAGE_UNITS)

  // 创建反射光纹理
  this.reflectedLightMap = this.reflectedLightMap ?? new Texture({
    format: this.RGB,
    magFilter: this.LINEAR,
    minFilter: this.LINEAR,
  })
  this.reflectedLightMap.base.protected = true
  this.reflectedLightMap.fbo = this.createTextureFBO(this.reflectedLightMap)
  this.activeTexture(this.TEXTURE0 + this.maxTexUnits - 1)
  this.bindTexture(this.TEXTURE_2D, this.reflectedLightMap.base.glTexture)
  this.activeTexture(this.TEXTURE0)

  // 创建直射光纹理
  this.directLightMap = this.directLightMap ?? new Texture({
    format: this.RGB,
    magFilter: this.LINEAR,
    minFilter: this.LINEAR,
  })
  this.directLightMap.base.protected = true
  this.directLightMap.fbo = this.createTextureFBO(this.directLightMap)

  // 创建模板纹理
  this.stencilTexture = this.stencilTexture ?? new Texture({format: this.ALPHA})
  this.stencilTexture.base.protected = true

  // 创建遮罩纹理
  this.maskTexture = this.maskTexture ?? new Texture({format: this.RGBA})
  this.maskTexture.base.protected = true
  this.maskTexture.fbo = this.createTextureFBO(this.maskTexture)

  // 创建图层数组
  this.layers = this.layers ?? new Uint32Array(0x40000)

  // 创建零值数组
  this.zeros = this.zeros ?? new Uint32Array(0x40000)

  // 创建类型化数组
  const size = 512 * 512
  if (!this.arrays) {
    const buffer1 = new ArrayBuffer(size * 96)
    const buffer2 = new ArrayBuffer(size * 12)
    const buffer3 = new ArrayBuffer(size * 8)
    const buffer4 = new ArrayBuffer(size * 40)
    this.arrays = {
      0: {
        uint8: new Uint8Array(buffer1, 0, size * 96),
        uint32: new Uint32Array(buffer1, 0, size * 24),
        float32: new Float32Array(buffer1, 0, size * 24),
      },
      1: {
        uint8: new Uint8Array(buffer2, 0, size * 12),
        uint16: new Uint16Array(buffer2, 0, size * 6),
        uint32: new Uint32Array(buffer2, 0, size * 3),
        float32: new Float32Array(buffer2, 0, size * 3),
      },
      2: {
        uint32: new Uint32Array(buffer3, 0, size * 2),
      },
      3: {
        uint32: new Uint32Array(buffer4, 0, size * 10),
        float32: new Float32Array(buffer4, 0, size * 10),
      },
    }
  }

  // 创建帧缓冲区
  this.frameBuffer = this.createFramebuffer()

  // 创建顶点缓冲区
  this.vertexBuffer = this.createBuffer()

  // 创建索引缓冲区
  const indices = this.arrays[0].uint32
  for (let i = 0; i < size; i++) {
    const ei = i * 6
    const vi = i * 4
    indices[ei    ] = vi
    indices[ei + 1] = vi + 1
    indices[ei + 2] = vi + 2
    indices[ei + 3] = vi
    indices[ei + 4] = vi + 2
    indices[ei + 5] = vi + 3
  }
  this.elementBuffer = this.createBuffer()
  this.bindBuffer(this.ELEMENT_ARRAY_BUFFER, this.elementBuffer)
  this.bufferData(this.ELEMENT_ARRAY_BUFFER, indices, this.STATIC_DRAW, 0, size * 6)
  this.bindBuffer(this.ELEMENT_ARRAY_BUFFER, null)

  // 创建更新混合模式方法(闭包)
  this.updateBlending = this.createBlendingUpdater()

  // 创建批量渲染器
  this.batchRenderer = new BatchRenderer(this)

  // 创建2D上下文对象
  this.context2d = this.context2d ?? this.createContext2D()

  // 创建程序对象
  this.imageProgram = this.createImageProgram()
  this.tileProgram = this.createTileProgram()
  this.textProgram = this.createTextProgram()
  this.spriteProgram = this.createSpriteProgram()
  this.particleProgram = this.createParticleProgram()
  this.lightProgram = this.createLightProgram()
  this.graphicProgram = this.createGraphicProgram()
  this.dashedLineProgram = this.createDashedLineProgram()
}

// WebGL上下文方法 - 创建程序对象