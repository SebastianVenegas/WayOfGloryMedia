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

    // Log and clean the response text
    const cleanText = text.replace(/^\uFEFF/, '').trim();
    console.log('Clean response text:', cleanText.substring(0, 200));

    // Additional check: if the first character is not '{' or '[', return error immediately
    if (cleanText[0] !== '{' && cleanText[0] !== '[') {
      console.error('Response does not start with a valid JSON delimiter. First character:', cleanText[0], 'Raw response:', cleanText.substring(0, 100));
      return {
        ok: false,
        data: {
          error: 'Invalid JSON response',
          details: `Response does not start with a JSON object or array. Raw response: ${cleanText.substring(0, 100)}`
        },
        status: response.status
      };
    }

    // If the response text appears to be an error message, return it without attempting JSON.parse
    if (cleanText.toLowerCase().startsWith('an error') || cleanText.toLowerCase().startsWith('application error')) {
      console.error('Response appears to be an error message rather than valid JSON:', cleanText.substring(0, 100));
      return {
        ok: false,
        data: {
          error: 'Server error',
          details: cleanText.substring(0, 300)
        },
        status: response.status
      };
    }

    // Additional sanity check: if the cleaned response does not start with '{' or '[', return error
    if (!cleanText.startsWith('{') && !cleanText.startsWith('[')) {
      console.error('Response does not begin with a valid JSON character:', cleanText.substring(0, 100));
      return {
        ok: false,
        data: {
          error: 'Invalid JSON response',
          details: `Response does not start with a valid JSON character. Raw response: ${cleanText.substring(0, 100)}`
        },
        status: response.status
      };
    }

    // Try to parse as JSON first
    try {
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
      console.error('Failed to parse JSON response:', {
        text: text.substring(0, 300),
        error: parseError instanceof Error ? parseError.message : 'Unknown parse error'
      });
      
      // Fallback: attempt to extract valid JSON substring using regex
      const jsonMatch = cleanText.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
      if (jsonMatch) {
        try {
          const extractedData = JSON.parse(jsonMatch[0]);
          console.warn('Extracted valid JSON substring from response using regex.');
          return { 
            ok: true, 
            data: extractedData,
            status: response.status,
            headers: Object.fromEntries(response.headers.entries())
          };
        } catch (ex) {
          console.error('Fallback JSON extraction using regex failed:', ex);
        }
      }
      
      // Fallback: locate first '{' or '[' manually
      const idxBrace = cleanText.indexOf('{');
      const idxBracket = cleanText.indexOf('[');
      let idx = -1;
      if (idxBrace !== -1 && idxBracket !== -1) {
        idx = Math.min(idxBrace, idxBracket);
      } else if (idxBrace !== -1) {
        idx = idxBrace;
      } else if (idxBracket !== -1) {
        idx = idxBracket;
      }
      if (idx !== -1) {
        try {
          const extractedData = JSON.parse(cleanText.slice(idx));
          console.warn('Extracted valid JSON substring from response using manual index extraction.');
          return { 
            ok: true, 
            data: extractedData,
            status: response.status,
            headers: Object.fromEntries(response.headers.entries())
          };
        } catch (ex) {
          console.error('Fallback JSON extraction using manual index failed:', ex);
        }
      }
      
      // If all fallback attempts fail, return error response
      return {
        ok: false,
        data: {
          error: 'Failed to parse JSON response',
          details: `The response could not be parsed as JSON. Raw response: ${text.substring(0, 300)}`
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