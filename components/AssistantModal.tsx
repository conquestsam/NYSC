'use client'

import React from 'react'
import { X, Volume2, VolumeX, CheckCircle, ArrowRight, Lightbulb, FileText, AlertCircle } from 'lucide-react'
import { formatNYSCResponse } from '@/utils/responseFormatter'

interface AssistantModalProps {
  isOpen: boolean
  onClose: () => void
  response: string
  onSpeak: (text: string) => void
  speaking: boolean
  onStopSpeaking: () => void
}

export const AssistantModal: React.FC<AssistantModalProps> = ({
  isOpen,
  onClose,
  response,
  onSpeak,
  speaking,
  onStopSpeaking
}) => {
  if (!isOpen) return null

  const formattedResponse = formatNYSCResponse(response)

  const handleSpeak = () => {
    if (speaking) {
      onStopSpeaking()
    } else {
      onSpeak(response)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 text-white p-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
              <CheckCircle className="h-7 w-7 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">NYSC-CDS Guidance</h2>
              <p className="text-green-100 flex items-center mt-1">
                <FileText className="h-4 w-4 mr-2" />
                Community Development Service Information
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSpeak}
              className="bg-white/20 hover:bg-white/30 p-3 rounded-lg transition-colors backdrop-blur-sm"
              title={speaking ? "Stop reading" : "Read aloud"}
            >
              {speaking ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
            <button
              onClick={onClose}
              className="bg-white/20 hover:bg-white/30 p-3 rounded-lg transition-colors backdrop-blur-sm"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh] bg-gradient-to-b from-gray-50 to-white">
          <div className="space-y-6">
            {/* Overview */}
            {formattedResponse.overview && (
              <div className="bg-blue-50 border-l-4 border-blue-400 rounded-r-lg p-4 shadow-sm">
                <div className="flex items-center mb-2">
                  <Lightbulb className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="font-semibold text-blue-900">Overview</h3>
                </div>
                <p className="text-blue-800 leading-relaxed">{formattedResponse.overview}</p>
              </div>
            )}

            {/* Steps */}
            {formattedResponse.steps.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 rounded-t-lg">
                  <h3 className="font-semibold text-gray-900 flex items-center">
                    <ArrowRight className="h-5 w-5 mr-2 text-green-600" />
                    Step-by-Step Implementation Guide
                  </h3>
                </div>
                <div className="p-4 space-y-4">
                  {formattedResponse.steps.map((step, index) => (
                    <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-sm shadow-md">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-2 text-lg">{step.title}</h4>
                        <p className="text-gray-700 leading-relaxed mb-3">{step.description}</p>
                        {step.details && step.details.length > 0 && (
                          <div className="bg-white rounded-md p-3 border border-gray-200">
                            <ul className="space-y-2">
                              {step.details.map((detail, detailIndex) => (
                                <li key={detailIndex} className="flex items-start text-sm text-gray-600">
                                  <span className="text-green-500 mr-3 mt-1">•</span>
                                  <span>{detail}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Requirements */}
            {formattedResponse.requirements.length > 0 && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg p-4 shadow-sm">
                <div className="flex items-center mb-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                  <h3 className="font-semibold text-yellow-900">Requirements & Prerequisites</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {formattedResponse.requirements.map((req, index) => (
                    <div key={index} className="flex items-start text-yellow-800 bg-yellow-100 p-3 rounded-md">
                      <CheckCircle className="h-4 w-4 mr-3 mt-0.5 text-yellow-600 flex-shrink-0" />
                      <span className="text-sm">{req}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Info */}
            {formattedResponse.additionalInfo && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-gray-600" />
                  Additional Information
                </h3>
                <p className="text-gray-700 leading-relaxed">{formattedResponse.additionalInfo}</p>
              </div>
            )}

            {/* Raw Response (if no structured format) */}
            {formattedResponse.steps.length === 0 && !formattedResponse.overview && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">{response}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
          <div className="flex items-center text-sm text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            Powered by Toru-Orua Assistant • Gemini AI
          </div>
          <button
            onClick={onClose}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-2 rounded-lg transition-all duration-200 font-medium hover:scale-105"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  )
}