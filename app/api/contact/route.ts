import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { formatEmailContent } from '@/lib/email-templates'

interface ContactFormData {
  name: string;
  email: string;
  churchName: string;
  message: string;
  subject?: string;
  type?: string;
}

export async function POST(request: Request) {
  // Check environment variables
  const gmailUser = process.env.GMAIL_USER
  const gmailPassword = process.env.GMAIL_APP_PASSWORD

  if (!gmailUser || !gmailPassword) {
    console.error('Missing email configuration:', { 
      hasUser: !!gmailUser, 
      hasPassword: !!gmailPassword 
    })
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    )
  }

  try {
    const formData = await request.json() as ContactFormData;
    const { name, email, churchName, message, subject, type } = formData;

    // Validate input
    if (!name || !email || !churchName || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      )
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: gmailUser,
        pass: gmailPassword
      }
    })

    try {
      await transporter.verify()
    } catch (verifyError) {
      console.error('Transporter verification failed:', verifyError)
      return NextResponse.json(
        { error: "Email service configuration error" },
        { status: 500 }
      )
    }

    const emailSubject = subject || `New ${type === 'quote_request' ? 'Quote' : 'Contact'} Request from ${churchName}`

    // Common variables for email templates
    const emailVariables = {
      firstName: name.split(' ')[0],
      lastName: name.split(' ').slice(1).join(' '),
      email,
      churchName,
      companyName: 'Way of Glory Media',
      supportEmail: 'help@wayofglory.com',
      supportPhone: '(310) 872-9781',
      websiteUrl: 'https://wayofglory.com',
      logoUrl: 'https://wayofglory.com/images/logo/logo.png',
      logoLightUrl: 'https://wayofglory.com/images/logo/LogoLight.png',
      logoNormalUrl: 'https://wayofglory.com/images/logo/logo.png',
      year: new Date().getFullYear(),
      baseUrl: 'https://wayofglory.com',
      isPWA: true
    };

    // Admin notification email content
    const adminEmailContent = `
      <h2>New ${type === 'quote_request' ? 'Quote' : 'Contact'} Request</h2>
      <div style="margin: 2em 0; padding: 24px; background-color: #f8fafc; border-radius: 12px;">
        <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #1e293b;">Contact Details</h3>
        <div style="margin-bottom: 12px;">
          <div style="font-weight: 500; color: #64748b;">Contact Name:</div>
          <div style="color: #1e293b; font-size: 16px;">${name}</div>
        </div>
        <div style="margin-bottom: 12px;">
          <div style="font-weight: 500; color: #64748b;">Church Name:</div>
          <div style="color: #1e293b; font-size: 16px;">${churchName}</div>
        </div>
        <div style="margin-bottom: 12px;">
          <div style="font-weight: 500; color: #64748b;">Email:</div>
          <div style="color: #1e293b; font-size: 16px;">${email}</div>
        </div>
        <div style="margin-bottom: 12px;">
          <div style="font-weight: 500; color: #64748b;">Message:</div>
          <div style="color: #1e293b; font-size: 16px; white-space: pre-wrap;">${message}</div>
        </div>
      </div>
      <p>Reply directly to this email to respond to ${name} from ${churchName}.</p>
    `;

    // User confirmation email content
    const userEmailContent = `
      <div class="content-wrapper">
        <div class="header">
          <img src="${emailVariables.logoNormalUrl}" alt="Way of Glory Media" style="width: 180px; margin: 0 auto;" />
        </div>
        
        <h2 style="color: #1e293b; font-size: 24px; font-weight: 600; margin-bottom: 20px;">Thank You for Contacting Way of Glory Media</h2>
        
        <p style="color: #475569; margin-bottom: 16px;">Dear ${name},</p>
        <p style="color: #475569; margin-bottom: 24px;">Thank you for reaching out to Way of Glory Media. We have received your message and our team will review it promptly.</p>
        
        <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin: 32px 0;">
          <h3 style="color: #1e293b; font-size: 18px; font-weight: 600; margin: 0 0 16px 0;">What's Next?</h3>
          <ul style="list-style-type: none; padding: 0; margin: 0;">
            <li style="display: flex; align-items: center; margin-bottom: 16px; color: #475569;">
              <div style="width: 24px; height: 24px; background-color: #2563eb; border-radius: 50%; margin-right: 12px; flex-shrink: 0;"></div>
              <span>Our team will review your requirements within 1-2 business days</span>
            </li>
            <li style="display: flex; align-items: center; margin-bottom: 16px; color: #475569;">
              <div style="width: 24px; height: 24px; background-color: #2563eb; border-radius: 50%; margin-right: 12px; flex-shrink: 0;"></div>
              <span>We'll prepare a personalized response based on your needs</span>
            </li>
            <li style="display: flex; align-items: center; color: #475569;">
              <div style="width: 24px; height: 24px; background-color: #2563eb; border-radius: 50%; margin-right: 12px; flex-shrink: 0;"></div>
              <span>We may reach out for additional information if needed</span>
            </li>
          </ul>
        </div>

        <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin: 32px 0;">
          <h3 style="color: #1e293b; font-size: 18px; font-weight: 600; margin: 0 0 16px 0;">Need Immediate Assistance?</h3>
          <p style="color: #475569; margin-bottom: 16px;">Our support team is available to help:</p>
          <div style="text-align: center;">
            <a href="mailto:help@wayofglory.com" style="color: #2563eb; text-decoration: none; font-weight: 500; display: block; margin-bottom: 8px;">help@wayofglory.com</a>
            <a href="tel:+13108729781" style="color: #2563eb; text-decoration: none; font-weight: 500; display: block;">(310) 872-9781</a>
          </div>
        </div>

        <div class="footer" style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px; margin-bottom: 8px;">© ${new Date().getFullYear()} Way of Glory Media. All rights reserved.</p>
          <div style="color: #6b7280; font-size: 14px;">
            <a href="mailto:help@wayofglory.com" style="color: #2563eb; text-decoration: none;">help@wayofglory.com</a> |
            <a href="tel:+13108729781" style="color: #2563eb; text-decoration: none;">(310) 872-9781</a> |
            <a href="https://wayofglory.com" style="color: #2563eb; text-decoration: none;">wayofglory.com</a>
          </div>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"Way of Glory Digital Services" <${gmailUser}>`,
      to: "help@wayofglory.com",
      replyTo: email,
      subject: emailSubject,
      html: formatEmailContent(adminEmailContent, emailVariables)
    }

    try {
      await transporter.sendMail(mailOptions)
      
      // Send confirmation email to the user
      const confirmationMailOptions = {
        from: `"Way of Glory Digital Services" <${gmailUser}>`,
        to: email,
        subject: 'Thank You for Contacting Way of Glory Media',
        html: formatEmailContent(userEmailContent, emailVariables)
      }
      
      await transporter.sendMail(confirmationMailOptions)
      
      return NextResponse.json({ 
        message: "Message sent successfully",
        details: "We've received your message and sent you a confirmation email."
      }, { status: 200 })
    } catch (sendError: any) {
      console.error('Error sending email:', {
        error: sendError.message,
        code: sendError.code,
        command: sendError.command
      })
      return NextResponse.json(
        { error: "Failed to send email. Please try again later." },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error processing contact form:', error);
    return NextResponse.json(
      { error: 'Failed to process your request. Please try again.' },
      { status: 500 }
    );
  }
} 