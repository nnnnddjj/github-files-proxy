# GitHub 文件加速器

基于 Cloudflare Workers 的 GitHub 文件加速代理，解决国内访问 `raw.githubusercontent.com` 缓慢或不可用的问题。

## 功能

- **网页界面**：输入 GitHub 文件链接，自动生成加速地址并提供一键下载
- **一键复制**：加速链接、curl、wget 三条命令各配复制按钮，点击即拷贝
- **直链代理**：通过 URL 路径直接代理下载，适合脚本 / 命令行调用
- **链接兼容**：自动识别 `github.com/blob/` 格式并转为 `raw.githubusercontent.com`

## 使用方式

### 网页界面

访问部署域名，粘贴 GitHub 文件链接，自动渲染出三条可复制的命令：

```
加速链接              [复制链接]
curl -O <加速链接>    [复制curl]
wget <加速链接>       [复制wget]
```

点击「下载」按钮直接在浏览器中触发下载，「清除」按钮清空输入框。

### URL 直链

```
https://你的域名/用户/仓库/分支/文件路径
```

也支持粘贴完整 GitHub URL：

```
https://你的域名/https://github.com/用户/仓库/blob/分支/文件路径

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
