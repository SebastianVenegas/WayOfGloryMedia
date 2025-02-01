import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()

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

    const response = completion.choices[0].message.content
    const serviceData = JSON.parse(response || '{}')

    return NextResponse.json(serviceData)
  } catch (error) {
    console.error('Service generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate service' },
      { status: 500 }
    )
  }
} 