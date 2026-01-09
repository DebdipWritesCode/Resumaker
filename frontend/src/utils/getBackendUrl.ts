import { getEnv } from './getEnv'

/**
 * Get the backend URL from environment variables
 * @returns The backend URL, defaults to http://localhost:8000 if not set
 */
export const getBackendUrl = (): string => {
  return getEnv('VITE_BACKEND_URL') || 'http://localhost:8000'
}
