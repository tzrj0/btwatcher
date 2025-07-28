const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const https = require('https');

// API 配置将从环境变量动态读取

// 获取API配置
function getApiConfig() {
  let url = process.env.BT_URL;
  const key = process.env.BT_KEY;
  
  if (!url || !key) {
    throw new Error('API配置未设置');
  }
  
  // 确保 URL 以斜杠结尾
  if (!url.endsWith('/')) {
    url += '/';
  }
  
  return { url, key };
}

// 创建忽略SSL证书验证的axios实例
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

const axiosInstance = axios.create({
  httpsAgent,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  }
});

// MD5加密函数
function md5(str) {
  return crypto.createHash('md5').update(str).digest('hex');
}

// 生成签名
function generateSignature() {
  const { key } = getApiConfig();
  const requestTime = Math.floor(Date.now() / 1000);
  const requestToken = md5(requestTime.toString() + md5(key));
  
  return {
    request_time: requestTime,
    request_token: requestToken
  };
}

// 将对象转换为URL编码的字符串
function toUrlEncoded(obj) {
  return Object.keys(obj)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
    .join('&');
}

// 获取站点列表
async function getSiteList() {
  try {
    const signature = generateSignature();
    const params = {
      ...signature,
      action: 'getData',
      table: 'sites',
      limit: 50,
      p: 1
    };

    const { url } = getApiConfig();
    const response = await axiosInstance.post(
      `${url}data`,
      toUrlEncoded(params)
    );

    if (response.data && response.data.data) {
      return response.data.data.map(site => ({
        id: site.id,
        name: site.name,
        path: site.path,
        status: site.status,
        ps: site.ps || site.name
      }));
    } else {
      throw new Error('获取站点列表失败');
    }
  } catch (error) {
    console.error('API调用失败:', error.message);
    throw error;
  }
}

// 获取站点日志
async function getSiteLogs(siteName) {
  try {
    const { url } = getApiConfig();
    const signature = generateSignature();
    const params = {
      ...signature,
      action: 'GetSiteLogs',
      siteName: siteName
    };

    const response = await axiosInstance.post(
      `${url}site`,
      toUrlEncoded(params)
    );

    console.log('API响应状态:', response.status);
    console.log('API响应类型:', typeof response.data);
    
    // 宝塔API可能以不同格式返回日志
    if (response.status === 200 && response.data) {
      // 检查是否有msg字段包含日志内容（宝塔特殊情况）
      if (response.data.msg && response.data.msg.includes(' - - [')) {
        console.log('从msg字段提取日志');
        const logs = parseLogData(response.data.msg);
        return logs;
      }
      
      if (typeof response.data === 'string') {
        // 检查是否是错误消息（通常包含HTML或JSON格式）
        if (response.data.includes('<') || response.data.startsWith('{')) {
          console.error('API返回错误:', response.data);
          return [];
        }
        
        // 如果是纯文本日志，进行解析
        const logs = parseLogData(response.data);
        console.log('解析后的日志数:', logs.length);
        return logs;
      } else if (response.data && typeof response.data === 'object') {
        if (response.data.status === false && response.data.msg) {
          // 检查错误消息是否包含日志
          if (response.data.msg.includes(' - - [')) {
            console.log('从错误消息提取日志');
            const logs = parseLogData(response.data.msg);
            return logs;
          }
          throw new Error(response.data.msg || '获取日志失败');
        }
        
        if (response.data.data) {
          const logs = parseLogData(response.data.data);
          console.log('从data字段解析的日志数:', logs.length);
          return logs;
        }
        
        if (Array.isArray(response.data)) {
          console.log('直接返回数组，长度:', response.data.length);
          return response.data;
        }
      }
    }
    
    return [];
  } catch (error) {
    console.error('获取日志失败:', error.message);
    // 如果错误消息看起来像日志内容，尝试解析它
    if (error.message && error.message.includes(' - - [')) {
      console.log('从错误消息中提取日志');
      const logs = parseLogData(error.message);
      return logs;
    }
    throw error;
  }
}

// 解析日志数据
function parseLogData(logString) {
  if (!logString || typeof logString !== 'string') {
    return [];
  }

  const lines = logString.split('\n').filter(line => line.trim());
  const logs = [];

  lines.forEach(line => {
    // 替换全角引号为半角引号
    const normalizedLine = line.replace(/＂/g, '"').replace(/"/g, '"').replace(/"/g, '"');
    
    // 尝试解析标准的访问日志格式
    // 示例: 192.168.1.1 - - [01/Jan/2024:10:30:45 +0800] "GET /index.html HTTP/1.1" 200 1234 "-" "Mozilla/5.0..."
    const logPattern = /^(\S+) \S+ \S+ \[([\w:/]+\s[+\-]\d{4})\] "(\S+)\s?(\S+)?\s?(\S+)?" (\d{3}|-) (\d+|-)\s?"?([^"]*)"?\s?"?([^"]*)"?/;
    const match = normalizedLine.match(logPattern);

    if (match) {
      logs.push({
        ip: match[1],
        time: match[2],
        method: match[3],
        url: match[4] || '-',
        protocol: match[5] || '-',
        status: match[6],
        size: match[7],
        referer: match[8] || '-',
        userAgent: match[9] || '-',
        raw: line
      });
    } else {
      // 如果标准格式不匹配，尝试更灵活的解析
      const flexiblePattern = /^(\S+).*?\[(.*?)\].*?"(\w+)\s+(\S+).*?".*?(\d{3})\s+(\d+).*?"([^"]*)".*?"([^"]*)"/;
      const flexMatch = normalizedLine.match(flexiblePattern);
      
      if (flexMatch) {
        logs.push({
          ip: flexMatch[1],
          time: flexMatch[2],
          method: flexMatch[3],
          url: flexMatch[4],
          protocol: '-',
          status: flexMatch[5],
          size: flexMatch[6],
          referer: flexMatch[7] || '-',
          userAgent: flexMatch[8] || '-',
          raw: line
        });
      } else {
        // 最后尝试提取基本信息
        const ipMatch = line.match(/^(\d+\.\d+\.\d+\.\d+)/);
        const timeMatch = line.match(/\[(.*?)\]/);
        const methodMatch = line.match(/"(\w+)\s+(\S+)/);
        const statusMatch = line.match(/"\s+(\d{3})/);
        
        logs.push({
          raw: line,
          time: timeMatch ? timeMatch[1] : new Date().toISOString(),
          ip: ipMatch ? ipMatch[1] : '-',
          method: methodMatch ? methodMatch[1] : '-',
          url: methodMatch ? methodMatch[2] : '-',
          status: statusMatch ? statusMatch[1] : '-',
          size: '-',
          referer: '-',
          userAgent: '-'
        });
      }
    }
  });

  return logs;
}

// 获取站点重定向列表
async function getRedirectList(siteName) {
  const { url } = getApiConfig();
  try {
    const signature = generateSignature();
    const params = {
      ...signature,
      sitename: siteName  // 改为小写
    };

    console.log('请求重定向列表，参数:', params);

    const response = await axiosInstance.post(
      `${url}site?action=GetRedirectList`,
      toUrlEncoded(params)
    );

    console.log('重定向列表响应:', response.data);

    // 如果返回的直接是数组，说明获取成功
    if (Array.isArray(response.data)) {
      return response.data;
    } 
    // 如果返回的是对象格式
    else if (response.data && response.data.status === 0) {
      return response.data.message || [];
    } 
    // 其他情况视为错误
    else {
      console.error('获取重定向列表失败:', response.data);
      return [];
    }
  } catch (error) {
    console.error('API调用失败:', error.message);
    throw error;
  }
}

// 修改重定向设置
async function modifyRedirect(redirectData) {
  try {
    const { url } = getApiConfig();
    const signature = generateSignature();
    const params = {
      ...signature,
      ...redirectData
    };

    console.log('修改重定向请求参数:', params);

    const response = await axiosInstance.post(
      `${url}site?action=ModifyRedirect`,
      toUrlEncoded(params)
    );

    console.log('修改重定向响应:', response.data);

    // 检查响应状态
    if (response.data && (response.data.status === true || response.data.status === 0 || response.data.msg === '成功')) {
      return { success: true, data: response.data };
    } else {
      return { success: false, error: response.data };
    }
  } catch (error) {
    console.error('修改重定向失败:', error.message);
    throw error;
  }
}

// 获取文件列表
async function getFileList(path) {
  try {
    const { url } = getApiConfig();
    const signature = generateSignature();
    const params = {
      ...signature,
      path: path,
      p: 1,
      showRow: 100,
      is_operating: true
    };

    const response = await axiosInstance.post(
      `${url}files?action=GetDir`,
      toUrlEncoded(params)
    );

    if (response.data) {
      // 解析返回的数据
      const dirs = (response.data.DIR || []).map(dirStr => {
        const parts = dirStr.split(';');
        return {
          filename: parts[0],
          size: parseInt(parts[1]),
          mtime: parseInt(parts[2]),
          permissions: parts[3],
          owner: parts[4],
          type: 'dir',
          path: path + '/' + parts[0]
        };
      });

      const files = (response.data.FILES || []).map(fileStr => {
        const parts = fileStr.split(';');
        return {
          filename: parts[0],
          size: parseInt(parts[1]),
          mtime: parseInt(parts[2]),
          permissions: parts[3],
          owner: parts[4],
          type: 'file',
          path: path + '/' + parts[0]
        };
      });

      return [...dirs, ...files];
    } else {
      throw new Error('获取文件列表失败');
    }
  } catch (error) {
    console.error('获取文件列表失败:', error.message);
    throw error;
  }
}

// 读取文件内容
async function getFileContent(path) {
  try {
    const { url } = getApiConfig();
    const signature = generateSignature();
    const params = {
      ...signature,
      path: path
    };

    const response = await axiosInstance.post(
      `${url}files?action=GetFileBody`,
      toUrlEncoded(params)
    );

    if (response.data && response.data.data !== undefined) {
      return response.data.data;
    } else {
      throw new Error('读取文件内容失败');
    }
  } catch (error) {
    console.error('读取文件内容失败:', error.message);
    throw error;
  }
}

// 保存文件内容
async function saveFileContent(path, content, encoding = 'utf-8') {
  try {
    const { url } = getApiConfig();
    const signature = generateSignature();
    const params = {
      ...signature,
      path: path,
      data: content,
      encoding: encoding
    };

    const response = await axiosInstance.post(
      `${url}files?action=SaveFileBody`,
      toUrlEncoded(params)
    );

    if (response.data && response.data.status === true) {
      return { success: true, msg: response.data.msg || '保存成功' };
    } else {
      return { success: false, error: response.data.msg || '保存失败' };
    }
  } catch (error) {
    console.error('保存文件内容失败:', error.message);
    throw error;
  }
}

// 创建文件
async function createFile(path) {
  try {
    const { url } = getApiConfig();
    const signature = generateSignature();
    const params = {
      ...signature,
      path: path
    };

    const response = await axiosInstance.post(
      `${url}files?action=CreateFile`,
      toUrlEncoded(params)
    );

    if (response.data && response.data.status === true) {
      return { success: true, msg: response.data.msg || '创建成功' };
    } else {
      return { success: false, error: response.data.msg || '创建失败' };
    }
  } catch (error) {
    console.error('创建文件失败:', error.message);
    throw error;
  }
}

// 创建文件夹
async function createFolder(path) {
  try {
    const { url } = getApiConfig();
    const signature = generateSignature();
    const params = {
      ...signature,
      path: path
    };

    const response = await axiosInstance.post(
      `${url}files?action=CreateDir`,
      toUrlEncoded(params)
    );

    if (response.data && response.data.status === true) {
      return { success: true, msg: response.data.msg || '创建成功' };
    } else {
      return { success: false, error: response.data.msg || '创建失败' };
    }
  } catch (error) {
    console.error('创建文件夹失败:', error.message);
    throw error;
  }
}

// 删除文件或文件夹
async function deleteFile(path) {
  try {
    const { url } = getApiConfig();
    const signature = generateSignature();
    const params = {
      ...signature,
      path: path
    };

    const response = await axiosInstance.post(
      `${url}files?action=DeleteFile`,
      toUrlEncoded(params)
    );

    if (response.data && response.data.status === true) {
      return { success: true, msg: response.data.msg || '删除成功' };
    } else {
      return { success: false, error: response.data.msg || '删除失败' };
    }
  } catch (error) {
    console.error('删除文件失败:', error.message);
    throw error;
  }
}

// 上传文件
async function uploadFile(path, fileData) {
  try {
    const { url } = getApiConfig();
    const signature = generateSignature();
    const FormData = require('form-data');
    const form = new FormData();
    
    // 添加签名参数
    form.append('request_time', signature.request_time);
    form.append('request_token', signature.request_token);
    form.append('f_path', path);
    form.append('file', fileData.buffer, {
      filename: fileData.name,
      contentType: fileData.type
    });

    const response = await axiosInstance.post(
      `${url}files?action=UploadFile`,
      form,
      {
        headers: {
          ...form.getHeaders()
        }
      }
    );

    if (response.data && response.data.status === true) {
      return { success: true, msg: response.data.msg || '上传成功' };
    } else {
      return { success: false, error: response.data.msg || '上传失败' };
    }
  } catch (error) {
    console.error('上传文件失败:', error.message);
    throw error;
  }
}

// 添加防火墙规则（禁止IP）
async function addFirewallRule(ip, brief = '') {
  try {
    const { url } = getApiConfig();
    const signature = generateSignature();
    const params = {
      ...signature,
      address: ip,
      types: 'drop',
      strategy: 'drop',
      chain: 'INPUT',
      brief: brief,
      family: 'ipv4',
      operation: 'add'
    };

    const response = await axiosInstance.post(
      `${url}v2/firewall/com/set_ip_rule`,
      toUrlEncoded(params)
    );

    if (response.data && response.data.status === 0) {
      return { success: true, data: response.data };
    } else {
      return { success: false, error: response.data };
    }
  } catch (error) {
    console.error('添加防火墙规则失败:', error.message);
    throw error;
  }
}

// 获取防火墙规则列表
async function getFirewallRules(page = 1, pageSize = 100) {
  try {
    const { url } = getApiConfig();
    const signature = generateSignature();
    const params = {
      ...signature,
      chain: 'ALL',
      query: '',
      p: page,
      row: pageSize
    };

    const response = await axiosInstance.post(
      `${url}v2/firewall/com/ip_rules_list`,
      toUrlEncoded(params)
    );

    if (response.data && response.data.status === 0 && response.data.message) {
      return {
        success: true,
        data: response.data.message.data || [],
        page: response.data.message.page || ''
      };
    } else {
      return { success: false, error: response.data };
    }
  } catch (error) {
    console.error('获取防火墙规则列表失败:', error.message);
    throw error;
  }
}

// 删除防火墙规则
async function removeFirewallRule(ip) {
  try {
    const { url } = getApiConfig();
    const signature = generateSignature();
    const params = {
      ...signature,
      operation: 'remove',
      address: ip,
      strategy: 'drop',
      chain: 'INPUT',
      brief: '',
      family: 'ipv4'
    };

    const response = await axiosInstance.post(
      `${url}v2/firewall/com/set_ip_rule`,
      toUrlEncoded(params)
    );

    if (response.data && response.data.status === 0) {
      return { success: true, data: response.data };
    } else {
      return { success: false, error: response.data };
    }
  } catch (error) {
    console.error('删除防火墙规则失败:', error.message);
    throw error;
  }
}

module.exports = {
  getSiteList,
  getSiteLogs,
  getRedirectList,
  modifyRedirect,
  getFileList,
  getFileContent,
  saveFileContent,
  createFile,
  createFolder,
  deleteFile,
  uploadFile,
  addFirewallRule,
  getFirewallRules,
  removeFirewallRule
};