import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const video = await prisma.video.findUnique({
      where: { id: params.id },
      include: {
        course: {
          include: {
            teacher: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        questions: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
              },
            },
            teacher: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    // Check access
    if (session.user.role === 'TEACHER' && video.course.teacherId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (session.user.role === 'STUDENT') {
      const hasAccess = await prisma.studentInvite.findFirst({
        where: {
          courseId: video.courseId,
          email: session.user.email,
          usedAt: { not: null },
        },
      })

      if (!hasAccess) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Get user's notes for this video
    let notes = []
    if (session.user.role === 'STUDENT') {
      notes = await prisma.note.findMany({
        where: {
          videoId: params.id,
          studentId: session.user.id,
        },
        orderBy: { timestamp: 'asc' },
      })
    }

    return NextResponse.json({ ...video, userNotes: notes })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const video = await prisma.video.findUnique({
      where: { id: params.id },
      include: { course: true },
    })

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    if (video.course.teacherId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.video.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Video deleted successfully' })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

