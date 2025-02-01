import OpenAI from 'openai'
import { ApiResponse } from './types'

// Initialize OpenAI with error checking
export const createOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY
  
  if (!apiKey) {
    throw new Error('OpenAI API key is not configured')
  }

  return new OpenAI({ apiKey })
}

// Safely parse JSON from OpenAI response
export const safeJSONParse = (text: string) => {
  try {
    // First try to parse as is
    return JSON.parse(text)
  } catch (e) {
    try {
      // If that fails, try to extract JSON from the text
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      throw new Error('No valid JSON found in response')
    } catch (e2) {
      console.error('JSON parsing error:', e2)
      throw new Error('Failed to parse OpenAI response')
    }
  }
}

// Handle OpenAI API errors
export const handleOpenAIError = (error: unknown): ApiResponse<never> => {
  console.error('OpenAI API error:', error)

  if (error instanceof OpenAI.APIError) {
    switch (error.status) {
      case 401:
        return {
          success: false,
          error: 'Invalid API key. Please check your OpenAI configuration.'
        }
      case 429:
        return {
          success: false,
          error: 'Rate limit exceeded. Please try again later.'
        }
      case 500:
        return {
          success: false,
          error: 'OpenAI service error. Please try again later.'
        }
      default:
        return {
          success: false,
          error: `OpenAI API error: ${error.message}`
        }
    }
  }

  if (error instanceof Error) {
    return {
      success: false,
      error: error.message
    }
  }

  return {
    success: false,
    error: 'An unexpected error occurred'
  }
} 