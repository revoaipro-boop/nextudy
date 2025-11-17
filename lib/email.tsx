import "server-only"
import nodemailer from "nodemailer"

console.log("[v0] Initializing email module with SMTP...")
console.log("[v0] SMTP_HOST:", process.env.SMTP_HOST || "NOT_SET")
console.log("[v0] SMTP_PORT:", process.env.SMTP_PORT || "NOT_SET")
console.log("[v0] SMTP_USER:", process.env.SMTP_USER || "NOT_SET")
console.log("[v0] SMTP_PASSWORD exists:", !!process.env.SMTP_PASSWORD)
console.log("[v0] ADMIN_EMAIL:", process.env.ADMIN_EMAIL || "NOT_SET")
console.log("[v0] NEXT_PUBLIC_APP_URL:", process.env.NEXT_PUBLIC_APP_URL || "NOT_SET")

// Email configuration from environment variables
const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com"
const SMTP_PORT = Number.parseInt(process.env.SMTP_PORT || "587")
const SMTP_USER = process.env.SMTP_USER || "nextudy.notifications@gmail.com"
const SMTP_PASSWORD = process.env.SMTP_PASSWORD
const FROM_EMAIL = SMTP_USER
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "elliothuet2@gmail.com"
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

function createTransporter() {
  console.log("[v0] Creating SMTP transporter...")

  if (!SMTP_PASSWORD) {
    throw new Error("SMTP_PASSWORD n'est pas configuré dans les variables d'environnement")
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: false,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD,
    },
  })

  console.log("[v0] ✓ SMTP transporter created successfully")
  return transporter
}

export async function sendAdminNotification({
  displayName,
  userId,
  email,
  activationToken,
}: {
  displayName: string
  userId: string
  email: string
  activationToken: string
}) {
  console.log("[v0] ========================================")
  console.log("[v0] sendAdminNotification called")
  console.log("[v0] Parameters:", { displayName, userId, email })
  console.log("[v0] Token prefix:", activationToken.substring(0, 8) + "...")
  console.log("[v0] Token length:", activationToken.length)
  console.log("[v0] ========================================")

  if (!SMTP_PASSWORD) {
    const error = "SMTP_PASSWORD n'est pas configuré dans les variables d'environnement"
    console.error("[v0] ERROR:", error)
    return {
      success: false,
      error,
    }
  }

  if (!ADMIN_EMAIL) {
    const error = "ADMIN_EMAIL n'est pas configuré dans les variables d'environnement"
    console.error("[v0] ERROR:", error)
    return {
      success: false,
      error,
    }
  }

  console.log("[v0] Configuration:")
  console.log("[v0]   - From:", FROM_EMAIL)
  console.log("[v0]   - To:", ADMIN_EMAIL)
  console.log("[v0]   - Subject: Nouvelle inscription en attente de validation")

  const registrationDate = new Date().toLocaleString("fr-FR", {
    dateStyle: "full",
    timeStyle: "short",
  })

  const approveUrl = `${APP_URL}/api/admin/validate-user?userId=${userId}&token=${encodeURIComponent(activationToken)}&action=approve`

  console.log("[v0] Generated approval URL:")
  console.log("[v0]   - Full URL:", approveUrl)
  console.log("[v0]   - Token in URL (first 12 chars):", activationToken.substring(0, 12) + "...")

  try {
    const transporter = createTransporter()

    console.log("[v0] Sending email via SMTP...")

    const info = await transporter.sendMail({
      from: `"Nextudy" <${FROM_EMAIL}>`,
      to: ADMIN_EMAIL,
      subject: "Nouvelle inscription en attente de validation",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #4F46E5; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
              .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
              .info { background-color: white; padding: 20px; border-radius: 6px; margin: 15px 0; }
              .info p { margin: 10px 0; }
              .actions { text-align: center; margin: 30px 0; }
              .button { display: inline-block; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 0 10px; font-weight: bold; }
              .approve { background-color: #10b981; color: white; }
              .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center; }
              .warning { background-color: #fef3c7; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #f59e0b; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">Nouvelle inscription</h1>
              </div>
              <div class="content">
                <h2>Nouvelle inscription sur le site.</h2>
                <div class="info">
                  <p><strong>E-mail de l'utilisateur :</strong> ${email}</p>
                  <p><strong>Date et heure :</strong> ${registrationDate}</p>
                  <p><strong>Nom d'affichage :</strong> ${displayName}</p>
                  <p><strong>Identifiant (UUID) :</strong> ${userId}</p>
                </div>
                
                <div class="warning">
                  <p><strong>⚠️ Important :</strong> Ce lien est valide pendant 24 heures et ne peut être utilisé qu'une seule fois.</p>
                </div>
                
                <div class="actions">
                  <a href="${approveUrl}" class="button approve">✓ Valider l'inscription (Admin)</a>
                </div>
                
                <div class="footer">
                  <p>Cliquez sur "Valider l'inscription" pour autoriser cet utilisateur à se connecter.</p>
                  <p>Ce lien sécurisé expire dans 24 heures.</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    })

    console.log("[v0] ✅ Email sent successfully via SMTP!")
    console.log("[v0] Message ID:", info.messageId)
    console.log("[v0] Response:", info.response)
    console.log("[v0] ========================================")

    return {
      success: true,
      data: info,
    }
  } catch (error) {
    console.error("[v0] ❌ Exception caught in sendAdminNotification:")
    console.error("[v0] Error type:", error?.constructor?.name)
    console.error("[v0] Error message:", error instanceof Error ? error.message : "Unknown error")
    console.error("[v0] Full error:", error)
    console.error("[v0] ========================================")

    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
      details: error,
    }
  }
}

export async function sendVerificationEmail({
  email,
  token,
  displayName,
}: {
  email: string
  token: string
  displayName: string
}) {
  console.log("[v0] ========================================")
  console.log("[v0] sendVerificationEmail called for:", email)
  console.log("[v0] ========================================")

  if (!SMTP_PASSWORD) {
    console.error("[v0] SMTP_PASSWORD is not configured")
    return {
      success: false,
      error: "SMTP_PASSWORD n'est pas configuré",
    }
  }

  const verificationUrl = `${APP_URL}/auth/verify-login?token=${token}`
  console.log("[v0] Verification URL:", verificationUrl)

  try {
    const transporter = createTransporter()

    console.log("[v0] Sending verification email via SMTP...")

    const info = await transporter.sendMail({
      from: `"Nextudy" <${FROM_EMAIL}>`,
      to: email,
      subject: "Vérification de connexion",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #4F46E5; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
              .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
              .button { display: inline-block; background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
              .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">Vérification de connexion</h1>
              </div>
              <div class="content">
                <p>Bonjour ${displayName},</p>
                <p>Cliquez sur le bouton ci-dessous pour vous connecter à votre compte :</p>
                
                <a href="${verificationUrl}" class="button">Se connecter</a>
                
                <p>Ce lien est valide pendant 15 minutes.</p>
                <p>Si vous n'avez pas demandé cette connexion, vous pouvez ignorer cet email.</p>
                
                <div class="footer">
                  <p>Cet email a été envoyé automatiquement depuis ${APP_URL}</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    })

    console.log("[v0] ✅ Verification email sent successfully via SMTP!")
    console.log("[v0] Message ID:", info.messageId)
    console.log("[v0] Response:", info.response)
    console.log("[v0] ========================================")

    return {
      success: true,
      data: info,
    }
  } catch (error) {
    console.error("[v0] ❌ Exception in sendVerificationEmail:")
    console.error("[v0] Error type:", error?.constructor?.name)
    console.error("[v0] Error message:", error instanceof Error ? error.message : "Unknown error")
    console.error("[v0] Full error:", error)
    console.error("[v0] ========================================")

    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    }
  }
}

export async function sendLoginCodeEmail({
  email,
  code,
  displayName,
}: {
  email: string
  code: string
  displayName: string
}) {
  console.log("[v0] ========================================")
  console.log("[v0] sendLoginCodeEmail called for:", email)
  console.log("[v0] Code:", code)
  console.log("[v0] ========================================")

  if (!SMTP_PASSWORD) {
    console.error("[v0] SMTP_PASSWORD is not configured")
    return {
      success: false,
      error: "SMTP_PASSWORD n'est pas configuré",
    }
  }

  try {
    const transporter = createTransporter()

    console.log("[v0] Sending login code email via SMTP...")

    const info = await transporter.sendMail({
      from: `"Nextudy" <${FROM_EMAIL}>`,
      to: email,
      subject: "Votre code de connexion",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #4F46E5; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
              .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
              .code-box { background-color: white; border: 2px solid #4F46E5; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
              .code { font-size: 48px; font-weight: bold; letter-spacing: 10px; color: #4F46E5; font-family: monospace; }
              .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
              .warning { background-color: #fef3c7; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #f59e0b; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">Code de connexion</h1>
              </div>
              <div class="content">
                <p>Bonjour ${displayName},</p>
                <p>Voici votre code de vérification pour vous connecter à votre compte :</p>
                
                <div class="code-box">
                  <div class="code">${code}</div>
                </div>
                
                <div class="warning">
                  <p><strong>⚠️ Important :</strong> Ce code est valide pendant 5 minutes seulement.</p>
                </div>
                
                <p>Si vous n'avez pas demandé cette connexion, vous pouvez ignorer cet email en toute sécurité.</p>
                
                <div class="footer">
                  <p>Cet email a été envoyé automatiquement depuis ${APP_URL}</p>
                  <p>Ne partagez jamais ce code avec qui que ce soit.</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    })

    console.log("[v0] ✅ Login code email sent successfully via SMTP!")
    console.log("[v0] Message ID:", info.messageId)
    console.log("[v0] Response:", info.response)
    console.log("[v0] ========================================")

    return {
      success: true,
      data: info,
    }
  } catch (error) {
    console.error("[v0] ❌ Exception in sendLoginCodeEmail:")
    console.error("[v0] Error type:", error?.constructor?.name)
    console.error("[v0] Error message:", error instanceof Error ? error.message : "Unknown error")
    console.error("[v0] Full error:", error)
    console.error("[v0] ========================================")

    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    }
  }
}

export const sendLoginVerificationEmail = sendVerificationEmail
