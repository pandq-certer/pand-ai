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
    const emailService = Deno.env.get('EMAIL_SERVICE') || 'resend' // 'resend' or 'sendgrid'
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
