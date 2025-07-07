GL.createContext2D = function () {
  const canvas = document.createElement('canvas')
  canvas.width = 0
  canvas.height = 0
  return canvas.getContext('2d')
}

// WebGL上下文方法 - 填充描边文字