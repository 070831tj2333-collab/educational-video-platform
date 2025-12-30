'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'

export default function UploadWorksheetPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.id as string

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      toast.error('Please select a worksheet file')
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('description', description)
      formData.append('courseId', courseId)
      formData.append('file', file)

      const response = await fetch('/api/worksheets', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to upload worksheet')
      }

      toast.success('Worksheet uploaded successfully!')
      router.push(`/teacher/courses/${courseId}`)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setUploading(false)
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
        <h1 className="text-2xl font-bold mb-6">Upload Worksheet</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Worksheet Title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter worksheet title"
          />

          <Textarea
            label="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter worksheet description"
            rows={4}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Worksheet File (PDF, DOC, DOCX)
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
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

          <div className="flex space-x-4">
            <Button type="submit" disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload Worksheet'}
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

