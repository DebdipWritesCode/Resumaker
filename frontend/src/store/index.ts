import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import headingReducer from './slices/headingSlice'
import educationReducer from './slices/educationSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    heading: headingReducer,
    education: educationReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
