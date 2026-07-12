import React from "react";
import DownloadFolderSetting from "./settings/DownloadFolderSetting.jsx";
import UnsendSetting from "./settings/UnsendSetting.jsx";
import ClickToDownloadSetting from "./settings/ClickToDownloadSetting.jsx";
import SlideshowSetting from "./settings/SlideshowSetting.jsx";
import LoggingControlSetting from "./settings/LoggingControlSetting.jsx";
import DownloadTutorial from "./settings/DownloadTutorial.jsx";

export default function SettingsTab() {
  return (
    <div className="space-y-5">
      <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
        
        {/* 1. Subfolder Path Input (with built-in validation & context save) */}
        <DownloadFolderSetting />

        {/* 2. Chat Quick Unsend Toggle */}
        <UnsendSetting />

        {/* 3. Click to Download Toggle */}
        <ClickToDownloadSetting />

        {/* 4. Console Logging Controls */}
        <LoggingControlSetting />

        {/* 5. Slideshow Video Compiler Settings */}
        <SlideshowSetting />

      </form>

      {/* 5. How to Download Tutorial */}
      <DownloadTutorial />

    </div>
  );
}
