import { z } from 'zod'

// Common interfaces for service data
export interface BaseServiceContent {
  title: string
  description: string
  features: string[]
}

export interface GeneratedService extends BaseServiceContent {
  price: number
}

// Zod schemas for validation
export const serviceContentSchema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must not exceed 100 characters')
    .transform(str => str.trim()),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must not exceed 1000 characters')
    .transform(str => str.trim()),
  features: z.array(z.string().trim())
    .min(1, 'At least one feature is required')
    .max(10, 'Maximum of 10 features allowed')
})

export const generateServiceSchema = z.object({
  prompt: z.string()
    .min(10, 'Prompt must be at least 10 characters')
    .max(500, 'Prompt must not exceed 500 characters')
    .transform(str => str.trim())
})

// AI prompt templates
export const AI_PROMPTS = {
  SYSTEM_GENERATE: `You are a professional service creator for an audio/visual equipment company specializing in high-end installations and custom solutions.
Create detailed, professional services with accurate pricing and features.
Focus on premium quality, technical expertise, and exceptional customer service.
Ensure all responses maintain a consistent, premium brand voice.`,

  SYSTEM_ENHANCE: `You are a professional service copywriter for a premium audio/visual equipment company.
Your expertise lies in crafting compelling, technically accurate service descriptions that:
- Emphasize value and expertise
- Use industry-standard terminology
- Maintain a professional and authoritative tone
- Highlight unique selling points
Enhance service descriptions while preserving technical accuracy.`,

  formatGeneratePrompt: (prompt: string) => `
Create a professional audio/visual service based on this description: "${prompt}".

Requirements:
- Title should be concise and professional
- Description should highlight value proposition and expertise
- Include 3-5 detailed features that demonstrate technical competence
- Price should reflect premium service quality (typical range $1,000-$50,000)
- Use industry-standard terminology
- Maintain luxury brand positioning

Return in JSON format with:
{
  "title": string,
  "description": string,
  "price": number,
  "features": string[]
}`,

  formatEnhancePrompt: (service: BaseServiceContent) => `
Enhance this audio/visual service description to be more professional and compelling:

Current Service:
Title: ${service.title}
Description: ${service.description}
Features:
${service.features.map(f => `- ${f}`).join('\n')}

Requirements:
- Maintain core service offering
- Enhance language and presentation
- Use industry terminology appropriately
- Keep technical details accurate
- Emphasize premium quality
- Focus on client benefits

Return in JSON format with:
{
  "title": string,
  "description": string,
  "features": string[]
}`
}

// Response formatting
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export const formatSuccessResponse = <T>(data: T): ApiResponse<T> => ({
  success: true,
  data
})

export const formatErrorResponse = (error: Error | string): ApiResponse<never> => ({
  success: false,
  error: error instanceof Error ? error.message : error
}) 