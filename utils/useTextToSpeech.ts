'use client'

import { useState, useCallback, useEffect } from 'react'

export const useTextToSpeech = () => {
  const [speaking, setSpeaking] = useState(false)
  const [isEnabled, setIsEnabled] = useState(true)
  const [synthesis, setSynthesis] = useState<SpeechSynthesis | null>(null)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSynthesis(window.speechSynthesis)
      
      // Load voices
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices()
        setVoices(availableVoices)
      }

      loadVoices()
      window.speechSynthesis.onvoiceschanged = loadVoices
    }
  }, [])

  const speak = useCallback((text: string) => {
    if (!synthesis || !isEnabled) return

    // Cancel any ongoing speech
    synthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    
    // Find the best male voice
    const maleVoice = voices.find(voice => {
      const name = voice.name.toLowerCase()
      const lang = voice.lang.toLowerCase()
      
      return (
        lang.startsWith('en') && (
          name.includes('male') ||
          name.includes('david') ||
          name.includes('mark') ||
          name.includes('daniel') ||
          name.includes('alex') ||
          name.includes('microsoft david') ||
          name.includes('google uk english male')
        )
      )
    }) || voices.find(voice => 
      voice.lang.startsWith('en-') && voice.default
    )
    
    if (maleVoice) {
      utterance.voice = maleVoice
    }

    // Configure speech parameters for better male voice
    utterance.rate = 0.85
    utterance.pitch = 0.7
    utterance.volume = 0.9
    utterance.lang = 'en-US'

    utterance.onstart = () => {
      setSpeaking(true)
      console.log('Speech started')
    }
    
    utterance.onend = () => {
      setSpeaking(false)
      console.log('Speech ended')
    }
    
    utterance.onerror = (event) => {
      setSpeaking(false)
      console.error('Speech error:', event.error)
    }

    utterance.onpause = () => {
      console.log('Speech paused')
    }

    utterance.onresume = () => {
      console.log('Speech resumed')
    }

    try {
      synthesis.speak(utterance)
    } catch (error) {
      console.error('Error starting speech:', error)
      setSpeaking(false)
    }
  }, [synthesis, isEnabled, voices])

  const stop = useCallback(() => {
    if (synthesis) {
      synthesis.cancel()
      setSpeaking(false)
    }
  }, [synthesis])

  const toggleEnabled = useCallback(() => {
    setIsEnabled(prev => {
      const newState = !prev
      if (!newState && speaking) {
        stop()
      }
      return newState
    })
  }, [speaking, stop])

  return {
    speak,
    stop,
    speaking,
    isEnabled,
    toggleEnabled,
    isSupported: !!synthesis
  }
}