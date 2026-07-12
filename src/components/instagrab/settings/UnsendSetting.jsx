import React from "react";
import { useSettings } from "../../../context/SettingsContext.jsx";
import ToggleCard from "./ToggleCard.jsx";

export default function UnsendSetting() {
  const { quickUnsendEnabled, setQuickUnsendEnabled, isChromeExtension } = useSettings();

  return (
    <ToggleCard
      title="Quick Unsend in Chats"
      description="Enable single-click unsending of messages/posts directly within Instagram DMs."
      checked={quickUnsendEnabled}
      onChange={setQuickUnsendEnabled}
      activeColorClass="peer-checked:bg-pink-500"
    />
  );
}
