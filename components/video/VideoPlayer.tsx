'use client'

import { useRef, useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Textarea } from '@/components/ui/Textarea'

interface VideoPlayerProps {
  videoUrl: string
  videoId: string
  onNoteSave: (content: string, timestamp: number) => Promise<void>
  onQuestionSubmit: (content: string) => Promise<void>
  notes: Note[]
  questions: Question[]
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

export function VideoPlayer({
  videoUrl,
  videoId,
  onNoteSave,
  onQuestionSubmit,
  notes,
  questions,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [noteContent, setNoteContent] = useState('')
  const [questionContent, setQuestionContent] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [submittingQuestion, setSubmittingQuestion] = useState(false)
  const [activeTab, setActiveTab] = useState<'notes' | 'questions'>('notes')

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const updateTime = () => setCurrentTime(video.currentTime)
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    video.addEventListener('timeupdate', updateTime)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)

    return () => {
      video.removeEventListener('timeupdate', updateTime)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
    }
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handlePlayPause = () => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.pause()
    } else {
      video.play()
    }
  }

  const handleSeek = (timestamp: number) => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = timestamp
  }

  const handleSaveNote = async () => {
    if (!noteContent.trim()) return

    setSavingNote(true)
    try {
      await onNoteSave(noteContent, currentTime)
      setNoteContent('')
    } catch (error) {
      console.error('Failed to save note:', error)
    } finally {
      setSavingNote(false)
    }
  }

  const handleSubmitQuestion = async () => {
    if (!questionContent.trim()) return

    setSubmittingQuestion(true)
    try {
      await onQuestionSubmit(questionContent)
      setQuestionContent('')
    } catch (error) {
      console.error('Failed to submit question:', error)
    } finally {
      setSubmittingQuestion(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card>
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full rounded-lg"
            controls
          />
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button onClick={handlePlayPause}>
                {isPlaying ? 'Pause' : 'Play'}
              </Button>
              <span className="text-sm text-gray-600">
                {formatTime(currentTime)}
              </span>
            </div>
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex-1 py-2 px-4 text-sm font-medium ${
              activeTab === 'notes'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Notes
          </button>
          <button
            onClick={() => setActiveTab('questions')}
            className={`flex-1 py-2 px-4 text-sm font-medium ${
              activeTab === 'questions'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Q&A
          </button>
        </div>

        {activeTab === 'notes' && (
          <Card>
            <h3 className="font-semibold mb-4">My Notes</h3>
            <div className="mb-4">
              <Textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Add a note at current timestamp..."
                rows={3}
              />
              <Button
                onClick={handleSaveNote}
                disabled={savingNote || !noteContent.trim()}
                className="mt-2 w-full"
              >
                {savingNote ? 'Saving...' : `Save Note at ${formatTime(currentTime)}`}
              </Button>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {notes.length === 0 ? (
                <p className="text-sm text-gray-500">No notes yet</p>
              ) : (
                notes.map((note) => (
                  <div
                    key={note.id}
                    className="border border-gray-200 rounded-md p-3 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleSeek(note.timestamp)}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-medium text-indigo-600">
                        {formatTime(note.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{note.content}</p>
                  </div>
                ))
              )}
            </div>
          </Card>
        )}

        {activeTab === 'questions' && (
          <Card>
            <h3 className="font-semibold mb-4">Questions & Answers</h3>
            <div className="mb-4">
              <Textarea
                value={questionContent}
                onChange={(e) => setQuestionContent(e.target.value)}
                placeholder="Ask a question about this video..."
                rows={3}
              />
              <Button
                onClick={handleSubmitQuestion}
                disabled={submittingQuestion || !questionContent.trim()}
                className="mt-2 w-full"
              >
                {submittingQuestion ? 'Submitting...' : 'Submit Question'}
              </Button>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {questions.length === 0 ? (
                <p className="text-sm text-gray-500">No questions yet</p>
              ) : (
                questions.map((question) => (
                  <div
                    key={question.id}
                    className="border border-gray-200 rounded-md p-3"
                  >
                    <p className="text-sm font-medium mb-1">
                      {question.student.name} asked:
                    </p>
                    <p className="text-sm text-gray-700 mb-2">{question.content}</p>
                    {question.answer && (
                      <div className="bg-green-50 border border-green-200 rounded-md p-2 mt-2">
                        <p className="text-xs font-medium text-green-800 mb-1">
                          Teacher's Answer:
                        </p>
                        <p className="text-sm text-green-900">{question.answer}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

