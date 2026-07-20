import React, { useEffect, useRef, useState } from "react"
import socket from "../services/socket"

const API = "http://localhost:3100"

export default function ChatPlaneacion({ currentUser }) {
  const [conversaciones, setConversaciones] = useState([])
  const [convActiva, setConvActiva]         = useState(null)
  const [mensajes, setMensajes]             = useState([])
  const [texto, setTexto]                   = useState("")
  const [cargando, setCargando]             = useState(true)
  const [enviando, setEnviando]             = useState(false)
  const [escribiendo, setEscribiendo]       = useState({})
  const [busqueda, setBusqueda]             = useState("")
  const [stats, setStats]                   = useState({})
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  useEffect(() => {
    cargarConversaciones()
    cargarStats()

    socket.emit("chat_join", {
      user_id: currentUser?.id,
      rol:     currentUser?.rol_nombre || "planeacion"
    })

    socket.on("chat_nuevo_mensaje", (msg) => {
      setConvActiva(prev => {
        if (prev && msg.conversacion_id === prev.id) {
          setMensajes(m => {
            if (m.find(x => x.id === msg.id)) return m
            return [...m, msg]
          })
          marcarLeido(prev.id)
        }
        return prev
      })

      setConversaciones(prev => prev.map(c => {
        if (c.id !== msg.conversacion_id) return c
        return {
          ...c,
          ultimo_mensaje:       msg.contenido.substring(0,60),
          ultimo_mensaje_at:    msg.created_at,
          mensajes_no_leidos_planeacion:
            msg.remitente_rol !== "planeacion" && msg.remitente_rol !== "admin"
              ? (c.mensajes_no_leidos_planeacion || 0) + 1
              : 0
        }
      }))

      cargarStats()
    })

    socket.on("chat_escribiendo", ({ dependency_id, nombre, escribiendo: e }) => {
      if (dependency_id) {
        setEscribiendo(prev => ({ ...prev, [dependency_id]: e ? nombre : null }))
      }
    })

    socket.on("chat_badge_update", () => cargarStats())

    return () => {
      socket.off("chat_nuevo_mensaje")
      socket.off("chat_escribiendo")
      socket.off("chat_badge_update")
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:"smooth" })
  }, [mensajes])

  const cargarConversaciones = async () => {
    setCargando(true)
    try {
      const res  = await fetch(`${API}/api/chat/conversaciones`)
      const data = await res.json()
      setConversaciones(Array.isArray(data) ? data : [])
    } catch(e) { console.error(e) }
    setCargando(false)
  }

  const cargarStats = async () => {
    try {
      const res  = await fetch(`${API}/api/chat/stats`)
      const data = await res.json()
      setStats(data)
    } catch(e) {}
  }

  const abrirConversacion = async (conv) => {
    setConvActiva(conv)
    setMensajes([])

    socket.emit("chat_join", {
      dependency_id: conv.dependency_id,
      user_id:       currentUser?.id,
      rol:           currentUser?.rol_nombre || "planeacion"
    })

    try {
      const res  = await fetch(`${API}/api/chat/mensajes/${conv.id}?limit=50`)
      const data = await res.json()
      setMensajes(data.mensajes || [])
    } catch(e) { console.error(e) }

    await marcarLeido(conv.id)

    setConversaciones(prev => prev.map(c =>
      c.id === conv.id ? { ...c, mensajes_no_leidos_planeacion:0 } : c
    ))
    cargarStats()
    setTimeout(() => inputRef.current?.focus(), 200)
  }

  const marcarLeido = async (conversacion_id) => {
    await fetch(`${API}/api/chat/marcar-leido`, {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ conversacion_id, lado:"planeacion" })
    }).catch(()=>{})
  }

  const enviar = () => {
    if (!texto.trim() || !convActiva || enviando) return
    setEnviando(true)

    socket.emit("chat_mensaje", {
      conversacion_id:  convActiva.id,
      dependency_id:    convActiva.dependency_id,
      remitente_id:     currentUser?.id,
      remitente_nombre: currentUser?.name || "Planeación",
      remitente_rol:    currentUser?.rol_nombre || "planeacion",
      contenido:        texto.trim(),
      tipo:             "texto"
    })

    setTexto("")
    setEnviando(false)
    inputRef.current?.focus()
  }

  const convsFiltradas = conversaciones.filter(c => {
    const q = busqueda.toLowerCase()
    return !q || c.dependencia_nombre?.toLowerCase().includes(q)
  }).sort((a,b) => {
    if (a.mensajes_no_leidos_planeacion > 0 && b.mensajes_no_leidos_planeacion === 0) return -1
    if (b.mensajes_no_leidos_planeacion > 0 && a.mensajes_no_leidos_planeacion === 0) return 1
    return new Date(b.ultimo_mensaje_at||0) - new Date(a.ultimo_mensaje_at||0)
  })

  const fmtHora = (ts) =>
    new Date(ts).toLocaleTimeString("es-MX",{ hour:"2-digit",minute:"2-digit" })
  const fmtRelativo = (ts) => {
    if (!ts) return ""
    const diff = Date.now() - new Date(ts)
    const min  = Math.floor(diff/60000)
    if (min < 1)   return "Ahora"
    if (min < 60)  return `hace ${min}min`
    const hrs = Math.floor(min/60)
    if (hrs < 24)  return `hace ${hrs}h`
    return new Date(ts).toLocaleDateString("es-MX",{day:"2-digit",month:"short"})
  }

  const esMio = (msg) =>
    ["planeacion","admin"].includes(msg.remitente_rol)

  const agruparMensajes = () => {
    const grupos = []
    let fechaActual = ""
    mensajes.forEach(msg => {
      const fecha = new Date(msg.created_at).toLocaleDateString("es-MX",{day:"2-digit",month:"short"})
      if (fecha !== fechaActual) {
        grupos.push({ tipo:"fecha", fecha })
        fechaActual = fecha
      }
      grupos.push({ tipo:"mensaje", ...msg })
    })
    return grupos
  }

  return (
    <div style={{ display:"flex", height:"calc(100vh - 60px)", background:"#f8fafc", overflow:"hidden" }}>

      <div style={{ width:"300px", background:"white", borderRight:"1px solid #e5e7eb", display:"flex", flexDirection:"column", flexShrink:0 }}>

        <div style={{ padding:"16px 14px", borderBottom:"1px solid #e5e7eb" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"10px" }}>
            <h3 style={{ margin:0, color:"#1e293b", fontSize:"16px" }}>💬 Mensajes</h3>
            <div style={{ display:"flex", gap:"8px" }}>
              {stats.total_no_leidos > 0 && (
                <span style={{ background:"#dc2626", color:"white", borderRadius:"999px", padding:"2px 8px", fontSize:"11px", fontWeight:"700" }}>
                  {stats.total_no_leidos} nuevos
                </span>
              )}
            </div>
          </div>
          <input
            value={busqueda}
            onChange={e=>setBusqueda(e.target.value)}
            placeholder="Buscar dependencia..."
            style={{ width:"100%", padding:"7px 10px", borderRadius:"8px", border:"1px solid #e5e7eb", fontSize:"12px", boxSizing:"border-box" }}
          />
        </div>

        <div style={{ padding:"8px 14px", borderBottom:"1px solid #f1f5f9", display:"flex", gap:"12px" }}>
          <div style={{ textAlign:"center" }}>
            <p style={{ margin:0, fontSize:"16px", fontWeight:"700", color:"#1e40af" }}>{stats.total_conversaciones||0}</p>
            <p style={{ margin:0, fontSize:"9px", color:"#6b7280" }}>Chats</p>
          </div>
          <div style={{ textAlign:"center" }}>
            <p style={{ margin:0, fontSize:"16px", fontWeight:"700", color:"#dc2626" }}>{stats.total_no_leidos||0}</p>
            <p style={{ margin:0, fontSize:"9px", color:"#6b7280" }}>No leídos</p>
          </div>
          <div style={{ textAlign:"center" }}>
            <p style={{ margin:0, fontSize:"16px", fontWeight:"700", color:"#16a34a" }}>{stats.mensajes_hoy||0}</p>
            <p style={{ margin:0, fontSize:"9px", color:"#6b7280" }}>Hoy</p>
          </div>
        </div>

        <div style={{ flex:1, overflowY:"auto" }}>
          {cargando ? (
            <div style={{ textAlign:"center", padding:"40px", color:"#6b7280" }}>Cargando...</div>
          ) : convsFiltradas.length === 0 ? (
            <div style={{ textAlign:"center", padding:"40px", color:"#9ca3af", fontSize:"13px" }}>
              Sin conversaciones aún
            </div>
          ) : convsFiltradas.map(conv => {
            const activa      = convActiva?.id === conv.id
            const noLeidos    = conv.mensajes_no_leidos_planeacion || 0
            const escribiendoNombre = escribiendo[conv.dependency_id]

            return (
              <div
                key={conv.id}
                onClick={() => abrirConversacion(conv)}
                style={{
                  padding:"12px 14px", cursor:"pointer",
                  background: activa ? "#eff6ff" : "white",
                  borderLeft: activa ? "3px solid #1e40af" : "3px solid transparent",
                  borderBottom:"1px solid #f1f5f9",
                  transition:"all 0.1s"
                }}
              >
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"3px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"7px" }}>
                    <div style={{
                      width:"32px", height:"32px", borderRadius:"50%",
                      background:`linear-gradient(135deg,${noLeidos>0?"#dc2626,#f87171":"#1e40af,#7c3aed"})`,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      color:"white", fontWeight:"700", fontSize:"12px", flexShrink:0
                    }}>
                      {(conv.dependencia_nombre||"D")[0].toUpperCase()}
                    </div>
                    <p style={{ margin:0, fontSize:"12px", fontWeight: noLeidos>0?"700":"600", color:"#1e293b", lineHeight:1.2 }}>
                      {conv.dependencia_nombre}
                    </p>
                  </div>
                  <div style={{ textAlign:"right", flexShrink:0, marginLeft:"6px" }}>
                    <p style={{ margin:0, fontSize:"10px", color:"#9ca3af" }}>
                      {fmtRelativo(conv.ultimo_mensaje_at)}
                    </p>
                    {noLeidos > 0 && (
                      <span style={{ background:"#dc2626", color:"white", borderRadius:"999px", padding:"1px 6px", fontSize:"10px", fontWeight:"700" }}>
                        {noLeidos}
                      </span>
                    )}
                  </div>
                </div>
                <p style={{ margin:0, fontSize:"11px", color: noLeidos>0?"#374151":"#9ca3af",
                  fontWeight: noLeidos>0?"500":"400", paddingLeft:"39px",
                  whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                  {escribiendoNombre ? (
                    <span style={{ color:"#1e40af", fontStyle:"italic" }}>✍️ {escribiendoNombre} está escribiendo...</span>
                  ) : (conv.ultimo_mensaje || "Sin mensajes aún")}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ flex:1, display:"flex", flexDirection:"column" }}>

        {!convActiva ? (
          <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", color:"#9ca3af" }}>
            <div style={{ textAlign:"center" }}>
              <p style={{ fontSize:"48px", margin:"0 0 12px" }}>💬</p>
              <p style={{ fontSize:"16px", fontWeight:"600", color:"#374151" }}>Selecciona una conversación</p>
              <p style={{ fontSize:"13px" }}>Elige una dependencia para ver sus mensajes</p>
            </div>
          </div>
        ) : (
          <>
            <div style={{
              padding:"14px 18px", background:"white", borderBottom:"1px solid #e5e7eb",
              display:"flex", alignItems:"center", gap:"12px"
            }}>
              <div style={{ width:"40px", height:"40px", borderRadius:"50%", background:"linear-gradient(135deg,#1e40af,#7c3aed)", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontWeight:"700" }}>
                {(convActiva.dependencia_nombre||"D")[0].toUpperCase()}
              </div>
              <div>
                <p style={{ margin:"0 0 2px", fontWeight:"700", color:"#1e293b", fontSize:"14px" }}>
                  {convActiva.dependencia_nombre}
                </p>
                <p style={{ margin:0, fontSize:"11px", color: escribiendo[convActiva.dependency_id]?"#1e40af":"#16a34a", fontStyle: escribiendo[convActiva.dependency_id]?"italic":"normal" }}>
                  {escribiendo[convActiva.dependency_id]
                    ? `✍️ ${escribiendo[convActiva.dependency_id]} está escribiendo...`
                    : "● En línea"}
                </p>
              </div>
            </div>

            <div style={{ flex:1, overflowY:"auto", padding:"16px 18px", background:"#f8fafc" }}>
              {agruparMensajes().map((item, idx) => {
                if (item.tipo === "fecha") return (
                  <div key={`f-${idx}`} style={{ textAlign:"center", margin:"12px 0" }}>
                    <span style={{ background:"#e2e8f0", color:"#64748b", padding:"3px 12px", borderRadius:"999px", fontSize:"11px" }}>
                      {item.fecha}
                    </span>
                  </div>
                )

                const mio = esMio(item)
                return (
                  <div key={item.id||idx} style={{ display:"flex", justifyContent: mio?"flex-end":"flex-start", marginBottom:"8px" }}>
                    {!mio && (
                      <div style={{ width:"32px", height:"32px", borderRadius:"50%", background:"#e2e8f0", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:"700", fontSize:"12px", marginRight:"8px", flexShrink:0, alignSelf:"flex-end" }}>
                        {(item.remitente_nombre||"D")[0].toUpperCase()}
                      </div>
                    )}
                    <div style={{ maxWidth:"70%" }}>
                      {!mio && (
                        <p style={{ margin:"0 0 3px", fontSize:"11px", color:"#6b7280", paddingLeft:"2px" }}>
                          {item.remitente_nombre}
                        </p>
                      )}
                      <div style={{
                        background: mio ? "linear-gradient(135deg,#1e40af,#7c3aed)" : "white",
                        color: mio ? "white" : "#1e293b",
                        padding:"10px 14px",
                        borderRadius: mio ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                        fontSize:"13px", lineHeight:"1.5",
                        boxShadow: mio ? "0 2px 8px rgba(30,64,175,0.3)" : "0 1px 4px rgba(0,0,0,0.08)"
                      }}>
                        {item.contenido}
                      </div>
                      <p style={{ margin:"3px 0 0", fontSize:"10px", color:"#9ca3af", textAlign: mio?"right":"left" }}>
                        {fmtHora(item.created_at)}
                        {mio && (
                          <span style={{ marginLeft:"4px", color: item.leido_dependencia?"#1e40af":"#9ca3af" }}>
                            {item.leido_dependencia ? "✓✓" : "✓"}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            <div style={{ padding:"12px 16px", background:"white", borderTop:"1px solid #e5e7eb" }}>
              <div style={{ display:"flex", gap:"8px", alignItems:"flex-end" }}>
                <textarea
                  ref={inputRef}
                  value={texto}
                  onChange={e => setTexto(e.target.value)}
                  onKeyDown={e => { if (e.key==="Enter"&&!e.shiftKey){e.preventDefault();enviar()} }}
                  placeholder={`Escribe a ${convActiva.dependencia_nombre}...`}
                  rows={1}
                  style={{
                    flex:1, padding:"10px 14px", borderRadius:"10px",
                    border:"1px solid #e5e7eb", fontSize:"13px",
                    resize:"none", fontFamily:"inherit",
                    outline:"none", lineHeight:"1.4", maxHeight:"100px", overflowY:"auto"
                  }}
                />
                <button
                  onClick={enviar}
                  disabled={!texto.trim()||enviando}
                  style={{
                    padding:"10px 18px", borderRadius:"10px",
                    background: texto.trim() ? "linear-gradient(135deg,#1e40af,#7c3aed)" : "#e5e7eb",
                    color: texto.trim() ? "white" : "#9ca3af",
                    border:"none", cursor: texto.trim()?"pointer":"default",
                    fontWeight:"600", fontSize:"13px", transition:"all 0.2s"
                  }}
                >
                  Enviar
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}