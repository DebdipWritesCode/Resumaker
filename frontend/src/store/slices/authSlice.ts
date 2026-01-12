import { createSlice } from '@reduxjs/toolkit'

interface AuthState {
  accessToken: string | null
  isInitialized: boolean
  name: string | null
  email: string | null
  credits: number | null
  max_resume: number | null
  is_admin: boolean | null
}

const initialState: AuthState = {
  accessToken: null,
  isInitialized: false,
  name: null,
  email: null,
  credits: null,
  max_resume: null,
  is_admin: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAccessToken: (state, action) => {
      // Handle string, or objects with jwt_token (refresh) or access_token (login)
      const payload = action.payload as string | { jwt_token?: string; access_token?: string }
      if (typeof payload === 'string') {
        state.accessToken = payload
      } else if (payload.jwt_token) {
        state.accessToken = payload.jwt_token
      } else if (payload.access_token) {
        state.accessToken = payload.access_token
      }
      state.isInitialized = true
    },
    clearAccessToken: (state) => {
      state.accessToken = null
      state.name = null
      state.email = null
      state.credits = null
      state.max_resume = null
      state.is_admin = null
      state.isInitialized = true
    },
    setUserData: (state, action) => {
      state.name = action.payload.name || null
      state.email = action.payload.email || null
      if (action.payload.credits !== undefined) {
        state.credits = action.payload.credits
      }
      if (action.payload.max_resume !== undefined) {
        state.max_resume = action.payload.max_resume
      }
      if (action.payload.is_admin !== undefined) {
        state.is_admin = action.payload.is_admin
      }
    },
    setCredits: (state, action) => {
      state.credits = action.payload
    },
    setMaxResume: (state, action) => {
      state.max_resume = action.payload
    },
    setInitialized: (state) => {
      state.isInitialized = true
    },
    updateUserName: (state, action) => {
      state.name = action.payload.name || null
    },
    updateUserEmail: (state, action) => {
      state.email = action.payload.email || null
    },
    setIsAdmin: (state, action) => {
      state.is_admin = action.payload
    },
  },
})

export const { setAccessToken, clearAccessToken, setUserData, setInitialized, setCredits, setMaxResume, updateUserName, updateUserEmail, setIsAdmin } = authSlice.actions
export default authSlice.reducer
