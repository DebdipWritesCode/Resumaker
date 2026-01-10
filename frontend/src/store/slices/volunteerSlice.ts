import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import { volunteerApi, type VolunteerResponse, type VolunteerCreate, type VolunteerUpdate } from '@/api/volunteer'

interface VolunteerState {
  volunteers: VolunteerResponse[]
  loading: boolean
  error: string | null
}

const initialState: VolunteerState = {
  volunteers: [],
  loading: false,
  error: null,
}

// Async thunks
export const fetchVolunteer = createAsyncThunk(
  'volunteer/fetchVolunteer',
  async (_, { rejectWithValue }) => {
    try {
      const data = await volunteerApi.getVolunteer()
      return data
    } catch (error: any) {
      if (error.response?.status === 404) {
        return [] // Empty array if no volunteers found
      }
      return rejectWithValue(
        error.response?.data?.detail || error.response?.data?.message || 'Failed to fetch volunteer experiences'
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

export const createVolunteer = createAsyncThunk(
  'volunteer/createVolunteer',
  async (data: VolunteerCreate, { rejectWithValue }) => {
    try {
      const response = await volunteerApi.createVolunteer(data)
      return response
    } catch (error: any) {
      const errorDetail = error.response?.data?.detail || error.response?.data?.message
      const errorMessage = parseValidationError(errorDetail) || 'Failed to create volunteer experience'
      return rejectWithValue(errorMessage)
    }
  }
)

export const updateVolunteer = createAsyncThunk(
  'volunteer/updateVolunteer',
  async ({ volunteerId, data }: { volunteerId: number; data: VolunteerUpdate }, { rejectWithValue }) => {
    try {
      const response = await volunteerApi.updateVolunteer(volunteerId, data)
      return response
    } catch (error: any) {
      if (error.response?.status === 404) {
        return rejectWithValue('Volunteer experience not found')
      }
      const errorDetail = error.response?.data?.detail || error.response?.data?.message
      const errorMessage = parseValidationError(errorDetail) || 'Failed to update volunteer experience'
      return rejectWithValue(errorMessage)
    }
  }
)

export const deleteVolunteer = createAsyncThunk(
  'volunteer/deleteVolunteer',
  async (volunteerId: number, { rejectWithValue }) => {
    try {
      await volunteerApi.deleteVolunteer(volunteerId)
      return volunteerId
    } catch (error: any) {
      if (error.response?.status === 404) {
        return rejectWithValue('Volunteer experience not found')
      }
      const errorDetail = error.response?.data?.detail || error.response?.data?.message
      const errorMessage = parseValidationError(errorDetail) || 'Failed to delete volunteer experience'
      return rejectWithValue(errorMessage)
    }
  }
)

const volunteerSlice = createSlice({
  name: 'volunteer',
  initialState,
  reducers: {
    clearVolunteer: (state) => {
      state.volunteers = []
      state.error = null
    },
  },
  extraReducers: (builder) => {
    // Fetch volunteers
    builder
      .addCase(fetchVolunteer.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchVolunteer.fulfilled, (state, action: PayloadAction<VolunteerResponse[]>) => {
        state.loading = false
        state.volunteers = action.payload
      })
      .addCase(fetchVolunteer.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // Create volunteer
    builder
      .addCase(createVolunteer.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createVolunteer.fulfilled, (state, action: PayloadAction<VolunteerResponse>) => {
        state.loading = false
        state.volunteers.push(action.payload)
      })
      .addCase(createVolunteer.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // Update volunteer
    builder
      .addCase(updateVolunteer.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateVolunteer.fulfilled, (state, action: PayloadAction<VolunteerResponse>) => {
        state.loading = false
        const index = state.volunteers.findIndex((v) => v.id === action.payload.id)
        if (index !== -1) {
          state.volunteers[index] = action.payload
        }
      })
      .addCase(updateVolunteer.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // Delete volunteer
    builder
      .addCase(deleteVolunteer.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteVolunteer.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false
        state.volunteers = state.volunteers.filter((v) => v.id !== action.payload)
      })
      .addCase(deleteVolunteer.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export const { clearVolunteer } = volunteerSlice.actions
export default volunteerSlice.reducer
