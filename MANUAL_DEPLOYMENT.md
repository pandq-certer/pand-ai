# 通过 Dashboard 手动部署 Edge Function

如果你的系统没有安装 Supabase CLI，可以通过 Supabase Dashboard 手动部署。

## 手动部署步骤

### 1. 访问 Supabase Dashboard

- 访问 https://supabase.com/dashboard
- 登录并选择你的项目

### 2. 创建 Edge Function

1. 在左侧菜单中找到 **Edge Functions**（可能在 "Functions" 或 "Database" 下面）
2. 点击 **"New Edge Function"** 或 **"+"** 按钮
3. 函数名称输入：`send-email`
4. 选择语言：TypeScript
5. 点击 **"Create"**

### 3. 复制函数代码

将以下代码复制到函数编辑器中：

```typescript
// Supabase Edge Function for sending emails
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

interface EmailPayload {
  to: string[];
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: string;
    encoding: 'base64';
  }>;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, html, attachments }: EmailPayload = await req.json()

    // Validate required fields
    if (!to || !Array.isArray(to) || to.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid recipient list' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!subject || !html) {
      return new Response(
        JSON.stringify({ error: 'Missing subject or html content' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get email service configuration from environment variables
    const emailService = Deno.env.get('EMAIL_SERVICE') || 'resend'
    const apiKey = Deno.env.get('EMAIL_API_KEY')

    if (!apiKey) {
      console.error('EMAIL_API_KEY not configured')
      return new Response(
        JSON.stringify({
          error: 'Email service not configured',
          message: '请在 Supabase 项目设置中配置 EMAIL_API_KEY 环境变量'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let response: Response

    if (emailService === 'resend') {
      // Use Resend API
      const resendPayload = {
        from: Deno.env.get('EMAIL_FROM') || 'noreply@yourdomain.com',
        to: to,
        subject: subject,
        html: html,
        attachments: attachments?.map(att => ({
          filename: att.filename,
          content: att.content,
        })),
      }

      response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(resendPayload),
      })

    } else if (emailService === 'sendgrid') {
      // Use SendGrid API
      const sendgridPayload = {
        personalizations: to.map(email => ({
          to: [{ email }],
          subject: subject,
        })),
        from: {
          email: Deno.env.get('EMAIL_FROM') || 'noreply@yourdomain.com',
        },
        content: [{
          type: 'text/html',
          value: html,
        }],
        attachments: attachments?.map(att => ({
          filename: att.filename,
          content: att.content,
          type: 'image/png',
          disposition: 'attachment',
        })),
      }

      response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sendgridPayload),
      })

    } else {
      return new Response(
        JSON.stringify({ error: 'Unsupported email service' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (response.ok) {
      return new Response(
        JSON.stringify({ success: true, message: 'Email sent successfully' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      const errorText = await response.text()
      console.error('Email service error:', errorText)
      return new Response(
        JSON.stringify({
          error: 'Failed to send email',
          details: errorText,
          message: '邮件发送失败，请检查配置或稍后重试'
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('Error processing request:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

### 4. 保存函数

点击 **"Save"** 或 **"Deploy"** 按钮保存函数。

### 5. 配置环境变量

在同一个 Edge Functions 页面中：

1. 找到 **Environment Variables** 部分
2. 添加以下环境变量：

```bash
# 推荐使用 Resend（免费额度更大）
EMAIL_SERVICE=resend
EMAIL_API_KEY=re_your_api_key_here
EMAIL_FROM=your-email@example.com
```

或者使用 SendGrid：
```bash
EMAIL_SERVICE=sendgrid
EMAIL_API_KEY=SG.your_api_key_here
EMAIL_FROM=your-email@example.com
```

### 6. 获取邮件服务 API Key

#### 使用 Resend（推荐）：

1. 访问 https://resend.com/signup 注册账号
2. 进入 https://resend.com/api-keys 创建 API Key
3. 添加并验证你的域名（或使用 `onboarding@resend.dev` 测试邮箱）
4. 复制 API Key 到 Supabase 环境变量

#### 使用 SendGrid：

1. 访问 https://sendgrid.com/ 注册账号
2. 进入 https://app.sendgrid.com/settings/api_keys 创建 API Key
3. 配置 Sender Authentication（验证发件人）
4. 复制 API Key 到 Supabase 环境变量

### 7. 测试功能

1. 返回你的应用
2. 进入"系统配置"页面
3. 启用邮件发送
4. 添加接收邮箱
5. 点击"立即发送"按钮测试

## 快速开始（推荐使用 Resend）

1. **注册 Resend**: https://resend.com/signup
2. **创建 API Key**: https://resend.com/api-keys
3. **使用测试邮箱**（无需验证域名）:
   - 发件人：`onboarding@resend.dev`
   - 收件人：你的个人邮箱
4. **配置环境变量**:
   ```
   EMAIL_SERVICE=resend
   EMAIL_API_KEY=re_xxxxx
   EMAIL_FROM=onboarding@resend.dev
   ```
5. **部署并测试**

## 故障排除

### 404 错误
- 确保函数名称为 `send-email`
- 检查函数是否成功部署

### 500 错误
- 检查环境变量是否配置
- 验证 API Key 是否有效
- 查看函数日志获取详细错误信息

### 邮件未收到
- 检查垃圾邮件文件夹
- 确认发件人已验证
- 验证收件人邮箱地址正确

## 费用说明

- **Resend**: 免费额度 3,000 封/天
- **SendGrid**: 免费额度 100 封/天

推荐使用 Resend，免费额度更大且配置更简单。
