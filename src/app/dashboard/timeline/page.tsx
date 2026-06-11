export default function TimelinePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-white">Attack Timeline Reconstruction</h1>
      <p className="text-zinc-400 mt-1">Analyze IOCs chronologically to reconstruct attack sequences.</p>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl h-[400px] flex items-center justify-center text-zinc-500">
        <p>Timeline visualization chart will render here.</p>
      </div>
    </div>
  );
}
