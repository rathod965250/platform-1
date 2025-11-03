'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { 
  Loader2, 
  ArrowRight, 
  ArrowLeft, 
  GraduationCap, 
  Building2, 
  Target, 
  Brain,
  CheckCircle2
} from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
  description: string
  icon: string
}

interface OnboardingData {
  college: string
  graduation_year: number | null
  target_companies: string[]
  phone: string
  selected_categories: string[]
}

const COMMON_COMPANIES = [
  'TCS', 'Infosys', 'Wipro', 'Accenture', 'Cognizant', 'HCL', 'Tech Mahindra',
  'Microsoft', 'Google', 'Amazon', 'Apple', 'Meta', 'Oracle', 'IBM',
  'Goldman Sachs', 'Morgan Stanley', 'JP Morgan', 'Deloitte', 'PwC', 'KPMG',
  'Unilever', 'Procter & Gamble', 'Nestle', 'Coca-Cola', 'PepsiCo',
  'Flipkart', 'Amazon India', 'Swiggy', 'Zomato', 'Paytm', 'Razorpay',
]

const GRADUATION_YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i)

export function OnboardingForm() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState<OnboardingData>({
    college: '',
    graduation_year: null,
    target_companies: [],
    phone: '',
    selected_categories: [],
  })
  const [customCompany, setCustomCompany] = useState('')

  const totalSteps = 4

  useEffect(() => {
    async function loadCategories() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('categories')
          .select('id, name, slug, description, icon')
          .order('order', { ascending: true })

        if (error) throw error
        setCategories(data || [])
      } catch (error: any) {
        console.error('Error loading categories:', error)
        toast.error('Failed to load categories')
      } finally {
        setLoading(false)
      }
    }

    loadCategories()
  }, [])

  const handleNext = () => {
    // Validation based on step
    if (step === 1) {
      if (!formData.college.trim()) {
        toast.error('Please enter your college name')
        return
      }
      if (!formData.graduation_year) {
        toast.error('Please select your graduation year')
        return
      }
    }
    
    if (step === 2) {
      if (formData.target_companies.length === 0) {
        toast.error('Please select at least one target company')
        return
      }
    }

    if (step === 3) {
      if (formData.selected_categories.length === 0) {
        toast.error('Please select at least one category to practice')
        return
      }
    }

    if (step < totalSteps) {
      setStep(step + 1)
    } else {
      handleSubmit()
    }
  }

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault()

    setSubmitting(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast.error('Please sign in to continue')
        router.push('/login')
        return
      }

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          college: formData.college.trim(),
          graduation_year: formData.graduation_year,
          target_companies: formData.target_companies,
          phone: formData.phone.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (profileError) {
        throw profileError
      }

      // Initialize adaptive_state for selected categories
      // Try using the RPC function first, fallback to direct inserts
      let adaptiveError: any = null
      
      try {
        const { error: rpcError } = await supabase.rpc('initialize_adaptive_state_batch', {
          p_user_id: user.id,
          p_category_ids: formData.selected_categories,
        })
        
        if (rpcError && rpcError.code !== '42883') {
          adaptiveError = rpcError
        }
      } catch (rpcError) {
        // RPC function might not exist, use direct inserts
        adaptiveError = rpcError
      }

      // If RPC doesn't exist or failed, initialize manually
      if (adaptiveError) {
        const inserts = formData.selected_categories.map(categoryId => ({
          user_id: user.id,
          category_id: categoryId,
          mastery_score: 0.50,
          current_difficulty: 'medium',
          recent_accuracy: [],
          avg_time_seconds: 0,
        }))

        const { error: insertError } = await supabase
          .from('adaptive_state')
          .upsert(inserts, {
            onConflict: 'user_id,category_id',
          })

        if (insertError) {
          console.error('Error initializing adaptive state:', insertError)
          toast.warning('Profile saved, but adaptive algorithm initialization failed. You can start practicing anyway.')
        } else {
          console.log(`✅ Initialized adaptive state for ${inserts.length} categor${inserts.length === 1 ? 'y' : 'ies'}`)
        }
      } else {
        console.log(`✅ Initialized adaptive state using RPC function for ${formData.selected_categories.length} categor${formData.selected_categories.length === 1 ? 'y' : 'ies'}`)
      }

      toast.success('Onboarding completed! Setting up your personalized learning...')
      
      // Redirect to dashboard
      setTimeout(() => {
        router.push('/dashboard')
        router.refresh()
      }, 1000)

    } catch (error: any) {
      console.error('Onboarding error:', error)
      toast.error(error.message || 'Failed to save onboarding data. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleCompany = (company: string) => {
    setFormData(prev => ({
      ...prev,
      target_companies: prev.target_companies.includes(company)
        ? prev.target_companies.filter(c => c !== company)
        : [...prev.target_companies, company]
    }))
  }

  const addCustomCompany = () => {
    if (customCompany.trim() && !formData.target_companies.includes(customCompany.trim())) {
      setFormData(prev => ({
        ...prev,
        target_companies: [...prev.target_companies, customCompany.trim()]
      }))
      setCustomCompany('')
      toast.success('Company added!')
    }
  }

  const toggleCategory = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      selected_categories: prev.selected_categories.includes(categoryId)
        ? prev.selected_categories.filter(id => id !== categoryId)
        : [...prev.selected_categories, categoryId]
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Step {step} of {totalSteps}</span>
              <span>{Math.round((step / totalSteps) * 100)}%</span>
            </div>
            <Progress value={(step / totalSteps) * 100} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Step 1: Basic Information */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Tell us about yourself</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="college">College/University Name</Label>
              <Input
                id="college"
                placeholder="e.g., IIT Delhi, NIT Warangal, etc."
                value={formData.college}
                onChange={(e) => setFormData(prev => ({ ...prev, college: e.target.value }))}
                required
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="graduation_year">Graduation Year</Label>
              <select
                id="graduation_year"
                value={formData.graduation_year || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, graduation_year: parseInt(e.target.value) || null }))}
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select graduation year</option>
                {GRADUATION_YEARS.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number (Optional)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="bg-background"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Target Companies */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Target Companies</CardTitle>
                <CardDescription>Select companies you want to prepare for</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {COMMON_COMPANIES.map(company => (
                <div
                  key={company}
                  onClick={() => toggleCompany(company)}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.target_companies.includes(company)
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.target_companies.includes(company)}
                      onCheckedChange={() => toggleCompany(company)}
                      className="pointer-events-none"
                    />
                    <span className="text-sm font-medium">{company}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-2 border-t">
              <Label>Add Custom Company</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Company name"
                  value={customCompany}
                  onChange={(e) => setCustomCompany(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomCompany())}
                  className="bg-background"
                />
                <Button type="button" onClick={addCustomCompany} variant="outline">
                  Add
                </Button>
              </div>
            </div>

            {formData.target_companies.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="text-sm text-muted-foreground">Selected:</span>
                {formData.target_companies.map(company => (
                  <Badge key={company} variant="secondary" className="cursor-pointer" onClick={() => toggleCompany(company)}>
                    {company} ×
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Select Categories */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Practice Categories</CardTitle>
                <CardDescription>Select categories you want to focus on. The adaptive algorithm will be initialized for these.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map(category => (
                <div
                  key={category.id}
                  onClick={() => toggleCategory(category.id)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.selected_categories.includes(category.id)
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={formData.selected_categories.includes(category.id)}
                      onCheckedChange={() => toggleCategory(category.id)}
                      className="pointer-events-none mt-1"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">{category.name}</h3>
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {formData.selected_categories.length > 0 && (
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground mb-2">
                  Selected {formData.selected_categories.length} categor{formData.selected_categories.length === 1 ? 'y' : 'ies'}:
                </p>
                <div className="flex flex-wrap gap-2">
                  {formData.selected_categories.map(catId => {
                    const cat = categories.find(c => c.id === catId)
                    return cat ? (
                      <Badge key={catId} variant="secondary" className="cursor-pointer" onClick={() => toggleCategory(catId)}>
                        {cat.name} ×
                      </Badge>
                    ) : null
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 4: Review */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Review Your Information</CardTitle>
                <CardDescription>Please review your details before continuing</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-muted-foreground">College:</span>
                <p className="text-foreground">{formData.college}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-muted-foreground">Graduation Year:</span>
                <p className="text-foreground">{formData.graduation_year}</p>
              </div>
              {formData.phone && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Phone:</span>
                  <p className="text-foreground">{formData.phone}</p>
                </div>
              )}
              <div>
                <span className="text-sm font-medium text-muted-foreground">Target Companies:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {formData.target_companies.map(company => (
                    <Badge key={company} variant="secondary">{company}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-muted-foreground">Practice Categories:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {formData.selected_categories.map(catId => {
                    const cat = categories.find(c => c.id === catId)
                    return cat ? <Badge key={catId} variant="secondary">{cat.name}</Badge> : null
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={handlePrev}
          disabled={step === 1 || submitting}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>

        <Button
          type={step === totalSteps ? 'submit' : 'button'}
          onClick={step === totalSteps ? undefined : handleNext}
          disabled={submitting}
          className="bg-foreground hover:bg-foreground/90 text-background"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Setting up...
            </>
          ) : step === totalSteps ? (
            <>
              Complete Setup
              <CheckCircle2 className="ml-2 h-4 w-4" />
            </>
          ) : (
            <>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </form>
  )
}

