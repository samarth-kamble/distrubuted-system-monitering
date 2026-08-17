const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface RequestOptions extends RequestInit {
  body?: any;
}

export async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
  
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  
  // Inject access token from localStorage when in browser environment
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("pulseguard_token");
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }
  
  const config: RequestInit = {
    ...options,
    headers,
  };
  
  if (options.body && !(options.body instanceof FormData)) {
    config.body = JSON.stringify(options.body);
  }
  
  const response = await fetch(url, config);
  
  if (!response.ok) {
    let errorMessage = "An error occurred while fetching the data.";
    try {
      const errorData = await response.json();
      // NestJS exceptions return array of error messages or string
      if (Array.isArray(errorData.message)) {
        errorMessage = errorData.message.join(", ");
      } else {
        errorMessage = errorData.message || errorMessage;
      }
    } catch (_) {
      // Fallback to text if not json
      try {
        const text = await response.text();
        if (text) errorMessage = text;
      } catch (__) {}
    }
    throw new Error(errorMessage);
  }
  
  if (response.status === 204) {
    return {} as T;
  }
  
  return response.json() as Promise<T>;
}
