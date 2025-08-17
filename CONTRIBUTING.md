# 贡献指南

首先，感谢您对 [yami-rpg-editor 社区版](https://github.com/Open-Yami-Community/yami-rpg-editor) 的贡献！

## 贡献方式

1. Fork 本仓库
2. 创建您的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的改动 (`git commit -m 'Add some AmazingFeature'`)
4. 将您的改动记录提交到远程仓库 (`git push origin feature/AmazingFeature`)
5. 打开一个 Pull Request

## 开发规范

首先，尽量不要改动原来的代码，当然，如果实现起来更简单，可以改动。

`Project\Script\module`是模块文件，我们的改动一般都放在这。

其次，`css`尽量在`index.css`中添加，内联样式尽量少用。

css的配色是需要支持`亮色`和`暗色`的，所以尽量使用`var(--color)`来表示颜色。

然后就是社区版是要维护`中文`和`english`两个语言的版本，所以提交前，请确保`中文`和`english`两个语言版本都正确。

