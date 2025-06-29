import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '../services/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token') || null)
  
  const isAuthenticated = computed(() => !!token.value)
  
  async function login(email, password) {
    try {
      const response = await authService.login(email, password)
      token.value = response.access_token
      localStorage.setItem('token', response.access_token)
      await fetchUser()
      return true
    } catch (error) {
      console.error('Login failed:', error)
      return false
    }
  }
  
  async function register(userData) {
    try {
      await authService.register(userData)
      return true
    } catch (error) {
      console.error('Registration failed:', error)
      return false
    }
  }
  
  async function fetchUser() {
    if (!token.value) return
    
    try {
      user.value = await authService.getProfile()
    } catch (error) {
      console.error('Failed to fetch user profile:', error)
      logout()
    }
  }
  
  function logout() {
    user.value = null
    token.value = null
    localStorage.removeItem('token')
  }
  
  return {
    user,
    token,
    isAuthenticated,
    login,
    register,
    fetchUser,
    logout
  }
})
