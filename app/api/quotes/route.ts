import { NextRequest, NextResponse } from 'next/server'
import { sendQuoteEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.email) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      )
    }

    if (!body.products || !body.products.length) {
      return NextResponse.json(
        { error: 'At least one product is required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email address format' },
        { status: 400 }
      )
    }

    // Add a delay to show loading state
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Send the quote email
    await sendQuoteEmail({
      email: body.email,
      products: body.products,
      totalAmount: body.totalAmount,
      installationPrice: body.installationPrice,
      taxAmount: body.taxAmount,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in quote creation:', error)
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('Email configuration is missing')) {
        return NextResponse.json(
          { error: 'Server configuration error. Please try again later.' },
          { status: 500 }
        )
      }
      
      if (error.message.includes('Failed to send quote email')) {
        return NextResponse.json(
          { error: 'Failed to send the quote email. Please try again.' },
          { status: 500 }
        )
      }
    }

    // Generic error response
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again later.' },
      { status: 500 }
    )
  }
} 