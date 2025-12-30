'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
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

export default function StudentCoursePage() {
  const params = useParams()
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

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  if (!course) {
    return <div className="text-center py-12">Course not found</div>
  }

  return (
    <div>
      <Link
        href="/student"
        className="text-indigo-600 hover:text-indigo-800 mb-4 inline-block"
      >
        ← Back to Courses
      </Link>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.title}</h1>
      {course.description && (
        <p className="text-gray-600 mb-6">{course.description}</p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-xl font-semibold mb-4">Videos</h2>
          {course.videos.length === 0 ? (
            <p className="text-gray-500 text-sm">No videos available</p>
          ) : (
            <ul className="space-y-2">
              {course.videos.map((video) => (
                <li key={video.id}>
                  <Link
                    href={`/student/courses/${courseId}/videos/${video.id}`}
                    className="text-indigo-600 hover:text-indigo-800 block py-2"
                  >
                    {video.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="text-xl font-semibold mb-4">Worksheets</h2>
          {course.worksheets.length === 0 ? (
            <p className="text-gray-500 text-sm">No worksheets available</p>
          ) : (
            <ul className="space-y-2">
              {course.worksheets.map((worksheet) => (
                <li key={worksheet.id}>
                  <a
                    href={worksheet.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-800 block py-2"
                  >
                    {worksheet.title} ↗
                  </a>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}

