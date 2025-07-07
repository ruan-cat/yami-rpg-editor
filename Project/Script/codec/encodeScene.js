Codec.encodeScene = function (scene) {
  const tilemaps = this.getTilemaps(scene)
  for (const tilemap of tilemaps) {
    Codec.encodeTilemap(tilemap)
  }
  if (scene.terrainChanged) {
    scene.terrainChanged = false
    scene.terrains = this.encodeTerrains(scene.terrainArray)
  }
  return scene
}

// 解码场景