import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import socket from "../services/socket"
import { generarPDF } from "../utils/generarPDF"
import "../styles/dashboardPlaneacion.css"

export default function DashboardPlaneacion(){

const [dependencias, setDependencias] = useState([])
const [activa, setActiva] = useState(null)
const [openDependencias, setOpenDependencias] = useState(false)
const [trimestres, setTrimestres] = useState({})
const [modalPDF, setModalPDF] = useState(false)
const [filtroPDF, setFiltroPDF] = useState({ anio: 2025, trimestre: 1 })

const navigate = useNavigate()

useEffect(()=>{
  socket.emit("join_planeacion")

  fetch("http://localhost:3001/api/planeacion/dashboard")
    .then(res => res.json())
    .then(async (data) => {
      setDependencias(data)
      if(data.length > 0) setActiva(data[0].id)

      const allTrimestres = {}
      for(const dep of data){
        for(const est of Object.values(dep.estrategias)){
          for(const linea of est.lineas){
            const res = await fetch(`http://localhost:3001/api/trimestres/porLinea/${linea.id}`)
            const t = await res.json()
            allTrimestres[linea.id] = t
          }
        }
      }
      setTrimestres(allTrimestres)
    })

  socket.on("trimestre_actualizado", async (data) => {
    const res = await fetch(`http://localhost:3001/api/trimestres/porLinea/${data.planning_id}`)
    const t = await res.json()
    setTrimestres(prev => ({ ...prev, [data.planning_id]: t }))
  })

  socket.on("revision-trimestre", (data) => {
    setTrimestres(prev => {
      const lista = prev[data.planning_id] || []
      return {
        ...prev,
        [data.planning_id]: lista.map(t => t.id === data.id ? data : t)
      }
    })
  })

  return () => {
    socket.off("trimestre_actualizado")
    socket.off("revision-trimestre")
  }
},[])

const getValor = (planning_id, anio, trimestre, tipo) => {
  const lista = trimestres[planning_id] || []
  return lista.find(t => t.anio === anio && t.trimestre === trimestre && t.tipo === tipo)?.valor ?? "-"
}

const getComentario = (planning_id, anio, tipo) => {
  const lista = trimestres[planning_id] || []
  return lista.find(t => t.anio === anio && t.tipo === tipo)?.comentario ?? ""
}

const sumar = (planning_id, anio, tipo) =>
  [1,2,3,4].reduce((acc, t) => acc + (Number(getValor(planning_id, anio, t, tipo)) || 0), 0)

const getEstadoRevision = (planning_id, anio, tipo) => {
  const lista = trimestres[planning_id] || []
  return lista.find(t => t.anio === anio && t.tipo === tipo)?.estado_revision || "pendiente"
}

const revisarTrimestre = async (planning_id, anio, tipo, estado, dependency_id) => {
  const lista = trimestres[planning_id] || []
  const registros = lista.filter(t => t.anio === anio && t.tipo === tipo)

  for(const t of registros){
    await fetch(`http://localhost:3001/api/review/${t.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado, comentario: "", user_id: null, dependency_id })
    })
  }

  setTrimestres(prev => {
    const nuevaLista = (prev[planning_id] || []).map(t =>
      t.anio === anio && t.tipo === tipo ? { ...t, estado_revision: estado } : t
    )
    return { ...prev, [planning_id]: nuevaLista }
  })
}

const todosAprobados = (dep) => {
  if(!dep) return false
  for(const est of Object.values(dep.estrategias)){
    for(const linea of est.lineas){
      const lista = trimestres[linea.id] || []
      if(lista.length === 0) return false
      const tieneRechazado = lista.some(t => t.estado_revision === "rechazado")
      const tienePendiente = lista.some(t => t.estado_revision === "pendiente" || !t.estado_revision)
      if(tieneRechazado || tienePendiente) return false
    }
  }
  return true
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

const dependencia = dependencias.find(d => d.id === activa)
const pdfHabilitado = todosAprobados(dependencia)

const cerrarSesion = () => {
  localStorage.removeItem("token")
  localStorage.removeItem("user")
  sessionStorage.clear()
  navigate("/")
}

return(
<div className="layout">

  <div className="sidebar">
    <h2 className="logo">Planeación</h2>

    <button className="menu-btn" onClick={()=>setOpenDependencias(!openDependencias)}>
      Dependencias {openDependencias ? "▲":"▼"}
    </button>

    <div className={`submenu ${openDependencias ? "open" : ""}`}>
      {dependencias.map(dep=>(
        <button
          key={dep.id}
          className={`dep-item ${dep.id===activa?"active":""}`}
          onClick={()=>setActiva(dep.id)}
        >
          {dep.name}
        </button>
      ))}
    </div>

    <button className="logout-btn" onClick={cerrarSesion}>Cerrar sesión</button>
  </div>

  <div className="contenido">

    <h2 className="titulo">
      {dependencia ? dependencia.name : "Selecciona una dependencia"}
    </h2>

    {dependencia && Object.values(dependencia.estrategias).map(est => (
      <div key={est.id} className="card">

        <div className="card-header">
          <h3>{est.name}</h3>
          <span className="badge">{est.lineas.length} líneas</span>
        </div>

        <div className="tabla-wrapper">
          <table className="tabla-poa">
            <thead>
              <tr>
                <th rowSpan="2">#</th>
                <th rowSpan="2">Línea de acción</th>
                <th colSpan="7">Programado 2025</th>
                <th colSpan="7">Ejecutado 2025</th>
                <th colSpan="7">Programado 2026</th>
                <th colSpan="7">Ejecutado 2026</th>
              </tr>
              <tr>
                <th>T1</th><th>T2</th><th>T3</th><th>T4</th><th>Total</th><th>Comentario</th><th>Revisión</th>
                <th>T1</th><th>T2</th><th>T3</th><th>T4</th><th>Total</th><th>Comentario</th><th>Revisión</th>
                <th>T1</th><th>T2</th><th>T3</th><th>T4</th><th>Total</th><th>Comentario</th><th>Revisión</th>
                <th>T1</th><th>T2</th><th>T3</th><th>T4</th><th>Total</th><th>Comentario</th><th>Revisión</th>
              </tr>
            </thead>

            <tbody>
              {est.lineas.map((linea, i) => (
                <tr key={`${est.id}-${i}-${linea.id}`}>
                  <td>{i+1}</td>
                  <td>{linea.lineas_accion}</td>

                  {[
                    { anio:2025, tipo:"programado" },
                    { anio:2025, tipo:"ejecutado"  },
                    { anio:2026, tipo:"programado" },
                    { anio:2026, tipo:"ejecutado"  },
                  ].map(({ anio, tipo }) => {
                    const estado = getEstadoRevision(linea.id, anio, tipo)
                    return (
                      <React.Fragment key={`${est.id}-${linea.id}-${i}-${anio}-${tipo}`}>
                        <td>{getValor(linea.id, anio, 1, tipo)}</td>
                        <td>{getValor(linea.id, anio, 2, tipo)}</td>
                        <td>{getValor(linea.id, anio, 3, tipo)}</td>
                        <td>{getValor(linea.id, anio, 4, tipo)}</td>
                        <td><b>{sumar(linea.id, anio, tipo)}</b></td>
                        <td style={{fontSize:"11px"}}>{getComentario(linea.id, anio, tipo)}</td>
                        <td style={{minWidth:"140px"}}>
                          <EstadoBadge estado={estado} />
                          <div style={{display:"flex", gap:"4px", marginTop:"4px"}}>
                            <button
                              onClick={()=>revisarTrimestre(linea.id, anio, tipo, "aprobado", dependencia.id)}
                              style={{background:"#16a34a", color:"white", border:"none", borderRadius:"4px", padding:"2px 8px", cursor:"pointer", fontSize:"11px"}}
                            >
                              ✅ Aprobar
                            </button>
                            <button
                              onClick={()=>revisarTrimestre(linea.id, anio, tipo, "rechazado", dependencia.id)}
                              style={{background:"#dc2626", color:"white", border:"none", borderRadius:"4px", padding:"2px 8px", cursor:"pointer", fontSize:"11px"}}
                            >
                              ❌ Rechazar
                            </button>
                          </div>
                        </td>
                      </React.Fragment>
                    )
                  })}

                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    ))}

    {dependencia && (
      <div style={{
        marginTop:"24px", marginBottom:"24px",
        display:"flex", justifyContent:"flex-end"
      }}>
        <button
          onClick={()=> pdfHabilitado && setModalPDF(true)}
          disabled={!pdfHabilitado}
          title={!pdfHabilitado ? "Todos los trimestres deben estar aprobados para exportar" : "Exportar PDF"}
          style={{
            background: pdfHabilitado ? "#dc2626" : "#9ca3af",
            color:"white", border:"none", borderRadius:"8px",
            padding:"10px 24px", fontSize:"14px", fontWeight:"600",
            cursor: pdfHabilitado ? "pointer" : "not-allowed",
            opacity: pdfHabilitado ? 1 : 0.6,
            transition:"all 0.2s"
          }}
        >
          📄 {pdfHabilitado ? "Exportar PDF" : "PDF (pendiente aprobación)"}
        </button>
      </div>
    )}

  </div>


  {modalPDF && (
    <div style={{
      position:"fixed", inset:0, background:"rgba(0,0,0,0.5)",
      display:"flex", alignItems:"center", justifyContent:"center", zIndex:999
    }}>
      <div style={{
        background:"white", borderRadius:"12px",
        padding:"24px", width:"320px",
        boxShadow:"0 20px 60px rgba(0,0,0,0.3)"
      }}>
        <h3 style={{marginBottom:"16px"}}>📄 Seleccionar período</h3>

        <label style={{display:"block", marginBottom:"6px", fontSize:"13px", fontWeight:"600"}}>Año</label>
        <select
          value={filtroPDF.anio}
          onChange={e=>setFiltroPDF(prev=>({...prev, anio:Number(e.target.value)}))}
          style={{width:"100%", padding:"8px", borderRadius:"6px", border:"1px solid #ddd", marginBottom:"12px"}}
        >
          <option value={2025}>2025</option>
          <option value={2026}>2026</option>
        </select>

        <label style={{display:"block", marginBottom:"6px", fontSize:"13px", fontWeight:"600"}}>Trimestre</label>
        <select
          value={filtroPDF.trimestre ?? ""}
          onChange={e=>setFiltroPDF(prev=>({...prev, trimestre: e.target.value==="" ? null : Number(e.target.value)}))}
          style={{width:"100%", padding:"8px", borderRadius:"6px", border:"1px solid #ddd", marginBottom:"20px"}}
        >
          <option value="">Año completo</option>
          <option value={1}>T1 - Enero a Marzo</option>
          <option value={2}>T2 - Abril a Junio</option>
          <option value={3}>T3 - Julio a Septiembre</option>
          <option value={4}>T4 - Octubre a Diciembre</option>
        </select>

        <div style={{display:"flex", gap:"8px", justifyContent:"flex-end"}}>
          <button
            onClick={()=>setModalPDF(false)}
            style={{padding:"8px 16px", borderRadius:"6px", border:"1px solid #ddd", cursor:"pointer", background:"white"}}
          >
            Cancelar
          </button>
          <button
            onClick={()=>{
              generarPDF(dependencia, dependencia.estrategias, trimestres, filtroPDF)
              setModalPDF(false)
            }}
            style={{
              padding:"8px 16px", borderRadius:"6px",
              background:"#dc2626", color:"white",
              border:"none", cursor:"pointer", fontWeight:"600"
            }}
          >
            📄 Descargar PDF
          </button>
        </div>
      </div>
    </div>
  )}

</div>
)
}