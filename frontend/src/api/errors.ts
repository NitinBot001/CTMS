export interface ValidationErrorDetail {
  loc: (string | number)[]
  msg: string
  type: string
  input?: unknown
}

export class ApiError extends Error {
  public status: number
  public details?: ValidationErrorDetail[] | string

  constructor(status: number, message: string, details?: ValidationErrorDetail[] | string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }

  public static isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError
  }

  public getValidationErrorMessage(): string | null {
    if (Array.isArray(this.details) && this.details.length > 0) {
      return this.details.map((d) => `${d.loc.join('.')}: ${d.msg}`).join(', ')
    }
    return null
  }
}
