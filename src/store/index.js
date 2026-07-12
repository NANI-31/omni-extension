import { configureStore } from '@reduxjs/toolkit';
import settingsReducer from './instagrab/settingsSlice.js';
import historyReducer from './instagrab/historySlice.js';
import featuresReducer from './featuresSlice.js';

export const store = configureStore({
  reducer: {
    settings: settingsReducer,
    history: historyReducer,
    features: featuresReducer
  }
});
