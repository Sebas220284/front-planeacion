import React, { useEffect, useState } from "react"
import socket from "../services/socket"

export default function DashboardEstrategica() {
  const [vista, setVista] = useState("lista") 
  const [planes, setPlanes] = useState([])
  const [form, setForm] = useState({
    eje: "", tema: "", politica_publica: "",
    objetivo: "", estrategia: ""
  })
  const [enviando, setEnviando] = useState(false)
  const [modalRevisar, setModalRevisar] = useState(null)
  const [comentario, setComentario] = useState("")
  const [user, setUser] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem("token")
    fetch("http://localhost:3001/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json()).then(setUser)

    fetch("http://localhost:3001/api/pmd/lista")
      .then(r => r.json())
      .then(setPlanes)

    socket.on("plan_revisado", (data) => {
      setPlanes(prev => prev.map(p => p.id === data.id ? data : p))
    })

    socket.on("nuevo_plan_estrategico", (data) => {
      setPlanes(prev => [data, ...prev])
    })

    return () => {
      socket.off("plan_revisado")
      socket.off("nuevo_plan_estrategico")
    }
  }, [])

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleEnviar = async () => {
    if(!form.eje || !form.tema || !form.politica_publica || !form.objetivo || !form.estrategia){
      alert("Completa todos los campos")
      return
    }
    setEnviando(true)
    try {
      const res = await fetch("http://localhost:3001/api/pmd/crear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, creado_por: user?.id || null })
      })
      const data = await res.json()
      setPlanes(prev => [data, ...prev])
      setForm({ eje:"", tema:"", politica_publica:"", objetivo:"", estrategia:"" })
      setVista("lista")
      alert("Plan enviado para revisión")
    } catch(err) {
      alert("Error al enviar")
    }
    setEnviando(false)
  }

  const handleRevisar = async (estado) => {
    if(!modalRevisar) return
    await fetch(`http://localhost:3001/api/pmd/revisar/${modalRevisar.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado, comentario, revisado_por: user?.id || null })
    })
    setPlanes(prev => prev.map(p =>
      p.id === modalRevisar.id ? { ...p, estado, comentario_revision: comentario } : p
    ))
    setModalRevisar(null)
    setComentario("")
  }

  const EstadoBadge = ({ estado }) => {
    const c = {
      pendiente: { bg:"#fef9c3", color:"#854d0e" },
      aprobado:  { bg:"#d1fae5", color:"#065f46" },
      rechazado: { bg:"#fee2e2", color:"#991b1b" },
    }[estado] || { bg:"#f3f4f6", color:"#374151" }
    return (
      <span style={{ background:c.bg, color:c.color, padding:"2px 10px", borderRadius:"999px", fontSize:"11px", fontWeight:"600" }}>
        {estado}
      </span>
    )
  }

  const esPlaneacion = user?.rol === "planeacion" || user?.rol === "admin"
  const esPE = user?.rol === "planeacion_estrategica"

  return (
    <div style={{ display:"flex", height:"100vh", fontFamily:"sans-serif" }}>

      <div style={{ width:"240px", background:"#1e293b", color:"white", display:"flex", flexDirection:"column", padding:"24px 16px", gap:"8px", flexShrink:0 }}>
        <h2 style={{ fontSize:"16px", fontWeight:"700", marginBottom:"16px", color:"#f8fafc" }}>
          Planeación Estratégica
        </h2>

        <button
          onClick={() => setVista("lista")}
          style={{
            background: vista==="lista" ? "#3b82f6" : "transparent",
            color:"white", border:"none", borderRadius:"8px",
            padding:"10px 14px", textAlign:"left", cursor:"pointer",
            fontSize:"13px", fontWeight:"600"
          }}
        >
          Planes enviados
        </button>

        {esPE && (
          <button
            onClick={() => setVista("nuevo")}
            style={{
              background: vista==="nuevo" ? "#3b82f6" : "transparent",
              color:"white", border:"none", borderRadius:"8px",
              padding:"10px 14px", textAlign:"left", cursor:"pointer",
              fontSize:"13px", fontWeight:"600"
            }}
          >
            ✉️ Enviar plan
          </button>
        )}
      </div>

      <div style={{ flex:1, padding:"32px", overflowY:"auto", background:"#f8fafc" }}>

        {vista === "nuevo" && esPE && (
          <div style={{ maxWidth:"700px", margin:"0 auto" }}>
            <h2 style={{ marginBottom:"24px", color:"#1e293b" }}>✉️ Enviar nuevo plan estratégico</h2>

            {[
              { name:"eje", label:"Eje", placeholder:"Ej: 2. Seguridad y Protección Ciudadana" },
              { name:"tema", label:"Tema", placeholder:"Ej: Tema 2.2. Gestión Integral de Riesgos" },
              { name:"politica_publica", label:"Política Pública", placeholder:"Ej: Política Pública 2.2.1..." },
              { name:"objetivo", label:"Objetivo", placeholder:"Describe el objetivo general..." },
              { name:"estrategia", label:"Estrategia", placeholder:"Ej: Estrategia 2.2.1.1..." },
            ].map(field => (
              <div key={field.name} style={{ marginBottom:"16px" }}>
                <label style={{ display:"block", fontWeight:"600", fontSize:"13px", marginBottom:"6px", color:"#374151" }}>
                  {field.label}
                </label>
                <textarea
                  name={field.name}
                  value={form[field.name]}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                  rows={field.name === "objetivo" || field.name === "estrategia" ? 3 : 2}
                  style={{ width:"100%", padding:"10px", borderRadius:"8px", border:"1px solid #d1d5db", fontSize:"13px", resize:"vertical", boxSizing:"border-box" }}
                />
              </div>
            ))}

            <button
              onClick={handleEnviar}
              disabled={enviando}
              style={{ background:"#2563eb", color:"white", border:"none", borderRadius:"8px", padding:"12px 28px", fontSize:"14px", fontWeight:"600", cursor:"pointer", opacity: enviando ? 0.7 : 1 }}
            >
              {enviando ? "Enviando..." : "Enviar para revisión"}
            </button>
          </div>
        )}

        {vista === "lista" && (
          <div>
            <h2 style={{ marginBottom:"24px", color:"#1e293b" }}>📋 Planes estratégicos</h2>

            {planes.length === 0 ? (
              <p style={{ color:"#6b7280" }}>No hay planes enviados aún.</p>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
                {planes.map(plan => (
                  <div key={plan.id} style={{ background:"white", borderRadius:"12px", padding:"20px", boxShadow:"0 1px 4px rgba(0,0,0,0.08)", border:"1px solid #e5e7eb" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"12px" }}>
                      <div>
                        <p style={{ fontWeight:"700", color:"#dc2626", fontSize:"12px", marginBottom:"2px" }}>{plan.eje}</p>
                        <p style={{ fontWeight:"600", color:"#1e293b", fontSize:"14px" }}>{plan.estrategia}</p>
                      </div>
                      <EstadoBadge estado={plan.estado} />
                    </div>

                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px", fontSize:"12px", color:"#6b7280", marginBottom:"12px" }}>
                      <div><b>Tema:</b> {plan.tema}</div>
                      <div><b>Política:</b> {plan.politica_publica}</div>
                      <div style={{ gridColumn:"1/-1" }}><b>Objetivo:</b> {plan.objetivo}</div>
                    </div>

                    {plan.comentario_revision && (
                      <div style={{ background:"#fef9c3", borderRadius:"6px", padding:"8px 12px", fontSize:"12px", color:"#854d0e", marginBottom:"12px" }}>
                        💬 <b>Comentario:</b> {plan.comentario_revision}
                      </div>
                    )}

                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span style={{ fontSize:"11px", color:"#9ca3af" }}>
                        {new Date(plan.created_at).toLocaleString("es-MX")}
                      </span>

                      {esPlaneacion && plan.estado === "pendiente" && (
                        <div style={{ display:"flex", gap:"8px" }}>
                          <button
                            onClick={() => setModalRevisar(plan)}
                            style={{ background:"#16a34a", color:"white", border:"none", borderRadius:"6px", padding:"6px 14px", fontSize:"12px", cursor:"pointer", fontWeight:"600" }}
                          >
                            ✅ Revisar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {modalRevisar && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999 }}>
          <div style={{ background:"white", borderRadius:"12px", padding:"24px", width:"400px", boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }}>
            <h3 style={{ marginBottom:"8px" }}>Revisar plan estratégico</h3>
            <p style={{ fontSize:"13px", color:"#6b7280", marginBottom:"16px" }}>{modalRevisar.estrategia}</p>

            <textarea
              placeholder="Comentario (opcional)..."
              value={comentario}
              onChange={e => setComentario(e.target.value)}
              style={{ width:"100%", padding:"8px", borderRadius:"6px", border:"1px solid #ddd", marginBottom:"16px", minHeight:"80px", resize:"vertical", boxSizing:"border-box" }}
            />

            <div style={{ display:"flex", gap:"8px", justifyContent:"flex-end" }}>
              <button
                onClick={() => { setModalRevisar(null); setComentario("") }}
                style={{ padding:"8px 16px", borderRadius:"6px", border:"1px solid #ddd", cursor:"pointer" }}
              >
                Cancelar
              </button>
              <button
                onClick={() => handleRevisar("rechazado")}
                style={{ padding:"8px 16px", borderRadius:"6px", background:"#dc2626", color:"white", border:"none", cursor:"pointer", fontWeight:"600" }}
              >
                ❌Rechazar
              </button>
              <button
                onClick={() => handleRevisar("aprobado")}
                style={{ padding:"8px 16px", borderRadius:"6px", background:"#16a34a", color:"white", border:"none", cursor:"pointer", fontWeight:"600" }}
              >
                ✅Aprobar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}