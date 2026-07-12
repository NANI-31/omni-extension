import React, { useState, useEffect, useRef } from "react";
import YoutubeFeatureList from "./YoutubeFeatureList.jsx";
import YoutubeVolumeSettings from "./features/volume/YoutubeVolumeSettings.jsx";
import YoutubeVolumeTestPad from "./features/volume/YoutubeVolumeTestPad.jsx";
import YoutubeSpeedSettings from "./features/speed/YoutubeSpeedSettings.jsx";
import YoutubeQualitySettings from "./features/quality/YoutubeQualitySettings.jsx";
import YoutubeAdskipSettings from "./features/adskip/YoutubeAdskipSettings.jsx";

export default function YoutubeTab() {
  const [selectedFeature, setSelectedFeature] = useState("volume");
  
  // Volume Feature States
  const [volumeControl, setVolumeControl] = useState(true);
  const [volumeStep, setVolumeStep] = useState(5);
  const [showHUD, setShowHUD] = useState(true);
  const [maxVolumeCap, setMaxVolumeCap] = useState(100);
  const [defaultVolumeEnabled, setDefaultVolumeEnabled] = useState(false);
  const [defaultVolume, setDefaultVolume] = useState(30);
  const [blacklistDomains, setBlacklistDomains] = useState("");

  // Playback Speed States
  const [speedSensitivity, setSpeedSensitivity] = useState(0.25);
  const [allowOverdrive, setAllowOverdrive] = useState(false);
  const [hotkeyHold2x, setHotkeyHold2x] = useState(true);
  const [holdSpeedMult, setHoldSpeedMult] = useState(2.0);
  const [holdKey, setHoldKey] = useState("s");

  // Mock player states for the interactive test pad
  const [mockVolume, setMockVolume] = useState(50);
  const [mockMuted, setMockMuted] = useState(false);
  const [hudVisible, setHudVisible] = useState(false);
  const hudTimeoutRef = useRef(null);

  // Load configuration settings from chrome.storage.local
  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(
        [
          "ytVolumeControl", 
          "ytVolumeStep", 
          "ytShowVolumeHUD",
          "ytMaxVolumeCap",
          "ytDefaultStartupVolumeEnabled",
          "ytDefaultStartupVolume",
          "ytBlacklistDomains",
          "ytSpeedSensitivity",
          "ytAllowOverdrive",
          "ytHotkeyHold2x",
          "ytHoldSpeedMult",
          "ytHoldKey"
        ],
        (result) => {
          if (result.ytVolumeControl !== undefined) {
            setVolumeControl(result.ytVolumeControl);
          }
          if (result.ytVolumeStep !== undefined) {
            setVolumeStep(Number(result.ytVolumeStep));
          }
          if (result.ytShowVolumeHUD !== undefined) {
            setShowHUD(result.ytShowVolumeHUD);
          }
          if (result.ytMaxVolumeCap !== undefined) {
            setMaxVolumeCap(Number(result.ytMaxVolumeCap));
          }
          if (result.ytDefaultStartupVolumeEnabled !== undefined) {
            setDefaultVolumeEnabled(result.ytDefaultStartupVolumeEnabled);
          }
          if (result.ytDefaultStartupVolume !== undefined) {
            setDefaultVolume(Number(result.ytDefaultStartupVolume));
          }
          if (result.ytBlacklistDomains !== undefined) {
            setBlacklistDomains(result.ytBlacklistDomains);
          }
          
          if (result.ytSpeedSensitivity !== undefined) {
            setSpeedSensitivity(Number(result.ytSpeedSensitivity));
          }
          if (result.ytAllowOverdrive !== undefined) {
            setAllowOverdrive(result.ytAllowOverdrive);
          }
          if (result.ytHotkeyHold2x !== undefined) {
            setHotkeyHold2x(result.ytHotkeyHold2x);
          }
          if (result.ytHoldSpeedMult !== undefined) {
            setHoldSpeedMult(Number(result.ytHoldSpeedMult));
          }
          if (result.ytHoldKey !== undefined) {
            setHoldKey(result.ytHoldKey);
          }
        }
      );
    }
  }, []);

  const updateSetting = (key, val) => {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ [key]: val });
    }
  };

  const handleToggleVolumeControl = () => {
    const nextVal = !volumeControl;
    setVolumeControl(nextVal);
    updateSetting("ytVolumeControl", nextVal);
  };

  const handleToggleShowHUD = () => {
    const nextVal = !showHUD;
    setShowHUD(nextVal);
    updateSetting("ytShowVolumeHUD", nextVal);
  };

  const handleStepChange = (e) => {
    let nextVal = Math.round(Number(e.target.value));
    if (isNaN(nextVal) || nextVal < 1) nextVal = 1;
    if (nextVal > 25) nextVal = 25;
    setVolumeStep(nextVal);
    updateSetting("ytVolumeStep", nextVal);
  };

  const handleMaxVolumeChange = (e) => {
    const nextVal = Number(e.target.value);
    setMaxVolumeCap(nextVal);
    updateSetting("ytMaxVolumeCap", nextVal);

    if (mockVolume > nextVal) {
      setMockVolume(nextVal);
    }
  };

  const handleToggleDefaultVolumeEnabled = () => {
    const nextVal = !defaultVolumeEnabled;
    setDefaultVolumeEnabled(nextVal);
    updateSetting("ytDefaultStartupVolumeEnabled", nextVal);
  };

  const handleDefaultVolumeChange = (e) => {
    const nextVal = Number(e.target.value);
    setDefaultVolume(nextVal);
    updateSetting("ytDefaultStartupVolume", nextVal);
  };

  const handleBlacklistDomainsChange = (e) => {
    const nextVal = e.target.value;
    setBlacklistDomains(nextVal);
    updateSetting("ytBlacklistDomains", nextVal);
  };

  // Speed handlers
  const handleSpeedSensitivityChange = (val) => {
    setSpeedSensitivity(val);
    updateSetting("ytSpeedSensitivity", val);
  };

  const handleToggleAllowOverdrive = () => {
    const nextVal = !allowOverdrive;
    setAllowOverdrive(nextVal);
    updateSetting("ytAllowOverdrive", nextVal);
  };

  const handleToggleHotkeyHold2x = () => {
    const nextVal = !hotkeyHold2x;
    setHotkeyHold2x(nextVal);
    updateSetting("ytHotkeyHold2x", nextVal);
  };

  const handleHoldSpeedMultChange = (val) => {
    setHoldSpeedMult(val);
    updateSetting("ytHoldSpeedMult", val);
  };

  const handleHoldKeyChange = (e) => {
    const nextVal = e.target.value;
    setHoldKey(nextVal);
    updateSetting("ytHoldKey", nextVal);
  };

  const triggerMockHUD = () => {
    if (!showHUD) return;
    setHudVisible(true);

    if (hudTimeoutRef.current) clearTimeout(hudTimeoutRef.current);
    hudTimeoutRef.current = setTimeout(() => {
      setHudVisible(false);
    }, 1000);
  };

  const getSpeakerIcon = (vol, muted) => {
    if (muted || vol === 0) return "🔇";
    if (vol < 33) return "🔈";
    if (vol < 66) return "🔉";
    return "🔊";
  };

  const displayVolume = mockMuted ? 0 : mockVolume;

  const features = [
    {
      id: "volume",
      name: "Volume Scroll Control",
      icon: "🔊",
      status: "Active"
    },
    {
      id: "speed",
      name: "Playback Speed Control",
      icon: "⚡",
      status: "Active"
    },
    {
      id: "quality",
      name: "Auto HD Quality Locker",
      icon: "🎬",
      status: "Planned"
    },
    {
      id: "adskip",
      name: "Ad Skip & Fast-forward",
      icon: "📺",
      status: "Planned"
    }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      {/* 1. Left Side Panel: Features Selector */}
      <div className="lg:col-span-3 space-y-4 lg:sticky lg:top-0">
        <YoutubeFeatureList
          features={features}
          selectedFeature={selectedFeature}
          setSelectedFeature={setSelectedFeature}
        />
      </div>

      {/* 2. Main Content View Pane */}
      <div className="lg:col-span-9">
        {selectedFeature === "volume" && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Left Column: Settings configuration */}
            <div className="md:col-span-7 max-h-[calc(100vh-140px)] overflow-y-auto pr-3 no-scrollbar">
              <YoutubeVolumeSettings
                volumeControl={volumeControl}
                handleToggleVolumeControl={handleToggleVolumeControl}
                volumeStep={volumeStep}
                handleStepChange={handleStepChange}
                showHUD={showHUD}
                handleToggleShowHUD={handleToggleShowHUD}
                maxVolumeCap={maxVolumeCap}
                handleMaxVolumeChange={handleMaxVolumeChange}
                defaultVolumeEnabled={defaultVolumeEnabled}
                handleToggleDefaultVolumeEnabled={handleToggleDefaultVolumeEnabled}
                defaultVolume={defaultVolume}
                handleDefaultVolumeChange={handleDefaultVolumeChange}
                blacklistDomains={blacklistDomains}
                handleBlacklistDomainsChange={handleBlacklistDomainsChange}
              />
            </div>
            {/* Right Column: Mock Player Test Pad */}
            <div className="md:col-span-5 md:sticky md:top-0">
              <YoutubeVolumeTestPad
                volumeControl={volumeControl}
                volumeStep={volumeStep}
                showHUD={showHUD}
                maxVolumeCap={maxVolumeCap}
                mockVolume={mockVolume}
                setMockVolume={setMockVolume}
                mockMuted={mockMuted}
                setMockMuted={setMockMuted}
                hudVisible={hudVisible}
                triggerMockHUD={triggerMockHUD}
                getSpeakerIcon={getSpeakerIcon}
                displayVolume={displayVolume}
              />
            </div>
          </div>
        )}

        {selectedFeature === "speed" && (
          <YoutubeSpeedSettings
            speedSensitivity={speedSensitivity}
            handleSpeedSensitivityChange={handleSpeedSensitivityChange}
            allowOverdrive={allowOverdrive}
            handleToggleAllowOverdrive={handleToggleAllowOverdrive}
            hotkeyHold2x={hotkeyHold2x}
            handleToggleHotkeyHold2x={handleToggleHotkeyHold2x}
            holdSpeedMult={holdSpeedMult}
            handleHoldSpeedMultChange={handleHoldSpeedMultChange}
            holdKey={holdKey}
            handleHoldKeyChange={handleHoldKeyChange}
          />
        )}
        {selectedFeature === "quality" && <YoutubeQualitySettings />}
        {selectedFeature === "adskip" && <YoutubeAdskipSettings />}
      </div>

    </div>
  );
}
