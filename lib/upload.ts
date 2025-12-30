import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomBytes } from 'crypto'

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads')
const MAX_FILE_SIZE = 500 * 1024 * 1024 // 500MB
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']
const ALLOWED_WORKSHEET_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']

export async function saveUploadedFile(
  file: File,
  type: 'video' | 'worksheet'
): Promise<string> {
  // Validate file type
  const allowedTypes = type === 'video' ? ALLOWED_VIDEO_TYPES : ALLOWED_WORKSHEET_TYPES
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`)
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`)
  }

  // Ensure upload directory exists
  await mkdir(UPLOAD_DIR, { recursive: true })
  await mkdir(join(UPLOAD_DIR, type), { recursive: true })

  // Generate unique filename
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const extension = file.name.split('.').pop()
  const filename = `${randomBytes(16).toString('hex')}.${extension}`
  const filepath = join(UPLOAD_DIR, type, filename)

  // Save file
  await writeFile(filepath, buffer)

  // Return relative path from public directory
  return `/uploads/${type}/${filename}`
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop() || ''
}

