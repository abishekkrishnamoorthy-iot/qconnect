import OpenAI from 'openai'

// Initialize GROQ client (OpenAI-compatible API)
const getGroqClient = () => {
  const apiKey = process.env.REACT_APP_GROQ_API_KEY
  
  if (!apiKey) {
    throw new Error('GROQ API key is not configured. Please set REACT_APP_GROQ_API_KEY in your environment variables.')
  }

  return new OpenAI({
    apiKey: apiKey,
    baseURL: 'https://api.groq.com/openai/v1',
    dangerouslyAllowBrowser: true // Required for browser usage - API key is in env var, not hardcoded
  })
}

/**
 * Extract JSON from response text (handles markdown code blocks)
 * @param {string} text - Response text that may contain JSON
 * @returns {object} Parsed JSON object
 */
const extractJSON = (text) => {
  // Try to parse directly first
  try {
    return JSON.parse(text.trim())
  } catch (e) {
    // If that fails, try to extract JSON from markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || text.match(/(\{[\s\S]*\})/)
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1])
      } catch (e2) {
        throw new Error('Failed to parse JSON from response')
      }
    }
    throw new Error('No valid JSON found in response')
  }
}

/**
 * Validate question structure
 * @param {object} question - Question object to validate
 * @returns {boolean} True if valid
 */
const validateQuestion = (question) => {
  if (!question || typeof question !== 'object') return false
  if (!question.q || typeof question.q !== 'string' || !question.q.trim()) return false
  if (!Array.isArray(question.options) || question.options.length !== 4) return false
  if (question.options.some(opt => typeof opt !== 'string' || !opt.trim())) return false
  if (typeof question.correct !== 'number' || question.correct < 0 || question.correct > 3) return false
  return true
}

/**
 * Generate quiz using GROQ AI
 * @param {string} topic - Quiz topic
 * @param {string} difficulty - Difficulty level (easy, medium, hard)
 * @param {number} numQuestions - Number of questions (1-5)
 * @param {string} topicDetails - Optional detailed topic description/context
 * @returns {Promise<object>} Quiz object matching Firebase structure
 */
export const generateQuiz = async (topic, difficulty, numQuestions, topicDetails = '') => {
  const MAX_RETRIES = 1
  
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const client = getGroqClient()
      
      // Build context block based on whether topicDetails is provided
      const contextBlock = topicDetails?.trim()
        ? `Additional context for deeper accuracy:\n${topicDetails}`
        : `No additional context provided. Base quiz ONLY on the main topic.`
      
      const prompt = `Generate a quiz STRICTLY in CLEAN JSON format. NO explanation, NO markdown.

QUIZ RULES:
- Create exactly ${numQuestions} multiple-choice questions.
- Difficulty level: ${difficulty}. 
  Adjust question complexity based on this difficulty.
- Topic: ${topic}
- ${contextBlock}

EACH QUESTION MUST FOLLOW THIS EXACT FORMAT:
{
  "q": "<question text>",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correct": <index of correct option 0-3>
}

Return ONLY:
{
  "questions": [ ... ]
}

No other text must appear.`

      const response = await client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are a quiz generator. Always return valid JSON only, no markdown, no explanations. Adjust question complexity based on the difficulty level provided (easy = basic concepts, medium = conceptual understanding, hard = tricky/technical/advanced).'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        // Request JSON format (if model supports it, otherwise extractJSON will handle parsing)
        response_format: { type: 'json_object' }
      })

      const rawText = response.choices[0]?.message?.content || ''
      
      if (!rawText) {
        throw new Error('Empty response from AI')
      }

      // Parse JSON from response
      const parsed = extractJSON(rawText)

      // Validate structure
      if (!parsed.questions || !Array.isArray(parsed.questions)) {
        throw new Error('Invalid AI JSON structure: missing questions array')
      }

      // Validate question count
      if (parsed.questions.length !== numQuestions) {
        throw new Error(`Invalid question count: expected ${numQuestions}, got ${parsed.questions.length}`)
      }

      // Validate each question
      for (let i = 0; i < parsed.questions.length; i++) {
        if (!validateQuestion(parsed.questions[i])) {
          throw new Error(`Invalid question structure at index ${i}`)
        }
      }

      // All validations passed
      return {
        success: true,
        questions: parsed.questions
      }

    } catch (error) {
      console.error(`AI Quiz Generation Error (attempt ${attempt + 1}):`, error)
      
      // If this was the last attempt, return error
      if (attempt === MAX_RETRIES) {
        // Check for specific error types
        if (error.message.includes('API key')) {
          return {
            success: false,
            error: 'GROQ API key is not configured. Please set REACT_APP_GROQ_API_KEY in your environment variables.'
          }
        }
        
        if (error.message.includes('JSON') || error.message.includes('parse')) {
          return {
            success: false,
            error: 'AI couldn\'t generate a quiz. Please try again.'
          }
        }

        return {
          success: false,
          error: error.message || 'Failed to generate quiz. Please try again.'
        }
      }
      
      // Wait a bit before retry
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
}

/**
 * Example implementation for OpenAI API:
 * 
 * import axios from 'axios'
 * 
 * export const generateQuiz = async (topic, difficulty, numQuestions) => {
 *   try {
 *     const response = await axios.post('YOUR_API_ENDPOINT', {
 *       topic,
 *       difficulty,
 *       numQuestions
 *     })
 *     
 *     // Transform API response to match Firebase structure
 *     const questions = response.data.questions.map(q => ({
 *       q: q.question,
 *       options: q.options,
 *       correct: q.correctIndex
 *     }))
 *     
 *     return { success: true, questions }
 *   } catch (error) {
 *     return { success: false, error: error.message }
 *   }
 * }
 */

