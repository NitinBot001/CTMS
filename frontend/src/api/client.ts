import { ApiError } from './errors'

export const AUTH_TOKEN_KEY = 'ayuctms_token'

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | null | undefined>
}

class ApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1'
  }

  public getToken(): string | null {
    try {
      return localStorage.getItem(AUTH_TOKEN_KEY)
    } catch {
      return null
    }
  }

  public setToken(token: string | null): void {
    try {
      if (token) {
        localStorage.setItem(AUTH_TOKEN_KEY, token)
      } else {
        localStorage.removeItem(AUTH_TOKEN_KEY)
      }
    } catch (e) {
      console.error('[ApiClient] Failed to access localStorage:', e)
    }
  }

  private buildUrl(path: string, params?: Record<string, string | number | boolean | null | undefined>): string {
    const cleanPath = path.startsWith('/') ? path : `/${path}`
    const fullUrl = `${this.baseUrl}${cleanPath}`

    if (!params) return fullUrl

    const searchParams = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (value !== null && value !== undefined && value !== '') {
        searchParams.append(key, String(value))
      }
    }

    const queryString = searchParams.toString()
    return queryString ? `${fullUrl}?${queryString}` : fullUrl
  }

  public async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { params, headers, ...restOptions } = options
    const url = this.buildUrl(path, params)

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(headers as Record<string, string>),
    }

    const token = this.getToken()
    if (token && !requestHeaders['Authorization']) {
      requestHeaders['Authorization'] = `Bearer ${token}`
    }

    let response: Response
    try {
      response = await fetch(url, {
        ...restOptions,
        headers: requestHeaders,
      })
    } catch (networkError) {
      throw new ApiError(
        0,
        networkError instanceof Error ? networkError.message : 'Network error connecting to backend.'
      )
    }

    if (!response.ok) {
      let errorData: any = null
      let message = `Request failed with status ${response.status}`

      try {
        errorData = await response.json()
        if (typeof errorData?.detail === 'string') {
          message = errorData.detail
        } else if (Array.isArray(errorData?.detail)) {
          message = errorData.detail.map((d: any) => d.msg).join(', ')
        }
      } catch {
        // Response was not JSON
      }

      if (response.status === 401) {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'))
      }

      throw new ApiError(response.status, message, errorData?.detail)
    }

    // 204 No Content
    if (response.status === 204) {
      return {} as T
    }

    return (await response.json()) as T
  }

  public get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' })
  }

  public post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  }

  public patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  }

  public delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: 'DELETE' })
  }
}

export const apiClient = new ApiClient()
