import ApiError from '../utils/ApiError.js'

// Usage: router.post('/register', validate(registerSchema), controller)
// Controllers read the cleaned data from req.validated.body (or .query / .params)
export const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source])

  if (!result.success) {
    const details = result.error.issues.map((i) => ({
      field: i.path.join('.'),
      message: i.message,
    }))
    return next(new ApiError(400, 'Please check the highlighted fields', details))
  }

  req.validated = { ...req.validated, [source]: result.data }
  next()
}