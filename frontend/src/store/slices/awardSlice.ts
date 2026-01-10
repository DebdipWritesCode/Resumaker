import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import { awardApi, type AwardResponse, type AwardCreate, type AwardUpdate } from '@/api/award'

interface AwardState {
  awards: AwardResponse[]
  loading: boolean
  error: string | null
}

const initialState: AwardState = {
  awards: [],
  loading: false,
  error: null,
}

// Async thunks
export const fetchAward = createAsyncThunk(
  'award/fetchAward',
  async (_, { rejectWithValue }) => {
    try {
      const data = await awardApi.getAward()
      return data
    } catch (error: any) {
      if (error.response?.status === 404) {
        return [] // Empty array if no awards found
      }
      return rejectWithValue(
        error.response?.data?.detail || error.response?.data?.message || 'Failed to fetch awards'
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

export const createAward = createAsyncThunk(
  'award/createAward',
  async (data: AwardCreate, { rejectWithValue }) => {
    try {
      const response = await awardApi.createAward(data)
      return response
    } catch (error: any) {
      const errorDetail = error.response?.data?.detail || error.response?.data?.message
      const errorMessage = parseValidationError(errorDetail) || 'Failed to create award'
      return rejectWithValue(errorMessage)
    }
  }
)

export const updateAward = createAsyncThunk(
  'award/updateAward',
  async ({ awardId, data }: { awardId: number; data: AwardUpdate }, { rejectWithValue }) => {
    try {
      const response = await awardApi.updateAward(awardId, data)
      return response
    } catch (error: any) {
      if (error.response?.status === 404) {
        return rejectWithValue('Award not found')
      }
      const errorDetail = error.response?.data?.detail || error.response?.data?.message
      const errorMessage = parseValidationError(errorDetail) || 'Failed to update award'
      return rejectWithValue(errorMessage)
    }
  }
)

export const deleteAward = createAsyncThunk(
  'award/deleteAward',
  async (awardId: number, { rejectWithValue }) => {
    try {
      await awardApi.deleteAward(awardId)
      return awardId
    } catch (error: any) {
      if (error.response?.status === 404) {
        return rejectWithValue('Award not found')
      }
      const errorDetail = error.response?.data?.detail || error.response?.data?.message
      const errorMessage = parseValidationError(errorDetail) || 'Failed to delete award'
      return rejectWithValue(errorMessage)
    }
  }
)

const awardSlice = createSlice({
  name: 'award',
  initialState,
  reducers: {
    clearAward: (state) => {
      state.awards = []
      state.error = null
    },
  },
  extraReducers: (builder) => {
    // Fetch awards
    builder
      .addCase(fetchAward.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAward.fulfilled, (state, action: PayloadAction<AwardResponse[]>) => {
        state.loading = false
        state.awards = action.payload
      })
      .addCase(fetchAward.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // Create award
    builder
      .addCase(createAward.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createAward.fulfilled, (state, action: PayloadAction<AwardResponse>) => {
        state.loading = false
        state.awards.push(action.payload)
      })
      .addCase(createAward.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // Update award
    builder
      .addCase(updateAward.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateAward.fulfilled, (state, action: PayloadAction<AwardResponse>) => {
        state.loading = false
        const index = state.awards.findIndex((a) => a.id === action.payload.id)
        if (index !== -1) {
          state.awards[index] = action.payload
        }
      })
      .addCase(updateAward.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // Delete award
    builder
      .addCase(deleteAward.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteAward.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false
        state.awards = state.awards.filter((a) => a.id !== action.payload)
      })
      .addCase(deleteAward.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export const { clearAward } = awardSlice.actions
export default awardSlice.reducer
