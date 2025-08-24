import { supabase } from "@/integrations/supabase/client";

interface SendEmailOptions {
  to: string | string[];
  subject?: string;
  html?: string;
  text?: string;
  template?: 'expert-invite' | 'contact-expert' | 'welcome' | 'feedback';
  templateData?: Record<string, any>;
}

export const sendEmail = async (options: SendEmailOptions) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: options
    });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
};

// Helper functions for common email types
export const sendExpertInviteEmail = async (expertData: {
  name: string;
  email: string;
  password: string;
  loginUrl?: string;
}) => {
  return sendEmail({
    to: expertData.email,
    template: 'expert-invite',
    templateData: expertData
  });
};

export const sendContactExpertEmail = async (contactData: {
  expertName: string;
  expertEmail: string;
  userName: string;
  userEmail: string;
  subject: string;
  message: string;
}) => {
  return sendEmail({
    to: contactData.expertEmail,
    template: 'contact-expert',
    templateData: contactData
  });
};


export const sendFeedbackEmail = async (feedbackData: {
  userName: string;
  userEmail: string;
  feedbackType: string;
  message: string;
}) => {
  return sendEmail({
    to: 'support@aisum.ai', // Replace with your support email
    template: 'feedback',
    templateData: feedbackData
  });
};