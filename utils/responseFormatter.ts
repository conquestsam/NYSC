import { FormattedResponse, Step } from '@/types/assistant'

export const formatNYSCResponse = (response: string): FormattedResponse => {
  const formatted: FormattedResponse = {
    steps: [],
    requirements: []
  }

  // Clean up the response
  const cleanResponse = response.replace(/\*\*/g, '').trim()

  // Extract overview (first paragraph or section before steps)
  const overviewMatch = cleanResponse.match(/^(.+?)(?:\n\n|\n(?=\d+\.|Step|Requirements|Additional|Overview))/s)
  if (overviewMatch) {
    formatted.overview = overviewMatch[1].trim()
  }

  // Extract numbered steps with more flexible patterns
  const stepPatterns = [
    /(?:^|\n)(\d+)\.\s*(.+?)(?=\n\d+\.|$)/gs,
    /(?:^|\n)Step\s*(\d+):\s*(.+?)(?=\nStep|\n\d+\.|$)/gs,
    /(?:^|\n)•\s*(.+?)(?=\n•|\n\d+\.|$)/gs
  ]

  for (const pattern of stepPatterns) {
    const matches = [...cleanResponse.matchAll(pattern)]
    if (matches.length > 0) {
      matches.forEach((match, index) => {
        const stepContent = match[2] || match[1]
        if (stepContent) {
          const lines = stepContent.split('\n').filter(line => line.trim())
          
          if (lines.length > 0) {
            const step: Step = {
              title: lines[0].trim(),
              description: lines.length > 1 ? lines[1].trim() : lines[0].trim()
            }

            // Extract sub-points/details
            const details = lines.slice(2)
              .filter(line => line.trim().match(/^[-•]\s/))
              .map(line => line.replace(/^[-•]\s*/, '').trim())
              .filter(detail => detail.length > 0)

            if (details.length > 0) {
              step.details = details
            }

            formatted.steps.push(step)
          }
        }
      })
      break // Use the first pattern that matches
    }
  }

  // Extract requirements with multiple patterns
  const requirementPatterns = [
    /(?:Requirements?|Prerequisites?|Needed|Required|You will need):\s*([\s\S]*?)(?=\n(?:Additional|Note|Step|\d+\.|$))/i,
    /(?:^|\n)((?:[-•]\s*.+(?:required|needed|must|should).+\n?)+)/gim
  ]

  for (const pattern of requirementPatterns) {
    const match = cleanResponse.match(pattern)
    if (match) {
      const requirementText = match[1] || match[0]
      const requirements = requirementText
        .split('\n')
        .map(line => line.replace(/^[-•]\s*/, '').trim())
        .filter(line => line.length > 0 && !line.match(/^(Additional|Note|Step|\d+\.)/i))
      
      if (requirements.length > 0) {
        formatted.requirements = requirements
        break
      }
    }
  }

  // Extract additional information
  const additionalPatterns = [
    /(?:Additional Information?|Note|Important|Remember|Tips?):\s*([\s\S]*?)$/i,
    /(?:^|\n)(Note:.+)$/im
  ]

  for (const pattern of additionalPatterns) {
    const match = cleanResponse.match(pattern)
    if (match) {
      formatted.additionalInfo = match[1].trim()
      break
    }
  }

  return formatted
}