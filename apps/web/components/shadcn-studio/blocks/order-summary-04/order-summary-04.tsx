import { CreditCardIcon, FileTextIcon, MailIcon, MapPinIcon, ShoppingCartIcon, UserIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type OrderSummaryProps = {
  className?: string
  data: {
    id: string
    name: string
    category: string
    size: string
    price: number
    image: string
    quantity: number
  }[]
  customerName: string
  customerMail: string
  customerAddress: string
  customerNote: string
}

const OrderSummary = ({
  className,
  data,
  customerName,
  customerMail,
  customerAddress,
  customerNote
}: OrderSummaryProps) => {
  return (
    <section className={cn('bg-muted py-8 sm:py-16 lg:py-24', className)}>
      <div className='mx-auto px-4 sm:max-w-296 sm:px-6 lg:px-8'>
        <Card className='w-full'>
          <CardHeader>
            <CardTitle className='text-2xl'>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className='grid gap-10 py-6 md:grid-cols-2 lg:grid-cols-4'>
            <div className='space-y-8'>
              <h5 className='text-lg font-semibold'>Shipping & Billing info</h5>
              <div className='space-y-2.5'>
                <div className='flex items-center gap-2.5'>
                  <MailIcon className='size-5' />
                  <span className='font-medium'>Email Address</span>
                </div>
                <span className='text-muted-foreground'>{customerMail}</span>
              </div>
              <div className='space-y-2.5'>
                <div className='flex items-center gap-2.5'>
                  <MapPinIcon className='size-5' />
                  <span className='font-medium'>Shipping Address</span>
                </div>
                <span className='text-muted-foreground'>{customerAddress}</span>
              </div>
              <div className='space-y-2.5'>
                <div className='flex items-center gap-2.5'>
                  <UserIcon className='size-5' />
                  <span className='font-medium'>Name</span>
                </div>
                <span className='text-muted-foreground'>{customerName}</span>
              </div>
            </div>

            <div className='space-y-8'>
              <h5 className='text-lg font-semibold'>Payment Method</h5>
              <div className='space-y-2.5'>
                <div className='flex items-center gap-2.5'>
                  <CreditCardIcon className='size-5' />
                  <span className='font-medium'>Payment</span>
                </div>
                <span className='text-muted-foreground'>Cash On Delivery</span>
              </div>
              <div className='space-y-2.5'>
                <div className='flex items-center gap-2.5'>
                  <ShoppingCartIcon className='size-5' />
                  <span className='font-medium'>Shipping</span>
                </div>
                <span className='text-muted-foreground'>Post Service(1-3 Work Day)</span>
              </div>
              <div className='space-y-2.5'>
                <div className='flex items-center gap-2.5'>
                  <FileTextIcon className='size-5' />
                  <span className='font-medium'>Note</span>
                </div>
                <span className='text-muted-foreground'>{customerNote}</span>
              </div>
            </div>

            <div className='space-y-6 md:col-span-2'>
              <h5 className='text-lg font-semibold'>Items in Your Shopping Cart</h5>
              {data.map(content => (
                <div key={content.id} className='flex items-center justify-between gap-3.5'>
                  <div className='flex items-center gap-6'>
                    <img src={content.image} alt={content.name} className='size-21.5 rounded-md' />
                    <div className='flex flex-col gap-1.5'>
                      <h4 className='font-medium'>{content.name}</h4>
                      <span className='text-muted-foreground capitalize'>{content.category}</span>
                      <div className='flex items-center'>
                        <div className='border-muted-foreground flex items-center gap-1.5 border-r pr-2.5'>
                          <span className='font-semibold'>Size:</span>
                          <span className='text-muted-foreground'>{content.size}</span>
                        </div>
                        <div className='flex items-center gap-1.5 ps-2.5'>
                          <span className='font-semibold'>Qty:</span>
                          <span className='text-muted-foreground'>{content.quantity}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <span className='text-lg font-semibold'>${(content.price * content.quantity).toFixed(2)}</span>
                </div>
              ))}

              <div className='flex items-center justify-between rounded-md border px-4 py-3 text-lg font-semibold'>
                <span>Total Price</span>
                <span>${data.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className='justify-between gap-6 border-t max-sm:flex-col max-sm:items-start'>
            <div className='space-y-2.5 text-lg'>
              <p className='font-medium'>Thank you for shopping with us!</p>
              <span className='text-muted-foreground font-semibold'>Team shadcn/studio</span>
            </div>
            <Button size='lg'>Track Order</Button>
          </CardFooter>
        </Card>
      </div>
    </section>
  )
}

export default OrderSummary
