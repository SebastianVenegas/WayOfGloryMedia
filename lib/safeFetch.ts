export async function safeFetch(url: string, options: RequestInit): Promise<{ ok: boolean, data: any }> {
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
        'Content-Type': 'application/json'
      },
      next: { revalidate: 0 }
    });
    clearTimeout(timeoutId);

    const text = await response.text();
    console.log('Response status:', response.status);

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      console.error('Expected JSON response but received:', text);
      throw new Error(text);
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (error) {
      console.error('Failed to parse JSON response:', text);
      throw new Error('Invalid JSON response from server: ' + text);
    }

    if (!response.ok) {
      throw new Error(data?.error || data?.details || response.statusText || 'Request failed');
    }

    return { ok: true, data };
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out after 25 seconds');
    }
    throw error;
  }
} 