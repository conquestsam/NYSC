'use client'

import { useState, useCallback } from 'react'

const GEMINI_API_KEY = 'AIzaSyCxe2ETfmix0tafjH-LyATa0b7FybrsgKY'
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'

export const useGeminiAPI = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendMessage = useCallback(async (message: string): Promise<string> => {
    setLoading(true)
    setError(null)

    // Retry mechanism
    const maxRetries = 3
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const prompt = `You are Toru-Orua, a specialized NYSC (National Youth Service Corps) Community Development Service (CDS) assistant specifically for Toru-Orua community in Bayelsa State, Nigeria. You are an expert in Nigerian NYSC programs and community development initiatives tailored to the Niger Delta region.

CONTEXT: Toru-Orua is a community in Bayelsa State, Nigeria, located in the Niger Delta region. The community faces unique challenges and opportunities related to:
- Oil and gas industry presence
- Environmental concerns (oil spills, pollution)
- Fishing and aquaculture as primary livelihoods
- Youth unemployment and skills gaps
- Infrastructure development needs
- Educational challenges
- Healthcare access issues
- Environmental restoration needs

IMPORTANT: Always provide detailed, actionable guidance structured as follows:

1. **Overview**: Brief explanation relevant to Toru-Orua community context
2. **Step-by-Step Implementation**: Numbered steps with clear, practical instructions
3. **Local Requirements**: What is needed specifically for Bayelsa/Niger Delta context
4. **Community Impact**: How this will benefit Toru-Orua residents
5. **Sustainability Tips**: Long-term maintenance and growth strategies

Focus specifically on NYSC-CDS programs suitable for Toru-Orua, Bayelsa such as:

**ENVIRONMENTAL PROGRAMS:**
- Oil spill cleanup and environmental restoration
- Mangrove restoration projects
- Waste management systems
- Water purification initiatives
- Renewable energy projects (solar, biogas)

**ECONOMIC EMPOWERMENT:**
- Fish farming and aquaculture training
- Cassava processing and agriculture
- Small-scale oil palm cultivation
- Artisanal crafts and local products
- Youth entrepreneurship programs
- Digital skills and e-commerce training

**HEALTH & SANITATION:**
- Community health education
- Maternal and child health programs
- Malaria prevention campaigns
- Clean water access projects
- Sanitation facility construction

**EDUCATION & LITERACY:**
- Adult literacy programs in local languages
- Computer literacy training
- Vocational skills development
- School infrastructure improvement
- Library and learning center establishment

**INFRASTRUCTURE DEVELOPMENT:**
- Road maintenance and construction
- Bridge and walkway projects
- Community center development
- Market infrastructure improvement
- Telecommunication access enhancement

User Question: ${message}

Please provide comprehensive, practical guidance that helps NYSC members successfully implement CDS programs specifically beneficial to Toru-Orua community in Bayelsa State, considering local culture, resources, and challenges.`

        const requestBody = {
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.8,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 3000,
            stopSequences: []
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        }

        console.log(`Attempt ${attempt}: Sending request to Gemini API...`)

        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        })

        console.log(`Response status: ${response.status}`)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error('API Error Response:', errorData)
          throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        console.log('API Response received successfully')

        // Validate response structure
        if (!data.candidates || !Array.isArray(data.candidates) || data.candidates.length === 0) {
          throw new Error('No candidates in API response')
        }

        const candidate = data.candidates[0]
        if (!candidate.content || !candidate.content.parts || !Array.isArray(candidate.content.parts)) {
          throw new Error('Invalid candidate structure in API response')
        }

        const responseText = candidate.content.parts[0]?.text
        if (!responseText || typeof responseText !== 'string') {
          throw new Error('No valid text content in API response')
        }

        console.log('Successfully received response from Gemini API')
        return responseText.trim()

      } catch (err) {
        lastError = err instanceof Error ? err : new Error('Unknown error occurred')
        console.error(`Attempt ${attempt} failed:`, lastError.message)
        
        if (attempt < maxRetries) {
          // Wait before retrying (exponential backoff)
          const delay = Math.pow(2, attempt) * 1000
          console.log(`Retrying in ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    // All attempts failed
    const errorMessage = lastError?.message || 'Failed to get response from Gemini API'
    setError(errorMessage)
    console.error('All retry attempts failed:', errorMessage)
    throw new Error(errorMessage)

  }, [])

  return {
    sendMessage,
    loading: loading,
    error
  }
}