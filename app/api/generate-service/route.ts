import { NextResponse } from 'next/server'
import OpenAI from 'openai'

// Initialize OpenAI with error handling
const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OpenAI API key is not configured')
  }
  return new OpenAI({ apiKey })
}

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()

    // Initialize OpenAI client with error handling
    const openai = getOpenAIClient()

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a professional service creator for an audio/visual equipment company. Create detailed, professional services with accurate pricing and features."
        },
        {
          role: "user",
          content: `Create a professional service based on this description: "${prompt}". Return it in JSON format with these fields: title (string), description (string), price (number), features (array of strings). Make the description professional and detailed. Include 3-5 key features. Price should be realistic for the service scope.`
        }
      ]
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error('No response from OpenAI')
    }

    try {
      const serviceData = JSON.parse(response)
      return NextResponse.json(serviceData)
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError)
      throw new Error('Invalid response format from OpenAI')
    }
  } catch (error) {
    console.error('Service generation error:', error)
    
    // Handle specific error cases
    if (error instanceof OpenAI.APIError) {
      if (error.status === 401) {
        return NextResponse.json(
          { error: 'OpenAI API key is invalid or expired. Please check your configuration.' },
          { status: 401 }
        )
      }
      return NextResponse.json(
        { error: `OpenAI API error: ${error.message}` },
        { status: error.status }
      )
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate service' },
      { status: 500 }
    )
  }
} 