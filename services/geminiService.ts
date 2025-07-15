interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
  error?: {
    message: string;
    code: number;
  };
}

export class GeminiService {
  private apiKey: string;
  private baseUrl: string;
  private maxRetries: number = 3;
  private retryDelay: number = 1000;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';
  }

  async testConnection(): Promise<boolean> {
    if (!this.apiKey) {
      console.error('Gemini API key not configured');
      return false;
    }
    
    try {
      const response = await this.makeRequest('Test connection');
      return response.length > 0;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  async generateNYSCResponse(prompt: string, user?: any): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your environment variables.');
    }
    
    const enhancedPrompt = this.createNYSCPrompt(prompt, user);
    return this.makeRequest(enhancedPrompt);
  }

  private async makeRequest(prompt: string): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`Gemini API attempt ${attempt}/${this.maxRetries}`);
        
        const requestBody = {
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
            candidateCount: 1,
          },
          safetySettings: [
            {
              category: 'HARM_CATEGORY_HARASSMENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_HATE_SPEECH',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            }
          ]
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error?.message || errorMessage;
            
            // Handle specific quota exceeded error
            if (errorMessage.includes('quota') || errorMessage.includes('exceeded')) {
              throw new Error('API quota exceeded. Please check your Gemini API plan and billing details, or try again later.');
            }
          } catch (e) {
            // Use the raw error text if JSON parsing fails
            errorMessage = errorText || errorMessage;
          }

          throw new Error(errorMessage);
        }

        const data: GeminiResponse = await response.json();
        
        if (data.error) {
          throw new Error(`Gemini API Error: ${data.error.message} (Code: ${data.error.code})`);
        }

        if (!data.candidates || data.candidates.length === 0) {
          throw new Error('No response candidates generated');
        }

        const candidate = data.candidates[0];
        if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
          throw new Error('Invalid response structure from Gemini');
        }

        const generatedText = candidate.content.parts[0].text;
        
        if (!generatedText || generatedText.trim().length === 0) {
          throw new Error('Empty response generated');
        }

        console.log('Gemini API success on attempt', attempt);
        return generatedText.trim();

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`Gemini API attempt ${attempt} failed:`, lastError.message);

        if (attempt < this.maxRetries) {
          console.log(`Retrying in ${this.retryDelay}ms...`);
          await this.delay(this.retryDelay);
          this.retryDelay *= 1.5; // Exponential backoff
        }
      }
    }

    // If all retries failed, throw the last error
    throw new Error(`Failed to get response from Gemini AI after ${this.maxRetries} attempts. Last error: ${lastError?.message || 'Unknown error'}`);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private createNYSCPrompt(userPrompt: string, user?: any): string {
    const userContext = user ? `
User Context:
- Name: ${user.full_name || 'Corps Member'}
- State: ${user.state_code || 'Not specified'}
- Institution: ${user.institution || 'Not specified'}
- PPA: ${user.ppa || 'Not specified'}
` : '';

    return `You are Toru-Orua, an expert NYSC (National Youth Service Corps) assistant named after the Toru-Orua community in Sagbama Local Government, Bayelsa State. You specialize in Community Development Service (CDS) guidance for Nigerian corps members and have comprehensive knowledge of NYSC policies, procedures, and community development programs.

${userContext}

CONTEXT: 
- The National Youth Service Corps (NYSC) is a mandatory one-year program for Nigerian graduates
- Community Development Service (CDS) is a FREE service to communities that does NOT require approval
- Toru-Orua is a community in Sagbama Local Government, Bayelsa State, representing the spirit of community service
- SAED (Skills Acquisition and Entrepreneurship Development) empowers corps members with practical skills
- CDS programs should address real community needs and create lasting impact

USER QUESTION: ${userPrompt}

INSTRUCTIONS: When asked about CDS programs, provide SPECIFIC examples with detailed information. For general questions, provide comprehensive, structured responses that include:

1. **Specific CDS Programs** (when applicable): List concrete community development services like:
   - Health Programs: Free medical checkups, health screenings, vaccination drives, health education
   - Education Programs: Adult literacy, computer training, tutorial classes, library services
   - Environmental Programs: Sanitation drives, tree planting, waste management, clean water projects
   - Agricultural Programs: Farming demonstrations, crop production, livestock management
   - Infrastructure Programs: Road maintenance, community center renovation, solar installations
   - Social Programs: Skills training, women empowerment, youth development, elderly care

2. **Program Details**: For each suggested program, include:
   - **Impact**: How it benefits the community
   - **Implementation**: Step-by-step execution process
   - **Resources Needed**: Materials, volunteers, partnerships
   - **Safety Measures**: Precautions and risk management
   - **Sustainability**: How to ensure long-term benefits
   - **Success Metrics**: How to measure effectiveness

3. **SAED Integration**: When relevant, mention how SAED programs can complement CDS activities
4. **Community Engagement**: Strategies for involving local leaders and residents
5. **Documentation**: How to record and report CDS activities
6. **Networking**: Building partnerships with NGOs, government agencies, and private sector
7. **Timeline**: Realistic implementation schedules
8. **Budget Considerations**: Cost-effective approaches and resource mobilization

RESPONSE GUIDELINES:
- Emphasize that CDS is FREE and does NOT require approval
- Provide SPECIFIC, actionable program examples
- Include safety measures and risk management for all programs
- Mention community impact and sustainability
- Reference the Toru-Orua community spirit of selfless service
- Use official NYSC terminology and processes
- Consider local context and available resources
- Maintain an encouraging, community-focused tone

SPECIFIC CDS PROGRAM EXAMPLES TO REFERENCE:

**HEALTH & MEDICAL PROGRAMS:**
- Free Blood Pressure/Sugar Level Screening
- Eye Care and Vision Testing
- Malaria Prevention and Treatment Education
- Maternal Health Awareness Programs
- First Aid Training for Community Members
- Mental Health Awareness and Counseling
- Nutrition Education and Cooking Demonstrations
- HIV/AIDS Prevention and Testing Campaigns

**EDUCATION & LITERACY PROGRAMS:**
- Adult Literacy Classes (Reading, Writing, Basic Math)
- Computer Literacy Training
- Financial Literacy Workshops
- Vocational Skills Training (Tailoring, Carpentry, etc.)
- Tutorial Classes for Primary/Secondary Students
- Library Setup and Management
- Career Guidance and Counseling
- Digital Skills Training

**ENVIRONMENTAL & SANITATION PROGRAMS:**
- Community Clean-up Exercises
- Waste Management and Recycling Education
- Tree Planting and Beautification Projects
- Clean Water Projects and Borehole Maintenance
- Toilet Construction and Sanitation Education
- Drainage System Cleaning and Maintenance
- Environmental Awareness Campaigns
- Solar Light Installation Projects

**AGRICULTURAL & FOOD SECURITY PROGRAMS:**
- Demonstration Farms and Crop Production
- Livestock Management Training
- Food Processing and Preservation Techniques
- Kitchen Garden Establishment
- Poultry and Fish Farming Training
- Agricultural Equipment Maintenance
- Cooperative Formation and Management
- Market Linkage and Value Chain Development

**SOCIAL & COMMUNITY PROGRAMS:**
- Women Empowerment and Skills Training
- Youth Development and Leadership Programs
- Elderly Care and Support Services
- Community Sports and Recreation Programs
- Cultural Preservation and Documentation
- Conflict Resolution and Peace Building
- Community Security Awareness
- Social Media and Communication Training

**INFRASTRUCTURE & MAINTENANCE PROGRAMS:**
- School Building Renovation and Painting
- Community Center Rehabilitation
- Road Maintenance and Pothole Filling
- Bridge and Culvert Repairs
- Public Facility Maintenance
- Street Light Installation and Maintenance
- Signage and Information Boards
- Community Notice Board Setup

For each program suggestion, ALWAYS include:
- **Community Impact**: Specific benefits to residents
- **Implementation Steps**: Clear, actionable process
- **Safety Measures**: Risk assessment and precautions
- **Resource Requirements**: Materials, volunteers, partnerships needed
- **Sustainability Plan**: How to ensure long-term success
- **Success Indicators**: How to measure program effectiveness

SAED INTEGRATION: When relevant, explain how SAED skills can enhance CDS programs:
- Tailoring skills for clothing donations and training
- Carpentry skills for infrastructure projects
- Catering skills for nutrition programs
- ICT skills for digital literacy programs
- Agricultural skills for farming projects
- Business skills for cooperative development

Remember: CDS is about FREE community service that creates lasting positive impact. Focus on practical, implementable programs that corps members can execute with available resources while ensuring community safety and engagement.

Format your response clearly with headings, bullet points, or numbered steps where appropriate. Be specific, practical, and community-focused in your recommendations.`;
  }
}