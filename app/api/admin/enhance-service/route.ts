import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
  try {
    const { title, description, features, price, category } = await req.json()

    const prompt = `Please enhance this service offering to make it more professional and appealing:

Title: ${title}
Description: ${description}
Features:
${features.map((f: string) => `- ${f}`).join('\n')}
Price: $${price}
Category: ${category}

Please improve:
1. Make the title more compelling and professional
2. Enhance the description to better highlight value and benefits
3. Refine and expand the features to be more specific and valuable
4. Suggest an optimized price point based on the value offered
5. Keep the tone professional but engaging

Return the response in this exact JSON format:
{
  "title": "enhanced title",
  "description": "enhanced description",
  "features": ["feature1", "feature2", ...],
  "price": number
}`

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert service offering consultant for Way of Glory Media. Your task is to enhance service descriptions to be more professional, compelling, and value-focused."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    })

    const enhancedService = JSON.parse(completion.choices[0]?.message?.content || '{}')

    return NextResponse.json(enhancedService)
  } catch (error) {
    console.error('Error enhancing service:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to enhance service' },
      { status: 500 }
    )
  }
} 