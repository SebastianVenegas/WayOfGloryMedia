import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').slice(-2, -1)[0];
    
    return NextResponse.json({ id });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
} 