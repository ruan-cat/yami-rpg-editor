Codec.getTilemaps = function IIFE() {
  const getTilemaps = (items, list) => {
    for (const item of items) {
      switch (item.class) {
        case 'folder':
          getTilemaps(item.children, list)
          continue
        case 'tilemap':
          list.push(item)
          continue
      }
    }
    return list
  }
  return function (scene) {
    return getTilemaps(scene.objects, [])
  }
}()

// 文件解密函数
// btoa(`new Function(\`
// window.decrypt = buffer => {
//   const array = new Uint8Array(buffer)
//   for (let i = 0; i < 0x10; i++) {
//     array[i] -= 0x80
//   }
//   return buffer
// }
// \`)()
// new Function(\`
// const {decrypt} = window
// window.decrypt = buffer => decrypt(buffer)
// \`)()`)