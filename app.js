// 全局变量
let configs = JSON.parse(localStorage.getItem('barkConfigs') || '[]');
let deleteTargetId = null; // 待删除的配置ID

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    renderConfigs();
    lucide.createIcons();
});

// 收集表单数据
function collectFormData() {
    const params = { body: document.getElementById('body').value.trim() };
    
    ['title', 'subtitle', 'group', 'level', 'sound', 'badge', 'icon', 'url', 'copy', 'volume'].forEach(id => {
        const val = document.getElementById(id).value.trim();
        if (val) params[id] = val;
    });
    
    // 通知ID
    const notificationId = document.getElementById('notification-id').value.trim();
    if (notificationId) params.id = notificationId;
    
    if (document.getElementById('isArchive').checked) params.isArchive = '1';
    if (document.getElementById('autoCopy').checked) params.autoCopy = '1';
    if (document.getElementById('call').checked) params.call = '1';
    if (document.getElementById('action-none').checked) params.action = 'none';
    if (document.getElementById('delete-notification').checked) params.delete = '1';
    
    return params;
}

// 生成配置
function generateConfig() {
    const serverUrl = document.getElementById('server-url').value.trim();
    const deviceKey = document.getElementById('device-key').value.trim();
    const body = document.getElementById('body').value.trim();
    
    if (!serverUrl || !deviceKey || !body) {
        showToast('请填写必填项', 'error');
        return;
    }
    
    const params = collectFormData();
    
    // 生成 GET URL
    let url = `${serverUrl}/${deviceKey}`;
    if (params.title) url += `/${encodeURIComponent(params.title)}`;
    url += `/${encodeURIComponent(params.body)}`;
    
    const query = new URLSearchParams();
    Object.keys(params).forEach(k => {
        if (k !== 'title' && k !== 'body') query.append(k, params[k]);
    });
    if (query.toString()) url += `?${query}`;
    
    document.getElementById('result-url').textContent = url;
    
    // 生成 JSON
    const json = { device_key: deviceKey, ...params };
    document.getElementById('result-json').textContent = JSON.stringify(json, null, 2);
    
    // 生成 PHP
    let php = '$array = array(\n';
    Object.entries(params).forEach(([k, v], i, arr) => {
        // 数字类型不需要引号
        const needsQuotes = !['isArchive', 'badge', 'volume', 'delete', 'call', 'autoCopy'].includes(k) || isNaN(v);
        const val = needsQuotes ? `'${v}'` : v;
        php += `    '${k}'=>${val}${i < arr.length - 1 ? ',' : ''}\n`;
    });
    php += '    );';
    document.getElementById('result-php').textContent = php;
    
    // 生成 Python
    let python = `import requests\n\n`;
    python += `url = "${serverUrl}/push"\n`;
    python += `data = ${JSON.stringify(json, null, 4).replace(/"([^"]+)":/g, '"$1":')}\n\n`;
    python += `response = requests.post(url, json=data)\n`;
    python += `print(response.json())`;
    document.getElementById('result-python').textContent = python;
    
    // 生成 Node.js
    let nodejs = `const axios = require('axios');\n\n`;
    nodejs += `const data = ${JSON.stringify(json, null, 2)};\n\n`;
    nodejs += `axios.post('${serverUrl}/push', data)\n`;
    nodejs += `  .then(response => {\n`;
    nodejs += `    console.log(response.data);\n`;
    nodejs += `  })\n`;
    nodejs += `  .catch(error => {\n`;
    nodejs += `    console.error(error);\n`;
    nodejs += `  });`;
    document.getElementById('result-nodejs').textContent = nodejs;
    
    // 生成 cURL
    const curl = `curl -X "POST" "${serverUrl}/push" \\
     -H 'Content-Type: application/json; charset=utf-8' \\
     -d '${JSON.stringify(json, null, 2)}'`;
    document.getElementById('result-curl').textContent = curl;
    
    document.getElementById('result-section').classList.remove('hidden');
    
    // 应用代码高亮
    document.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block);
    });
    
    showToast('配置生成成功', 'success');
    lucide.createIcons();
}

// 切换标签
function switchTab(tab) {
    ['url', 'json', 'php', 'python', 'nodejs', 'curl'].forEach(t => {
        document.getElementById(`tab-${t}`).classList.toggle('hidden', t !== tab);
        document.querySelector(`[onclick="switchTab('${t}')"]`).classList.toggle('tab-active', t === tab);
    });
}

// 复制结果
function copyResult(type) {
    const text = document.getElementById(`result-${type}`).textContent;
    navigator.clipboard.writeText(text).then(() => {
        showToast('已复制', 'success');
    }).catch(() => {
        showToast('复制失败', 'error');
    });
}

// 保存配置
function saveConfig() {
    const params = collectFormData();
    if (!params.body) {
        showToast('请填写推送内容', 'error');
        return;
    }
    
    configs.unshift({
        id: Date.now(),
        name: params.title || '未命名',
        params: params,
        createdAt: new Date().toISOString()
    });
    
    localStorage.setItem('barkConfigs', JSON.stringify(configs));
    renderConfigs();
    showToast('配置已保存', 'success');
}

// 渲染配置列表
function renderConfigs() {
    const tbody = document.getElementById('configs-table');
    
    if (configs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center py-8 text-base-content/60">
            <i data-lucide="inbox" class="h-8 w-8 mx-auto opacity-50"></i>
            <p class="mt-2">暂无配置</p>
        </td></tr>`;
        lucide.createIcons();
        return;
    }
    
    tbody.innerHTML = configs.map((c, index) => `
        <tr>
            <th>${index + 1}</th>
            <td>
                <div class="font-bold">${c.name}</div>
                <div class="text-xs opacity-50">${new Date(c.createdAt).toLocaleString()}</div>
            </td>
            <td class="hidden sm:table-cell">
                <div class="truncate max-w-xs">${c.params.body}</div>
            </td>
            <td>
                <div class="flex gap-1">
                    <button onclick="loadConfig(${c.id})" class="btn btn-sm btn-info">
                        <i data-lucide="upload" class="h-3 w-3"></i>
                    </button>
                    <button onclick="deleteConfig(${c.id})" class="btn btn-sm btn-error">
                        <i data-lucide="trash-2" class="h-3 w-3"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    lucide.createIcons();
}

// 加载配置
function loadConfig(id) {
    const config = configs.find(c => c.id === id);
    if (!config) return;
    
    Object.entries(config.params).forEach(([k, v]) => {
        // 处理特殊字段映射
        let fieldId = k;
        if (k === 'id') fieldId = 'notification-id';
        
        const el = document.getElementById(fieldId);
        if (el) {
            if (el.type === 'checkbox') el.checked = v === '1';
            else el.value = v;
        }
    });
    
    // 处理 action 字段
    if (config.params.action === 'none') {
        document.getElementById('action-none').checked = true;
    }
    
    // 处理 delete 字段
    if (config.params.delete === '1') {
        document.getElementById('delete-notification').checked = true;
    }
    
    document.getElementById('server-url').value = 'https://api.day.app';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('配置已加载', 'success');
}

// 删除配置
function deleteConfig(id) {
    deleteTargetId = id;
    delete_modal.showModal();
}

// 确认删除
function confirmDelete() {
    if (deleteTargetId) {
        configs = configs.filter(c => c.id !== deleteTargetId);
        localStorage.setItem('barkConfigs', JSON.stringify(configs));
        renderConfigs();
        showToast('已删除', 'success');
        deleteTargetId = null;
    }
}

// 重置表单
function resetForm() {
    if (!confirm('确定重置？')) return;
    document.getElementById('bark-form').reset();
    document.getElementById('server-url').value = 'https://api.day.app';
    document.getElementById('result-section').classList.add('hidden');
    showToast('表单已重置', 'info');
}

// 加载示例
function loadExample() {
    document.getElementById('device-key').value = 'your_device_key';
    document.getElementById('title').value = '测试标题';
    document.getElementById('body').value = '这是一条测试推送！';
    document.getElementById('group').value = 'test';
    document.getElementById('sound').value = 'minuet';
    document.getElementById('isArchive').checked = true;
    showToast('示例已加载', 'success');
}

// 测试推送
async function testPush() {
    const serverUrl = document.getElementById('server-url').value.trim();
    const deviceKey = document.getElementById('device-key').value.trim();
    const body = document.getElementById('body').value.trim();
    
    if (!serverUrl || !deviceKey || !body) {
        showToast('请填写必填项', 'error');
        return;
    }
    
    try {
        showToast('发送中...', 'info');
        const params = collectFormData();
        const json = { device_key: deviceKey, ...params };
        
        const res = await fetch(`${serverUrl}/push`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(json)
        });
        
        const result = await res.json();
        
        if (res.ok && result.code === 200) {
            showToast('推送成功！', 'success');
        } else {
            showToast(`推送失败：${result.message}`, 'error');
        }
    } catch (error) {
        showToast(`错误：${error.message}`, 'error');
    }
}

// 显示提示
function showToast(msg, type = 'info') {
    const icons = { success: 'check-circle', error: 'alert-circle', info: 'info' };
    const toast = document.createElement('div');
    toast.className = `alert alert-${type} shadow-lg`;
    toast.innerHTML = `<i data-lucide="${icons[type]}" class="h-5 w-5"></i><span>${msg}</span>`;
    
    document.getElementById('toast-container').appendChild(toast);
    lucide.createIcons();
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
