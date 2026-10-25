import { useSettings } from "../../../context/SettingsContext.jsx";
import ToggleCard from "./ToggleCard.jsx";

export default function ClickToDownloadSetting() {
  const { clickToDownloadEnabled, setClickToDownloadEnabled } = useSettings();

  return (
    <ToggleCard
      title="Click Media to Download"
      description="Enable downloading a post by clicking directly on its main image or video."
      checked={clickToDownloadEnabled}
      onChange={setClickToDownloadEnabled}
    />
  );
}

