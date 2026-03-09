# Edge Function 配置和故障排除指南

## 问题：500 Internal Server Error

这个错误通常是因为：
1. Edge Function 代码有语法错误
2. 缺少必需的环境变量
3. 环境变量值不正确

## 解决步骤

### 1. 更新 Edge Function 代码

在 Supabase Dashboard 中更新 `resend-email` 函数的代码：

1. 访问 https://supabase.com/dashboard
2. 选择你的项目
3. 进入 Edge Functions 页面
4. 点击 `resend-email` 函数
5. 将代码替换为 `supabase/functions/resend-email/index.ts` 文件中的内容
6. 点击 Save

### 2. 配置环境变量

在同一个函数页面中，配置以下环境变量：

```
EMAIL_SERVICE=resend
EMAIL_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=onboarding@resend.dev
```

#### 获取 Resend API Key：

1. 访问 https://resend.com/signup 注册账号
2. 进入 https://resend.com/api-keys
3. 点击 "Create API Key"
4. 复制 API Key（格式：re_xxxxxxxxxxxxx）

#### 使用测试邮箱（推荐）：

- 发件人：`onboarding@resend.dev`（无需验证，可直接使用）
- 收件人：你的个人邮箱地址

### 3. 验证配置

确保在 Supabase Dashboard 的 Edge Functions 页面：

```
✅ 函数名称：resend-email
✅ 状态：Active
✅ 环境变量已配置
```

### 4. 查看 Edge Function 日志

如果仍然报错，查看详细日志：

1. 在 Supabase Dashboard 的 Edge Functions 页面
2. 点击 `resend-email` 函数
3. 查看 **Logs** 部分
4. 找到错误信息并告诉我

### 5. 测试步骤

1. 刷新应用页面
2. 进入"系统配置"
3. 启用邮件发送
4. 添加你的邮箱作为接收人
5. 点击"立即发送"

## 常见错误和解决方案

### 错误 1：EMAIL_API_KEY not configured
**原因**：环境变量未配置
**解决**：在 Supabase Dashboard 中添加 `EMAIL_API_KEY` 环境变量

### 错误 2：Invalid API key
**原因**：API Key 无效或格式错误
**解决**：
- 检查 API Key 是否以 `re_` 开头
- 重新生成 API Key

### 错误 3：From address is not verified
**原因**：发件人邮箱未验证
**解决**：
- 使用 `onboarding@resend.dev` 作为测试邮箱
- 或者在 Resend 中验证你的域名

### 错误 4：SyntaxError in Edge Function
**原因**：代码语法错误
**解决**：
- 确保使用了修复后的代码
- 检查是否有遗漏的括号或逗号

## 快速测试命令

你也可以使用 curl 命令直接测试 Edge Function：

```bash
curl -X POST 'https://bgwmuihgbllamqlhidds.supabase.co/functions/v1/resend-email' \
  -H 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "to": ["your-email@example.com"],
    "subject": "Test Email",
    "html": "<h1>Test</h1><p>This is a test email.</p>"
  }'
```

将 `YOUR_SUPABASE_ANON_KEY` 替换为你的 Supabase 匿名密钥（在 Project Settings > API 中找到）。

## 获取帮助

如果问题仍然存在，请提供以下信息：

1. Supabase Edge Function 日志中的完整错误信息
2. 配置的环境变量（可以隐藏 API Key 的具体值）
3. 浏览器控制台中的错误信息

我会根据具体的错误信息提供针对性的解决方案。
