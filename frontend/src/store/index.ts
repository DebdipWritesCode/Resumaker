import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import headingReducer from './slices/headingSlice'
import educationReducer from './slices/educationSlice'
import experienceReducer from './slices/experienceSlice'
import projectReducer from './slices/projectSlice'
import skillReducer from './slices/skillSlice'
import certificationReducer from './slices/certificationSlice'
import awardReducer from './slices/awardSlice'
import volunteerReducer from './slices/volunteerSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    heading: headingReducer,
    education: educationReducer,
    experience: experienceReducer,
    project: projectReducer,
    skill: skillReducer,
    certification: certificationReducer,
    award: awardReducer,
    volunteer: volunteerReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
