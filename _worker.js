// 最终测试版 - 极简 HTML，无复杂 JS
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    // 返回极简网页界面
    if (path === '/') {
      return new Response(getIndexHtml(), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    // 处理文件下载
    if (path.length > 1) {
      let rawPath = path.slice(1);
      let targetUrl = rawPath;

      if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        targetUrl = 'https://raw.githubusercontent.com/' + targetUrl;
      }
      if (targetUrl.includes('/blob/')) {
        targetUrl = targetUrl.replace('/blob/', '/').replace('github.com', 'raw.githubusercontent.com');
      }

      const filename = targetUrl.split('/').pop().split('?')[0];
      try {
        const response = await fetch(targetUrl);
        if (response.ok) {
          return new Response(response.body, {
            headers: {
              'Content-Type': getContentType(filename),
              'Content-Disposition': `attachment; filename="${filename}"`
            }
          });
        }
        return new Response('File not found', { status: 404 });
      } catch (err) {
        return new Response('Error', { status: 500 });
      }
    }
    return new Response('Not Found', { status: 404 });
  }
};

function getContentType(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const types = {
    'txt': 'text/plain', 'md': 'text/markdown', 'json': 'application/json',
    'bat': 'application/x-msdownload', 'zip': 'application/zip',
    'jpg': 'image/jpeg', 'png': 'image/png', 'pdf': 'application/pdf'
  };
  return types[ext] || 'application/octet-stream';
}

// 极简 HTML 页面，无复杂 JS
function getIndexHtml() {
  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>GitHub 文件加速器</title>
    <style>
        body{font-family:system-ui;text-align:center;padding:50px;}
        input, button{padding:10px;margin:10px;font-size:16px;}
        .link{margin-top:20px;width:70%;margin-left:auto;margin-right:auto;text-align:left;}
        .row{display:flex;align-items:center;gap:8px;margin:6px 0;font-size:14px;}
        .row code{background:#f5f5f5;padding:6px 10px;border-radius:4px;flex:1;min-height:20px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .row button{padding:3px 10px;font-size:13px;cursor:pointer;white-space:nowrap;}
    </style>
</head>
<body>
    <h1>GitHub 文件加速器</h1>
    <p>输入 GitHub 文件链接，生成加速下载地址</p>
    <input type="text" id="fileUrl" style="width:60%;" placeholder="https://github.com/用户/仓库/blob/分支/文件">
    <button id="clearBtn">清除</button>
    <button id="downloadBtn">下载</button>
    <div id="result" class="link"></div>

    <script>
        var domain = window.location.origin;
        var input = document.getElementById('fileUrl');
        var clearBtn = document.getElementById('clearBtn');
        var btn = document.getElementById('downloadBtn');
        var resultDiv = document.getElementById('result');

        var c = String.fromCharCode(99,117,114,108);
        var w = String.fromCharCode(119,103,101,116);

        function makeRow(btnLabel, codeHolder, urlPrefixFn) {
            var row = document.createElement('div');
            row.className = 'row';

            var codeEl = document.createElement('code');
            codeEl.textContent = '';

            var copyBtn = document.createElement('button');
            copyBtn.textContent = btnLabel;
            copyBtn.onclick = function() {
                var text = (urlPrefixFn ? urlPrefixFn(codeHolder.url) : codeHolder.url);
                if (!text) return;
                navigator.clipboard.writeText(text).then(function() {
                    copyBtn.textContent = '已复制';
                    setTimeout(function() { copyBtn.textContent = btnLabel; }, 1500);
                }).catch(function() {
                    prompt('请手动复制：', text);
                });
            };

            row.appendChild(codeEl);
            row.appendChild(copyBtn);

            return { row: row, codeEl: codeEl, urlPrefixFn: urlPrefixFn, setUrl: function(u) { codeHolder.url = u; codeEl.textContent = u ? (urlPrefixFn ? urlPrefixFn(u) : u) : ''; } };
        }

        var linkRow = makeRow('复制链接', {}, null);
        var curlRow = makeRow('复制' + c, {}, function(u) { return c + ' -O ' + u; });
        var wgetRow = makeRow('复制' + w, {}, function(u) { return w + ' ' + u; });

        resultDiv.appendChild(linkRow.row);
        resultDiv.appendChild(curlRow.row);
        resultDiv.appendChild(wgetRow.row);

        function updateLink() {
            var url = input.value.trim();
            var accelUrl = url ? domain + '/' + url : '';
            linkRow.setUrl(accelUrl);
            curlRow.setUrl(accelUrl);
            wgetRow.setUrl(accelUrl);
        }

        input.addEventListener('input', updateLink);

        clearBtn.onclick = function() {
            input.value = '';
            updateLink();
        };

        btn.onclick = function() {
            var url = input.value.trim();
            if (url) {
                window.location.href = domain + '/' + url;
            } else {
                alert('请输入链接');
            }
        };
    </script>
</body>
</html>`;
}