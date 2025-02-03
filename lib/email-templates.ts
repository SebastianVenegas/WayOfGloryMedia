interface Order {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  total_amount: number | string;
  installation_date?: string;
  installation_time?: string;
  installation_address?: string;
  installation_city?: string;
  installation_state?: string;
  installation_zip?: string;
  shipping_address?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_zip?: string;
}

const baseStyle = `
  <style>
    .email-container {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
      max-width: 600px;
      margin: 0 auto;
      padding: 32px;
      background-color: #ffffff;
    }
    .content {
      background-color: #ffffff;
      border-radius: 12px;
      padding: 32px;
      margin-bottom: 32px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    p {
      color: #4b5563;
      font-size: 16px;
      line-height: 1.6;
      margin: 16px 0;
    }
    .footer {
      text-align: center;
      color: #6b7280;
      font-size: 14px;
      margin-top: 32px;
      padding-top: 32px;
      border-top: 1px solid #e5e7eb;
    }
  </style>
`;

export const getEmailTemplate = (templateId: string, order: Order, customEmail?: { subject: string; html: string }) => {
  // For custom emails, wrap the content in our standard template
  if (templateId === 'custom' && customEmail) {
    return {
      subject: customEmail.subject,
      html: `
        ${baseStyle}
        <div class="email-container">
          <div class="content">
            ${customEmail.html}
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Way of Glory</p>
            <p>
              <a href="tel:+13108729781" style="color: #2563eb; text-decoration: none;">(310) 872-9781</a> |
              <a href="mailto:help@wayofglory.com" style="color: #2563eb; text-decoration: none;">help@wayofglory.com</a>
            </p>
          </div>
        </div>
      `
    };
  }

  const templates: { [key: string]: { subject: string; html: string } } = {
    payment_reminder: {
      subject: 'Payment Reminder for Your Way of Glory Order',
      html: `
        ${baseStyle}
        <div class="email-container">
          <div class="content">
            <p>Dear ${order.first_name} ${order.last_name},</p>
            <p>This is a friendly reminder about your pending payment for order #${order.id}.</p>
            <div class="details">
              <p style="margin: 0;"><strong>Total Amount Due:</strong> $${order.total_amount}</p>
            </div>
            <p>Please complete your payment to proceed with your order. If you've already made the payment, please disregard this reminder.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Way of Glory</p>
            <p>
              <a href="tel:+13108729781" style="color: #2563eb; text-decoration: none;">(310) 872-9781</a> |
              <a href="mailto:help@wayofglory.com" style="color: #2563eb; text-decoration: none;">help@wayofglory.com</a>
            </p>
          </div>
        </div>
      `
    },
    installation_confirmation: {
      subject: 'Installation Details for Your Way of Glory Order',
      html: `
        ${baseStyle}
        <div class="email-container">
          <div class="content">
            <p>Dear ${order.first_name} ${order.last_name},</p>
            <p>Your installation for order #${order.id} has been scheduled. Here are the details:</p>
            <div class="details">
              <p style="margin: 0 0 8px 0;"><strong>Installation Address:</strong><br>
                ${order.installation_address}, ${order.installation_city}, ${order.installation_state} ${order.installation_zip}
              </p>
              <p style="margin: 0 0 8px 0;"><strong>Date & Time:</strong><br>
                ${order.installation_date} at ${order.installation_time}
              </p>
            </div>
            <p>Our installation team will arrive within the scheduled time window. Please ensure someone is available to provide access to the installation area.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Way of Glory</p>
            <p>
              <a href="tel:+13108729781" style="color: #2563eb; text-decoration: none;">(310) 872-9781</a> |
              <a href="mailto:help@wayofglory.com" style="color: #2563eb; text-decoration: none;">help@wayofglory.com</a>
            </p>
          </div>
        </div>
      `
    },
    shipping_update: {
      subject: 'Shipping Update for Your Way of Glory Order',
      html: `
        ${baseStyle}
        <div class="email-container">
          <div class="content">
            <p>Dear ${order.first_name} ${order.last_name},</p>
            <p>Great news! Your order #${order.id} has been shipped and is on its way to you.</p>
            <div class="details">
              <p style="margin: 0;"><strong>Delivery Address:</strong><br>
                ${order.shipping_address}, ${order.shipping_city}, ${order.shipping_state} ${order.shipping_zip}
              </p>
            </div>
            <p>We'll notify you once your order has been delivered. If you have any special delivery instructions, please contact us.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Way of Glory</p>
            <p>
              <a href="tel:+13108729781" style="color: #2563eb; text-decoration: none;">(310) 872-9781</a> |
              <a href="mailto:help@wayofglory.com" style="color: #2563eb; text-decoration: none;">help@wayofglory.com</a>
            </p>
          </div>
        </div>
      `
    },
    thank_you: {
      subject: 'Thank You for Your Way of Glory Order',
      html: `
        ${baseStyle}
        <div class="email-container">
          <div class="content">
            <p>Dear ${order.first_name} ${order.last_name},</p>
            <p>Thank you for choosing Way of Glory. We truly appreciate your business and trust in our services.</p>
            <div class="details">
              <p style="margin: 0 0 8px 0;"><strong>Order Number:</strong> #${order.id}</p>
              <p style="margin: 0;"><strong>Total Amount:</strong> $${order.total_amount}</p>
            </div>
            <p>We hope you're completely satisfied with your purchase. If you have any questions or need assistance, please don't hesitate to reach out.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Way of Glory</p>
            <p>
              <a href="tel:+13108729781" style="color: #2563eb; text-decoration: none;">(310) 872-9781</a> |
              <a href="mailto:help@wayofglory.com" style="color: #2563eb; text-decoration: none;">help@wayofglory.com</a>
            </p>
          </div>
        </div>
      `
    }
  };

  return templates[templateId];
};

export const formatEmailPreview = async (content: string, order: Order): Promise<string> => {
  return `
    ${baseStyle}
    <div class="email-container">
      <div class="content">
        ${content}
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} Way of Glory</p>
        <p>
          <a href="tel:+13108729781" style="color: #2563eb; text-decoration: none;">(310) 872-9781</a> |
          <a href="mailto:help@wayofglory.com" style="color: #2563eb; text-decoration: none;">help@wayofglory.com</a>
        </p>
      </div>
    </div>
  `;
}; 