// lib/api.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function getProductImageUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("/")) {
    return `${API_BASE_URL}${url}`;
  }
  return url;
}

interface RequestOptions extends RequestInit {
  token?: string | null;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  
  // Get token from localStorage if not provided
  let token = options.token;
  if (token === undefined && typeof window !== "undefined") {
    token = localStorage.getItem("espressopro_token");
  }

  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("espressopro_token");
      localStorage.removeItem("espressopro_user");
      // Redirect to login if not already there
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Request failed with status ${response.status}`);
  }

  // Handle empty or 204 responses
  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

export async function apiGet<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return request<T>(path, { ...options, method: "GET" });
}

export async function apiPost<T>(path: string, body: any, options: RequestOptions = {}): Promise<T> {
  const isFormData = body instanceof FormData;
  return request<T>(path, {
    ...options,
    method: "POST",
    body: isFormData ? body : JSON.stringify(body),
  });
}

export async function apiPut<T>(path: string, body: any, options: RequestOptions = {}): Promise<T> {
  const isFormData = body instanceof FormData;
  return request<T>(path, {
    ...options,
    method: "PUT",
    body: isFormData ? body : JSON.stringify(body),
  });
}

export async function apiDelete<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return request<T>(path, { ...options, method: "DELETE" });
}
