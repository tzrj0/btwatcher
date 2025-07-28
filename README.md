# BT Watcher - 宝塔面板日志监控系统

一个基于 Electron 的宝塔面板实时日志监控应用，提供网站访问日志的实时监控、分析和管理功能。

## 功能特性

### 核心功能
- **实时日志监控** - 实时获取并显示网站访问日志
- **智能过滤** - 支持按IP、路径、状态码等多维度过滤
- **黑名单管理** - UA黑名单和IP黑名单自动过滤
- **防火墙集成** - 一键添加恶意IP到防火墙规则
- **站点管理** - 多站点切换，301重定向管理
- **文件管理** - 网站文件在线查看和编辑

### 亮点特性
- 🚀 实时监控，自动刷新
- 🔍 强大的搜索和过滤功能
- 🛡️ 集成防火墙管理
- 📊 访问统计分析
- 🎨 现代化UI界面
- 🔐 API密钥加密存储

## 快速开始

### 1. 下载安装

访问 [Releases](https://github.com/tzrj0/btwatcher/releases) 页面下载适合您系统的版本：

- Windows: `BT-Watcher-Setup-*.exe`
- macOS: `BT-Watcher-*.dmg`
- Linux: `BT-Watcher-*.AppImage`

### 2. 配置宝塔面板

1. 登录宝塔面板
2. 进入「面板设置」→「API接口」
3. 开启 API 接口
4. 点击「创建接口密钥」
5. **重要**：将 IP 白名单设置为 `0.0.0.0/0`（允许所有 IP 访问）

### 3. 初始化 BT Watcher

1. 启动 BT Watcher
2. 输入您的宝塔面板信息：
   - **API 地址**：如 `http://192.168.1.100:8888`
   - **API 密钥**：在宝塔面板获取的密钥
3. 点击「保存并连接」

## 使用文档

- [快速开始指南](https://github.com/tzrj0/btwatcher/wiki/Quick-Start) - 详细的安装和配置步骤
- [使用教程](https://github.com/tzrj0/btwatcher/wiki/User-Guide) - 完整的功能使用说明
- [常见问题](https://github.com/tzrj0/btwatcher/wiki/FAQ) - 常见问题解答
- [功能说明](https://github.com/tzrj0/btwatcher/wiki/Features) - 所有功能的详细介绍
- [故障排查](https://github.com/tzrj0/btwatcher/wiki/Troubleshooting) - 问题诊断和解决方案

## 开发指南

### 环境要求
- Node.js 18.0 或更高版本
- npm 或 yarn
- macOS / Windows / Linux

### 本地开发

```bash
# 克隆项目
git clone https://github.com/tzrj0/btwatcher.git
cd btwatcher

# 安装依赖
npm install

# 启动开发模式
npm start
```

### 构建应用

```bash
# 构建所有平台
npm run build

# 构建特定平台
npm run build -- --mac
npm run build -- --win
npm run build -- --linux
```

## 自动构建

本项目已配置 GitHub Actions 自动构建：

- **每次推送到 main 分支**：自动创建预发布版本
- **创建版本标签**：自动构建正式发布版本

构建状态：[![Build Status](https://github.com/tzrj0/btwatcher/actions/workflows/auto-release.yml/badge.svg)](https://github.com/tzrj0/btwatcher/actions)

## 项目结构

```
btwatcher/
├── main.js           # Electron主进程
├── renderer.js       # 渲染进程主逻辑
├── preload.js        # 预加载脚本
├── index.html        # 主界面
├── init.html         # 初始化界面
├── style.css         # 样式文件
├── lib/
│   └── bt-api.js     # 宝塔API封装
├── .github/
│   └── workflows/    # GitHub Actions配置
├── build/            # 构建配置
└── package.json      # 项目配置
```

## 安全说明

- API密钥使用 AES-256-CBC 加密存储
- 建议定期更换 API 密钥
- 不要分享您的 API 密钥给他人
- 所有 API 请求使用签名验证

## 贡献指南

欢迎贡献代码和反馈问题！

1. Fork 本仓库
2. 创建您的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 问题反馈

如果您在使用过程中遇到问题：

1. 查看 [常见问题](https://github.com/tzrj0/btwatcher/wiki/FAQ)
2. 查看 [故障排查指南](https://github.com/tzrj0/btwatcher/wiki/Troubleshooting)
3. 在 [Issues](https://github.com/tzrj0/btwatcher/issues) 提交问题

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 致谢

- [宝塔面板](https://www.bt.cn/) - 提供强大的服务器管理功能
- [Electron](https://www.electronjs.org/) - 跨平台桌面应用框架
- 所有贡献者和用户的支持

---

Made with ❤️ by [tzrj0](https://github.com/tzrj0)