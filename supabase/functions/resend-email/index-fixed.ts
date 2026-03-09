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
    console.log('=== Email Request Started ===')

    // Parse request body with error handling
    let requestBody: EmailPayload
    try {
      const rawBody = await req.text()
      console.log('Raw request body:', rawBody.substring(0, 200) + '...')
      requestBody = JSON.parse(rawBody)
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError)
      return new Response(
        JSON.stringify({
          error: 'Invalid JSON in request body',
          details: parseError.message
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { to, subject, html, attachments } = requestBody

    console.log('Email data:', {
      to,
      subject,
      hasAttachments: !!attachments,
      attachmentCount: attachments?.length || 0
    })

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
    const fromEmail = Deno.env.get('EMAIL_FROM') || 'onboarding@resend.dev'

    console.log('Configuration:', {
      emailService,
      apiKeyConfigured: !!apiKey,
      apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'none',
      fromEmail
    })

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

    if (emailService === 'resend') {
      // Use Resend API
      const resendPayload = {
        from: fromEmail,
        to: to,
        subject: subject,
        html: html,
        attachments: attachments?.map(att => ({
          filename: att.filename,
          content: att.content,
        })),
      }

      console.log('Sending request to Resend API...')
      console.log('Request payload:', {
        from: resendPayload.from,
        to: resendPayload.to,
        subject: resendPayload.subject,
        hasHtml: !!resendPayload.html,
        hasAttachments: !!resendPayload.attachments
      })

      let resendResponse: Response
      let responseText: string
      let responseStatus: number

      try {
        resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(resendPayload),
        })

        responseStatus = resendResponse.status
        console.log('Resend API response status:', responseStatus)

        // Try to get response text with better error handling
        try {
          responseText = await resendResponse.text()
          console.log('Resend API response body:', responseText || '(empty response)')
        } catch (textError) {
          console.error('Failed to read response body:', textError)
          responseText = `Failed to read response: ${textError.message}`
        }

      } catch (fetchError) {
        console.error('Failed to fetch from Resend API:', fetchError)
        return new Response(
          JSON.stringify({
            error: 'Failed to connect to Resend API',
            details: fetchError.message,
            message: '无法连接到邮件服务，请检查网络连接'
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (resendResponse.ok) {
        console.log('Email sent successfully')
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Email sent successfully',
            details: responseText
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } else {
        console.error('Resend API returned error:', {
          status: responseStatus,
          body: responseText
        })

        // Provide helpful error messages
        let errorMessage = 'Failed to send email'
        if (responseStatus === 401) {
          errorMessage = 'Invalid API Key - please check your EMAIL_API_KEY'
        } else if (responseStatus === 403) {
          errorMessage = 'Forbidden - check your API permissions and FROM email'
        } else if (responseStatus === 422) {
          errorMessage = 'Unprocessable Entity - check email addresses and configuration'
        }

        return new Response(
          JSON.stringify({
            error: 'Failed to send email via Resend',
            status: responseStatus,
            details: responseText,
            message: errorMessage
          }),
          { status: responseStatus, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    } else {
      return new Response(
        JSON.stringify({ error: 'Unsupported email service', supported: ['resend', 'sendgrid'] }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('Unexpected error in edge function:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message || 'Unknown error occurred',
        stack: error.stack
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
