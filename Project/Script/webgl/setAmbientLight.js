GL.setAmbientLight = function ({red, green, blue}) {
  const ambient = this.ambient
  if (ambient.red !== red ||
    ambient.green !== green ||
    ambient.blue !== blue) {
    ambient.red = red
    ambient.green = green
    ambient.blue = blue
    const program = this.program
    const r = ambient.red / 255
    const g = ambient.green / 255
    const b = ambient.blue / 255
    for (const program of [
      this.imageProgram,
      this.tileProgram,
      this.particleProgram,
    ]) {
      this.useProgram(program)
      this.uniform3f(program.u_Ambient, r, g, b)
    }
    this.useProgram(program)
  }
}

// WebGL上下文方法 - 调整光影纹理