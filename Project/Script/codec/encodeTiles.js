Codec.encodeTiles = function (tiles) {
  const {encodeClone} = this
  const TILES = tiles
  const TILES_LENGTH = TILES.length
  const BYTES = GL.arrays[0].uint8
  let Bi = 0
  let Ti = 0
  while (Ti < TILES_LENGTH) {
    if (TILES[Ti] === 0) {
      let blankCount = 1
      Ti += 1
      while (TILES[Ti] === 0) {
        blankCount++
        Ti++
      }
      if (blankCount <= 16) {
        BYTES[Bi++] = blankCount + 109
      } else {
        BYTES[Bi++] = 126
        Bi = encodeClone(BYTES, Bi, blankCount)
      }
    } else if (TILES[Ti] === TILES[Ti - 1]) {
      let cloneCount = 1
      Ti += 1
      while (TILES[Ti] === TILES[Ti - 1]) {
        cloneCount++
        Ti++
      }
      if (cloneCount <= 10) {
        BYTES[Bi++] = cloneCount + 98
      } else {
        BYTES[Bi++] = 109
        Bi = encodeClone(BYTES, Bi, cloneCount)
      }
    } else {
      const TILE = TILES[Ti]
      BYTES[Bi    ] = (TILE >> 26           ) + 35
      BYTES[Bi + 1] = (TILE >> 20 & 0b111111) + 35
      BYTES[Bi + 2] = (TILE >> 14 & 0b111111) + 35
      BYTES[Bi + 3] = (TILE >> 8  & 0b111111) + 35
      BYTES[Bi + 4] = (TILE       & 0b111111) + 35
      Bi += 5
      Ti += 1
    }
  }
  return this.textDecoder.decode(
    new Uint8Array(BYTES.buffer, 0, Bi)
  )
}

// 解码图块