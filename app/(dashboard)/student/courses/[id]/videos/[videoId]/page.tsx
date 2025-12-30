'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { VideoPlayer } from '@/components/video/VideoPlayer'

interface VideoData {
  id: string
  title: string
  description: string | null
  fileUrl: string
  course: {
    id: string
    title: string
  }
  questions: Question[]
  userNotes: Note[]
}

interface Note {
  id: string
  content: string
  timestamp: number
  createdAt: string
}

interface Question {
  id: string
  content: string
  answer: string | null
  createdAt: string
  student: {
    id: string
    name: string
  }
  teacher: {
    id: string
    name: string
  } | null
}

export default function VideoPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.id as string
  const videoId = params.videoId as string

  const [video, setVideo] = useState<VideoData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchVideo()
  }, [videoId])

  const fetchVideo = async () => {
    try {
      const response = await fetch(`/api/videos/${videoId}`)
      if (!response.ok) throw new Error('Failed to fetch video')
      const data = await response.json()
      setVideo(data)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchQuestions = async () => {
    try {
      const response = await fetch(`/api/questions?videoId=${videoId}`)
      if (!response.ok) throw new Error('Failed to fetch questions')
      const data = await response.json()
      if (video) {
        setVideo({ ...video, questions: data })
      }
    } catch (error: any) {
      console.error('Failed to fetch questions:', error)
    }
  }

  const handleSaveNote = async (content: string, timestamp: number) => {
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          videoId,
          timestamp,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save note')
      }

      toast.success('Note saved successfully!')
      const noteData = await response.json()
      if (video) {
        setVideo({
          ...video,
          userNotes: [...(video.userNotes || []), noteData],
        })
      }
    } catch (error: any) {
      toast.error(error.message)
      throw error
    }
  }

  const handleSubmitQuestion = async (content: string) => {
    try {
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          videoId,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit question')
      }

      toast.success('Question submitted successfully!')
      const questionData = await response.json()
      if (video) {
        setVideo({
          ...video,
          questions: [questionData, ...(video.questions || [])],
        })
      }
    } catch (error: any) {
      toast.error(error.message)
      throw error
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  if (!video) {
    return <div className="text-center py-12">Video not found</div>
  }

  return (
    <div>
      <Link
        href={`/student/courses/${courseId}`}
        className="text-indigo-600 hover:text-indigo-800 mb-4 inline-block"
      >
        ← Back to Course
      </Link>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">{video.title}</h1>
      {video.description && (
        <p className="text-gray-600 mb-6">{video.description}</p>
      )}

      <VideoPlayer
        videoUrl={video.fileUrl}
        videoId={videoId}
        onNoteSave={handleSaveNote}
        onQuestionSubmit={handleSubmitQuestion}
        notes={video.userNotes || []}
        questions={video.questions || []}
      />
    </div>
  )
}

