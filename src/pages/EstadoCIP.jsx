import React, { useState } from "react"

const ESTADOS = {
  borrador:  { color:"#6b7280", bg:"#f3f4f6", icon:"📝", label:"Borrador" },
  enviado:   { color:"#1e40af", bg:"#dbeafe", icon:"📤", label:"En Revisión" },
  aprobado:  { color:"#065f46", bg:"#d1fae5", icon:"✅", label:"Aprobado" },
  rechazado: { color:"#991b1b", bg:"#fee2e2", icon:"❌", label:"Rechazado" },
}

export default function EstadoCIP({ proyecto, currentUser, onCambioEstado }) {
  const [comentario, setComentario] = useState("")
  const [procesando, setProcesando] = useState(false)
  const [modalRechazo, setModalRechazo] = useState(false)

  if (!proyecto) return null

  const estado    = proyecto.estado || "borrador"
  const esPlaneacion = ["planeacion","admin"].includes(currentUser?.rol)
  const esDependencia = currentUser?.rol === "dependencias"
  const info = ESTADOS[estado] || ESTADOS.borrador

  const cambiar = async (nuevoEstado, comentarioExtra = "") => {
    setProcesando(true)
    try {
      const res = await fetch(`http://localhost:3100/api/cip/${proyecto.id}/estado`, {
        method:"PUT",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          estado: nuevoEstado,
          comentario_revision: comentarioExtra || comentario || null,
          revisado_por: currentUser?.id || null
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onCambioEstado(data)
      setComentario("")
      setModalRechazo(false)
    } catch(e) { alert("Error: " + e.message) }
    setProcesando(false)
  }

  return (
    <>
      <div style={{ background:"white", borderRadius:"10px", padding:"16px 20px", border:"1px solid #e5e7eb", marginBottom:"16px" }}>

        {/* Timeline de estados */}
        <div style={{ display:"flex", alignItems:"center", gap:"0", marginBottom:"16px" }}>
          {["borrador","enviado","aprobado"].map((e, i) => {
            const activo = e === estado
            const completado = (
              (e==="borrador" && ["enviado","aprobado"].includes(estado)) ||
              (e==="enviado"  && estado==="aprobado")
            )
            const rechazado = e==="aprobado" && estado==="rechazado"
            const inf = ESTADOS[e]
            return (
              <React.Fragment key={e}>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", minWidth:"90px" }}>
                  <div style={{
                    width:"36px", height:"36px", borderRadius:"50%", display:"flex",
                    alignItems:"center", justifyContent:"center", fontSize:"16px",
                    background: activo ? inf.bg : completado ? "#d1fae5" : "#f3f4f6",
                    border: `2px solid ${activo ? inf.color : completado ? "#065f46" : "#d1d5db"}`,
                    boxShadow: activo ? `0 0 0 3px ${inf.bg}` : "none"
                  }}>
                    {completado ? "✓" : rechazado ? "✗" : inf.icon}
                  </div>
                  <p style={{ margin:"4px 0 0", fontSize:"10px", fontWeight: activo?"700":"400",
                    color: activo ? inf.color : completado?"#065f46":"#6b7280" }}>
                    {inf.label}
                  </p>
                </div>
                {i < 2 && (
                  <div style={{ flex:1, height:"2px", background: completado?"#16a34a":"#e5e7eb", margin:"0 0 20px" }} />
                )}
              </React.Fragment>
            )
          })}
        </div>

        {/* Estado actual badge */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"8px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
            <span style={{ background:info.bg, color:info.color, padding:"4px 12px", borderRadius:"999px", fontSize:"12px", fontWeight:"700" }}>
              {info.icon} {info.label}
            </span>
            {proyecto.fecha_envio && (
              <span style={{ fontSize:"11px", color:"#6b7280" }}>
                Enviado: {new Date(proyecto.fecha_envio).toLocaleDateString("es-MX")}
              </span>
            )}
            {proyecto.fecha_revision && (
              <span style={{ fontSize:"11px", color:"#6b7280" }}>
                Revisado: {new Date(proyecto.fecha_revision).toLocaleDateString("es-MX")}
              </span>
            )}
          </div>

          {/* Acciones según rol y estado */}
          <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>

            {/* DEPENDENCIA: puede enviar si está en borrador o rechazado */}
            {(esDependencia || esPlaneacion) && (estado==="borrador" || estado==="rechazado") && (
              <button onClick={()=>cambiar("enviado")} disabled={procesando}
                style={{ padding:"8px 18px", background:"#1e40af", color:"white", border:"none", borderRadius:"8px", cursor:"pointer", fontWeight:"600", fontSize:"13px", opacity:procesando?0.7:1 }}>
                {procesando?"Procesando...":"📤 Enviar para revisión"}
              </button>
            )}

            {/* PLANEACIÓN: puede aprobar o rechazar si está enviado */}
            {esPlaneacion && estado==="enviado" && (
              <>
                <button onClick={()=>cambiar("aprobado")} disabled={procesando}
                  style={{ padding:"8px 18px", background:"#16a34a", color:"white", border:"none", borderRadius:"8px", cursor:"pointer", fontWeight:"600", fontSize:"13px", opacity:procesando?0.7:1 }}>
                  {procesando?"Procesando...":"✅ Aprobar CIP"}
                </button>
                <button onClick={()=>setModalRechazo(true)} disabled={procesando}
                  style={{ padding:"8px 18px", background:"#dc2626", color:"white", border:"none", borderRadius:"8px", cursor:"pointer", fontWeight:"600", fontSize:"13px" }}>
                  ❌ Rechazar
                </button>
              </>
            )}

            {/* PLANEACIÓN: puede regresar a borrador si está aprobado */}
            {esPlaneacion && estado==="aprobado" && (
              <button onClick={()=>{ if(window.confirm("¿Regresar a borrador?")) cambiar("borrador") }}
                style={{ padding:"6px 14px", background:"#f3f4f6", color:"#374151", border:"1px solid #d1d5db", borderRadius:"8px", cursor:"pointer", fontSize:"12px" }}>
                Regresar a borrador
              </button>
            )}
          </div>
        </div>

        {/* Comentario de rechazo visible */}
        {estado==="rechazado" && proyecto.comentario_revision && (
          <div style={{ marginTop:"12px", background:"#fee2e2", borderRadius:"8px", padding:"10px 14px", border:"1px solid #fecaca" }}>
            <p style={{ fontWeight:"700", fontSize:"12px", color:"#991b1b", margin:"0 0 4px" }}>Motivo del rechazo:</p>
            <p style={{ fontSize:"12px", color:"#7f1d1d", margin:0 }}>{proyecto.comentario_revision}</p>
          </div>
        )}

        {estado==="aprobado" && (
          <div style={{ marginTop:"12px", background:"#d1fae5", borderRadius:"8px", padding:"10px 14px", border:"1px solid #6ee7b7" }}>
            <p style={{ fontWeight:"700", fontSize:"12px", color:"#065f46", margin:0 }}>
              ✅ CIP aprobada — disponible para exportar y publicar.
            </p>
          </div>
        )}
      </div>

      {/* Modal de rechazo */}
      {modalRechazo && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:2000 }}>
          <div style={{ background:"white", borderRadius:"12px", padding:"24px", width:"100%", maxWidth:"440px", boxShadow:"0 25px 60px rgba(0,0,0,0.3)" }}>
            <h3 style={{ margin:"0 0 12px", color:"#1e293b" }}>❌ Rechazar CIP</h3>
            <p style={{ fontSize:"13px", color:"#6b7280", margin:"0 0 12px" }}>
              El proyecto regresará a la dependencia con el motivo de rechazo.
            </p>
            <textarea
              value={comentario}
              onChange={e=>setComentario(e.target.value)}
              rows={4}
              placeholder="Escribe el motivo del rechazo (obligatorio)..."
              style={{ width:"100%", padding:"10px", borderRadius:"8px", border:"1px solid #d1d5db", fontSize:"13px", boxSizing:"border-box", resize:"vertical" }}
            />
            <div style={{ display:"flex", gap:"10px", justifyContent:"flex-end", marginTop:"14px" }}>
              <button onClick={()=>{ setModalRechazo(false); setComentario("") }}
                style={{ padding:"9px 18px", borderRadius:"8px", border:"1px solid #d1d5db", cursor:"pointer", background:"white" }}>
                Cancelar
              </button>
              <button onClick={()=>{ if(!comentario.trim()){alert("Escribe el motivo");return} cambiar("rechazado", comentario) }}
                disabled={procesando}
                style={{ padding:"9px 18px", borderRadius:"8px", background:"#dc2626", color:"white", border:"none", cursor:"pointer", fontWeight:"600", opacity:procesando?0.7:1 }}>
                {procesando?"Procesando...":"Confirmar rechazo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}