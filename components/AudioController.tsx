'use client'

import React from 'react'
import { Volume2, VolumeX, Square } from 'lucide-react'

interface AudioControllerProps {
  isEnabled: boolean
  speaking: boolean
  onToggle: () => void
  onStop: () => void
}

export const AudioController: React.FC<AudioControllerProps> = ({
  isEnabled,
  speaking,
  onToggle,
  onStop
}) => {
  return (
    <div className="flex items-center space-x-1">
      <button
        onClick={onToggle}
        className="hover:bg-white/20 p-2 rounded-lg transition-colors backdrop-blur-sm"
        title={isEnabled ? "Disable audio" : "Enable audio"}
      >
        {isEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
      </button>
      {speaking && (
        <button
          onClick={onStop}
          className="hover:bg-white/20 p-2 rounded-lg transition-colors backdrop-blur-sm animate-pulse"
          title="Stop speaking"
        >
          <Square className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}