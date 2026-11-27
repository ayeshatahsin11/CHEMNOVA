import { Sparkles, Baby, GraduationCap, Microscope, Calculator, Lightbulb, BookOpenCheck } from 'lucide-react'

export const modeIcons = {
  standard: Sparkles,
  eli15: Baby,
  university: GraduationCap,
  research: Microscope,
  solver: Calculator,
  analogy: Lightbulb,
  exam: BookOpenCheck,
}

export const verificationInfo = {
  verified: {
    label: 'Arithmetic checked by code',
    tone: 'good',
    note: 'Code re-computed the numbers. It checks the arithmetic only, not whether the method is right.',
  },
  corrected: {
    label: 'Numbers corrected by code',
    tone: 'warn',
    note: 'Code got different numbers from the AI\'s own estimate and shows its values. It checks the arithmetic only, not whether the method is right.',
  },
  unverified: {
    label: 'Some numbers not checked',
    tone: 'warn',
    note: 'Code could not compute every number here, so check the arithmetic yourself.',
  },
  unchecked: {
    label: 'Not checked by code',
    tone: 'muted',
    note: 'This answer was not checked by code, so verify the arithmetic yourself.',
  },
}

// Turns an answer into text that is pleasant to hear: no symbols, and a pause between list items
export function plainText(md) {
  return String(md ?? '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+[.)]\s+/gm, '')
    .replace(/\|/g, ' ')
    .replace(/^[-: ]{3,}$/gm, ' ')
    .replace(/[*_~]{1,3}/g, '')
    .replace(/([^.!?:;,\s])[ \t]*\n+/g, '$1. ')
    .replace(/\s+/g, ' ')
    .trim()
}