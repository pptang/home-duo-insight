import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { Resend } from 'npm:resend@2.0.0'

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  template?: 'expert-invite' | 'contact-expert' | 'welcome' | 'feedback'
  templateData?: Record<string, any>
}

const getEmailTemplate = (template: string, data: Record<string, any>) => {
  switch (template) {
    case 'expert-invite':
      return {
        subject: 'You\'re invited to join DuoHome Advisor as an Expert',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #6A7FDB;">Welcome to DuoHome Advisor</h1>
            <p>Hello ${data.name || 'there'},</p>
            <p>You've been invited to join DuoHome Advisor as a verified real estate expert.</p>
            <p>As an expert, you'll be able to:</p>
            <ul>
              <li>Provide professional insights on property comparisons</li>
              <li>Build your reputation in the community</li>
              <li>Connect with potential clients</li>
            </ul>
            <p>Your temporary login credentials:</p>
            <div style="background: #f7f7f8; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <strong>Email:</strong> ${data.email}<br>
              <strong>Password:</strong> ${data.password}
            </div>
            <p><a href="${data.loginUrl || 'https://duohome-advisor.lovable.app/auth'}" style="background: #6A7FDB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Login to Your Account</a></p>
            <p>Please change your password after logging in for the first time.</p>
            <p>Best regards,<br>The DuoHome Advisor Team</p>
          </div>
        `
      }
    
    case 'contact-expert':
      return {
        subject: `New message from ${data.userName} via DuoHome Advisor`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #6A7FDB;">New Message from DuoHome Advisor</h1>
            <p>Hello ${data.expertName},</p>
            <p>You have received a new message through DuoHome Advisor:</p>
            <div style="background: #f7f7f8; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <strong>From:</strong> ${data.userName} (${data.userEmail})<br>
              <strong>Subject:</strong> ${data.subject}<br>
              <strong>Message:</strong><br>
              ${data.message.replace(/\n/g, '<br>')}
            </div>
            <p>You can reply directly to this email to respond to ${data.userName}.</p>
            <p>Best regards,<br>The DuoHome Advisor Team</p>
          </div>
        `
      }
    
    case 'welcome':
      return {
        subject: 'Welcome to DuoHome Advisor!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #6A7FDB;">Welcome to DuoHome Advisor!</h1>
            <p>Hello ${data.name},</p>
            <p>Thank you for joining DuoHome Advisor - your AI-powered property comparison platform.</p>
            <p>With DuoHome Advisor, you can:</p>
            <ul>
              <li>Compare two properties side-by-side with AI analysis</li>
              <li>Get expert insights from verified real estate professionals</li>
              <li>Make confident decisions with community wisdom</li>
            </ul>
            <p><a href="${data.dashboardUrl || 'https://duohome-advisor.lovable.app'}" style="background: #6A7FDB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Start Comparing Properties</a></p>
            <p>Best regards,<br>The DuoHome Advisor Team</p>
          </div>
        `
      }
    
    case 'feedback':
      return {
        subject: `Feedback from ${data.userName} - DuoHome Advisor`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #6A7FDB;">New Feedback</h1>
            <p><strong>From:</strong> ${data.userName} (${data.userEmail})</p>
            <p><strong>Type:</strong> ${data.feedbackType}</p>
            <p><strong>Message:</strong></p>
            <div style="background: #f7f7f8; padding: 16px; border-radius: 8px; margin: 16px 0;">
              ${data.message.replace(/\n/g, '<br>')}
            </div>
            <p>Sent via DuoHome Advisor feedback form</p>
          </div>
        `
      }
    
    default:
      return { subject: 'DuoHome Advisor', html: data.html || data.text || '' }
  }
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const requestData: EmailRequest = await req.json()
    const { to, subject, html, text, template, templateData } = requestData

    // Validate request
    if (!to) {
      return new Response(
        JSON.stringify({ error: 'Recipient email is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        },
      )
    }

    let emailContent: { subject: string; html: string }

    // Use template if provided
    if (template && templateData) {
      emailContent = getEmailTemplate(template, templateData)
    } else {
      emailContent = {
        subject: subject || 'DuoHome Advisor',
        html: html || text || 'No content provided'
      }
    }

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: 'DuoHome Advisor <noreply@duohome.jp>',
      to: Array.isArray(to) ? to : [to],
      subject: emailContent.subject,
      html: emailContent.html,
      ...(text && { text }),
    })

    console.log('Email sent successfully:', emailResponse)

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: emailResponse.data?.id 
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      },
    )
  } catch (error: any) {
    console.error('Error sending email:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      },
    )
  }
})