import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
  try {
    const { prompt, category, expertise, style, requirements } = await req.json()

    let systemPrompt = expertise 
      ? `You are a ${expertise.role} with ${expertise.background}. Your focus is on ${expertise.focus}. 
         Create detailed, professional services with accurate pricing and features specific to ${category} services.
         Ensure all recommendations and specifications meet industry standards for ${category.toLowerCase()} services.

         IMPORTANT: If the prompt mentions a pastor, church, or religious organization:
         1. Use formal contract language and terminology
         2. Focus on deliverables and specifications
         3. Maintain professional, business-focused language
         4. Structure as a formal service agreement
         5. Use precise, technical descriptions
         6. Include clear scope and specifications
         7. Avoid phrases like "custom for" or "tailored for"
         8. Keep the tone strictly professional and formal

         CRITICAL: You must ONLY return a valid JSON object with no additional text or conversation.
         The JSON must follow this exact format:
         {
           "title": "string (use formal service agreement titles)",
           "description": "string (use formal contract language)",
           "price": number,
           "features": ["string", "string", ...],
           "metadata": {
             "tier": "string",
             "duration": "string",
             "tags": ["string", ...]
           }
         }`
      : "You are a professional service creator for an audio/visual/software equipment company. Create detailed, professional services with accurate pricing and features. You must ONLY return a valid JSON object with no additional text.";

    // Add style context if provided
    if (style) {
      systemPrompt += `\nMaintain a ${style} tone and focus on ${requirements?.style?.focus || 'professional standards'}.`;
    }

    const userPrompt = `Create a professional ${category} service based on this description: "${prompt}". 
    ${prompt.toLowerCase().includes('church') || prompt.toLowerCase().includes('pastor') 
      ? 'Format this as a formal service agreement using contract-style language. Focus on deliverables and specifications rather than personalization.' 
      : 'Make it professional and specific to any client requirements mentioned.'} 

    CRITICAL: Return ONLY a valid JSON object with these exact fields:
    {
      "title": "Professional service agreement title (avoid using client names)",
      "description": "Formal contract-style description focusing on deliverables",
      "price": number,
      "features": ["feature1", "feature2", "feature3"],
      "metadata": {
        "tier": "Standard/Premium/Custom",
        "duration": "Hourly/Daily/Weekly/Monthly/Project-based",
        "tags": ["relevant", "tags", "here"]
      }
    }

    Do not include any other text, conversation, or explanation - ONLY the JSON object.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: systemPrompt + "\n\nIMPORTANT: You must respond with ONLY a valid JSON object. No other text or explanation is allowed. The response must be parseable by JSON.parse()."
        },
        {
          role: "user",
          content: userPrompt + "\n\nRespond with ONLY the JSON object. No other text. The response must be valid JSON that can be parsed with JSON.parse()."
        }
      ],
      temperature: 0.7
    });

    const responseContent = completion.choices[0]?.message?.content || '{}'
    let generatedService
    
    try {
      generatedService = JSON.parse(responseContent)
    } catch (parseError) {
      console.error('Error parsing service JSON:', parseError)
      return NextResponse.json(
        { error: 'Failed to parse generated service' },
        { status: 500 }
      )
    }

    return NextResponse.json(generatedService)
  } catch (error) {
    console.error('Error generating service:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate service' },
      { status: 500 }
    )
  }
} 