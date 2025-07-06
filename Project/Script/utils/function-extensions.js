'use strict'

// 函数静态方法 - 空函数
Function.empty = () => {} 

const ctrl = process.platform === 'darwin'
? function (keyName) {return '⌘+' + keyName}
: function (keyName) {return 'Ctrl+' + keyName}