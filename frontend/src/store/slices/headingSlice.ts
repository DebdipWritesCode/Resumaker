import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import { headingApi, type HeadingResponse, type HeadingCreate, type HeadingUpdate } from '@/api/heading'

interface HeadingState {
  headings: HeadingResponse[]
  loading: boolean
  error: string | null
}

const initialState: HeadingState = {
  headings: [],
  loading: false,
  error: null,
}

// Async thunks
export const fetchHeading = createAsyncThunk(
  'heading/fetchHeading',
  async (_, { rejectWithValue }) => {
    try {
      const data = await headingApi.getHeading()
      return data
    } catch (error: any) {
      if (error.response?.status === 404) {
        return [] // Empty array if no headings found
      }
      return rejectWithValue(
        error.response?.data?.detail || error.response?.data?.message || 'Failed to fetch headings'
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

export const createHeading = createAsyncThunk(
  'heading/createHeading',
  async (data: HeadingCreate, { rejectWithValue }) => {
    try {
      const response = await headingApi.createHeading(data)
      return response
    } catch (error: any) {
      const errorDetail = error.response?.data?.detail || error.response?.data?.message
      const errorMessage = parseValidationError(errorDetail) || 'Failed to create heading'
      return rejectWithValue(errorMessage)
    }
  }
)

export const createOrUpdateHeading = createAsyncThunk(
  'heading/createOrUpdateHeading',
  async (data: HeadingCreate, { rejectWithValue }) => {
    try {
      const response = await headingApi.createOrUpdateHeading(data)
      return response
    } catch (error: any) {
      const errorDetail = error.response?.data?.detail || error.response?.data?.message
      const errorMessage = parseValidationError(errorDetail) || 'Failed to save heading'
      return rejectWithValue(errorMessage)
    }
  }
)

export const updateHeading = createAsyncThunk(
  'heading/updateHeading',
  async ({ headingId, data }: { headingId: number; data: HeadingUpdate }, { rejectWithValue }) => {
    try {
      const response = await headingApi.updateHeading(headingId, data)
      return response
    } catch (error: any) {
      if (error.response?.status === 404) {
        return rejectWithValue('Heading not found')
      }
      const errorDetail = error.response?.data?.detail || error.response?.data?.message
      const errorMessage = parseValidationError(errorDetail) || 'Failed to update heading'
      return rejectWithValue(errorMessage)
    }
  }
)

export const deleteHeading = createAsyncThunk(
  'heading/deleteHeading',
  async (headingId: number, { rejectWithValue }) => {
    try {
      await headingApi.deleteHeading(headingId)
      return headingId
    } catch (error: any) {
      if (error.response?.status === 404) {
        return rejectWithValue('Heading not found')
      }
      const errorDetail = error.response?.data?.detail || error.response?.data?.message
      const errorMessage = parseValidationError(errorDetail) || 'Failed to delete heading'
      return rejectWithValue(errorMessage)
    }
  }
)

const headingSlice = createSlice({
  name: 'heading',
  initialState,
  reducers: {
    clearHeading: (state) => {
      state.headings = []
      state.error = null
    },
  },
  extraReducers: (builder) => {
    // Fetch headings
    builder
      .addCase(fetchHeading.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchHeading.fulfilled, (state, action: PayloadAction<HeadingResponse[]>) => {
        state.loading = false
        state.headings = action.payload
      })
      .addCase(fetchHeading.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // Create heading
    builder
      .addCase(createHeading.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createHeading.fulfilled, (state, action: PayloadAction<HeadingResponse>) => {
        state.loading = false
        state.headings.push(action.payload)
      })
      .addCase(createHeading.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // Create or update heading
    builder
      .addCase(createOrUpdateHeading.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createOrUpdateHeading.fulfilled, (state, action: PayloadAction<HeadingResponse>) => {
        state.loading = false
        state.headings.push(action.payload)
      })
      .addCase(createOrUpdateHeading.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // Update heading
    builder
      .addCase(updateHeading.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateHeading.fulfilled, (state, action: PayloadAction<HeadingResponse>) => {
        state.loading = false
        const index = state.headings.findIndex((h) => h.id === action.payload.id)
        if (index !== -1) {
          state.headings[index] = action.payload
        }
      })
      .addCase(updateHeading.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // Delete heading
    builder
      .addCase(deleteHeading.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteHeading.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false
        state.headings = state.headings.filter((h) => h.id !== action.payload)
      })
      .addCase(deleteHeading.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export const { clearHeading } = headingSlice.actions
export default headingSlice.reducer
