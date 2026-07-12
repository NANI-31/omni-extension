import React from "react";

export default function DownloadTutorial() {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 space-y-2">
      <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wide flex items-center gap-1">
        💡 How to Download
      </h3>
      <ol className="text-xs text-zinc-400 space-y-1.5 pl-4 list-decimal">
        <li>Go to <a href="https://instagram.com" target="_blank" rel="noreferrer" className="text-pink-400 hover:underline">instagram.com</a> in your browser.</li>
        <li>Browse your Feed, click a post, open Reels, or view Stories.</li>
        <li>Find the <b>Download</b> button injected next to the <b>Bookmark/Save</b> icon.</li>
        <li>Click it! The high-res media will save directly to your subdirectory.</li>
      </ol>
    </div>
  );
}
