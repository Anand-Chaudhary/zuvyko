import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import prisma from '../lib/prisma'
import { ApiError } from '../utils/error'

const COOKIE_NAME = 'token'

export async function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  try {
    const token =
      req.cookies?.[COOKIE_NAME] ||
      req.headers.authorization?.replace(/^Bearer\s+/i, '') ||
      req.body?.token

    if (!token) {
      if (req.path === '/login') {
        return next()
      }
      throw new ApiError(401, 'Authentication token required')
    }

    const secret = process.env.JWT_SECRET || 'zuvyko_secret_key_2026'

    let payload: { userId: number; email: string }
    try {
      payload = jwt.verify(token, secret) as { userId: number; email: string }
    } catch {
      if (req.path === '/login') {
        return next()
      }
      throw new ApiError(401, 'Invalid or expired authentication token')
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
      },
    })

    if (!user) {
      if (req.path === '/login') {
        return next()
      }
      throw new ApiError(401, 'User no longer exists')
    }

    req.user = user
    next()
  } catch (error) {
    next(error)
  }
}

export const requireAuth = authMiddleware
export default authMiddleware
