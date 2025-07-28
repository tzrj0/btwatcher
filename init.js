// 使用contextBridge暴露的API

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('init-form');
    const apiUrlInput = document.getElementById('api-url');
    const apiKeyInput = document.getElementById('api-key');
    const saveBtn = document.getElementById('save-btn');
    const loading = document.getElementById('loading');
    const urlError = document.getElementById('url-error');
    const keyError = document.getElementById('key-error');
    
    // 表单验证
    function validateUrl(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
        } catch {
            return false;
        }
    }
    
    // 显示错误信息
    function showError(element, message) {
        element.textContent = message;
        element.style.display = 'block';
    }
    
    // 隐藏错误信息
    function hideError(element) {
        element.style.display = 'none';
    }
    
    // 表单提交处理
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // 重置错误信息
        hideError(urlError);
        hideError(keyError);
        
        const apiUrl = apiUrlInput.value.trim();
        const apiKey = apiKeyInput.value.trim();
        
        // 验证输入
        let hasError = false;
        
        if (!apiUrl) {
            showError(urlError, 'API 地址不能为空');
            hasError = true;
        } else if (!validateUrl(apiUrl)) {
            showError(urlError, '请输入有效的 URL 地址');
            hasError = true;
        }
        
        if (!apiKey) {
            showError(keyError, 'API 密钥不能为空');
            hasError = true;
        }
        
        if (hasError) {
            return;
        }
        
        // 显示加载状态
        saveBtn.disabled = true;
        loading.style.display = 'block';
        
        try {
            // 发送配置到主进程
            const result = await window.electron.saveConfig({
                apiUrl: apiUrl.replace(/\/$/, ''), // 移除末尾的斜杠
                apiKey: apiKey
            });
            
            if (result.success) {
                // 配置保存成功，跳转到主界面
                window.location.href = 'index.html';
            } else {
                // 显示错误信息
                if (result.error.includes('连接')) {
                    showError(urlError, result.error);
                } else {
                    showError(keyError, result.error);
                }
                saveBtn.disabled = false;
                loading.style.display = 'none';
            }
        } catch (error) {
            showError(urlError, '保存配置失败: ' + error.message);
            saveBtn.disabled = false;
            loading.style.display = 'none';
        }
    });
    
    // 输入框获得焦点时隐藏错误信息
    apiUrlInput.addEventListener('focus', () => hideError(urlError));
    apiKeyInput.addEventListener('focus', () => hideError(keyError));
    
    // 处理外部链接点击
    document.addEventListener('click', function(e) {
        // 检查是否是链接
        const link = e.target.closest('a[href]');
        if (link && link.href.startsWith('http')) {
            e.preventDefault();
            window.electron.openExternal(link.href);
        }
    });
});