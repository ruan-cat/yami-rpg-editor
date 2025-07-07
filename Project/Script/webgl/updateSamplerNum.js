GL.updateSamplerNum = function (samplerNum) {
  const program = this.program
  const lastNum = program.samplerNum
  if (lastNum !== samplerNum) {
    const u_Samplers = program.u_Samplers
    if (lastNum < samplerNum) {
      for (let i = lastNum; i < samplerNum; i++) {
        this.uniform1i(u_Samplers[i], i)
      }
    } else {
      for (let i = samplerNum; i < lastNum; i++) {
        this.uniform1i(u_Samplers[i], 0)
      }
    }
    program.samplerNum = samplerNum
  }
}

// WebGL上下文方法 - 绑定帧缓冲对象