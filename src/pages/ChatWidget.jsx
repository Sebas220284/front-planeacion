import React, { useEffect, useRef, useState } from "react"
import socket from "../services/socket"

const API = "http://localhost:3100"

export default function ChatWidget({ currentUser, dependencyId, dependencyName }) {
  const [abierto, setAbierto]         = useState(false)
  const [mensajes, setMensajes]       = useState([])
  const [texto, setTexto]             = useState("")
  const [conversacion, setConversacion] = useState(null)
  const [cargando, setCargando]       = useState(false)
  const [enviando, setEnviando]       = useState(false)
  const [escribiendo, setEscribiendo] = useState(false)
  const [noLeidos, setNoLeidos]       = useState(0)
  const [escribiendoTimeout, setEscribiendoTimeout] = useState(null)
  const bottomRef  = useRef(null)
  const inputRef   = useRef(null)

  useEffect(() => {
    if (!dependencyId) return
    inicializar()
  }, [dependencyId])

  useEffect(() => {
    if (!conversacion) return

    socket.emit("chat_join", {
      dependency_id: dependencyId,
      user_id: currentUser?.id,
      rol: currentUser?.rol_nombre || "dependencias"
    })

    socket.on("chat_nuevo_mensaje", (msg) => {
      if (msg.conversacion_id !== conversacion.id) return
      setMensajes(prev => {
        if (prev.find(m => m.id === msg.id)) return prev
        return [...prev, msg]
      })
      if (abierto && msg.remitente_rol !== "dependencias") {
        marcarLeido()
      } else if (msg.remitente_rol !== "dependencias") {
        setNoLeidos(n => n + 1)
      }
    })

    socket.on("chat_escribiendo", ({ nombre, escribiendo: e }) => {
      if (nombre !== currentUser?.name) setEscribiendo(e)
    })

    return () => {
      socket.off("chat_nuevo_mensaje")
      socket.off("chat_escribiendo")
    }
  }, [conversacion, abierto])

  useEffect(() => {
    if (abierto) bottomRef.current?.scrollIntoView({ behavior:"smooth" })
  }, [mensajes, abierto])

  useEffect(() => {
    if (abierto && conversacion) {
      marcarLeido()
      setNoLeidos(0)
      setTimeout(() => inputRef.current?.focus(), 200)
    }
  }, [abierto])

  const inicializar = async () => {
    setCargando(true)
    try {
      const res  = await fetch(`${API}/api/chat/conversacion/${dependencyId}`)
      const conv = await res.json()
      setConversacion(conv)
      setNoLeidos(conv.mensajes_no_leidos_dependencia || 0)

      const msgsRes = await fetch(`${API}/api/chat/mensajes/${conv.id}?limit=50`)
      const data    = await msgsRes.json()
      setMensajes(data.mensajes || [])
    } catch(e) { console.error(e) }
    setCargando(false)
  }

  const marcarLeido = async () => {
    if (!conversacion) return
    await fetch(`${API}/api/chat/marcar-leido`, {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ conversacion_id: conversacion.id, lado: "dependencia" })
    }).catch(()=>{})
  }

  const enviar = async () => {
    if (!texto.trim() || !conversacion || enviando) return
    setEnviando(true)

    socket.emit("chat_mensaje", {
      conversacion_id:  conversacion.id,
      dependency_id:    dependencyId,
      remitente_id:     currentUser?.id,
      remitente_nombre: currentUser?.name || dependencyName,
      remitente_rol:    currentUser?.rol_nombre || "dependencias",
      contenido:        texto.trim(),
      tipo:             "texto"
    })

    setTexto("")
    setEnviando(false)
    inputRef.current?.focus()
  }

  const handleEscritura = (e) => {
    setTexto(e.target.value)
    socket.emit("chat_escribiendo", {
      dependency_id: dependencyId,
      nombre:        currentUser?.name || dependencyName,
      escribiendo:   true
    })
    if (escribiendoTimeout) clearTimeout(escribiendoTimeout)
    setEscribiendoTimeout(setTimeout(() => {
      socket.emit("chat_escribiendo", {
        dependency_id: dependencyId,
        nombre:        currentUser?.name || dependencyName,
        escribiendo:   false
      })
    }, 2000))
  }

  const esMio = (msg) =>
    msg.remitente_id === currentUser?.id ||
    msg.remitente_rol === "dependencias"

  const fmtHora = (ts) =>
    new Date(ts).toLocaleTimeString("es-MX", { hour:"2-digit", minute:"2-digit" })

  const fmtFecha = (ts) =>
    new Date(ts).toLocaleDateString("es-MX", { day:"2-digit", month:"short" })

  const agruparMensajes = () => {
    const grupos = []
    let fechaActual = ""
    mensajes.forEach(msg => {
      const fecha = fmtFecha(msg.created_at)
      if (fecha !== fechaActual) {
        grupos.push({ tipo:"fecha", fecha })
        fechaActual = fecha
      }
      grupos.push({ tipo:"mensaje", ...msg })
    })
    return grupos
  }

  return (
    <>
      <button
        onClick={() => setAbierto(a => !a)}
        style={{
          position:"fixed", bottom:"24px", right:"24px", zIndex:900,
          width:"56px", height:"56px", borderRadius:"50%",
          background:"linear-gradient(135deg,#1e40af,#7c3aed)",
          border:"none", cursor:"pointer", boxShadow:"0 4px 20px rgba(0,0,0,0.3)",
          display:"flex", alignItems:"center", justifyContent:"center",
          transition:"transform 0.2s"
        }}
        title="Chat con Planeación"
      >
        <span style={{ fontSize:"24px" }}>{abierto ? "✕" : "💬"}</span>
        {noLeidos > 0 && !abierto && (
          <span style={{
            position:"absolute", top:"-4px", right:"-4px",
            background:"#dc2626", color:"white", borderRadius:"50%",
            width:"22px", height:"22px", fontSize:"11px", fontWeight:"700",
            display:"flex", alignItems:"center", justifyContent:"center",
            border:"2px solid white"
          }}>
            {noLeidos > 9 ? "9+" : noLeidos}
          </span>
        )}
      </button>

      {abierto && (
        <div style={{
          position:"fixed", bottom:"90px", right:"24px", zIndex:1000,
          width:"360px", height:"500px",
          background:"white", borderRadius:"16px",
          boxShadow:"0 20px 60px rgba(0,0,0,0.25)",
          display:"flex", flexDirection:"column", overflow:"hidden",
          border:"1px solid #e5e7eb"
        }}>

          <div style={{
            background:"linear-gradient(135deg,#1e40af,#7c3aed)",
            padding:"14px 16px",
            display:"flex", alignItems:"center", gap:"10px"
          }}>
            <div style={{
              width:"38px", height:"38px", borderRadius:"50%",
              background:"rgba(255,255,255,0.2)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:"18px", flexShrink:0
            }}>🏛️</div>
            <div style={{ flex:1 }}>
              <p style={{ margin:0, fontWeight:"700", color:"white", fontSize:"13px" }}>
                Secretaría de Planeación
              </p>
              <p style={{ margin:0, fontSize:"11px", color:"rgba(255,255,255,0.8)" }}>
                {dependencyName}
              </p>
            </div>
            <div style={{ width:"8px", height:"8px", borderRadius:"50%", background:"#4ade80" }} />
          </div>

          <div style={{ flex:1, overflowY:"auto", padding:"12px", background:"#f8fafc" }}>
            {cargando ? (
              <div style={{ textAlign:"center", padding:"40px", color:"#6b7280" }}>
                Cargando mensajes...
              </div>
            ) : mensajes.length === 0 ? (
              <div style={{ textAlign:"center", padding:"30px", color:"#9ca3af" }}>
                <p style={{ fontSize:"36px", margin:"0 0 8px" }}>👋</p>
                <p style={{ fontSize:"13px" }}>
                  ¡Hola! Escríbenos si tienes alguna duda sobre tu POA o tus líneas de acción.
                </p>
              </div>
            ) : (
              agruparMensajes().map((item, idx) => {
                if (item.tipo === "fecha") {
                  return (
                    <div key={`fecha-${idx}`} style={{ textAlign:"center", margin:"10px 0" }}>
                      <span style={{ background:"#e2e8f0", color:"#64748b", padding:"2px 10px", borderRadius:"999px", fontSize:"10px" }}>
                        {item.fecha}
                      </span>
                    </div>
                  )
                }

                const mio = esMio(item)
                return (
                  <div key={item.id || idx} style={{
                    display:"flex",
                    justifyContent: mio ? "flex-end" : "flex-start",
                    marginBottom:"6px"
                  }}>
                    {!mio && (
                      <div style={{
                        width:"28px", height:"28px", borderRadius:"50%",
                        background:"linear-gradient(135deg,#1e40af,#7c3aed)",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        color:"white", fontWeight:"700", fontSize:"11px",
                        marginRight:"6px", flexShrink:0, alignSelf:"flex-end"
                      }}>
                        {(item.remitente_nombre||"P")[0].toUpperCase()}
                      </div>
                    )}
                    <div style={{ maxWidth:"75%" }}>
                      {!mio && (
                        <p style={{ margin:"0 0 2px", fontSize:"10px", color:"#6b7280", paddingLeft:"2px" }}>
                          {item.remitente_nombre}
                        </p>
                      )}
                      <div style={{
                        background: mio
                          ? "linear-gradient(135deg,#1e40af,#7c3aed)"
                          : "white",
                        color: mio ? "white" : "#1e293b",
                        padding:"8px 12px",
                        borderRadius: mio ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                        fontSize:"13px", lineHeight:"1.4",
                        boxShadow: mio ? "0 2px 8px rgba(30,64,175,0.3)" : "0 1px 4px rgba(0,0,0,0.1)"
                      }}>
                        {item.contenido}
                      </div>
                      <p style={{
                        margin:"2px 0 0",
                        fontSize:"10px", color:"#9ca3af",
                        textAlign: mio ? "right" : "left",
                        paddingLeft: mio ? "0" : "2px", paddingRight: mio ? "2px" : "0"
                      }}>
                        {fmtHora(item.created_at)}
                        {mio && <span style={{ marginLeft:"4px" }}>{item.leido_planeacion ? "✓✓" : "✓"}</span>}
                      </p>
                    </div>
                  </div>
                )
              })
            )}

            {escribiendo && (
              <div style={{ display:"flex", alignItems:"center", gap:"6px", marginBottom:"6px" }}>
                <div style={{ width:"28px", height:"28px", borderRadius:"50%", background:"linear-gradient(135deg,#1e40af,#7c3aed)", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:"11px" }}>P</div>
                <div style={{ background:"white", borderRadius:"14px", padding:"10px 14px", boxShadow:"0 1px 4px rgba(0,0,0,0.1)" }}>
                  <div style={{ display:"flex", gap:"4px", alignItems:"center" }}>
                    {[0,1,2].map(i => (
                      <div key={i} style={{
                        width:"6px", height:"6px", borderRadius:"50%", background:"#9ca3af",
                        animation:"bounce 1.4s infinite",
                        animationDelay:`${i*0.2}s`
                      }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div style={{ padding:"10px 12px", borderTop:"1px solid #e5e7eb", background:"white" }}>
            <div style={{ display:"flex", gap:"8px", alignItems:"flex-end" }}>
              <textarea
                ref={inputRef}
                value={texto}
                onChange={handleEscritura}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar() }
                }}
                placeholder="Escribe tu mensaje... (Enter para enviar)"
                rows={1}
                style={{
                  flex:1, padding:"10px 12px", borderRadius:"10px",
                  border:"1px solid #e5e7eb", fontSize:"13px",
                  resize:"none", fontFamily:"inherit",
                  outline:"none", lineHeight:"1.4",
                  maxHeight:"80px", overflowY:"auto"
                }}
              />
              <button
                onClick={enviar}
                disabled={!texto.trim() || enviando}
                style={{
                  width:"38px", height:"38px", borderRadius:"10px",
                  background: texto.trim() ? "linear-gradient(135deg,#1e40af,#7c3aed)" : "#e5e7eb",
                  border:"none", cursor: texto.trim() ? "pointer" : "default",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  flexShrink:0, transition:"all 0.2s"
                }}
              >
                <span style={{ fontSize:"16px", transform:"rotate(45deg)" }}>📤</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0) }
          30% { transform: translateY(-6px) }
        }
      `}</style>
    </>
  )
}