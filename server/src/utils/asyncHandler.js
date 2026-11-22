// Wraps an async controller so any thrown error reaches the error handler
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)