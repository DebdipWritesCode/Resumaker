import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import { educationApi, type EducationResponse, type EducationCreate, type EducationUpdate } from '@/api/education'

interface EducationState {
  educations: EducationResponse[]
  loading: boolean
  error: string | null
}

const initialState: EducationState = {
  educations: [],
  loading: false,
  error: null,
}

// Async thunks
export const fetchEducation = createAsyncThunk(
  'education/fetchEducation',
  async (_, { rejectWithValue }) => {
    try {
      const data = await educationApi.getEducation()
      return data
    } catch (error: any) {
      if (error.response?.status === 404) {
        return [] // Empty array if no educations found
      }
      return rejectWithValue(
        error.response?.data?.detail || error.response?.data?.message || 'Failed to fetch educations'
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

export const createEducation = createAsyncThunk(
  'education/createEducation',
  async (data: EducationCreate, { rejectWithValue }) => {
    try {
      const response = await educationApi.createEducation(data)
      return response
    } catch (error: any) {
      const errorDetail = error.response?.data?.detail || error.response?.data?.message
      const errorMessage = parseValidationError(errorDetail) || 'Failed to create education'
      return rejectWithValue(errorMessage)
    }
  }
)

export const updateEducation = createAsyncThunk(
  'education/updateEducation',
  async ({ educationId, data }: { educationId: number; data: EducationUpdate }, { rejectWithValue }) => {
    try {
      const response = await educationApi.updateEducation(educationId, data)
      return response
    } catch (error: any) {
      if (error.response?.status === 404) {
        return rejectWithValue('Education not found')
      }
      const errorDetail = error.response?.data?.detail || error.response?.data?.message
      const errorMessage = parseValidationError(errorDetail) || 'Failed to update education'
      return rejectWithValue(errorMessage)
    }
  }
)

export const deleteEducation = createAsyncThunk(
  'education/deleteEducation',
  async (educationId: number, { rejectWithValue }) => {
    try {
      await educationApi.deleteEducation(educationId)
      return educationId
    } catch (error: any) {
      if (error.response?.status === 404) {
        return rejectWithValue('Education not found')
      }
      const errorDetail = error.response?.data?.detail || error.response?.data?.message
      const errorMessage = parseValidationError(errorDetail) || 'Failed to delete education'
      return rejectWithValue(errorMessage)
    }
  }
)

const educationSlice = createSlice({
  name: 'education',
  initialState,
  reducers: {
    clearEducation: (state) => {
      state.educations = []
      state.error = null
    },
  },
  extraReducers: (builder) => {
    // Fetch educations
    builder
      .addCase(fetchEducation.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchEducation.fulfilled, (state, action: PayloadAction<EducationResponse[]>) => {
        state.loading = false
        state.educations = action.payload
      })
      .addCase(fetchEducation.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // Create education
    builder
      .addCase(createEducation.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createEducation.fulfilled, (state, action: PayloadAction<EducationResponse>) => {
        state.loading = false
        state.educations.push(action.payload)
      })
      .addCase(createEducation.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // Update education
    builder
      .addCase(updateEducation.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateEducation.fulfilled, (state, action: PayloadAction<EducationResponse>) => {
        state.loading = false
        const index = state.educations.findIndex((e) => e.id === action.payload.id)
        if (index !== -1) {
          state.educations[index] = action.payload
        }
      })
      .addCase(updateEducation.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // Delete education
    builder
      .addCase(deleteEducation.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteEducation.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false
        state.educations = state.educations.filter((e) => e.id !== action.payload)
      })
      .addCase(deleteEducation.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export const { clearEducation } = educationSlice.actions
export default educationSlice.reducer
