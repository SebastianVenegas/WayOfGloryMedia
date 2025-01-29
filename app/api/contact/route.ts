import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { Resend } from 'resend'

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

interface ResendError {
  statusCode: number;
  message: string;
  name: string;
}

const resend = new Resend(process.env.RESEND_API_KEY);

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
    const { name, email, phone, message } = formData;

    // Validate input
    if (!name || !email || !phone || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // use SSL
      auth: {
        user: gmailUser,
        pass: gmailPassword
      },
      tls: {
        rejectUnauthorized: false // for testing only, remove in production
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

    const mailOptions = {
      from: `"WayofGlory Contact Form" <${gmailUser}>`,
      to: "paulovenegas2004@gmail.com",
      subject: `New Consultation Request from ${name}`,
      html: `
        <h2>New Consultation Request</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `
    }

    try {
      await transporter.sendMail(mailOptions)
      return NextResponse.json({ message: "Email sent successfully" }, { status: 200 })
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
    const resendError = error as ResendError;
    console.error('Error sending contact form:', resendError);
    return NextResponse.json(
      { 
        error: resendError.message || 'Failed to submit contact form',
        statusCode: resendError.statusCode || 500
      },
      { status: resendError.statusCode || 500 }
    );
  }
} 