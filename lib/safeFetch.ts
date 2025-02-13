export async function safeFetch(url: string, options: RequestInit): Promise<{ 
  ok: boolean;
  data: any;
  status?: number;
  headers?: Record<string, string>;
}> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout

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
    console.log('Response text:', text.substring(0, 200)); // Log first 200 chars of response

    // Handle empty responses
    if (!text.trim()) {
      console.error('Empty response received');
      throw new Error('Empty response received from server');
    }

    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(text);
    } catch (error) {
      console.error('Failed to parse response as JSON:', text.substring(0, 200));
      throw new Error('Invalid JSON response: ' + text.substring(0, 100));
    }

    // Check if response is OK
    if (!response.ok) {
      const errorMessage = data?.error || data?.details || response.statusText || 'Request failed';
      throw new Error(errorMessage);
    }

    return { 
      ok: true, 
      data,
      status: response.status,
      headers: Object.fromEntries(response.headers.entries())
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out after 25 seconds');
    }
    throw error;
  }
} 