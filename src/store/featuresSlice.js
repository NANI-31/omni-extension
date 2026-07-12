import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentFeature: 'dashboard', // 'dashboard' | 'instagrab' | 'timers' | 'youtube'
  activeModules: {
    instagrab: true,
    timers: true,
    youtube: true
  }
};

const featuresSlice = createSlice({
  name: 'features',
  initialState,
  reducers: {
    navigateTo: (state, action) => {
      state.currentFeature = action.payload;
    },
    toggleModule: (state, action) => {
      const moduleId = action.payload;
      if (state.activeModules[moduleId] !== undefined) {
        state.activeModules[moduleId] = !state.activeModules[moduleId];
      }
    },
    setActiveModules: (state, action) => {
      state.activeModules = { ...state.activeModules, ...action.payload };
    }
  }
});

export const { navigateTo, toggleModule, setActiveModules } = featuresSlice.actions;
export default featuresSlice.reducer;
