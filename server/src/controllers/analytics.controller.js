import { asyncHandler } from '../utils/asyncHandler.js'
import { buildDashboard } from '../services/analytics/dashboardService.js'
import { safeTimeZone } from '../services/analytics/dateUtils.js'

// GET /api/analytics/dashboard?tz=Asia/Dhaka
export const getDashboard = asyncHandler(async (req, res) => {
  const tz = safeTimeZone(req.query.tz)
  res.json({ success: true, dashboard: await buildDashboard(req.user, tz) })
})