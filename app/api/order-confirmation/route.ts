import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(req: Request) {
  try {
    const { customerInfo, cartItems, paymentMethod, orderId } = await req.json()

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    })

    const mailOptions = {
      from: '"Way of Glory Sales" <Sales@WayofGlory.com>',
      to: customerInfo.email,
      subject: `Order Received! - Order #${orderId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #0A1A3B; text-align: center;">Order Received!</h1>
          <p style="text-align: center; color: #666;">Thank you for your order. We're processing it now.</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #0A1A3B; margin-bottom: 15px;">Order Summary</h2>
            <p style="color: #666; margin: 5px 0;">Order ID: #${orderId}</p>
            ${cartItems.map((item: { title: string; quantity: number; price: number }) => `
              <div style="margin: 15px 0; padding-bottom: 15px; border-bottom: 1px solid #eee;">
                <h3 style="color: #0A1A3B; margin: 0;">${item.title}</h3>
                <p style="color: #666; margin: 5px 0;">Quantity: ${item.quantity}</p>
                <p style="color: #666; margin: 5px 0;">Price: $${item.price}</p>
              </div>
            `).join('')}
          </div>

          <div style="margin: 20px 0;">
            <h2 style="color: #0A1A3B;">Next Steps</h2>
            <ol style="color: #666;">
              <li>We'll review your order and send a detailed confirmation within 24 hours.</li>
              <li>Once confirmed, we'll process your payment and prepare your order.</li>
              <li>Our team will contact you to arrange delivery and installation (if selected).</li>
            </ol>
          </div>

          <div style="text-align: center; margin-top: 30px; color: #666;">
            <p>If you have any questions, please contact us at <a href="mailto:Sales@WayofGlory.com" style="color: #0066cc;">Sales@WayofGlory.com</a></p>
          </div>
        </div>
      `
    }

    await transporter.sendMail(mailOptions)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending email:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
} 