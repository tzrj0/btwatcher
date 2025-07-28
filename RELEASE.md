# 发布指南

本项目使用自动化脚本来创建正式发布版本。

## 使用发布脚本

### macOS/Linux

```bash
./release.sh
```

### Windows

```powershell
.\release.ps1
```

## 脚本功能

1. **检查 Git 状态** - 确保没有未提交的更改
2. **版本号管理** - 自动更新 package.json 中的版本号
3. **创建 Git 标签** - 创建带注释的版本标签
4. **推送到 GitHub** - 自动推送代码和标签
5. **触发自动构建** - GitHub Actions 会自动构建所有平台的安装包

## 发布流程

1. 运行发布脚本
2. 输入新版本号（格式：x.y.z）
3. 输入发布说明
4. 确认发布信息
5. 脚本自动完成：
   - 更新版本号
   - 提交更改
   - 创建标签
   - 推送到 GitHub
6. GitHub Actions 自动构建并发布

## 版本号规范

遵循语义化版本规范（Semantic Versioning）：

- **主版本号（x）**：不兼容的 API 修改
- **次版本号（y）**：向下兼容的功能性新增
- **修订号（z）**：向下兼容的问题修正

示例：
- `1.0.1` - 修复 bug
- `1.1.0` - 添加新功能
- `2.0.0` - 重大更新

## 发布说明模板

```
## 新功能
- 功能1
- 功能2

## 改进
- 改进1
- 改进2

## 修复
- 修复1
- 修复2

## 其他
- 其他更改
```

## 注意事项

1. 发布前确保所有测试通过
2. 确保 CHANGELOG.md 已更新
3. 发布后检查 GitHub Actions 构建状态
4. 验证 Release 页面的下载链接

## 查看发布

- 构建进度：https://github.com/tzrj0/btwatcher/actions
- 发布页面：https://github.com/tzrj0/btwatcher/releases