'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'

export default function UploadVideoPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.id as string

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      toast.error('Please select a video file')
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('description', description)
      formData.append('courseId', courseId)
      formData.append('file', file)

      // Simulate progress (in production, use XMLHttpRequest for real progress)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90))
      }, 200)

      const response = await fetch('/api/videos', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to upload video')
      }

      toast.success('Video uploaded successfully!')
      router.push(`/teacher/courses/${courseId}`)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
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
        <h1 className="text-2xl font-bold mb-6">Upload Video</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Video Title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter video title"
          />

          <Textarea
            label="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter video description"
            rows={4}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Video File
            </label>
            <input
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              required
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {file && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          {uploading && (
            <div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-indigo-600 h-2.5 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-1">Uploading... {uploadProgress}%</p>
            </div>
          )}

          <div className="flex space-x-4">
            <Button type="submit" disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload Video'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
              disabled={uploading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

