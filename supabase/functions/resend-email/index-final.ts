// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('=== Email Request Started ===')

    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const fromEmail = Deno.env.get('FROM_EMAIL')

    console.log('Configuration check:', {
      hasApiKey: !!resendApiKey,
      fromEmail: fromEmail || 'NOT_SET'
    })

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!fromEmail) {
      return new Response(
        JSON.stringify({ error: 'FROM_EMAIL not configured. Please set FROM_EMAIL to noreply@db-cscsteam-email.asia' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { to, subject, html, attachments } = await req.json()

    console.log('Email request details:', {
      to,
      subject,
      hasHtml: !!html,
      hasAttachments: !!attachments,
      attachmentCount: attachments?.length || 0
    })

    // 构建邮件负载
    const emailPayload: any = {
      from: fromEmail,
      to: to,
      subject: subject,
      html: html,
    }

    // 处理附件 - 确保正确传递 contentId
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      emailPayload.attachments = attachments.map(att => {
        const attachment: any = {
          filename: att.filename,
          content: att.content,
        }

        // 如果提供了 contentId，添加到附件中（用于内嵌图片）
        if (att.contentId) {
          attachment.contentId = att.contentId
        }

        console.log('Attachment:', {
          filename: att.filename,
          hasContentId: !!att.contentId,
          contentId: att.contentId
        })

        return attachment
      })

      console.log('Email includes', emailPayload.attachments.length, 'attachment(s)')
    }

    console.log('Sending email via Resend API...')
    console.log('From:', fromEmail)
    console.log('To:', to)

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify(emailPayload),
    })

    console.log('Resend API response status:', res.status)

    const text = await res.text()
    console.log('Resend API response body:', text || '(empty)')

    if (res.ok) {
      console.log('✅ Email sent successfully to', to.length, 'recipient(s)')
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Email sent successfully',
          recipients: to,
          from: fromEmail,
          attachmentsCount: attachments?.length || 0
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      console.error('❌ Failed to send email:', res.status, text)
      return new Response(
        JSON.stringify({
          error: 'Failed to send email',
          status: res.status,
          details: text
        }),
        { status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('❌ Error in edge function:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message,
        stack: error.stack
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
