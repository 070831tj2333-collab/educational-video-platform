import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const acceptSchema = z.object({
  token: z.string(),
  name: z.string().min(1),
  password: z.string().min(6),
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (session) {
      return NextResponse.json(
        { error: 'Already logged in. Please log out first.' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { token, name, password } = acceptSchema.parse(body)

    // Find invite
    const invite = await prisma.studentInvite.findUnique({
      where: { token },
      include: { course: true },
    })

    if (!invite) {
      return NextResponse.json(
        { error: 'Invalid invitation token' },
        { status: 404 }
      )
    }

    if (invite.usedAt) {
      return NextResponse.json(
        { error: 'This invitation has already been used' },
        { status: 400 }
      )
    }

    if (new Date() > invite.expiresAt) {
      return NextResponse.json(
        { error: 'This invitation has expired' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: invite.email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists. Please log in instead.' },
        { status: 400 }
      )
    }

    // Create student account
    const bcrypt = require('bcryptjs')
    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email: invite.email,
        password: hashedPassword,
        role: 'STUDENT',
      },
    })

    // Mark invite as used
    await prisma.studentInvite.update({
      where: { id: invite.id },
      data: { usedAt: new Date() },
    })

    return NextResponse.json(
      { message: 'Account created successfully', userId: user.id },
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

