import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()

    const systemPrompt = `You are an expert service offering creator for Way of Glory Media, a professional audio and visual solutions company. Your task is to create compelling and valuable service offerings based on user prompts.

Guidelines:
1. Create services that align with our audio and visual solutions focus
2. Set realistic and competitive prices
3. Include specific, valuable features
4. Use professional but engaging language
5. Focus on benefits and value proposition

Return the response in this exact JSON format:
{
  "title": "service title",
  "description": "detailed service description",
  "features": ["feature1", "feature2", ...],
  "price": number
}`

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Please create a professional service offering based on this description: ${prompt}`
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    })

    const generatedService = JSON.parse(completion.choices[0]?.message?.content || '{}')

    return NextResponse.json(generatedService)
  } catch (error) {
    console.error('Error generating service:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate service' },
      { status: 500 }
    )
  }
} 