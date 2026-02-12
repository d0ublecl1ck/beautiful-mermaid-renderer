# beautiful-mermaid-renderer

将 Mermaid 源码渲染为以下格式：

- Unicode 盒线图（终端/聊天展示优先）
- ASCII 盒线图（兼容性优先）
- SVG（文档、网页和富 UI）

## 环境要求

- Bun

## 安装

```sh
cd ~/.codex/skills/beautiful-mermaid-renderer
bun install
```

## 快速开始

1. 通过 stdin 输入 Mermaid（Unicode）：

```sh
cat diagram.mmd | ./scripts/render.sh --format unicode
```

2. 通过 stdin 输入 Mermaid（ASCII）：

```sh
cat diagram.mmd | ./scripts/render.sh --format ascii
```

3. 输出 SVG 到文件：

```sh
cat diagram.mmd | ./scripts/render.sh --format svg --out diagram.svg
```

4. 直接读取文件输入：

```sh
./scripts/render.sh --in diagram.mmd --format unicode
```

## CLI 参数

- `--format <unicode|ascii|svg>` 输出格式，默认 `unicode`
- `--in <file>` 从文件读取 Mermaid 源码；不传时从 stdin 读取
- `--out <file>` 输出到文件；不传时输出到 stdout
- `--list-themes` 列出 SVG 内置主题名
- `--theme <name>` SVG 使用内置主题
- `--bg <color>` SVG 背景色（覆盖主题）
- `--fg <color>` SVG 前景色（覆盖主题）
- `--transparent` SVG 透明背景
- `--paddingX <n>` 文本渲染水平间距
- `--paddingY <n>` 文本渲染垂直间距
- `--boxBorderPadding <n>` 文本节点框内边距
- `--help` 显示帮助

## 常见用法

列出全部主题：

```sh
./scripts/render.sh --list-themes
```

使用主题渲染 SVG：

```sh
cat diagram.mmd | ./scripts/render.sh --format svg --theme tokyo-night --out diagram.svg
```

## 行为说明

- 支持 Mermaid 常见单行写法，例：`graph LR; A-->B`（内部会自动规范化）
- `scripts/render.sh` 是入口；核心逻辑在 `src/render.ts`
- 未提供 `--in` 且没有 stdin 输入时会报错提示输入来源

## 测试

```sh
bun test
```
