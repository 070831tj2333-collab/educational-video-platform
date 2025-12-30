'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'

interface Feedback {
  id: string
  title: string
  description: string
  category: string
  status: string
  createdAt: string
  user: {
    id: string
    name: string
    email: string
    role: string
  }
  course: {
    id: string
    title: string
  } | null
}

export default function FeedbackPage() {
  const { data: session } = useSession()
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('BUG')
  const [submitting, setSubmitting] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('')

  useEffect(() => {
    fetchFeedbacks()
  }, [filterStatus])

  const fetchFeedbacks = async () => {
    try {
      const url = filterStatus
        ? `/api/feedback?status=${filterStatus}`
        : '/api/feedback'
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch feedback')
      const data = await response.json()
      setFeedbacks(data)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit feedback')
      }

      toast.success('Feedback submitted successfully!')
      setTitle('')
      setDescription('')
      setCategory('BUG')
      setShowForm(false)
      fetchFeedbacks()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatusUpdate = async (feedbackId: string, newStatus: string) => {
    if (session?.user.role !== 'TEACHER') return

    try {
      const response = await fetch(`/api/feedback/${feedbackId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update status')
      }

      toast.success('Status updated successfully!')
      fetchFeedbacks()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleDelete = async (feedbackId: string) => {
    if (!confirm('Are you sure you want to delete this feedback?')) return

    try {
      const response = await fetch(`/api/feedback/${feedbackId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete feedback')
      }

      toast.success('Feedback deleted successfully!')
      fetchFeedbacks()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-yellow-100 text-yellow-800'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800'
      case 'RESOLVED':
        return 'bg-green-100 text-green-800'
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'BUG':
        return 'Bug'
      case 'FEATURE_REQUEST':
        return 'Feature Request'
      case 'UI_ISSUE':
        return 'UI Issue'
      case 'PERFORMANCE':
        return 'Performance'
      case 'OTHER':
        return 'Other'
      default:
        return category
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Feedback</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Submit Feedback'}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Submit New Feedback</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief description of the issue"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="BUG">Bug</option>
                <option value="FEATURE_REQUEST">Feature Request</option>
                <option value="UI_ISSUE">UI Issue</option>
                <option value="PERFORMANCE">Performance</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <Textarea
              label="Description"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide detailed information about the issue..."
              rows={6}
            />

            <div className="flex space-x-4">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Feedback'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="mb-4">
        <div className="flex space-x-2">
          <Button
            variant={filterStatus === '' ? 'primary' : 'secondary'}
            onClick={() => setFilterStatus('')}
          >
            All
          </Button>
          <Button
            variant={filterStatus === 'OPEN' ? 'primary' : 'secondary'}
            onClick={() => setFilterStatus('OPEN')}
          >
            Open
          </Button>
          <Button
            variant={filterStatus === 'IN_PROGRESS' ? 'primary' : 'secondary'}
            onClick={() => setFilterStatus('IN_PROGRESS')}
          >
            In Progress
          </Button>
          <Button
            variant={filterStatus === 'RESOLVED' ? 'primary' : 'secondary'}
            onClick={() => setFilterStatus('RESOLVED')}
          >
            Resolved
          </Button>
          <Button
            variant={filterStatus === 'CLOSED' ? 'primary' : 'secondary'}
            onClick={() => setFilterStatus('CLOSED')}
          >
            Closed
          </Button>
        </div>
      </div>

      {feedbacks.length === 0 ? (
        <Card>
          <p className="text-center text-gray-500 py-8">
            No feedback found. Be the first to submit feedback!
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {feedbacks.map((feedback) => (
            <Card key={feedback.id}>
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{feedback.title}</h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        feedback.status
                      )}`}
                    >
                      {feedback.status.replace('_', ' ')}
                    </span>
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">
                      {getCategoryLabel(feedback.category)}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3">{feedback.description}</p>
                  <div className="text-sm text-gray-500">
                    <p>
                      Submitted by: {feedback.user.name} ({feedback.user.role})
                    </p>
                    {feedback.course && (
                      <p>Course: {feedback.course.title}</p>
                    )}
                    <p>
                      {new Date(feedback.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 ml-4">
                  {session?.user.role === 'TEACHER' && (
                    <select
                      value={feedback.status}
                      onChange={(e) =>
                        handleStatusUpdate(feedback.id, e.target.value)
                      }
                      className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="OPEN">Open</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                  )}
                  {(session?.user.role === 'TEACHER' ||
                    feedback.user.id === session?.user.id) && (
                    <Button
                      variant="danger"
                      onClick={() => handleDelete(feedback.id)}
                      className="text-sm"
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

