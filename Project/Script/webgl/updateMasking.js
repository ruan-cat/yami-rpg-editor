GL.updateMasking = function () {
  if (this.program.masking !== this.masking) {
    this.program.masking = this.masking
    if (this.masking) {
      this.uniform1i(this.program.u_Masking, 1)
      this.uniform1i(this.program.u_MaskSampler, 1)
      this.activeTexture(this.TEXTURE1)
      this.bindTexture(this.TEXTURE_2D, this.maskTexture.base.glTexture)
      this.activeTexture(this.TEXTURE0)
    } else {
      this.uniform1i(this.program.u_Masking, 0)
      this.uniform1i(this.program.u_MaskSampler, 0)
      this.activeTexture(this.TEXTURE1)
      this.bindTexture(this.TEXTURE_2D, null)
      this.activeTexture(this.TEXTURE0)
    }
  }
  if (this.masking) {
    this.uniform2f(this.program.u_Viewport, this.width, this.height)
  }
}

// WebGL上下文方法 - 创建混合模式更新器