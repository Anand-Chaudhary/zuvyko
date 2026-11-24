import { Router } from 'express'
import * as authController from '../controllers/auth.controller'
import { authMiddleware } from '../middleware/auth.middleware'

const router = Router()

router.post('/register', authController.register)
router.post('/verify-otp', authController.verifyOtp)
router.post('/resend-otp', authController.resendOtp)
router.post('/login', authMiddleware, authController.login)
router.post('/logout', authMiddleware, authController.logout)
router.get('/profile', authMiddleware, authController.getProfile)
router.get('/me', authMiddleware, authController.getProfile)
router.post('/refresh', authController.refreshToken)

export default router
