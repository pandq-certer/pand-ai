# 邮件功能配置指南

本文档说明如何配置和部署团队资源规划系统的邮件发送功能。

## 功能概述

系统支持以下邮件功能：
- ✅ 手动发送数据看板报告邮件
- ✅ 配置多个收件人（成员邮箱 + 自定义邮箱）
- ✅ 定时发送（每天指定时间自动发送）
- ✅ 导出数据看板为图片作为邮件附件
- ✅ 邮件发送历史记录

## 前置要求

1. 已注册 Supabase 账户并创建项目
2. 已注册邮件服务账户（Resend 或 SendGrid）
3. 已安装 Supabase CLI（可选，用于部署 Edge Functions）

## 步骤 1: 配置邮件服务

### 选项 A: 使用 Resend（推荐）

1. 注册 Resend 账户: https://resend.com/
2. 创建 API Key
3. 验证发送域名（或使用测试域名）

### 选项 B: 使用 SendGrid

1. 注册 SendGrid 账户: https://sendgrid.com/
2. 创建 API Key
3. 配置 Sender Identity

## 步骤 2: 部署 Supabase Edge Function

### 方法 1: 使用 Supabase Dashboard（推荐）

1. 登录 Supabase Dashboard
2. 选择你的项目
3. 进入 "Edge Functions" 页面
4. 点击 "New Edge Function"
5. 函数名称: `send-email`
6. 复制以下代码到编辑器:

```typescript
// 复制 supabase/functions/send-email/index.ts 的内容
```

7. 配置环境变量:
   - `EMAIL_SERVICE`: `resend` 或 `sendgrid`
   - `EMAIL_API_KEY`: 你的邮件服务 API Key
   - `EMAIL_FROM`: 发件人邮箱地址

8. 点击 "Deploy"

### 方法 2: 使用 Supabase CLI

1. 安装 Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. 登录 Supabase:
   ```bash
   supabase login
   ```

3. 链接到你的项目:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

4. 部署 Edge Function:
   ```bash
   supabase functions deploy send-email
   ```

5. 设置环境变量:
   ```bash
   supabase secrets set EMAIL_SERVICE=resend
   supabase secrets set EMAIL_API_KEY=your_api_key_here
   supabase secrets set EMAIL_FROM=your_email@example.com
   ```

## 步骤 3: 配置系统邮件设置

1. 登录团队资源规划系统
2. 进入 "系统配置" 页面
3. 找到 "邮件配置" 部分

### 3.1 添加成员邮箱

在 "成员管理" 部分：
1. 点击成员旁边的 "+ 添加邮箱"
2. 输入邮箱地址
3. 点击保存
4. 点击 "接收邮件" 按钮启用该成员的邮件接收

### 3.2 添加自定义邮箱

在 "邮件配置" 部分：
1. 启用 "邮件发送" 开关
2. 在 "自定义邮箱" 输入框中输入邮箱地址
3. 点击 "添加" 或按 Enter 键
4. 可以添加多个自定义邮箱

### 3.3 配置定时发送

1. 在 "定时发送时间" 中选择时间（例如: 09:00）
2. 系统将在每天该时间自动发送报告

### 3.4 手动发送测试

1. 点击 "立即发送" 按钮
2. 等待发送完成（几秒钟）
3. 查看发送状态提示

## 故障排查

### 问题 1: 邮件发送失败

**错误信息**: "邮件发送失败，请检查配置或稍后重试"

**解决方案**:
1. 检查 Edge Function 是否已部署
2. 验证环境变量是否正确配置
3. 检查邮件服务的 API Key 是否有效
4. 查看 Supabase Logs 中的错误详情

### 问题 2: 收件人未收到邮件

**解决方案**:
1. 检查邮箱地址是否正确
2. 确认成员的 "接收邮件" 开关已启用
3. 检查垃圾邮件文件夹
4. 验证邮件服务的域名配置

### 问题 3: 导出图片失败

**解决方案**:
1. 确保已安装 html2canvas 包
2. 检查浏览器控制台的错误信息
3. 尝试刷新页面后重新发送

## 安全建议

1. **不要在代码中硬编码 API Keys**
   - 始终使用 Supabase 环境变量存储敏感信息

2. **限制 API Key 权限**
   - 只授予发送邮件的最小权限

3. **验证邮箱地址**
   - 在添加成员邮箱时验证地址的有效性

4. **定期轮换 API Keys**
   - 定期更新邮件服务的 API Key

## 定时任务说明

当前版本支持配置定时发送时间，但实际执行需要：

1. **使用 Supabase 定时任务**（推荐）:
   - 在 Supabase Dashboard 中创建 cron job
   - 定时调用邮件发送 API

2. **或使用外部定时服务**:
   - GitHub Actions
   - Vercel Cron Jobs
   - 其他 cron 服务

示例 cron job 代码将在后续版本中提供。

## 成本估算

### Resend 定价
- 免费套餐: 3,000 封邮件/月
- 付费套餐: $20/月起（50,000 封邮件/月）

### SendGrid 定价
- 免费套餐: 100 封邮件/天
- 付费套餐: $19.95/月起（最高 40,000 封邮件/月）

## 技术支持

如遇到问题，请：
1. 查看 Supabase Dashboard 的 Logs
2. 检查浏览器控制台的错误信息
3. 参考本文档的故障排查部分

## 更新日志

- **v2.1.0** (2025-01-11):
  - ✨ 新增邮件发送功能
  - ✨ 支持手动和定时发送
  - ✨ 支持多个收件人
  - ✨ 导出数据看板为图片
  - 📝 完善配置界面
