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
    const { items, customer, orderDetails, delivery } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Items are required' }, { status: 400 })
    }

    if (!customer?.fullName || !customer?.email) {
      return NextResponse.json({ error: 'Full name and email are required' }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Create order in database with all new fields
    const { data: order, error: dbError } = await supabase
      .from('orders')
      .insert({
        user_id: user?.id || null,
        customer_name: customer.fullName,
        customer_email: customer.email,
        customer_phone: customer.phoneOrSocial || null,
        customer_address: delivery?.deliveryCity
          ? `${delivery.deliveryCity}${delivery.deliveryPostalCode ? `, ${delivery.deliveryPostalCode}` : ''}`
          : customer.cityOfResidence || null,
        notes: JSON.stringify({
          orderDetails: orderDetails || {},
          delivery: delivery || {},
          referralSource: customer.referralSource || null,
          cityOfResidence: customer.cityOfResidence || null,
        }),
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
          <h3>Customer Information:</h3>
          <p><strong>Name:</strong> ${customer.fullName}</p>
          <p><strong>Email:</strong> ${customer.email}</p>
          <p><strong>Phone/Social:</strong> ${customer.phoneOrSocial || 'N/A'}</p>
          <p><strong>City of Residence:</strong> ${customer.cityOfResidence || 'N/A'}</p>
          <p><strong>Referral Source:</strong> ${customer.referralSource || 'N/A'}</p>
          <h3>Order Details:</h3>
          <p><strong>Dessert:</strong> ${orderDetails?.dessert || 'N/A'}</p>
          <p><strong>Number of People:</strong> ${orderDetails?.numberOfPeople || 'N/A'}</p>
          <p><strong>Event Date:</strong> ${orderDetails?.eventDate || 'N/A'}</p>
          <p><strong>Celebration Date:</strong> ${orderDetails?.celebrationDate || 'N/A'}</p>
          <p><strong>Time Needed:</strong> ${orderDetails?.timeNeeded || 'N/A'}</p>
          <h3>Delivery Information:</h3>
          <p><strong>Pickup/Delivery:</strong> ${delivery?.pickupOrDelivery === 'pickup' ? 'Pickup' : 'Delivery'}</p>
          ${delivery?.pickupOrDelivery === 'delivery' ? `
            <p><strong>Delivery City:</strong> ${delivery.deliveryCity || 'N/A'}</p>
            <p><strong>Postal Code:</strong> ${delivery.deliveryPostalCode || 'N/A'}</p>
          ` : ''}
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

