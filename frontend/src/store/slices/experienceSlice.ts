import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import { experienceApi, type ExperienceResponse, type ExperienceCreate, type ExperienceUpdate } from '@/api/experience'

interface ExperienceState {
  experiences: ExperienceResponse[]
  loading: boolean
  error: string | null
}

const initialState: ExperienceState = {
  experiences: [],
  loading: false,
  error: null,
}

// Async thunks
export const fetchExperience = createAsyncThunk(
  'experience/fetchExperience',
  async (_, { rejectWithValue }) => {
    try {
      const data = await experienceApi.getExperience()
      return data
    } catch (error: any) {
      if (error.response?.status === 404) {
        return [] // Empty array if no experiences found
      }
      return rejectWithValue(
        error.response?.data?.detail || error.response?.data?.message || 'Failed to fetch experiences'
      )
    }
  }
)

// Helper function to parse FastAPI validation errors
const parseValidationError = (detail: any): string => {
  if (typeof detail === 'string') {
    return detail
  }
  
  if (Array.isArray(detail)) {
    // FastAPI validation errors are arrays of error objects
    return detail
      .map((err: any) => {
        const field = err.loc?.slice(1).join('.') || 'field'
        const message = err.msg || 'Invalid value'
        return `${field}: ${message}`
      })
      .join('; ')
  }
  
  if (typeof detail === 'object' && detail !== null) {
    // Single error object
    const field = detail.loc?.slice(1).join('.') || 'field'
    const message = detail.msg || 'Invalid value'
    return `${field}: ${message}`
  }
  
  return 'Validation error occurred'
}

export const createExperience = createAsyncThunk(
  'experience/createExperience',
  async (data: ExperienceCreate, { rejectWithValue }) => {
    try {
      const response = await experienceApi.createExperience(data)
      return response
    } catch (error: any) {
      const errorDetail = error.response?.data?.detail || error.response?.data?.message
      const errorMessage = parseValidationError(errorDetail) || 'Failed to create experience'
      return rejectWithValue(errorMessage)
    }
  }
)

export const updateExperience = createAsyncThunk(
  'experience/updateExperience',
  async ({ experienceId, data }: { experienceId: number; data: ExperienceUpdate }, { rejectWithValue }) => {
    try {
      const response = await experienceApi.updateExperience(experienceId, data)
      return response
    } catch (error: any) {
      if (error.response?.status === 404) {
        return rejectWithValue('Experience not found')
      }
      const errorDetail = error.response?.data?.detail || error.response?.data?.message
      const errorMessage = parseValidationError(errorDetail) || 'Failed to update experience'
      return rejectWithValue(errorMessage)
    }
  }
)

export const deleteExperience = createAsyncThunk(
  'experience/deleteExperience',
  async (experienceId: number, { rejectWithValue }) => {
    try {
      await experienceApi.deleteExperience(experienceId)
      return experienceId
    } catch (error: any) {
      if (error.response?.status === 404) {
        return rejectWithValue('Experience not found')
      }
      const errorDetail = error.response?.data?.detail || error.response?.data?.message
      const errorMessage = parseValidationError(errorDetail) || 'Failed to delete experience'
      return rejectWithValue(errorMessage)
    }
  }
)

const experienceSlice = createSlice({
  name: 'experience',
  initialState,
  reducers: {
    clearExperience: (state) => {
      state.experiences = []
      state.error = null
    },
  },
  extraReducers: (builder) => {
    // Fetch experiences
    builder
      .addCase(fetchExperience.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchExperience.fulfilled, (state, action: PayloadAction<ExperienceResponse[]>) => {
        state.loading = false
        state.experiences = action.payload
      })
      .addCase(fetchExperience.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // Create experience
    builder
      .addCase(createExperience.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createExperience.fulfilled, (state, action: PayloadAction<ExperienceResponse>) => {
        state.loading = false
        state.experiences.push(action.payload)
      })
      .addCase(createExperience.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // Update experience
    builder
      .addCase(updateExperience.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateExperience.fulfilled, (state, action: PayloadAction<ExperienceResponse>) => {
        state.loading = false
        const index = state.experiences.findIndex((e) => e.id === action.payload.id)
        if (index !== -1) {
          state.experiences[index] = action.payload
        }
      })
      .addCase(updateExperience.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // Delete experience
    builder
      .addCase(deleteExperience.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteExperience.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false
        state.experiences = state.experiences.filter((e) => e.id !== action.payload)
      })
      .addCase(deleteExperience.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export const { clearExperience } = experienceSlice.actions
export default experienceSlice.reducer
