import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import { skillApi, type SkillResponse, type SkillCreate, type SkillUpdate } from '@/api/skill'

interface SkillState {
  skills: SkillResponse[]
  loading: boolean
  error: string | null
}

const initialState: SkillState = {
  skills: [],
  loading: false,
  error: null,
}

// Async thunks
export const fetchSkill = createAsyncThunk(
  'skill/fetchSkill',
  async (_, { rejectWithValue }) => {
    try {
      const data = await skillApi.getSkill()
      return data
    } catch (error: any) {
      if (error.response?.status === 404) {
        return [] // Empty array if no skills found
      }
      return rejectWithValue(
        error.response?.data?.detail || error.response?.data?.message || 'Failed to fetch skills'
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

export const createSkill = createAsyncThunk(
  'skill/createSkill',
  async (data: SkillCreate, { rejectWithValue }) => {
    try {
      const response = await skillApi.createSkill(data)
      return response
    } catch (error: any) {
      const errorDetail = error.response?.data?.detail || error.response?.data?.message
      const errorMessage = parseValidationError(errorDetail) || 'Failed to create skill'
      return rejectWithValue(errorMessage)
    }
  }
)

export const updateSkill = createAsyncThunk(
  'skill/updateSkill',
  async ({ skillId, data }: { skillId: number; data: SkillUpdate }, { rejectWithValue }) => {
    try {
      const response = await skillApi.updateSkill(skillId, data)
      return response
    } catch (error: any) {
      if (error.response?.status === 404) {
        return rejectWithValue('Skill not found')
      }
      const errorDetail = error.response?.data?.detail || error.response?.data?.message
      const errorMessage = parseValidationError(errorDetail) || 'Failed to update skill'
      return rejectWithValue(errorMessage)
    }
  }
)

export const deleteSkill = createAsyncThunk(
  'skill/deleteSkill',
  async (skillId: number, { rejectWithValue }) => {
    try {
      await skillApi.deleteSkill(skillId)
      return skillId
    } catch (error: any) {
      if (error.response?.status === 404) {
        return rejectWithValue('Skill not found')
      }
      const errorDetail = error.response?.data?.detail || error.response?.data?.message
      const errorMessage = parseValidationError(errorDetail) || 'Failed to delete skill'
      return rejectWithValue(errorMessage)
    }
  }
)

const skillSlice = createSlice({
  name: 'skill',
  initialState,
  reducers: {
    clearSkill: (state) => {
      state.skills = []
      state.error = null
    },
  },
  extraReducers: (builder) => {
    // Fetch skills
    builder
      .addCase(fetchSkill.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchSkill.fulfilled, (state, action: PayloadAction<SkillResponse[]>) => {
        state.loading = false
        state.skills = action.payload
      })
      .addCase(fetchSkill.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // Create skill
    builder
      .addCase(createSkill.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createSkill.fulfilled, (state, action: PayloadAction<SkillResponse>) => {
        state.loading = false
        state.skills.push(action.payload)
      })
      .addCase(createSkill.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // Update skill
    builder
      .addCase(updateSkill.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateSkill.fulfilled, (state, action: PayloadAction<SkillResponse>) => {
        state.loading = false
        const index = state.skills.findIndex((s) => s.id === action.payload.id)
        if (index !== -1) {
          state.skills[index] = action.payload
        }
      })
      .addCase(updateSkill.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // Delete skill
    builder
      .addCase(deleteSkill.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteSkill.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false
        state.skills = state.skills.filter((s) => s.id !== action.payload)
      })
      .addCase(deleteSkill.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export const { clearSkill } = skillSlice.actions
export default skillSlice.reducer
