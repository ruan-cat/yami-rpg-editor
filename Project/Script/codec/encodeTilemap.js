Codec.encodeTilemap = function (tilemap) {
  if (tilemap.changed) {
    tilemap.changed = false
    tilemap.code = Codec.encodeTiles(tilemap.tiles)
    // 修剪图块组映射表
    const flags = {}
    const tilesetMap = tilemap.tilesetMap
    const indices = Object.keys(tilesetMap)
    for (const index of indices) {
      flags[index] = false
    }
    const tiles = tilemap.tiles
    const length = tiles.length
    for (let i = 0; i < length; i++) {
      const index = tiles[i] >> 24
      if (index === 0) continue
      flags[index] = true
    }
    const trimmedMap = {}
    const reverseMap = {}
    for (const index of indices) {
      if (flags[index]) {
        const guid = tilesetMap[index]
        trimmedMap[index] = guid
        reverseMap[guid] = parseInt(index)
      }
    }
    tilemap.tilesetMap = trimmedMap
    tilemap.reverseMap = reverseMap
  }
}

// 解码瓦片地图