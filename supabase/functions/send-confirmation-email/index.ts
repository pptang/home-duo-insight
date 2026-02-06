import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const generateEmailHTML = (
  confirmUrl: string,
  userEmail: string
) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm your AiSumai (愛住) account</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #6A7FDB 0%, #5A6DCB 100%); padding: 40px 30px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">AiSumai (愛住)</h1>
      <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px;">AI-Powered Home Comparison Platform</p>
    </div>
    
    <!-- Content -->
    <div style="padding: 40px 30px;">
      <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">Welcome to AiSumai (愛住)!</h2>
      
      <p style="color: #4b5563; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">Thank you for signing up for our AI-powered property comparison platform.</p>
      
      <p style="color: #4b5563; margin: 0 0 30px 0; font-size: 16px; line-height: 1.6;">Please click the button below to confirm your email address:</p>
      
      <!-- CTA Button -->
      <div style="text-align: center; margin: 40px 0;">
        <a href="${confirmUrl}" 
           style="display: inline-block; background: linear-gradient(135deg, #6A7FDB 0%, #5A6DCB 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; transition: all 0.3s ease;">
          Confirm Email
        </a>
      </div>
      
      <!-- Alternative Link -->
      <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 30px 0;">
        <p style="color: #6b7280; margin: 0 0 10px 0; font-size: 14px;">Or copy and paste this link:</p>
        <p style="color: #3b82f6; margin: 0; font-size: 14px; word-break: break-all;">${confirmUrl}</p>
      </div>
      
      <p style="color: #6b7280; margin: 30px 0 0 0; font-size: 14px; line-height: 1.6;">If you didn't request this email, you can safely ignore it.</p>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f9fafb; padding: 30px; border-top: 1px solid #e5e7eb; text-align: center;">
      <p style="color: #6b7280; margin: 0; font-size: 14px;">Best regards,<br>The AiSumai (愛住) Team</p>
    </div>
    
  </div>
</body>
</html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const hookSecret = Deno.env
      .get("SEND_EMAIL_HOOK_SECRET")
      ?.replace("v1,whsec_", "");
    if (!hookSecret) {
      throw new Error("Webhook secret not configured");
    }

    // Get raw body for webhook verification
    const rawBody = await req.text();
    const headers = Object.fromEntries(req.headers.entries());
    console.log("Received webhook payload", { rawBody, headers });

    // Verify webhook signature
    const wh = new Webhook(hookSecret);
    const { user, email_data } = wh.verify(rawBody, headers) as {
      user: {
        email: string;
        user_metadata: {
          locale?: string;
        };
      };
      email_data: {
        token: string;
        token_hash: string;
        redirect_to: string;
        email_action_type: string;
        site_url: string;
        token_new?: string;
        token_hash_new?: string;
      };
    };

    console.log("Verified webhook data:", { user, email_data });

    const email = user.email;

    if (!email || !email_data.token_hash) {
      return new Response(
        JSON.stringify({ error: "Email and token are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create confirmation URL
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const confirmUrl = `${supabaseUrl}/auth/v1/verify?token=${email_data.token_hash}&type=${email_data.email_action_type}&redirect_to=${email_data.redirect_to}`;

    // Generate email content
    const emailHTML = generateEmailHTML(confirmUrl, email);

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "AiSumai (愛住) <noreply@aisum.ai>",
      to: [email],
      subject: "Confirm your AiSumai (愛住) account",
      html: emailHTML,
    });

    console.log("Confirmation email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, messageId: emailResponse.data?.id }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-confirmation-email function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);