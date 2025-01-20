import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(req: Request) {
  try {
    const { name, email, churchName, message } = await req.json()

    // Create transporter with Gmail SMTP
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: 'paulo@santisounds.com',
        pass: 'scfmzhqvhqmhyfap'
      }
    })

    // Email content
    const mailOptions = {
      from: 'inquiries@thecelestestudios.com',
      to: 'paulo@santisounds.com',
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

    // Send email
    await transporter.sendMail(mailOptions)

    return NextResponse.json(
      { message: "Email sent successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error sending email:', error)
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    )
  }
} 