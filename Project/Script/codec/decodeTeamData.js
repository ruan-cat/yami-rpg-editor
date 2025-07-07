Codec.decodeTeamData = function (code, length) {
  const BYTES = this.textEncoder.encode(code)
  const BYTES_LENGTH = BYTES.length
  const DATA_LENGTH = (length + 1) / 2 * length
  const DATA = new Uint8Array(DATA_LENGTH)
  let Bi = 0
  let Ri = 0
  while (Bi < BYTES_LENGTH) {
    const CODE = BYTES[Bi] - 35
    DATA[Ri    ] = CODE      & 0b000001
    DATA[Ri + 1] = CODE >> 1 & 0b00001
    DATA[Ri + 2] = CODE >> 2 & 0b0001
    DATA[Ri + 3] = CODE >> 3 & 0b001
    DATA[Ri + 4] = CODE >> 4 & 0b01
    DATA[Ri + 5] = CODE >> 5
    Ri += 6
    Bi += 1
  }
  if (Bi !== BYTES_LENGTH || Ri < DATA_LENGTH) {
    throw new RangeError(`
    Failed to decode data.
    Processed bytes: ${Bi} / ${BYTES_LENGTH}
    Restored data: ${Ri} / ${DATA_LENGTH}
    `)
  }
  return DATA
}

// 编码克隆数据