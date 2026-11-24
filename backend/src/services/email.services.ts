import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendOtpEmail(to: string, otp: string, firstName?: string): Promise<void> {
  const isConfigured = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS)

  console.log(`\n========================================`)
  console.log(`[OTP VERIFICATION EMAIL]`)
  console.log(`To: ${to}`)
  console.log(`OTP Code: ${otp}`)
  console.log(`Expires in: 10 minutes`)
  console.log(`========================================\n`)

  if (!isConfigured) {
    return
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Zuvyko" <no-reply@zuvyko.com>',
      to,
      subject: 'Verify your email - Zuvyko',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #333;">Welcome to Zuvyko${firstName ? `, ${firstName}` : ''}!</h2>
          <p style="color: #555;">Thank you for registering. Please use the verification code below to complete your onboarding:</p>
          <div style="background-color: #f4f4f4; padding: 15px; border-radius: 6px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 5px; color: #2c3e50;">
            ${otp}
          </div>
          <p style="color: #777; font-size: 13px; margin-top: 15px;">This OTP is valid for 10 minutes. If you did not request this, please ignore this email.</p>
        </div>
      `,
    })
  } catch (error) {
    console.error('Failed to send email via SMTP, logged to console instead:', error)
  }
}
