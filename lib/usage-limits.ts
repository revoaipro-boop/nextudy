import { createClient } from '@/lib/supabase/server'

export const USAGE_LIMITS = {
  FREE: {
    SUMMARIES_PER_MONTH: 5,
    FLASHCARDS_PER_MONTH: 10,
    QCM_PER_MONTH: 5,
    CHAT_MESSAGES_PER_DAY: 10,
    MAX_FILE_SIZE_MB: 5,
  },
  PREMIUM: {
    SUMMARIES_PER_MONTH: -1, // unlimited
    FLASHCARDS_PER_MONTH: -1,
    QCM_PER_MONTH: -1,
    CHAT_MESSAGES_PER_DAY: -1,
    MAX_FILE_SIZE_MB: 50,
  },
} as const

interface UsageCheck {
  allowed: boolean
  current: number
  limit: number
  message?: string
}

export async function checkUsageLimit(
  userId: string,
  feature: 'summaries' | 'flashcards' | 'qcm' | 'chat',
  hasPremium: boolean
): Promise<UsageCheck> {
  if (hasPremium) {
    return { allowed: true, current: 0, limit: -1 }
  }

  const supabase = await createClient()
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  let current = 0
  let limit = 0
  let tableName = ''
  let dateField = 'created_at'
  let startDate = startOfMonth

  switch (feature) {
    case 'summaries':
      tableName = 'summaries'
      limit = USAGE_LIMITS.FREE.SUMMARIES_PER_MONTH
      break
    case 'flashcards':
      // Count flashcard sets in summaries table
      tableName = 'summaries'
      limit = USAGE_LIMITS.FREE.FLASHCARDS_PER_MONTH
      break
    case 'qcm':
      // Count QCM in summaries table
      tableName = 'summaries'
      limit = USAGE_LIMITS.FREE.QCM_PER_MONTH
      break
    case 'chat':
      tableName = 'conversation_messages'
      limit = USAGE_LIMITS.FREE.CHAT_MESSAGES_PER_DAY
      startDate = startOfDay
      dateField = 'timestamp'
      break
  }

  const { count, error } = await supabase
    .from(tableName)
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte(dateField, startDate.toISOString())

  if (error) {
    console.error('[v0] Usage check error:', error)
    return { allowed: true, current: 0, limit: 0 } // Allow on error
  }

  current = count || 0

  return {
    allowed: current < limit,
    current,
    limit,
    message: current >= limit 
      ? `Vous avez atteint la limite de ${limit} ${feature} par ${feature === 'chat' ? 'jour' : 'mois'}` 
      : undefined,
  }
}

export async function incrementUsage(
  userId: string,
  feature: 'summaries' | 'flashcards' | 'qcm' | 'chat'
): Promise<void> {
  // Usage is automatically tracked by the database inserts
  // This function is here for explicit tracking if needed
  console.log(`[v0] Usage incremented for ${userId}: ${feature}`)
}
