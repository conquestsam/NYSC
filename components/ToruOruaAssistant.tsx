'use client'

import React, { useState } from 'react'
import { MessageCircle, X, Send, User, Bot, Sparkles, MapPin } from 'lucide-react'
import { AssistantModal } from './AssistantModal'
import { ChatMessage } from './ChatMessage'
import { AudioController } from './AudioController'
import { useGeminiAPI } from '@/hooks/useGeminiAPI'
import { useTextToSpeech } from '@/utils/useTextToSpeech'
import { Message } from '@/types/assistant'

interface ToruOruaAssistantProps {
  isAuthenticated: boolean
  userName?: string
}

export const ToruOruaAssistant: React.FC<ToruOruaAssistantProps> = ({ 
  isAuthenticated, 
  userName = "User" 
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Hello ${userName}! I'm Toru-Orua, your specialized NYSC-CDS assistant for Toru-Orua community in Bayelsa State. I can help you with Community Development Service programs specifically designed for our Niger Delta region - from environmental restoration to youth empowerment, aquaculture projects, and sustainable development initiatives. What CDS program would you like to explore?`,
      sender: 'bot',
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [modalResponse, setModalResponse] = useState('')

  const { sendMessage, loading, error } = useGeminiAPI()
  const { speak, speaking, stop, isEnabled, toggleEnabled } = useTextToSpeech()

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')

    try {
      const response = await sendMessage(inputMessage)
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'bot',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, botMessage])
      setModalResponse(response)
      setShowModal(true)

      // Auto-read response if enabled
      if (isEnabled) {
        speak(response)
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I apologize, but I'm having trouble connecting to my knowledge base right now. Please try again in a moment. In the meantime, I can help with general NYSC-CDS guidance for Toru-Orua community programs.",
        sender: 'bot',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-50 group hover:scale-105"
      >
        <div className="relative">
          <Bot className="h-6 w-6 group-hover:scale-110 transition-transform" />
          <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-yellow-300 animate-pulse" />
        </div>
        <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center animate-bounce font-bold">
          CDS
        </div>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-2rem)] h-[600px] bg-white rounded-xl shadow-2xl z-50 flex flex-col border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 via-emerald-600 to-teal-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-inner">
                  <Bot className="h-6 w-6 text-green-600" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div>
                <h3 className="font-bold text-lg">Toru-Orua Assistant</h3>
                <p className="text-sm text-green-100 flex items-center">
                  <MapPin className="h-3 w-3 mr-1" />
                  Bayelsa NYSC-CDS Helper
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <AudioController
                isEnabled={isEnabled}
                speaking={speaking}
                onToggle={toggleEnabled}
                onStop={stop}
              />
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {loading && (
              <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm border">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Bot className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex items-center space-x-2 text-gray-500">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm font-medium">Analyzing CDS programs for Toru-Orua...</span>
                </div>
              </div>
            )}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm font-medium">Connection Issue</p>
                <p className="text-red-600 text-xs mt-1">{error}</p>
              </div>
            )}
          </div>

          {/* Quick Suggestions */}
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setInputMessage("What environmental restoration programs can we implement in Toru-Orua?")}
                className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full hover:bg-green-200 transition-colors"
              >
                Environmental Programs
              </button>
              <button
                onClick={() => setInputMessage("How can we start aquaculture projects for youth empowerment?")}
                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full hover:bg-blue-200 transition-colors"
              >
                Aquaculture Projects
              </button>
              <button
                onClick={() => setInputMessage("What skills training programs work best in Niger Delta communities?")}
                className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full hover:bg-purple-200 transition-colors"
              >
                Skills Training
              </button>
            </div>
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about CDS programs for Toru-Orua community..."
                  className="w-full resize-none border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  rows={1}
                  disabled={loading}
                />
                <div className="absolute right-2 top-2 text-gray-400">
                  <MessageCircle className="h-4 w-4" />
                </div>
              </div>
              <button
                onClick={handleSendMessage}
                disabled={loading || !inputMessage.trim()}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-400 text-white p-2 rounded-lg transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-2 text-xs text-gray-500 text-center">
              Specialized for Toru-Orua, Bayelsa • Powered by Gemini AI
            </div>
          </div>
        </div>
      )}

      {/* Response Modal */}
      <AssistantModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        response={modalResponse}
        onSpeak={speak}
        speaking={speaking}
        onStopSpeaking={stop}
      />
    </>
  )
}