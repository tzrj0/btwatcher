const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// 配置文件路径
const configPath = path.join(app.getPath('userData'), 'config.json');

// 加密配置
const ENCRYPTION_KEY = crypto.scryptSync('bt-watcher-secret-2024', 'salt', 32);
const IV_LENGTH = 16;

// 加密函数
function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

// 解密函数
function decrypt(text) {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

// 默认配置
const defaultConfig = {
  refreshInterval: 5,
  uaFilter: '',
  uaBlacklist: '',
  ipBlacklist: '',
  maxDisplayRows: 1000,
  windowBounds: {
    width: 1400,
    height: 900
  },
  // API配置（加密存储）
  apiUrl: null,
  apiKey: null,
  apiEncrypted: false
};

// 检查是否需要初始化
function needsInitialization() {
  try {
    const config = loadConfig();
    
    if (!config.apiUrl || !config.apiKey) {
      return true;
    }
    
    // 如果是加密配置，尝试解密来验证
    if (config.apiEncrypted) {
      try {
        const apiUrl = decrypt(config.apiUrl);
        const apiKey = decrypt(config.apiKey);
        return !apiUrl || !apiKey;
      } catch {
        return true;
      }
    }
    
    return false;
  } catch {
    return true;
  }
}

// 保存API配置到主配置文件
function saveApiConfig(apiUrl, apiKey) {
  try {
    config.apiUrl = encrypt(apiUrl);
    config.apiKey = encrypt(apiKey);
    config.apiEncrypted = true;
    saveConfig(config);
    
    // 同时更新环境变量
    process.env.BT_URL = apiUrl;
    process.env.BT_KEY = apiKey;
    return true;
  } catch (error) {
    console.error('保存API配置失败:', error);
    return false;
  }
}

// 加载API配置
function loadApiConfig() {
  try {
    const config = loadConfig();
    
    if (config.apiUrl && config.apiKey) {
      if (config.apiEncrypted) {
        // 解密配置
        const apiUrl = decrypt(config.apiUrl);
        const apiKey = decrypt(config.apiKey);
        process.env.BT_URL = apiUrl;
        process.env.BT_KEY = apiKey;
        return { apiUrl, apiKey };
      } else {
        // 兼容旧版本未加密的配置，转换为加密格式
        process.env.BT_URL = config.apiUrl;
        process.env.BT_KEY = config.apiKey;
        saveApiConfig(config.apiUrl, config.apiKey);
        return { apiUrl: config.apiUrl, apiKey: config.apiKey };
      }
    }
  } catch (error) {
    console.error('加载API配置失败:', error);
  }
  return null;
}

// 读取配置
function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf8');
      return { ...defaultConfig, ...JSON.parse(data) };
    }
  } catch (error) {
    console.error('加载配置失败:', error);
  }
  return defaultConfig;
}

// 保存配置
function saveConfig(config) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error('保存配置失败:', error);
  }
}

let mainWindow;

// 迁移旧版本API配置文件
function migrateOldApiConfig() {
  const oldApiConfigPath = path.join(app.getPath('userData'), 'api-config.json');
  try {
    if (fs.existsSync(oldApiConfigPath)) {
      const oldConfig = JSON.parse(fs.readFileSync(oldApiConfigPath, 'utf8'));
      
      // 加载当前配置
      const currentConfig = loadConfig();
      
      // 迁移API配置
      if (oldConfig.encrypted || oldConfig.apiEncrypted) {
        currentConfig.apiUrl = oldConfig.apiUrl;
        currentConfig.apiKey = oldConfig.apiKey;
        currentConfig.apiEncrypted = true;
      } else if (oldConfig.apiUrl && oldConfig.apiKey) {
        // 旧版本未加密的配置，重新加密保存
        currentConfig.apiUrl = encrypt(oldConfig.apiUrl);
        currentConfig.apiKey = encrypt(oldConfig.apiKey);
        currentConfig.apiEncrypted = true;
      }
      
      // 保存合并后的配置
      saveConfig(currentConfig);
      
      // 删除旧配置文件
      fs.unlinkSync(oldApiConfigPath);
      console.log('已成功迁移旧版本API配置');
    }
  } catch (error) {
    console.error('迁移旧版本API配置失败:', error);
  }
}

// 启动时先进行迁移
migrateOldApiConfig();
let config = loadConfig();

function createWindow() {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: config.windowBounds.width || 1400,
    height: config.windowBounds.height || 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    icon: path.join(__dirname, 'icon.png'),
    title: 'BT Watcher'
  });

  // 检查是否需要初始化
  if (needsInitialization()) {
    mainWindow.loadFile('init.html');
  } else {
    // 加载API配置
    loadApiConfig();
    mainWindow.loadFile('index.html');
  }

  // 保存窗口大小
  mainWindow.on('resize', () => {
    const bounds = mainWindow.getBounds();
    config.windowBounds = bounds;
    saveConfig(config);
  });

  // 窗口关闭时的处理
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 开发者工具
  // 需要调试时可以取消注释下面这行
  // mainWindow.webContents.openDevTools();
}

// IPC通信处理
ipcMain.handle('load-config', () => {
  return config;
});

ipcMain.handle('save-config', async (event, newConfig) => {
  // 如果是API配置
  if (newConfig.apiUrl !== undefined && newConfig.apiKey !== undefined) {
    // 先验证连接
    const btApi = require('./lib/bt-api');
    process.env.BT_URL = newConfig.apiUrl;
    process.env.BT_KEY = newConfig.apiKey;
    
    try {
      // 尝试获取站点列表来验证连接
      await btApi.getSiteList();
      // 保存配置
      if (saveApiConfig(newConfig.apiUrl, newConfig.apiKey)) {
        return { success: true };
      } else {
        return { success: false, error: '保存配置失败' };
      }
    } catch (error) {
      return { success: false, error: '连接失败: ' + error.message };
    }
  } else {
    // 普通配置
    config = { ...config, ...newConfig };
    saveConfig(config);
    return { success: true };
  }
});

// 清空API配置
ipcMain.handle('clear-api-config', async () => {
  try {
    // 只清空API相关字段，保留其他配置
    config.apiUrl = null;
    config.apiKey = null;
    config.apiEncrypted = false;
    saveConfig(config);
    
    // 清除环境变量
    delete process.env.BT_URL;
    delete process.env.BT_KEY;
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 打开外部链接
ipcMain.handle('open-external', async (event, url) => {
  try {
    await shell.openExternal(url);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// API调用转发
ipcMain.handle('api-request', async (event, { endpoint, method, data }) => {
  const btApi = require('./lib/bt-api');
  
  try {
    switch (endpoint) {
      case 'getSiteList':
        return { success: true, data: await btApi.getSiteList() };
      case 'getSiteLogs':
        return { success: true, data: await btApi.getSiteLogs(data.siteName) };
      case 'getRedirectList':
        return { success: true, data: await btApi.getRedirectList(data.siteName) };
      case 'modifyRedirect':
        return { success: true, data: await btApi.modifyRedirect(data) };
      case 'getFileList':
        return { success: true, data: await btApi.getFileList(data.path) };
      case 'getFileContent':
        return { success: true, data: await btApi.getFileContent(data.path) };
      case 'saveFileContent':
        return { success: true, data: await btApi.saveFileContent(data.path, data.content, data.encoding) };
      case 'createFile':
        return { success: true, data: await btApi.createFile(data.path) };
      case 'createFolder':
        return { success: true, data: await btApi.createFolder(data.path) };
      case 'deleteFile':
        return { success: true, data: await btApi.deleteFile(data.path) };
      case 'uploadFile':
        return { success: true, data: await btApi.uploadFile(data.path, data.fileData) };
      case 'addFirewallRule':
        return { success: true, data: await btApi.addFirewallRule(data.ip, data.brief) };
      case 'getFirewallRules':
        return { success: true, data: await btApi.getFirewallRules(data.page, data.pageSize) };
      case 'removeFirewallRule':
        return { success: true, data: await btApi.removeFirewallRule(data.ip) };
      default:
        throw new Error('未知的API端点');
    }
  } catch (error) {
    console.error('API调用失败:', error);
    return { success: false, error: error.message };
  }
});

// 应用就绪
app.whenReady().then(createWindow);

// 所有窗口关闭时退出
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 在macOS上重新创建窗口
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});