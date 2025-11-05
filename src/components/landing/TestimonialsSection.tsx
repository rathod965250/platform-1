'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Trash2, Edit, Plus } from 'lucide-react'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface Testimonial {
  text: string
  image: string
  name: string
  role: string
}

export interface DatabaseTestimonial {
  id: string
  text: string
  image_url: string
  name: string
  role: string
  company?: string
  rating: number
  is_featured: boolean
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

interface TestimonialFormData {
  text: string
  image_url: string
  name: string
  role: string
  company: string
  rating: number
  is_featured: boolean
  display_order: number
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Transform database data to component format
function transformTestimonialData(data: any[]): Testimonial[] {
  return data.map(item => ({
    text: item.text,
    image: item.image_url,
    name: item.name,
    role: item.company ? `${item.role} at ${item.company}` : item.role,
  }))
}

// Fetch all active testimonials
export async function fetchTestimonials(): Promise<Testimonial[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('testimonials')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch testimonials: ${error.message}`)
  }

  return data.map((item: DatabaseTestimonial): Testimonial => ({
    text: item.text,
    image: item.image_url,
    name: item.name,
    role: item.company ? `${item.role} at ${item.company}` : item.role,
  }))
}

// Fetch featured testimonials only
export async function fetchFeaturedTestimonials(): Promise<Testimonial[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('testimonials')
    .select('*')
    .eq('is_active', true)
    .eq('is_featured', true)
    .order('display_order', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch featured testimonials: ${error.message}`)
  }

  return data.map((item: DatabaseTestimonial): Testimonial => ({
    text: item.text,
    image: item.image_url,
    name: item.name,
    role: item.company ? `${item.role} at ${item.company}` : item.role,
  }))
}

// Internal fetch function for TestimonialsSection (with limit)
async function fetchTestimonialsForSection(supabase: ReturnType<typeof createClient>) {
  try {
    // Validate Supabase client
    if (!supabase) {
      console.error('❌ Supabase client is not initialized')
      return null
    }

    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Supabase environment variables missing:')
      console.error('  NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌ Missing')
      console.error('  NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✅' : '❌ Missing')
      return null
    }

    console.log('📡 Querying testimonials table...')
    console.log('🔗 Supabase URL:', supabaseUrl ? 'Configured' : 'Missing')
    
    const { data, error, status, statusText } = await supabase
      .from('testimonials')
      .select('text, image_url, name, role, company')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .limit(9) // Limit to 9 for the 3 columns

    if (error) {
      // Safely extract error information
      const errorInfo: Record<string, any> = {
        fullError: error
      }
      
      // Only add properties that exist
      if (error && typeof error === 'object') {
        if ('message' in error && error.message) {
          errorInfo.message = error.message
        }
        if ('details' in error && error.details) {
          errorInfo.details = error.details
        }
        if ('hint' in error && error.hint) {
          errorInfo.hint = error.hint
        }
        if ('code' in error && error.code) {
          errorInfo.code = error.code
        }
      }
      
      console.error('❌ Database query error:', errorInfo)
      
      // Check for specific error types
      const errorCode = error && typeof error === 'object' && 'code' in error ? error.code : null
      const errorMessage = error && typeof error === 'object' && 'message' in error ? error.message : null
      
      if (errorCode === '42P01') {
        console.error('❌ Table "testimonials" does not exist. Run the migration first.')
      } else if (errorCode === '42501') {
        console.error('❌ Permission denied. Check RLS policies for the testimonials table.')
      } else if (errorMessage && typeof errorMessage === 'string' && errorMessage.includes('JWT')) {
        console.error('❌ Authentication error. Check Supabase anon key.')
      }
      
      if (status || statusText) {
        console.error('Response status:', status, statusText)
      }
      return null
    }

    if (!data) {
      console.warn('⚠️ Query returned null data')
      return null
    }

    if (data.length === 0) {
      console.warn('⚠️ Query returned empty array - no active testimonials found')
      return null
    }

    console.log(`✅ Found ${data.length} active testimonials in database`)
    const transformed = transformTestimonialData(data)
    console.log('✅ Transformed testimonials:', transformed.length)
    return transformed
  } catch (error) {
    console.error('❌ Exception in fetchTestimonialsForSection:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    return null
  }
}

// ============================================================================
// FALLBACK DATA
// ============================================================================

const fallbackTestimonials: Testimonial[] = [
  {
    text: "CrackAtom transformed my aptitude test preparation completely. The AI-powered practice sessions helped me identify weak areas and improve systematically. I scored 95th percentile!",
    image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face",
    name: "Priya Sharma",
    role: "Software Engineer at TCS",
  },
  {
    text: "The personalized learning path was exactly what I needed. Within 3 weeks, my problem-solving speed doubled and accuracy improved by 40%. Highly recommend!",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
    name: "Rahul Kumar",
    role: "Data Analyst at Infosys",
  },
  {
    text: "I was struggling with quantitative aptitude for months. CrackAtom's adaptive algorithm made practice sessions so effective that I cleared 4 company tests in a row!",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
    name: "Anita Desai",
    role: "Business Analyst at Wipro",
  },
  {
    text: "The mock tests felt exactly like real placement exams. The detailed analytics helped me understand my performance patterns. Got placed in my dream company!",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
    name: "Arjun Patel",
    role: "Product Manager at Microsoft",
  },
  {
    text: "CrackAtom's logical reasoning modules are outstanding. The step-by-step explanations helped me master complex problems. My confidence skyrocketed!",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face",
    name: "Sneha Gupta",
    role: "Consultant at Deloitte",
  },
  {
    text: "From scoring 60% to 92% in just 6 weeks! The AI recommendations were spot-on and the progress tracking kept me motivated throughout my preparation journey.",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=face",
    name: "Vikram Singh",
    role: "Financial Analyst at Goldman Sachs",
  },
  {
    text: "The verbal ability section was my weakness, but CrackAtom's targeted practice made it my strength. The platform adapts perfectly to your learning style.",
    image: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=400&h=400&fit=crop&crop=face",
    name: "Meera Reddy",
    role: "Marketing Executive at Unilever",
  },
  {
    text: "Best investment I made for my career! The comprehensive question bank and real-time performance analysis gave me the edge I needed in competitive exams.",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face",
    name: "Karthik Nair",
    role: "Software Developer at Amazon",
  },
  {
    text: "CrackAtom's approach to aptitude preparation is revolutionary. The personalized feedback and adaptive difficulty made learning enjoyable and highly effective.",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face",
    name: "Divya Joshi",
    role: "Data Scientist at Google",
  },
];

// ============================================================================
// UI COMPONENT: TestimonialsColumn (Animated Scrolling Column)
// ============================================================================

function TestimonialsColumn(props: {
  className?: string
  testimonials: Testimonial[]
  duration?: number
}) {
  // Return early if no testimonials
  if (!props.testimonials || props.testimonials.length === 0) {
    return null
  }

  // Duplicate testimonials for seamless infinite scroll (need at least 2 copies)
  // This ensures smooth continuous scrolling
  const duplicatedTestimonials = [...props.testimonials, ...props.testimonials]

  return (
    <div className={props.className}>
      <motion.div
        animate={{
          translateY: "-50%",
        }}
        transition={{
          duration: props.duration || 10,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-4 sm:gap-5 md:gap-6 pb-6 bg-background"
      >
        {duplicatedTestimonials.map((testimonial, i) => {
          // Create stable unique key for each testimonial instance
          const uniqueKey = `${testimonial.name}-${i}-${testimonial.text.slice(0, 20)}`
          return (
            <div 
              key={uniqueKey}
              className="p-4 sm:p-6 md:p-8 lg:p-10 rounded-2xl sm:rounded-3xl border shadow-lg shadow-primary/10 max-w-xs sm:max-w-sm md:max-w-xs lg:max-w-sm w-full bg-card mx-auto sm:mx-0"
            >
              <div className="text-foreground text-sm sm:text-base md:text-sm lg:text-base leading-relaxed">{testimonial.text}</div>
              <div className="flex items-center gap-2 sm:gap-3 mt-4 sm:mt-5">
                <img
                  width={40}
                  height={40}
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="h-8 w-8 sm:h-10 sm:w-10 md:h-9 md:w-9 lg:h-10 lg:w-10 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="font-medium tracking-tight leading-tight sm:leading-5 text-foreground text-xs sm:text-sm md:text-xs lg:text-sm truncate">{testimonial.name}</div>
                  <div className="leading-tight sm:leading-5 opacity-60 tracking-tight text-muted-foreground text-xs sm:text-sm truncate">{testimonial.role}</div>
                </div>
              </div>
            </div>
          )
        })}
      </motion.div>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT: TestimonialsSection (Landing Page Section with Realtime)
// ============================================================================

export function TestimonialsSection() {
  // Start with empty array - will be populated from database
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [useFallback, setUseFallback] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch by only rendering content after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    let supabase: ReturnType<typeof createClient> | null = null
    let channel: any = null

    try {
      supabase = createClient()
      if (!supabase) {
        console.error('❌ Failed to create Supabase client')
        setTestimonials(fallbackTestimonials)
        setUseFallback(true)
        setLoading(false)
        return
      }
    } catch (error) {
      console.error('❌ Error creating Supabase client:', error)
      setTestimonials(fallbackTestimonials)
      setUseFallback(true)
      setLoading(false)
      return
    }

    async function loadTestimonials() {
      if (!supabase) {
        console.error('❌ Supabase client not available')
        setTestimonials(fallbackTestimonials)
        setUseFallback(true)
        setLoading(false)
        return
      }

      try {
        console.log('🔄 Fetching testimonials from database...')
        const data = await fetchTestimonialsForSection(supabase)
        
        if (data && data.length > 0) {
          console.log('✅ Successfully loaded', data.length, 'testimonials from database')
          setTestimonials(data)
          setUseFallback(false)
        } else {
          console.warn('⚠️ No active testimonials found in database')
          console.log('📊 Checking if database query succeeded but returned empty...')
          
          // Double-check: try to query without limit to see if any testimonials exist
          const { data: allData, error: checkError } = await supabase
          .from('testimonials')
            .select('id, is_active')
            .limit(1)
          
          if (checkError) {
            // Safely log error information
            const errorInfo = checkError && typeof checkError === 'object'
              ? {
                  message: 'message' in checkError ? checkError.message : undefined,
                  code: 'code' in checkError ? checkError.code : undefined,
                  details: 'details' in checkError ? checkError.details : undefined,
                  fullError: checkError
                }
              : checkError
            console.error('❌ Database query error:', errorInfo)
            console.log('📦 Using fallback testimonials due to database error')
            setTestimonials(fallbackTestimonials)
            setUseFallback(true)
          } else if (allData && allData.length === 0) {
            console.warn('⚠️ No testimonials in database table at all')
            console.log('📦 Using fallback testimonials - no database content')
            setTestimonials(fallbackTestimonials)
            setUseFallback(true)
          } else {
            console.warn('⚠️ Testimonials exist but none are active (is_active = true)')
            console.log('📦 Using fallback testimonials - no active testimonials')
          setTestimonials(fallbackTestimonials)
            setUseFallback(true)
          }
        }
      } catch (error) {
        console.error('❌ Error fetching testimonials:', error)
        console.log('📦 Using fallback testimonials due to error')
        setTestimonials(fallbackTestimonials)
        setUseFallback(true)
      } finally {
        setLoading(false)
      }
    }

    // Initial load
    loadTestimonials()

    // Set up realtime subscription for live updates (optional - gracefully handles errors)
    // Listen to all changes on testimonials table (no filter - we filter when refetching)
    try {
      channel = supabase
        .channel('testimonials-realtime')
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to INSERT, UPDATE, DELETE
            schema: 'public',
            table: 'testimonials',
          },
          async (payload) => {
            console.log('🔄 Realtime event received:', payload.eventType, payload.new || payload.old)
            
            // Small delay to ensure database is updated
            await new Promise(resolve => setTimeout(resolve, 100))
            
            // Refetch testimonials when any change occurs
            // This ensures we get the latest data with proper filtering and ordering
            try {
              const data = await fetchTestimonialsForSection(supabase)
              if (data && data.length > 0) {
                console.log('✅ Testimonials updated in realtime:', data.length, 'items')
                setTestimonials(data)
                setUseFallback(false) // Switch to database data when available
              } else {
                // Keep current state if no active testimonials (don't switch to fallback if we're already using it)
                console.log('⚠️ No active testimonials after realtime update')
                // Only use fallback if we don't have any testimonials at all
                setTestimonials((prev) => {
                  if (prev.length === 0) {
                    console.log('📦 Switching to fallback testimonials')
                    return fallbackTestimonials
                  }
                  return prev
                })
                setUseFallback((prev) => {
                  // Check if we should use fallback based on current state
                  return prev
                })
              }
            } catch (error) {
              console.error('❌ Error refreshing testimonials:', error)
              // On error, keep current state, don't overwrite with fallback
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ Realtime subscription active for testimonials table')
          } else if (status === 'CHANNEL_ERROR') {
            // Realtime is not enabled - this is optional, so just log a warning
            console.warn('⚠️ Realtime not available - testimonials will still work, just without live updates. To enable: Supabase Dashboard → Database → Replication → Enable for testimonials table')
          } else if (status === 'TIMED_OUT') {
            console.warn('⚠️ Realtime subscription timed out - testimonials will still work normally')
          } else if (status === 'CLOSED') {
            console.log('ℹ️ Realtime subscription closed')
          }
        })
    } catch (error) {
      // Realtime subscription failed - component will still work without live updates
      console.warn('⚠️ Could not set up realtime subscription - testimonials will still work normally:', error)
      channel = null
    }

    // Cleanup subscription on unmount
    return () => {
      if (channel) {
        console.log('🔌 Unsubscribing from realtime channel')
        supabase.removeChannel(channel)
      }
    }
  }, [])

  // Split testimonials into three columns for animation
  // Ensure we have enough testimonials to fill all columns
  const firstColumn = testimonials.slice(0, Math.min(3, testimonials.length))
  const secondColumn = testimonials.slice(3, Math.min(6, testimonials.length))
  const thirdColumn = testimonials.slice(6, Math.min(9, testimonials.length))

  // Prevent hydration mismatch - show loading state until mounted
  if (!mounted || loading) {
    return (
      <section className="bg-background my-10 sm:my-16 md:my-20 relative px-4 sm:px-6 lg:px-8">
        <div className="container z-10 mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-center max-w-[540px] mx-auto px-4 sm:px-6">
            <div className="flex justify-center">
              <div className="border py-1 px-3 sm:px-4 rounded-lg text-xs sm:text-sm">Testimonials</div>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tighter mt-4 sm:mt-5 text-center px-4">
              What our users say
            </h2>
            <p className="text-center mt-3 sm:mt-4 md:mt-5 opacity-75 text-sm sm:text-base md:text-lg px-4">
              Loading testimonials...
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-background my-10 sm:my-16 md:my-20 relative px-4 sm:px-6 lg:px-8">
      <div className="container z-10 mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="flex flex-col items-center justify-center max-w-[540px] mx-auto px-4 sm:px-6"
        >
          <div className="flex justify-center">
            <div className="border py-1 px-3 sm:px-4 rounded-lg text-xs sm:text-sm">Testimonials</div>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tighter mt-4 sm:mt-5 text-center px-4">
            What our users say
          </h2>
          <p className="text-center mt-3 sm:mt-4 md:mt-5 opacity-75 text-sm sm:text-base md:text-lg px-4">
            See what our students have to say about their success stories.
          </p>
        </motion.div>

        {testimonials.length > 0 ? (
          <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 lg:gap-8 mt-6 sm:mt-8 md:mt-10 [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)] max-h-[600px] sm:max-h-[700px] md:max-h-[740px] overflow-hidden px-2 sm:px-4">
            <TestimonialsColumn testimonials={firstColumn} duration={15} />
            <TestimonialsColumn testimonials={secondColumn} className="hidden sm:block" duration={19} />
            <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={17} />
          </div>
        ) : null}
      </div>
    </section>
  )
}

// ============================================================================
// ADMIN COMPONENT: TestimonialManager (Admin Panel)
// ============================================================================

const initialFormData: TestimonialFormData = {
  text: '',
  image_url: '',
  name: '',
  role: '',
  company: '',
  rating: 5,
  is_featured: false,
  display_order: 0
}

export function TestimonialManager() {
  const [testimonials, setTestimonials] = useState<DatabaseTestimonial[]>([])
  const [formData, setFormData] = useState<TestimonialFormData>(initialFormData)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    fetchTestimonials()
  }, [])

  async function fetchTestimonials() {
    try {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('display_order', { ascending: true })

      if (error) throw error
      setTestimonials(data || [])
    } catch (error) {
      console.error('Error fetching testimonials:', error)
      toast.error('Failed to fetch testimonials')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      if (editingId) {
        // Update existing testimonial
        const { error } = await supabase
          .from('testimonials')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingId)

        if (error) throw error
        toast.success('Testimonial updated successfully')
      } else {
        // Create new testimonial
        const { error } = await supabase
          .from('testimonials')
          .insert([formData])

        if (error) throw error
        toast.success('Testimonial created successfully')
      }

      setFormData(initialFormData)
      setEditingId(null)
      fetchTestimonials()
    } catch (error) {
      console.error('Error saving testimonial:', error)
      toast.error('Failed to save testimonial')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this testimonial?')) return

    try {
      const { error } = await supabase
        .from('testimonials')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Testimonial deleted successfully')
      fetchTestimonials()
    } catch (error) {
      console.error('Error deleting testimonial:', error)
      toast.error('Failed to delete testimonial')
    }
  }

  function handleEdit(testimonial: DatabaseTestimonial) {
    setFormData({
      text: testimonial.text,
      image_url: testimonial.image_url,
      name: testimonial.name,
      role: testimonial.role,
      company: testimonial.company || '',
      rating: testimonial.rating,
      is_featured: testimonial.is_featured,
      display_order: testimonial.display_order
    })
    setEditingId(testimonial.id)
  }

  function resetForm() {
    setFormData(initialFormData)
    setEditingId(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Testimonial Manager</h2>
        <Button onClick={resetForm} variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Add New
        </Button>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? 'Edit' : 'Add'} Testimonial</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="image_url">Image URL</Label>
                <Input
                  id="image_url"
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="rating">Rating (1-5)</Label>
                <Input
                  id="rating"
                  type="number"
                  min="1"
                  max="5"
                  value={formData.rating}
                  onChange={(e) => setFormData(prev => ({ ...prev, rating: parseInt(e.target.value) }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) }))}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="text">Testimonial Text</Label>
              <Textarea
                id="text"
                value={formData.text}
                onChange={(e) => setFormData(prev => ({ ...prev, text: e.target.value }))}
                rows={4}
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="is_featured"
                checked={formData.is_featured}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: checked }))}
              />
              <Label htmlFor="is_featured">Featured Testimonial</Label>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Testimonials List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {testimonials.map((testimonial) => (
          <Card key={testimonial.id} className="relative">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <img
                    src={testimonial.image_url}
                    alt={testimonial.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium text-sm">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {testimonial.company ? `${testimonial.role} at ${testimonial.company}` : testimonial.role}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(testimonial)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(testimonial.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-2 line-clamp-3">
                {testimonial.text}
              </p>
              <div className="flex items-center justify-between text-xs">
                <span>Rating: {testimonial.rating}/5</span>
                <span>Order: {testimonial.display_order}</span>
                {testimonial.is_featured && (
                  <span className="bg-primary text-primary-foreground px-2 py-1 rounded">
                    Featured
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
