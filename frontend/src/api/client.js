import axios from 'axios'

// En producción usa la URL del backend de Render; en desarrollo el proxy de Vite
const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000 // 60s para dar tiempo a Render a despertar (free tier duerme tras inactividad)
})

api.interceptors.response.use(
  res => res.data,
  err => {
    console.error('[API Error]', err.response?.data || err.message)
    return Promise.reject(err)
  }
)

export default api
