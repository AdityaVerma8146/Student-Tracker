import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer
  }
})

store.subscribe(() => {
  try {
    const state = store.getState().auth
    localStorage.setItem('authDraft', JSON.stringify({
      signupDraft: state.signupDraft,
      loginDraft: state.loginDraft
    }))
  } catch (error) {
    console.error('Unable to persist auth draft', error)
  }
})
