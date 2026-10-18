export const KINDS = {
  intro: { label: 'Free intro call', minutes: 20 },
  session: { label: 'Therapy session', minutes: 50 },
} as const
export type Kind = keyof typeof KINDS
