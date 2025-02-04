import { Decimal } from '@prisma/client/runtime/library';

export interface Order {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  total_amount: number;
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
  payment_reminder: `Create a concise payment reminder that:
    • Greets {customerName} warmly
    • References order #{orderId} and the total amount
    • Provides our contact information for payment
    • Maintains a professional, friendly tone
    • Ends with a clear call to action`,

  installation_details: `Create a clear installation confirmation that:
    • Greets {customerName} warmly
    • Confirms installation details for order #{orderId}
    • Lists date and time clearly
    • Provides preparation guidelines
    • Includes our contact information
    • Keeps a helpful, professional tone`,

  shipping_update: `Create a brief shipping update that:
    • Greets {customerName} warmly
    • Updates on order #{orderId} status
    • Provides tracking details if available
    • Estimates delivery timeline
    • Includes our contact information
    • Maintains a clear, professional tone`,

  thank_you: `Create a warm thank you message that:
    • Greets {customerName} personally
    • Thanks them for order #{orderId}
    • Confirms their order details
    • Outlines next steps
    • Provides our contact information
    • Keeps a warm, appreciative tone`
};

export const getEmailPrompt = (templateId: string, order: Order): string => {
  const prompt = emailPrompts[templateId as keyof typeof emailPrompts];
  if (!prompt) {
    throw new Error('Invalid template ID');
  }

  return `${prompt}

Key Details:
• Customer: ${order.first_name} ${order.last_name}
• Order: #${order.id}
• Amount: $${order.total_amount.toString()}
${order.installation_date ? `• Installation: ${order.installation_date}` : ''}
${order.installation_time ? `• Time: ${order.installation_time}` : ''}

Contact Information:
• Phone: (310) 872-9781
• Email: help@wayofglory.com

Please create a professional email that reflects Way of Glory Media's brand voice: friendly, professional, and customer-focused.`;
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
          <div class="email-section">
            <h2>Payment Reminder</h2>
            <p>Dear ${order.first_name} ${order.last_name},</p>
            
            <p>This is a friendly reminder regarding your payment for order #${order.id}.</p>
            
            <div class="highlight-box">
              <p><strong>Amount Due:</strong> $${order.total_amount.toString()}</p>
              <p class="spacer"></p>
              <p><strong>Ready to Pay?</strong></p>
              <p>Contact our team to arrange your preferred payment method:</p>
              <p class="contact-info">
                Phone: (310) 872-9781<br>
                Email: help@wayofglory.com
              </p>
            </div>

            <p>Please reach out to complete your payment. If you've already paid, kindly disregard this reminder.</p>
            
            <a href="mailto:help@wayofglory.com" class="cta-button">Contact Us to Pay</a>
          </div>
        `)}
      `)
    },
    installation_confirmation: {
      subject: 'Your Installation Details - Way of Glory Media',
      html: sanitizeHtml(`
        ${baseStyle}
        ${createEmailWrapper(`
          <div class="email-section">
            <h2>Installation Details</h2>
            <p>Dear ${order.first_name} ${order.last_name},</p>
            
            <p>We're ready to install your order #${order.id}.</p>
            
            <div class="highlight-box">
              <p><strong>Date:</strong> ${order.installation_date}</p>
              <p><strong>Time:</strong> ${order.installation_time}</p>
              <p class="spacer"></p>
              <p><strong>Questions?</strong></p>
              <p class="contact-info">
                Phone: (310) 872-9781<br>
                Email: help@wayofglory.com
              </p>
            </div>

            <p>Our team will arrive during the scheduled window. We'll call you shortly before arrival.</p>
          </div>
        `)}
      `)
    },
    shipping_update: {
      subject: 'Shipping Update - Way of Glory Media',
      html: sanitizeHtml(`
        ${baseStyle}
        ${createEmailWrapper(`
          <div class="email-section">
            <h2>Shipping Update</h2>
            <p>Dear ${order.first_name} ${order.last_name},</p>
            
            <p>Great news! Your order #${order.id} is on its way.</p>
            
            <div class="highlight-box">
              <p><strong>Status:</strong> Shipped</p>
              <p><strong>Expected Delivery:</strong> 2-3 business days</p>
              <p class="spacer"></p>
              <p><strong>Need Updates?</strong></p>
              <p class="contact-info">
                Phone: (310) 872-9781<br>
                Email: help@wayofglory.com
              </p>
            </div>

            <p>We'll notify you once your order has been delivered.</p>
          </div>
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
            <p><strong>Total Amount:</strong> $${order.total_amount.toString()}</p>
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

export const formatEmailPreview = async (content: string, order: Order): Promise<string> => {
  const wrappedContent = wrapContent(content);
  const cleanContent = sanitizeHtml(wrappedContent);
  return sanitizeHtml(`
    ${baseStyle}
    ${createEmailWrapper(cleanContent)}
  `);
}; 