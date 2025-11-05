'use client'

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { 
  Loader2, 
  ArrowRight, 
  ArrowLeft, 
  GraduationCap, 
  Building2, 
  Target, 
  Brain,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { useColleges } from '@/hooks/use-colleges'
import { useCompanies } from '@/hooks/use-companies'
import { useGraduationYears } from '@/hooks/use-graduation-years'
import { useCategories } from '@/hooks/use-categories'
import { useCourses } from '@/hooks/use-courses'

interface OnboardingData {
  full_name: string
  college_id: string | null
  college_name: string // For custom college entry
  graduation_year_id: string | null
  graduation_year: number | null
  course_id: string | null // Optional course selection
  course_name: string // For custom course entry
  target_companies: string[] // Array of company IDs
  phone: string
  selected_categories: string[]
}

const totalSteps = 4

export function OnboardingForm() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState<OnboardingData>({
    full_name: '',
    college_id: null,
    college_name: '',
    graduation_year_id: null,
    graduation_year: null,
    course_id: null,
    course_name: '',
    target_companies: [],
    phone: '',
    selected_categories: [],
  })
  const [customCompany, setCustomCompany] = useState('')
  const [loadingProfile, setLoadingProfile] = useState(true)

  // Use ref to store latest formData to avoid dependency issues
  const formDataRef = useRef(formData)
  useEffect(() => {
    formDataRef.current = formData
  }, [formData])

  // Fetch user profile to pre-populate full_name (especially from Google)
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          // Get current profile to pre-populate full_name
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single()

          // Pre-populate full_name from profile or Google metadata
          const nameToUse = profile?.full_name || 
                          user.user_metadata?.full_name || 
                          user.user_metadata?.name || 
                          user.user_metadata?.display_name ||
                          user.user_metadata?.email?.split('@')[0] || 
                          ''

          if (nameToUse) {
            setFormData(prev => ({
              ...prev,
              full_name: nameToUse
            }))
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error)
      } finally {
        setLoadingProfile(false)
      }
    }

    fetchUserProfile()
  }, [])

  // Fetch data using custom hooks with real-time support
  const { colleges, loading: collegesLoading, error: collegesError } = useColleges()
  const { companies, loading: companiesLoading, error: companiesError } = useCompanies()
  const { years, loading: yearsLoading, error: yearsError } = useGraduationYears()
  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories()
  const { courses, loading: coursesLoading, error: coursesError } = useCourses()

  // Combined loading state
  const loading = collegesLoading || companiesLoading || yearsLoading || categoriesLoading || coursesLoading

  // Define handleSubmit first since handleNext depends on it
  const handleSubmit = useCallback(async () => {
    setSubmitting(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast.error('Please sign in to continue')
        router.push('/login')
        return
      }

      // Use ref to get latest formData without causing re-renders
      const currentFormData = formDataRef.current

      // Handle custom college entry - save to database if it doesn't exist
      let collegeName = ''
      let finalCollegeId: string | null = null

      if (currentFormData.college_name.trim()) {
        // Check if college already exists
        const existingCollege = colleges.find(
          c => c.name.toLowerCase().trim() === currentFormData.college_name.toLowerCase().trim()
        )
        
        if (existingCollege) {
          collegeName = existingCollege.name
          finalCollegeId = existingCollege.id
        } else {
          // Insert new college to database
          const { data: newCollege, error: collegeError } = await supabase
            .from('colleges')
            .insert({
              name: currentFormData.college_name.trim(),
              location: null,
              type: 'other',
              is_active: true,
              is_user_submitted: true,
              submitted_by: user.id,
              display_order: 9999, // Put user submissions at end
            })
            .select()
            .single()

          if (collegeError) {
            console.error('Error saving custom college:', collegeError)
            toast.warning('Could not save custom college to database, but will use the name anyway.')
            collegeName = currentFormData.college_name.trim()
          } else {
            collegeName = newCollege.name
            finalCollegeId = newCollege.id
            toast.success('Your college has been added!')
          }
        }
      } else if (currentFormData.college_id) {
        const selectedCollege = colleges.find(c => c.id === currentFormData.college_id)
        collegeName = selectedCollege?.name || ''
        finalCollegeId = currentFormData.college_id
      }

      if (!collegeName) {
        toast.error('College name is required')
        setSubmitting(false)
        return
      }

      // Handle custom company entries - save to database if they don't exist
      const companyNames: string[] = []
      
      for (const idOrName of currentFormData.target_companies) {
        // Check if it's a UUID (database ID) or custom name
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrName)
        
        if (isUUID) {
          // It's a database ID
          const company = companies.find(c => c.id === idOrName)
          if (company) {
            companyNames.push(company.name)
          }
        } else {
          // It's a custom company name - save to database
          const existingCompany = companies.find(
            c => c.name.toLowerCase().trim() === idOrName.toLowerCase().trim()
          )
          
          if (existingCompany) {
            companyNames.push(existingCompany.name)
          } else {
            // Insert new company to database
            const { data: newCompany, error: companyError } = await supabase
              .from('companies')
              .insert({
                name: idOrName.trim(),
                category: 'other',
                is_active: true,
                is_user_submitted: true,
                submitted_by: user.id,
                display_order: 9999,
              })
              .select()
              .single()

            if (companyError) {
              console.error('Error saving custom company:', companyError)
              // Still use the name even if save fails
              companyNames.push(idOrName.trim())
              toast.warning(`Could not save "${idOrName}" to database, but will use it anyway.`)
            } else {
              companyNames.push(newCompany.name)
              toast.success(`"${newCompany.name}" has been added!`)
            }
          }
        }
      }

      // Get graduation year value
      const selectedYear = years.find(y => y.id === currentFormData.graduation_year_id)
      if (!selectedYear || !currentFormData.graduation_year) {
        toast.error('Graduation year is required')
        setSubmitting(false)
        return
      }

      // Update profile with full_name, college, graduation_year, companies, course, and phone
      const profileUpdate: {
        full_name: string
        college: string
        graduation_year: number
        target_companies: string[]
        phone?: string | null
        course_id?: string | null
        course_name?: string | null
        updated_at: string
      } = {
        full_name: currentFormData.full_name.trim(),
        college: collegeName,
        graduation_year: currentFormData.graduation_year,
        target_companies: companyNames,
        phone: currentFormData.phone.trim() || null,
        updated_at: new Date().toISOString(),
      }

      // Handle course information
      if (currentFormData.course_name && currentFormData.course_name.trim()) {
        // Try to find existing course by name first
        const existingCourse = courses.find(c => 
          c && c.name.toLowerCase().trim() === currentFormData.course_name.toLowerCase().trim()
        )
        
        if (existingCourse) {
          // Course exists in lookup table - use its ID
          profileUpdate.course_id = existingCourse.id
          profileUpdate.course_name = null // Don't store name separately if we have ID
        } else {
          // Custom course name - save it directly to course_name field
          profileUpdate.course_name = currentFormData.course_name.trim()
          profileUpdate.course_id = null
          
          // Optionally create the course in the courses table for future use
          try {
            const { data: newCourse, error: courseError } = await supabase
              .from('courses')
              .insert({
                name: currentFormData.course_name.trim(),
                code: null,
                degree_type: 'other',
                is_active: true,
                is_user_submitted: true,
                submitted_by: user.id,
                display_order: 9999,
              })
              .select()
              .single()

            if (!courseError && newCourse) {
              profileUpdate.course_id = newCourse.id
              profileUpdate.course_name = null // Use ID instead of name
              console.log('✅ Created new course in database:', newCourse.name)
            }
          } catch (createError) {
            console.log('Could not create course in database, storing name only:', createError)
            // Continue with storing just the name
          }
        }
      } else if (currentFormData.course_id) {
        // If course_id is provided (from dropdown selection), use it
        const selectedCourse = courses.find(c => c && c.id === currentFormData.course_id)
        profileUpdate.course_id = currentFormData.course_id
        profileUpdate.course_name = null // Use ID, don't store name separately
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdate)
        .eq('id', user.id)

      if (profileError) {
        console.error('Profile update error:', {
          error: profileError,
          code: profileError.code,
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint,
          profileUpdate,
        })
        throw new Error(profileError.message || `Failed to update profile: ${profileError.code || 'Unknown error'}`)
      }

      // Initialize adaptive_state for selected categories
      let adaptiveError: any = null
      
        try {
          const { error: rpcError } = await supabase.rpc('initialize_adaptive_state_batch', {
            p_user_id: user.id,
            p_category_ids: currentFormData.selected_categories,
          })
        
        if (rpcError && rpcError.code !== '42883') {
          adaptiveError = rpcError
        }
      } catch (rpcError) {
        adaptiveError = rpcError
      }

        // If RPC doesn't exist or failed, initialize manually
        if (adaptiveError) {
          const inserts = currentFormData.selected_categories.map(categoryId => ({
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
          console.log(`✅ Initialized adaptive state using RPC function for ${currentFormData.selected_categories.length} categor${currentFormData.selected_categories.length === 1 ? 'y' : 'ies'}`)
      }

      toast.success('Onboarding completed! Setting up your personalized learning...')
      
      // Redirect to dashboard
      setTimeout(() => {
        router.push('/dashboard')
        router.refresh()
      }, 1000)

    } catch (error: any) {
      // Improved error handling to extract meaningful error messages
      let errorMessage = 'Failed to save onboarding data. Please try again.'
      
      if (error) {
        // Handle Supabase errors
        if (typeof error === 'object') {
          if (error.message) {
            errorMessage = error.message
          } else if (error.error && typeof error.error === 'object' && error.error.message) {
            errorMessage = error.error.message
          } else if (error.details) {
            errorMessage = error.details
          } else if (error.hint) {
            errorMessage = error.hint
          } else if (error.code) {
            errorMessage = `Error ${error.code}: ${error.message || 'Unknown error'}`
          }
        } else if (typeof error === 'string') {
          errorMessage = error
        }
      }
      
      // Log detailed error information for debugging
      console.error('Onboarding error:', {
        error,
        errorType: typeof error,
        errorMessage,
        errorCode: error?.code,
        errorDetails: error?.details,
        errorHint: error?.hint,
        stack: error?.stack,
      })
      
      toast.error(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }, [colleges, companies, years, courses, router])

  // Handle step navigation with validation
  const handleNext = useCallback(() => {
    // Use ref to get current formData without causing dependency issues
    const currentFormData = formDataRef.current
    
    // Validation based on current step
    if (step === 1) {
      if (!currentFormData.full_name || !currentFormData.full_name.trim()) {
        toast.error('Please enter your full name')
        return
      }
      if (!currentFormData.college_name.trim()) {
        toast.error('Please enter your college name')
        return
      }
      if (!currentFormData.course_name || !currentFormData.course_name.trim()) {
        toast.error('Please enter your course/degree')
        return
      }
      if (!currentFormData.phone || !currentFormData.phone.trim()) {
        toast.error('Please enter your phone number')
        return
      }
      if (!currentFormData.graduation_year_id || !currentFormData.graduation_year) {
        toast.error('Please select your graduation year')
        return
      }
    }
    
    if (step === 2) {
      if (currentFormData.target_companies.length === 0) {
        toast.error('Please select at least one target company')
        return
      }
    }

    if (step === 3) {
      if (currentFormData.selected_categories.length === 0) {
        toast.error('Please select at least one category to practice')
        return
      }
    }

    // Move to next step or submit
    if (step < totalSteps) {
      setStep(prev => prev + 1)
    } else {
      // Submit form on final step - call directly, don't trigger state update
      handleSubmit()
    }
  }, [step, totalSteps, handleSubmit])

  const handlePrev = useCallback(() => {
    if (step > 1) {
      setStep(prev => prev - 1)
    }
  }, [step])

  const toggleCompany = useCallback((companyId: string) => {
    if (!companyId) {
      console.error('toggleCompany called with invalid companyId:', companyId)
      return
    }
    setFormData(prev => ({
      ...prev,
      target_companies: prev.target_companies.includes(companyId)
        ? prev.target_companies.filter(id => id !== companyId)
        : [...prev.target_companies, companyId]
    }))
  }, [])

  const addCustomCompany = useCallback(() => {
    if (!customCompany.trim()) return

    const companyName = customCompany.trim()
    
    setFormData(prev => {
      // Check if company already exists in the list
      const existingCompany = companies.find(
        c => c.name.toLowerCase() === companyName.toLowerCase()
      )

      if (existingCompany) {
        // If company exists in database, use its ID
        if (!prev.target_companies.includes(existingCompany.id)) {
          toast.success(`${companyName} added!`)
          return {
            ...prev,
            target_companies: [...prev.target_companies, existingCompany.id]
          }
        } else {
          toast.info(`${companyName} is already selected.`)
          return prev
        }
      } else {
        // Add as custom name (will be saved to database on form submit)
        toast.success(`${companyName} added! Will be saved to database.`)
        return {
          ...prev,
          target_companies: [...prev.target_companies, companyName]
        }
      }
    })
    
    setCustomCompany('')
  }, [customCompany, companies])

  const toggleCategory = useCallback((categoryId: string) => {
    if (!categoryId) {
      console.error('toggleCategory called with invalid categoryId:', categoryId)
      return
    }
    setFormData(prev => ({
      ...prev,
      selected_categories: prev.selected_categories.includes(categoryId)
        ? prev.selected_categories.filter(id => id !== categoryId)
        : [...prev.selected_categories, categoryId]
    }))
  }, [])

  // Memoize selected company names for display
  const selectedCompanyNames = useMemo(() => {
    if (!formData.target_companies || formData.target_companies.length === 0) {
      return []
    }
    return formData.target_companies.map(idOrName => {
      if (!idOrName) {
        console.warn('Empty company ID/name in target_companies')
        return 'Unknown'
      }
      // Check if it's an ID (UUID format) or a custom name
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrName)
      if (isUUID) {
        const company = companies.find(c => c && c.id === idOrName)
        return company?.name || idOrName
      }
      return idOrName // Custom company name
    }).filter(Boolean) // Remove any undefined/null values
  }, [formData.target_companies, companies])

  // Memoize form submit handler to prevent recreating on every render
  // MUST be defined BEFORE any early returns to follow Rules of Hooks
  const handleFormSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (step === totalSteps) {
      handleSubmit()
    } else {
      handleNext()
    }
  }, [step, totalSteps, handleSubmit, handleNext])

  // Early return AFTER all hooks are defined
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Loading form options...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      {/* Progress Bar */}
      <Card className="bg-card border-border">
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

      {/* Error Messages */}
      {(collegesError || companiesError || yearsError || categoriesError || coursesError) && (
        <Card className="bg-destructive/5 border-destructive/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-destructive">Unable to load some form options</p>
                <p className="text-xs text-muted-foreground">
                  {collegesError && 'Colleges '}
                  {companiesError && 'Companies '}
                  {yearsError && 'Graduation years '}
                  {coursesError && 'Courses '}
                  {categoriesError && 'Categories '}
                  {((collegesError || companiesError || yearsError || coursesError || categoriesError) && 'data failed to load.')}
                  You can still continue with manual entry.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Basic Information */}
      {step === 1 && (
        <Card className="bg-card border-border">
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
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                type="text"
                placeholder="Enter your full name"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                required
                disabled={loadingProfile}
              />
              {loadingProfile && (
                <p className="text-xs text-muted-foreground">Loading your name...</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="college">College/University Name</Label>
              <Input
                id="college"
                placeholder="Enter your college or university name (e.g., IIT Delhi, NIT Warangal, etc.)"
                value={formData.college_name}
                onChange={(e) => setFormData(prev => ({ ...prev, college_name: e.target.value }))}
                required

              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="graduation_year">Graduation Year</Label>
              <Select
                value={formData.graduation_year_id || undefined}
                onValueChange={(value) => {
                  const year = years.find(y => y.id === value)
                  setFormData(prev => ({
                    ...prev,
                    graduation_year_id: value || null,
                    graduation_year: year?.year || null
                  }))
                }}
                disabled={yearsLoading || years.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select graduation year" />
                </SelectTrigger>
                <SelectContent>
                  {years
                    .filter((year) => year.id && year.id.trim() !== '')
                    .map((year) => (
                      <SelectItem key={year.id} value={year.id}>
                        {year.year}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="course">Course/Degree</Label>
              <Input
                id="course"
                placeholder="Enter your course or degree (e.g., Computer Science Engineering, MBA, etc.)"
                value={formData.course_name || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, course_name: e.target.value }))}
                required

              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                required

              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Target Companies */}
      {step === 2 && (
        <Card className="bg-card border-border">
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
            {companiesLoading && (
              <div className="text-center py-8 text-muted-foreground">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-sm">Loading companies...</p>
              </div>
            )}
            {!companiesLoading && companies.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {companies
                  .filter(company => company && company.id && company.name) // Filter out invalid companies
                  .map(company => (
                    <div
                      key={company.id}
                      onClick={() => {
                        try {
                          toggleCompany(company.id)
                        } catch (error) {
                          console.error('Error toggling company:', error)
                          toast.error('Failed to select company. Please try again.')
                        }
                      }}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        formData.target_companies.includes(company.id)
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div 
                        className="flex items-center gap-2" 
                        onClick={(e) => {
                          // Stop propagation when clicking checkbox or label area
                          e.stopPropagation()
                        }}
                      >
                        <Checkbox
                          checked={formData.target_companies.includes(company.id)}
                          onCheckedChange={() => {
                            // Handle checkbox change - this will fire when checkbox is clicked
                            try {
                              toggleCompany(company.id)
                            } catch (error) {
                              console.error('Error toggling company:', error)
                              toast.error('Failed to select company. Please try again.')
                            }
                          }}
                        />
                        <span className="text-sm font-medium">
                          {company.name}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            ) : !companiesLoading && (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">No companies available</p>
                <p className="text-xs mt-1">Companies loaded: {companies.length}</p>
              </div>
            )}

            <div className="space-y-2 pt-2 border-t">
              <Label>Add Custom Company</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Company name"
                  value={customCompany}
                  onChange={(e) => setCustomCompany(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomCompany())}
  
                />
                <Button type="button" onClick={addCustomCompany} variant="outline">
                  Add
                </Button>
              </div>
            </div>

            {selectedCompanyNames.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="text-sm text-muted-foreground">Selected:</span>
                {formData.target_companies.map((idOrName, index) => {
                  // Get the display name for this ID/name
                  const name = selectedCompanyNames[index] || idOrName || 'Unknown'
                  return (
                    <Badge 
                      key={`${idOrName || index}-${index}`} 
                      variant="secondary" 
                      className="cursor-pointer" 
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          target_companies: prev.target_companies.filter((_, i) => i !== index)
                        }))
                      }}
                    >
                      {name} ×
                    </Badge>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Select Categories */}
      {step === 3 && (
        <Card className="bg-card border-border">
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
            {categoriesLoading && (
              <div className="text-center py-8 text-muted-foreground">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-sm">Loading categories...</p>
              </div>
            )}
            {!categoriesLoading && categories.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories
                  .filter(category => category && category.id && category.name) // Filter out invalid categories
                  .map(category => (
                    <div
                      key={category.id}
                      onClick={() => {
                        try {
                          toggleCategory(category.id)
                        } catch (error) {
                          console.error('Error toggling category:', error)
                          toast.error('Failed to select category. Please try again.')
                        }
                      }}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        formData.selected_categories.includes(category.id)
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div 
                        className="flex items-start gap-3" 
                        onClick={(e) => {
                          // Stop propagation when clicking checkbox or label area
                          e.stopPropagation()
                        }}
                      >
                        <Checkbox
                          checked={formData.selected_categories.includes(category.id)}
                          onCheckedChange={() => {
                            // Handle checkbox change - this will fire when checkbox is clicked
                            try {
                              toggleCategory(category.id)
                            } catch (error) {
                              console.error('Error toggling category:', error)
                              toast.error('Failed to select category. Please try again.')
                            }
                          }}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground mb-1">{category.name}</h3>
                          <p className="text-sm text-muted-foreground">{category.description || ''}</p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : !categoriesLoading && (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">No categories available</p>
              </div>
            )}

            {formData.selected_categories.length > 0 && (
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground mb-2">
                  Selected {formData.selected_categories.length} categor{formData.selected_categories.length === 1 ? 'y' : 'ies'}:
                </p>
                <div className="flex flex-wrap gap-2">
                  {formData.selected_categories.map((catId, index) => {
                    const cat = categories.find(c => c && c.id === catId)
                    const categoryName = cat?.name || catId || 'Unknown'
                    return (
                      <Badge 
                        key={`${catId || index}-${index}`} 
                        variant="secondary" 
                        className="cursor-pointer" 
                        onClick={() => {
                          try {
                            if (catId) {
                              toggleCategory(catId)
                            }
                          } catch (error) {
                            console.error('Error removing category:', error)
                            toast.error('Failed to remove category. Please try again.')
                          }
                        }}
                      >
                        {categoryName} ×
                      </Badge>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 4: Review */}
      {step === 4 && (
        <Card className="bg-card border-border">
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
                <span className="text-sm font-medium text-muted-foreground">Full Name:</span>
                <p className="text-foreground">
                  {formData.full_name || 'Not provided'}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-muted-foreground">College:</span>
                <p className="text-foreground">
                  {formData.college_name || colleges.find(c => c && c.id === formData.college_id)?.name || 'Not selected'}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-muted-foreground">Graduation Year:</span>
                <p className="text-foreground">
                  {formData.graduation_year || (formData.graduation_year_id ? years.find(y => y && y.id === formData.graduation_year_id)?.year : null) || 'Not selected'}
                </p>
              </div>
              {formData.course_name && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Course:</span>
                  <p className="text-foreground">{formData.course_name}</p>
                </div>
              )}
              <div>
                <span className="text-sm font-medium text-muted-foreground">Phone:</span>
                <p className="text-foreground">{formData.phone}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-muted-foreground">Target Companies:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedCompanyNames.length > 0 ? (
                    selectedCompanyNames.map((name, index) => (
                      <Badge key={`review-${index}`} variant="secondary">{name}</Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground italic">None selected</span>
                  )}
                </div>
              </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Practice Categories:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {formData.selected_categories.length > 0 ? (
                        formData.selected_categories.map((catId, index) => {
                          const cat = categories.find(c => c && c.id === catId)
                          const categoryName = cat?.name || catId || 'Unknown'
                          return <Badge key={`${catId || index}-${index}`} variant="secondary">{categoryName}</Badge>
                        })
                      ) : (
                        <span className="text-sm text-muted-foreground italic">None selected</span>
                      )}
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
          disabled={submitting || loading}
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
