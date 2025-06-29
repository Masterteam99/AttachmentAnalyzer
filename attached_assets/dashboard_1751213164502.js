import { api } from './api'

export const dashboardService = {
  async getStats() {
    const response = await api.get('/dashboard/stats')
    return response.data
  },
  
  async getPerformanceData() {
    const response = await api.get('/dashboard/performance')
    return response.data
  },
  
  async getRecentSessions() {
    const response = await api.get('/dashboard/recent-sessions')
    return response.data
  }
}
