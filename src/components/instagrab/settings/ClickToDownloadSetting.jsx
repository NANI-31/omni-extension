// 3. components/instagrab/settings/ClickToDownloadSetting.jsx
import React from "react";
import { useSettings } from "../../../context/SettingsContext.jsx";
import ToggleCard from "./ToggleCard.jsx";

export default function ClickToDownloadSetting() {
  const { clickToDownloadEnabled, setClickToDownloadEnabled, isChromeExtension } = useSettings();

  return (
    <ToggleCard
      title="Click Media to Download"
      description="Enable downloading a post by clicking directly on its main image or video."
      checked={clickToDownloadEnabled}
      onChange={setClickToDownloadEnabled}
      activeColorClass="peer-checked:bg-pink-500"
    />
  );
}
