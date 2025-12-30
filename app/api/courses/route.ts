import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const courseSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
})

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role === 'TEACHER') {
      const courses = await prisma.course.findMany({
        where: { teacherId: session.user.id },
        include: {
          _count: {
            select: {
              videos: true,
              worksheets: true,
              studentInvites: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
      return NextResponse.json(courses)
    } else {
      // Students see courses they're invited to
      const invites = await prisma.studentInvite.findMany({
        where: {
          email: session.user.email,
          usedAt: { not: null },
        },
        include: {
          course: {
            include: {
              _count: {
                select: {
                  videos: true,
                  worksheets: true,
                },
              },
            },
          },
        },
      })
      const courses = invites.map((invite) => invite.course)
      return NextResponse.json(courses)
    }
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

    const body = await request.json()
    const { title, description } = courseSchema.parse(body)

    const course = await prisma.course.create({
      data: {
        title,
        description,
        teacherId: session.user.id,
      },
    })

    return NextResponse.json(course, { status: 201 })
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

