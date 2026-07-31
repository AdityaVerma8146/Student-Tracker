import { createSlice } from '@reduxjs/toolkit'

const draftFromStorage = () => {
  try {
    const serialized = localStorage.getItem('authDraft')
    return serialized ? JSON.parse(serialized) : null
  } catch (error) {
    console.error('Unable to load auth draft', error)
    return null
  }
}

const initialState = {
  signupDraft: {
    email: '',
    password: '',
    mood: '😊'
  },
  loginDraft: {
    email: '',
    password: ''
  },
  currentUserEmail: null
}

const savedDraft = draftFromStorage()
if (savedDraft) {
  initialState.signupDraft = savedDraft.signupDraft || initialState.signupDraft
  initialState.loginDraft = savedDraft.loginDraft || initialState.loginDraft
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSignupDraft(state, action) {
      state.signupDraft = { ...state.signupDraft, ...action.payload }
    },
    setLoginDraft(state, action) {
      state.loginDraft = { ...state.loginDraft, ...action.payload }
    },
    setCurrentUserEmail(state, action) {
      state.currentUserEmail = action.payload
    },
    resetSignupDraft(state) {
      state.signupDraft = initialState.signupDraft
    },
    resetLoginDraft(state) {
      state.loginDraft = initialState.loginDraft
    }
  }
})

export const {
  setSignupDraft,
  setLoginDraft,
  setCurrentUserEmail,
  resetSignupDraft,
  resetLoginDraft
} = authSlice.actions

export default authSlice.reducer
