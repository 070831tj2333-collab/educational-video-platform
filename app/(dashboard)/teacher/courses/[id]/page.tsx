'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

interface Course {
  id: string
  title: string
  description: string | null
  videos: Video[]
  worksheets: Worksheet[]
}

interface Video {
  id: string
  title: string
  description: string | null
  createdAt: string
}

interface Worksheet {
  id: string
  title: string
  description: string | null
  fileUrl: string
  createdAt: string
}

export default function CourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.id as string

  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCourse()
  }, [courseId])

  const fetchCourse = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}`)
      if (!response.ok) throw new Error('Failed to fetch course')
      const data = await response.json()
      setCourse(data)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCourse = async () => {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete course')
      }

      toast.success('Course deleted successfully')
      router.push('/teacher')
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  if (!course) {
    return <div className="text-center py-12">Course not found</div>
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/teacher"
          className="text-indigo-600 hover:text-indigo-800 mb-4 inline-block"
        >
          ← Back to Courses
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
            {course.description && (
              <p className="text-gray-600 mt-2">{course.description}</p>
            )}
          </div>
          <Button variant="danger" onClick={handleDeleteCourse}>
            Delete Course
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Videos</h2>
            <Link href={`/teacher/courses/${courseId}/videos/upload`}>
              <Button>+ Upload Video</Button>
            </Link>
          </div>
          {course.videos.length === 0 ? (
            <p className="text-gray-500 text-sm">No videos yet</p>
          ) : (
            <ul className="space-y-2">
              {course.videos.map((video) => (
                <li key={video.id}>
                  <Link
                    href={`/teacher/courses/${courseId}/videos/${video.id}`}
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    {video.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Worksheets</h2>
            <Link href={`/teacher/courses/${courseId}/worksheets/upload`}>
              <Button>+ Upload Worksheet</Button>
            </Link>
          </div>
          {course.worksheets.length === 0 ? (
            <p className="text-gray-500 text-sm">No worksheets yet</p>
          ) : (
            <ul className="space-y-2">
              {course.worksheets.map((worksheet) => (
                <li key={worksheet.id}>
                  <a
                    href={worksheet.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    {worksheet.title}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Student Invites</h2>
            <Link href={`/teacher/courses/${courseId}/students`}>
              <Button>Manage Invites</Button>
            </Link>
          </div>
        </Card>

        <Card>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Questions</h2>
            <Link href={`/teacher/courses/${courseId}/questions`}>
              <Button>View Questions</Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}

