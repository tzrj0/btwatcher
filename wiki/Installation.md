# 安装指南

## 系统要求

### 宝塔面板
- 版本：7.0 或更高
- 已开启 API 接口
- 已创建 API 密钥

### 操作系统
- **Windows**: Windows 10/11 (64位)
- **macOS**: macOS 10.15 (Catalina) 或更高
- **Linux**: Ubuntu 18.04+, Debian 10+, CentOS 7+

### 硬件要求
- 内存：最低 2GB RAM
- 存储：100MB 可用空间
- 网络：能访问宝塔面板

## 下载安装包

访问 [GitHub Releases](https://github.com/tzrj0/btwatcher/releases) 下载最新版本：

- **Windows**: `BT-Watcher-Setup-{version}.exe`
- **macOS**: `BT-Watcher-{version}.dmg`
- **Linux**: `BT-Watcher-{version}.AppImage`

## 安装步骤

### Windows

1. 双击下载的 `.exe` 文件
2. 如果出现 Windows SmartScreen 警告，点击"更多信息"→"仍要运行"
3. 按照安装向导完成安装
4. 安装完成后，桌面会创建快捷方式

### macOS

1. 双击下载的 `.dmg` 文件
2. 将 BT Watcher 拖动到 Applications 文件夹
3. 首次运行时，可能需要在"系统偏好设置"→"安全性与隐私"中允许运行
4. 或右键点击应用，选择"打开"

### Linux

#### AppImage (推荐)
```bash
# 添加执行权限
chmod +x BT-Watcher-*.AppImage

# 运行
./BT-Watcher-*.AppImage
```

#### 从源码构建
```bash
# 克隆仓库
git clone https://github.com/tzrj0/btwatcher.git
cd btwatcher

# 安装依赖
npm install

# 运行
npm start

# 构建
npm run build
```

## 首次运行配置

1. 启动 BT Watcher
2. 在初始化页面输入：
   - **API 地址**: 宝塔面板地址（如 `http://192.168.1.100:8888`）
   - **API 密钥**: 在宝塔面板获取的密钥

3. 点击"保存并连接"

## 更新

### 自动更新
应用会自动检查更新（即将推出）

### 手动更新
1. 下载新版本
2. 覆盖安装（配置会保留）

## 卸载

### Windows
- 控制面板 → 程序和功能 → 卸载 BT Watcher

### macOS
- 将 BT Watcher 从 Applications 拖到垃圾桶

### Linux
- 删除 AppImage 文件

### 配置文件位置
如需完全删除，请删除以下目录：
- Windows: `%APPDATA%\bt-watcher`
- macOS: `~/Library/Application Support/bt-watcher`
- Linux: `~/.config/bt-watcher`

## 故障排查

### 无法启动
- 检查系统版本是否满足要求
- 尝试以管理员权限运行
- 查看错误日志

### 安装失败
- 确保有足够的磁盘空间
- 关闭杀毒软件临时扫描
- 使用管理员权限安装

更多问题请查看 [常见问题](FAQ.md) 或 [提交 Issue](https://github.com/tzrj0/btwatcher/issues)