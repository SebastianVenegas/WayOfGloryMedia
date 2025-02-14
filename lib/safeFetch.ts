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

    // If the response text appears to be an error message, return it without attempting JSON.parse
    if (cleanText.toLowerCase().startsWith('an error occurred') || cleanText.toLowerCase().startsWith('application error')) {
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

    // Check for malformed JSON: if it starts with a quote but does not end with one, consider it malformed
    // Try to parse as JSON first
    try {
      // Remove any BOM characters and whitespace
      const cleanText = text.replace(/^\uFEFF/, '').trim();
      console.log('Clean response text:', cleanText.substring(0, 200));

      // If the response text appears to be an error message, return it without attempting JSON.parse
      if (cleanText.toLowerCase().startsWith('an error occurred') || cleanText.toLowerCase().startsWith('application error')) {
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

      // Use a regex to check that the cleanText starts with a valid JSON opening character ('{', '[' or '"')
      if (!/^[\{\[\"]/i.test(cleanText)) {
        console.error('Response does not appear to be valid JSON. Raw response:', cleanText.substring(0, 100));
        return {
          ok: false,
          data: {
            error: 'Invalid JSON response',
            details: `Response does not start with a valid JSON character. Raw response: ${cleanText.substring(0, 100)}`
          },
          status: response.status
        };
      }

      // Handle case where response is just a string error message
      if (cleanText.startsWith('"') && cleanText.endsWith('"')) {
        try {
          const errorMessage = JSON.parse(cleanText);
          return {
            ok: false,
            data: { 
              error: errorMessage,
              details: 'Server returned error message'
            },
            status: response.status
          };
        } catch (e) {
          console.error('Failed to parse string error message:', e);
          return {
            ok: false,
            data: {
              error: 'Malformed JSON error message',
              details: cleanText.substring(0, 300)
            },
            status: response.status
          };
        }
      }

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
        
        // Fallback: attempt to extract valid JSON substring from the response
        const jsonMatch = cleanText.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
        if (jsonMatch) {
          try {
            const extractedData = JSON.parse(jsonMatch[0]);
            console.warn('Extracted valid JSON substring from response.');
            return { 
              ok: true, 
              data: extractedData,
              status: response.status,
              headers: Object.fromEntries(response.headers.entries())
            };
          } catch (ex) {
            console.error('Fallback JSON extraction failed:', ex);
          }
        }
        
        return {
           ok: false,
           data: {
             error: 'Failed to parse JSON response',
             details: `The response could not be parsed as JSON. Raw response: ${text.substring(0, 300)}`
           },
           status: response.status
        };
      }
    } catch (parseError) {
      console.error('Failed to parse JSON response:', {
        text: text.substring(0, 300),
        error: parseError instanceof Error ? parseError.message : 'Unknown parse error'
      });
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