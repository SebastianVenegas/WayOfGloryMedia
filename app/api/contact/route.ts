import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(req: Request) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.error('Missing email configuration')
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    )
  }

  try {
    const { name, email, churchName, message } = await req.json()

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    })

    await transporter.verify()

    const mailOptions = {
      from: `"Santi Sounds" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER,
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

    await transporter.sendMail(mailOptions)
    return NextResponse.json({ message: "Email sent successfully" }, { status: 200 })
  } catch (error) {
    console.error('Error sending email:', error)
    return NextResponse.json(
      { error: "Failed to send email. Please try again later." },
      { status: 500 }
    )
  }
} 