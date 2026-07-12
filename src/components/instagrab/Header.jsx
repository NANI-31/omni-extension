import React from "react";

export default function Header() {
  return (
    <header className="p-4 bg-linear-to-r from-purple-600 via-pink-500 to-orange-400 relative">
      <div className="flex items-center gap-2">
        <svg className="w-8 h-8 text-white filter drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        <div>
          <h1 className="text-xl font-black tracking-tight text-white m-0 leading-none">InstaGrab</h1>
          <p className="text-[10px] text-white/80 font-medium tracking-wide uppercase mt-1">Instagram Media Downloader</p>
        </div>
      </div>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10 text-[10px] font-bold text-white uppercase tracking-wider">
        Manifest V3
      </div>
    </header>
  );
}
