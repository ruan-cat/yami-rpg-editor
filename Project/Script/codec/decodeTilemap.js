Codec.decodeTilemap = function (tilemap) {
  const tiles = Codec.decodeTiles(tilemap.code, tilemap.width, tilemap.height)
  Object.defineProperty(tilemap, 'tiles', {writable: true, value: tiles})
  Object.defineProperty(tilemap, 'changed', {writable: true, value: false})
  Object.defineProperty(tilemap, 'reverseMap', {writable: true, value: {}})
  // 构建图块组反向映射表
  const {tilesetMap, reverseMap} = tilemap
  const entries = Object.entries(tilesetMap)
  for (const [index, guid] of entries) {
    reverseMap[guid] = parseInt(index)
  }
  return tilemap
}

// 编码图块