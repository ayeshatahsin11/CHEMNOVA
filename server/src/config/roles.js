export const ROLES = {
  GUEST: 'guest',
  STUDENT: 'student',
  EDUCATOR: 'educator',
  ADMIN: 'admin',
}

export const ROLE_LIST = Object.values(ROLES)

export const LEVELS = ['School', 'Undergraduate', 'Postgraduate', 'Research']

// Guest accounts delete themselves after this many hours
export const GUEST_TTL_HOURS = 24

// Used by feature controllers later. Change a number here and it applies everywhere.
export const GUEST_LIMITS = {
  companionMessagesPerDay: 5,
  assessmentMaxQuestions: 5,
  assessments: 3,
  vivaSessions: 1,
  vivaMaxQuestions: 5,
  savesHistory: false,
  researchStudio: false,
}