GL.createBlendingUpdater = function () {
  // 开启混合功能
  this.enable(this.BLEND)

  // 更新器映射表(启用混合时)
  const A = {
    // 正常模式
    normal: () => {
      this.blendEquation(this.FUNC_ADD)
      this.blendFuncSeparate(this.SRC_ALPHA, this.ONE_MINUS_SRC_ALPHA, this.ONE, this.ZERO)
    },
    // 滤色模式
    screen: () => {
      this.blendEquation(this.FUNC_ADD)
      this.blendFunc(this.ONE, this.ONE_MINUS_SRC_COLOR)
    },
    // 加法模式
    additive: () => {
      this.blendEquation(this.FUNC_ADD)
      this.blendFuncSeparate(this.SRC_ALPHA, this.DST_ALPHA, this.ONE, this.ZERO)
    },
    // 减法模式
    subtract: () => {
      this.blendEquation(this.FUNC_REVERSE_SUBTRACT)
      this.blendFuncSeparate(this.SRC_ALPHA, this.DST_ALPHA, this.ONE, this.ZERO)
    },
    // 最大值模式
    max: () => {
      this.blendEquation(this.MAX)
    },
    // 复制模式
    copy: () => {
      this.disable(this.BLEND)
      updaters = B
    },
  }

  // 从复制模式切换到其他模式
  const resume = () => {
    (updaters = A)[blend]()
    this.enable(this.BLEND)
  }

  // 更新器映射表(禁用混合时)
  const B = {
    normal: resume,
    screen: resume,
    additive: resume,
    subtract: resume,
    max: resume,
  }

  let updaters = A
  let blend = ''
  // 返回更新混合模式方法
  return () => {
    if (blend !== this.blend) {
      updaters[blend = this.blend]()
    }
  }
}

// WebGL上下文方法 - 设置环境光