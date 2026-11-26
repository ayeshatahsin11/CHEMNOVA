import { useState } from 'react'
import { loadVoicePrefs, saveVoicePrefs } from '../lib/speech'

export default function useVoicePrefs() {
  const [prefs, setPrefs] = useState(loadVoicePrefs)

  const update = (patch) => {
    const next = { ...prefs, ...patch }
    saveVoicePrefs(next)
    setPrefs(next)
  }

  return [prefs, update]
}