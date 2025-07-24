const { contextBridge, ipcRenderer } = require('electron');

// 暴露API给渲染进程
contextBridge.exposeInMainWorld('electron', {
    loadConfig: () => ipcRenderer.invoke('load-config'),
    saveConfig: (config) => ipcRenderer.invoke('save-config', config),
    clearApiConfig: () => ipcRenderer.invoke('clear-api-config'),
    api: {
        getSiteList: () => ipcRenderer.invoke('api-request', { endpoint: 'getSiteList' }),
        getSiteLogs: (siteName) => ipcRenderer.invoke('api-request', { 
            endpoint: 'getSiteLogs', 
            data: { siteName } 
        }),
        getRedirectList: (siteName) => ipcRenderer.invoke('api-request', {
            endpoint: 'getRedirectList',
            data: { siteName }
        }),
        modifyRedirect: (redirectData) => ipcRenderer.invoke('api-request', {
            endpoint: 'modifyRedirect',
            data: redirectData
        }),
        getFileList: (path) => ipcRenderer.invoke('api-request', {
            endpoint: 'getFileList',
            data: { path }
        }),
        getFileContent: (path) => ipcRenderer.invoke('api-request', {
            endpoint: 'getFileContent',
            data: { path }
        }),
        saveFileContent: (path, content, encoding) => ipcRenderer.invoke('api-request', {
            endpoint: 'saveFileContent',
            data: { path, content, encoding }
        }),
        createFile: (path) => ipcRenderer.invoke('api-request', {
            endpoint: 'createFile',
            data: { path }
        }),
        createFolder: (path) => ipcRenderer.invoke('api-request', {
            endpoint: 'createFolder',
            data: { path }
        }),
        deleteFile: (path) => ipcRenderer.invoke('api-request', {
            endpoint: 'deleteFile',
            data: { path }
        }),
        uploadFile: (path, fileData) => ipcRenderer.invoke('api-request', {
            endpoint: 'uploadFile',
            data: { path, fileData }
        }),
        request: (params) => ipcRenderer.invoke('api-request', params)
    }
});