// _worker.js - GitHub 文件加速器
// 支持两种使用方式：
// 1. 访问根路径：显示网页界面，输入链接下载
// 2. 直接访问路径：https://项目.pages.dev/用户/仓库/分支/文件.txt 自动下载

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // ========== 1. 根路径：显示网页界面 ==========
    if (path === '/' || path === '/index.html') {
      return new Response(getIndexHtml(), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    // ========== 2. 直接路径下载：/用户/仓库/分支/文件 ==========
    // 例如：/user/repo/main/setup.bat
    if (path !== '/download' && path.length > 1) {
      // 去掉开头的 /
      const githubPath = path.slice(1);
      // 直接构造 raw 链接
      const rawUrl = `https://raw.githubusercontent.com/${githubPath}`;
      
      // 获取文件名
      const filename = githubPath.split('/').pop();
      const ext = filename.split('.').pop().toLowerCase();
      
      // 设置下载响应头
      let contentType = 'application/octet-stream';
      if (ext === 'txt') contentType = 'text/plain';
      if (ext === 'bat' || ext === 'reg' || ext === 'cmd') contentType = 'application/x-msdownload';
      if (ext === 'zip') contentType = 'application/zip';
      if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg';
      if (ext === 'png') contentType = 'image/png';
      if (ext === 'md') contentType = 'text/markdown';
      
      try {
        const response = await fetch(rawUrl);
        
        if (response.ok) {
          return new Response(response.body, {
            headers: {
              'Content-Type': contentType,
              'Content-Disposition': `attachment; filename="${filename}"`,
              'Cache-Control': 'public, max-age=3600'
            }
          });
        }
        // 如果 raw 请求失败，返回 404
        return new Response(`File not found: ${githubPath}`, { status: 404 });
      } catch (err) {
        return new Response(`Error: ${err.message}`, { status: 500 });
      }
    }

    // ========== 3. /download?url=xxx 接口（支持 raw 链接和 blob 链接） ==========
    if (path === '/download') {
      let fileUrl = url.searchParams.get('url');
      
      if (!fileUrl) {
        return new Response(JSON.stringify({ error: '请提供 url 参数' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // 转换为 raw 链接（支持 github.com/blob 和 raw.githubusercontent.com）
      const rawUrl = convertToRawUrl(fileUrl);
      if (!rawUrl) {
        return new Response(JSON.stringify({ error: '无法识别的 GitHub 链接格式' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // 获取文件名
      const filename = rawUrl.split('/').pop();
      const ext = filename.split('.').pop().toLowerCase();
      
      let contentType = 'application/octet-stream';
      if (ext === 'txt') contentType = 'text/plain';
      if (ext === 'bat' || ext === 'reg' || ext === 'cmd') contentType = 'application/x-msdownload';
      if (ext === 'zip') contentType = 'application/zip';
      
      try {
        const response = await fetch(rawUrl);
        if (!response.ok) {
          return new Response(JSON.stringify({ error: `文件获取失败：${response.status}` }), {
            status: response.status,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        return new Response(response.body, {
          headers: {
            'Content-Type': contentType,
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Cache-Control': 'public, max-age=3600'
          }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // ========== 4. 其他路径返回 404 ==========
    return new Response('Not Found', { status: 404 });
  }
};

// 转换各种 GitHub 链接为 raw 链接
function convertToRawUrl(url) {
  // 已经是 raw 链接
  if (url.includes('raw.githubusercontent.com')) {
    return url;
  }
  
  // github.com 的 blob 链接
  // 格式：https://github.com/用户/仓库/blob/分支/路径
  const blobMatch = url.match(/github\.com\/(.+?)\/(.+?)\/blob\/(.+)/);
  if (blobMatch) {
    const [, user, repo, path] = blobMatch;
    return `https://raw.githubusercontent.com/${user}/${repo}/${path}`;
  }
  
  // github.com 的其他文件链接（不带 blob）
  const rawMatch = url.match(/github\.com\/(.+?)\/(.+?)\/(.+)/);
  if (rawMatch) {
    const [, user, repo, path] = rawMatch;
    return `https://raw.githubusercontent.com/${user}/${repo}/${path}`;
  }
  
  return null;
}

// 内置网页界面
function getIndexHtml() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GitHub 文件加速下载</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            padding: 40px;
            max-width: 650px;
            width: 100%;
        }
        h1 { color: #333; margin-bottom: 10px; font-size: 28px; }
        .subtitle { color: #666; margin-bottom: 30px; font-size: 14px; }
        .input-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 8px; font-weight: 500; color: #555; }
        input {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 14px;
            transition: border-color 0.3s;
        }
        input:focus { outline: none; border-color: #667eea; }
        button {
            width: 100%;
            padding: 12px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s;
        }
        button:hover { transform: translateY(-2px); }
        button:disabled { opacity: 0.6; transform: none; cursor: not-allowed; }
        .status {
            margin-top: 20px;
            padding: 12px;
            border-radius: 8px;
            display: none;
        }
        .status.error { background: #fee; color: #c00; display: block; }
        .status.success { background: #efe; color: #0a0; display: block; }
        .status.info { background: #e3f2fd; color: #1976d2; display: block; }
        .example {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
        }
        .example p { color: #888; font-size: 12px; margin-bottom: 8px; }
        .example a {
            display: inline-block;
            background: #f5f5f5;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-family: monospace;
            color: #667eea;
            text-decoration: none;
            margin-right: 8px;
            margin-bottom: 8px;
            cursor: pointer;
        }
        .info-note {
            margin-top: 20px;
            background: #f0f4ff;
            padding: 12px;
            border-radius: 8px;
            font-size: 12px;
            color: #5a67d8;
        }
        footer {
            margin-top: 30px;
            text-align: center;
            color: #aaa;
            font-size: 12px;
        }
        code {
            background: #f0f0f0;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📦 GitHub 文件加速下载</h1>
        <p class="subtitle">输入链接或直接使用 URL 路径下载</p>
        
        <div class="input-group">
            <label>GitHub 文件链接</label>
            <input type="text" id="fileUrl" placeholder="https://github.com/用户/仓库/blob/分支/文件 或 https://raw.githubusercontent.com/...">
        </div>
        
        <button id="downloadBtn">⬇️ 下载文件</button>
        
        <div id="status" class="status"></div>
        
        <div class="example">
            <p>📋 快速测试（点击自动填入）：</p>
            <a onclick="setExample('https://raw.githubusercontent.com/nnnnddjj/github-files-proxy/main/README.md')">raw 格式</a>
            <a onclick="setExample('https://github.com/nnnnddjj/github-files-proxy/blob/main/README.md')">blob 格式</a>
        </div>
        
        <div class="info-note">
            💡 <strong>直接下载技巧</strong><br>
            直接访问：<code>https://你的域名.pages.dev/用户/仓库/分支/文件.txt</code><br>
            例如：<code>https://你的域名.pages.dev/nnnnddjj/github-files-proxy/main/README.md</code>
        </div>
        
        <footer>
            ✅ 支持 .txt .bat .reg .zip .exe .jpg .png 等任意格式
        </footer>
    </div>

    <script>
        const input = document.getElementById('fileUrl');
        const btn = document.getElementById('downloadBtn');
        const statusDiv = document.getElementById('status');

        function setExample(url) {
            input.value = url;
            statusDiv.className = 'status';
            statusDiv.style.display = 'none';
        }

        function showStatus(msg, type) {
            statusDiv.textContent = msg;
            statusDiv.className = 'status ' + type;
            statusDiv.style.display = 'block';
        }

        async function downloadFile() {
            let url = input.value.trim();
            if (!url) {
                showStatus('请输入 GitHub 文件链接', 'error');
                return;
            }

            btn.disabled = true;
            btn.textContent = '⏳ 处理中...';
            showStatus('正在获取文件...', 'info');

            try {
                const response = await fetch('/download?url=' + encodeURIComponent(url));
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: '下载失败' }));
                    throw new Error(errorData.error || \`HTTP \${response.status}\`);
                }

                const contentDisposition = response.headers.get('Content-Disposition');
                let filename = 'download';
                if (contentDisposition) {
                    const match = contentDisposition.match(/filename="(.+)"/);
                    if (match) filename = match[1];
                }

                const blob = await response.blob();
                const blobUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(blobUrl);
                
                showStatus(\`✅ 下载成功！文件：\${filename}\`, 'success');
                setTimeout(() => {
                    if (statusDiv.className === 'status success') statusDiv.style.display = 'none';
                }, 3000);
                
            } catch (err) {
                showStatus('❌ ' + err.message, 'error');
            } finally {
                btn.disabled = false;
                btn.textContent = '⬇️ 下载文件';
            }
        }

        btn.addEventListener('click', downloadFile);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') downloadFile();
        });
        
        window.setExample = setExample;
    </script>
</body>
</html>`;
}