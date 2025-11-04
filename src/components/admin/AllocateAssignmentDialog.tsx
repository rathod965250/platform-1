'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Student {
  id: string
  full_name?: string | null
  email: string
}

interface Test {
  id: string
  title: string
  test_type?: string
  duration_minutes?: number
  total_marks?: number
}

interface AllocateAssignmentDialogProps {
  students: Student[]
  tests: Test[]
}

export function AllocateAssignmentDialog({ students, tests }: AllocateAssignmentDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    test_id: '',
    student_id: '',
    due_date: '',
    instructions: '',
  })
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.test_id || !formData.student_id) {
      toast.error('Please select both a test and a student')
      return
    }

    setLoading(true)

    try {
      // Get current user (admin)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error('You must be logged in to allocate assignments')
        return
      }

      // Prepare assignment data
      const assignmentData: any = {
        test_id: formData.test_id,
        student_id: formData.student_id,
        assigned_by: user.id,
        status: 'pending',
      }

      if (formData.due_date) {
        assignmentData.due_date = new Date(formData.due_date).toISOString()
      }

      if (formData.instructions) {
        assignmentData.instructions = formData.instructions
      }

      // Insert assignment
      const { error } = await supabase
        .from('student_assignments')
        .insert(assignmentData)

      if (error) {
        console.error('Error allocating assignment:', error)
        toast.error(error.message || 'Failed to allocate assignment')
        return
      }

      toast.success('Assignment allocated successfully!')
      setOpen(false)
      setFormData({
        test_id: '',
        student_id: '',
        due_date: '',
        instructions: '',
      })
      router.refresh()
    } catch (error) {
      console.error('Error allocating assignment:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Allocate Assignment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Allocate Assignment to Student</DialogTitle>
          <DialogDescription>
            Select a test and assign it to a student. You can optionally set a due date and add instructions.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Test Selection */}
            <div className="grid gap-2">
              <Label htmlFor="test_id">Test *</Label>
              <Select
                value={formData.test_id}
                onValueChange={(value) => setFormData({ ...formData, test_id: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a test" />
                </SelectTrigger>
                <SelectContent>
                  {tests.map((test) => (
                    <SelectItem key={test.id} value={test.id}>
                      {test.title} {test.test_type && `(${test.test_type})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Student Selection */}
            <div className="grid gap-2">
              <Label htmlFor="student_id">Student *</Label>
              <Select
                value={formData.student_id}
                onValueChange={(value) => setFormData({ ...formData, student_id: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.full_name || student.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Due Date */}
            <div className="grid gap-2">
              <Label htmlFor="due_date">Due Date (Optional)</Label>
              <Input
                id="due_date"
                type="datetime-local"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>

            {/* Instructions */}
            <div className="grid gap-2">
              <Label htmlFor="instructions">Instructions (Optional)</Label>
              <Textarea
                id="instructions"
                placeholder="Add any special instructions for this assignment..."
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Allocating...' : 'Allocate Assignment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

