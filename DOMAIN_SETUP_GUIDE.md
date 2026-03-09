# 腾讯云域名注册和 Resend 邮件服务配置完整指南

## 第一阶段：在腾讯云注册域名

### 步骤 1：注册腾讯云账号
1. 访问 https://dnspod.cloud.tencent.com/
2. 如果已有账号，直接登录
3. 如果没有，点击"注册"创建新账号

### 步骤 2：购买域名
1. 访问 https://buy.cloud.tencent.com/domain/
2. 搜索你想要的域名（例如：`yourcompany.com`）
3. 选择可用的域名后缀（推荐 `.com`，`.cn` 较便宜）
4. 添加到购物车并完成购买（费用约 50-100 元/年）

**域名购买建议**：
- 选择简短、易记的域名
- `.com` 域名更专业，但价格稍高
- `.top`、`.xyz` 等新后缀更便宜（有时只需几元）

### 步骤 3：域名实名认证（重要）
1. 购买后需要在腾讯云完成实名认证
2. 进入"域名管理"页面
3. 上传身份证照片或企业营业执照
4. 等待审核（通常几小时内完成）

---

## 第二阶段：配置域名 DNS 记录

### 步骤 4：进入腾讯云 DNS 管理控制台
1. 登录腾讯云控制台
2. 进入"产品" > "域名服务" > "DNS 解析"
3. 或者直接访问：https://console.cloud.tencent.com/cns

### 步骤 5：添加 DNS 记录（暂不操作）
先不要添加记录，等在 Resend 中添加域名后，会提供具体的 DNS 配置信息。

---

## 第三阶段：在 Resend 中添加并验证域名

### 步骤 6：登录 Resend 并添加域名
1. 访问 https://resend.com/domains
2. 点击 "Add Domain" 或 "Get Started"
3. 输入你在腾讯云购买的域名（例如：`yourcompany.com`）

### 步骤 7：获取 DNS 配置信息
Resend 会提供三组 DNS 记录，你需要在腾讯云配置这些记录。记录类型通常包括：

#### 类型 1：TXT 记录（域名验证）
```
类型: TXT
主机记录: @ 或 resend
记录值: v=spf1 include:resend.com ~all
```

#### 类型 2：CNAME 记录（邮件验证）
```
类型: CNAME
主机记录: resend._domainkey
记录值: dkim.resend.com
```

#### 类型 3：MX 记录（邮件交换）
```
类型: MX
主机记录: @
优先级: 10
记录值: feedback-smtp.us-east-1.amazonses.com
```

**注意**：具体的记录值以 Resend 提供的为准！

---

## 第四阶段：在腾讯云配置 DNS 记录

### 步骤 8：添加 DNS 记录到腾讯云
1. 回到腾讯云 DNS 控制台
2. 找到你购买的域名
3. 点击 "解析" 或 "添加记录"

#### 添加记录 1：TXT 记录
- **主机记录**：输入 `@`（如果 Resend 提供了特定前缀，使用前缀）
- **记录类型**：选择 `TXT`
- **记录值**：粘贴 Resend 提供的 TXT 记录值
- **TTL**：选择 `600` 或默认值

#### 添加记录 2：CNAME 记录
- **主机记录**：输入 `resend._domainkey`
- **记录类型**：选择 `CNAME`
- **记录值**：粘贴 Resend 提供的 CNAME 记录值
- **TTL**：选择 `600` 或默认值

#### 添加记录 3：MX 记录
- **主机记录**：输入 `@`
- **记录类型**：选择 `MX`
- **优先级**：输入 `10`
- **记录值**：粘贴 Resend 提供的 MX 记录值
- **TTL**：选择 `600` 或默认值

### 步骤 9：保存 DNS 记录
1. 确认所有记录信息正确
2. 点击 "保存" 或 "添加"
3. 等待 DNS 生效（通常 5-30 分钟）

---

## 第五阶段：验证域名配置

### 步骤 10：在 Resend 中验证域名
1. 返回 Resend Domains 页面
2. 点击你添加的域名
3. 点击 "Verify DNS Records" 或 "Check Status"
4. 等待验证完成（可能需要几分钟到几小时）

### 步骤 11：检查验证状态
成功的 DNS 配置应该显示：
- ✅ Domain Verified
- ✅ DNS Configured
- ✅ DKIM Configured
- ✅ SPF Configured

---

## 第六阶段：创建邮箱地址

### 步骤 12：在 Resend 中创建邮箱
1. 在验证通过的域名下，点击 "Create Email Address"
2. 输入邮箱前缀（例如：`info`、`noreply`、`admin`）
3. 完整邮箱将是：`info@yourcompany.com`

### 步骤 13：更新 Supabase 环境变量
在 Supabase Edge Function 的 Secrets 中更新：

```
RESEND_API_KEY=re_你的API密钥
FROM_EMAIL=info@yourcompany.com  # 使用你创建的邮箱
```

---

## 第七阶段：更新 Edge Function 代码

### 步骤 14：移除邮箱限制
现在域名已验证，可以发送到任何邮箱地址。更新 Edge Function 代码：

```typescript
// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const fromEmail = Deno.env.get('FROM_EMAIL')

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { to, subject, html, attachments } = await req.json()

    // 生产模式：域名验证后，可以发送到任何邮箱
    const emailPayload: any = {
      from: fromEmail, // 使用你验证的域名邮箱，如 info@yourcompany.com
      to: to,          // 现在可以发送到任何邮箱地址
      subject,
      html,
    }

    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      emailPayload.attachments = attachments
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify(emailPayload),
    })

    const text = await res.text()

    if (res.ok) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Email sent successfully',
          recipients: to
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      return new Response(
        JSON.stringify({ error: 'Failed to send email', status: res.status, details: text }),
        { status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

---

## 第八阶段：测试生产模式

### 步骤 15：测试发送到多个邮箱
1. 在你的应用中配置多个接收邮箱
2. 点击"立即发送"测试
3. 检查所有配置的邮箱是否都收到邮件

### 步骤 16：验证邮件内容
1. 检查发件人地址（应该是 `info@yourcompany.com`）
2. 检查邮件内容和附件
3. 确认邮件可以正常送达

---

## 费用说明

### 腾讯云域名费用
- `.com` 域名：约 50-80 元/年
- `.cn` 域名：约 30-50 元/年
- `.top`、`.xyz` 等新后缀：约 5-20 元/年

### Resend 费用
- 免费额度：3,000 封邮件/天
- 付费计划：$20/月起（50,000 封邮件/月）

---

## 常见问题

### Q1: DNS 验证需要多长时间？
A: 通常 5-30 分钟，但最长可能需要 48 小时。

### Q2: 验证失败怎么办？
A:
1. 检查 DNS 记录是否正确复制
2. 确认没有多余的空格或引号
3. 使用 https://dnschecker.org/ 检查 DNS 记录是否生效
4. 等待更长时间后重试验证

### Q3: 可以使用多个域名吗？
A: 可以，在 Resend 中添加多个域名，每个域名都需要验证。

### Q4: 如何查看邮件发送统计？
A: 在 Resend Dashboard 的 "Logs" 和 "Analytics" 部分查看详细统计。

---

## 时间线估算

1. **域名购买**：10 分钟
2. **实名认证**：几小时到 1 天
3. **DNS 配置**：15 分钟
4. **DNS 生效**：5-30 分钟
5. **域名验证**：几分钟到几小时
6. **测试发送**：10 分钟

总计：半天到一天（主要是等待时间）

---

## 需要帮助？

如果在配置过程中遇到问题：
1. 腾讯云文档：https://cloud.tencent.com/document/product/302
2. Resend 文档：https://resend.com/docs
3. 可随时询问我具体哪个步骤遇到问题
