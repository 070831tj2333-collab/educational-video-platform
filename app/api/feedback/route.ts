import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const feedbackSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.enum(['BUG', 'FEATURE_REQUEST', 'UI_ISSUE', 'PERFORMANCE', 'OTHER']),
  courseId: z.string().optional(),
})

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const courseId = searchParams.get('courseId')

    const where: any = {}

    // Teachers can see all feedback, students only see their own
    if (session.user.role === 'STUDENT') {
      where.userId = session.user.id
    }

    if (status) {
      where.status = status
    }

    if (category) {
      where.category = category
    }

    if (courseId) {
      where.courseId = courseId
    }

    const feedback = await prisma.feedback.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(feedback)
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
    const { title, description, category, courseId } = feedbackSchema.parse(body)

    // If courseId is provided, verify access
    if (courseId) {
      const course = await prisma.course.findUnique({
        where: { id: courseId },
      })

      if (!course) {
        return NextResponse.json({ error: 'Course not found' }, { status: 404 })
      }

      // Verify user has access to the course
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
      } else if (course.teacherId !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const feedback = await prisma.feedback.create({
      data: {
        title,
        description,
        category,
        userId: session.user.id,
        courseId: courseId || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    return NextResponse.json(feedback, { status: 201 })
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

