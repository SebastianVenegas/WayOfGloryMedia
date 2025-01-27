import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(req: Request) {
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
    const { name, email, churchName, message } = await req.json()

    // Validate input
    if (!name || !email || !churchName || !message) {
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
      subject: `New Consultation Request from ${churchName}`,
      html: `
        <h2>New Consultation Request</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Church:</strong> ${churchName}</p>
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
    console.error('General error:', error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
} 