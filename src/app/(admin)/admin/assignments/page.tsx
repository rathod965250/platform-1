import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Eye, Edit, Trash2, Calendar, User } from 'lucide-react'
import Link from 'next/link'
import { AllocateAssignmentDialog } from '@/components/admin/AllocateAssignmentDialog'
import { logAdminError, extractErrorDetails } from '@/lib/admin/error-handler'
import { ErrorDisplay } from '@/components/admin/ErrorDisplay'

export const metadata = {
  title: 'Manage Assignments',
  description: 'Allocate and manage assignments for students',
}

export default async function AssignmentsPage() {
  const supabase = await createClient()

  // Verify authentication and admin role
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    console.error('Authentication error:', authError)
  }

  // Fetch all assignments with test and student details
  // Use table aliases instead of explicit foreign key names for better compatibility
  // Check if table exists first by attempting to query it
  let assignments: any[] | null = null
  let error: any = null
  
  try {
    const result = await supabase
      .from('student_assignments')
      .select(`
        *,
        test:tests(
          id,
          title,
          duration_minutes,
          total_marks
        ),
        student:profiles!student_id(
          id,
          full_name,
          email
        ),
        assigned_by_profile:profiles!assigned_by(
          id,
          full_name,
          email
        )
      `)
      .order('assigned_at', { ascending: false })
    
    assignments = result.data
    error = result.error
    
    // Check if error is due to table not existing
    if (error && error.code === 'PGRST205') {
      // Table doesn't exist - this is expected if migration 016 hasn't been run
      console.warn('[AssignmentsPage] student_assignments table does not exist. Please run migration 016_create_student_assignments.sql first.')
      // Set assignments to empty array and clear error for graceful handling
      assignments = []
      error = null
    }
  } catch (err) {
    error = err
  }

  if (error) {
    logAdminError('AssignmentsPage', error)
  }

  const errorDetails = error ? extractErrorDetails(error) : null

  // Fetch all students for the allocation dialog
  const { data: students } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('role', 'student')
    .order('full_name', { ascending: true })

  // Fetch all published tests for the allocation dialog
  const { data: tests } = await supabase
    .from('tests')
    .select('id, title, test_type, duration_minutes, total_marks')
    .eq('is_published', true)
    .order('title', { ascending: true })

  // Group assignments by status (handle null assignments gracefully)
  const assignmentsList = assignments || []
  const pendingAssignments = assignmentsList.filter(a => a.status === 'pending')
  const inProgressAssignments = assignmentsList.filter(a => a.status === 'in_progress')
  const completedAssignments = assignmentsList.filter(a => a.status === 'completed')
  const overdueAssignments = assignmentsList.filter(a => a.status === 'overdue')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Assignments Management
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Allocate and manage assignments for students
          </p>
        </div>
        <AllocateAssignmentDialog students={students || []} tests={tests || []} />
      </div>

      {/* Error Display */}
      {errorDetails && <ErrorDisplay error={errorDetails} context="Assignments" />}

      {/* Table Missing Notice */}
      {!errorDetails && assignmentsList.length === 0 && assignments === null && (
        <Card className="p-6 border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Assignments Table Not Found
              </h3>
              <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                The student_assignments table does not exist in the database. Please run migration 016_create_student_assignments.sql in the Supabase SQL Editor to create the table.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{pendingAssignments.length}</p>
            </div>
            <Calendar className="h-8 w-8 text-yellow-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">In Progress</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{inProgressAssignments.length}</p>
            </div>
            <Eye className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{completedAssignments.length}</p>
            </div>
            <Calendar className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Overdue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{overdueAssignments.length}</p>
            </div>
            <Calendar className="h-8 w-8 text-red-500" />
          </div>
        </Card>
      </div>

      {/* Assignments List */}
      <div className="space-y-6">
        {!errorDetails && assignmentsList.length > 0 ? (
          <div className="space-y-4">
            {assignmentsList.map((assignment) => {
              const test = Array.isArray(assignment.test) ? assignment.test[0] : assignment.test
              const student = Array.isArray(assignment.student) ? assignment.student[0] : assignment.student
              const assignedBy = Array.isArray(assignment.assigned_by_profile) 
                ? assignment.assigned_by_profile[0] 
                : assignment.assigned_by_profile

              const getStatusBadge = (status: string) => {
                switch (status) {
                  case 'pending':
                    return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-400">Pending</Badge>
                  case 'in_progress':
                    return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-900/20 dark:text-blue-400">In Progress</Badge>
                  case 'completed':
                    return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 dark:bg-green-900/20 dark:text-green-400">Completed</Badge>
                  case 'overdue':
                    return <Badge variant="destructive">Overdue</Badge>
                  default:
                    return <Badge variant="outline">{status}</Badge>
                }
              }

              return (
                <Card key={assignment.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                          {test?.title || 'Unknown Test'}
                        </h3>
                        {getStatusBadge(assignment.status)}
                      </div>
                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>
                            Student: <strong>{student?.full_name || student?.email || 'Unknown'}</strong>
                          </span>
                        </div>
                        {assignedBy && (
                          <div>
                            Assigned by: <strong>{assignedBy.full_name || assignedBy.email}</strong>
                          </div>
                        )}
                        {assignment.due_date && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>
                              Due: {new Date(assignment.due_date).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        {test && (
                          <div className="flex gap-4">
                            <span>⏱️ {test.duration_minutes} mins</span>
                            <span>💯 {test.total_marks} marks</span>
                          </div>
                        )}
                        {assignment.instructions && (
                          <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                            <p className="font-medium mb-1">Instructions:</p>
                            <p className="text-sm">{assignment.instructions}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/admin/assignments/${assignment.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        ) : !errorDetails && assignments !== null ? (
          <Card className="p-12 text-center">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              No assignments yet
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Allocate your first assignment to a student
            </p>
          </Card>
        ) : null}
      </div>
    </div>
  )
}

