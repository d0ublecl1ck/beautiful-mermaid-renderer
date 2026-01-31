# beautiful-mermaid-renderer (Codex Skill)

用 `beautiful-mermaid` 将 Mermaid 源码渲染为：

- **Unicode/ASCII** 盒线图（适合终端 / 聊天里直接给用户看）
- **SVG**（适合文档 / 网页 / 富 UI）

## 依赖

- Bun

安装依赖（首次/升级后执行一次）：

```sh
cd ~/.codex/skills/beautiful-mermaid-renderer
bun install
```

## 快速使用

### 1) 输出 Unicode（默认，最好看）

```sh
cat diagram.mmd | ./scripts/render.sh --format unicode
```

### 2) 输出 ASCII（兼容性更强）

```sh
cat diagram.mmd | ./scripts/render.sh --format ascii
```

### 3) 输出 SVG

```sh
cat diagram.mmd | ./scripts/render.sh --format svg --out diagram.svg
```

## 常用参数

- `--in <file>`：从文件读取（不传则从 stdin）
- `--out <file>`：写到文件（不传则输出到 stdout）
- `--list-themes`：列出 SVG 内置主题
- `--theme <name>`：SVG 使用内置主题
- `--bg <color>` / `--fg <color>`：SVG 自定义背景/前景色（覆盖主题）
- `--transparent`：SVG 透明背景
- `--paddingX <n>` / `--paddingY <n>` / `--boxBorderPadding <n>`：文本渲染间距参数

示例：列主题

```sh
./scripts/render.sh --list-themes
```

示例：指定主题 + 输出 SVG

```sh
cat diagram.mmd | ./scripts/render.sh --format svg --theme tokyo-night --out diagram.svg
```

## 备注

- 支持 Mermaid 常见单行写法（会自动规范化），例如：`graph LR; A-->B`
- `scripts/` 目录仅提供 `.sh` 入口脚本；实际渲染逻辑在 `src/`（Bun 运行）

## 测试

```sh
cd ~/.codex/skills/beautiful-mermaid-renderer
bun test
```

