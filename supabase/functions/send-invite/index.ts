import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Resend } from 'https://esm.sh/resend@1.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('1. Request received');
    const text = await req.text();
    console.log('2. Request body:', text);
    
    const body = JSON.parse(text);
    console.log('3. Parsed body:', body);

    const { email, groupName, inviteUrl } = body;
    console.log('4. Email details:', { email, groupName, inviteUrl });

    console.log('5. Initializing Resend with API key');
    const resend = new Resend('re_M9aQyVsK_M93eVYBgjTEUVgAQFvZx3AM8');

    console.log('6. Preparing email content');
    const emailContent = {
      from: 'GiftSwitch <onboarding@resend.dev>',
      to: email,
      subject: `Join ${groupName}'s Secret Santa Exchange!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1>You're Invited! 🎁</h1>
          <p>You've been invited to join <strong>${groupName}</strong>'s Secret Santa gift exchange!</p>
          <p><a href="${inviteUrl}" style="background-color: #4CAF50; color: white; padding: 14px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Accept Invitation</a></p>
          <p style="color: #666; margin-top: 20px;">Or copy this link: ${inviteUrl}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">This invitation was sent via GiftSwitch</p>
        </div>
      `
    };
    
    console.log('7. Sending email with config:', emailContent);
    const { data, error: sendError } = await resend.emails.send(emailContent);

    if (sendError) {
      console.error('8. Resend error:', sendError);
      throw sendError;
    }

    console.log('9. Email sent successfully. Response:', data);
    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString(),
        stack: error.stack
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  }
}); 