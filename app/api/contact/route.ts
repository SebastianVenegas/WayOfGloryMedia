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
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1e293b; font-size: 20px; margin-bottom: 16px;">Thank You for Contacting Way of Glory Media</h2>
        
        <p style="color: #475569; margin-bottom: 12px;">Dear ${name},</p>
        <p style="color: #475569; margin-bottom: 16px;">Thank you for reaching out to Way of Glory Media. We have received your message and our team will review it promptly.</p>
        
        <div style="background-color: #f8fafc; padding: 16px; margin: 16px 0; border-radius: 8px;">
          <p style="color: #475569; margin-bottom: 8px;"><strong>Questions?</strong> Contact our support team:</p>
          <p style="color: #2563eb; margin: 4px 0;">
            Email: help@wayofglory.com<br>
            Phone: (310) 872-9781
          </p>
        </div>

        <div style="color: #6b7280; font-size: 14px; margin-top: 16px; text-align: center;">
          <p style="margin: 4px 0;">© ${new Date().getFullYear()} Way of Glory Media</p>
          <p style="margin: 4px 0;"><a href="https://wayofglory.com" style="color: #2563eb; text-decoration: none;">wayofglory.com</a></p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: {
        name: 'Way of Glory',
        address: gmailUser
      },
      to: "help@wayofglory.com",
      replyTo: email,
      subject: emailSubject,
      html: formatEmailContent(adminEmailContent, emailVariables)
    }

    try {
      // First, send notification to admin
      await transporter.sendMail(mailOptions)
      
      // Then, send confirmation to the user
      const confirmationMailOptions = {
        from: {
          name: 'Way of Glory',
          address: gmailUser
        },
        to: email,
        subject: 'Thank You for Contacting Way of Glory Media',
        html: formatEmailContent(userEmailContent, emailVariables)
      }
      
      // Send confirmation email
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