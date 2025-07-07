Codec.encodeTeamData = function (data) {
  const DATA = data
  const LENGTH = DATA.length
  const BYTES = GL.arrays[0].uint8
  let Bi = 0
  let Ri = 0
  while (Ri < LENGTH) {
    BYTES[Bi++] = 35 + (
      DATA[Ri    ]
    | DATA[Ri + 1] << 1
    | DATA[Ri + 2] << 2
    | DATA[Ri + 3] << 3
    | DATA[Ri + 4] << 4
    | DATA[Ri + 5] << 5
    )
    Ri += 6
  }
  return this.textDecoder.decode(
    new Uint8Array(BYTES.buffer, 0, Bi)
  )
}

// 解码队伍数据