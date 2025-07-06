import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import esbuild from 'rollup-plugin-esbuild';
import fs from 'fs';
import path from 'path';

// 创建复制目录的插件
function copyTypescriptLib() {
  return {
    name: 'copy-typescript-lib',
    writeBundle() {
      const srcDir = './node_modules/typescript/lib';
      const destDir = './dist/node_modules/typescript/lib';
      
      // 确保目标目录存在
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }

      // 复制文件
      fs.readdirSync(srcDir).forEach(file => {
        const srcFile = path.join(srcDir, file);
        const destFile = path.join(destDir, file);
        if (fs.statSync(srcFile).isFile()) {
          fs.copyFileSync(srcFile, destFile);
        }
      });
    }
  };
}

export default [
  {
    input: {
      'main': 'src/main.ts',
      'apk': 'src/apk.ts'
    },
    output: {
      dir: 'dist',
      format: 'cjs',
      entryFileNames: '[name].cjs',
      chunkFileNames: '[name]-[hash].cjs',
    },
    external: [
      'electron',
      'koa',
      'mime-types',
      'qrcode',
      'exceljs',
      'sharp',
      'typescript',
      'fs',
      'path',
      'os',
      'child_process',
      'util',
      'xml2js'
    ],
    plugins: [
      nodeResolve({
        preferBuiltins: true
      }),
      commonjs(),
      json(),
      esbuild({
        target: 'node16'
      }),
      copyTypescriptLib()
    ]
  }
]; 