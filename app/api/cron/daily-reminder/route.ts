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
    // Verify this is a cron job request (Vercel adds this header)
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.log("[v0] Unauthorized cron request")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const now = new Date()
    console.log(`[v0] Starting daily reminder cron job at ${now.toISOString()}...`)

    // Create Supabase admin client
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, daily_reminder_time")
      .eq("daily_reminder_enabled", true)

    if (profilesError) {
      console.error("[v0] Error fetching profiles:", profilesError)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    if (!profiles || profiles.length === 0) {
      console.log("[v0] No users with daily reminders enabled")
      return NextResponse.json({ message: "No users to notify", count: 0 })
    }

    console.log(`[v0] Found ${profiles.length} users with daily reminders enabled`)

    // Get user emails from auth
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
      console.error("[v0] Error fetching auth users:", authError)
      return NextResponse.json({ error: "Auth error" }, { status: 500 })
    }

    // Create email transporter
    if (!SMTP_PASSWORD) {
      console.error("[v0] SMTP_PASSWORD not configured")
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

    // Send emails to all users
    let sentCount = 0
    let failedCount = 0

    for (const profile of profiles) {
      const user = authData.users.find((u) => u.id === profile.id)
      if (!user?.email) {
        console.log(`[v0] No email found for user ${profile.id}`)
        failedCount++
        continue
      }

      try {
        await transporter.sendMail({
          from: `"Nextudy" <${FROM_EMAIL}>`,
          to: user.email,
          subject: "⏰ C'est l'heure de ta révision quotidienne !",
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
                    <h1>⏰ C'est l'heure de réviser !</h1>
                  </div>
                  <div class="content">
                    <p>Bonjour,</p>
                    <p>C'est l'heure de ta révision quotidienne ! 📚</p>
                    <p>Quelques minutes de révision chaque jour peuvent faire une grande différence dans ta réussite.</p>
                    
                    <h3>Que faire aujourd'hui ?</h3>
                    <ul>
                      <li>📝 Révise tes fiches de cours</li>
                      <li>🎯 Fais un QCM pour tester tes connaissances</li>
                      <li>💬 Utilise ChatIA pour poser des questions</li>
                      <li>📖 Consulte tes résumés de livres</li>
                    </ul>
                    
                    <div style="text-align: center;">
                      <a href="${APP_URL}" class="button">Commencer ma révision</a>
                    </div>
                    
                    <p style="margin-top: 30px; font-size: 14px; color: #666;">
                      💡 <strong>Astuce du jour :</strong> La répétition espacée est la clé de la mémorisation à long terme. Même 15 minutes par jour font la différence !
                    </p>
                  </div>
                  <div class="footer">
                    <p>Tu reçois cet email car tu as activé les rappels quotidiens.</p>
                    <p>Tu peux désactiver ces notifications dans tes <a href="${APP_URL}/settings">paramètres</a>.</p>
                  </div>
                </div>
              </body>
            </html>
          `,
        })

        console.log(`[v0] ✅ Sent reminder to ${user.email}`)
        sentCount++
      } catch (emailError) {
        console.error(`[v0] ❌ Failed to send to ${user.email}:`, emailError)
        failedCount++
      }
    }

    console.log(`[v0] Daily reminder job complete: ${sentCount} sent, ${failedCount} failed`)

    return NextResponse.json({
      message: "Daily reminders sent",
      sent: sentCount,
      failed: failedCount,
      total: profiles.length,
    })
  } catch (error) {
    console.error("[v0] Error in daily reminder cron:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
