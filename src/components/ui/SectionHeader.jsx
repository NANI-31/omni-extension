export default function SectionHeader({ icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-4 mb-6">

      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-violet-600 to-fuchsia-600 text-xl shadow-lg shadow-violet-600/20">
        {icon}
      </div>

      <div>
        <h2 className="text-xl font-black tracking-tight text-white">
          {title}
        </h2>
        <p className="text-sm text-zinc-500">
          {subtitle}
        </p>
      </div>

    </div>
  );
}