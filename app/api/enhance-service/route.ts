import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(req: Request) {
  try {
    // Log the request body
    const body = await req.json()
    console.log('Request body:', body)

    const { title, description, features } = body
    
    // Validate input
    if (!title || !description || !features) {
      console.error('Missing required fields:', { title, description, features })
      throw new Error('Missing required fields')
    }

    console.log('Making OpenAI request...')
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a professional service copywriter for an audio/visual equipment company. Enhance and improve service descriptions while maintaining accuracy and professionalism."
        },
        {
          role: "user",
          content: `Improve this service description. Make it more professional, compelling, and detailed while maintaining accuracy.
          Title: ${title}
          Description: ${description}
          Features: ${features.join(', ')}
          
          Return the improved version in JSON format with these fields: title (string), description (string), features (array of strings).
          Keep the core service offering the same but enhance the language and presentation.`
        }
      ]
    })

    console.log('OpenAI response received')
    const response = completion.choices[0].message.content
    console.log('Raw response:', response)

    if (!response) {
      throw new Error('Empty response from OpenAI')
    }

    const enhancedData = JSON.parse(response)
    console.log('Parsed response:', enhancedData)

    // Validate response data
    if (!enhancedData.title || !enhancedData.description || !enhancedData.features) {
      console.error('Invalid response data:', enhancedData)
      throw new Error('Invalid response data')
    }

    return NextResponse.json(enhancedData)
  } catch (error) {
    // Log the full error details
    const err = error as Error
    console.error('Service enhancement error:', {
      name: err.name,
      message: err.message,
      stack: err.stack,
      cause: err.cause
    })

    return NextResponse.json(
      { error: err.message || 'Failed to enhance service' },
      { status: 500 }
    )
  }
} 