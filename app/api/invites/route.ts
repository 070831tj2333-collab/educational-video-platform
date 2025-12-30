import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'
import { z } from 'zod'

const inviteSchema = z.object({
  email: z.string().email(),
  courseId: z.string(),
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { email, courseId } = inviteSchema.parse(body)

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

    // Generate unique token
    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // Expires in 7 days

    const invite = await prisma.studentInvite.create({
      data: {
        email,
        courseId,
        token,
        expiresAt,
        createdByUserId: session.user.id,
      },
    })

    // Return invite with URL
    const inviteUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/invite/${token}`

    return NextResponse.json(
      { ...invite, inviteUrl },
      { status: 201 }
    )
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

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'TEACHER') {
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

    // Verify course ownership
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    })

    if (!course || course.teacherId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const invites = await prisma.studentInvite.findMany({
      where: { courseId },
      orderBy: { createdAt: 'desc' },
    })

    // Generate inviteUrl for each invite
    const invitesWithUrl = invites.map((invite) => ({
      ...invite,
      inviteUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/invite/${invite.token}`,
    }))

    return NextResponse.json(invitesWithUrl)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

