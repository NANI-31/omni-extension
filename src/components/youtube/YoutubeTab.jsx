import React, { useState, useEffect, useRef } from "react";
import YoutubeFeatureList from "./YoutubeFeatureList.jsx";
import YoutubeVolumeSettings from "./features/volume/YoutubeVolumeSettings.jsx";
import YoutubeVolumeTestPad from "./features/volume/YoutubeVolumeTestPad.jsx";
import YoutubeSpeedSettings from "./features/speed/YoutubeSpeedSettings.jsx";
import YoutubeQualitySettings from "./features/quality/YoutubeQualitySettings.jsx";
import YoutubeAdskipSettings from "./features/adskip/YoutubeAdskipSettings.jsx";
import YoutubeMouse from "./features/mouse/YoutubeMouse.jsx";
import YoutubeColorSettings, { COLOR_PRESETS } from "./features/color/YoutubeColorSettings.jsx";
import YoutubeHistoryDeleteSettings from "./features/history/YoutubeHistoryDeleteSettings.jsx";

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

  // Scroll Zone States
  const [zonesEnabled, setZonesEnabled] = useState(true);
  const [zoneLeft, setZoneLeft] = useState("brightness");
  const [zoneMiddle, setZoneMiddle] = useState("volume");
  const [zoneRight, setZoneRight] = useState("speed");
  const [brightnessSensitivity, setBrightnessSensitivity] = useState(5);
  const [seekSensitivity, setSeekSensitivity] = useState(5);
  const [seekCtrlSensitivity, setSeekCtrlSensitivity] = useState(30);

  // Video Color Filter States — CSS
  const [filterContrast, setFilterContrast] = useState(100);
  const [filterSaturation, setFilterSaturation] = useState(100);
  const [filterTemperature, setFilterTemperature] = useState(0);
  const [filterEyeProtection, setFilterEyeProtection] = useState(0);
  // Video Color Filter States — Tone (SVG feComponentTransfer)
  const [filterHighlights, setFilterHighlights] = useState(0);
  const [filterShadows, setFilterShadows] = useState(0);
  const [filterWhites, setFilterWhites] = useState(100);
  const [filterBlacks, setFilterBlacks] = useState(0);

  // History Quick Delete States
  const [historyDeleteEnabled, setHistoryDeleteEnabled] = useState(true);
  const [historyDeletedCount, setHistoryDeletedCount] = useState(0);
  const [historyDeleteDebug, setHistoryDeleteDebug] = useState(false);

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
          "ytHoldKey",
          // Scroll zones
          "ytZonesEnabled",
          "ytZoneLeft",
          "ytZoneMiddle",
          "ytZoneRight",
          "ytBrightnessSensitivity",
          "ytSeekSensitivity",
          "ytSeekCtrlStep",
          // Color filters
          "ytFilterContrast",
          "ytFilterSaturation",
          "ytFilterTemperature",
          "ytFilterEyeProtection",
          // Tone / LUT controls
          "ytFilterBlacks",
          "ytFilterWhites",
          "ytFilterShadows",
          "ytFilterHighlights",
          // History Quick Delete
          "ytHistoryDeleteEnabled",
          "ytHistoryDeletedCount",
          "ytHistoryDeleteDebug",
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

          // Scroll zones
          if (result.ytZonesEnabled !== undefined)        setZonesEnabled(result.ytZonesEnabled);
          if (result.ytZoneLeft !== undefined)            setZoneLeft(result.ytZoneLeft);
          if (result.ytZoneMiddle !== undefined)          setZoneMiddle(result.ytZoneMiddle);
          if (result.ytZoneRight !== undefined)           setZoneRight(result.ytZoneRight);
          if (result.ytBrightnessSensitivity !== undefined) setBrightnessSensitivity(Number(result.ytBrightnessSensitivity));
          if (result.ytSeekSensitivity !== undefined)    setSeekSensitivity(Number(result.ytSeekSensitivity));
          if (result.ytSeekCtrlStep !== undefined)       setSeekCtrlSensitivity(Number(result.ytSeekCtrlStep));
          // Color filters — CSS
          if (result.ytFilterContrast !== undefined)     setFilterContrast(Number(result.ytFilterContrast));
          if (result.ytFilterSaturation !== undefined)   setFilterSaturation(Number(result.ytFilterSaturation));
          if (result.ytFilterTemperature !== undefined)  setFilterTemperature(Number(result.ytFilterTemperature));
          if (result.ytFilterEyeProtection !== undefined) setFilterEyeProtection(Number(result.ytFilterEyeProtection));
          // Color filters — Tone (SVG)
          if (result.ytFilterHighlights !== undefined)   setFilterHighlights(Number(result.ytFilterHighlights));
          if (result.ytFilterShadows !== undefined)      setFilterShadows(Number(result.ytFilterShadows));
          if (result.ytFilterWhites !== undefined)       setFilterWhites(Number(result.ytFilterWhites));
          if (result.ytFilterBlacks !== undefined)       setFilterBlacks(Number(result.ytFilterBlacks));
          // History Quick Delete
          if (result.ytHistoryDeleteEnabled !== undefined) setHistoryDeleteEnabled(result.ytHistoryDeleteEnabled);
          if (result.ytHistoryDeletedCount !== undefined)  setHistoryDeletedCount(Number(result.ytHistoryDeletedCount));
          if (result.ytHistoryDeleteDebug !== undefined)   setHistoryDeleteDebug(result.ytHistoryDeleteDebug);
        }
      );
    }
  }, []);

  // Live-sync History Delete count when background increments it
  useEffect(() => {
    if (typeof chrome === "undefined" || !chrome.storage) return;
    const handleStorageChange = (changes, ns) => {
      if (ns !== "local") return;
      if (changes.ytHistoryDeletedCount) {
        setHistoryDeletedCount(changes.ytHistoryDeletedCount.newValue);
      }
      if (changes.ytHistoryDeleteEnabled) {
        setHistoryDeleteEnabled(changes.ytHistoryDeleteEnabled.newValue);
      }
    };
    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
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

  // Zone handlers
  const handleToggleZonesEnabled = () => {
    const next = !zonesEnabled;
    setZonesEnabled(next);
    updateSetting("ytZonesEnabled", next);
  };
  const handleZoneLeftChange = (val) => {
    setZoneLeft(val);
    updateSetting("ytZoneLeft", val);
  };
  const handleZoneMiddleChange = (val) => {
    setZoneMiddle(val);
    updateSetting("ytZoneMiddle", val);
  };
  const handleZoneRightChange = (val) => {
    setZoneRight(val);
    updateSetting("ytZoneRight", val);
  };
  const handleBrightnessSensitivityChange = (val) => {
    setBrightnessSensitivity(val);
    updateSetting("ytBrightnessSensitivity", val);
  };
  const handleSeekCtrlSensitivityChange = (val) => {
    setSeekCtrlSensitivity(val);
    updateSetting("ytSeekCtrlStep", val);
  };
  const handleSeekSensitivityChange = (val) => {
    setSeekSensitivity(val);
    updateSetting("ytSeekSensitivity", val);
  };

  // Color filter handlers — CSS
  const handleFilterContrastChange = (val) => { setFilterContrast(val); updateSetting("ytFilterContrast", val); };
  const handleFilterSaturationChange = (val) => { setFilterSaturation(val); updateSetting("ytFilterSaturation", val); };
  const handleFilterTemperatureChange = (val) => { setFilterTemperature(val); updateSetting("ytFilterTemperature", val); };
  const handleFilterEyeProtectionChange = (val) => { setFilterEyeProtection(val); updateSetting("ytFilterEyeProtection", val); };
  // Color filter handlers — Tone (SVG)
  const handleFilterHighlightsChange = (val) => { setFilterHighlights(val); updateSetting("ytFilterHighlights", val); };
  const handleFilterShadowsChange    = (val) => { setFilterShadows(val);    updateSetting("ytFilterShadows",    val); };
  const handleFilterWhitesChange     = (val) => { setFilterWhites(val);     updateSetting("ytFilterWhites",     val); };
  const handleFilterBlacksChange     = (val) => { setFilterBlacks(val);     updateSetting("ytFilterBlacks",     val); };

  const handleApplyPreset = (preset) => {
    const v = preset.values;
    if (v.ytFilterContrast      !== undefined) handleFilterContrastChange(v.ytFilterContrast);
    if (v.ytFilterSaturation    !== undefined) handleFilterSaturationChange(v.ytFilterSaturation);
    if (v.ytFilterTemperature   !== undefined) handleFilterTemperatureChange(v.ytFilterTemperature);
    if (v.ytFilterEyeProtection !== undefined) handleFilterEyeProtectionChange(v.ytFilterEyeProtection);
    if (v.ytFilterHighlights    !== undefined) handleFilterHighlightsChange(v.ytFilterHighlights);
    if (v.ytFilterShadows       !== undefined) handleFilterShadowsChange(v.ytFilterShadows);
    if (v.ytFilterWhites        !== undefined) handleFilterWhitesChange(v.ytFilterWhites);
    if (v.ytFilterBlacks        !== undefined) handleFilterBlacksChange(v.ytFilterBlacks);
  };

  const handleColorResetAll = () => {
    handleFilterContrastChange(100);
    handleFilterSaturationChange(100);
    handleFilterTemperatureChange(0);
    handleFilterEyeProtectionChange(0);
    handleFilterHighlightsChange(0);
    handleFilterShadowsChange(0);
    handleFilterWhitesChange(100);
    handleFilterBlacksChange(0);
  };

  // ── History Quick Delete handlers ─────────────────────────────────────────
  const handleToggleHistoryDelete = () => {
    const next = !historyDeleteEnabled;
    setHistoryDeleteEnabled(next);
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.set({ ytHistoryDeleteEnabled: next });
    }
  };

  const handleResetHistoryCount = () => {
    setHistoryDeletedCount(0);
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.set({ ytHistoryDeletedCount: 0 });
    }
  };

  const handleToggleHistoryDebug = () => {
    const next = !historyDeleteDebug;
    setHistoryDeleteDebug(next);
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.set({ ytHistoryDeleteDebug: next });
    }
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
      id: "mouse",
      name: "Mouse Scroll Zones",
      icon: "🖱️",
      status: "Active"
    },
    {
      id: "color",
      name: "Video Color Lab",
      icon: "🎨",
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
    },
    {
      id: "history",
      name: "History Quick Delete",
      icon: "🗑️",
      status: "Active"
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
        {selectedFeature === "mouse" && (
          <YoutubeMouse
            zonesEnabled={zonesEnabled}
            handleToggleZonesEnabled={handleToggleZonesEnabled}
            zoneLeft={zoneLeft}
            handleZoneLeftChange={handleZoneLeftChange}
            zoneMiddle={zoneMiddle}
            handleZoneMiddleChange={handleZoneMiddleChange}
            brightnessSensitivity={brightnessSensitivity}
            handleBrightnessSensitivityChange={handleBrightnessSensitivityChange}
            seekSensitivity={seekSensitivity}
            handleSeekSensitivityChange={handleSeekSensitivityChange}
            seekCtrlSensitivity={seekCtrlSensitivity}
            handleSeekCtrlSensitivityChange={handleSeekCtrlSensitivityChange}
          />
        )}
        {selectedFeature === "color" && (
          <YoutubeColorSettings
            filterContrast={filterContrast}
            handleFilterContrastChange={handleFilterContrastChange}
            filterSaturation={filterSaturation}
            handleFilterSaturationChange={handleFilterSaturationChange}
            filterTemperature={filterTemperature}
            handleFilterTemperatureChange={handleFilterTemperatureChange}
            filterEyeProtection={filterEyeProtection}
            handleFilterEyeProtectionChange={handleFilterEyeProtectionChange}
            filterHighlights={filterHighlights}
            handleFilterHighlightsChange={handleFilterHighlightsChange}
            filterShadows={filterShadows}
            handleFilterShadowsChange={handleFilterShadowsChange}
            filterWhites={filterWhites}
            handleFilterWhitesChange={handleFilterWhitesChange}
            filterBlacks={filterBlacks}
            handleFilterBlacksChange={handleFilterBlacksChange}
            onApplyPreset={handleApplyPreset}
            onResetAll={handleColorResetAll}
          />
        )}
        {selectedFeature === "quality" && <YoutubeQualitySettings />}
        {selectedFeature === "adskip" && <YoutubeAdskipSettings />}
        {selectedFeature === "history" && (
          <YoutubeHistoryDeleteSettings
            enabled={historyDeleteEnabled}
            onToggleEnabled={handleToggleHistoryDelete}
            deletedCount={historyDeletedCount}
            onResetCount={handleResetHistoryCount}
            debug={historyDeleteDebug}
            onToggleDebug={handleToggleHistoryDebug}
          />
        )}
      </div>

    </div>
  );
}
