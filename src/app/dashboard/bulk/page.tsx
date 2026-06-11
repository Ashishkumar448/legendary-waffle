export default function BulkUploadPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-white">Bulk Upload</h1>
      <p className="text-zinc-400 mt-1">Upload a CSV or JSON file to enrich multiple IOCs sequentially.</p>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl text-center text-zinc-500 py-20">
        <p>Bulk import interface (Drag & Drop zone) will go here.</p>
      </div>
    </div>
  );
}
