import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import nodemailer from 'nodemailer'

// Placeholder email configuration - to be configured later
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'user@example.com',
    pass: process.env.SMTP_PASS || 'password',
  },
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { items, customer } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Items are required' }, { status: 400 })
    }

    if (!customer?.name || !customer?.email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Create order in database
    const { data: order, error: dbError } = await supabase
      .from('orders')
      .insert({
        user_id: user?.id || null,
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone || null,
        customer_address: customer.address || null,
        notes: customer.notes || null,
        items: items,
        status: 'pending',
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    // Send email (placeholder - will work when SMTP is configured)
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@jufoods.com',
        to: process.env.ORDER_EMAIL || 'orders@jufoods.com',
        subject: `New Order #${order.id}`,
        html: `
          <h2>New Order Received</h2>
          <p><strong>Order ID:</strong> ${order.id}</p>
          <p><strong>Customer:</strong> ${customer.name}</p>
          <p><strong>Email:</strong> ${customer.email}</p>
          <p><strong>Phone:</strong> ${customer.phone || 'N/A'}</p>
          <p><strong>Address:</strong> ${customer.address || 'N/A'}</p>
          <p><strong>Notes:</strong> ${customer.notes || 'N/A'}</p>
          <h3>Items:</h3>
          <ul>
            ${items.map((item: any) => `<li>Product ID: ${item.productId}, Design: ${item.designId}, Quantity: ${item.quantity}</li>`).join('')}
          </ul>
        `,
      })
    } catch (emailError) {
      console.error('Email error (non-critical):', emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({ success: true, orderId: order.id }, { status: 201 })
  } catch (error) {
    console.error('Order submission error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

