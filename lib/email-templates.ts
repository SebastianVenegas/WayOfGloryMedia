export interface Order {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  organization: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_zip: string;
  shipping_instructions: string;
  installation_address: string;
  installation_city: string;
  installation_state: string;
  installation_zip: string;
  installation_date: string;
  installation_time: string;
  access_instructions: string;
  contact_onsite: string;
  contact_onsite_phone: string;
  payment_method: string;
  total_amount: number | string;
  total_cost: number | string;
  total_profit: number | string;
  installation_price: number | string;
  signature_url: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'delayed';
  created_at: string;
  order_items?: any[];
  notes?: string;
}

const baseStyle = `
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
      line-height: 1.4;
      color: #333;
      font-size: 13px;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      padding: 15px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 1px solid #eee;
    }
    .order-info {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 10px;
      margin-bottom: 15px;
    }
    .info-box {
      background: #f8f9fa;
      padding: 8px 12px;
      border-radius: 4px;
    }
    .info-box-label {
      color: #666;
      font-size: 12px;
      margin-bottom: 2px;
    }
    .info-box-value {
      color: #333;
      font-weight: 500;
    }
    .content {
      color: #333;
      margin-bottom: 15px;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 10px;
      border-top: 1px solid #eee;
      font-size: 12px;
      color: #666;
    }
    .contact-links a {
      color: #0066cc;
      text-decoration: none;
      margin: 0 5px;
    }
  </style>
`;

const createEmailWrapper = (content: string) => `
  <div class="email-container">
    <div class="header">
      <div>
        <div style="color: #666; font-size: 12px;">ORDER CONFIRMATION</div>
        <div style="color: #333; font-weight: 600; font-size: 15px;">#{orderId}</div>
      </div>
      <div style="text-align: right;">
        <div style="color: #666; font-size: 12px;">{orderDate}</div>
        <div style="color: #333; font-weight: 600; font-size: 15px;">{totalAmount}</div>
      </div>
    </div>

    <div class="content">
      <div style="margin-bottom: 10px;">
        <span style="color: #666;">Dear</span> {firstName} {lastName},
      </div>
      ${content}
    </div>

    <div class="order-info">
      <div class="info-box">
        <div class="info-box-label">Order Status</div>
        <div class="info-box-value">{status}</div>
      </div>
      <div class="info-box">
        <div class="info-box-label">Payment Method</div>
        <div class="info-box-value">{paymentMethod}</div>
      </div>
      {installationDate}
    </div>

    <div class="footer">
      <span>Way of Glory</span>
      <div class="contact-links">
        <a href="tel:+13108729781">(310) 872-9781</a>
          <a href="mailto:help@wayofglory.com">help@wayofglory.com</a>
        <a href="https://www.wayofglory.com">wayofglory.com</a>
      </div>
    </div>
  </div>
`;

const getInstallationTemplate = (date: string, time: string) => `
  <div class="info-box">
    <div class="info-box-label">Installation</div>
    <div class="info-box-value">${date} ${time}</div>
  </div>
`;

const sanitizeHtml = (html: string, isPWA = false) => {
  if (typeof html !== 'string') return '';
  if (!html) return '';
  let sanitized = html
    .replace(/\n\s*/g, ' ')  // Replace newlines and following spaces with a single space
    .replace(/>\s+</g, '><')  // Remove spaces between tags
    .replace(/\s{2,}/g, ' ')  // Replace multiple spaces with a single space
    .replace(/[^\x20-\x7E\s]/g, '') // Remove non-printable characters
    .trim();

  if (isPWA) {
    sanitized = sanitized
      .replace(/&nbsp;/g, ' ')
      .replace(/<p><br><\/p>/g, '<p></p>')
      .replace(/<p><\/p>/g, '<br>')
      .replace(/\r?\n|\r/g, '')
      .replace(/(<br\s*\/?>(\s*)?){3,}/gi, '<br><br>'); // Limit consecutive line breaks
  }

  return sanitized;
};

const wrapContent = (content: string, isPWA = false) => {
  if (typeof content !== 'string' || !content) return '';

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
    - Maintains a warm and professional tone`,

  default_template: `Dear {customerName},

Thank you for your order #{orderId}. Please review the details below:

Order Information:
• Order Number: #{orderId}
• Order Date: {orderDate}
• Total Amount: {orderTotal}
• Status: {orderStatus}

Ordered Items:
{orderItems}
{installationInfo}

Need Assistance:
If you have any questions, please contact us at:
• Phone: (310) 872-9781
• Email: help@wayofglory.com
• Hours: Monday - Friday, 9:00 AM - 6:00 PM PST

Best regards,
Way of Glory Media Team
Professional Audio & Visual Solutions`
};

export const getEmailPrompt = (templateId: string, order: Order): string => {
  // If templateId is 'default', return the default template with variables
  if (templateId === 'default') {
    return emailPrompts.default_template
      .replace('{customerName}', `${order.first_name} ${order.last_name}`)
      .replace('{orderId}', `${order.id}`)
      .replace('{orderDate}', new Date(order.created_at).toLocaleDateString())
      .replace('{orderTotal}', `$${Number(order.total_amount || 0).toFixed(2)}`)
      .replace('{orderItems}', order.order_items?.map((item: any) => 
        `• ${item.product.title} (Quantity: ${item.quantity})`
      ).join('\n') || 'No items')
      .replace('{orderStatus}', `Your order is currently ${order.status}. ${
        order.status === 'pending' ? 'We will process it shortly.' :
        order.status === 'confirmed' ? 'We are preparing your order.' :
        order.status === 'completed' ? 'Thank you for your business.' :
        order.status === 'cancelled' ? 'Please contact us if you have any questions.' :
        'Please contact us if you need any updates.'
      }`)
      .replace('{installationInfo}', order.installation_date ? 
        `Installation is scheduled for ${order.installation_date}${order.installation_time ? ` at ${order.installation_time}` : ''}.` :
        'We will contact you to schedule any necessary installation or setup.')
      .replace('{actionItems}', order.status === 'pending' ? 
        'Please review the order details and let us know if any adjustments are needed.' :
        order.status === 'confirmed' ? 
        'No action is required from you at this time.' :
        order.status === 'completed' ? 
        'Please let us know if you need any assistance with your products or services.' :
        'Please contact us if you have any questions or concerns.')
      .replace('{additionalNotes}', order.notes ? `Additional Notes: ${order.notes}` : '')
  }

  const prompt = emailPrompts[templateId as keyof typeof emailPrompts];
  if (!prompt) {
    throw new Error('Invalid template ID');
  }

  // Add order-specific context to the prompt
  return `${prompt}

Order Context:
- Customer Name: ${order.first_name} ${order.last_name}
- Order ID: ${order.id}
- Total Amount: $${order.total_amount}
${order.installation_date ? `- Installation Date: ${order.installation_date}` : ''}
${order.installation_time ? `- Installation Time: ${order.installation_time}` : ''}
${order.installation_address ? `- Installation Address: ${order.installation_address}, ${order.installation_city}, ${order.installation_state} ${order.installation_zip}` : ''}
${order.shipping_address ? `- Shipping Address: ${order.shipping_address}, ${order.shipping_city}, ${order.shipping_state} ${order.shipping_zip}` : ''}

Please generate a professional email that follows Way of Glory Media's brand voice: friendly, professional, and customer-focused.`;
};

export const getEmailTemplate = (
  templateId: string, 
  order: Order, 
  customEmail?: { subject: string; html: string },
  isPWA = false
): { subject: string; html: string } => {
  if (templateId === 'custom' && (!customEmail?.subject || !customEmail?.html)) {
    throw new Error('Custom email requires both subject and HTML content');
  }
  try {
    let finalHtml = '';
    const subject = `Order #${order.id} - Way of Glory Media`;

    // For custom emails, wrap the content in our standard template
    if (templateId === 'custom' && customEmail?.html) {
      const wrappedHtml = wrapContent(customEmail.html, isPWA);
      const cleanHtml = sanitizeHtml(wrappedHtml, isPWA);
      const processedHtml = processEmailTemplate(createEmailWrapper(cleanHtml), order);
      finalHtml = `${baseStyle}${processedHtml}`;
    } else {
      // Handle default template
      const content = getEmailPrompt(templateId, order);
      const wrappedContent = wrapContent(content, isPWA);
      const processedHtml = processEmailTemplate(createEmailWrapper(wrappedContent), order);
      finalHtml = `${baseStyle}${processedHtml}`;
    }

    // Ensure the HTML is properly escaped and formatted
    finalHtml = sanitizeHtml(finalHtml, isPWA);

    return {
      subject: customEmail?.subject || subject,
      html: finalHtml
    };
  } catch (error) {
    console.error('Error generating email template:', error);
    // Return a basic fallback template
    const fallbackHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          ${baseStyle}
        </head>
        <body>
          <div style="padding: 20px; text-align: center;">
            <h1>Order #${order.id}</h1>
            <p>Thank you for your order. We will be in touch shortly.</p>
          </div>
        </body>
      </html>
    `;

    return {
      subject: `Order #${order.id} - Way of Glory Media`,
      html: sanitizeHtml(fallbackHtml)
    };
  }
};

export const formatEmailPreview = async (content: string): Promise<string> => {
  try {
    const cleanContent = sanitizeHtml(wrapContent(content));
    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    ${baseStyle}
  </head>
  <body>
    ${createEmailWrapper(cleanContent)}
  </body>
</html>`;
  } catch (error) {
    console.error('Error formatting email preview, returning unformatted content');
    return content;
  }
};

export const processEmailTemplate = (template: string, order: Order) => {
  let processed = template
    .replace(/{firstName}/g, order.first_name)
    .replace(/{lastName}/g, order.last_name)
    .replace(/#{orderId}/g, `#${order.id}`)
    .replace(/{orderDate}/g, new Date(order.created_at).toLocaleDateString())
    .replace(/{totalAmount}/g, `$${Number(order.total_amount).toFixed(2)}`)
    .replace(/{status}/g, order.status)
    .replace(/{paymentMethod}/g, order.payment_method || 'Not specified');

  // Handle installation date separately
  if (order.installation_date) {
    const installTemplate = getInstallationTemplate(
      order.installation_date,
      order.installation_time || ''
    );
    processed = processed.replace(/{installationDate}/g, installTemplate);
  } else {
    processed = processed.replace(/{installationDate}/g, '');
  }

  return processed;
}; 