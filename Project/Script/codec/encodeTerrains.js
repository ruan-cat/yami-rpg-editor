Codec.encodeTerrains = function (terrains) {
  const {encodeClone} = this
  const TERRAINS = terrains
  const LENGTH = TERRAINS.length
  const BYTES = GL.arrays[0].uint8
  let Bi = 0
  let Ti = 0
  while (Ti < LENGTH) {
    if (TERRAINS[Ti] === 0) {
      let blankCount = 1
      Ti += 1
      while (TERRAINS[Ti] === 0) {
        blankCount++
        Ti++
      }
      if (blankCount <= 49) {
        BYTES[Bi++] = blankCount + 76
      } else if (blankCount <= 98) {
        BYTES[Bi++] = 125
        BYTES[Bi++] = blankCount - 49 + 76
      } else {
        BYTES[Bi++] = 126
        Bi = encodeClone(BYTES, Bi, blankCount)
      }
    } else if (
      TERRAINS[Ti] === TERRAINS[Ti - 1] &&
      TERRAINS[Ti] === TERRAINS[Ti + 1]) {
      let cloneCount = 2
      Ti += 2
      while (TERRAINS[Ti] === TERRAINS[Ti - 1]) {
        cloneCount++
        Ti++
      }
      if (cloneCount <= 25) {
        BYTES[Bi++] = cloneCount + 50
      } else if (cloneCount <= 50) {
        BYTES[Bi++] = 75
        BYTES[Bi++] = cloneCount - 25 + 50
      } else {
        BYTES[Bi++] = 76
        Bi = encodeClone(BYTES, Bi, cloneCount)
      }
    } else {
      BYTES[Bi++] = TERRAINS[Ti++] + 35
    }
  }
  return this.textDecoder.decode(
    new Uint8Array(BYTES.buffer, 0, Bi)
  )
}

// 解码地形