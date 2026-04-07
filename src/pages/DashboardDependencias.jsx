import React, { useEffect, useState } from "react"
import socket from "../services/socket"
import "../styles/dashboard.css"

export default function DashboardDependencias(){

const [user, setUser] = useState(null)
const [selectedStrategy, setSelectedStrategy] = useState(null)
const [lineas, setLineas] = useState([])
const [showStrategies, setShowStrategies] = useState(true)
//const [showNotifaciones, setShowNotifiaciones] = useState(true)

const [modalLinea, setModalLinea] = useState(false)
const [nuevaLinea, setNuevaLinea] = useState("")
const [notificaciones, setNotificaciones] = useState([])

const logout = () => {
  localStorage.removeItem("token")
  window.location.href="/"
}

useEffect(()=>{
  const token = localStorage.getItem("token")
  fetch("http://localhost:3001/api/auth/me",{
    headers:{ Authorization:`Bearer ${token}` }
  })
  .then(res=>res.json())
  .then(data=>{ setUser(data) })
},[])

useEffect(()=>{

  socket.on("planeacion_reviso", (data) => {
    const emoji = data.estado === "aprobado" ? "✅" : "❌"
    const msg = `${emoji} Tu ${data.tipo} del T${data.trimestre}-${data.anio} fue ${data.estado.toUpperCase()}`
    
    setNotificaciones(prev => [{ id: Date.now(), msg, estado: data.estado }, ...prev])

    setLineas(prev => prev.map(l =>
      l.planning_id === data.planning_id ? { ...l, estado_revision: data.estado } : l
    ))
  })

  return () => {
    socket.off("planeacion_reviso")
  }
},[])

if(!user) return <p>Cargando...</p>

const estrategiasAgrupadas = Object.values(
  user.estrategias.reduce((acc, e) => {
    if(!acc[e.id]){
      acc[e.id] = {
        id: e.id,
        name: e.name,
        pmd_eje: e.pmd_eje,
        pmd_tema: e.pmd_tema,
        pmd_politica_publica: e.pmd_politica_publica,
        pmd_objetivo: e.pmd_objetivo,
        pmd_estrategia: e.pmd_estrategia,
        lineas: []
      }
    }
    acc[e.id].lineas.push({
      id: e.linea_id,
      lineas_accion: e.lineas_accion,
      nomenclatura: e.nomenclatura,
      nombre2: e.nombre2,
      responsable: e.responsable,
      plazo: e.plazo,
      linea_base: e.linea_base,
      total: e.total,
      ejercicio: e.ejercicio,
      columna1: e.columna1,
    })
    return acc
  }, {})
)

const seleccionarEstrategia = async (e) => {
  setSelectedStrategy(e)

  const lineasIniciales = await Promise.all(e.lineas.map(async (l) => {
    const res = await fetch(`http://localhost:3001/api/trimestres/porLinea/${l.id}`)
    const trimestres = await res.json()

    const get = (anio, trim, tipo) =>
      trimestres.find(t => t.anio === anio && t.trimestre === trim && t.tipo === tipo)?.valor || ""

    const getComentario = (anio, tipo) =>
      trimestres.find(t => t.anio === anio && t.tipo === tipo)?.comentario || ""

    const getEstado = (anio, tipo) =>
      trimestres.find(t => t.anio === anio && t.tipo === tipo)?.estado_revision || "pendiente"

    return {
      ...l,
      planning_id: l.id,
      estado: "Aprobado",
      estado_revision_p25: getEstado(2025,"programado"),
      estado_revision_e25: getEstado(2025,"ejecutado"),
      estado_revision_p26: getEstado(2026,"programado"),
      estado_revision_e26: getEstado(2026,"ejecutado"),
      p1t: get(2025,1,"programado"), p2t: get(2025,2,"programado"),
      p3t: get(2025,3,"programado"), p4t: get(2025,4,"programado"),
      e1t: get(2025,1,"ejecutado"),  e2t: get(2025,2,"ejecutado"),
      e3t: get(2025,3,"ejecutado"),  e4t: get(2025,4,"ejecutado"),
      comentario25: getComentario(2025,"programado"),
      comentario25_exec: getComentario(2025,"ejecutado"),
      p1t26: get(2026,1,"programado"), p2t26: get(2026,2,"programado"),
      p3t26: get(2026,3,"programado"), p4t26: get(2026,4,"programado"),
      e1t26: get(2026,1,"ejecutado"),  e2t26: get(2026,2,"ejecutado"),
      e3t26: get(2026,3,"ejecutado"),  e4t26: get(2026,4,"ejecutado"),
      comentario26: getComentario(2026,"programado"),
      comentario26_exec: getComentario(2026,"ejecutado"),
    }
  }))

  setLineas(lineasIniciales)
}

const handleChange = (index, field, value) => {
  const nuevas = [...lineas]
  nuevas[index][field] = value
  setLineas(nuevas)
}

const guardarPlaneacion = async () => {
  try {
    for (const l of lineas) {
      const registros = [
        { anio:2025, trimestre:1, tipo:"programado", valor:l.p1t, comentario:l.comentario25 },
        { anio:2025, trimestre:2, tipo:"programado", valor:l.p2t, comentario:l.comentario25 },
        { anio:2025, trimestre:3, tipo:"programado", valor:l.p3t, comentario:l.comentario25 },
        { anio:2025, trimestre:4, tipo:"programado", valor:l.p4t, comentario:l.comentario25 },
        { anio:2025, trimestre:1, tipo:"ejecutado",  valor:l.e1t, comentario:l.comentario25_exec },
        { anio:2025, trimestre:2, tipo:"ejecutado",  valor:l.e2t, comentario:l.comentario25_exec },
        { anio:2025, trimestre:3, tipo:"ejecutado",  valor:l.e3t, comentario:l.comentario25_exec },
        { anio:2025, trimestre:4, tipo:"ejecutado",  valor:l.e4t, comentario:l.comentario25_exec },
        { anio:2026, trimestre:1, tipo:"programado", valor:l.p1t26, comentario:l.comentario26 },
        { anio:2026, trimestre:2, tipo:"programado", valor:l.p2t26, comentario:l.comentario26 },
        { anio:2026, trimestre:3, tipo:"programado", valor:l.p3t26, comentario:l.comentario26 },
        { anio:2026, trimestre:4, tipo:"programado", valor:l.p4t26, comentario:l.comentario26 },
        { anio:2026, trimestre:1, tipo:"ejecutado",  valor:l.e1t26, comentario:l.comentario26_exec },
        { anio:2026, trimestre:2, tipo:"ejecutado",  valor:l.e2t26, comentario:l.comentario26_exec },
        { anio:2026, trimestre:3, tipo:"ejecutado",  valor:l.e3t26, comentario:l.comentario26_exec },
        { anio:2026, trimestre:4, tipo:"ejecutado",  valor:l.e4t26, comentario:l.comentario26_exec },
      ]
      for (const r of registros) {
        await fetch("http://localhost:3001/api/trimestres/guardar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planning_id: l.planning_id,
            anio: r.anio, trimestre: r.trimestre,
            tipo: r.tipo, valor: r.valor || 0,
            comentario: r.comentario || ""
          })
        })
      }
    }
    alert("✅ Planeación enviada para revisión")
  } catch (err) {
    console.error(err)
    alert("Error al guardar")
  }
}

const enviarRevision = async () => {
  if(!nuevaLinea.trim()) return
  const res = await fetch("http://localhost:3001/api/lineas/nueva",{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({ estrategia_id:selectedStrategy.id, lineas_accion:nuevaLinea })
  })
  const data = await res.json()
  setLineas([...lineas, data])
  setNuevaLinea("")
  setModalLinea(false)
}

const EstadoBadge = ({ estado }) => {
  const colores = {
    aprobado:  { bg:"#d1fae5", color:"#065f46" },
    rechazado: { bg:"#fee2e2", color:"#991b1b" },
    pendiente: { bg:"#fef9c3", color:"#854d0e" },
  }
  const c = colores[estado] || colores.pendiente
  return (
    <span style={{
      background: c.bg, color: c.color,
      padding: "2px 8px", borderRadius: "999px",
      fontSize: "11px", fontWeight: "600"
    }}>
      {estado}
    </span>
  )
}

return(
<div className="layout">

  <div className="sidebar">
    <h2>{user.dependencia}</h2>
    <div className="dependency-info">
      <p><b>Titular:</b> {user.titular}</p>
      <p><b>Enlace:</b> {user.enlace}</p>
      <button className="logout-btn" onClick={logout}>Cerrar sesión</button>
    </div>

    <button className="strategy-toggle" onClick={()=>setShowStrategies(!showStrategies)}>
      Estrategias {showStrategies ? "▲" : "▼"}
    </button>
   

    {showStrategies && (
      <ul className="strategy-list">
        {estrategiasAgrupadas.map((e, index) => (
          <li
            key={e.id}
            className={selectedStrategy?.id === e.id ? "active" : ""}
            onClick={()=>seleccionarEstrategia(e)}
          >
            <span className="strategy-number">{index+1}</span>
            <span className="strategy-name">{e.name}</span>
          </li>
        ))}
      </ul>
      
      
    )}
    
    
  </div>

  <div className="content">

    {notificaciones.length > 0 && (
      <div style={{marginBottom:"16px"}}>
        {notificaciones.map(n => (
          <div key={n.id} style={{
            padding:"10px 16px",
            borderRadius:"8px",
            marginBottom:"6px",
            background: n.estado === "aprobado" ? "#d1fae5" : "#fee2e2",
            color: n.estado === "aprobado" ? "#065f46" : "#991b1b",
            fontWeight:"600",
            display:"flex",
            justifyContent:"space-between",
            alignItems:"center"
          }}>
            {n.msg}
            <button
              onClick={()=>setNotificaciones(prev=>prev.filter(x=>x.id!==n.id))}
              style={{background:"transparent",border:"none",cursor:"pointer",fontSize:"16px"}}
            >✕</button>
          </div>
          
        ))}
      </div>
      
    )}

    {!selectedStrategy && (
      <div className="empty-panel">
        <h2>Selecciona una estrategia</h2>
      </div>
    )}

    {selectedStrategy && (
      <div className="strategy-panel">
        <h2>{selectedStrategy.name}</h2>

        <div className="planning-grid">
          <div><label>EJE</label><p>{selectedStrategy.pmd_eje || "-"}</p></div>
          <div><label>TEMA</label><p>{selectedStrategy.pmd_tema || "-"}</p></div>
          <div><label>POLÍTICA PÚBLICA</label><p>{selectedStrategy.pmd_politica_publica || "-"}</p></div>
          <div><label>OBJETIVO</label><p>{selectedStrategy.pmd_objetivo || "-"}</p></div>
          <div><label>ESTRATEGIA PMD</label><p>{selectedStrategy.pmd_estrategia || "-"}</p></div>
        </div>

        <h3 style={{marginTop:"20px"}}>Planeación</h3>

        <div className="table-container">
          <table className="excel-table">
            <thead>
              <tr>
                <th rowSpan="2">#</th>
                <th rowSpan="2">Línea de acción</th>
                <th rowSpan="2">Estado</th>
                <th colSpan="7">Programado 2025</th>
                <th colSpan="7">Ejecutado 2025</th>
                <th colSpan="7">Programado 2026</th>
                <th colSpan="7">Ejecutado 2026</th>
              </tr>
              <tr>
                <th>T1</th><th>T2</th><th>T3</th><th>T4</th><th>Acumulado</th><th>Comentarios</th><th>Revisión</th>
                <th>T1</th><th>T2</th><th>T3</th><th>T4</th><th>Acumulado</th><th>Comentarios</th><th>Revisión</th>
                <th>T1</th><th>T2</th><th>T3</th><th>T4</th><th>Acumulado</th><th>Comentarios</th><th>Revisión</th>
                <th>T1</th><th>T2</th><th>T3</th><th>T4</th><th>Acumulado</th><th>Comentarios</th><th>Revisión</th>
              </tr>
            </thead>
            <tbody>
              {lineas.map((l, i) => (
                <tr key={`${l.planning_id}-${i}`}>
                  <td>{i+1}</td>
                  <td>{l.lineas_accion}</td>
                  <td>
                    {l.estado === "Pendiente"
                      ? <span className="estado-pendiente">Pendiente</span>
                      : <span className="estado-aprobado">Aprobado</span>
                    }
                  </td>

                  <td><input value={l.p1t} onChange={(e)=>handleChange(i,"p1t",e.target.value)}/></td>
                  <td><input value={l.p2t} onChange={(e)=>handleChange(i,"p2t",e.target.value)}/></td>
                  <td><input value={l.p3t} onChange={(e)=>handleChange(i,"p3t",e.target.value)}/></td>
                  <td><input value={l.p4t} onChange={(e)=>handleChange(i,"p4t",e.target.value)}/></td>
                  <td>{Number(l.p1t||0)+Number(l.p2t||0)+Number(l.p3t||0)+Number(l.p4t||0)}</td>
                  <td><textarea value={l.comentario25||""} onChange={(e)=>handleChange(i,"comentario25",e.target.value)}/></td>
                  <td><EstadoBadge estado={l.estado_revision_p25||"pendiente"}/></td>

                  <td><input value={l.e1t} onChange={(e)=>handleChange(i,"e1t",e.target.value)}/></td>
                  <td><input value={l.e2t} onChange={(e)=>handleChange(i,"e2t",e.target.value)}/></td>
                  <td><input value={l.e3t} onChange={(e)=>handleChange(i,"e3t",e.target.value)}/></td>
                  <td><input value={l.e4t} onChange={(e)=>handleChange(i,"e4t",e.target.value)}/></td>
                  <td>{Number(l.e1t||0)+Number(l.e2t||0)+Number(l.e3t||0)+Number(l.e4t||0)}</td>
                  <td><textarea value={l.comentario25_exec||""} onChange={(e)=>handleChange(i,"comentario25_exec",e.target.value)}/></td>
                  <td><EstadoBadge estado={l.estado_revision_e25||"pendiente"}/></td>

                  <td><input value={l.p1t26} onChange={(e)=>handleChange(i,"p1t26",e.target.value)}/></td>
                  <td><input value={l.p2t26} onChange={(e)=>handleChange(i,"p2t26",e.target.value)}/></td>
                  <td><input value={l.p3t26} onChange={(e)=>handleChange(i,"p3t26",e.target.value)}/></td>
                  <td><input value={l.p4t26} onChange={(e)=>handleChange(i,"p4t26",e.target.value)}/></td>
                  <td>{Number(l.p1t26||0)+Number(l.p2t26||0)+Number(l.p3t26||0)+Number(l.p4t26||0)}</td>
                  <td><textarea value={l.comentario26||""} onChange={(e)=>handleChange(i,"comentario26",e.target.value)}/></td>
                  <td><EstadoBadge estado={l.estado_revision_p26||"pendiente"}/></td>

                  <td><input value={l.e1t26} onChange={(e)=>handleChange(i,"e1t26",e.target.value)}/></td>
                  <td><input value={l.e2t26} onChange={(e)=>handleChange(i,"e2t26",e.target.value)}/></td>
                  <td><input value={l.e3t26} onChange={(e)=>handleChange(i,"e3t26",e.target.value)}/></td>
                  <td><input value={l.e4t26} onChange={(e)=>handleChange(i,"e4t26",e.target.value)}/></td>
                  <td>{Number(l.e1t26||0)+Number(l.e2t26||0)+Number(l.e3t26||0)+Number(l.e4t26||0)}</td>
                  <td><textarea value={l.comentario26_exec||""} onChange={(e)=>handleChange(i,"comentario26_exec",e.target.value)}/></td>
                  <td><EstadoBadge estado={l.estado_revision_e26||"pendiente"}/></td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="save-container">
          <button className="save-btn" onClick={guardarPlaneacion}>Guardar</button>
          <button className="add-line-btn" onClick={()=>setModalLinea(true)}>Añadir línea</button>
        </div>

      </div>
    )}
  </div>

  {modalLinea && (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Añadir línea de acción</h3>
        <input
          type="text"
          placeholder="Nombre de la línea"
          value={nuevaLinea}
          onChange={(e)=>setNuevaLinea(e.target.value)}
        />
        <div className="modal-buttons">
          <button onClick={()=>setModalLinea(false)}>Cancelar</button>
          <button onClick={enviarRevision}>Enviar</button>
        </div>
      </div>
    </div>
  )}

</div>
)
}