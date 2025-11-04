'use client'

import { useState, useEffect } from 'react'
import { useColleges } from '@/hooks/use-colleges'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface CollegeSelectProps {
  value?: string
  onChange: (collegeId: string, collegeName: string) => void
  disabled?: boolean
}

export function CollegeSelect({ value, onChange, disabled }: CollegeSelectProps) {
  const { colleges, loading, refetch } = useColleges()
  const [newCollegeName, setNewCollegeName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const selectedCollege = colleges.find((c) => c.id === value)

  const handleCreateCollege = async () => {
    if (!newCollegeName.trim()) {
      toast.error('Please enter a college name')
      return
    }

    setIsCreating(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast.error('You must be logged in to add a college')
        return
      }

      const { data, error } = await supabase
        .from('colleges')
        .insert({
          name: newCollegeName.trim(),
          is_user_submitted: true,
          submitted_by: user.id,
          is_active: true,
        })
        .select()
        .single()

      if (error) throw error

      toast.success('College added successfully!')
      setNewCollegeName('')
      setIsDialogOpen(false)
      await refetch()
      onChange(data.id, data.name)
    } catch (error: any) {
      console.error('Error creating college:', error)
      toast.error(error.message || 'Failed to add college')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Select
          value={value || ''}
          onValueChange={(collegeId) => {
            const college = colleges.find((c) => c.id === collegeId)
            if (college) {
              onChange(collegeId, college.name)
            }
          }}
          disabled={disabled || loading}
        >
          <SelectTrigger>
            <SelectValue placeholder={loading ? 'Loading colleges...' : 'Select a college'} />
          </SelectTrigger>
          <SelectContent>
            {colleges.map((college) => (
              <SelectItem key={college.id} value={college.id}>
                {college.name}
                {college.location && (
                  <span className="text-muted-foreground ml-2">({college.location})</span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" size="icon" disabled={disabled}>
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New College</DialogTitle>
              <DialogDescription>
                Can't find your college? Add it to the list.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-college-name">College Name</Label>
                <Input
                  id="new-college-name"
                  value={newCollegeName}
                  onChange={(e) => setNewCollegeName(e.target.value)}
                  placeholder="Enter college name"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleCreateCollege()
                    }
                  }}
                />
              </div>
              <Button
                onClick={handleCreateCollege}
                disabled={isCreating || !newCollegeName.trim()}
                className="w-full"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add College
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {selectedCollege && (
        <p className="text-xs text-muted-foreground">
          Selected: {selectedCollege.name}
          {selectedCollege.location && ` • ${selectedCollege.location}`}
        </p>
      )}
    </div>
  )
}

