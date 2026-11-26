const DAY = 86_400_000

// Falls back to UTC if the browser sends something that is not a real time zone
export function safeTimeZone(tz) {
  if (typeof tz !== 'string' || !tz || tz.length > 64) return 'UTC'
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz })
    return tz
  } catch {
    return 'UTC'
  }
}

// The calendar date of a moment in the user's time zone, as YYYY-MM-DD
export function dayKey(date, tz) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

const toUtc = (key) => {
  const [y, m, d] = key.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

export const shiftDay = (key, days) => new Date(toUtc(key) + days * DAY).toISOString().slice(0, 10)

// The last `count` calendar days ending today, oldest first
export const lastDays = (todayKey, count) =>
  Array.from({ length: count }, (_, i) => shiftDay(todayKey, i - (count - 1)))

export const labelFor = (key) =>
  new Date(toUtc(key)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })

// Days in a row up to today. It stays alive until the end of today, so yesterday still counts.
export function currentStreak(keys, todayKey) {
  const days = new Set(keys)
  let cursor = days.has(todayKey) ? todayKey : shiftDay(todayKey, -1)
  let streak = 0

  while (days.has(cursor)) {
    streak++
    cursor = shiftDay(cursor, -1)
  }
  return streak
}

export function longestStreak(keys) {
  const sorted = [...new Set(keys)].sort()
  let best = 0
  let run = 0
  let previous = null

  for (const key of sorted) {
    run = previous && shiftDay(previous, 1) === key ? run + 1 : 1
    best = Math.max(best, run)
    previous = key
  }
  return best
}