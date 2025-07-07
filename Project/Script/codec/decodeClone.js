Codec.decodeClone = function IIFE() {
  const response = {index: 0, count: 0}
  return (array, index) => {
    let count = 0
    let code
    do {
      code = array[index++] - 35
      count = count << 5 | code & 0b011111
    } while (code & 0b100000)
    response.index = index
    response.count = count
    return response
  }
}()

// 获取所有瓦片地图