import nodemailer from 'nodemailer'
import { Transporter } from 'nodemailer'

const transporter: Transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: true
  }
})

export const sendContractEmail = async ({
  firstName,
  lastName,
  email,
  phone,
  organization,
  orderId,
  orderItems,
  totalAmount,
  installationPrice,
  shippingAddress,
  shippingCity,
  shippingState,
  shippingZip,
  shippingInstructions,
  installationAddress,
  installationCity,
  installationState,
  installationZip,
  installationDate,
  installationTime,
  accessInstructions,
  contactOnSite,
  contactOnSitePhone,
  paymentMethod,
  signature_url,
  taxAmount,
}: {
  firstName: string
  lastName: string
  email: string
  phone: string
  organization: string
  orderId: number
  orderItems: Array<{
    product: { title: string }
    quantity: number
    price_at_time: number | string
  }>
  totalAmount: number | string
  installationPrice: number | string
  shippingAddress: string
  shippingCity: string
  shippingState: string
  shippingZip: string
  shippingInstructions?: string
  installationAddress?: string
  installationCity?: string
  installationState?: string
  installationZip?: string
  installationDate?: string
  installationTime?: string
  accessInstructions?: string
  contactOnSite?: string
  contactOnSitePhone?: string
  paymentMethod: string
  signature_url: string
  taxAmount: number | string
}) => {
  const formatPrice = (price: number | string) => {
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price
    return numericPrice.toFixed(2)
  }

  const formatAddress = (
    address: string,
    city: string,
    state: string,
    zip: string
  ) => {
    return `${address}, ${city}, ${state} ${zip}`
  }

  const itemsList = orderItems
    .map(
      (item) =>
        `<tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
            <div style="font-weight: 500;">${item.product.title}</div>
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: center;">${item.quantity}x</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">$${formatPrice(
            Number(item.price_at_time) * item.quantity
          )}</td>
        </tr>`
    )
    .join('')

  const getPaymentMethodDetails = (method: string) => {
    switch (method) {
      case 'cash':
        return 'Payment in cash required before delivery.'
      case 'check':
        return 'Please make check payable to "Way of Glory Media INC" and provide before delivery.'
      case 'direct_deposit':
        return `
          Bank: Chase Bank<br>
          Account Name: Way of Glory Media INC<br>
          Account Number: XXXX-XXXX-XXXX<br>
          Routing Number: XXXXXXXX<br>
          <em>Please include your order number (#${orderId}) in the transfer description</em>
        `
      default:
        return ''
    }
  }

  try {
    // Verify email configuration
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      throw new Error('Email configuration is missing')
    }

    // Convert base64 signature to buffer
    let signatureBuffer: Buffer | undefined
    if (signature_url && signature_url.includes('base64,')) {
      const signatureData = signature_url.split(';base64,').pop()
      if (signatureData) {
        signatureBuffer = Buffer.from(signatureData, 'base64')
      }
    }

    const emailContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #374151;">
        <div style="text-align: center; padding: 32px 16px; background: linear-gradient(135deg, #2563eb, #1d4ed8); border-radius: 16px 16px 0 0;">
          <img src="https://wayofglory.com/images/logo/logo.png" alt="Way of Glory Media" style="width: 180px; max-width: 80%; height: auto; display: block; margin: 0 auto;">
        </div>
        
        <div style="padding: 32px 24px; background-color: #ffffff;">
          <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 20px;">
            Thank you for your order, ${firstName}!
          </h1>
          
          <p style="color: #666; margin-bottom: 30px;">
            We're excited to confirm your order #${orderId}. Below you'll find your order details.
          </p>

          <div style="margin-bottom: 20px;">
            <h3 style="font-size: 16px; color: #1a1a1a; margin-bottom: 12px;">Customer Information</h3>
            <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px;">
              <p style="margin: 0 0 8px 0;">
                <strong>Name:</strong> ${firstName} ${lastName}
              </p>
              ${
                organization
                  ? `<p style="margin: 0 0 8px 0;">
                      <strong>Organization:</strong> ${organization}
                    </p>`
                  : ''
              }
              <p style="margin: 0 0 8px 0;">
                <strong>Email:</strong> ${email}
              </p>
              <p style="margin: 0;">
                <strong>Phone:</strong> ${phone}
              </p>
            </div>
          </div>

          <div style="margin-bottom: 20px;">
            <h3 style="font-size: 16px; color: #1a1a1a; margin-bottom: 12px;">Shipping Information</h3>
            <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px;">
              <p style="margin: 0 0 8px 0;">
                <strong>Shipping Address:</strong><br>
                ${formatAddress(
                  shippingAddress,
                  shippingCity,
                  shippingState,
                  shippingZip
                )}
              </p>
              ${
                shippingInstructions
                  ? `<p style="margin: 0;">
                      <strong>Shipping Instructions:</strong><br>
                      ${shippingInstructions}
                    </p>`
                  : ''
              }
            </div>
          </div>

          ${installationAddress ? `
            <div style="margin-bottom: 20px;">
              <h3 style="font-size: 16px; color: #1a1a1a; margin-bottom: 12px;">Installation Details</h3>
              <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px;">
                <p style="margin: 0 0 8px 0;"><strong>Installation Address:</strong><br>
                  ${formatAddress(
                    installationAddress,
                    installationCity!,
                    installationState!,
                    installationZip!
                  )}
                </p>
                <p style="margin: 0 0 8px 0;"><strong>Scheduled Date & Time:</strong><br>
                  ${new Date(installationDate!).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })} at ${installationTime}
                </p>
                <p style="margin: 0 0 8px 0;"><strong>On-site Contact:</strong><br>
                  Name: ${contactOnSite}<br>
                  Phone: ${contactOnSitePhone}
                </p>
                ${
                  accessInstructions
                    ? `<p style="margin: 0;"><strong>Access Instructions:</strong><br>
                        ${accessInstructions}
                      </p>`
                    : ''
                }
              </div>
            </div>
          ` : ''}

          <div style="margin-bottom: 20px;">
            <h3 style="font-size: 16px; color: #1a1a1a; margin-bottom: 12px;">Order Summary</h3>
            <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px;">
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="border-bottom: 2px solid #e2e8f0;">
                    <th style="text-align: left; padding: 8px 0; color: #64748b; font-weight: 500;">Item</th>
                    <th style="text-align: center; padding: 8px 0; color: #64748b; font-weight: 500;">Quantity</th>
                    <th style="text-align: right; padding: 8px 0; color: #64748b; font-weight: 500;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsList}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="2" style="padding: 12px 0; text-align: right; font-weight: 500;">Subtotal:</td>
                    <td style="padding: 12px 0; text-align: right;">$${formatPrice(Number(totalAmount) - Number(taxAmount) - Number(installationPrice))}</td>
                  </tr>
                  ${Number(taxAmount) > 0 ? `
                    <tr>
                      <td colspan="2" style="padding: 12px 0; text-align: right; font-weight: 500;">Tax:</td>
                      <td style="padding: 12px 0; text-align: right;">$${formatPrice(taxAmount)}</td>
                    </tr>
                  ` : ''}
                  ${Number(installationPrice) > 0 ? `
                    <tr>
                      <td colspan="2" style="padding: 12px 0; text-align: right; font-weight: 500;">Installation:</td>
                      <td style="padding: 12px 0; text-align: right;">$${formatPrice(installationPrice)}</td>
                    </tr>
                  ` : ''}
                  <tr>
                    <td colspan="2" style="padding: 16px 0 0 0; text-align: right; font-weight: 600; border-top: 2px solid #e2e8f0;">Total:</td>
                    <td style="padding: 16px 0 0 0; text-align: right; font-weight: 600; color: #2563eb; font-size: 18px;">$${formatPrice(totalAmount)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div style="margin-bottom: 20px;">
            <h3 style="font-size: 16px; color: #1a1a1a; margin-bottom: 12px;">Payment Information</h3>
            <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px;">
              <p style="margin: 0 0 8px 0;">
                <strong>Payment Method:</strong> ${paymentMethod.replace('_', ' ').charAt(0).toUpperCase() + paymentMethod.slice(1).replace('_', ' ')}
              </p>
              <p style="margin: 0; color: #666;">
                ${getPaymentMethodDetails(paymentMethod)}
              </p>
            </div>
          </div>

          ${signatureBuffer ? `
            <div style="margin-bottom: 20px;">
              <h3 style="font-size: 16px; color: #1a1a1a; margin-bottom: 12px;">Customer Signature</h3>
              <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px;">
                <img 
                  src="cid:signature@wayofglory.com"
                  alt="Customer Signature" 
                  style="max-width: 100%; height: auto; display: block; margin: 0 auto; background: white;"
                />
                <p style="margin: 8px 0 0 0; text-align: center; color: #666; font-size: 12px;">
                  Signed electronically on ${new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
          ` : ''}
        </div>

        <div style="text-align: center; padding: 40px 24px; background: linear-gradient(to bottom, #f8fafc, #f1f5f9); border-top: 1px solid #e2e8f0; border-radius: 0 0 16px 16px;">
          <img src="https://wayofglory.com/images/logo/LogoLight.png" alt="Way of Glory Media" style="width: 140px; height: auto; display: block; margin: 0 auto 32px; opacity: 0.85;">
          <p style="margin: 0 0 20px 0; color: #475569; font-size: 15px; font-weight: 500;">Questions? Contact our support team:</p>
          <div style="margin-bottom: 32px; text-align: center;">
            <a href="mailto:help@wayofglory.com" style="color: #2563eb; text-decoration: none; font-weight: 500; padding: 8px 16px; border-radius: 8px; background: rgba(37, 99, 235, 0.05); white-space: nowrap; display: inline-block; margin: 4px;">help@wayofglory.com</a>
            <a href="tel:+13108729781" style="color: #2563eb; text-decoration: none; font-weight: 500; padding: 8px 16px; border-radius: 8px; background: rgba(37, 99, 235, 0.05); white-space: nowrap; display: inline-block; margin: 4px;">(310) 872-9781</a>
            <a href="https://wayofglory.com" style="color: #2563eb; text-decoration: none; font-weight: 500; padding: 8px 16px; border-radius: 8px; background: rgba(37, 99, 235, 0.05); white-space: nowrap; display: inline-block; margin: 4px;">wayofglory.com</a>
          </div>
          <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b; font-weight: 500;">© ${new Date().getFullYear()} Way of Glory Media. All rights reserved.</p>
          <p style="margin: 0; font-size: 12px; color: #94a3b8; font-weight: 400;">Dedicated to serving churches and non-profits with excellence</p>
        </div>
      </div>
    `

    const mailOptions = {
      from: {
        name: 'Way of Glory Media',
        address: 'help@wayofglory.com'
      },
      to: email,
      subject: `Your Way of Glory Order #${orderId} Confirmation`,
      attachments: [
        ...(signatureBuffer ? [{
          filename: 'signature.png',
          content: signatureBuffer,
          cid: 'signature@wayofglory.com'
        }] : [])
      ],
      html: emailContent,
    }

    await transporter.sendMail(mailOptions)
  } catch (error) {
    console.error('Error sending email:', error)
    throw new Error('Failed to send confirmation email')
  }
}

export const sendQuoteEmail = async ({
  email,
  products,
  totalAmount,
  installationPrice,
  taxAmount,
}: {
  email: string;
  products: Array<{
    title: string;
    quantity: number;
    price: number;
    imageUrl: string | null;
  }>;
  totalAmount: number;
  installationPrice: number;
  taxAmount: number;
}) => {
  try {
    // Verify email configuration
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      throw new Error('Email configuration is missing');
    }

    const formatPrice = (price: number) => price.toFixed(2);

    const itemsList = products
      .map(
        (item) => `
          <div style="display: flex; align-items: center; padding: 16px; background-color: #f9fafb; border-radius: 8px; margin-bottom: 8px;">
            ${item.imageUrl ? `
              <div style="width: 80px; height: 80px; margin-right: 16px; flex-shrink: 0;">
                <img src="${item.imageUrl}" alt="${item.title}" style="width: 100%; height: 100%; object-fit: contain; border-radius: 4px; background-color: white; padding: 8px; border: 1px solid #e5e7eb;" />
              </div>
            ` : ''}
            <div style="flex: 1;">
              <div style="font-weight: 500; color: #1a1a1a; margin-bottom: 4px;">
                ${item.title}
              </div>
              <div style="font-size: 14px; color: #666;">
                Quantity: ${item.quantity}
              </div>
            </div>
            <div style="text-align: right;">
              <div style="font-weight: 600; color: #2563eb;">
                $${formatPrice(item.price * item.quantity)}
              </div>
              <div style="font-size: 12px; color: #666;">
                $${formatPrice(item.price)} each
              </div>
            </div>
          </div>
        `
      )
      .join('');

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'Your Way of Glory Quote',
      html: `
        <div style="font-family: 'Segoe UI', system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 16px;">
          <!-- Header with Logo -->
          <div style="text-align: center; margin-bottom: 32px;">
            <img src="${process.env.NEXT_PUBLIC_BASE_URL}/images/logo.png" alt="Way of Glory" style="height: 40px; margin-bottom: 24px;" />
            <h1 style="color: #1a1a1a; font-size: 28px; font-weight: 600; margin: 0 0 8px 0;">
              Your Quote from Way of Glory
            </h1>
            <p style="color: #666; font-size: 16px; margin: 0;">
              Thank you for your interest in our products.
            </p>
          </div>

          <!-- Quote Details -->
          <div style="margin-bottom: 32px;">
            <div style="background-color: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden;">
              <!-- Products List -->
              <div style="padding: 24px;">
                <h2 style="font-size: 18px; font-weight: 600; color: #1a1a1a; margin: 0 0 16px 0;">
                  Quote Summary
                </h2>
                ${itemsList}
              </div>

              <!-- Totals -->
              <div style="border-top: 1px solid #e5e7eb; padding: 24px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="color: #666;">Subtotal:</span>
                  <span style="font-weight: 500; color: #1a1a1a;">
                    $${formatPrice(totalAmount - taxAmount - installationPrice)}
                  </span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="color: #666;">Sales Tax:</span>
                  <span style="font-weight: 500; color: #1a1a1a;">
                    $${formatPrice(taxAmount)}
                  </span>
                </div>
                ${installationPrice > 0 ? `
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #666;">Installation:</span>
                    <span style="font-weight: 500; color: #1a1a1a;">
                      $${formatPrice(installationPrice)}
                    </span>
                  </div>
                ` : ''}
                <div style="display: flex; justify-content: space-between; padding-top: 12px; border-top: 1px solid #e5e7eb; margin-top: 12px;">
                  <span style="font-weight: 600; color: #1a1a1a;">Total:</span>
                  <span style="font-weight: 600; color: #2563eb; font-size: 18px;">
                    $${formatPrice(totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Additional Information -->
          <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
            <h3 style="font-size: 16px; font-weight: 600; color: #1a1a1a; margin: 0 0 16px 0;">
              Important Information
            </h3>
            <ul style="margin: 0; padding: 0; list-style: none;">
              <li style="display: flex; align-items: center; color: #666; margin-bottom: 12px;">
                <span style="display: inline-block; width: 6px; height: 6px; background-color: #2563eb; border-radius: 50%; margin-right: 12px;"></span>
                This quote is valid for 30 days
              </li>
              <li style="display: flex; align-items: center; color: #666; margin-bottom: 12px;">
                <span style="display: inline-block; width: 6px; height: 6px; background-color: #2563eb; border-radius: 50%; margin-right: 12px;"></span>
                All prices include standard delivery
              </li>
              <li style="display: flex; align-items: center; color: #666;">
                <span style="display: inline-block; width: 6px; height: 6px; background-color: #2563eb; border-radius: 50%; margin-right: 12px;"></span>
                Installation services available upon request
              </li>
            </ul>
          </div>

          <!-- Call to Action -->
          <div style="text-align: center;">
            <p style="color: #666; margin-bottom: 24px;">
              Ready to proceed with your order or have questions?
            </p>
            <div>
              <a href="mailto:${process.env.GMAIL_USER}" style="display: inline-block; background-color: #2563eb; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 500;">
                Contact Us
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="text-align: center; margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
            <p style="color: #666; font-size: 14px; margin: 0;">
              © ${new Date().getFullYear()} Way of Glory. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending quote email:', error);
    throw new Error('Failed to send quote email');
  }
};

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });

  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to,
    subject,
    html,
  });
} 