Codec.encodeClone = function (array, index, count) {
  const bits = Math.ceil(Math.log2(count + 1))
  const bytes = Math.ceil(bits / 5)
  for (let i = 0; i < bytes; i++) {
    const n = bytes - i - 1
    const head = n !== 0 ? 1 : 0
    const code = head << 5 | count >> n * 5 & 0b011111
    array[index++] = code + 35
  }
  return index
}

// 解码克隆数据