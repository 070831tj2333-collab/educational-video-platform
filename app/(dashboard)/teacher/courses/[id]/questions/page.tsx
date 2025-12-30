'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Textarea } from '@/components/ui/Textarea'

interface Question {
  id: string
  content: string
  answer: string | null
  createdAt: string
  answeredAt: string | null
  student: {
    id: string
    name: string
  }
  video: {
    id: string
    title: string
  }
}

export default function QuestionsPage() {
  const params = useParams()
  const courseId = params.id as string

  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [answeringId, setAnsweringId] = useState<string | null>(null)
  const [answer, setAnswer] = useState('')

  useEffect(() => {
    fetchQuestions()
  }, [courseId])

  const fetchQuestions = async () => {
    try {
      const response = await fetch(`/api/questions?courseId=${courseId}`)
      if (!response.ok) throw new Error('Failed to fetch questions')
      const data = await response.json()
      setQuestions(data)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = async (questionId: string) => {
    if (!answer.trim()) {
      toast.error('Please provide an answer')
      return
    }

    try {
      const response = await fetch('/api/questions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, answer }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to answer question')
      }

      toast.success('Answer submitted successfully!')
      setAnsweringId(null)
      setAnswer('')
      fetchQuestions()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div>
      <Link
        href={`/teacher/courses/${courseId}`}
        className="text-indigo-600 hover:text-indigo-800 mb-4 inline-block"
      >
        ← Back to Course
      </Link>

      <Card>
        <h1 className="text-2xl font-bold mb-6">Student Questions</h1>

        {questions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No questions yet</p>
        ) : (
          <div className="space-y-6">
            {questions.map((question) => (
              <div
                key={question.id}
                className="border border-gray-200 rounded-md p-4"
              >
                <div className="mb-2">
                  <p className="text-sm text-gray-500">
                    From: {question.student.name} | Video: {question.video.title}
                  </p>
                </div>
                <p className="font-medium mb-2">{question.content}</p>

                {question.answer ? (
                  <div className="bg-green-50 border border-green-200 rounded-md p-3 mt-2">
                    <p className="text-sm font-medium text-green-800 mb-1">Your Answer:</p>
                    <p className="text-green-900">{question.answer}</p>
                    <p className="text-xs text-green-600 mt-2">
                      Answered on {new Date(question.answeredAt!).toLocaleString()}
                    </p>
                  </div>
                ) : (
                  <div className="mt-4">
                    {answeringId === question.id ? (
                      <div className="space-y-3">
                        <Textarea
                          value={answer}
                          onChange={(e) => setAnswer(e.target.value)}
                          placeholder="Type your answer here..."
                          rows={4}
                        />
                        <div className="flex space-x-2">
                          <Button onClick={() => handleAnswer(question.id)}>
                            Submit Answer
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => {
                              setAnsweringId(null)
                              setAnswer('')
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button onClick={() => setAnsweringId(question.id)}>
                        Answer Question
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

