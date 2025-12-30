'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Card } from '@/components/ui/Card'

interface Course {
  id: string
  title: string
  description: string | null
  createdAt: string
  _count: {
    videos: number
    worksheets: number
  }
}

export default function StudentDashboard() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses')
      if (!response.ok) throw new Error('Failed to fetch courses')
      const data = await response.json()
      setCourses(data)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">My Courses</h1>

      {courses.length === 0 ? (
        <Card>
          <p className="text-center text-gray-500 py-8">
            You haven't been enrolled in any courses yet. Ask your teacher for an invitation link.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card key={course.id} className="hover:shadow-lg transition-shadow">
              <Link href={`/student/courses/${course.id}`}>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {course.title}
                </h3>
                {course.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {course.description}
                  </p>
                )}
                <div className="flex justify-between text-sm text-gray-500">
                  <span>{course._count.videos} videos</span>
                  <span>{course._count.worksheets} worksheets</span>
                </div>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

