import { Resend } from 'resend';

// Lazy initialize Resend client
let resend: Resend | null = null;

const getResendClient = () => {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
};

export interface EmailNotificationParams {
  to: string;
  subject: string;
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
  priority?: 'critical' | 'high' | 'medium' | 'low';
}

/**
 * Send notification email using Resend
 * Free tier: 100 emails/day, 3,000/month
 */
export async function sendNotificationEmail(params: EmailNotificationParams) {
  const resendClient = getResendClient();

  if (!resendClient) {
    console.warn('Email service skipped: RESEND_API_KEY not configured');
    return { success: false, error: new Error('Email service not configured') };
  }

  const { to, subject, title, message, actionUrl, actionText = 'View Details', priority = 'medium' } = params;

  // Priority color mapping
  const priorityColors = {
    critical: '#dc2626', // red-600
    high: '#ea580c',     // orange-600
    medium: '#2563eb',   // blue-600
    low: '#64748b'       // slate-500
  };

  const priorityBadges = {
    critical: '🚨 Urgent',
    high: '⚠️ Important',
    medium: 'ℹ️ Update',
    low: '📬 Info'
  };

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                عطر الجنّة
              </h1>
              <p style="margin: 8px 0 0; color: #e0e7ff; font-size: 14px;">
                Attar Al Jannah
              </p>
            </td>
          </tr>
          
          <!-- Priority Badge -->
          ${priority !== 'low' ? `
          <tr>
            <td style="padding: 20px 40px 0;">
              <div style="display: inline-block; padding: 6px 12px; background-color: ${priorityColors[priority]}; color: #ffffff; border-radius: 4px; font-size: 12px; font-weight: 600;">
                ${priorityBadges[priority]}
              </div>
            </td>
          </tr>
          ` : ''}
          
          <!-- Content -->
          <tr>
            <td style="padding: ${priority !== 'low' ? '20px' : '40px'} 40px;">
              <h2 style="margin: 0 0 16px; color: #111827; font-size: 24px; font-weight: 600;">
                ${title}
              </h2>
              <p style="margin: 0; color: #4b5563; font-size: 16px; line-height: 1.6; white-space: pre-line;">
                ${message}
              </p>
            </td>
          </tr>
          
          <!-- Action Button -->
          ${actionUrl ? `
          <tr>
            <td style="padding: 0 40px 40px;">
              <table role="presentation" style="margin: 0;">
                <tr>
                  <td style="border-radius: 6px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                    <a href="${actionUrl}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px;">
                      ${actionText}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ` : '<tr><td style="height: 20px;"></td></tr>'}
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; border-top: 1px solid #e5e7eb; background-color: #f9fafb; border-radius: 0 0 8px 8px;">
              <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">
                This email was sent by Attar Al Jannah notification system.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                If you have questions, please contact us or visit our website.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  try {
    const { data, error } = await resendClient.emails.send({
      from: 'Attar Al Jannah <notifications@attaraljannah.com>',
      to,
      subject,
      html,
    });

    if (error) {
      console.error('Resend email error:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Resend email exception:', error);
    return { success: false, error };
  }
}

/**
 * Send welcome email to new customers
 */
export async function sendWelcomeEmail(to: string, name: string) {
  return sendNotificationEmail({
    to,
    subject: 'Welcome to Attar Al Jannah! 🎉',
    title: `Welcome, ${name}!`,
    message: `Thank you for choosing Attar Al Jannah. We're excited to serve you with the finest fragrances.\n\nYour account has been created successfully. You can now place orders and track your deliveries easily.`,
    actionUrl: 'https://attaraljannah.com/order',
    actionText: 'Start Shopping',
    priority: 'medium'
  });
}

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmationEmail(
  to: string,
  orderId: string,
  customerName: string,
  quantity: number,
  totalPrice: number
) {
  return sendNotificationEmail({
    to,
    subject: `Order Confirmed - #${orderId.slice(0, 8)}`,
    title: 'Order Confirmed! 🎉',
    message: `Hi ${customerName},\n\nYour order has been confirmed!\n\nOrder ID: #${orderId.slice(0, 8)}\nQuantity: ${quantity} bottles\nTotal: ₹${totalPrice}\n\nWe'll notify you once your order is out for delivery.`,
    actionUrl: `https://attaraljannah.com/track/${orderId}`,
    actionText: 'Track Order',
    priority: 'medium'
  });
}

/**
 * Send payment reminder email
 */
export async function sendPaymentReminderEmail(
  to: string,
  orderId: string,
  amount: number
) {
  return sendNotificationEmail({
    to,
    subject: `Pending - Order #${orderId.slice(0, 8)}`,
    title: 'Payment Action Required ⚠️',
    message: `Your order #${orderId.slice(0, 8)} is awaiting payment.\n\nAmount Due: ₹${amount}\n\nPlease complete your payment to process your order.`,
    actionUrl: `https://attaraljannah.com/track/${orderId}`,
    actionText: 'Complete Payment',
    priority: 'high'
  });
}

/**
 * Send delivery notification email
 */
export async function sendDeliveryNotificationEmail(
  to: string,
  orderId: string,
  volunteerName: string,
  volunteerPhone: string
) {
  return sendNotificationEmail({
    to,
    subject: `Out for Delivery - Order #${orderId.slice(0, 8)}`,
    title: 'Your Order is On the Way! 📦',
    message: `Great news! Your order #${orderId.slice(0, 8)} is out for delivery.\n\nDelivery Volunteer: ${volunteerName}\nContact: ${volunteerPhone}\n\nThey'll reach you soon!`,
    actionUrl: `https://attaraljannah.com/track/${orderId}`,
    actionText: 'Track Delivery',
    priority: 'high'
  });
}

/**
 * Check if email service is configured
 */
export function isEmailServiceConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}
