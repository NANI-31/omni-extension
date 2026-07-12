import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  subdir: 'Instagram-Downloads',
  quickUnsendEnabled: false,
  clickToDownloadEnabled: false,
  compileSlidesAsVideo: false,
  slideDurationSecs: 2,
  slideshowEncoder: 'canvas',
  slideshowQuality: 24,
  logLevel: 'verbose',
  saveStatus: ''
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setSettings: (state, action) => {
      return { ...state, ...action.payload };
    },
    setSubdir: (state, action) => {
      state.subdir = action.payload;
    },
    setQuickUnsendEnabled: (state, action) => {
      state.quickUnsendEnabled = action.payload;
    },
    setClickToDownloadEnabled: (state, action) => {
      state.clickToDownloadEnabled = action.payload;
    },
    setCompileSlidesAsVideo: (state, action) => {
      state.compileSlidesAsVideo = action.payload;
    },
    setSlideDurationSecs: (state, action) => {
      state.slideDurationSecs = action.payload;
    },
    setSlideshowEncoder: (state, action) => {
      state.slideshowEncoder = action.payload;
    },
    setSlideshowQuality: (state, action) => {
      state.slideshowQuality = action.payload;
    },
    setLogLevel: (state, action) => {
      state.logLevel = action.payload;
    },
    setSaveStatus: (state, action) => {
      state.saveStatus = action.payload;
    }
  }
});

export const {
  setSettings,
  setSubdir,
  setQuickUnsendEnabled,
  setClickToDownloadEnabled,
  setCompileSlidesAsVideo,
  setSlideDurationSecs,
  setSlideshowEncoder,
  setSlideshowQuality,
  setLogLevel,
  setSaveStatus
} = settingsSlice.actions;

export default settingsSlice.reducer;
