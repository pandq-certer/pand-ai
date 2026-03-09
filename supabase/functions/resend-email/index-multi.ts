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

    console.log('=== Email Request ===')

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { to, subject, html, attachments } = await req.json()

    console.log('Requested recipients:', to)
    console.log('Number of recipients:', to.length)

    // 测试模式：过滤收件人，只发送到验证的邮箱
    // 在 Resend Dashboard 中添加更多测试邮箱
    const verifiedEmails = [
      '18500310981@163.com',  // 你的主邮箱
      // 在这里添加更多在 Resend 中验证的测试邮箱
      // 例如: 'test2@example.com', 'test3@example.com'
    ]

    // 过滤收件人列表，只保留验证过的邮箱
    const filteredTo = to.filter((email: string) => verifiedEmails.includes(email))

    console.log('Verified recipients:', filteredTo)

    if (filteredTo.length === 0) {
      return new Response(
        JSON.stringify({
          error: 'No verified recipients',
          message: '在测试模式下，只能发送到验证过的邮箱地址。请在 Resend Dashboard 中添加更多测试邮箱，或者验证域名后使用生产模式。',
          requested: to,
          verified: verifiedEmails
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (filteredTo.length < to.length) {
      console.warn('Some recipients were filtered out:', {
        requested: to,
        sent: filteredTo,
        filtered: to.filter((email: string) => !verifiedEmails.includes(email))
      })
    }

    const emailPayload: any = {
      from: fromEmail || 'onboarding@resend.dev',
      to: filteredTo,
      subject,
      html,
    }

    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      emailPayload.attachments = attachments
      console.log('Email includes', attachments.length, 'attachment(s)')
    }

    console.log('Sending email to Resend API...')

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
    console.log('Resend API response:', text || '(empty)')

    if (res.ok) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Email sent successfully',
          recipients: filteredTo,
          details: text
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
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
    console.error('Error in edge function:', error)
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
