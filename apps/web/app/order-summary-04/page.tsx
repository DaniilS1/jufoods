import OrderSummary from '@/components/shadcn-studio/blocks/order-summary-04/order-summary-04'

const products = [
  {
    id: 'diorShoes',
    name: 'DIOR KAWS B33',
    category: 'sneaker',
    size: '6',
    quantity: 1,
    price: 120,
    image: 'https://cdn.shadcnstudio.com/ss-assets/blocks/ecommerce/order-summary/image-12.png'
  },
  {
    id: 'riderBag',
    name: 'Mini Rider 2.0 bag',
    category: 'bag',
    size: 'M',
    quantity: 1,
    price: 300,
    image: 'https://cdn.shadcnstudio.com/ss-assets/blocks/ecommerce/order-summary/image-11.png'
  },
  {
    id: 'diorJacket',
    name: 'Dior Oblique Cardigan',
    category: 'jacket',
    size: 'M',
    quantity: 1,
    price: 89,
    image: 'https://cdn.shadcnstudio.com/ss-assets/blocks/ecommerce/order-summary/image-10.png'
  }
]

const OrderSummaryPage = () => {
  return (
    <OrderSummary
      data={products}
      customerName='Christine Johnson'
      customerAddress='Street 91, Empire State, 350 Fifth Avenue, New York'
      customerMail='christine@gmail.com'
      customerNote='This durable and portable insulated tumbler will keep your beverages at the perfect temperature for
                  hours.'
    />
  )
}

export default OrderSummaryPage
