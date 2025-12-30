import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { saveUploadedFile } from '@/lib/upload'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')

    if (!courseId) {
      return NextResponse.json(
        { error: 'courseId is required' },
        { status: 400 }
      )
    }

    // Verify access
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    if (session.user.role === 'TEACHER' && course.teacherId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (session.user.role === 'STUDENT') {
      const hasAccess = await prisma.studentInvite.findFirst({
        where: {
          courseId,
          email: session.user.email,
          usedAt: { not: null },
        },
      })

      if (!hasAccess) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const worksheets = await prisma.worksheet.findMany({
      where: { courseId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(worksheets)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const title = formData.get('title') as string
    const description = formData.get('description') as string | null
    const courseId = formData.get('courseId') as string
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'Worksheet file is required' },
        { status: 400 }
      )
    }

    // Verify course ownership
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    if (course.teacherId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Save file
    const fileUrl = await saveUploadedFile(file, 'worksheet')

    // Create worksheet record
    const worksheet = await prisma.worksheet.create({
      data: {
        title,
        description: description || undefined,
        courseId,
        fileUrl,
      },
    })

    return NextResponse.json(worksheet, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

