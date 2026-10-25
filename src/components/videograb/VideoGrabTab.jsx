import React from "react";
import VideoGrabMetrics from "./VideoGrabMetrics";
import VideoGrabFolderSettings from "./VideoGrabFolderSettings";
import VideoGrabToolbar from "./VideoGrabToolbar";
import VideoGrabEmptyState from "./VideoGrabEmptyState";
import TabAccordionItem from "./TabAccordionItem";
import VideoGrabInfoNotice from "./VideoGrabInfoNotice";
import useVideoGrabTab from "./useVideoGrabTab";

export default function VideoGrabTab() {
  const {
    tabsData,
    filteredTabs,
    totalCapturedStreams,
    ffmpegStatus,
    searchQuery,
    setSearchQuery,
    formatFilter,
    setFormatFilter,
    expandedTabs,
    toggleTabExpand,
    expandAll,
    collapseAll,
    clearCapturedMedia,
    getStreamName,
    editingId,
    editValue,
    setEditValue,
    startEditingName,
    saveEditedName,
    cancelEditing,
    downloadFolder,
    saveFolder,
    handleFolderInputChange,
    handleChooseFolder,
    askWhereToSave,
    toggleAskWhereToSave,
    folderSaveStatus,
    isFolderSettingsOpen,
    setIsFolderSettingsOpen,
    copiedId,
    handleCopyLink,
    downloadProgress,
    handleDownloadStream,
  } = useVideoGrabTab();

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Top Banner / Stat Metrics */}
      <VideoGrabMetrics
        totalCapturedStreams={totalCapturedStreams}
        tabsCount={tabsData.length}
        ffmpegStatus={ffmpegStatus}
      />

      {/* Download Destination & Folder Settings Card */}
      <VideoGrabFolderSettings
        downloadFolder={downloadFolder}
        askWhereToSave={askWhereToSave}
        isFolderSettingsOpen={isFolderSettingsOpen}
        folderSaveStatus={folderSaveStatus}
        onToggleOpen={() => setIsFolderSettingsOpen(!isFolderSettingsOpen)}
        onFolderInputChange={handleFolderInputChange}
        onChooseFolder={handleChooseFolder}
        onSelectPreset={saveFolder}
        onToggleAskWhereToSave={toggleAskWhereToSave}
      />

      {/* Control & Filter Toolbar */}
      <VideoGrabToolbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        formatFilter={formatFilter}
        setFormatFilter={setFormatFilter}
        onExpandAll={expandAll}
        onCollapseAll={collapseAll}
        onClearCapturedMedia={clearCapturedMedia}
      />

      {/* Main Tab Groups List or Empty State */}
      {filteredTabs.length === 0 ? (
        <VideoGrabEmptyState hasFilter={!!searchQuery || formatFilter !== "all"} />
      ) : (
        <div className="space-y-4">
          {filteredTabs.map((tab) => (
            <TabAccordionItem
              key={tab.tabId}
              tab={tab}
              isExpanded={!!expandedTabs[tab.tabId]}
              onToggleExpand={() => toggleTabExpand(tab.tabId)}
              getStreamName={getStreamName}
              editingId={editingId}
              editValue={editValue}
              setEditValue={setEditValue}
              copiedId={copiedId}
              downloadProgress={downloadProgress}
              onStartEditingName={startEditingName}
              onSaveEditedName={saveEditedName}
              onCancelEditing={cancelEditing}
              onCopyLink={handleCopyLink}
              onDownloadStream={handleDownloadStream}
            />
          ))}
        </div>
      )}

      {/* Helpful Info Alert */}
      <VideoGrabInfoNotice />
    </div>
  );
}
