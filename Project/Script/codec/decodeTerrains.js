Codec.decodeTerrains = function (code, width, height) {
  const {decodeClone} = this
  const BYTES = this.textEncoder.encode(code)
  const BYTES_LENGTH = BYTES.length
  const TERRAINS = Scene.createTerrains(width, height)
  const TERRAINS_LENGTH = TERRAINS.length
  let Bi = 0
  let Ti = 0
  while (Bi < BYTES_LENGTH) {
    const CODE = BYTES[Bi]
    if (CODE <= 50) {
      TERRAINS[Ti] = CODE - 35
      Ti += 1
      Bi += 1
    } else if (CODE <= 76) {
      if (CODE !== 76) {
        const COPY = TERRAINS[Ti - 1]
        const END = Ti + CODE - 50
        while (Ti < END) {
          TERRAINS[Ti++] = COPY
        }
        Bi += 1
      } else {
        const {index, count} = decodeClone(BYTES, ++Bi)
        const COPY = TERRAINS[Ti - 1]
        const END = Ti + count
        while (Ti < END) {
          TERRAINS[Ti++] = COPY
        }
        Bi = index
      }
    } else {
      if (CODE !== 126) {
        Ti += CODE - 76
        Bi += 1
      } else {
        const {index, count} = decodeClone(BYTES, ++Bi)
        Ti += count
        Bi = index
      }
    }
  }
  if (Bi !== BYTES_LENGTH || Ti !== TERRAINS_LENGTH) {
    throw new RangeError(`
    Failed to decode terrains.
    Processed bytes: ${Bi} / ${BYTES_LENGTH}
    Restored data: ${Ti} / ${TERRAINS_LENGTH}
    `)
  }
  return TERRAINS
}

// 编码队伍数据