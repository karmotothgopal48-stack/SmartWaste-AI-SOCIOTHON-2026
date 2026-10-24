// Mirrors the backend error shape (docs/API_CONTRACT.md §4):
//   { detail: "readable summary", errors?: [{ loc, field, msg, type }] }   (errors only on 422)
export class ApiError extends Error {
  constructor(status, detail, errors = null) {
    super(typeof detail === 'string' ? detail : 'Request failed')
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
    this.errors = errors
  }

  /** Field-level errors keyed by field name, e.g. { weight_kg: 'Input should be greater than 0' } */
  get fieldErrors() {
    const list = this.errors ?? (Array.isArray(this.detail) ? this.detail : [])
    return Object.fromEntries(list.map((e) => [e.field ?? e.loc?.[e.loc.length - 1], e.msg]))
  }
}

/** Build a 422 in the backend's shape from [{ loc, msg, type }] items. */
export function validationError(items) {
  const errors = items.map((e) => ({ ...e, field: e.loc[e.loc.length - 1] }))
  return new ApiError(422, errors.map((e) => `${e.field}: ${e.msg}`).join('; '), errors)
}

export function getErrorMessage(err) {
  if (err instanceof ApiError) {
    if (typeof err.detail === 'string') return err.detail
    return err.errors?.[0]?.msg ?? 'Validation failed'
  }
  return err?.message || 'Something went wrong'
}
