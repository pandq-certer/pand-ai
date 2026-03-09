// Supabase Edge Function for sending emails via Resend
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
    console.log('Received email request')

    const { to, subject, html, attachments }: EmailPayload = await req.json()

    console.log('Email data:', { to, subject, hasAttachments: !!attachments })

    // Validate required fields
    if (!to || !Array.isArray(to) || to.length === 0) {
      console.error('Missing or invalid recipient list')
      return new Response(
        JSON.stringify({ error: 'Missing or invalid recipient list' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!subject || !html) {
      console.error('Missing subject or html content')
      return new Response(
        JSON.stringify({ error: 'Missing subject or html content' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get email service configuration from environment variables
    const emailService = Deno.env.get('EMAIL_SERVICE') || 'resend'
    const apiKey = Deno.env.get('EMAIL_API_KEY')

    console.log('Email service:', emailService)
    console.log('API Key configured:', !!apiKey)

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
      const fromEmail = Deno.env.get('EMAIL_FROM') || 'onboarding@resend.dev'

      // Resend API 对多收件人的支持：需要分别发送每一封邮件
      // 或者将其他收件人放在 cc/bcc 中
      console.log('Sending emails via Resend to multiple recipients:', to)

      // 为每个收件人单独发送邮件
      const emailPromises = to.map(async (recipient) => {
        const resendPayload = {
          from: fromEmail,
          to: [recipient], // Resend 要求 to 是数组，即使只有一个收件人
          subject: subject,
          html: html,
          attachments: attachments?.map(att => ({
            filename: att.filename,
            content: att.content,
          })),
        }

        console.log(`Sending email to ${recipient}:`, { from: fromEmail, subject })

        try {
          const resp = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(resendPayload),
          })

          const responseText = await resp.text()
          console.log(`Response for ${recipient}:`, resp.status, responseText)

          if (!resp.ok) {
            console.error(`Failed to send to ${recipient}:`, responseText)
            return { success: false, recipient, error: responseText }
          }

          return { success: true, recipient }
        } catch (error) {
          console.error(`Error sending to ${recipient}:`, error)
          return { success: false, recipient, error: error.message }
        }
      })

      // 等待所有邮件发送完成
      const results = await Promise.all(emailPromises)

      // 检查是否有失败的
      const failures = results.filter(r => !r.success)
      if (failures.length > 0) {
        return new Response(
          JSON.stringify({
            error: 'Some emails failed to send',
            details: failures,
            message: `${failures.length} 封邮件发送失败，请检查日志`
          }),
          { status: 207, headers: { ...corsHeaders, 'Content-Type': 'application/json' } } // 207 Multi-Status
        )
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Successfully sent ${results.length} emails`,
          details: results
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } else if (emailService === 'sendgrid') {
      // Use SendGrid API
      const fromEmail = Deno.env.get('EMAIL_FROM') || 'noreply@yourdomain.com'

      const sendgridPayload = {
        personalizations: to.map(email => ({
          to: [{ email }],
          subject: subject,
        })),
        from: {
          email: fromEmail,
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

      console.log('Sending email via SendGrid:', { from: fromEmail, to })

      response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sendgridPayload),
      })

      if (response.ok) {
        return new Response(
          JSON.stringify({ success: true, message: 'Email sent successfully' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } else {
        const errorText = await response.text()
        console.error('SendGrid error:', errorText)
        return new Response(
          JSON.stringify({
            error: 'Failed to send email via SendGrid',
            details: errorText,
            message: '邮件发送失败，请检查配置或稍后重试'
          }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

    } else {
      return new Response(
        JSON.stringify({ error: 'Unsupported email service' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('Error processing request:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message || 'Unknown error occurred'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
