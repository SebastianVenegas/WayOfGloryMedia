import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

interface Payment {
  id: number
  order_id: number
  amount: number
  payment_method: string
  notes?: string
  created_at: Date
  payment_type?: 'initial' | 'installment' | 'full'
  confirmation_details?: {
    zelle_confirmation?: string
    paypal_transaction_id?: string
  }
}

interface Order {
  id: number
  total_amount: number | string
  payment_history: Payment[]
  total_paid: number
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const orderId = Number(url.pathname.split('/').slice(-2, -1)[0]);
    
    console.log('Fetching payments for order:', orderId);

    if (isNaN(orderId) || orderId <= 0) {
      console.error('Invalid order ID:', orderId);
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const { rows } = await sql`
      SELECT 
        payment_history,
        total_paid,
        total_amount,
        installment_amount,
        number_of_installments
      FROM orders 
      WHERE id = ${orderId}
    `;

    if (rows.length === 0) {
      console.error('Order not found:', orderId);
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const result = {
      success: true,
      payment_history: rows[0].payment_history || [],
      total_paid: rows[0].total_paid || 0,
      total_amount: rows[0].total_amount || 0,
      installment_amount: rows[0].installment_amount,
      number_of_installments: rows[0].number_of_installments
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json({ 
      error: "Failed to fetch payments",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const orderId = Number(url.pathname.split('/').slice(-2, -1)[0]);

    if (isNaN(orderId) || orderId <= 0) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const { amount, paymentMethod, notes, confirmation, paymentType, installmentAmount } = await request.json();

    if (!amount || !paymentMethod) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return NextResponse.json({ 
        error: "Invalid payment amount", 
        details: "Payment amount must be greater than 0" 
      }, { status: 400 });
    }

    // Validate confirmation details
    if (paymentMethod === 'zelle' && !confirmation?.zelle_confirmation) {
      return NextResponse.json({ error: "Zelle confirmation code is required" }, { status: 400 });
    }

    if (paymentMethod === 'paypal' && !confirmation?.paypal_transaction_id) {
      return NextResponse.json({ error: "PayPal transaction ID is required" }, { status: 400 });
    }

    // Fetch current order details
    const orderResult = await sql`
      SELECT 
        payment_history, 
        total_paid, 
        total_amount, 
        installment_amount,
        number_of_installments
      FROM orders
      WHERE id = ${orderId}
    `;

    if (orderResult.rows.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = orderResult.rows[0];
    const currentPaymentHistory = order.payment_history || [];
    const currentTotalPaid = parseFloat(order.total_paid) || 0;
    const totalAmount = parseFloat(order.total_amount);
    const remainingBalance = totalAmount - currentTotalPaid;

    // Validate payment amount against remaining balance
    if (paymentAmount > remainingBalance) {
      return NextResponse.json({ 
        error: "Payment amount exceeds remaining balance", 
        details: `Maximum payment allowed is $${remainingBalance.toFixed(2)}` 
      }, { status: 400 });
    }

    // Create new payment record
    const newPayment = {
      id: currentPaymentHistory.length + 1,
      order_id: orderId,
      amount: paymentAmount,
      payment_method: paymentMethod,
      notes: notes || '',
      created_at: new Date().toISOString(),
      payment_type: currentTotalPaid === 0 ? 'initial' : 'installment',
      confirmation_details: confirmation || {},
      installment_amount: order.installment_amount
    };

    // Update order with new payment
    const updatedPaymentHistory = [...currentPaymentHistory, newPayment];
    const newTotalPaid = currentTotalPaid + paymentAmount;
    const paymentStatus = newTotalPaid >= totalAmount ? 'completed' : 'partial';

    const { rows } = await sql`
      UPDATE orders
      SET 
        payment_history = ${JSON.stringify(updatedPaymentHistory)},
        total_paid = ${newTotalPaid},
        payment_status = ${paymentStatus},
        installment_amount = COALESCE(${installmentAmount}, installment_amount)
      WHERE id = ${orderId}
      RETURNING *
    `;

    return NextResponse.json({
      success: true,
      payment: newPayment,
      total_paid: newTotalPaid,
      payment_status: paymentStatus,
      remaining_balance: totalAmount - newTotalPaid,
      installment_amount: rows[0].installment_amount,
      number_of_installments: rows[0].number_of_installments
    });

  } catch (error) {
    console.error("Error recording payment:", error);
    return NextResponse.json({ 
      error: "Failed to record payment",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 