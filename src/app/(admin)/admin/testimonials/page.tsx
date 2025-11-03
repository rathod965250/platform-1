import { TestimonialManager } from '@/components/landing/TestimonialsSection'

export default function AdminTestimonialsPage() {
  return (
    <div className="p-6">
      <TestimonialManager />
    </div>
  )
}

export const metadata = {
  title: 'Testimonials Management - CrackAtom Admin',
  description: 'Manage testimonials for the CrackAtom platform',
}