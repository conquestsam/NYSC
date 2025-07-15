'use client'

import React from 'react'
import { User, Bot } from 'lucide-react'
import { Message } from '@/types/assistant'

interface ChatMessageProps {
  message: Message
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isBot = message.sender === 'bot'

  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'} mb-4`}>
      <div className={`flex max-w-[85%] ${isBot ? 'flex-row' : 'flex-row-reverse'}`}>
        <div className={`flex-shrink-0 ${isBot ? 'mr-3' : 'ml-3'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md ${
            isBot 
              ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' 
              : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
          }`}>
            {isBot ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
          </div>
        </div>
        <div className={`px-4 py-3 rounded-2xl shadow-sm border ${
          isBot 
            ? 'bg-white text-gray-800 border-gray-200 rounded-bl-md' 
            : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-600 rounded-br-md'
        }`}>
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.text}</p>
          <p className={`text-xs mt-2 ${
            isBot ? 'text-gray-500' : 'text-blue-100'
          }`}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    </div>
  )
}