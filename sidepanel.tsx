import * as React from "react"
import { Button } from "~/components/ui/button"
import "~/globals.css"

function IndexSidepanel() {
  const [status, setStatus] = React.useState<"idle" | "loading" | "done">("idle")

  const handleClick = async () => {
    if (status === "loading") return
    setStatus("loading")
    
    console.log("[Sidepanel] Enviando mensaje para rellenar formulario...")
    chrome.runtime.sendMessage(
      {
        action: "fillForm"
      },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error("[Sidepanel] Error al rellenar formulario:", chrome.runtime.lastError)
        } else {
          console.log("[Sidepanel] Mensaje enviado exitosamente. Respuesta:", response)
        }
      }
    )
    
    await new Promise((r) => setTimeout(r, 1400))
    setStatus("done")
    setTimeout(() => setStatus("idle"), 2200)
  }

  return (
    <div className="w-full flex items-center justify-center p-6" style={{ background: 'linear-gradient(180deg,#031618 0%, #041d20 100%)' }}>
      <div className="w-full max-w-xs text-gray-200">
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#071617] to-[#0b2626] flex items-center justify-center shadow-[0_8px_30px_rgba(0,0,0,0.6)] border border-[rgba(255,255,255,0.02)]">
            <div className="w-12 h-12 rounded-lg bg-[#0f2a2a] flex items-center justify-center shadow-inner">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff4b4b" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" /></svg>
            </div>
          </div>
          <h1 className="text-2xl font-extrabold text-[#ff5252]">AutoForm</h1>
          <p className="text-sm text-slate-400">Ahorra tiempo en cada reserva</p>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
            <span className="w-2 h-2 rounded-full bg-[#ff4b4b] inline-block" />
            <span className="uppercase font-semibold">Acción principal</span>
          </div>

          <div className="bg-[rgba(255,255,255,0.02)] p-4 rounded-2xl shadow-[inset_0_2px_10px_rgba(0,0,0,0.6)] border border-[rgba(255,255,255,0.03)]">
            <div className="flex flex-col items-center gap-4">
              <Button
                onClick={handleClick}
                disabled={status === "loading"}
                className={`w-full rounded-full py-3 text-white transition-all ${
                  status === "done"
                    ? "bg-teal-500 shadow-[0_8px_25px_rgba(34,197,94,0.14)]"
                    : "bg-gradient-to-r from-[#ff4b4b] to-[#ff3333] shadow-[0_8px_25px_rgba(255,75,75,0.18)]"
                }`}
              >
                <div className="flex items-center justify-center gap-3">
                  {status === "loading" ? (
                    <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white">
                      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 4v4m0 8v4m8-8h-4M4 12H8" />
                    </svg>
                  ) : status === "done" ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M2 12h20" /></svg>
                  )}

                  <span className="font-semibold">
                    {status === "idle" && "Completar formulario"}
                    {status === "loading" && "Rellenando campos"}
                    {status === "done" && "Completado"}
                  </span>
                </div>
              </Button>

              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full transition-colors ${status === "idle" ? "bg-red-400" : "bg-slate-600/30"}`} />
                <span className={`w-2 h-2 rounded-full transition-colors ${status === "loading" ? "bg-red-400" : "bg-slate-600/30"}`} />
                <span className={`w-2 h-2 rounded-full transition-colors ${status === "done" ? "bg-teal-400" : "bg-slate-600/30"}`} />
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
            <span className="w-2 h-2 rounded-full bg-teal-400 inline-block" />
            <span className="uppercase font-semibold">Características</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-[rgba(255,255,255,0.01)] border border-[rgba(255,255,255,0.02)]">
              <div className="w-12 h-12 rounded-md bg-[#083434] flex items-center justify-center text-teal-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7ee3d6" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><circle cx="18" cy="8" r="2"/></svg>
              </div>
              <div>
                <div className="font-semibold text-sm text-white">Múltiples pasajeros</div>
                <div className="text-xs text-slate-400">Rellena datos de todos a la vez</div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-[rgba(255,255,255,0.01)] border border-[rgba(255,255,255,0.02)]">
              <div className="w-12 h-12 rounded-md bg-[#083434] flex items-center justify-center text-teal-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7ee3d6" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M16 2v4"/></svg>
              </div>
              <div>
                <div className="font-semibold text-sm text-white">Reservas activas</div>
                <div className="text-xs text-slate-400">Detecta formularios automáticamente</div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-[rgba(255,255,255,0.01)] border border-[rgba(255,255,255,0.02)]">
              <div className="w-12 h-12 rounded-md bg-[#083434] flex items-center justify-center text-teal-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7ee3d6" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9z"/></svg>
              </div>
              <div>
                <div className="font-semibold text-sm text-white">Instantáneo</div>
                <div className="text-xs text-slate-400">Completado en menos de 1 segundo</div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6 text-center text-xs text-slate-500">© {new Date().getFullYear()} EVOLUTIVOS AVIANCA</div>
      </div>
    </div>
  )
}

export default IndexSidepanel