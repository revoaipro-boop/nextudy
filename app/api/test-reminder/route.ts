import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import nodemailer from "nodemailer"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Get user profile
    const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", user.id).single()

    const displayName = profile?.display_name || user.email?.split("@")[0] || "Étudiant"

    // Send test email
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number.parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    await transporter.sendMail({
      from: `"Nextudy" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: "🎓 C'est l'heure de ta révision quotidienne ! [TEST]",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #4F46E5; color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
              .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
              .button { display: inline-block; background-color: #4F46E5; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
              .stats { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center; }
              .emoji { font-size: 48px; margin: 20px 0; }
              .test-badge { background-color: #fbbf24; color: #78350f; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: bold; margin-bottom: 10px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="test-badge">🧪 EMAIL DE TEST</div>
                <div class="emoji">📚</div>
                <h1 style="margin: 0;">C'est l'heure de réviser !</h1>
              </div>
              <div class="content">
                <p>Bonjour ${displayName},</p>
                <p>Votre session de révision quotidienne vous attend ! 🎯</p>
                
                <div class="stats">
                  <h3 style="margin-top: 0;">💡 Le saviez-vous ?</h3>
                  <p>Réviser régulièrement améliore la rétention de 80% ! Prenez quelques minutes aujourd'hui pour consolider vos connaissances.</p>
                </div>
                
                <div style="text-align: center;">
                  <a href="${appUrl}" class="button">Commencer ma révision</a>
                </div>
                
                <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                  💪 Continuez comme ça ! Chaque session de révision vous rapproche de vos objectifs.
                </p>
                
                <div class="footer">
                  <p><strong>Ceci est un email de test.</strong></p>
                  <p>Vous recevez cet email car vous avez activé les rappels quotidiens dans vos paramètres.</p>
                  <p>Pour désactiver ces rappels, rendez-vous dans <a href="${appUrl}/settings">vos paramètres</a>.</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    })

    console.log("[v0] Test reminder email sent to:", user.email)

    return NextResponse.json({
      success: true,
      message: "Email de test envoyé avec succès !",
      email: user.email,
    })
  } catch (error) {
    console.error("[v0] Error sending test reminder:", error)
    return NextResponse.json({ error: "Erreur lors de l'envoi de l'email de test" }, { status: 500 })
  }
}
