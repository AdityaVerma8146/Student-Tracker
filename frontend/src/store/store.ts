import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
})

store.subscribe(() => {
  try {
    const state = store.getState().auth
    localStorage.setItem(
      'authDraft',
      JSON.stringify({
        signupDraft: {
          email: state.signupDraft.email,
          password: '',
          mood: state.signupDraft.mood,
        },
        loginDraft: {
          email: state.loginDraft.email,
          password: '',
        },
      })
    )
  } catch (error) {
    console.error('Unable to persist auth draft', error)
  }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
