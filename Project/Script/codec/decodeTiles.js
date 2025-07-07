Codec.decodeTiles = function (code, width, height) {
  const {decodeClone} = this
  const BYTES = this.textEncoder.encode(code)
  const BYTES_LENGTH = BYTES.length
  const TILES = Scene.createTiles(width, height)
  const TILES_LENGTH = TILES.length
  let Bi = 0
  let Ti = 0
  while (Bi < BYTES_LENGTH) {
    const CODE = BYTES[Bi]
    if (CODE <= 98) {
      TILES[Ti] =
        (BYTES[Bi    ] - 35 << 26)
      + (BYTES[Bi + 1] - 35 << 20)
      + (BYTES[Bi + 2] - 35 << 14)
      + (BYTES[Bi + 3] - 35 << 8)
      + (BYTES[Bi + 4] - 35)
      Ti += 1
      Bi += 5
    } else if (CODE <= 109) {
      if (CODE !== 109) {
        const COPY = TILES[Ti - 1]
        const END = Ti + CODE - 98
        while (Ti < END) {
          TILES[Ti++] = COPY
        }
        Bi += 1
      } else {
        const {index, count} = decodeClone(BYTES, ++Bi)
        const COPY = TILES[Ti - 1]
        const END = Ti + count
        while (Ti < END) {
          TILES[Ti++] = COPY
        }
        Bi = index
      }
    } else {
      if (CODE !== 126) {
        Ti += CODE - 109
        Bi += 1
      } else {
        const {index, count} = decodeClone(BYTES, ++Bi)
        Ti += count
        Bi = index
      }
    }
  }
  if (Bi !== BYTES_LENGTH || Ti !== TILES_LENGTH) {
    throw new RangeError(`
    Failed to decode tiles.
    Processed bytes: ${Bi} / ${BYTES_LENGTH}
    Restored data: ${Ti} / ${TILES_LENGTH}
    `)
  }
  return TILES
}

// 编码地形，最多可存放4位数据(目前仅使用了2位)