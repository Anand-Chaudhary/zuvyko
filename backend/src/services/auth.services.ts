import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../lib/prisma'
import { ApiError } from '../utils/error'
import { sendOtpEmail } from './email.services'

export interface RegisterDTO {
  firstName: string
  lastName: string
  password: string
  email: string
  phone: string
  dateOfBirth: string | Date
  latitude?: number
  longitude?: number
  address?: string | {
    latitude?: number
    longitude?: number
    formattedAddress?: string
    street?: string
  }
}

export interface LoginDTO {
  email: string
  password: string
}

export interface AuthResponseData {
  user: {
    id: number
    firstName: string
    lastName: string
    email: string
    phone: string | null
    dateOfBirth: Date | null
    latitude: number | null
    longitude: number | null
    address: string | null
    isVerified: boolean
    createdAt: Date
    updatedAt: Date
  }
  token: string
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function generateToken(userId: number, email: string): string {
  const secret = process.env.JWT_SECRET || 'zuvyko_secret_key_2026'
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d'
  return jwt.sign({ userId, email }, secret, { expiresIn } as jwt.SignOptions)
}

function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function register(data: RegisterDTO): Promise<AuthResponseData> {
  const { firstName, lastName, password, email, phone, dateOfBirth } = data

  if (!firstName?.trim()) {
    throw new ApiError(400, 'First name is required')
  }

  if (!lastName?.trim()) {
    throw new ApiError(400, 'Last name is required')
  }

  if (!email?.trim() || !EMAIL_REGEX.test(email.trim())) {
    throw new ApiError(400, 'A valid email is required')
  }

  if (!password || password.length < 6) {
    throw new ApiError(400, 'Password must be at least 6 characters long')
  }

  if (!phone?.trim()) {
    throw new ApiError(400, 'Phone number is required')
  }

  if (!dateOfBirth) {
    throw new ApiError(400, 'Date of birth is required')
  }

  const parsedDob = new Date(dateOfBirth)
  if (isNaN(parsedDob.getTime())) {
    throw new ApiError(400, 'Invalid date of birth format')
  }
  if (parsedDob > new Date()) {
    throw new ApiError(400, 'Date of birth cannot be in the future')
  }

  let latitude: number | undefined
  let longitude: number | undefined
  let addressText: string | null = null

  if (typeof data.address === 'object' && data.address !== null) {
    latitude = data.address.latitude ?? data.latitude
    longitude = data.address.longitude ?? data.longitude
    addressText = data.address.formattedAddress ?? data.address.street ?? null
  } else {
    latitude = data.latitude
    longitude = data.longitude
    addressText = typeof data.address === 'string' ? data.address.trim() : null
  }

  if (latitude === undefined || longitude === undefined || isNaN(Number(latitude)) || isNaN(Number(longitude))) {
    throw new ApiError(400, 'Address latitude and longitude are required and must be valid numbers')
  }

  const latNum = Number(latitude)
  const lngNum = Number(longitude)

  if (latNum < -90 || latNum > 90) {
    throw new ApiError(400, 'Latitude must be between -90 and 90')
  }

  if (lngNum < -180 || lngNum > 180) {
    throw new ApiError(400, 'Longitude must be between -180 and 180')
  }

  const normalizedEmail = email.trim().toLowerCase()
  const normalizedPhone = phone.trim()

  const existingEmail = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  })
  if (existingEmail) {
    throw new ApiError(409, 'User with this email already exists')
  }

  const existingPhone = await prisma.user.findUnique({
    where: { phone: normalizedPhone }
  })
  if (existingPhone) {
    throw new ApiError(409, 'User with this phone number already exists')
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      phone: normalizedPhone,
      dateOfBirth: parsedDob,
      latitude: latNum,
      longitude: lngNum,
      address: addressText,
      isVerified: false,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      dateOfBirth: true,
      latitude: true,
      longitude: true,
      address: true,
      isVerified: true,
      createdAt: true,
      updatedAt: true,
    }
  })

  await prisma.otp.deleteMany({
    where: { email: normalizedEmail }
  })

  const otpCode = generateOtpCode()
  await prisma.otp.create({
    data: {
      userId: user.id,
      email: normalizedEmail,
      code: otpCode,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    }
  })

  await sendOtpEmail(normalizedEmail, otpCode, user.firstName)

  const token = generateToken(user.id, user.email)
  return { user, token }
}

export async function verifyOtp(email?: string, otp?: string): Promise<AuthResponseData> {
  if (!email?.trim() || !otp?.trim()) {
    throw new ApiError(400, 'Email and OTP code are required')
  }

  const normalizedEmail = email.trim().toLowerCase()
  const cleanOtp = otp.trim()

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  })

  if (!user) {
    throw new ApiError(404, 'User not found')
  }

  if (user.isVerified) {
    const token = generateToken(user.id, user.email)
    const { password: _, ...userWithoutPassword } = user
    return { user: userWithoutPassword, token }
  }

  const validOtp = await prisma.otp.findFirst({
    where: {
      email: normalizedEmail,
      code: cleanOtp,
      expiresAt: { gt: new Date() }
    },
    orderBy: { createdAt: 'desc' }
  })

  if (!validOtp) {
    throw new ApiError(400, 'Invalid or expired verification code')
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { isVerified: true },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      dateOfBirth: true,
      latitude: true,
      longitude: true,
      address: true,
      isVerified: true,
      createdAt: true,
      updatedAt: true,
    }
  })

  await prisma.otp.deleteMany({
    where: { email: normalizedEmail }
  })

  const token = generateToken(updatedUser.id, updatedUser.email)
  return { user: updatedUser, token }
}

export async function resendOtp(email?: string): Promise<{ message: string }> {
  if (!email?.trim()) {
    throw new ApiError(400, 'Email is required')
  }

  const normalizedEmail = email.trim().toLowerCase()

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  })

  if (!user) {
    throw new ApiError(404, 'User not found')
  }

  if (user.isVerified) {
    throw new ApiError(400, 'User is already verified')
  }

  await prisma.otp.deleteMany({
    where: { email: normalizedEmail }
  })

  const otpCode = generateOtpCode()
  await prisma.otp.create({
    data: {
      userId: user.id,
      email: normalizedEmail,
      code: otpCode,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    }
  })

  await sendOtpEmail(normalizedEmail, otpCode, user.firstName)
  return { message: 'A new verification code has been sent to your email' }
}

export async function login(data: LoginDTO): Promise<AuthResponseData> {
  const { email, password } = data

  if (!email?.trim() || !password) {
    throw new ApiError(400, 'Email and password are required')
  }

  const normalizedEmail = email.trim().toLowerCase()

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  })

  if (!user) {
    throw new ApiError(401, 'Invalid email or password')
  }

  const isPasswordValid = await bcrypt.compare(password, user.password)
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password')
  }

  const { password: _, ...userWithoutPassword } = user
  const token = generateToken(user.id, user.email)

  return {
    user: userWithoutPassword,
    token,
  }
}

export async function refreshToken(currentToken?: string): Promise<AuthResponseData> {
  if (!currentToken) {
    throw new ApiError(401, 'No token provided')
  }

  const secret = process.env.JWT_SECRET || 'zuvyko_secret_key_2026'

  let payload: { userId: number; email: string }
  try {
    payload = jwt.verify(currentToken, secret) as { userId: number; email: string }
  } catch {
    throw new ApiError(401, 'Invalid or expired token')
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      dateOfBirth: true,
      latitude: true,
      longitude: true,
      address: true,
      isVerified: true,
      createdAt: true,
      updatedAt: true,
    }
  })

  if (!user) {
    throw new ApiError(401, 'User not found')
  }

  const token = generateToken(user.id, user.email)
  return { user, token }
}

export async function getProfile(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      dateOfBirth: true,
      latitude: true,
      longitude: true,
      address: true,
      isVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  if (!user) {
    throw new ApiError(404, 'User not found')
  }

  return user
}


