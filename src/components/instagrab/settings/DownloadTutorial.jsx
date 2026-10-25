import { HelpCircle, ExternalLink } from "lucide-react";

export default function DownloadTutorial() {
  return (
    <div className="rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] p-5 space-y-3.5 shadow-xl shadow-black/60">
      <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
        <HelpCircle className="w-4 h-4 text-fuchsia-400" />
        <span>How to Download Instagram Media</span>
      </h3>
      <div className="rounded-xl bg-[#0f111e] border border-zinc-700/80 p-4 shadow-inner">
        <ol className="text-xs text-zinc-300 space-y-2.5 pl-4 list-decimal leading-relaxed font-normal">
          <li>
            Navigate to{" "}
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="text-fuchsia-300 font-bold hover:underline inline-flex items-center gap-1"
            >
              <span>instagram.com</span>
              <ExternalLink className="w-3 h-3" />
            </a>{" "}
            in your browser.
          </li>
          <li>Browse your Feed, open any Post, view Reels, or check Stories.</li>
          <li>
            Look for the high-res <b className="text-white font-extrabold">Download</b> button injected beside the native{" "}
            <b className="text-white font-extrabold">Bookmark / Save</b> icon.
          </li>
          <li>
            Click it! Full-resolution media or merged video carousels will save directly to your subfolder.
          </li>
        </ol>
      </div>
    </div>
  );
}

