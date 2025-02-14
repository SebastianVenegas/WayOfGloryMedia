export async function safeFetch(url: string, options: RequestInit): Promise<{ 
  ok: boolean;
  data: any;
  status?: number;
  headers?: Record<string, string>;
}> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    console.log('Making request to:', url);
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        ...options.headers,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      },
      cache: 'no-store',
      next: { revalidate: 0 }
    });
    clearTimeout(timeoutId);

    const text = await response.text();
    console.log('Response status:', response.status);
    
    // Handle empty responses
    if (!text.trim()) {
      console.error('Empty response received');
      return {
        ok: false,
        data: { error: 'Empty response received from server' },
        status: response.status
      };
    }

    // Try to parse as JSON first
    try {
      const cleanText = text.replace(/^\uFEFF/, '').trim();
      const data = JSON.parse(cleanText);
      
      // Even if we can parse JSON, check if it's an error response
      if (!response.ok) {
        return {
          ok: false,
          data: {
            error: data?.error || data?.details || response.statusText || 'Request failed',
            details: data?.details || data?.error || response.statusText
          },
          status: response.status
        };
      }

      return { 
        ok: true, 
        data,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries())
      };
    } catch (parseError) {
      // If JSON parsing fails, check if it's HTML
      if (text.trim().toLowerCase().startsWith('<!doctype html') || 
          text.trim().startsWith('<html') || 
          text.trim().startsWith('<')) {
        console.error('HTML response received instead of JSON');
        return {
          ok: false,
          data: { 
            error: 'Received HTML instead of JSON response',
            details: text.substring(0, 100)
          },
          status: response.status
        };
      }

      // Try to extract error message from text
      const errorMatch = text.match(/error occurred|an error occurred: (.*?)(?:\n|$)/i);
      if (errorMatch) {
        return {
          ok: false,
          data: { 
            error: errorMatch[1] || 'Server error occurred',
            details: text.substring(0, 100)
          },
          status: response.status
        };
      }

      // Generic error for unparseable response
      return {
        ok: false,
        data: { 
          error: 'Invalid response format',
          details: text.substring(0, 100)
        },
        status: response.status
      };
    }
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    // Handle timeout
    if (error.name === 'AbortError') {
      return {
        ok: false,
        data: { 
          error: 'Request timed out',
          details: 'The request took too long to complete'
        },
        status: 504
      };
    }

    // Handle network or other errors
    console.error('SafeFetch error:', {
      url,
      error: error.message,
      stack: error.stack
    });

    return {
      ok: false,
      data: { 
        error: 'Request failed',
        details: error.message
      },
      status: 500
    };
  }
} 