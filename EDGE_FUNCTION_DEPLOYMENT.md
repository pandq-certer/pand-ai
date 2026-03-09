# Supabase Edge Function 部署指南

## 问题说明

当你点击"立即发送"按钮时，如果收到 `404` 错误，是因为 Supabase Edge Function 还没有部署。

## 部署步骤

### 1. 安装 Supabase CLI

首先确保你已安装 Supabase CLI。如果未安装，请执行：

```bash
# macOS
brew install supabase/tap/supabase

# Linux
curl -fsSL https://sup.supabase.com/install.sh | sh

# Windows
 scoop install supabase
```

### 2. 登录 Supabase

```bash
supabase login
```

### 3. 链接到你的项目

```bash
# 方法1：通过项目引用链接
supabase link --project-ref bgwmuihgbllamqlhidds

# 方法2：或者通过项目ID
supabase link --project-ref YOUR_PROJECT_REF
```

### 4. 部署 Edge Function

```bash
# 部署 send-email 函数
supabase functions deploy send-email
```

### 5. 配置环境变量

在 Supabase Dashboard 中配置邮件服务：

#### 步骤：
1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 **Edge Functions** 页面
4. 点击 **send-email** 函数
5. 在 **Environment Variables** 部分添加以下变量：

#### 推荐使用 Resend（免费额度更大）

```bash
EMAIL_SERVICE=resend
EMAIL_API_KEY=re_xxxxxxxxxxxxx  # 从 https://resend.com/api-keys 获取
EMAIL_FROM=your-email@example.com  # 你的验证域名邮箱
```

#### 或者使用 SendGrid

```bash
EMAIL_SERVICE=sendgrid
EMAIL_API_KEY=SG.xxxxxxxxxxxxx  # 从 https://app.sendgrid.com/settings/api_keys 获取
EMAIL_FROM=your-email@example.com  # 你的发送邮箱
```

### 6. 验证域名（使用 Resend）

如果你使用 Resend，需要验证域名：

1. 访问 [Resend Dashboard](https://resend.com/domains)
2. 添加你的域名
3. 配置 DNS 记录（Resend 会提供具体的 DNS 配置）
4. 等待 DNS 验证完成
5. 使用验证后的域名作为 `EMAIL_FROM`

### 7. 测试部署

部署完成后，在应用中测试发送邮件功能：

1. 进入"系统配置"页面
2. 启用邮件发送
3. 添加接收邮箱
4. 点击"立即发送"按钮
5. 检查配置的邮箱是否收到邮件

## 常见问题

### 404 错误
- 确保已成功部署 Edge Function
- 检查函数名称是否为 `send-email`

### 500 错误 - Email service not configured
- 确保在 Supabase Dashboard 中配置了 `EMAIL_API_KEY`
- 检查环境变量名称是否正确

### 邮件发送失败
- 检查 API Key 是否有效
- 确保发件邮箱已验证（Resend/SendGrid 都要求验证发件人）
- 检查收件人邮箱地址是否正确

## 使用 Resend 的优势

推荐使用 Resend，因为：
- 免费额度：每天 3,000 封邮件
- 更简单的 API
- 更好的开发者体验
- 支持附件和 HTML 邮件

注册 Resend：https://resend.com/signup

## 快速开始（推荐流程）

1. 注册 [Resend](https://resend.com/signup)
2. 创建 API Key
3. 验证你的域名（或使用 Resend 提供的测试邮箱）
4. 在 Supabase Dashboard 配置环境变量
5. 部署 Edge Function
6. 测试发送邮件

## 监控和日志

你可以在 Supabase Dashboard 的 Edge Functions 页面查看：
- 函数调用日志
- 错误信息
- 执行时间

这有助于调试邮件发送问题。
