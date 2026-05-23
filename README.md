# GitHub 文件加速下载

基于 Cloudflare Pages Functions 的 GitHub 文件加速代理，解决国内直接访问 `raw.githubusercontent.com` 缓慢或不可访问的问题。

## 演示网站
[https://9-9w4.pages.dev](https://9-9w4.pages.dev/)

[https://6-af3.pages.dev](https://6-af3.pages.dev/)


## 功能特性

- **网页界面**：访问根路径即显示可视化下载页面，支持粘贴链接一键下载
- **直链加速**：通过 URL 路径直接代理下载，适合脚本/命令行调用
- **多格式支持**：`.txt` `.bat` `.reg` `.cmd` `.zip` `.jpg` `.png` `.md` 及任意二进制文件
- **链接兼容**：自动识别并转换 `blob` 格式与 `raw` 格式的 GitHub 链接
- **缓存优化**：响应头带 `Cache-Control: public, max-age=3600`，减少重复请求

## 使用方式

### 方式一：网页界面

访问部署域名根路径，在输入框中粘贴 GitHub 文件链接后点击下载按钮。

支持以下链接格式：
- `https://github.com/用户/仓库/blob/分支/文件路径`
- `https://raw.githubusercontent.com/用户/仓库/分支/文件路径`

### 方式二：URL 直链（推荐用于脚本）

```
https://你的域名.pages.dev/用户/仓库/分支/文件路径
```

示例：
```
https://9-9w4.pages.dev/nnnnddjj/github-files-proxy/main/README.md
```

浏览器访问或 `curl` 直接下载，无需额外参数。

### 方式三：`/download` API 接口

```
GET /download?url=<GitHub文件链接>
```

示例：
```bash
curl "https://9-9w4.pages.dev/download?url=https://raw.githubusercontent.com/nnnnddjj/github-files-proxy/main/_worker.js" -O
```
```bash
curl "https://9-9w4.pages.dev/download?url=https://github.com/nnnnddjj/github-files-proxy/blob/main/README.md" -O
```

## 部署到 Cloudflare Pages

### 方式一：手动上传（推荐）

1. 注册并登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)，在左侧找到 **构建 - 计算 - Workers 和 Pages**
2. 点击右上角的 **创建应用程序** → 选择网页最下面的 **想要部署 Pages？开始使用** 标签 → 点击下面**拖放文件**选项框内的 **开始使用**
3. 为项目起一个名称（如 `gh-proxy`），点击 **创建项目**
4. 将 `_worker.js` 文件放入一个空白文件夹，再将这个文件夹拖入上传区域，点击 **部署站点**
5. 部署完成，访问分配的 `https://gh-proxy-xxx.pages.dev`（或你自定义的名称）即可使用

> **更新文件**：进入项目点击右上角的 → **创建部署** → **重新上传含有新版 `_worker.js`的文件夹**即可。

### 方式二：连接 GitHub 仓库（适合持续迭代）

1. 将 `_worker.js` 放置在仓库根目录
2. 在 [Cloudflare Pages](https://pages.cloudflare.com/) 新建项目，连接该仓库
3. 构建配置留空（无需构建命令），直接部署
4. 推送代码后自动触发重新部署

> **注意**：`_worker.js` 是 Cloudflare Pages Functions 的约定入口文件名，请勿重命名。

## 项目结构

```
.
└── _worker.js   # Cloudflare Pages Worker 入口，包含全部逻辑和前端界面
```

## 接口说明

| 路径 | 方法 | 说明 |
|---|---|---|
| `/` | GET | 返回网页下载界面 |
| `/<用户>/<仓库>/<分支>/<文件>` | GET | 直接代理下载对应 GitHub 文件 |
| `/download?url=<链接>` | GET | 通过链接参数下载，支持 blob/raw 两种格式 |

## 技术实现

- 运行时：Cloudflare Workers（Edge Runtime）
- 无任何第三方依赖，单文件部署
- 使用 `fetch` API 代理 `raw.githubusercontent.com` 请求并流式转发响应体
- 前端页面内联在 Worker 中，无需独立静态文件

## License

MIT
