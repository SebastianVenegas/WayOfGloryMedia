import { Decimal } from '@prisma/client/runtime/library'

interface Order {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  total_amount: Decimal;
  installation_date?: string | null;
  installation_time?: string | null;
  installation_address?: string | null;
  installation_city?: string | null;
  installation_state?: string | null;
  installation_zip?: string | null;
  shipping_address?: string | null;
  shipping_city?: string | null;
  shipping_state?: string | null;
  shipping_zip?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

const baseStyle = `
  <style>
    /* Reset styles for email clients */
    body, p, div, h1, h2, h3, h4, h5, h6 {
      margin: 0;
      padding: 0;
    }
    
    /* Base container */
    .email-container {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
      max-width: 600px;
      margin: 0 auto;
      padding: 32px;
      background-color: #ffffff;
      line-height: 1.6;
    }

    /* Header styles */
    .header {
      text-align: center;
      margin-bottom: 32px;
      padding-bottom: 32px;
      border-bottom: 1px solid #e5e7eb;
    }

    .logo {
      width: 150px;
      height: auto;
      margin-bottom: 16px;
    }

    .company-name {
      font-size: 24px;
      font-weight: 600;
      color: #111827;
      margin-bottom: 8px;
    }

    .company-tagline {
      color: #6b7280;
      font-size: 16px;
    }

    /* Content area */
    .content {
      background-color: #ffffff;
      border-radius: 12px;
      padding: 32px;
      margin-bottom: 32px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    /* Typography */
    p {
      color: #4b5563;
      font-size: 16px;
      line-height: 1.6;
      margin: 16px 0;
    }

    h1, h2, h3 {
      color: #111827;
      margin-bottom: 16px;
    }

    /* Details box */
    .details {
      background-color: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }

    .details p {
      margin: 8px 0;
    }

    /* Call to action button */
    .cta-button {
      display: inline-block;
      background-color: #2563eb;
      color: #ffffff !important;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 6px;
      font-weight: 500;
      margin: 16px 0;
      text-align: center;
    }

    /* Footer */
    .footer {
      text-align: center;
      color: #6b7280;
      font-size: 14px;
      margin-top: 32px;
      padding-top: 32px;
      border-top: 1px solid #e5e7eb;
    }

    .footer p {
      margin: 4px 0;
      color: #6b7280;
      font-size: 14px;
    }

    .contact-info {
      margin: 16px 0;
    }

    .contact-info a {
      color: #2563eb;
      text-decoration: none;
    }

    .social-links {
      margin-top: 16px;
    }

    .social-links a {
      color: #2563eb;
      text-decoration: none;
      margin: 0 8px;
    }

    /* Responsive design */
    @media screen and (max-width: 600px) {
      .email-container {
        padding: 16px;
      }
      
      .content {
        padding: 24px;
      }
    }
  </style>
`;

const createEmailWrapper = (content: string) => `
  <div class="email-container">
    <div class="header">
      <div class="company-name">Way of Glory Media</div>
      <div class="company-tagline">Professional Audio & Visual Solutions</div>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Way of Glory Media</p>
      <div class="contact-info">
        <p>
          <strong>Contact Us:</strong><br>
          <a href="tel:+13108729781">(310) 872-9781</a> |
          <a href="mailto:help@wayofglory.com">help@wayofglory.com</a>
        </p>
        <p>Los Angeles, California</p>
      </div>
      <div class="social-links">
        <a href="https://www.instagram.com/wayofglorymedia">Instagram</a> |
        <a href="https://www.facebook.com/wayofglorymedia">Facebook</a> |
        <a href="https://www.linkedin.com/company/wayofglorymedia">LinkedIn</a>
      </div>
      <p style="margin-top: 16px; font-size: 12px;">
        This email was sent to you as a customer of Way of Glory Media.
        Please do not reply to this email as it is automatically generated.
      </p>
    </div>
  </div>
`;

const sanitizeHtml = (html: string, isPWA = false) => {
  let sanitized = html
    .replace(/\n\s*/g, ' ')  // Replace newlines and following spaces with a single space
    .replace(/>\s+</g, '><')  // Remove spaces between tags
    .replace(/\s{2,}/g, ' ')  // Replace multiple spaces with a single space
    .trim();

  if (isPWA) {
    sanitized = sanitized
      .replace(/&nbsp;/g, ' ')
      .replace(/<p><br><\/p>/g, '<p></p>')
      .replace(/<p><\/p>/g, '<br>')
      .replace(/\r?\n|\r/g, '')
      .replace(/(<br\s*\/?>){3,}/gi, '<br><br>'); // Limit consecutive line breaks
  }

  return sanitized;
};

const wrapContent = (content: string, isPWA = false) => {
  // Don't wrap if content already has font-family style
  if (content.includes('style="font-family:')) {
    return isPWA ? sanitizeHtml(content, true) : content;
  }

  const wrapped = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6;">
      ${content}
    </div>
  `.trim();

  return isPWA ? sanitizeHtml(wrapped, true) : wrapped;
};

const emailPrompts = {
  payment_reminder: `Write a professional payment reminder email that:
    - Addresses the customer by name
    - Mentions the order number and total amount due
    - Directs them to contact us for payment arrangements
    - Has a polite but firm tone
    - Includes contact information
    - Maintains Way of Glory Media's professional image`,

  installation_details: `Write a detailed installation confirmation email that:
    - Addresses the customer by name
    - Confirms the installation date and time
    - Provides preparation instructions
    - Includes contact information for questions
    - Maintains a helpful and professional tone`,

  shipping_update: `Write a shipping status update email that:
    - Addresses the customer by name
    - Provides current shipping status
    - Includes tracking information if available
    - Estimates delivery timeframe
    - Includes contact information for questions
    - Maintains an informative and professional tone`,

  thank_you: `Write a thank you email that:
    - Addresses the customer by name
    - Expresses genuine appreciation for their business
    - Summarizes their order details
    - Provides next steps or what to expect
    - Includes contact information
    - Maintains a warm and professional tone`
};

export const getEmailPrompt = (templateId: string, order: Order): string => {
  const prompt = emailPrompts[templateId as keyof typeof emailPrompts];
  if (!prompt) {
    throw new Error('Invalid template ID');
  }

  // Format the total amount to 2 decimal places
  const formattedAmount = order.total_amount.toFixed(2);

  // Add order-specific context to the prompt
  return `${prompt}

Order Context:
- Customer Name: ${order.first_name} ${order.last_name}
- Order ID: ${order.id}
- Total Amount: $${formattedAmount}
${order.installation_date ? `- Installation Date: ${order.installation_date}` : ''}
${order.installation_time ? `- Installation Time: ${order.installation_time}` : ''}

Please generate a professional email that follows Way of Glory Media's brand voice: friendly, professional, and customer-focused.`;
};

export const getEmailTemplate = (
  templateId: string, 
  order: Order, 
  customEmail?: { subject: string; html: string },
  isPWA = false
) => {
  // For custom emails, wrap the content in our standard template
  if (templateId === 'custom' && customEmail) {
    const wrappedHtml = wrapContent(customEmail.html, isPWA);
    const cleanHtml = sanitizeHtml(wrappedHtml, isPWA);
    return {
      subject: customEmail.subject,
      html: `
        ${baseStyle}
        ${createEmailWrapper(cleanHtml)}
      `.trim()
    };
  }

  const templates: { [key: string]: { subject: string; html: string } } = {
    payment_reminder: {
      subject: 'Payment Reminder for Your Way of Glory Order',
      html: sanitizeHtml(`
        ${baseStyle}
        ${createEmailWrapper(`
          <h2>Payment Reminder</h2>
          <p>Dear ${order.first_name} ${order.last_name},</p>
          <p>This is a friendly reminder about your pending payment for order #${order.id}.</p>
          <div class="details">
            <p><strong>Total Amount Due:</strong> $${order.total_amount.toFixed(2)}</p>
            <p><strong>Payment Methods:</strong></p>
            <p>We offer several convenient payment options. Please contact our team to arrange your preferred payment method:</p>
            <p>
              <strong>Contact Us:</strong><br>
              Phone: (310) 872-9781<br>
              Email: help@wayofglory.com
            </p>
          </div>
          <p>Please reach out to complete your payment and proceed with your order. If you've already made the payment, please disregard this reminder.</p>
          <a href="#" class="cta-button">Contact Us to Complete Payment</a>
        `)}
      `)
    },
    installation_confirmation: {
      subject: 'Installation Details for Your Way of Glory Order',
      html: sanitizeHtml(`
        ${baseStyle}
        ${createEmailWrapper(`
          <h2>Installation Details</h2>
          <p>Dear ${order.first_name} ${order.last_name},</p>
          <p>Your installation for order #${order.id} has been scheduled.</p>
          <div class="details">
            <p><strong>Date & Time:</strong><br>
              ${order.installation_date} at ${order.installation_time}
            </p>
            <p><strong>Need to make changes?</strong><br>
              Contact our team:<br>
              Phone: (310) 872-9781<br>
              Email: help@wayofglory.com
            </p>
          </div>
          <p>Our installation team will arrive within the scheduled time window. Please ensure someone is available to provide access to the installation area.</p>
        `)}
      `)
    },
    shipping_update: {
      subject: 'Shipping Update for Your Way of Glory Order',
      html: sanitizeHtml(`
        ${baseStyle}
        ${createEmailWrapper(`
          <h2>Shipping Update</h2>
          <p>Dear ${order.first_name} ${order.last_name},</p>
          <p>Great news! Your order #${order.id} has been shipped and is on its way to you.</p>
          <div class="details">
            <p><strong>Have questions about your delivery?</strong><br>
              Contact our team:<br>
              Phone: (310) 872-9781<br>
              Email: help@wayofglory.com
            </p>
          </div>
          <p>We'll notify you once your order has been delivered. If you have any special delivery instructions, please contact us.</p>
        `)}
      `)
    },
    thank_you: {
      subject: 'Thank You for Your Way of Glory Order',
      html: sanitizeHtml(`
        ${baseStyle}
        ${createEmailWrapper(`
          <h2>Thank You!</h2>
          <p>Dear ${order.first_name} ${order.last_name},</p>
          <p>Thank you for choosing Way of Glory. We truly appreciate your business and trust in our services.</p>
          <div class="details">
            <p><strong>Order Number:</strong> #${order.id}</p>
            <p><strong>Total Amount:</strong> $${order.total_amount.toFixed(2)}</p>
          </div>
          <p>We hope you're completely satisfied with your purchase. If you have any questions or need assistance, please don't hesitate to reach out.</p>
        `)}
      `)
    }
  };

  const template = templates[templateId];
  if (!template) {
    throw new Error(`Invalid template ID: ${templateId}`);
  }

  return template;
};

export const formatEmailPreview = async (html: string, order: Order) => {
  // Replace any remaining variables in the HTML
  const processedHtml = html
    .replace(/\{customerName\}/g, `${order.first_name} ${order.last_name}`)
    .replace(/\{orderId\}/g, `${order.id}`)
    .replace(/\{totalAmount\}/g, `$${order.total_amount.toFixed(2)}`)
    .replace(/\{installationDate\}/g, order.installation_date || 'Not scheduled')
    .replace(/\{installationTime\}/g, order.installation_time || 'Not scheduled');

  return processedHtml;
}; 