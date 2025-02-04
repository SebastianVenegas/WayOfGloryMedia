import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI()

export async function POST(req: Request) {
  try {
    const { title, description, features, price, category } = await req.json()

    const prompt = `Enhance the following service description to make it more professional and appealing:
Title: ${title}
Description: ${description}
Features: ${features.join(', ')}
Price: $${price}
Category: ${category}

Please provide an improved version with:
1. A more compelling title
2. A clearer, more detailed description
3. Better organized and more valuable features
4. An optimized price point based on the value provided

Return ONLY a JSON response in this exact format without any additional text:
{
  "title": "enhanced title",
  "description": "enhanced description",
  "features": ["feature1", "feature2", ...],
  "price": numeric_price
}`

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a professional service description writer. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
    })

    const enhancedService = JSON.parse(completion.choices[0].message.content || '{}')

    return NextResponse.json(enhancedService)
  } catch (error) {
    console.error('Service enhancement error:', error)
    return NextResponse.json(
      { error: 'Failed to enhance service' },
      { status: 500 }
    )
  }
} 