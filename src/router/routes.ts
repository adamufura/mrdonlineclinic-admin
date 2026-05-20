export const ROUTES = {
  login: '/login',
  dashboard: '/dashboard',
  practitioners: '/dashboard/practitioners',
  practitionerDetail: (id: string) => `/dashboard/practitioners/${id}`,
  patients: '/dashboard/patients',
  patientDetail: (id: string) => `/dashboard/patients/${id}`,
  audit: '/dashboard/audit',
  team: '/dashboard/team',
  staffDetail: (id: string) => `/dashboard/team/${id}`,
} as const;
