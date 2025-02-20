import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import prisma from '@/lib/prisma'

interface CartItem {
  id: number
  title: string
  price: number
  quantity: number
  category?: string
  is_service?: boolean
  is_custom?: boolean
  addons?: {
    warranty: boolean
    installation: boolean
  }
}

export async function POST(req: Request) {
  try {
    // Validate request body
    if (!req.body) {
      return NextResponse.json({ error: 'Request body is required' }, { status: 400 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    const { 
      customerInfo, 
      cartItems, 
      paymentMethod, 
      orderId, 
      totalPrice,
      paymentPlan,
      dueToday,
      totalDueAfterFirst,
      paymentFrequency,
      initialPayment
    } = body;

    // Validate required fields
    if (!customerInfo || !cartItems || !paymentMethod || !orderId || !totalPrice) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        required: ['customerInfo', 'cartItems', 'paymentMethod', 'orderId', 'totalPrice']
      }, { status: 400 });
    }

    // Calculate payment status based on initial payment
    const payment_status = initialPayment.payment_type === 'full' ? 'completed' : 'partial';

    try {
      // Create the order in the database
      let orderData: any = {
        contract_number: orderId,
        first_name: customerInfo.fullName.split(' ')[0],
        last_name: customerInfo.fullName.split(' ')[1],
        email: customerInfo.email,
        phone: customerInfo.phone,
        shipping_address: customerInfo.shippingAddress,
        shipping_city: customerInfo.shippingCity,
        shipping_state: customerInfo.shippingState,
        shipping_zip: customerInfo.shippingZip,
        payment_method: paymentMethod,
        total_amount: totalPrice,
        total_paid: totalPrice,
        payment_status: initialPayment.payment_type === 'full' ? 'completed' : 'partial',
        status: 'pending',
        order_items: {
          create: cartItems.map((item: CartItem) => ({
            product_id: item.id,
            quantity: item.quantity,
            price_at_time: item.price
          }))
        },
      };

      if (initialPayment.amount > 0) {
        orderData.payments = {
          create: {
            amount: initialPayment.amount,
            payment_method: initialPayment.method,
            payment_type: initialPayment.payment_type,
            notes: initialPayment.notes,
            confirmation_details: {},
            installment_amount: initialPayment.installment_amount,
            number_of_installments: initialPayment.number_of_installments,
            down_payment: initialPayment.down_payment,
            payment_plan: initialPayment.payment_plan,
            total_amount: totalPrice
          }
        };
      }

      const order = await prisma.orders.create({ data: orderData as any });

      // Send confirmation email
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD
          }
        });

        await transporter.sendMail({
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
                ${cartItems.map((item: CartItem) => `
                  <div style="margin: 15px 0; padding-bottom: 15px; border-bottom: 1px solid #eee;">
                    <h3 style="color: #0A1A3B; margin: 0;">${item.title}</h3>
                    <p style="color: #666; margin: 5px 0;">Quantity: ${item.quantity}</p>
                    <p style="color: #666; margin: 5px 0;">Price: $${item.price}</p>
                  </div>
                `).join('')}
                
                <div style="margin-top: 20px; padding-top: 15px; border-top: 2px solid #eee;">
                  <h3 style="color: #0A1A3B; margin: 0;">Payment Details</h3>
                  <p style="color: #666; margin: 5px 0;">Payment Method: ${paymentMethod}</p>
                  <p style="color: #666; margin: 5px 0;">Payment Plan: ${paymentPlan === 'full' ? 'Paid in Full' : 'Installment Plan'}</p>
                  ${paymentPlan === 'installments' ? `
                    <p style="color: #666; margin: 5px 0;">Initial Payment: $${dueToday}</p>
                    <p style="color: #666; margin: 5px 0;">Remaining Balance: $${totalDueAfterFirst}</p>
                    <p style="color: #666; margin: 5px 0;">Payment Frequency: ${paymentFrequency}</p>
                  ` : ''}
                  <p style="color: #0A1A3B; font-weight: bold; margin: 10px 0;">Total Amount: $${totalPrice}</p>
                </div>
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
        });
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        // Continue with the response even if email fails
      }

      return NextResponse.json({ 
        success: true, 
        id: order.id,
        message: 'Order created successfully'
      });

    } catch (dbError: any) {
      console.error('Database error:', dbError);
      return NextResponse.json({ 
        error: 'Failed to create order in database',
        details: dbError?.message || 'Unknown database error'
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Error processing order:', error);
    return NextResponse.json({ 
      error: 'Failed to process order',
      details: error?.message || 'Unknown error'
    }, { status: 500 });
  }
} 