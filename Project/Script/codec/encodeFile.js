Codec.encodeFile = function (buffer) {
  // 如果是字符串，转换成缓冲区
  if (typeof buffer === 'string') {
    buffer = this.textEncoder.encode(buffer)
  }
  for (let i = 0; i < 0x10; i++) {
    buffer[i] += 0x80
  }
  return buffer
}

// 编码场景