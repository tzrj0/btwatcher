// 全局变量
let currentSite = null;
let monitorInterval = null;
let monitorStartTime = null;
let lastFetchTime = null; // 记录上一次获取日志的时间
let allLogs = [];
let stats = {
    totalRequests: 0,
    uniqueIps: new Set(),
    errorRequests: 0
};

// DOM元素
// 创建隐藏的输入框（用于兼容现有逻辑）
const createHiddenInputs = () => {
    const uaBlacklist = document.createElement('input');
    uaBlacklist.type = 'hidden';
    uaBlacklist.id = 'ua-blacklist';
    document.body.appendChild(uaBlacklist);
    
    const ipBlacklist = document.createElement('input');
    ipBlacklist.type = 'hidden';
    ipBlacklist.id = 'ip-blacklist';
    document.body.appendChild(ipBlacklist);
    
    const refreshInterval = document.createElement('input');
    refreshInterval.type = 'hidden';
    refreshInterval.id = 'refresh-interval';
    refreshInterval.value = '5';
    document.body.appendChild(refreshInterval);
    
    const maxRows = document.createElement('input');
    maxRows.type = 'hidden';
    maxRows.id = 'max-rows';
    maxRows.value = '1000';
    document.body.appendChild(maxRows);
    
    const ipFilter = document.createElement('input');
    ipFilter.type = 'hidden';
    ipFilter.id = 'ip-filter';
    document.body.appendChild(ipFilter);
};

createHiddenInputs();

const elements = {
    siteSelect: document.getElementById('site-select'),
    refreshInterval: document.getElementById('refresh-interval'),
    uaFilter: document.getElementById('ua-filter'),
    uaBlacklist: document.getElementById('ua-blacklist'),
    ipBlacklist: document.getElementById('ip-blacklist'),
    ipFilter: document.getElementById('ip-filter'),
    pathFilter: document.getElementById('path-filter'),
    statusFilter: document.getElementById('status-filter'),
    maxRows: document.getElementById('max-rows'),
    filterAbnormalRequests: document.getElementById('filter-abnormal-requests'),
    toggleMonitor: document.getElementById('toggle-monitor'),
    clearLogs: document.getElementById('clear-logs'),
    exportLogs: document.getElementById('export-logs'),
    settingsBtn: document.getElementById('settings-btn'),
    searchLogs: document.getElementById('search-logs'),
    autoScroll: document.getElementById('auto-scroll'),
    logTbody: document.getElementById('log-tbody'),
    logTable: document.getElementById('log-table'),
    noLogs: document.getElementById('no-logs'),
    alertSound: document.getElementById('alert-sound'),
    currentTime: document.getElementById('current-time'),
    connectionStatus: document.getElementById('connection-status'),
    totalRequests: document.getElementById('total-requests'),
    uniqueIps: document.getElementById('unique-ips'),
    errorRequests: document.getElementById('error-requests'),
    monitorDuration: document.getElementById('monitor-duration'),
    // 模态框元素
    settingsModal: document.getElementById('settings-modal'),
    modalRefreshInterval: document.getElementById('modal-refresh-interval'),
    modalMaxRows: document.getElementById('modal-max-rows'),
    modalIpFilter: document.getElementById('modal-ip-filter'),
    uaBlacklistInput: document.getElementById('ua-blacklist-input'),
    ipBlacklistInput: document.getElementById('ip-blacklist-input'),
    addUaBlacklist: document.getElementById('add-ua-blacklist'),
    addIpBlacklist: document.getElementById('add-ip-blacklist'),
    uaBlacklistTags: document.getElementById('ua-blacklist-tags'),
    ipBlacklistTags: document.getElementById('ip-blacklist-tags'),
    saveSettings: document.getElementById('save-settings'),
    cancelSettings: document.getElementById('cancel-settings'),
    closeModal: document.querySelector('.close'),
    // 站点管理元素
    siteManageBtn: document.getElementById('site-manage-btn'),
    siteManageModal: document.getElementById('site-manage-modal'),
    currentSiteName: document.getElementById('current-site-name'),
    refreshRedirects: document.getElementById('refresh-redirects'),
    redirectList: document.getElementById('redirect-list'),
    closeSiteManage: document.getElementById('close-site-manage'),
    closeSiteManageModal: document.querySelector('.close-site-manage')
};

// 检查是否在Electron环境中
const isElectron = window.electron !== undefined;

// 配置管理
async function loadConfig() {
    if (isElectron) {
        const config = await window.electron.loadConfig();
        elements.refreshInterval.value = config.refreshInterval || 5;
        elements.uaFilter.value = config.uaFilter || '';
        elements.uaBlacklist.value = config.uaBlacklist || '';
        elements.ipBlacklist.value = config.ipBlacklist || '';
        elements.maxRows.value = config.maxDisplayRows || 1000;
        elements.ipFilter.value = config.ipFilter || '';
        elements.filterAbnormalRequests.checked = config.filterAbnormalRequests || false;
    }
}

async function saveConfig() {
    if (isElectron) {
        const config = {
            refreshInterval: parseInt(elements.refreshInterval.value),
            uaFilter: elements.uaFilter.value,
            uaBlacklist: elements.uaBlacklist.value,
            ipBlacklist: elements.ipBlacklist.value,
            maxDisplayRows: parseInt(elements.maxRows.value),
            ipFilter: elements.ipFilter.value,
            filterAbnormalRequests: elements.filterAbnormalRequests.checked
        };
        await window.electron.saveConfig(config);
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
    await loadConfig();
    loadSites();
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
    
    // 绑定事件
    elements.toggleMonitor.addEventListener('click', toggleMonitoring);
    elements.clearLogs.addEventListener('click', clearLogs);
    elements.exportLogs.addEventListener('click', exportLogs);
    elements.searchLogs.addEventListener('input', filterLogs);
    elements.pathFilter.addEventListener('input', filterLogs);
    elements.statusFilter.addEventListener('change', filterLogs);
    
    // 设置按钮事件
    elements.settingsBtn.addEventListener('click', openSettingsModal);
    elements.closeModal.addEventListener('click', closeSettingsModal);
    elements.cancelSettings.addEventListener('click', closeSettingsModal);
    elements.saveSettings.addEventListener('click', saveSettingsDialog);
    
    // 黑名单添加按钮事件
    elements.addUaBlacklist.addEventListener('click', () => addBlacklistItem('ua'));
    elements.addIpBlacklist.addEventListener('click', () => addBlacklistItem('ip'));
    elements.uaBlacklistInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addBlacklistItem('ua');
    });
    elements.ipBlacklistInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addBlacklistItem('ip');
    });
    
    // 清空API配置按钮事件
    const clearApiBtn = document.getElementById('clear-api-config');
    if (clearApiBtn) {
        clearApiBtn.addEventListener('click', clearApiConfig);
    }
    
    // 点击模态框外部关闭
    window.addEventListener('click', (event) => {
        if (event.target === elements.settingsModal) {
            closeSettingsModal();
        }
        if (event.target === elements.siteManageModal) {
            closeSiteManageModal();
        }
    });
    
    // 站点管理事件
    elements.siteManageBtn.addEventListener('click', openSiteManageModal);
    elements.closeSiteManage.addEventListener('click', closeSiteManageModal);
    elements.closeSiteManageModal.addEventListener('click', closeSiteManageModal);
    elements.refreshRedirects.addEventListener('click', loadRedirects);
    
    // 配置变化时保存
    elements.refreshInterval.addEventListener('change', saveConfig);
    elements.uaFilter.addEventListener('change', saveConfig);
    elements.maxRows.addEventListener('change', saveConfig);
    
    // 异常请求过滤变化时重新过滤并保存配置
    elements.filterAbnormalRequests.addEventListener('change', () => {
        filterLogs();
        saveConfig();
    });
    
    // 站点选择变化时设置当前站点
    elements.siteSelect.addEventListener('change', () => {
        currentSite = elements.siteSelect.value;
    });
    
    // 请求通知权限
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
    
    // 初始化音频上下文（用户交互后激活）
    document.addEventListener('click', function initAudio() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioContext.resume();
        document.removeEventListener('click', initAudio);
    }, { once: true });
    
    // 初始化tooltip功能
    initTooltips();
    
    // 初始化双击复制功能
    initDoubleClickCopy();
});

// 更新当前时间
function updateCurrentTime() {
    const now = new Date();
    elements.currentTime.textContent = now.toLocaleString('zh-CN');
}

// 加载站点列表
async function loadSites() {
    try {
        const result = await window.electron.api.getSiteList();
        
        if (result.success && result.data) {
            elements.siteSelect.innerHTML = '<option value="">请选择站点...</option>';
            result.data.forEach(site => {
                const option = document.createElement('option');
                option.value = site.name;
                option.textContent = `${site.name} (${site.ps})`;
                elements.siteSelect.appendChild(option);
            });
        } else {
            showError('获取站点列表失败');
        }
    } catch (error) {
        showError('错误：' + error.message);
        updateConnectionStatus(false);
    }
}

// 切换监控状态
function toggleMonitoring() {
    if (monitorInterval) {
        stopMonitoring();
    } else {
        startMonitoring();
    }
}

// 开始监控
function startMonitoring() {
    if (!currentSite) {
        alert('请先选择一个站点');
        return;
    }
    
    // 切换站点时清空之前的日志
    allLogs = [];
    processedLogs.clear(); // 清空已处理日志集合
    elements.logTbody.innerHTML = '';
    stats = {
        totalRequests: 0,
        uniqueIps: new Set(),
        errorRequests: 0
    };
    updateStatsDisplay();
    lastFetchTime = null; // 重置最后获取时间
    
    monitorStartTime = Date.now();
    
    // 更新按钮状态
    elements.toggleMonitor.textContent = '停止监控';
    elements.toggleMonitor.classList.remove('btn-primary');
    elements.toggleMonitor.classList.add('btn-danger');
    elements.siteSelect.disabled = true;
    
    // 立即获取一次日志
    fetchLogs();
    
    // 设置定时刷新
    const interval = parseInt(elements.refreshInterval.value) || 5;
    monitorInterval = setInterval(fetchLogs, interval * 1000);
    
    // 更新监控时长
    updateMonitorDuration();
    setInterval(updateMonitorDuration, 1000);
}

// 停止监控
function stopMonitoring() {
    if (monitorInterval) {
        clearInterval(monitorInterval);
        monitorInterval = null;
    }
    
    // 更新按钮状态
    elements.toggleMonitor.textContent = '开始监控';
    elements.toggleMonitor.classList.remove('btn-danger');
    elements.toggleMonitor.classList.add('btn-primary');
    elements.siteSelect.disabled = false;
    
    monitorStartTime = null;
}

// 记录已经处理过的日志（用于去重）
const processedLogs = new Set();

// 生成日志的唯一标识
function getLogKey(log) {
    return `${log.ip}_${log.time}_${log.url}_${log.status}_${log.userAgent || ''}`;
}

// 稳定的日志排序函数
function stableLogSort(a, b) {
    const timeA = parseLogTime(a.time);
    const timeB = parseLogTime(b.time);
    
    // 首先按时间排序
    if (timeA !== timeB) {
        return timeA - timeB;
    }
    
    // 时间相同时，按IP排序
    if (a.ip !== b.ip) {
        return a.ip.localeCompare(b.ip);
    }
    
    // IP也相同时，按URL排序
    if (a.url !== b.url) {
        return a.url.localeCompare(b.url);
    }
    
    // URL也相同时，按状态码排序
    if (a.status !== b.status) {
        return a.status.localeCompare(b.status);
    }
    
    // 最后按User-Agent排序
    return (a.userAgent || '').localeCompare(b.userAgent || '');
}

// 获取日志
async function fetchLogs() {
    if (!currentSite) return;
    
    try {
        const result = await window.electron.api.getSiteLogs(currentSite);
        
        if (result.success && result.data) {
            processLogs(result.data);
            updateConnectionStatus(true);
        } else {
            showError('获取日志失败: ' + (result.error || '未知错误'));
            updateConnectionStatus(false);
        }
    } catch (error) {
        showError('错误：' + error.message);
        updateConnectionStatus(false);
    }
}

// 处理日志数据
function processLogs(newLogs) {
    const uaKeywords = elements.uaFilter.value.split(',').map(k => k.trim()).filter(k => k);
    const uaBlacklist = elements.uaBlacklist.value.split(',').map(k => k.trim()).filter(k => k);
    const ipBlacklist = elements.ipBlacklist.value.split(',').map(k => k.trim()).filter(k => k);
    const maxRows = parseInt(elements.maxRows.value) || 1000;
    let hasNewAlerts = false;
    const currentFetchTime = new Date();
    
    console.log('收到日志数量:', newLogs.length);
    console.log('当前已有日志:', allLogs.length);
    console.log('最大显示行数:', maxRows);
    
    // 先过滤掉黑名单中的日志
    const filteredLogs = newLogs.filter(log => {
        // 过滤异常请求
        if (elements.filterAbnormalRequests.checked) {
            const method = log.method || '';
            const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS', 'PATCH'];
            if (!method || method === '-' || !validMethods.includes(method.toUpperCase())) {
                return false;
            }
        }
        
        // IP黑名单过滤
        if (ipBlacklist.length > 0 && log.ip) {
            const isBlacklisted = ipBlacklist.some(ip => {
                return log.ip === ip || log.ip.startsWith(ip);
            });
            if (isBlacklisted) {
                return false;
            }
        }
        
        // UA黑名单过滤
        if (uaBlacklist.length > 0 && log.userAgent) {
            const ua = log.userAgent.toLowerCase();
            const isBlacklisted = uaBlacklist.some(keyword => {
                const keywordLower = keyword.toLowerCase();
                return ua.includes(keywordLower);
            });
            if (isBlacklisted) {
                return false;
            }
        }
        return true;
    });
    
    console.log(`过滤后日志数量: ${filteredLogs.length}`);
    
    // 第一次加载或者切换站点时
    if (allLogs.length === 0 && processedLogs.size === 0) {
        // 清空DOM
        elements.logTbody.innerHTML = '';
        
        // 使用稳定排序函数
        const sortedLogs = filteredLogs.sort(stableLogSort);
        
        // 如果日志数量超过最大显示数，只取最新的
        let logsToAdd = sortedLogs;
        if (sortedLogs.length > maxRows) {
            logsToAdd = sortedLogs.slice(-maxRows); // 取最后的maxRows条
            console.log(`初始加载：日志数量超过最大显示数，只显示最新的 ${maxRows} 条`);
        }
        
        // 添加日志到内存和DOM
        logsToAdd.forEach(log => {
            const logKey = getLogKey(log);
            processedLogs.add(logKey);
            allLogs.push(log);
            updateStats(log);
            
            // 检查UA监控
            let shouldHighlight = false;
            if (uaKeywords.length > 0 && log.userAgent) {
                const ua = log.userAgent.toLowerCase();
                const matched = uaKeywords.some(keyword => {
                    const keywordLower = keyword.toLowerCase();
                    return ua.includes(keywordLower);
                });
                if (matched) {
                    shouldHighlight = true;
                }
            }
            
            addLogRow(log, false, shouldHighlight);
        });
    } else {
        // 增量更新模式
        // 创建一个包含所有日志（旧的+新的）的数组
        const allLogsMap = new Map();
        
        // 先添加已有的日志
        allLogs.forEach(log => {
            const logKey = getLogKey(log);
            allLogsMap.set(logKey, log);
        });
        
        // 添加新的日志（会覆盖重复的）
        const reallyNewLogs = [];
        filteredLogs.forEach(log => {
            const logKey = getLogKey(log);
            if (!allLogsMap.has(logKey)) {
                reallyNewLogs.push(log);
            }
            allLogsMap.set(logKey, log);
        });
        
        console.log(`发现 ${reallyNewLogs.length} 条真正的新日志`);
        
        // 记录是否应该滚动（有新日志且不是空状态）
        const shouldScroll = reallyNewLogs.length > 0 && elements.autoScroll.checked && processedLogs.size > reallyNewLogs.length;
        
        // 转换为数组并使用稳定排序函数
        const allLogsSorted = Array.from(allLogsMap.values()).sort(stableLogSort);
        
        // 只保留最新的maxRows条
        let finalLogs = allLogsSorted;
        if (allLogsSorted.length > maxRows) {
            finalLogs = allLogsSorted.slice(-maxRows);
            console.log(`总日志数超过限制，只保留最新的 ${maxRows} 条`);
        }
        
        // 完全重建显示
        elements.logTbody.innerHTML = '';
        allLogs = [];
        processedLogs.clear();
        
        // 重新添加所有需要显示的日志
        finalLogs.forEach(log => {
            const logKey = getLogKey(log);
            processedLogs.add(logKey);
            allLogs.push(log);
            
            // 判断是否是新日志
            const isNewLog = reallyNewLogs.some(newLog => getLogKey(newLog) === logKey);
            
            // 检查UA监控
            let shouldHighlight = false;
            if (uaKeywords.length > 0 && log.userAgent) {
                const ua = log.userAgent.toLowerCase();
                const matched = uaKeywords.some(keyword => {
                    const keywordLower = keyword.toLowerCase();
                    return ua.includes(keywordLower);
                });
                if (matched) {
                    shouldHighlight = true;
                    if (isNewLog) {
                        hasNewAlerts = true;
                        console.log('新的匹配日志，将触发提示音');
                    }
                }
            }
            
            addLogRow(log, isNewLog, shouldHighlight);
        });
        
        // 重新计算统计信息
        stats = {
            totalRequests: 0,
            uniqueIps: new Set(),
            errorRequests: 0
        };
        allLogs.forEach(log => updateStats(log));
        
        // 在所有日志渲染完成后执行滚动
        if (shouldScroll) {
            console.log('触发自动滚动');
            setTimeout(() => {
                const lastRow = elements.logTbody.lastElementChild;
                if (lastRow) {
                    lastRow.scrollIntoView({ behavior: 'smooth', block: 'end' });
                }
            }, 100);
        }
    }
    
    // 更新最后获取时间
    lastFetchTime = currentFetchTime;
    
    // 播放提示音
    if (hasNewAlerts) {
        playAlertSound();
    }
    
    // 更新UI
    updateNoLogsDisplay();
    filterLogs();
}

// 已移除enforceMaxRows函数，因为现在在processLogs中直接处理

// 更新统计信息
function updateStats(log) {
    stats.totalRequests++;
    stats.uniqueIps.add(log.ip);
    
    const status = parseInt(log.status);
    if (status >= 400) {
        stats.errorRequests++;
    }
    
    elements.totalRequests.textContent = stats.totalRequests;
    elements.uniqueIps.textContent = stats.uniqueIps.size;
    elements.errorRequests.textContent = stats.errorRequests;
}

// 创建带tooltip的单元格内容
function createTooltipCell(text, maxLength) {
    if (!text || text === '-' || text.length <= maxLength) {
        return text || '-';
    }
    
    const truncated = truncate(text, maxLength);
    return `<span class="tooltip-container" data-tooltip="${escapeHtml(text)}">${escapeHtml(truncated)}</span>`;
}

// 转义HTML特殊字符
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 初始化tooltip
function initTooltips() {
    let currentTooltip = null;
    
    document.addEventListener('mouseover', (e) => {
        const tooltipContainer = e.target.closest('.tooltip-container');
        if (tooltipContainer) {
            const text = tooltipContainer.getAttribute('data-tooltip');
            if (text) {
                // 移除之前的tooltip
                if (currentTooltip) {
                    currentTooltip.remove();
                }
                
                // 创建tooltip wrapper
                const wrapper = document.createElement('div');
                wrapper.className = 'tooltip-wrapper';
                
                // 创建tooltip内容
                const tooltip = document.createElement('div');
                tooltip.className = 'tooltip-popup';
                tooltip.textContent = text;
                wrapper.appendChild(tooltip);
                
                // 添加到body
                document.body.appendChild(wrapper);
                
                // 计算位置
                const containerRect = tooltipContainer.getBoundingClientRect();
                
                // 设置初始位置（在元素上方居中）
                let left = containerRect.left + (containerRect.width / 2);
                let top = containerRect.top;
                
                wrapper.style.left = left + 'px';
                wrapper.style.top = top + 'px';
                
                // 获取tooltip尺寸
                const wrapperRect = wrapper.getBoundingClientRect();
                
                // 调整水平位置
                left = left - (wrapperRect.width / 2);
                
                // 确保不超出左边界
                if (left < 5) {
                    left = 5;
                }
                // 确保不超出右边界
                else if (left + wrapperRect.width > window.innerWidth - 5) {
                    left = window.innerWidth - wrapperRect.width - 5;
                }
                
                // 默认显示在上方
                top = containerRect.top - wrapperRect.height;
                
                // 如果超出顶部，显示在下方
                if (top < 5) {
                    top = containerRect.bottom;
                    wrapper.classList.add('bottom');
                }
                
                wrapper.style.left = left + 'px';
                wrapper.style.top = top + 'px';
                
                // 显示tooltip
                setTimeout(() => {
                    tooltip.classList.add('show');
                }, 10);
                
                currentTooltip = wrapper;
            }
        }
    });
    
    document.addEventListener('mouseout', (e) => {
        const tooltipContainer = e.target.closest('.tooltip-container');
        if (tooltipContainer && currentTooltip) {
            const tooltip = currentTooltip.querySelector('.tooltip-popup');
            if (tooltip) {
                tooltip.classList.remove('show');
            }
            setTimeout(() => {
                if (currentTooltip) {
                    currentTooltip.remove();
                    currentTooltip = null;
                }
            }, 300);
        }
    });
}

// 初始化双击复制功能
function initDoubleClickCopy() {
    // 创建复制提示
    let copyTooltip = null;
    
    document.addEventListener('dblclick', (e) => {
        const td = e.target.closest('td');
        if (td && td.closest('#log-table')) {
            // 获取单元格文本内容
            let textToCopy = '';
            
            // 检查是否有tooltip容器（包含完整内容）
            const tooltipContainer = td.querySelector('.tooltip-container');
            if (tooltipContainer) {
                textToCopy = tooltipContainer.getAttribute('data-tooltip');
            } else {
                textToCopy = td.textContent.trim();
            }
            
            // 复制到剪贴板
            if (textToCopy) {
                // 使用现代剪贴板API
                if (navigator.clipboard && window.isSecureContext) {
                    navigator.clipboard.writeText(textToCopy).then(() => {
                        showCopyTooltip(e.pageX, e.pageY, '已复制到剪贴板');
                    }).catch(err => {
                        // 降级到旧方法
                        fallbackCopyTextToClipboard(textToCopy);
                        showCopyTooltip(e.pageX, e.pageY, '已复制到剪贴板');
                    });
                } else {
                    // 使用旧方法
                    fallbackCopyTextToClipboard(textToCopy);
                    showCopyTooltip(e.pageX, e.pageY, '已复制到剪贴板');
                }
            }
        }
    });
    
    // 降级复制方法
    function fallbackCopyTextToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
        } catch (err) {
            console.error('复制失败:', err);
        }
        
        document.body.removeChild(textArea);
    }
    
    // 显示复制提示
    function showCopyTooltip(x, y, message) {
        // 移除之前的提示
        if (copyTooltip) {
            copyTooltip.remove();
        }
        
        // 创建新提示
        copyTooltip = document.createElement('div');
        copyTooltip.className = 'copy-tooltip';
        copyTooltip.textContent = message;
        copyTooltip.style.left = x + 'px';
        copyTooltip.style.top = (y - 30) + 'px';
        
        document.body.appendChild(copyTooltip);
        
        // 添加显示类
        setTimeout(() => {
            copyTooltip.classList.add('show');
        }, 10);
        
        // 1.5秒后移除
        setTimeout(() => {
            if (copyTooltip) {
                copyTooltip.classList.remove('show');
                setTimeout(() => {
                    if (copyTooltip) {
                        copyTooltip.remove();
                        copyTooltip = null;
                    }
                }, 300);
            }
        }, 1500);
    }
}

// 添加日志行
function addLogRow(log, isNew = false, isAlert = false) {
    const tr = document.createElement('tr');
    if (isNew) {
        tr.classList.add('log-highlight');
        setTimeout(() => tr.classList.remove('log-highlight'), 2000);
    }
    
    // UA监控匹配的特殊高亮
    if (isAlert) {
        tr.style.backgroundColor = '#ffeaa7';
        tr.style.fontWeight = 'bold';
        tr.style.border = '2px solid #fdcb6e';
        console.log('添加高亮行:', log.userAgent);
    }
    
    const statusClass = `status-${Math.floor(parseInt(log.status) / 100)}00`;
    
    // 将日志时间转换为北京时间显示
    const beijingTime = parseLogTime(log.time);
    const formattedTime = formatDateTime(beijingTime);
    
    // 限制请求方式最多4个字母
    const method = log.method.length > 4 ? log.method.substring(0, 4) : log.method;
    
    tr.innerHTML = `
        <td title="${log.time}">${formattedTime}</td>
        <td>${log.ip}</td>
        <td>${method}</td>
        <td class="url">${createTooltipCell(log.url, 50)}</td>
        <td class="${statusClass}">${log.status}</td>
        <td>${formatSize(log.size)}</td>
        <td class="user-agent" ${isAlert ? 'style="color: #ff6348;"' : ''}>${createTooltipCell(log.userAgent, 50)}</td>
        <td class="referer">${createTooltipCell(log.referer, 50)}</td>
    `;
    
    tr.dataset.log = JSON.stringify(log);
    elements.logTbody.appendChild(tr);
    
    // 只在IP列添加右键菜单事件
    const ipCell = tr.querySelector('td:nth-child(2)'); // IP列是第二列
    ipCell.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showContextMenu(e, log);
    });
}

// 显示右键菜单
function showContextMenu(event, log) {
    // 移除旧的菜单
    const oldMenu = document.querySelector('.context-menu');
    if (oldMenu) {
        oldMenu.remove();
    }
    
    // 创建右键菜单
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.innerHTML = `
        <div class="menu-item" data-action="add-ip-blacklist">添加到IP黑名单</div>
        <div class="menu-item" data-action="block-ip">禁用IP访问（防火墙）</div>
    `;
    
    // 设置菜单位置
    menu.style.left = event.pageX + 'px';
    menu.style.top = event.pageY + 'px';
    
    document.body.appendChild(menu);
    
    // 菜单项点击事件
    menu.addEventListener('click', async (e) => {
        const item = e.target.closest('.menu-item');
        if (!item) return;
        
        const action = item.dataset.action;
        
        switch (action) {
            case 'add-ip-blacklist':
                addIpToBlacklist(log.ip);
                break;
                
            case 'block-ip':
                await blockIpWithFirewall(log.ip);
                break;
        }
        
        menu.remove();
    });
    
    // 点击其他地方关闭菜单
    setTimeout(() => {
        document.addEventListener('click', function closeMenu() {
            menu.remove();
            document.removeEventListener('click', closeMenu);
        });
    }, 0);
}

// 添加IP到黑名单
function addIpToBlacklist(ip) {
    const currentBlacklist = elements.ipBlacklist.value.split(',').map(i => i.trim()).filter(i => i);
    
    if (!currentBlacklist.includes(ip)) {
        currentBlacklist.push(ip);
        elements.ipBlacklist.value = currentBlacklist.join(', ');
        saveConfig();
        filterLogs();
        showToast(`IP ${ip} 已添加到黑名单`);
    } else {
        showToast(`IP ${ip} 已在黑名单中`);
    }
}

// 通过防火墙禁用IP
async function blockIpWithFirewall(ip) {
    if (!confirm(`确定要在防火墙中禁用IP ${ip} 的访问吗？`)) {
        return;
    }
    
    try {
        const result = await window.electron.api.request({
            endpoint: 'addFirewallRule',
            data: {
                ip: ip,
                brief: `从日志监控添加 - ${new Date().toLocaleString()}`
            }
        });
        
        if (result.success) {
            showToast(`已成功禁用IP ${ip} 的访问`);
        } else {
            alert(`禁用IP失败: ${result.error?.message || '未知错误'}`);
        }
    } catch (error) {
        console.error('防火墙操作失败:', error);
        alert(`防火墙操作失败: ${error.message}`);
    }
}

// 复制到剪贴板
function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(err => {
            console.error('复制失败:', err);
        });
    } else {
        // 降级方案
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
    }
}

// 显示提示消息
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 2000);
}

// 过滤日志
function filterLogs() {
    const searchTerm = elements.searchLogs.value.toLowerCase();
    const pathFilter = elements.pathFilter.value.toLowerCase();
    const ipFilter = elements.ipFilter.value.toLowerCase();
    const statusFilter = elements.statusFilter.value;
    const uaBlacklist = elements.uaBlacklist.value.split(',').map(k => k.trim()).filter(k => k);
    const ipBlacklist = elements.ipBlacklist.value.split(',').map(k => k.trim()).filter(k => k);
    
    const rows = elements.logTbody.querySelectorAll('tr');
    rows.forEach(row => {
        const log = JSON.parse(row.dataset.log);
        let show = true;
        
        // 过滤异常请求
        if (elements.filterAbnormalRequests.checked) {
            const method = log.method || '';
            const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS', 'PATCH'];
            if (!method || method === '-' || !validMethods.includes(method.toUpperCase())) {
                show = false;
            }
        }
        
        // 搜索过滤
        if (searchTerm) {
            const searchableText = Object.values(log).join(' ').toLowerCase();
            show = show && searchableText.includes(searchTerm);
        }
        
        // 路径过滤
        if (pathFilter) {
            show = show && log.url.toLowerCase().includes(pathFilter);
        }
        
        // IP过滤
        if (ipFilter) {
            show = show && log.ip.toLowerCase().includes(ipFilter);
        }
        
        // 状态码过滤
        if (statusFilter) {
            show = show && log.status.startsWith(statusFilter);
        }
        
        // IP黑名单过滤
        if (ipBlacklist.length > 0 && log.ip) {
            const isBlacklisted = ipBlacklist.some(ip => {
                return log.ip === ip || log.ip.startsWith(ip);
            });
            if (isBlacklisted) {
                show = false;
            }
        }
        
        // UA黑名单过滤
        if (uaBlacklist.length > 0 && log.userAgent) {
            const ua = log.userAgent.toLowerCase();
            const isBlacklisted = uaBlacklist.some(keyword => {
                const keywordLower = keyword.toLowerCase();
                return ua.includes(keywordLower);
            });
            if (isBlacklisted) {
                show = false;
            }
        }
        
        row.classList.toggle('hidden', !show);
    });
}

// 清空日志
function clearLogs() {
    if (confirm('确定要清空所有日志吗？')) {
        allLogs = [];
        stats = {
            totalRequests: 0,
            uniqueIps: new Set(),
            errorRequests: 0
        };
        elements.logTbody.innerHTML = '';
        updateNoLogsDisplay();
        updateStatsDisplay();
    }
}

// 导出日志
function exportLogs() {
    if (allLogs.length === 0) {
        alert('没有日志可以导出');
        return;
    }
    
    // 获取当前的过滤条件
    const uaBlacklist = elements.uaBlacklist.value.split(',').map(k => k.trim()).filter(k => k);
    const searchTerm = elements.searchLogs.value.toLowerCase();
    const ipFilter = elements.ipFilter.value.toLowerCase();
    const statusFilter = elements.statusFilter.value;
    
    // 过滤日志
    const exportLogs = allLogs.filter(log => {
        // 过滤异常请求
        if (elements.filterAbnormalRequests.checked) {
            const method = log.method || '';
            const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS', 'PATCH'];
            if (!method || method === '-' || !validMethods.includes(method.toUpperCase())) {
                return false;
            }
        }
        
        // UA黑名单过滤
        if (uaBlacklist.length > 0 && log.userAgent) {
            const ua = log.userAgent.toLowerCase();
            const isBlacklisted = uaBlacklist.some(keyword => {
                const keywordLower = keyword.toLowerCase();
                return ua.includes(keywordLower);
            });
            if (isBlacklisted) return false;
        }
        
        // 搜索过滤
        if (searchTerm) {
            const searchableText = Object.values(log).join(' ').toLowerCase();
            if (!searchableText.includes(searchTerm)) return false;
        }
        
        // IP过滤
        if (ipFilter && !log.ip.toLowerCase().includes(ipFilter)) return false;
        
        // 状态码过滤
        if (statusFilter && !log.status.startsWith(statusFilter)) return false;
        
        return true;
    });
    
    if (exportLogs.length === 0) {
        alert('过滤后没有日志可以导出');
        return;
    }
    
    const csv = convertToCSV(exportLogs);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `logs_${currentSite}_${new Date().toISOString()}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 转换为CSV格式
function convertToCSV(logs) {
    const headers = ['时间', 'IP地址', '方法', 'URL', '状态码', '大小', 'User-Agent', '来源'];
    const rows = logs.map(log => [
        log.time,
        log.ip,
        log.method,
        log.url,
        log.status,
        log.size,
        log.userAgent,
        log.referer
    ]);
    
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    return '\ufeff' + csvContent; // 添加BOM以支持中文
}

// 播放提示音
function playAlertSound() {
    // 尝试使用HTML5音频元素
    elements.alertSound.play().catch(e => {
        console.log('无法播放音频文件，尝试使用Web Audio API:', e);
        
        // 使用Web Audio API创建简单的提示音
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.3);
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
            
            console.log('提示音已播放');
        } catch (audioError) {
            console.error('无法创建提示音:', audioError);
            // 最后的备选方案：使用浏览器通知
            if (Notification.permission === 'granted') {
                new Notification('UA监控提醒', {
                    body: '检测到匹配的User-Agent访问',
                    icon: '/favicon.ico'
                });
            }
        }
    });
}

// 更新连接状态
function updateConnectionStatus(connected) {
    const statusEl = elements.connectionStatus;
    if (connected) {
        statusEl.textContent = '● 已连接';
        statusEl.style.color = '#67c23a';
    } else {
        statusEl.textContent = '● 连接断开';
        statusEl.style.color = '#f56c6c';
    }
}

// 更新监控时长
function updateMonitorDuration() {
    if (!monitorStartTime) return;
    
    const duration = Date.now() - monitorStartTime;
    const hours = Math.floor(duration / 3600000);
    const minutes = Math.floor((duration % 3600000) / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    
    elements.monitorDuration.textContent = 
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// 更新统计显示
function updateStatsDisplay() {
    elements.totalRequests.textContent = stats.totalRequests;
    elements.uniqueIps.textContent = stats.uniqueIps.size;
    elements.errorRequests.textContent = stats.errorRequests;
}

// 更新无日志显示
function updateNoLogsDisplay() {
    elements.noLogs.style.display = allLogs.length === 0 ? 'block' : 'none';
    elements.logTable.style.display = allLogs.length === 0 ? 'none' : 'table';
}

// 工具函数
// formatTime函数已经不需要了，因为我们在addLogRow中直接使用parseLogTime和formatDateTime

// 解析日志时间并转换为Date对象（考虑时区）
function parseLogTime(timeStr) {
    if (!timeStr || timeStr === '-') return new Date(0);
    
    try {
        // 标准格式 01/Apr/2025:00:45:00 +0000
        const match = timeStr.match(/(\d{2})\/(\w{3})\/(\d{4}):(\d{2}):(\d{2}):(\d{2})\s+([+-]\d{4})/);
        if (match) {
            const months = {
                'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3,
                'May': 4, 'Jun': 5, 'Jul': 6, 'Aug': 7,
                'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
            };
            const [, day, month, year, hour, minute, second, timezone] = match;
            
            // 解析时区偏移
            const tzSign = timezone[0] === '+' ? 1 : -1;
            const tzHours = parseInt(timezone.substring(1, 3));
            const tzMinutes = parseInt(timezone.substring(3, 5));
            const tzOffsetMillis = tzSign * (tzHours * 60 + tzMinutes) * 60 * 1000;
            
            // 如果已经是北京时间（+0800），直接使用
            if (timezone === '+0800') {
                const beijingDate = new Date(
                    parseInt(year),
                    months[month],
                    parseInt(day),
                    parseInt(hour),
                    parseInt(minute),
                    parseInt(second)
                );
                console.log(`日志已是北京时间: ${timeStr} -> ${beijingDate.toLocaleString('zh-CN')}`);
                return beijingDate;
            }
            
            // 创建本地时间（假设日志中的时间是该时区的本地时间）
            const localDate = new Date(
                parseInt(year),
                months[month],
                parseInt(day),
                parseInt(hour),
                parseInt(minute),
                parseInt(second)
            );
            
            // 转换为UTC时间
            const utcTime = localDate.getTime() - tzOffsetMillis;
            
            // 转换为北京时间（UTC+8）
            const beijingTime = utcTime + (8 * 60 * 60 * 1000);
            const beijingDate = new Date(beijingTime);
            
            // 调试信息
            const debugInfo = {
                原始时间: timeStr,
                时区: timezone,
                本地时间: localDate.toISOString(),
                UTC时间: new Date(utcTime).toISOString(),
                北京时间: beijingDate.toLocaleString('zh-CN')
            };
            console.log('时间转换:', debugInfo);
            
            return beijingDate;
        }
        
        // 如果无法解析，返回当前时间
        console.warn('无法解析日志时间格式:', timeStr);
        return new Date();
    } catch (e) {
        console.error('解析日志时间失败:', e);
        return new Date();
    }
}

// 格式化日期时间
function formatDateTime(date) {
    if (!(date instanceof Date)) return '-';
    return date.toLocaleString('zh-CN', { 
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
}

function truncate(str, len) {
    if (!str) return '-';
    return str.length > len ? str.substring(0, len) + '...' : str;
}

function formatSize(size) {
    if (!size || size === '-') return '-';
    const num = parseInt(size);
    if (isNaN(num)) return size;
    
    if (num < 1024) return num + ' B';
    if (num < 1024 * 1024) return (num / 1024).toFixed(2) + ' KB';
    return (num / (1024 * 1024)).toFixed(2) + ' MB';
}

function showError(message) {
    console.error(message);
    // 可以添加更友好的错误提示UI
}

// 临时存储黑名单数据
let tempUaBlacklist = [];
let tempIpBlacklist = [];

// 打开设置对话框
function openSettingsModal() {
    // 加载当前设置
    elements.modalRefreshInterval.value = elements.refreshInterval.value;
    elements.modalMaxRows.value = elements.maxRows.value;
    elements.modalIpFilter.value = elements.ipFilter.value;
    
    // 解析黑名单
    tempUaBlacklist = elements.uaBlacklist.value.split(',').filter(k => k.trim());
    tempIpBlacklist = elements.ipBlacklist.value.split(',').filter(k => k.trim());
    
    // 渲染黑名单标签
    renderBlacklistTags('ua');
    renderBlacklistTags('ip');
    
    // 清空输入框
    elements.uaBlacklistInput.value = '';
    elements.ipBlacklistInput.value = '';
    
    elements.settingsModal.style.display = 'block';
}

// 关闭设置对话框
function closeSettingsModal() {
    elements.settingsModal.style.display = 'none';
}

// 添加黑名单项
function addBlacklistItem(type) {
    const input = type === 'ua' ? elements.uaBlacklistInput : elements.ipBlacklistInput;
    const value = input.value.trim();
    
    if (!value) return;
    
    const list = type === 'ua' ? tempUaBlacklist : tempIpBlacklist;
    
    // 避免重复添加
    if (!list.includes(value)) {
        list.push(value);
        renderBlacklistTags(type);
    }
    
    // 清空输入框
    input.value = '';
    input.focus();
}

// 删除黑名单项
function removeBlacklistItem(type, index) {
    const list = type === 'ua' ? tempUaBlacklist : tempIpBlacklist;
    list.splice(index, 1);
    renderBlacklistTags(type);
}

// 渲染黑名单标签
function renderBlacklistTags(type) {
    const container = type === 'ua' ? elements.uaBlacklistTags : elements.ipBlacklistTags;
    const list = type === 'ua' ? tempUaBlacklist : tempIpBlacklist;
    
    container.innerHTML = '';
    
    list.forEach((item, index) => {
        const tag = document.createElement('div');
        tag.className = 'blacklist-tag';
        tag.innerHTML = `
            <span class="blacklist-tag-text" title="${item}">${item}</span>
            <span class="blacklist-tag-close" onclick="removeBlacklistItem('${type}', ${index})">×</span>
        `;
        container.appendChild(tag);
    });
}

// 清空API配置
async function clearApiConfig() {
    if (confirm('确定要清空API配置吗？清空后需要重新配置连接信息。')) {
        try {
            const result = await window.electron.clearApiConfig();
            if (result.success) {
                alert('API配置已清空，应用将重新启动。');
                // 重新加载应用，显示初始化界面
                window.location.reload();
            } else {
                alert('清空配置失败: ' + result.error);
            }
        } catch (error) {
            alert('操作失败: ' + error.message);
        }
    }
}

// 保存设置
function saveSettingsDialog() {
    // 更新基础设置
    elements.refreshInterval.value = elements.modalRefreshInterval.value;
    elements.maxRows.value = elements.modalMaxRows.value;
    elements.ipFilter.value = elements.modalIpFilter.value;
    
    // 更新黑名单
    elements.uaBlacklist.value = tempUaBlacklist.join(',');
    elements.ipBlacklist.value = tempIpBlacklist.join(',');
    
    // 保存配置
    saveConfig();
    
    // 应用过滤
    filterLogs();
    
    // 如果正在监控，需要重新处理当前显示的日志
    if (monitorInterval) {
        // 如果最大行数变小了，可能需要重新处理日志
        const maxRows = parseInt(elements.maxRows.value);
        if (allLogs.length > maxRows) {
            // 重新处理所有日志以应用新的限制
            const tempLogs = [...allLogs];
            allLogs = [];
            processedLogs.clear();
            processLogs(tempLogs);
        }
    }
    
    // 关闭对话框
    closeSettingsModal();
}

// 使removeBlacklistItem全局可用（用于onclick）
window.removeBlacklistItem = removeBlacklistItem;

// 站点管理功能
let currentRedirects = [];

// 打开站点管理对话框
async function openSiteManageModal() {
    // 检查是否已选择站点
    if (!currentSite) {
        alert('请先在主页选择一个站点');
        return;
    }
    
    elements.siteManageModal.style.display = 'block';
    elements.currentSiteName.textContent = currentSite;
    
    // 自动加载当前站点的重定向列表
    await loadRedirects();
}

// 关闭站点管理对话框
function closeSiteManageModal() {
    elements.siteManageModal.style.display = 'none';
}

// 加载重定向列表
async function loadRedirects() {
    if (!currentSite) {
        elements.redirectList.innerHTML = '<div class="no-redirects">请先在主页选择站点</div>';
        return;
    }
    
    elements.redirectList.innerHTML = '<div class="no-redirects">加载中...</div>';
    
    try {
        const result = await window.electron.api.getRedirectList(currentSite);
        if (result.success) {
            currentRedirects = result.data || [];
            renderRedirects();
        } else {
            elements.redirectList.innerHTML = '<div class="no-redirects">加载失败</div>';
        }
    } catch (error) {
        console.error('加载重定向失败:', error);
        elements.redirectList.innerHTML = '<div class="no-redirects">加载失败</div>';
    }
}

// 渲染重定向列表
function renderRedirects() {
    if (currentRedirects.length === 0) {
        elements.redirectList.innerHTML = '<div class="no-redirects">暂无重定向规则</div>';
        return;
    }
    
    elements.redirectList.innerHTML = currentRedirects.map((redirect, index) => {
        const isActive = redirect.type === 1;  // type 1 是启用，type 0 是暂停
        return `
            <div class="redirect-item" data-index="${index}">
                <div class="redirect-header">
                    <div class="redirect-title">${redirect.redirectpath || '/'}</div>
                    <div class="redirect-status">
                        <span class="status-badge ${isActive ? 'status-active' : 'status-paused'}">
                            ${isActive ? '启用' : '暂停'}
                        </span>
                    </div>
                </div>
                <div class="redirect-details">
                    <div class="redirect-detail">
                        <span class="detail-label">重定向类型:</span>
                        <span class="detail-value">${redirect.redirecttype}</span>
                    </div>
                    <div class="redirect-detail">
                        <span class="detail-label">目标URL:</span>
                        <span class="detail-value">${redirect.tourl}</span>
                    </div>
                    <div class="redirect-detail">
                        <span class="detail-label">匹配类型:</span>
                        <span class="detail-value">${redirect.domainorpath === 'path' ? '路径' : '域名'}</span>
                    </div>
                    <div class="redirect-detail">
                        <span class="detail-label">保持路径:</span>
                        <span class="detail-value">${redirect.holdpath ? '是' : '否'}</span>
                    </div>
                </div>
                <div class="redirect-actions">
                    <button class="btn btn-small btn-toggle" onclick="toggleRedirect(${index})">
                        ${isActive ? '暂停' : '启用'}
                    </button>
                    <button class="btn btn-small btn-edit" onclick="editRedirect(${index})">
                        编辑
                    </button>
                </div>
                <div id="edit-form-${index}" style="display: none;"></div>
            </div>
        `;
    }).join('');
}

// 切换重定向状态
async function toggleRedirect(index) {
    const redirect = currentRedirects[index];
    const siteName = currentSite;
    // 切换状态：当前启用(type=1)则改为暂停，当前暂停(type=0)则改为启用
    const newType = redirect.type === 1 ? 0 : 1;
    const newStatus = newType === 1 ? 0 : 1;  // status和type相反：type=1时status=0，type=0时status=1
    
    try {
        const result = await window.electron.api.modifyRedirect({
            redirectname: redirect.redirectname,
            type: newType,  // 新的type值
            holdpath: redirect.holdpath || 0,
            domainorpath: redirect.domainorpath,
            redirecttype: redirect.redirecttype,
            redirectpath: redirect.redirectpath,
            redirectdomain: '[]',  // 改为字符串形式
            tourl: redirect.tourl,
            sitename: siteName,
            status: newStatus  // status与type相反
        });
        
        if (result.success) {
            // 重新加载列表
            loadRedirects();
        } else {
            alert('操作失败');
        }
    } catch (error) {
        console.error('切换状态失败:', error);
        alert('操作失败');
    }
}

// 编辑重定向
function editRedirect(index) {
    const redirect = currentRedirects[index];
    const formId = `edit-form-${index}`;
    const formContainer = document.getElementById(formId);
    
    if (formContainer.style.display === 'block') {
        formContainer.style.display = 'none';
        return;
    }
    
    formContainer.style.display = 'block';
    formContainer.innerHTML = `
        <div class="redirect-edit-form">
            <div class="form-group">
                <label>重定向路径:</label>
                <input type="text" id="edit-path-${index}" value="${redirect.redirectpath}">
            </div>
            <div class="form-group">
                <label>重定向类型:</label>
                <select id="edit-type-${index}">
                    <option value="301" ${redirect.redirecttype === '301' ? 'selected' : ''}>301 永久重定向</option>
                    <option value="302" ${redirect.redirecttype === '302' ? 'selected' : ''}>302 临时重定向</option>
                </select>
            </div>
            <div class="form-group">
                <label>目标URL:</label>
                <input type="text" id="edit-url-${index}" value="${redirect.tourl}">
            </div>
            <div class="form-group">
                <label>保持路径:</label>
                <select id="edit-holdpath-${index}">
                    <option value="0" ${!redirect.holdpath ? 'selected' : ''}>否</option>
                    <option value="1" ${redirect.holdpath ? 'selected' : ''}>是</option>
                </select>
            </div>
            <div class="form-actions">
                <button class="btn btn-primary btn-small" onclick="saveRedirect(${index})">保存</button>
                <button class="btn btn-secondary btn-small" onclick="cancelEditRedirect(${index})">取消</button>
            </div>
        </div>
    `;
}

// 保存重定向编辑
async function saveRedirect(index) {
    const redirect = currentRedirects[index];
    const siteName = currentSite;
    
    const updatedData = {
        redirectname: redirect.redirectname,
        type: redirect.type || 0,  // 保持原有的type值
        holdpath: parseInt(document.getElementById(`edit-holdpath-${index}`).value),
        domainorpath: redirect.domainorpath,
        redirecttype: document.getElementById(`edit-type-${index}`).value,
        redirectpath: document.getElementById(`edit-path-${index}`).value,
        redirectdomain: '[]',  // 改为字符串形式
        tourl: document.getElementById(`edit-url-${index}`).value,
        sitename: siteName,
        status: redirect.type === 1 ? 0 : 1  // status与type相反：type=1时status=0，type=0时status=1
    };
    
    try {
        const result = await window.electron.api.modifyRedirect(updatedData);
        
        if (result.success) {
            // 重新加载列表
            loadRedirects();
        } else {
            alert('保存失败');
        }
    } catch (error) {
        console.error('保存失败:', error);
        alert('保存失败');
    }
}

// 取消编辑
function cancelEditRedirect(index) {
    const formContainer = document.getElementById(`edit-form-${index}`);
    formContainer.style.display = 'none';
}

// 使函数全局可用
window.toggleRedirect = toggleRedirect;
window.editRedirect = editRedirect;
window.saveRedirect = saveRedirect;
window.cancelEditRedirect = cancelEditRedirect;

// 文件管理相关变量
let currentPath = '/';
let currentSitePath = null;

// 文件管理DOM元素
const fileElements = {
    redirectTab: document.getElementById('redirect-tab'),
    fileTab: document.getElementById('file-tab'),
    redirectContent: document.getElementById('redirect-content'),
    fileContent: document.getElementById('file-content'),
    refreshFiles: document.getElementById('refresh-files'),
    uploadFile: document.getElementById('upload-file'),
    createFile: document.getElementById('create-file'),
    createFolder: document.getElementById('create-folder'),
    currentPath: document.getElementById('current-path'),
    fileList: document.getElementById('file-list'),
    // 文件上传对话框
    fileUploadModal: document.getElementById('file-upload-modal'),
    fileInput: document.getElementById('file-input'),
    uploadArea: document.querySelector('.upload-area'),
    startUpload: document.getElementById('start-upload'),
    cancelUpload: document.getElementById('cancel-upload'),
    uploadProgress: document.getElementById('upload-progress'),
    // 文件编辑对话框
    fileEditModal: document.getElementById('file-edit-modal'),
    editFileName: document.getElementById('edit-file-name'),
    fileContentEditor: document.getElementById('file-content-editor'),
    saveFileContent: document.getElementById('save-file-content'),
    cancelFileEdit: document.getElementById('cancel-file-edit')
};

// 初始化文件管理
function initFileManager() {
    // Tab切换事件
    fileElements.redirectTab.addEventListener('click', () => {
        fileElements.redirectTab.classList.add('active');
        fileElements.fileTab.classList.remove('active');
        fileElements.redirectContent.style.display = 'block';
        fileElements.fileContent.style.display = 'none';
    });
    
    fileElements.fileTab.addEventListener('click', () => {
        fileElements.fileTab.classList.add('active');
        fileElements.redirectTab.classList.remove('active');
        fileElements.fileContent.style.display = 'block';
        fileElements.redirectContent.style.display = 'none';
        
        // 第一次切换到文件管理时，设置站点根目录并加载文件
        if (!currentSitePath && currentSite) {
            loadSiteRootPath();
        }
    });
    
    // 文件管理工具栏事件
    fileElements.refreshFiles.addEventListener('click', () => loadFileList(currentPath));
    fileElements.uploadFile.addEventListener('click', openUploadDialog);
    fileElements.createFile.addEventListener('click', createNewFile);
    fileElements.createFolder.addEventListener('click', createNewFolder);
    
    // 文件上传相关事件
    fileElements.uploadArea.addEventListener('click', () => fileElements.fileInput.click());
    fileElements.fileInput.addEventListener('change', handleFileSelect);
    fileElements.startUpload.addEventListener('click', handleUpload);
    fileElements.cancelUpload.addEventListener('click', closeUploadDialog);
    
    // 拖拽上传
    fileElements.uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileElements.uploadArea.classList.add('dragover');
    });
    
    fileElements.uploadArea.addEventListener('dragleave', () => {
        fileElements.uploadArea.classList.remove('dragover');
    });
    
    fileElements.uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        fileElements.uploadArea.classList.remove('dragover');
        handleFileSelect({ target: { files: e.dataTransfer.files } });
    });
    
    // 文件编辑事件
    fileElements.saveFileContent.addEventListener('click', saveEditedFile);
    fileElements.cancelFileEdit.addEventListener('click', closeEditDialog);
    
    // 关闭对话框事件
    fileElements.fileUploadModal.querySelector('.close').addEventListener('click', closeUploadDialog);
    fileElements.fileEditModal.querySelector('.close').addEventListener('click', closeEditDialog);
}

// 加载站点根目录
async function loadSiteRootPath() {
    if (!currentSite) return;
    
    try {
        // 获取站点列表找到对应站点的路径
        const result = await window.electron.api.getSiteList();
        if (result.success && result.data) {
            const site = result.data.find(s => s.name === currentSite);
            if (site) {
                currentSitePath = site.path;
                currentPath = currentSitePath;
                fileElements.currentPath.textContent = currentPath;
                await loadFileList(currentPath);
            }
        }
    } catch (error) {
        console.error('加载站点路径失败:', error);
    }
}

// 加载文件列表
async function loadFileList(path) {
    fileElements.fileList.innerHTML = '<div class="no-files">加载中...</div>';
    
    try {
        const result = await window.electron.api.getFileList(path);
        if (result.success && result.data) {
            currentPath = path;
            fileElements.currentPath.textContent = currentPath;
            renderFileList(result.data);
        } else {
            fileElements.fileList.innerHTML = '<div class="no-files">加载失败</div>';
        }
    } catch (error) {
        console.error('加载文件列表失败:', error);
        fileElements.fileList.innerHTML = '<div class="no-files">加载失败</div>';
    }
}

// 渲染文件列表
function renderFileList(files) {
    if (!files || files.length === 0) {
        fileElements.fileList.innerHTML = '<div class="no-files">该目录为空</div>';
        return;
    }
    
    // 如果不是根目录，添加返回上级目录
    let html = '';
    if (currentPath !== '/' && currentPath !== currentSitePath) {
        html += `
            <div class="file-item" onclick="navigateToParent()">
                <span class="file-icon">📁</span>
                <span class="file-name">..</span>
                <span class="file-size"></span>
                <div class="file-actions"></div>
            </div>
        `;
    }
    
    // 先显示文件夹，再显示文件
    const folders = files.filter(f => f.type === 'dir');
    const normalFiles = files.filter(f => f.type !== 'dir');
    
    [...folders, ...normalFiles].forEach(file => {
        const icon = file.type === 'dir' ? '📁' : getFileIcon(file.filename);
        const size = file.type === 'dir' ? '' : formatFileSize(file.size);
        
        html += `
            <div class="file-item" data-path="${file.path}" data-type="${file.type}">
                <span class="file-icon">${icon}</span>
                <span class="file-name" onclick="handleFileClick('${file.path}', '${file.type}')">${file.filename}</span>
                <span class="file-size">${size}</span>
                <div class="file-actions">
                    ${file.type !== 'dir' ? `<button class="file-action-btn" onclick="editFile('${file.path}', '${file.filename}')">编辑</button>` : ''}
                    <button class="file-action-btn danger" onclick="deleteFileOrFolder('${file.path}', '${file.filename}')">删除</button>
                </div>
            </div>
        `;
    });
    
    fileElements.fileList.innerHTML = html;
}

// 获取文件图标
function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const iconMap = {
        'js': '📄',
        'json': '📋',
        'html': '🌐',
        'css': '🎨',
        'php': '🐘',
        'py': '🐍',
        'md': '📝',
        'txt': '📄',
        'log': '📜',
        'conf': '⚙️',
        'jpg': '🖼️',
        'jpeg': '🖼️',
        'png': '🖼️',
        'gif': '🖼️',
        'zip': '📦',
        'tar': '📦',
        'gz': '📦'
    };
    return iconMap[ext] || '📄';
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 处理文件点击
function handleFileClick(path, type) {
    if (type === 'dir') {
        loadFileList(path);
    }
}

// 返回上级目录
function navigateToParent() {
    const parentPath = currentPath.substring(0, currentPath.lastIndexOf('/')) || '/';
    loadFileList(parentPath);
}

// 编辑文件
async function editFile(path, filename) {
    fileElements.editFileName.textContent = filename;
    fileElements.fileContentEditor.value = '加载中...';
    fileElements.fileEditModal.style.display = 'block';
    fileElements.fileContentEditor.dataset.path = path;
    
    try {
        const result = await window.electron.api.getFileContent(path);
        if (result.success) {
            fileElements.fileContentEditor.value = result.data || '';
        } else {
            fileElements.fileContentEditor.value = '加载失败';
        }
    } catch (error) {
        console.error('加载文件内容失败:', error);
        fileElements.fileContentEditor.value = '加载失败';
    }
}

// 保存编辑的文件
async function saveEditedFile() {
    const path = fileElements.fileContentEditor.dataset.path;
    const content = fileElements.fileContentEditor.value;
    
    try {
        const result = await window.electron.api.saveFileContent(path, content);
        if (result.success) {
            alert('保存成功');
            closeEditDialog();
        } else {
            alert('保存失败: ' + (result.error || '未知错误'));
        }
    } catch (error) {
        console.error('保存文件失败:', error);
        alert('保存失败');
    }
}

// 关闭编辑对话框
function closeEditDialog() {
    fileElements.fileEditModal.style.display = 'none';
    fileElements.fileContentEditor.value = '';
}

// 删除文件或文件夹
async function deleteFileOrFolder(path, filename) {
    if (!confirm(`确定要删除 ${filename} 吗？`)) {
        return;
    }
    
    try {
        const result = await window.electron.api.deleteFile(path);
        if (result.success) {
            alert('删除成功');
            loadFileList(currentPath);
        } else {
            alert('删除失败: ' + (result.error || '未知错误'));
        }
    } catch (error) {
        console.error('删除失败:', error);
        alert('删除失败');
    }
}

// 创建新文件
async function createNewFile() {
    const filename = prompt('请输入文件名:');
    if (!filename) return;
    
    const filepath = currentPath + '/' + filename;
    
    try {
        const result = await window.electron.api.createFile(filepath);
        if (result.success) {
            alert('创建成功');
            loadFileList(currentPath);
        } else {
            alert('创建失败: ' + (result.error || '未知错误'));
        }
    } catch (error) {
        console.error('创建文件失败:', error);
        alert('创建失败');
    }
}

// 创建新文件夹
async function createNewFolder() {
    const foldername = prompt('请输入文件夹名:');
    if (!foldername) return;
    
    const folderpath = currentPath + '/' + foldername;
    
    try {
        const result = await window.electron.api.createFolder(folderpath);
        if (result.success) {
            alert('创建成功');
            loadFileList(currentPath);
        } else {
            alert('创建失败: ' + (result.error || '未知错误'));
        }
    } catch (error) {
        console.error('创建文件夹失败:', error);
        alert('创建失败');
    }
}

// 打开上传对话框
function openUploadDialog() {
    fileElements.fileUploadModal.style.display = 'block';
    fileElements.uploadProgress.style.display = 'none';
}

// 关闭上传对话框
function closeUploadDialog() {
    fileElements.fileUploadModal.style.display = 'none';
    fileElements.fileInput.value = '';
    fileElements.uploadProgress.style.display = 'none';
}

// 处理文件选择
function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
        fileElements.uploadArea.querySelector('p').textContent = `已选择 ${files.length} 个文件`;
    }
}

// 处理文件上传
async function handleUpload() {
    const files = fileElements.fileInput.files;
    if (files.length === 0) {
        alert('请选择文件');
        return;
    }
    
    fileElements.uploadProgress.style.display = 'block';
    const progressFill = document.querySelector('.progress-fill');
    const uploadStatus = document.querySelector('.upload-status');
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const progress = ((i + 1) / files.length) * 100;
        progressFill.style.width = progress + '%';
        uploadStatus.textContent = `正在上传 ${file.name}...`;
        
        try {
            const fileData = {
                name: file.name,
                type: file.type,
                buffer: await file.arrayBuffer()
            };
            
            const filepath = currentPath + '/' + file.name;
            const result = await window.electron.api.uploadFile(filepath, fileData);
            
            if (!result.success) {
                alert(`上传 ${file.name} 失败: ${result.error}`);
            }
        } catch (error) {
            console.error('上传文件失败:', error);
            alert(`上传 ${file.name} 失败`);
        }
    }
    
    uploadStatus.textContent = '上传完成';
    setTimeout(() => {
        closeUploadDialog();
        loadFileList(currentPath);
    }, 1000);
}

// 使文件管理函数全局可用
window.handleFileClick = handleFileClick;
window.navigateToParent = navigateToParent;
window.editFile = editFile;
window.deleteFileOrFolder = deleteFileOrFolder;

// 初始化文件管理器
initFileManager();

// 防火墙管理相关功能
const firewallElements = {
    modal: document.getElementById('firewall-modal'),
    closeBtn: document.querySelector('#firewall-modal .close'),
    closeModalBtn: document.getElementById('close-firewall-modal'),
    refreshBtn: document.getElementById('refresh-firewall-rules'),
    addBtn: document.getElementById('add-firewall-rule'),
    tbody: document.getElementById('firewall-rules-tbody'),
    ruleCount: document.getElementById('firewall-rule-count'),
    
    // 添加规则对话框
    addRuleModal: document.getElementById('add-rule-modal'),
    addRuleClose: document.querySelector('#add-rule-modal .close'),
    ruleIpInput: document.getElementById('rule-ip'),
    ruleBriefInput: document.getElementById('rule-brief'),
    confirmAddBtn: document.getElementById('confirm-add-rule'),
    cancelAddBtn: document.getElementById('cancel-add-rule')
};

// 初始化防火墙管理
function initFirewallManager() {
    // 事件绑定
    firewallElements.refreshBtn.addEventListener('click', loadFirewallRules);
    firewallElements.addBtn.addEventListener('click', openAddRuleDialog);
    firewallElements.closeBtn.addEventListener('click', closeFirewallModal);
    firewallElements.closeModalBtn.addEventListener('click', closeFirewallModal);
    
    // 添加规则对话框事件
    firewallElements.addRuleClose.addEventListener('click', closeAddRuleDialog);
    firewallElements.cancelAddBtn.addEventListener('click', closeAddRuleDialog);
    firewallElements.confirmAddBtn.addEventListener('click', handleAddRule);
    
    // 点击模态框外部关闭
    window.addEventListener('click', (event) => {
        if (event.target === firewallElements.modal) {
            closeFirewallModal();
        }
        if (event.target === firewallElements.addRuleModal) {
            closeAddRuleDialog();
        }
    });
}

// 打开防火墙管理模态框
function openFirewallModal() {
    firewallElements.modal.style.display = 'block';
    loadFirewallRules();
}

// 关闭防火墙管理模态框
function closeFirewallModal() {
    firewallElements.modal.style.display = 'none';
}

// 加载防火墙规则
async function loadFirewallRules() {
    firewallElements.tbody.innerHTML = '<tr><td colspan="7" class="no-data">正在加载...</td></tr>';
    
    try {
        const result = await window.electron.api.request({
            endpoint: 'getFirewallRules',
            data: {
                page: 1,
                pageSize: 100
            }
        });
        
        if (result.success && result.data.success) {
            const rules = result.data.data || [];
            displayFirewallRules(rules);
            firewallElements.ruleCount.textContent = rules.length;
        } else {
            firewallElements.tbody.innerHTML = '<tr><td colspan="7" class="no-data">加载失败，请重试</td></tr>';
        }
    } catch (error) {
        console.error('加载防火墙规则失败:', error);
        firewallElements.tbody.innerHTML = '<tr><td colspan="7" class="no-data">加载失败：' + error.message + '</td></tr>';
    }
}

// 显示防火墙规则
function displayFirewallRules(rules) {
    if (rules.length === 0) {
        firewallElements.tbody.innerHTML = '<tr><td colspan="7" class="no-data">暂无防火墙规则</td></tr>';
        return;
    }
    
    firewallElements.tbody.innerHTML = rules.map(rule => {
        const area = rule.area?.info || '未知';
        // Convert UTC time to local time by adding 8 hours
        const utcDate = new Date(rule.addtime);
        const localDate = new Date(utcDate.getTime() + 8 * 60 * 60 * 1000);
        const addTime = localDate.toLocaleString();
        
        return `
            <tr>
                <td>${rule.Address}</td>
                <td>${rule.Strategy}</td>
                <td>${rule.Chain}</td>
                <td>${rule.brief || '-'}</td>
                <td>${addTime}</td>
                <td>${area}</td>
                <td>
                    <button class="delete-rule-btn" onclick="deleteFirewallRule('${rule.Address}')">删除</button>
                </td>
            </tr>
        `;
    }).join('');
}

// 打开添加规则对话框
function openAddRuleDialog() {
    firewallElements.addRuleModal.style.display = 'block';
    firewallElements.ruleIpInput.value = '';
    firewallElements.ruleBriefInput.value = '';
    firewallElements.ruleIpInput.focus();
}

// 关闭添加规则对话框
function closeAddRuleDialog() {
    firewallElements.addRuleModal.style.display = 'none';
}

// 处理添加规则
async function handleAddRule() {
    const ip = firewallElements.ruleIpInput.value.trim();
    const brief = firewallElements.ruleBriefInput.value.trim();
    
    if (!ip) {
        alert('请输入IP地址');
        return;
    }
    
    // 验证IP格式
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ip)) {
        alert('请输入有效的IP地址');
        return;
    }
    
    try {
        const result = await window.electron.api.request({
            endpoint: 'addFirewallRule',
            data: {
                ip: ip,
                brief: brief || `手动添加 - ${new Date().toLocaleString()}`
            }
        });
        
        if (result.success) {
            showToast(`已成功添加防火墙规则: ${ip}`);
            closeAddRuleDialog();
            loadFirewallRules();
        } else {
            alert(`添加规则失败: ${result.error?.message || '未知错误'}`);
        }
    } catch (error) {
        console.error('添加防火墙规则失败:', error);
        alert(`添加规则失败: ${error.message}`);
    }
}

// 删除防火墙规则
async function deleteFirewallRule(ip) {
    if (!confirm(`确定要删除IP ${ip} 的防火墙规则吗？`)) {
        return;
    }
    
    try {
        const result = await window.electron.api.request({
            endpoint: 'removeFirewallRule',
            data: {
                ip: ip
            }
        });
        
        if (result.success) {
            showToast(`已成功删除防火墙规则: ${ip}`);
            loadFirewallRules();
        } else {
            alert(`删除规则失败: ${result.error?.message || '未知错误'}`);
        }
    } catch (error) {
        console.error('删除防火墙规则失败:', error);
        alert(`删除规则失败: ${error.message}`);
    }
}

// 使防火墙函数全局可用
window.deleteFirewallRule = deleteFirewallRule;
window.openFirewallModal = openFirewallModal;

// 初始化防火墙管理器
initFirewallManager();