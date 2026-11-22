export function getInitials(name = '') {
  const letters = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
  return letters || '?'
}

const labels = {
  guest: 'Guest',
  student: 'Student',
  educator: 'Educator',
  admin: 'Administrator',
}

export const roleLabel = (role) => labels[role] ?? 'Student'