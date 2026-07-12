import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
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
} from "../store/instagrab/settingsSlice.js";

const isChromeExtension = typeof chrome !== "undefined" && chrome.storage && chrome.storage.local;

export function SettingsProvider({ children }) {
  const dispatch = useDispatch();

  useEffect(() => {
    if (isChromeExtension) {
      chrome.storage.local.get(
        [
          "downloadSubdir",
          "quickUnsendEnabled",
          "clickToDownloadEnabled",
          "compileSlidesAsVideo",
          "slideDurationSecs",
          "slideshowEncoder",
          "slideshowQuality",
          "logLevel"
        ],
        (result) => {
          const loaded = {};
          if (result.downloadSubdir) loaded.subdir = result.downloadSubdir;
          if (result.quickUnsendEnabled !== undefined) loaded.quickUnsendEnabled = result.quickUnsendEnabled;
          if (result.clickToDownloadEnabled !== undefined) loaded.clickToDownloadEnabled = result.clickToDownloadEnabled;
          if (result.compileSlidesAsVideo !== undefined) loaded.compileSlidesAsVideo = result.compileSlidesAsVideo;
          if (result.slideDurationSecs !== undefined) loaded.slideDurationSecs = result.slideDurationSecs;
          if (result.slideshowEncoder !== undefined) loaded.slideshowEncoder = result.slideshowEncoder;
          if (result.slideshowQuality !== undefined) loaded.slideshowQuality = result.slideshowQuality;
          if (result.logLevel !== undefined) loaded.logLevel = result.logLevel;
          
          dispatch(setSettings(loaded));
        }
      );
    }
  }, [dispatch]);

  return <>{children}</>;
}

export function useSettings() {
  const dispatch = useDispatch();
  const settings = useSelector((state) => state.settings);

  const updateSetting = (key, value) => {
    if (isChromeExtension) {
      chrome.storage.local.set({ [key]: value });
    }
  };

  const handleSaveSubdir = (newSubdir) => {
    const cleanedSubdir = newSubdir.replace(/[\\/:*?"<>|]/g, "").trim();
    dispatch(setSubdir(cleanedSubdir));
    if (isChromeExtension) {
      chrome.storage.local.set({ downloadSubdir: cleanedSubdir }, () => {
        dispatch(setSaveStatus("Saved successfully!"));
        setTimeout(() => dispatch(setSaveStatus("")), 2000);
      });
    } else {
      dispatch(setSaveStatus("Saved (mocked)!"));
      setTimeout(() => dispatch(setSaveStatus("")), 2000);
    }
  };

  return {
    subdir: settings.subdir,
    setSubdir: (val) => {
      dispatch(setSubdir(val));
      updateSetting("downloadSubdir", val);
    },
    quickUnsendEnabled: settings.quickUnsendEnabled,
    setQuickUnsendEnabled: (val) => {
      dispatch(setQuickUnsendEnabled(val));
      updateSetting("quickUnsendEnabled", val);
    },
    clickToDownloadEnabled: settings.clickToDownloadEnabled,
    setClickToDownloadEnabled: (val) => {
      dispatch(setClickToDownloadEnabled(val));
      updateSetting("clickToDownloadEnabled", val);
    },
    compileSlidesAsVideo: settings.compileSlidesAsVideo,
    setCompileSlidesAsVideo: (val) => {
      dispatch(setCompileSlidesAsVideo(val));
      updateSetting("compileSlidesAsVideo", val);
    },
    slideDurationSecs: settings.slideDurationSecs,
    setSlideDurationSecs: (val) => {
      dispatch(setSlideDurationSecs(val));
      updateSetting("slideDurationSecs", val);
    },
    slideshowEncoder: settings.slideshowEncoder,
    setSlideshowEncoder: (val) => {
      dispatch(setSlideshowEncoder(val));
      updateSetting("slideshowEncoder", val);
    },
    slideshowQuality: settings.slideshowQuality,
    setSlideshowQuality: (val) => {
      dispatch(setSlideshowQuality(val));
      updateSetting("slideshowQuality", val);
    },
    logLevel: settings.logLevel,
    setLogLevel: (val) => {
      dispatch(setLogLevel(val));
      updateSetting("logLevel", val);
    },
    saveStatus: settings.saveStatus,
    handleSaveSubdir,
    isChromeExtension
  };
}
