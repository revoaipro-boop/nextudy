import { NextResponse } from "next/server"

export async function GET() {
  console.log("[v0] Testing email configuration...")

  const config = {
    hasSmtpHost: !!process.env.SMTP_HOST,
    hasSmtpUser: !!process.env.SMTP_USER,
    hasSmtpPassword: !!process.env.SMTP_PASSWORD,
    hasAdminEmail: !!process.env.ADMIN_EMAIL,
    adminEmail: process.env.ADMIN_EMAIL || "NOT_SET",
    hasAppUrl: !!process.env.NEXT_PUBLIC_APP_URL,
    appUrl: process.env.NEXT_PUBLIC_APP_URL || "NOT_SET",
  }

  console.log("[v0] Email configuration:", config)

  return NextResponse.json({
    message: "Configuration de l'email",
    config,
    status:
      config.hasSmtpHost && config.hasSmtpUser && config.hasSmtpPassword && config.hasAdminEmail
        ? "OK"
        : "MISSING_CONFIG",
  })
}
