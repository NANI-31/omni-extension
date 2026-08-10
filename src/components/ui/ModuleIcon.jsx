import React from "react";

export function InstaGrabIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.2" cy="6.8" r="1.3" fill="currentColor" />
      <path d="M12 9v4.5m0 0l-1.5-1.5M12 13.5l1.5-1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TimersIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 3h12M6 21h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 3v2.5a5.5 5.5 0 002.75 4.76L12 11.5l2.25-1.24A5.5 5.5 0 0017 5.5V3" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M7 21v-2.5a5.5 5.5 0 012.75-4.76L12 12.5l2.25 1.24A5.5 5.5 0 0117 18.5V21" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M10.5 14.5l3.5 2-3.5 2v-4z" fill="currentColor" />
    </svg>
  );
}

export function VideoToolsIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="3.5" width="20" height="13.5" rx="3" stroke="currentColor" strokeWidth="2" />
      <path d="M8 20.5h8M12 17v3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 8l5 3.25L10 14.5V8z" fill="currentColor" />
    </svg>
  );
}

export function VpnIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L4 5.5v5.5c0 5.25 3.4 10.15 8 11.5 4.6-1.35 8-6.25 8-11.5V5.5L12 2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <rect x="9.5" y="11" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M10.5 11V9.2a1.5 1.5 0 013 0V11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function PinterestIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.01 2C6.48 2 2.01 6.48 2.01 12c0 4.24 2.63 7.86 6.36 9.28-.09-.79-.17-2.01.03-2.87.19-.8 1.23-5.21 1.23-5.21s-.31-.63-.31-1.56c0-1.46.85-2.55 1.9-2.55.9 0 1.33.67 1.33 1.48 0 .9-.57 2.26-.87 3.52-.25 1.05.52 1.91 1.55 1.91 1.86 0 3.3-1.96 3.3-4.79 0-2.51-1.8-4.26-4.38-4.26-2.98 0-4.73 2.24-4.73 4.55 0 .9.35 1.87.78 2.39.09.11.1.2.07.31-.08.33-.26 1.05-.29 1.19-.05.21-.18.25-.4.15-1.47-.68-2.39-2.83-2.39-4.56 0-3.71 2.7-7.13 7.79-7.13 4.09 0 7.27 2.92 7.27 6.81 0 4.06-2.56 7.33-6.11 7.33-1.19 0-2.31-.62-2.7-1.36l-.73 2.8c-.27 1.03-.99 2.32-1.48 3.1 1.15.35 2.37.54 3.64.54 5.52 0 10-4.48 10-10S17.53 2 12.01 2z"/>
    </svg>
  );
}

export default function ModuleIcon({ moduleId, fallbackIcon, className = "w-5 h-5" }) {
  switch (moduleId) {
    case "instagrab":
      return <InstaGrabIcon className={className} />;
    case "timers":
      return <TimersIcon className={className} />;
    case "youtube":
      return <VideoToolsIcon className={className} />;
    case "vpn":
      return <VpnIcon className={className} />;
    case "pinterest":
      return <PinterestIcon className={className} />;
    default:
      return <span className="select-none text-base">{fallbackIcon}</span>;
  }
}
