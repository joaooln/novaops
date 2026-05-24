const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // Client-side (browser)
    // If NEXT_PUBLIC_API_URL is set and is NOT Docker internal (backend:8000), use it.
    // Otherwise, default to relative paths to let Nginx handle routing.
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    if (envUrl && !envUrl.includes('backend:8000')) {
      return envUrl;
    }
    return ''; // Fallback to relative URL
  }
  // Server-side (Next.js server)
  // Inside Docker, the container can access the backend service directly via http://backend:8000
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
};

export const getApiUrl = (path: string) => {
  const baseUrl = getBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};

export const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Error fetching data: ${res.statusText} (${res.status})`);
  }
  return res.json();
};
