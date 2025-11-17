export const QUICK_QUESTION_EVENTS = {
  TOGGLE: "quick-question-toggle",
  OPEN: "quick-question-open",
  CLOSE: "quick-question-close",
} as const

export function toggleQuickQuestion() {
  window.dispatchEvent(new CustomEvent(QUICK_QUESTION_EVENTS.TOGGLE))
}

export function openQuickQuestion() {
  window.dispatchEvent(new CustomEvent(QUICK_QUESTION_EVENTS.OPEN))
}

export function closeQuickQuestion() {
  window.dispatchEvent(new CustomEvent(QUICK_QUESTION_EVENTS.CLOSE))
}
