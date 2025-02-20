import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Validate OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }

    // Initialize OpenAI
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Parse request body
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Generate improved prompt
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      temperature: 0.3,
      max_tokens: 150,
      messages: [
        {
          role: "system",
          content: `You improve email generation prompts for Way of Glory Media. Your task is to make prompts more specific and actionable.

IMPORTANT RULES:
1. Match the exact intent of the original prompt
2. Keep the same order status/stage as the original prompt
3. Don't add steps or stages that weren't in the original
4. Focus on one-way communication from Way of Glory to customer
5. Keep it under 2 sentences
6. Return only the improved prompt text

Examples:
Input: "order delivered"
Output: "Write an email confirming successful delivery of their order and expressing our appreciation for their business."

Input: "payment reminder"
Output: "Write a courteous payment reminder email outlining the pending balance and payment methods available."

Input: "installation scheduled"
Output: "Write an email confirming their upcoming installation appointment and providing preparation instructions."

DO NOT:
- Add tracking if not mentioned
- Change the order status
- Add extra steps or requirements
- Include generic templates
- Ask for customer actions`
        },
        {
          role: "user",
          content: `Make this prompt more specific while keeping its exact intent: ${prompt}`
        }
      ]
    });

    const improvedPrompt = completion.choices[0]?.message?.content?.trim();

    if (!improvedPrompt) {
      throw new Error('Failed to generate improved prompt');
    }

    // Return the improved prompt
    return NextResponse.json({ improvedPrompt });

  } catch (error) {
    console.error('Error in improve-prompt:', error);
    return NextResponse.json(
      { 
        error: 'Failed to improve prompt',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 