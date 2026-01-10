import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import { projectApi, type ProjectResponse, type ProjectCreate, type ProjectUpdate } from '@/api/project'

interface ProjectState {
  projects: ProjectResponse[]
  loading: boolean
  error: string | null
}

const initialState: ProjectState = {
  projects: [],
  loading: false,
  error: null,
}

// Async thunks
export const fetchProject = createAsyncThunk(
  'project/fetchProject',
  async (_, { rejectWithValue }) => {
    try {
      const data = await projectApi.getProject()
      return data
    } catch (error: any) {
      if (error.response?.status === 404) {
        return [] // Empty array if no projects found
      }
      return rejectWithValue(
        error.response?.data?.detail || error.response?.data?.message || 'Failed to fetch projects'
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

export const createProject = createAsyncThunk(
  'project/createProject',
  async (data: ProjectCreate, { rejectWithValue }) => {
    try {
      const response = await projectApi.createProject(data)
      return response
    } catch (error: any) {
      const errorDetail = error.response?.data?.detail || error.response?.data?.message
      const errorMessage = parseValidationError(errorDetail) || 'Failed to create project'
      return rejectWithValue(errorMessage)
    }
  }
)

export const updateProject = createAsyncThunk(
  'project/updateProject',
  async ({ projectId, data }: { projectId: number; data: ProjectUpdate }, { rejectWithValue }) => {
    try {
      const response = await projectApi.updateProject(projectId, data)
      return response
    } catch (error: any) {
      if (error.response?.status === 404) {
        return rejectWithValue('Project not found')
      }
      const errorDetail = error.response?.data?.detail || error.response?.data?.message
      const errorMessage = parseValidationError(errorDetail) || 'Failed to update project'
      return rejectWithValue(errorMessage)
    }
  }
)

export const deleteProject = createAsyncThunk(
  'project/deleteProject',
  async (projectId: number, { rejectWithValue }) => {
    try {
      await projectApi.deleteProject(projectId)
      return projectId
    } catch (error: any) {
      if (error.response?.status === 404) {
        return rejectWithValue('Project not found')
      }
      const errorDetail = error.response?.data?.detail || error.response?.data?.message
      const errorMessage = parseValidationError(errorDetail) || 'Failed to delete project'
      return rejectWithValue(errorMessage)
    }
  }
)

const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    clearProject: (state) => {
      state.projects = []
      state.error = null
    },
  },
  extraReducers: (builder) => {
    // Fetch projects
    builder
      .addCase(fetchProject.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchProject.fulfilled, (state, action: PayloadAction<ProjectResponse[]>) => {
        state.loading = false
        state.projects = action.payload
      })
      .addCase(fetchProject.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // Create project
    builder
      .addCase(createProject.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createProject.fulfilled, (state, action: PayloadAction<ProjectResponse>) => {
        state.loading = false
        state.projects.push(action.payload)
      })
      .addCase(createProject.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // Update project
    builder
      .addCase(updateProject.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateProject.fulfilled, (state, action: PayloadAction<ProjectResponse>) => {
        state.loading = false
        const index = state.projects.findIndex((p) => p.id === action.payload.id)
        if (index !== -1) {
          state.projects[index] = action.payload
        }
      })
      .addCase(updateProject.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // Delete project
    builder
      .addCase(deleteProject.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteProject.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false
        state.projects = state.projects.filter((p) => p.id !== action.payload)
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export const { clearProject } = projectSlice.actions
export default projectSlice.reducer
