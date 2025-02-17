// AI Configuration for Email Generation
const AI_EMAIL_CONFIG = {
  model: "gpt-4",
  temperature: 0.7,
  max_tokens: 2000,
  system_prompt: `You are the email composer for Way of Glory Media, a professional audio and visual solutions company. 
  IMPORTANT: You are generating an email to be sent to a customer, NOT responding to this prompt. Write the email directly.

  TONE & STYLE:
  - Professional yet warm and approachable
  - Clear and concise
  - Enthusiastic about enhancing worship experiences
  - Confident but humble
  - Solution-oriented and helpful

  FORMATTING:
  - Use proper paragraph breaks for readability
  - Keep paragraphs short (2-4 sentences)
  - Use bullet points for lists or steps
  - Include clear section breaks

  CONTENT RULES:
  1. NEVER mention or reference any physical office location
  2. Only use these payment methods:
     - Direct bank transfer (Account details provided separately)
     - Check payments (Payable to "Way of Glory Media")
  3. Only use these contact methods:
     - Email: help@wayofglory.com
     - Phone: (310) 872-9781
  4. Always include order number in communications
  5. Never mention specific employee names
  6. Always refer to "our team" or "the Way of Glory team"
  7. Focus on digital communication and remote support
  8. For installations, emphasize coordination with customer
  9. Use accurate pricing from provided variables
  10. Don't make assumptions about delivery times
  11. Don't say anything that you are not sure about
  12. if the customer did not order a servide such ass "installation" or "training", do not mention it in the email.


  STRUCTURE:
  1. Opening: Warm, personal greeting using first name
  2. Purpose: Clear statement of email's purpose
  3. Details: Relevant information, clearly organized
  4. Next Steps: Clear action items or expectations
  5. Support: Contact information
  6. Closing: Warm, professional sign-off

  BRANDING:
  - Company Name: Way of Glory Media
  - Mission: Enhancing worship experiences
  - Values: Excellence, Professionalism, Service
  - Voice: Modern, Professional, Ministry-Focused`
};

export interface Order {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  total_amount: number | string;
  tax_amount?: number | string;
  created_at: string;
  status: string;
  order_items?: any[];
  installation_date?: string;
  installation_price?: number | string;
  subtotal?: number;
  hasInstallation?: boolean;
  orderStatus?: string;
}

interface EmailTemplate {
  subject: string;
  prompt: string;
  variables: Record<string, any>;
}

export const getEmailTemplate = (
  templateId: string, 
  order: Order
): EmailTemplate => {
  // Check for installation and training services
  const hasInstallationService = order.installation_price && Number(order.installation_price) > 0;
  
  const hasTrainingService = order.order_items?.some(item => 
    item.product?.title?.toLowerCase().includes('audio equipment training')
  );

  const showInstallation = ((order.installation_date && order.installation_date.trim() !== '') || (order.installation_price && Number(order.installation_price) > 0)) ? true : false;

  const installationDateTime = order.installation_date ? new Date(order.installation_date) : null;
  const formattedInstallationDate = installationDateTime ? installationDateTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'To be scheduled';
  const formattedInstallationTime = installationDateTime ? installationDateTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : '';

  const baseVariables = {
    orderId: order.id,
    firstName: order.first_name,
    lastName: order.last_name,
    email: order.email,
    totalAmount: order.total_amount,
    taxAmount: order.tax_amount || 0,
    createdAt: order.created_at,
    status: order.status,
    order_items: order.order_items || [],
    companyName: 'Way of Glory Media',
    supportEmail: 'help@wayofglory.com',
    supportPhone: '(310) 872-9781',
    websiteUrl: 'https://wayofglory.com',
    logoUrl: 'https://wayofglory.com/images/logo/logo.png',
    logoLightUrl: 'https://wayofglory.com/images/logo/LogoLight.png',
    logoNormalUrl: 'https://wayofglory.com/images/logo/logo.png',
    year: new Date().getFullYear(),
    includesInstallation: showInstallation,
    includesTraining: hasTrainingService,
    ai_config: {
      ...AI_EMAIL_CONFIG,
      additional_context: `Email Type: ${templateId}
      Customer: ${order.first_name} ${order.last_name}
      Order ID: ${order.id}
      Status: ${order.status}
      Includes Installation: ${showInstallation ? 'Yes' : 'No'}
      Includes Training: ${hasTrainingService ? 'Yes' : 'No'}`
    },
    installationPrice: order.installation_price,
    installationDate: formattedInstallationDate,
    installationTime: formattedInstallationTime,
  };

  // Ensure all templates have consistent structure
  const getTemplateBase = (type: string, customPrompt: string) => ({
    variables: {
      ...baseVariables,
      emailType: type
    },
    prompt: `${customPrompt}
      
      Important guidelines:
      - Write as if you are Way of Glory Media writing TO the customer
      - Keep the tone professional and clear
      - Focus on the specific purpose of this email
      ${showInstallation ? '- Include relevant installation information' : '- Do not mention installation'}
      ${hasTrainingService ? '- Include relevant training information' : '- Do not mention training'}
      
      Customer details:
      Name: ${order.first_name} ${order.last_name}
      Order: #${order.id}
      ${showInstallation ? `Installation Date: ${baseVariables.installationDate}\nInstallation Time: ${baseVariables.installationTime}\n` : ''}Status: ${order.status}
      Includes Installation: ${showInstallation ? 'Yes' : 'No'}
      Includes Training: ${hasTrainingService ? 'Yes' : 'No'}`
  });

  switch (templateId) {
    case 'order_confirmation':
      return {
        subject: `Order Confirmation - Way of Glory Order #${order.id}`,
        ...getTemplateBase('Order Confirmation', `Write an order confirmation email to the customer with these requirements:
          - Address the customer by their first name (${order.first_name})
          - Write from Way of Glory Media's perspective
          - Confirm receipt of their order (#${order.id})
          - Include order details and total amount ($${order.total_amount})
          - Explain next steps in the process:
            ${showInstallation ? '* Mention that our team will contact them to schedule installation' : '* Explain shipping process'}
            ${hasTrainingService ? '* Note that training will be scheduled after installation' : ''}
          - Provide our support contact information (help@wayofglory.com and (310) 872-9781)
          - End with a warm closing`)
      };

    case 'order_shipped':
      return {
        subject: `Shipping Confirmation - Way of Glory Order #${order.id}`,
        ...getTemplateBase('Shipping Confirmation', `Write a shipping notification email to the customer with these requirements:
          - Address the customer by their first name (${order.first_name})
          - Write from Way of Glory Media's perspective
          - Announce that their order (#${order.id}) has shipped
          - Include tracking information placeholder
          - Provide estimated delivery timeframe
          - Include installation/setup guidance if applicable
          - Provide our support contact information (help@wayofglory.com and (310) 872-9781)
          - End with a warm closing`)
      };

    case 'order_delayed':
      return {
        subject: `Delay Notification - Way of Glory Order #${order.id}`,
        ...getTemplateBase('Delay Notification', `Write a delay notification email to the customer with these requirements:
          - Address the customer by their first name (${order.first_name})
          - Write from Way of Glory Media's perspective
          - Professionally explain the delay with order #${order.id}
          - Provide a new estimated timeline
          ${showInstallation ? '- Explain how this affects installation scheduling' : ''}
          ${hasTrainingService ? '- Address any impact on training session timing' : ''}
          - Offer a goodwill gesture (10% off next purchase)
          - Provide our support contact information (help@wayofglory.com and (310) 872-9781)
          - End with an apologetic but professional closing`)
      };

    case 'order_completed':
      return {
        subject: `Order Completed - Way of Glory Order #${order.id}`,
        ...getTemplateBase('Order Completed', `Write a completion thank you email to the customer with these requirements:
          - Address the customer by their first name (${order.first_name})
          - Write from Way of Glory Media's perspective
          - Confirm their order (#${order.id}) is complete
          - Express appreciation for their business
          ${showInstallation ? '- Reference successful installation completion' : ''}
          ${hasTrainingService ? '- Mention completed training session and ongoing support' : ''}
          - Request feedback about their experience
          - Include a special offer (10% off next purchase)
          - Provide our support contact information (help@wayofglory.com)
          - End with a warm closing`)
      };

    case 'thank_you':
      return {
        subject: `Thank You for Your Order - Way of Glory #${order.id}`,
        ...getTemplateBase('Thank You', `Write a professional thank you email to the customer with these requirements:
          - Start with a warm greeting to ${order.first_name}
          - Write from Way of Glory Media's perspective
          - Express sincere appreciation for order #${order.id}
          - Thank them for choosing Way of Glory Media
          - Confirm the order details:
            * Total amount: $${order.total_amount}
            * Order status: ${order.status}
          - Explain the next steps:
            ${showInstallation ? '* Our team will contact you to schedule the installation' : '* We will process your order for shipping'}
            ${hasTrainingService ? '* We will coordinate the training session timing' : ''}
          - Provide our contact information:
            * Email: help@wayofglory.com
            * Phone: (310) 872-9781
          - End with a warm, professional closing
          
          Note: Keep the email concise, professional, and focused on expressing gratitude while clearly outlining the next steps.`)
      };

    case 'payment_reminder':
      return {
        subject: `Payment Reminder - Way of Glory Order #${order.id}`,
        ...getTemplateBase('Payment Reminder', `Write a professional payment reminder email with these requirements:
          - Start with a friendly greeting to ${order.first_name}
          - Write from Way of Glory Media's perspective
          - Gently remind about the pending payment for order #${order.id}
          - State the total amount due ($${order.total_amount}) clearly
          - List accepted payment methods:
            * Direct bank transfer (details will be provided separately)
            * Check payments (payable to "Way of Glory Media")
          ${showInstallation ? '- Mention that installation scheduling will begin after payment is received' : '- Mention that shipping will begin after payment is received'}
          - Include our support contact information (help@wayofglory.com and (310) 872-9781)
          - End with a courteous closing that encourages quick action`)
      };

    case 'installation_confirmation':
      return {
        subject: `Installation Confirmation - Way of Glory Order #${order.id}`,
        ...getTemplateBase('Installation Confirmation', `Write a detailed installation confirmation email with these requirements:
          - Begin with a warm greeting to ${order.first_name}
          - Write from Way of Glory Media's perspective
          - Express excitement about the upcoming installation
          - Confirm installation details for order #${order.id}:
            * Installation Date: ${baseVariables.installationDate}
            * Installation Time: ${baseVariables.installationTime}
            * Estimated Duration: ${hasTrainingService ? '3-4' : '2-3'} hours
          - Provide a clear preparation checklist
          - Explain what to expect during installation
          ${hasTrainingService ? '- Include information about the training session' : ''}
          - Include our support contact information (help@wayofglory.com and (310) 872-9781)
          - End with an enthusiastic closing`)
      };

    case 'shipping_update':
      return {
        subject: `Shipping Update - Way of Glory Order #${order.id}`,
        ...getTemplateBase('Shipping Update', `Write a shipping update email with these requirements:
          - Start with a friendly greeting to ${order.first_name}
          - Write from Way of Glory Media's perspective
          - Provide clear status update for order #${order.id}
          - Include any special delivery instructions or requirements
          - Explain next steps after delivery
          - Include our support contact information (help@wayofglory.com and (310) 872-9781)
          - End with an assuring message about their order's progress`)
      };

    default:
      return {
        subject: `Order Status Update - Way of Glory #${order.id}`,
        ...getTemplateBase('Order Status Update', `Write an order update email to the customer with these requirements:
          - Address the customer by their first name (${order.first_name})
          - Write from Way of Glory Media's perspective
          - Provide clear update about their order (#${order.id})
          - Include current order status and next steps
          - Provide our support contact information (help@wayofglory.com and (310) 872-9781)
          - End with a professional closing`)
      };
  }
};

export function formatEmailContent(content: string, variables: any): string {
  const styles = getEmailStyles();
  
  // Always use absolute URLs for logos in PWA mode
  const headerLogoUrl = 'https://wayofglory.com/images/logo/logo.png';
  const footerLogoUrl = 'https://wayofglory.com/images/logo/LogoLight.png';

  // Check if content already has our wrapper
  if (content.includes('class="way-of-glory-email"')) {
    return content;
  }

  // Add proper styling to paragraphs and links if not already styled
  let formattedContent = content;
  if (!content.includes('style=')) {
    formattedContent = content
      .replace(/<p>/g, '<p style="margin: 1em 0; line-height: 1.6;">')
      .replace(/<a\s+href=/g, '<a style="color: #2563eb; text-decoration: none; font-weight: 500;" href=');
  }

  // Remove any subject line that might be in the content
  formattedContent = formattedContent.replace(/Subject:.*?\n/, '');

  // Format order items if they exist
  let orderDetailsHtml = '';
  if (variables.order_items && variables.order_items.length > 0) {
    const items = variables.order_items.map((item: any) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
          <div style="font-weight: 500;">${item.title || item.product?.title || 'Product'}</div>
          ${item.product?.description ? `<div style="color: #64748b; font-size: 14px; margin-top: 4px;">${item.product.description}</div>` : ''}
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: center;">${item.quantity}x</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">$${typeof item.price === 'number' ? item.price.toFixed(2) : item.price}</td>
      </tr>
    `).join('');

    // Format the content by replacing newlines with proper paragraph tags
    formattedContent = formattedContent.replace(/\n\n/g, '</p><p style="margin: 1em 0; line-height: 1.6;">');
    formattedContent = `<p style="margin: 1em 0; line-height: 1.6;">${formattedContent}</p>`;

    orderDetailsHtml = `
      <div style="margin: 2em 0; padding: 24px; background-color: #f8fafc; border-radius: 12px;">
        <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #1e293b;">Order Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 2px solid #e2e8f0;">
              <th style="text-align: left; padding: 8px 0; color: #64748b; font-weight: 500;">Item</th>
              <th style="text-align: center; padding: 8px 0; color: #64748b; font-weight: 500;">Quantity</th>
              <th style="text-align: right; padding: 8px 0; color: #64748b; font-weight: 500;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${items}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding: 12px 0; text-align: right; font-weight: 500;">Subtotal:</td>
              <td style="padding: 12px 0; text-align: right;">$${variables.subtotal}</td>
            </tr>
            ${variables.tax_amount && Number(variables.tax_amount) > 0 ? `
              <tr>
                <td colspan="2" style="padding: 12px 0; text-align: right; font-weight: 500;">Tax:</td>
                <td style="padding: 12px 0; text-align: right;">$${variables.tax_amount}</td>
              </tr>
            ` : ''}
            ${variables.installation_price && Number(variables.installation_price) > 0 ? `
              <tr>
                <td colspan="2" style="padding: 12px 0; text-align: right; font-weight: 500;">Installation:</td>
                <td style="padding: 12px 0; text-align: right;">$${variables.installation_price}</td>
              </tr>
            ` : ''}
            <tr>
              <td colspan="2" style="padding: 16px 0 0 0; text-align: right; font-weight: 600; border-top: 2px solid #e2e8f0;">Total:</td>
              <td style="padding: 16px 0 0 0; text-align: right; font-weight: 600; border-top: 2px solid #e2e8f0;">$${variables.totalAmount}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;
  }

  return `
    <table class="way-of-glory-email" width="100%" cellpadding="0" cellspacing="0" border="0" style="${styles.container}">
      <tr>
        <td>
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="${styles.header}">
                <img src="${headerLogoUrl}" alt="${variables.companyName}" style="${styles.logo}">
              </td>
            </tr>
            <tr>
              <td style="${styles.content}">
                ${formattedContent}
                ${orderDetailsHtml}
              </td>
            </tr>
            <tr>
              <td style="${styles.footer}">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="${styles.footerContent}">
                      <img src="${footerLogoUrl}" alt="${variables.companyName}" style="${styles.footerLogo}">
                      <p style="${styles.footerText}">Questions? Contact our support team:</p>
                      <div style="${styles.footerLinks}">
                        <a href="mailto:${variables.supportEmail}" style="${styles.link}">${variables.supportEmail}</a>
                        <a href="tel:+13105729781" style="${styles.link}">(310) 572-9781</a>
                        <a href="${variables.websiteUrl}" style="${styles.link}">Visit our website</a>
                      </div>
                      <p style="${styles.copyright}">© ${variables.year} Way of Glory Media. All rights reserved.</p>
                      <p style="${styles.disclaimer}">Dedicated to serving churches and non-profits with excellence</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

function getEmailStyles() {
  return {
    container: `
      font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
      max-width: 640px;
      margin: 0 auto;
      line-height: 1.6;
      color: #1e293b;
      background-color: #ffffff;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    `,
    header: `
      text-align: center;
      padding: 32px 16px;
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      border-radius: 16px 16px 0 0;
      mso-line-height-rule: exactly;
    `,
    logo: `
      width: 180px;
      max-width: 80%;
      height: auto;
      display: block;
      margin: 0 auto;
      -ms-interpolation-mode: bicubic;
    `,
    content: `
      padding: 32px 24px;
      background-color: #ffffff;
      font-size: 16px;
      font-weight: 400;
      mso-line-height-rule: exactly;
    `,
    footer: `
      text-align: center;
      padding: 40px 24px;
      background: linear-gradient(to bottom, #f8fafc, #f1f5f9);
      border-top: 1px solid #e2e8f0;
      border-radius: 0 0 16px 16px;
      mso-line-height-rule: exactly;
    `,
    footerContent: `
      text-align: center;
      width: 100%;
    `,
    footerLogo: `
      width: 140px;
      height: auto;
      display: block;
      margin: 0 auto 32px;
      opacity: 0.85;
      -ms-interpolation-mode: bicubic;
    `,
    footerText: `
      margin: 0 0 20px 0;
      color: #475569;
      font-size: 15px;
      font-weight: 500;
    `,
    footerLinks: `
      margin-bottom: 32px;
      text-align: center;
    `,
    link: `
      color: #2563eb;
      text-decoration: none;
      font-weight: 500;
      padding: 8px 16px;
      border-radius: 8px;
      background: rgba(37, 99, 235, 0.05);
      white-space: nowrap;
      display: inline-block;
      margin: 4px;
    `,
    copyright: `
      margin: 0 0 8px 0;
      font-size: 13px;
      color: #64748b;
      font-weight: 500;
    `,
    disclaimer: `
      margin: 0;
      font-size: 12px;
      color: #94a3b8;
      font-weight: 400;
    `
  };
} 