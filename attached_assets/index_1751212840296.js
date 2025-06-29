import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Dashboard from '../views/Dashboard.vue'
import Profile from '../views/Profile.vue'
import WorkoutPlans from '../views/WorkoutPlans.vue'
import Subscription from '../views/Subscription.vue'
import { useAuthStore } from '../store/auth'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresGuest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: { requiresGuest: true }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: { requiresAuth: true }
  },
  {
    path: '/workout-plans',
    name: 'WorkoutPlans',
    component: WorkoutPlans,
    meta: { requiresAuth: true }
  },
  {
    path: '/subscription',
    name: 'Subscription',
    component: Subscription,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const isLoggedIn = authStore.isAuthenticated
  
  if (to.meta.requiresAuth && !isLoggedIn) {
    next('/login')
  } else if (to.meta.requiresGuest && isLoggedIn) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
