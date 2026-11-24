import { Request, Response, NextFunction } from 'express'
import * as authService from '../services/auth.services'
import { ApiError } from '../utils/error'

const COOKIE_NAME = 'token'
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.register(req.body)
    res.cookie(COOKIE_NAME, result.token, COOKIE_OPTIONS)

    return res.success({
      success: true,
      message: 'Registration successful. A verification OTP has been sent to your email.',
      status: 201,
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export async function verifyOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, otp } = req.body
    const result = await authService.verifyOtp(email, otp)
    res.cookie(COOKIE_NAME, result.token, COOKIE_OPTIONS)

    return res.success({
      success: true,
      message: 'Email verified successfully. Onboarding completed.',
      status: 200,
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export async function resendOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body
    const result = await authService.resendOtp(email)

    return res.success({
      success: true,
      message: result.message,
      status: 200,
      data: null,
    })
  } catch (error) {
    next(error)
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.login(req.body)
    res.cookie(COOKIE_NAME, result.token, COOKIE_OPTIONS)

    return res.success({
      success: true,
      message: 'Login successful',
      status: 200,
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export async function logout(_req: Request, res: Response, next: NextFunction) {
  try {
    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    })

    return res.success({
      success: true,
      message: 'Logged out successfully',
      status: 200,
      data: null,
    })
  } catch (error) {
    next(error)
  }
}

export async function refreshToken(req: Request, res: Response, next: NextFunction) {
  try {
    const token =
      req.cookies?.[COOKIE_NAME] ||
      req.headers.authorization?.replace(/^Bearer\s+/i, '') ||
      req.body?.token

    const result = await authService.refreshToken(token)
    res.cookie(COOKIE_NAME, result.token, COOKIE_OPTIONS)

    return res.success({
      success: true,
      message: 'Token refreshed successfully',
      status: 200,
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export async function getProfile(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Unauthorized')
    }

    return res.success({
      success: true,
      message: 'Profile retrieved successfully',
      status: 200,
      data: { user: req.user },
    })
  } catch (error) {
    next(error)
  }
}

