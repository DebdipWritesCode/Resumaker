import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import headingReducer from './slices/headingSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    heading: headingReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
