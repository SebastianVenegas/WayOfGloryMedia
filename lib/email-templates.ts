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
    logoUrl: '/images/logo/LogoLight.png',
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

  switch (templateId) {
    case 'order_confirmation':
      return {
        subject: `Order Confirmation - Way of Glory Order #${order.id}`,
        prompt: `Write an order confirmation email to the customer with these requirements:
          - Address the customer by their first name (${order.first_name})
          - Write from Way of Glory Media's perspective
          - Confirm receipt of their order (#${order.id})
          - Include order details and total amount ($${order.total_amount})
          - Explain next steps in the process:
            ${showInstallation ? '* Mention that our team will contact them to schedule installation' : '* Explain shipping process'}
            ${hasTrainingService ? '* Note that training will be scheduled after installation' : ''}
          - Provide our support contact information (help@wayofglory.com and (310) 872-9781)
          - End with a warm closing
          
          Important guidelines:
          - Write as if you are Way of Glory Media writing TO the customer
          - Keep the tone professional and clear
          - Focus on confirming their order and next steps
          ${showInstallation ? '          - Mention installation scheduling process' : '          - Do not mention installation services'}
          ${hasTrainingService ? '          - Include brief mention of training session' : '          - Do not mention training services'}
          
          Customer details:
          Name: ${order.first_name} ${order.last_name}
          Order: #${order.id}
          ${showInstallation ? `Installation Date: ${baseVariables.installationDate}\n          Installation Time: ${baseVariables.installationTime}\n` : ''}Total: $${order.total_amount}
          Status: ${order.status}
          Includes Installation: ${showInstallation ? 'Yes' : 'No'}
          Includes Training: ${hasTrainingService ? 'Yes' : 'No'}`,
        variables: {
          ...baseVariables,
          emailType: 'Order Confirmation'
        }
      };

    case 'order_shipped':
      return {
        subject: `Shipping Confirmation - Way of Glory Order #${order.id}`,
        prompt: `Write a shipping notification email to the customer with these requirements:
          - Address the customer by their first name (${order.first_name})
          - Write from Way of Glory Media's perspective (as the business writing to the customer)
          - Announce that their order (#${order.id}) has shipped
          - Include tracking information placeholder
          - Provide estimated delivery timeframe
          - Include installation/setup guidance if applicable
          - Provide our support contact information (help@wayofglory.com and (310) 872-9781)
          - End with a warm closing
          
          Important guidelines:
          - Write as if you are Way of Glory Media writing TO the customer
          - Keep the tone professional and clear
          - Focus on shipping details and next steps
          - Make it clear this is from the business to the customer
          
          Customer details:
          Name: ${order.first_name} ${order.last_name}
          Order: #${order.id}
          ${showInstallation ? `Installation Date: ${baseVariables.installationDate}\n          Installation Time: ${baseVariables.installationTime}\n` : ''}Status: ${order.status}`,
        variables: {
          ...baseVariables,
          emailType: 'Shipping Confirmation'
        }
      };

    case 'order_delayed':
      return {
        subject: `Delay Notification - Way of Glory Order #${order.id}`,
        prompt: `Write a delay notification email to the customer with these requirements:
          - Address the customer by their first name (${order.first_name})
          - Write from Way of Glory Media's perspective
          - Professionally explain the delay with order #${order.id}
          - Provide a new estimated timeline
          ${showInstallation ? '          - Explain how this affects installation scheduling' : ''}
          ${hasTrainingService ? '          - Address any impact on training session timing' : ''}
          - Offer a goodwill gesture (10% off next purchase)
          - Provide our support contact information (help@wayofglory.com and (310) 872-9781)
          - End with an apologetic but professional closing
          
          Important guidelines:
          - Write as if you are Way of Glory Media writing TO the customer
          - Keep the tone apologetic but professional
          - Focus on the solution and next steps
          ${showInstallation ? '          - Address installation timeline changes' : '          - Do not mention installation'}
          ${hasTrainingService ? '          - Include updated training timeline' : '          - Do not mention training'}
          
          Customer details:
          Name: ${order.first_name} ${order.last_name}
          Order: #${order.id}
          ${showInstallation ? `Installation Date: ${baseVariables.installationDate}\n          Installation Time: ${baseVariables.installationTime}\n` : ''}Status: ${order.status}
          Includes Installation: ${showInstallation ? 'Yes' : 'No'}
          Includes Training: ${hasTrainingService ? 'Yes' : 'No'}`,
        variables: {
          ...baseVariables,
          emailType: 'Delay Notification'
        }
      };

    case 'order_completed':
      // Ensure order_items exists and map them correctly
      const orderItems = order.order_items?.map(item => {
        const price = Number(item.price_at_time);
        const quantity = Number(item.quantity);
    return {
          title: item.product?.title || 'Product',
          quantity: quantity,
          price: price * quantity,
          pricePerUnit: price,
          product: item.product
        };
      }) || [];

      const subtotal = orderItems.reduce((sum, item) => sum + item.price, 0);

      // Create the variables object with all necessary data
      const emailVariables = {
        ...baseVariables,
        emailType: 'Thank You for Your Order',
        orderId: order.id,
        firstName: order.first_name,
        lastName: order.last_name,
        createdAt: order.created_at,
        order_items: orderItems,
        subtotal: subtotal,
        totalAmount: Number(order.total_amount),
        supportEmail: 'help@wayofglory.com'
      };

      console.log('Email variables:', {
        order_items: emailVariables.order_items,
        subtotal: emailVariables.subtotal,
        totalAmount: emailVariables.totalAmount
      });

    return {
        subject: `Order Completed - Way of Glory Order #${order.id}`,
        prompt: `Write a completion thank you email to the customer with these requirements:
          - Address the customer by their first name (${order.first_name})
          - Write from Way of Glory Media's perspective
          - Confirm their order (#${order.id}) is complete
          - Express appreciation for their business
          ${showInstallation ? '          - Reference successful installation completion' : ''}
          ${hasTrainingService ? '          - Mention completed training session and ongoing support' : ''}
          - Request feedback about their experience
          - Include a special offer (10% off next purchase)
          - Provide our support contact information (help@wayofglory.com)
          - End with a warm closing
          
          Important guidelines:
          - Write as if you are Way of Glory Media writing TO the customer
          - Keep the tone warm and professional
          - Focus on appreciation and future relationship
          ${showInstallation ? '          - Include feedback request about installation' : ''}
          ${hasTrainingService ? '          - Ask about training experience' : ''}
          
          Customer details:
          Name: ${order.first_name} ${order.last_name}
          Order: #${order.id}
          ${showInstallation ? `Installation Date: ${baseVariables.installationDate}\n          Installation Time: ${baseVariables.installationTime}\n` : ''}Status: ${order.status}
          Includes Installation: ${showInstallation ? 'Yes' : 'No'}
          Includes Training: ${hasTrainingService ? 'Yes' : 'No'}`,
        variables: {
          ...emailVariables,
          emailType: 'Order Completed'
        }
      };

    case 'thank_you':
      // Process order items and calculate totals
      const thankYouOrderItems = order.order_items?.map(item => ({
        ...item,
        price_at_time: Number(item.price_at_time),
        quantity: Number(item.quantity),
        title: item.product?.title || item.title || 'Product'
      })) || [];

      const thankYouSubtotal = thankYouOrderItems.reduce((sum, item) => 
        sum + (item.price_at_time * item.quantity), 0
      );

      const thankYouVariables = {
        ...baseVariables,
        emailType: 'Thank You for Your Order',
        order_items: thankYouOrderItems,
        subtotal: thankYouSubtotal,
        tax_amount: Number(order.tax_amount || 0),
        installation_price: Number(order.installation_price || 0),
        total_amount: Number(order.total_amount || 0)
      };

      return {
        subject: `Thank You for Your Order - Way of Glory #${order.id}`,
        prompt: `Write a heartfelt thank you email with these requirements:
          - Begin with a warm, personal greeting to ${order.first_name}
          - Write from Way of Glory Media's perspective
          - Express genuine appreciation for choosing Way of Glory Media
          - Acknowledge order #${order.id} with enthusiasm
          - Share our excitement about enhancing their worship experience:
            * Mention our commitment to excellence
            * Emphasize the impact on their ministry
            * Express anticipation of their success
          - Outline next steps clearly:
            * Order processing timeline
            ${showInstallation ? '            * Installation scheduling process' : '            * Shipping process'}
            ${hasTrainingService ? '            * Training session coordination' : ''}
            * How we'll stay in touch
          - Include our support contact information (help@wayofglory.com and (310) 872-9781)
          - Close with a warm message about our ongoing partnership
          
          Important guidelines:
          - Make it personal and genuine
          - Focus on the relationship, not just the transaction
          - Emphasize our shared mission in worship ministry
          ${showInstallation ? '          - Include excitement about upcoming installation' : ''}
          ${hasTrainingService ? '          - Express enthusiasm about training and support' : ''}
          
          Customer details:
          Name: ${order.first_name} ${order.last_name}
          Order: #${order.id}
          ${showInstallation ? `Installation Date: ${baseVariables.installationDate}\n          Installation Time: ${baseVariables.installationTime}\n` : ''}Status: ${order.status}
          Includes Installation: ${showInstallation ? 'Yes' : 'No'}
          Includes Training: ${hasTrainingService ? 'Yes' : 'No'}`,
        variables: thankYouVariables
      };

    case 'payment_reminder':
      return {
        subject: `Payment Reminder - Way of Glory Order #${order.id}`,
        prompt: `Write a professional payment reminder email with these requirements:
          - Start with a friendly greeting to ${order.first_name}
          - Write from Way of Glory Media's perspective
          - Gently remind about the pending payment for order #${order.id}
          - State the total amount due ($${order.total_amount}) clearly
          - List accepted payment methods:
            * Direct bank transfer (details will be provided separately)
            * Check payments (payable to "Way of Glory Media")
          ${showInstallation ? '          - Mention that installation scheduling will begin after payment is received' : '          - Mention that shipping will begin after payment is received'}
          - Include our support contact information (help@wayofglory.com and (310) 872-9781)
          - End with a courteous closing that encourages quick action
          
          Important guidelines:
          - Keep the tone polite and understanding, not demanding
          - Be clear about expectations but maintain a helpful attitude
          - Focus on facilitating payment rather than demanding it
          ${showInstallation ? '          - Reference installation scheduling process' : '          - Do not mention installation'}
          ${hasTrainingService ? '          - Include brief mention of training session timing' : '          - Do not mention training'}
          
          Customer details:
          Name: ${order.first_name} ${order.last_name}
          Order: #${order.id}
          ${showInstallation ? `Installation Date: ${baseVariables.installationDate}\n          Installation Time: ${baseVariables.installationTime}\n` : ''}Total Due: $${order.total_amount}
          Status: ${order.status}
          Includes Installation: ${showInstallation ? 'Yes' : 'No'}
          Includes Training: ${hasTrainingService ? 'Yes' : 'No'}`,
        variables: {
          ...baseVariables,
          emailType: 'Payment Reminder'
        }
      };

    case 'installation_confirmation':
      return {
        subject: `Installation Confirmation - Way of Glory Order #${order.id}`,
        prompt: `Write a detailed installation confirmation email with these requirements:
          - Begin with a warm greeting to ${order.first_name}
          - Write from Way of Glory Media's perspective
          - Express excitement about the upcoming installation
          - Confirm installation details for order #${order.id}:
            * Installation Date: ${baseVariables.installationDate}
            * Installation Time: ${baseVariables.installationTime}
            * Location: [Customer's address]
            * Estimated Duration: ${hasTrainingService ? '3-4' : '2-3'} hours
          - Provide a clear preparation checklist:
            * Clear access to installation area
            * Power outlets availability
            * Space requirements
            * Remove any obstacles
          - Explain what to expect during installation:
            * Our team will arrive in the specified time window
            * Equipment setup and testing process
            * Quality assurance checks
            ${hasTrainingService ? '            * Comprehensive training session on equipment usage and best practices' : ''}
          - Include our support contact information (help@wayofglory.com and (310) 872-9781)
          - End with an enthusiastic closing about enhancing their worship experience
          
          Important guidelines:
          - Maintain a professional but warm tone
          - Focus on making the customer feel prepared and confident
          - Emphasize our expertise and commitment to quality
          - Show excitement about helping enhance their worship space
          
          
          Customer details:
          Name: ${order.first_name} ${order.last_name}
          Order: #${order.id}
          Installation Date: ${baseVariables.installationDate}
          Installation Time: ${baseVariables.installationTime}
          Status: ${order.status}
          Includes Training: ${hasTrainingService ? 'Yes' : 'No'}`,
        variables: {
          ...baseVariables,
          emailType: 'Installation Confirmation',
          includesTraining: hasTrainingService
        }
      };

    case 'shipping_update':
      return {
        subject: `Shipping Update - Way of Glory Order #${order.id}`,
        prompt: `Write a shipping update email with these requirements:
          - Start with a friendly greeting to ${order.first_name}
          - Write from Way of Glory Media's perspective
          - Provide clear status update for order #${order.id}:
            * Current shipment location/status
            * Expected delivery timeline
            * Any relevant tracking information
          - Include any special delivery instructions or requirements
          - Explain next steps after delivery:
            * Inspection process
            ${showInstallation ? '            * Installation scheduling and coordination\n            * Pre-installation preparation requirements' : '            * Basic setup recommendations'}
          - Include our support contact information (help@wayofglory.com and (310) 872-9781)
          - End with an assuring message about their order's progress
          
          Important guidelines:
          - Keep the tone informative and confident
          - Focus on transparency and clear communication
          - Show attention to detail and care for their order
          - Emphasize our commitment to successful delivery
          ${showInstallation ? '          - Include information about installation coordination\n          - Mention that our team will contact them to schedule installation' : '          - Do not mention installation services or scheduling\n          - Focus on self-setup guidance if needed'}
          
          Customer details:
          Name: ${order.first_name} ${order.last_name}
          Order: #${order.id}
          ${showInstallation ? `Installation Date: ${baseVariables.installationDate}\n          Installation Time: ${baseVariables.installationTime}\n` : ''}Status: ${order.status}
          Includes Installation: ${showInstallation ? 'Yes' : 'No'}`,
        variables: {
          ...baseVariables,
          emailType: 'Shipping Update',
          includesInstallation: showInstallation
        }
      };

    default:
      return {
        subject: `Order Status Update - Way of Glory #${order.id}`,
        prompt: `Write an order update email to the customer with these requirements:
          - Address the customer by their first name (${order.first_name})
          - Write from Way of Glory Media's perspective
          - Provide clear update about their order (#${order.id})
          - Include current order status and next steps:
            ${showInstallation ? '* Update on installation scheduling/status' : '* Update on order processing'}
            ${hasTrainingService ? '* Information about training session timing' : ''}
          - Provide our support contact information (help@wayofglory.com and (310) 872-9781)
          - End with a professional closing
          
          Important guidelines:
          - Write as if you are Way of Glory Media writing TO the customer
          - Keep the tone professional and clear
          - Focus on the status update and next steps
          ${showInstallation ? '          - Include installation-related updates' : '          - Do not mention installation'}
          ${hasTrainingService ? '          - Include training-related updates' : '          - Do not mention training'}
          
          Customer details:
          Name: ${order.first_name} ${order.last_name}
          Order: #${order.id}
          ${showInstallation ? `Installation Date: ${baseVariables.installationDate}\n          Installation Time: ${baseVariables.installationTime}\n` : ''}Status: ${order.status}
          Includes Installation: ${showInstallation ? 'Yes' : 'No'}
          Includes Training: ${hasTrainingService ? 'Yes' : 'No'}`,
        variables: {
          ...baseVariables,
          emailType: 'Order Status Update'
        }
    };
  }
};

export function formatEmailContent(content: string, variables: any): string {
  // Base styles for the email with modern design
  const styles = {
    container: 'font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro", "Segoe UI", Roboto, Helvetica, Arial, sans-serif; width: 100% !important; max-width: 640px; margin: 0 auto; line-height: 1.6; color: #1a1a1a;',
    mainWrapper: 'background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);',
    header: 'text-align: center; padding: 32px 16px; background: linear-gradient(135deg, #2563eb, #1d4ed8); position: relative;',
    headerOverlay: 'position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: radial-gradient(circle at top right, rgba(255, 255, 255, 0.1) 0%, transparent 60%);',
    logo: 'width: 180px; max-width: 80%; height: auto; display: block; margin: 0 auto; position: relative; z-index: 1; filter: brightness(0) invert(1);',
    mainContent: 'padding: 32px 24px; background-color: #ffffff;',
    paragraph: 'font-size: 15px; line-height: 1.7; margin-bottom: 24px; color: #334155; font-weight: 450; letter-spacing: -0.01em;',
    orderDetails: 'background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; margin: 24px 0; overflow: hidden;',
    orderHeader: 'padding: 20px 24px; background: linear-gradient(to right, #f8fafc, #ffffff); border-bottom: 1px solid #e2e8f0;',
    orderTitle: 'font-size: 18px; font-weight: 600; color: #0f172a; margin: 0; letter-spacing: -0.02em;',
    orderBody: 'padding: 20px 24px;',
    orderItem: 'display: flex; justify-content: space-between; align-items: flex-start; padding: 16px 0; border-bottom: 1px solid #f1f5f9;',
    orderItemTitle: 'font-weight: 500; color: #0f172a; font-size: 15px; letter-spacing: -0.01em; margin-right: 8px;',
    orderItemQuantity: 'color: #64748b; font-size: 14px; font-weight: 450;',
    orderItemPrice: 'font-weight: 600; color: #0f172a; font-size: 15px; letter-spacing: -0.01em; white-space: nowrap;',
    totals: 'margin-top: 24px; padding: 20px; background: #f8fafc; border-radius: 12px;',
    totalRow: 'display: flex; justify-content: space-between; padding: 8px 0; color: #475569; font-size: 14px; letter-spacing: -0.01em;',
    totalRowFinal: 'display: flex; justify-content: space-between; margin-top: 16px; padding-top: 16px; border-top: 2px solid #e2e8f0; font-size: 16px; font-weight: 700; color: #0f172a; letter-spacing: -0.02em;',
    footer: 'text-align: center; padding: 32px 24px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; border-bottom-left-radius: 16px; border-bottom-right-radius: 16px;',
    footerLogo: 'width: 120px; max-width: 60%; height: auto; margin-bottom: 24px; opacity: 0.9; display: block; margin: 0 auto 24px auto;',
    footerTitle: 'font-size: 18px; font-weight: 600; color: #0f172a; margin: 0 0 8px 0; letter-spacing: -0.02em;',
    footerSubtitle: 'font-size: 14px; color: #475569; margin: 0 0 24px 0; line-height: 1.6; letter-spacing: -0.01em;',
    footerContact: 'margin: 24px 0; font-size: 14px; color: #475569; letter-spacing: -0.01em;',
    footerLink: 'display: inline-block; color: #2563eb; text-decoration: none; font-weight: 500; letter-spacing: -0.01em; margin: 4px 8px;',
    footerDivider: 'width: 40px; height: 2px; background: #e2e8f0; margin: 24px auto;',
    footerCopyright: 'font-size: 13px; color: #64748b; margin: 24px 0 0 0; letter-spacing: -0.01em;',
  };

  // Ensure all image URLs are absolute and properly formatted
  const headerLogoUrl = variables.logoUrl || 'https://wayofglory.com/images/logo/LogoLight.png';
  const footerLogoUrl = variables.logoNormalUrl || 'https://wayofglory.com/images/logo/logo.png';

  // Ensure the URLs are complete
  const ensureAbsoluteUrl = (url: string) => {
    if (url.startsWith('http')) return url;
    return `https://wayofglory.com${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const finalHeaderLogoUrl = ensureAbsoluteUrl(headerLogoUrl);
  const finalFooterLogoUrl = ensureAbsoluteUrl(footerLogoUrl);

  // Format the content
  let formattedContent = content;

  // If content is plain text, wrap it in paragraphs
  if (!content.includes('<p>')) {
    formattedContent = content
      .split(/\n{2,}/)
      .map(paragraph => paragraph.trim())
      .filter(paragraph => paragraph)
      .map(paragraph => `<p>${paragraph}</p>`)
      .join('\n');
  }

  // Apply styles to paragraphs and replace variables
  formattedContent = formattedContent
    .replace(/<p>/g, `<p style="${styles.paragraph}">`)
    .replace(/\${([^}]+)}/g, (match, key) => {
      return variables[key] || match;
    });

  // Add proper styling to any links
  formattedContent = formattedContent.replace(
    /<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1/g,
    `<a style="color: #2563eb; text-decoration: none; font-weight: 500;" href="$1$2$1`
  );

  // Add proper styling to lists
  formattedContent = formattedContent
    .replace(/<ul>/g, `<ul style="margin: 16px 0; padding-left: 24px;">`)
    .replace(/<li>/g, `<li style="margin: 8px 0; color: #334155;">`);

  // Create order details section if order items exist
  let orderDetailsSection = '';
  if (variables.order_items && variables.order_items.length > 0) {
    const orderItemsHtml = variables.order_items
      .map((item: { title?: string; quantity: number; price: number; pricePerUnit: number; product?: { title?: string } }) => {
        const title = item.product?.title || item.title || 'Product';
        const quantity = Number(item.quantity);
        const price = Number(item.price);
        const pricePerUnit = Number(item.pricePerUnit);
        
        return `
          <div style="${styles.orderItem}">
            <div style="display: flex; flex-direction: column; flex: 1;">
              <div style="display: flex; align-items: baseline; justify-content: space-between;">
                <div>
                  <span style="${styles.orderItemTitle}">${title}</span>
                  <span style="${styles.orderItemQuantity}">× ${quantity}</span>
                </div>
                <span style="${styles.orderItemPrice}">$${price.toFixed(2)}</span>
              </div>
            </div>
          </div>
        `;
      })
      .join('');

    // Calculate totals with safeguards against NaN
    const subtotal = variables.subtotal || 0;
    const taxAmount = Number(variables.tax_amount) || 0;
    const installationPrice = Number(variables.installation_price) || 0;
    const totalAmount = Number(variables.totalAmount) || (subtotal + taxAmount + installationPrice);

    orderDetailsSection = `
      <div style="${styles.orderDetails}">
        <div style="${styles.orderHeader}">
          <h2 style="${styles.orderTitle}">Order Summary</h2>
        </div>
        <div style="${styles.orderBody}">
          ${orderItemsHtml}
          <div style="${styles.totals}">
            <div style="${styles.totalRow}">
              <span>Subtotal</span>
              <span style="font-weight: 500;">$${Number(subtotal).toFixed(2)}</span>
            </div>
            ${taxAmount > 0 ? `
              <div style="${styles.totalRow}">
                <span>Tax</span>
                <span style="font-weight: 500;">$${taxAmount.toFixed(2)}</span>
              </div>
            ` : ''}
            ${installationPrice > 0 ? `
              <div style="${styles.totalRow}">
                <span>Installation</span>
                <span style="font-weight: 500;">$${installationPrice.toFixed(2)}</span>
              </div>
            ` : ''}
            <div style="${styles.totalRowFinal}">
              <span>Total</span>
              <span>$${totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Combine all sections into the final email
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="color-scheme" content="light">
      <meta name="supported-color-schemes" content="light">
      <style>
        body { margin: 0; padding: 16px; background-color: #f8fafc; }
        table { border-spacing: 0; }
        td { padding: 0; }
        img { border: 0; }
        @media only screen and (max-width: 640px) {
          .container {
            width: 100% !important;
            padding: 0 !important;
          }
        }
      </style>
    </head>
    <body>
      <div style="max-width: 640px; margin: 0 auto; background-color: #f8fafc; padding: 16px;">
        <div style="${styles.mainWrapper}">
          <div style="${styles.header}">
            <div style="${styles.headerOverlay}"></div>
            <img src="${finalHeaderLogoUrl}" alt="${variables.companyName}" style="${styles.logo}">
          </div>
          <div style="${styles.mainContent}">
            ${formattedContent}
            ${orderDetailsSection}
          </div>
          <div style="${styles.footer}">
            <img src="${finalFooterLogoUrl}" alt="${variables.companyName}" style="${styles.footerLogo}">
            <h3 style="${styles.footerTitle}">Enhancing Worship Experiences</h3>
            <p style="${styles.footerSubtitle}">Professional Audio and Visual Solutions for Your Ministry</p>
            <div style="${styles.footerDivider}"></div>
            <div style="${styles.footerContact}">
              <p style="margin: 0 0 16px 0;">
                Questions? Contact our support team:
              </p>
              <p style="margin: 0;">
                <a href="mailto:${variables.supportEmail}" style="${styles.footerLink}">${variables.supportEmail}</a>
                <a href="tel:+13108729781" style="${styles.footerLink}">(310) 872-9781</a>
                <a href="${variables.websiteUrl}" style="${styles.footerLink}" target="_blank">Visit our website</a>
              </p>
            </div>
            <div style="${styles.footerDivider}"></div>
            <p style="${styles.footerCopyright}">
              &copy; ${variables.year || new Date().getFullYear()} ${variables.companyName}. All rights reserved.<br>
              <span style="font-size: 12px; color: #94a3b8;">Dedicated to serving churches and ministries with excellence</span>
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return emailHtml;
} 