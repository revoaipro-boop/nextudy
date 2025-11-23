import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import nodemailer from "nodemailer"

const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com"
const SMTP_PORT = Number.parseInt(process.env.SMTP_PORT || "587")
const SMTP_USER = process.env.SMTP_USER
const SMTP_PASSWORD = process.env.SMTP_PASSWORD
const FROM_EMAIL = SMTP_USER
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const now = new Date()
    console.log(`[v0] Afternoon reminder (14h) at ${now.toISOString()}`)

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id")
      .eq("daily_reminder_enabled", true)

    if (profilesError || !profiles || profiles.length === 0) {
      return NextResponse.json({ message: "No users to notify", count: 0 })
    }

    const { data: authData, error: authError } = await supabase.auth.admin.listUsers()
    if (authError) {
      return NextResponse.json({ error: "Auth error" }, { status: 500 })
    }

    if (!SMTP_PASSWORD) {
      return NextResponse.json({ error: "Email not configured" }, { status: 500 })
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

    let sentCount = 0

    for (const profile of profiles) {
      const user = authData.users.find((u) => u.id === profile.id)
      if (!user?.email) continue

      try {
        await transporter.sendMail({
          from: `"Nextudy" <${FROM_EMAIL}>`,
          to: user.email,
          subject: "🌤️ Pause révision de l'après-midi !",
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                  .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                  .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                  .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>🌤️ Pause révision !</h1>
                  </div>
                  <div class="content">
                    <p>C'est le moment parfait pour une session de révision ! 📚</p>
                    <p>Profite de l'après-midi pour consolider tes connaissances.</p>
                    
                    <div style="text-align: center;">
                      <a href="${APP_URL}" class="button">Commencer ma révision</a>
                    </div>
                    
                    <p style="margin-top: 30px; font-size: 14px; color: #666;">
                      💡 <strong>Astuce :</strong> Les sessions courtes et régulières sont plus efficaces que les longues sessions !
                    </p>
                  </div>
                  <div class="footer">
                    <p>Tu peux désactiver ces notifications dans tes <a href="${APP_URL}/settings">paramètres</a>.</p>
                  </div>
                </div>
              </body>
            </html>
          `,
        })
        sentCount++
      } catch (error) {
        console.error(`[v0] Failed to send to ${user.email}:`, error)
      }
    }

    return NextResponse.json({
      message: "Afternoon reminders sent",
      sent: sentCount,
      total: profiles.length,
    })
  } catch (error) {
    console.error("[v0] Error in afternoon reminder:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
