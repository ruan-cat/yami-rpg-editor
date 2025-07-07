Codec.decodeScene = function (scene) {
  if (scene.terrainArray === undefined) {
    const terrainArray = this.decodeTerrains(scene.terrains, scene.width, scene.height)
    Object.defineProperty(scene, 'terrainArray', {writable: true, value: terrainArray})
    Object.defineProperty(scene, 'terrainChanged', {writable: true, value: false})
    const tilemaps = this.getTilemaps(scene)
    for (const tilemap of tilemaps) {
      Codec.decodeTilemap(tilemap)
    }
  }
  return scene
}

// 编码瓦片地图