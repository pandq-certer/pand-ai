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
    // Debug: Log environment variables (without exposing full API key)
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const fromEmail = Deno.env.get('FROM_EMAIL')

    console.log('=== DEBUG INFO ===')
    console.log('RESEND_API_KEY exists:', !!resendApiKey)
    console.log('RESEND_API_KEY length:', resendApiKey?.length || 0)
    console.log('RESEND_API_KEY prefix:', resendApiKey?.substring(0, 7) + '...')
    console.log('FROM_EMAIL:', fromEmail)

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({
          error: 'RESEND_API_KEY not found in environment',
          debug: {
            hasKey: false,
            fromEmail: fromEmail
          }
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!fromEmail) {
      return new Response(
        JSON.stringify({
          error: 'FROM_EMAIL not found in environment',
          debug: {
            hasKey: true,
            hasFromEmail: false
          }
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const { to, subject, html, attachments } = await req.json()

    console.log('Email request:', { to, subject, hasHtml: !!html, hasAttachments: !!attachments })

    // Validate required fields
    if (!to || !Array.isArray(to) || to.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid recipient list' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!subject || !html) {
      return new Response(
        JSON.stringify({ error: 'Missing subject or html content' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Prepare email payload
    const emailPayload: any = {
      from: fromEmail,
      to: to,
      subject: subject,
      html: html,
    }

    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      emailPayload.attachments = attachments.map(att => ({
        filename: att.filename,
        content: att.content,
      }))
      console.log('Email includes', attachments.length, 'attachment(s)')
    }

    console.log('Sending request to Resend API...')
    console.log('Request payload:', {
      from: emailPayload.from,
      to: emailPayload.to,
      subject: emailPayload.subject,
      hasHtml: !!emailPayload.html,
      hasAttachments: !!emailPayload.attachments
    })

    // Send email via Resend API
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify(emailPayload),
    })

    console.log('Resend API response status:', res.status)
    console.log('Resend API response headers:', Object.fromEntries(res.headers.entries()))

    const responseText = await res.text()
    console.log('Resend API response body:', responseText || '(empty)')

    if (res.ok) {
      console.log('✅ Email sent successfully')
      return new Response(responseText, {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } else {
      console.error('❌ Resend API returned error:', res.status, responseText)

      // Provide helpful error messages based on status code
      let errorMessage = 'Failed to send email'
      if (res.status === 401) {
        errorMessage = 'Authentication failed - API Key is invalid or expired'
      } else if (res.status === 403) {
        errorMessage = 'Forbidden - Check your API permissions and FROM email address'
      } else if (res.status === 422) {
        errorMessage = 'Unprocessable Entity - Check email addresses and configuration'
      }

      return new Response(
        JSON.stringify({
          error: errorMessage,
          status: res.status,
          details: responseText,
          debug: {
            apiKeyPrefix: resendApiKey.substring(0, 10) + '...',
            fromEmail: fromEmail,
            requestTo: to
          }
        }),
        {
          status: res.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message,
        stack: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
