export {};

// TODO: Implement the generate-service endpoint if needed

// For now, we simply return a 501 Not Implemented response for POST requests

import { NextResponse } from 'next/server';

export async function POST() {
  return new NextResponse(JSON.stringify({ error: 'Not implemented' }), { status: 501, headers: { 'Content-Type': 'application/json' } });
}
