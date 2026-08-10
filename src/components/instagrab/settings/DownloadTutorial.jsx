import React from "react";

export default function DownloadTutorial() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-[#161824] p-4.5 space-y-2.5 shadow-lg">
      <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
        <span>💡</span>
        <span>How to Download</span>
      </h3>
      <ol className="text-xs text-zinc-300 space-y-2 pl-4 list-decimal leading-relaxed">
        <li>
          Go to{" "}
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noreferrer"
            className="text-fuchsia-400 font-semibold hover:underline"
          >
            instagram.com
          </a>{" "}
          in your browser.
        </li>
        <li>Browse your Feed, click a post, open Reels, or view Stories.</li>
        <li>
          Find the <b className="text-white">Download</b> button injected next to the{" "}
          <b className="text-white">Bookmark/Save</b> icon.
        </li>
        <li>
          Click it! The high-res media will save directly to your subdirectory.
        </li>
      </ol>
    </div>
  );
}
