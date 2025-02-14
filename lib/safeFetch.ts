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
    console.log('Response text:', text.substring(0, 200));

    // Check if the response Content-Type indicates JSON
    const contentType = response.headers.get('content-type') || "";
    if (!contentType.includes('application/json')) {
      console.error('Expected JSON response but got:', contentType, text.substring(0, 200));
      return {
        ok: false,
        data: { 
          error: 'Invalid server response',
          details: `Expected JSON response but received content-type: ${contentType}. Response: ${text.substring(0, 200)}`
        },
        status: response.status
      };
    }

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
      // Remove any BOM characters and whitespace
      const cleanText = text.replace(/^\uFEFF/, '').trim();
      
      // Handle case where response is just a string error message
      if (cleanText.startsWith('"') && cleanText.endsWith('"')) {
        const errorMessage = JSON.parse(cleanText);
        return {
          ok: false,
          data: { 
            error: errorMessage,
            details: 'Server returned error message'
          },
          status: response.status
        };
      }

      const data = JSON.parse(cleanText);
      
      // Check if the response is an error object
      if (data && typeof data === 'object' && ('error' in data || 'details' in data)) {
        return {
          ok: false,
          data: {
            error: data.error || data.details || 'Unknown error',
            details: data.details || data.error || 'No additional details'
          },
          status: response.status
        };
      }

      // If response is not OK but we got JSON, format it as an error
      if (!response.ok) {
        return {
          ok: false,
          data: {
            error: data?.error || data?.message || response.statusText || 'Request failed',
            details: data?.details || data?.error || response.statusText
          },
          status: response.status
        };
      }

      // Success case
      return { 
        ok: true, 
        data,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries())
      };
    } catch (parseError) {
      console.error('Failed to parse response:', {
        text: text.substring(0, 200),
        error: parseError instanceof Error ? parseError.message : 'Unknown parse error'
      });

      // If it looks like HTML, return specific error
      if (text.trim().toLowerCase().startsWith('<!doctype html') || 
          text.trim().startsWith('<html') || 
          text.trim().startsWith('<')) {
        return {
          ok: false,
          data: { 
            error: 'Received HTML instead of JSON response',
            details: 'The server returned an HTML page instead of JSON data'
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
            error: 'Server error',
            details: errorMatch[1] || text.substring(0, 100)
          },
          status: response.status
        };
      }

      // Generic error for unparseable response
      return {
        ok: false,
        data: { 
          error: 'Invalid server response',
          details: `Could not parse server response: ${text.substring(0, 100)}`
        },
        status: response.status
      };
    }
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error('Network or system error:', {
      url,
      error: error.message,
      stack: error.stack
    });
    
    // Handle timeout
    if (error.name === 'AbortError') {
      return {
        ok: false,
        data: { 
          error: 'Request timeout',
          details: 'The request took too long to complete'
        },
        status: 504
      };
    }

    // Handle network or other errors
    return {
      ok: false,
      data: { 
        error: 'Request failed',
        details: error.message || 'A network or system error occurred'
      },
      status: 500
    };
  }
} 