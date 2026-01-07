import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const questionSchema = z.object({
  content: z.string().min(1),
  videoId: z.string(),
  courseId: z.string(),
})

const answerSchema = z.object({
  questionId: z.string(),
  answer: z.string().min(1),
})

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const videoId = searchParams.get('videoId')
    const courseId = searchParams.get('courseId')

    if (videoId) {
      const questions = await prisma.question.findMany({
        where: { videoId },
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
      })
      return NextResponse.json(questions)
    }

    if (courseId && session.user.role === 'TEACHER') {
      const course = await prisma.course.findUnique({
        where: { id: courseId },
      })

      if (!course || course.teacherId !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const video = await prisma.video.findUnique({
        where: { id: videoId },
        include: { course: true },
      })
      
      if (!video) {
        return NextResponse.json({ error: 'Video not found' }, { status: 404 })
      }
      
      if (video.courseId !== courseId) {
        return NextResponse.json(
          { error: 'Invalid courseId' },
          { status: 400 }
        )
      }
      
      const questions = await prisma.question.findMany({
        where: {
          videoId: { in: videos.map((v) => v.id) },
        },
        include: {
          student: {
            select: {
              id: true,
              name: true,
            },
          },
          video: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      return NextResponse.json(questions)
    }

    return NextResponse.json(
      { error: 'videoId or courseId is required' },
      { status: 400 }
    )
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
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { content, videoId, courseId } = questionSchema.parse(body)

    // Verify video access
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: { course: true },
    })

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
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
    } else {
      return NextResponse.json(
        { error: 'Only students can ask questions' },
        { status: 403 }
      )
    }

    const question = await prisma.question.create({
      data: {
        content,
        videoId,
        courseId,
        studentId: session.user.id,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(question, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { questionId, answer } = answerSchema.parse(body)

    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        video: {
          include: {
            course: true,
          },
        },
      },
    })

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    if (question.video.course.teacherId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updatedQuestion = await prisma.question.update({
      where: { id: questionId },
      data: {
        answer,
        teacherId: session.user.id,
        answeredAt: new Date(),
      },
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
    })

    return NextResponse.json(updatedQuestion)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

