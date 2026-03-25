"use client";

export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-xl">
        <h1 className="text-3xl font-bold mb-3 text-cyan-300">Estás sin conexión</h1>
        <p className="text-slate-300 mb-6">Parece que tu dispositivo no tiene Internet. Usa la app en modo offline o vuelve a intentar cuando haya señal.</p>
        <div className="flex gap-3">
          <a href="/" className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white">Ir a inicio</a>
          <button className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600" onClick={() => window.location.reload()}>
            Recargar
          </button>
        </div>
      </div>
    </main>
  );
}
