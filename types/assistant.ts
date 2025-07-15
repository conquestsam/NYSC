export interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
}

export interface FormattedResponse {
  overview?: string
  steps: Step[]
  requirements: string[]
  communityImpact?: string
  additionalInfo?: string
}

export interface Step {
  title: string
  description: string
  details?: string[]
}