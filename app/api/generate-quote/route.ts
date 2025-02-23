import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

interface QuoteProduct {
  id: string;
  title: string;
  price: number;
  our_price?: number;
  quantity: number;
  category: string;
  is_service?: boolean;
  is_custom?: boolean;
}

interface QuoteRequest {
  products: QuoteProduct[];
  email: string;
  installationPrice?: number;
}

export async function POST(request: Request) {
  try {
    const { products, email, installationPrice = 0 } = await request.json() as QuoteRequest;

    // Calculate totals
    const productSubtotal = products.reduce((sum, product) => 
      sum + (product.our_price || product.price) * product.quantity, 0
    );

    // Calculate tax (7.75%) only for non-service items
    const taxableAmount = products.reduce((sum, item) => {
      if (item.category === 'Services' || item.category === 'Services/Custom' || item.is_service || item.is_custom) {
        return sum;
      }
      return sum + ((item.our_price || item.price) * item.quantity);
    }, 0);
    
    const tax = taxableAmount * 0.0775;
    const totalAmount = productSubtotal + tax + installationPrice;

    // Generate quote HTML
    const quoteHtml = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .product { margin-bottom: 10px; }
            .totals { margin-top: 20px; border-top: 2px solid #eee; padding-top: 20px; }
            .total-line { display: flex; justify-content: space-between; margin: 5px 0; }
            .grand-total { font-weight: bold; font-size: 1.2em; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Way of Glory Media</h1>
              <h2>Quote Details</h2>
            </div>

            <div class="products">
              <h3>Products & Services</h3>
              ${products.map(product => `
                <div class="product">
                  <strong>${product.title}</strong> x ${product.quantity}<br>
                  Price: $${((product.our_price || product.price) * product.quantity).toFixed(2)}
                </div>
              `).join('')}
            </div>

            <div class="totals">
              <div class="total-line">
                <span>Products Subtotal:</span>
                <span>$${productSubtotal.toFixed(2)}</span>
              </div>
              <div class="total-line">
                <span>Sales Tax:</span>
                <span>$${tax.toFixed(2)}</span>
              </div>
              ${installationPrice > 0 ? `
                <div class="total-line">
                  <span>Installation (No Tax):</span>
                  <span>$${installationPrice.toFixed(2)}</span>
                </div>
              ` : ''}
              <div class="total-line grand-total">
                <span>Total:</span>
                <span>$${totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div style="margin-top: 30px;">
              <p>Thank you for your interest in Way of Glory Media. This quote is valid for 30 days.</p>
              <p>For any questions or to proceed with this quote, please contact us:</p>
              <p>Phone: (310) 872-9781<br>
              Email: help@wayofglory.com</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Set up email transporter
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    // Send email
    await transporter.sendMail({
      from: {
        name: 'Way of Glory Media',
        address: process.env.GMAIL_USER || ''
      },
      to: email,
      subject: 'Your Way of Glory Media Quote',
      html: quoteHtml
    });

    return NextResponse.json({
      success: true,
      message: 'Quote sent successfully',
      totals: {
        productSubtotal,
        tax,
        installationPrice,
        totalAmount
      }
    });
  } catch (error) {
    console.error('Error generating quote:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to generate quote' 
      }, 
      { status: 500 }
    );
  }
} 