import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import { certificationApi, type CertificationResponse, type CertificationCreate, type CertificationUpdate } from '@/api/certification'

interface CertificationState {
  certifications: CertificationResponse[]
  loading: boolean
  error: string | null
}

const initialState: CertificationState = {
  certifications: [],
  loading: false,
  error: null,
}

// Async thunks
export const fetchCertification = createAsyncThunk(
  'certification/fetchCertification',
  async (_, { rejectWithValue }) => {
    try {
      const data = await certificationApi.getCertification()
      return data
    } catch (error: any) {
      if (error.response?.status === 404) {
        return [] // Empty array if no certifications found
      }
      return rejectWithValue(
        error.response?.data?.detail || error.response?.data?.message || 'Failed to fetch certifications'
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

export const createCertification = createAsyncThunk(
  'certification/createCertification',
  async (data: CertificationCreate, { rejectWithValue }) => {
    try {
      const response = await certificationApi.createCertification(data)
      return response
    } catch (error: any) {
      const errorDetail = error.response?.data?.detail || error.response?.data?.message
      const errorMessage = parseValidationError(errorDetail) || 'Failed to create certification'
      return rejectWithValue(errorMessage)
    }
  }
)

export const updateCertification = createAsyncThunk(
  'certification/updateCertification',
  async ({ certificationId, data }: { certificationId: number; data: CertificationUpdate }, { rejectWithValue }) => {
    try {
      const response = await certificationApi.updateCertification(certificationId, data)
      return response
    } catch (error: any) {
      if (error.response?.status === 404) {
        return rejectWithValue('Certification not found')
      }
      const errorDetail = error.response?.data?.detail || error.response?.data?.message
      const errorMessage = parseValidationError(errorDetail) || 'Failed to update certification'
      return rejectWithValue(errorMessage)
    }
  }
)

export const deleteCertification = createAsyncThunk(
  'certification/deleteCertification',
  async (certificationId: number, { rejectWithValue }) => {
    try {
      await certificationApi.deleteCertification(certificationId)
      return certificationId
    } catch (error: any) {
      if (error.response?.status === 404) {
        return rejectWithValue('Certification not found')
      }
      const errorDetail = error.response?.data?.detail || error.response?.data?.message
      const errorMessage = parseValidationError(errorDetail) || 'Failed to delete certification'
      return rejectWithValue(errorMessage)
    }
  }
)

const certificationSlice = createSlice({
  name: 'certification',
  initialState,
  reducers: {
    clearCertification: (state) => {
      state.certifications = []
      state.error = null
    },
  },
  extraReducers: (builder) => {
    // Fetch certifications
    builder
      .addCase(fetchCertification.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCertification.fulfilled, (state, action: PayloadAction<CertificationResponse[]>) => {
        state.loading = false
        state.certifications = action.payload
      })
      .addCase(fetchCertification.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // Create certification
    builder
      .addCase(createCertification.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createCertification.fulfilled, (state, action: PayloadAction<CertificationResponse>) => {
        state.loading = false
        state.certifications.push(action.payload)
      })
      .addCase(createCertification.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // Update certification
    builder
      .addCase(updateCertification.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateCertification.fulfilled, (state, action: PayloadAction<CertificationResponse>) => {
        state.loading = false
        const index = state.certifications.findIndex((c) => c.id === action.payload.id)
        if (index !== -1) {
          state.certifications[index] = action.payload
        }
      })
      .addCase(updateCertification.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // Delete certification
    builder
      .addCase(deleteCertification.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteCertification.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false
        state.certifications = state.certifications.filter((c) => c.id !== action.payload)
      })
      .addCase(deleteCertification.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export const { clearCertification } = certificationSlice.actions
export default certificationSlice.reducer
