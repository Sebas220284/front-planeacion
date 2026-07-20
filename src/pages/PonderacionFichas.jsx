import React, { useEffect, useState } from "react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Cell, ResponsiveContainer, PieChart, Pie, Legend,
  RadialBarChart, RadialBar
} from "recharts"

const API = "http://localhost:3100"

const AÑOS = [2024, 2025, 2026, 2027]

const COLORES = [
  "#1e40af","#7c3aed","#dc2626","#d97706","#16a34a",
  "#0891b2","#9333ea","#be185d","#15803d","#b45309"
]

const getSemaforo = (p) => {
  if (p >= 90) return { color:"#16a34a", bg:"#d1fae5", label:"Óptimo",  emoji:"🟢" }
  if (p >= 70) return { color:"#d97706", bg:"#fef3c7", label:"Bueno",   emoji:"🟡" }
  if (p >= 50) return { color:"#f59e0b", bg:"#fffbeb", label:"Regular", emoji:"🟠" }
  return        { color:"#dc2626", bg:"#fee2e2", label:"Bajo",    emoji:"🔴" }
}

const BarraProgreso = ({ pct, color, height=8, showLabel=false }) => (
  <div style={{ width:"100%" }}>
    <div style={{ background:"#f1f5f9", borderRadius:"999px", height:`${height}px`, overflow:"hidden" }}>
      <div style={{
        height:"100%", width:`${Math.min(pct,100)}%`,
        background:color, borderRadius:"999px",
        transition:"width 0.6s ease",
        minWidth: pct>0?"4px":"0"
      }} />
    </div>
    {showLabel && (
      <p style={{ margin:"2px 0 0", fontSize:"10px", color, fontWeight:"700", textAlign:"right" }}>
        {pct.toFixed(1)}%
      </p>
    )}
  </div>
)

export default function PonderacionFichas({ dependencias = [], currentUser = null }) {
  const [depSel, setDepSel]         = useState("")
  const [anio, setAnio]             = useState(2025)
  const [datos, setDatos]           = useState(null)
  const [cargando, setCargando]     = useState(false)
  const [calculando, setCalculando] = useState(false)
  const [vistaGlobal, setVistaGlobal] = useState(false)
  const [globalData, setGlobalData] = useState(null)
  const [fichaExpandida, setFichaExpandida] = useState(null)
  const [exportando, setExportando] = useState(false)

  // Carga global si es planeación
  useEffect(() => {
    const esPlaneacion = ["planeacion","admin"].includes(currentUser?.rol_nombre)
    if (esPlaneacion) cargarGlobal()
  }, [anio, currentUser])

  const cargarGlobal = async () => {
    try {
      const res  = await fetch(`${API}/api/ponderacion/global?anio=${anio}`)
      const data = await res.json()
      setGlobalData(data)
    } catch(e) { console.error(e) }
  }

  const cargarResumen = async (depId = depSel, año = anio) => {
    if (!depId) return
    setCargando(true)
    try {
      const res  = await fetch(`${API}/api/ponderacion/resumen/${depId}/${año}`)
      const data = await res.json()
      setDatos(data)
    } catch(e) { console.error(e) }
    setCargando(false)
  }

  const calcularYGuardar = async () => {
    if (!depSel) { alert("Selecciona una dependencia"); return }
    setCalculando(true)
    try {
      const res  = await fetch(`${API}/api/ponderacion/calcular/${depSel}/${anio}`, {
        method:"POST", headers:{"Content-Type":"application/json"}
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setDatos(data)
      alert(`✅ Ponderación calculada. Avance global: ${data.total_avance_ponderado?.toFixed(2)}%`)
      cargarGlobal()
    } catch(e) { alert("Error: " + e.message) }
    setCalculando(false)
  }

  const handleDepChange = async (e) => {
    const id = e.target.value
    setDepSel(id); setDatos(null)
    if (id) await cargarResumen(id, anio)
  }

  const handleAnioChange = async (e) => {
    const a = Number(e.target.value)
    setAnio(a); setDatos(null)
    if (depSel) await cargarResumen(depSel, a)
    cargarGlobal()
  }

  // ── EXPORTAR EXCEL de ponderación ──
  const exportarExcel = async () => {
    if (!datos || !datos.fichas?.length) return
    setExportando(true)
    try {
      const ExcelJS = (await import("exceljs")).default
      const wb = new ExcelJS.Workbook()
      const ws = wb.addWorksheet(`Ponderación ${anio}`)

      // Encabezado
      ws.mergeCells("A1:H1")
      ws.getCell("A1").value = `PONDERACIÓN DE INDICADORES — ${datos.fichas[0]?.dependencia_nombre||""} — ${anio}`
      ws.getCell("A1").fill  = { type:"pattern",pattern:"solid",fgColor:{argb:"FF1E40AF"} }
      ws.getCell("A1").font  = { bold:true,color:{argb:"FFFFFFFF"},size:11 }
      ws.getCell("A1").alignment = { horizontal:"center", vertical:"middle" }
      ws.getRow(1).height = 22

      // Totales
      ws.mergeCells("A2:H2")
      const sem = getSemaforo(datos.totales?.avance_ponderado_global||0)
      ws.getCell("A2").value = `Total Meta Trianual: ${datos.totales?.total_meta_trianual||0} | Avance Ponderado Global: ${datos.totales?.avance_ponderado_global?.toFixed(2)||0}% | ${sem.emoji} ${sem.label}`
      ws.getCell("A2").fill  = { type:"pattern",pattern:"solid",fgColor:{argb:"FFE0E7FF"} }
      ws.getCell("A2").font  = { bold:true,color:{argb:"FF1E40AF"},size:10 }
      ws.getCell("A2").alignment = { horizontal:"center" }
      ws.getRow(2).height = 16

      // Headers
      const cols = [
        {header:"Indicador",               key:"nombre_indicador",      width:45},
        {header:"Meta Trianual",           key:"meta_trianual",         width:16},
        {header:"Meta Anual",              key:"meta_anual",            width:14},
        {header:"Avance Anual",            key:"avance_anual_efectivo", width:14},
        {header:"% Ponderación",           key:"ponderacion",           width:16},
        {header:"% Cumplimiento",          key:"porcentaje_cumplimiento",width:16},
        {header:"Avance Ponderado",        key:"avance_ponderado",      width:18},
        {header:"Semáforo",                key:"semaforo",              width:12},
      ]
      ws.columns = cols.map(c=>({width:c.width}))
      const hdRow = ws.addRow(cols.map(c=>c.header))
      hdRow.eachCell(cell => {
        cell.fill = { type:"pattern",pattern:"solid",fgColor:{argb:"FF1F1F1F"} }
        cell.font = { bold:true,color:{argb:"FFFFFFFF"},size:9 }
        cell.alignment = { horizontal:"center",vertical:"middle",wrapText:true }
      })
      ws.getRow(3).height = 28

      // Datos
      datos.fichas.forEach((f,idx) => {
        const sem = getSemaforo(f.porcentaje_cumplimiento)
        const row = ws.addRow([
          f.nombre_indicador,
          Number(f.meta_trianual||0),
          Number(f.meta_anual||0),
          Number(f.avance_anual_efectivo||0),
          Number(f.ponderacion||0),
          Number(f.porcentaje_cumplimiento||0),
          Number(f.avance_ponderado||0),
          `${sem.emoji} ${sem.label}`
        ])
        row.getCell(5).numFmt = '0.00"%"'
        row.getCell(6).numFmt = '0.00"%"'
        row.getCell(7).numFmt = '0.00"%"'
        row.getCell(7).font   = { bold:true, color:{ argb: sem.color.replace("#","FF") } }
        row.eachCell(cell => {
          cell.fill = { type:"pattern",pattern:"solid",fgColor:{ argb: idx%2===0?"FFFFFFFF":"FFF5F5F5" } }
          cell.alignment = { wrapText:true,vertical:"top" }
          cell.font = { ...cell.font, size:9 }
        })
        row.height = 20
      })

      // Fila total
      const totalRow = ws.addRow([
        "TOTAL / PROMEDIO",
        datos.fichas.reduce((s,f)=>s+Number(f.meta_trianual||0),0),
        datos.fichas.reduce((s,f)=>s+Number(f.meta_anual||0),0),
        datos.fichas.reduce((s,f)=>s+Number(f.avance_anual_efectivo||0),0),
        Number(datos.totales?.suma_ponderaciones||0),
        datos.fichas.reduce((s,f)=>s+Number(f.porcentaje_cumplimiento||0),0)/datos.fichas.length,
        Number(datos.totales?.avance_ponderado_global||0),
        `${getSemaforo(datos.totales?.avance_ponderado_global||0).emoji} GLOBAL`
      ])
      totalRow.eachCell(cell => {
        cell.fill = { type:"pattern",pattern:"solid",fgColor:{argb:"FFE0E7FF"} }
        cell.font = { bold:true,size:9,color:{argb:"FF1E40AF"} }
      })
      totalRow.height = 18

      const buf  = await wb.xlsx.writeBuffer()
      const blob = new Blob([buf],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"})
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement("a")
      a.href = url
      a.download = `Ponderacion_${datos.fichas[0]?.dependencia_nombre||"dep"}_${anio}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch(e) { console.error(e); alert("Error al exportar: "+e.message) }
    setExportando(false)
  }

  const esPlaneacion = ["planeacion","admin"].includes(currentUser?.rol_nombre)

  return (
    <div style={{ padding:"24px", background:"#f8fafc", minHeight:"100vh" }}>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"20px", flexWrap:"wrap", gap:"12px" }}>
        <div>
          <h2 style={{ margin:"0 0 4px", color:"#1e293b" }}>📊 Ponderación de Indicadores</h2>
          <p style={{ margin:0, color:"#6b7280", fontSize:"13px" }}>
            La meta trianual total = 100% · Cada indicador tiene un peso proporcional
          </p>
        </div>
        <div style={{ display:"flex", gap:"8px" }}>
          {esPlaneacion && (
            <button
              onClick={()=>setVistaGlobal(v=>!v)}
              style={{ padding:"8px 16px", background:vistaGlobal?"#1e3a8a":"#1e40af", color:"white", border:"none", borderRadius:"8px", cursor:"pointer", fontSize:"13px", fontWeight:"600" }}
            >
              {vistaGlobal ? "← Ver dependencia" : "🌐 Vista global"}
            </button>
          )}
        </div>
      </div>

      {/* ═══ VISTA GLOBAL (para planeación) ═══ */}
      {vistaGlobal && esPlaneacion && globalData && (
        <div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:"12px", marginBottom:"20px" }}>
            {(globalData.dependencias||[]).map((dep,i) => {
              const sem = getSemaforo(dep.avance_ponderado_global)
              return (
                <div key={dep.dependency_id} style={{ background:"white", borderRadius:"12px", padding:"16px", border:`2px solid ${sem.color}30`, boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"8px" }}>
                    <p style={{ margin:0, fontWeight:"700", fontSize:"12px", color:"#1e293b", lineHeight:"1.3" }}>
                      {dep.dependencia_nombre}
                    </p>
                    <span style={{ fontSize:"18px" }}>{sem.emoji}</span>
                  </div>
                  <p style={{ margin:"0 0 8px", fontSize:"28px", fontWeight:"800", color:sem.color }}>
                    {Number(dep.avance_ponderado_global||0).toFixed(1)}%
                  </p>
                  <BarraProgreso pct={Number(dep.avance_ponderado_global||0)} color={sem.color} height={10} />
                  <div style={{ display:"flex", justifyContent:"space-between", marginTop:"8px", fontSize:"10px", color:"#6b7280" }}>
                    <span>{dep.total_fichas} indicador{dep.total_fichas!==1?"es":""}</span>
                    <span style={{ background:sem.bg, color:sem.color, padding:"1px 6px", borderRadius:"4px", fontWeight:"700" }}>{sem.label}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Gráfica comparativa global */}
          <div style={{ background:"white", borderRadius:"12px", padding:"20px", border:"1px solid #e5e7eb" }}>
            <p style={{ fontWeight:"700", fontSize:"13px", color:"#374151", margin:"0 0 14px" }}>
              Comparativo de avance ponderado por dependencia — {anio}
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={(globalData.dependencias||[]).map(d=>({
                  name: d.dependencia_nombre.substring(0,20),
                  avance: Number(d.avance_ponderado_global||0),
                  cumplimiento: Number(d.cumplimiento_promedio||0)
                }))}
                margin={{top:10,right:20,left:0,bottom:60}}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{fontSize:10}} angle={-35} textAnchor="end" />
                <YAxis domain={[0,100]} tickFormatter={v=>`${v}%`} tick={{fontSize:10}} />
                <Tooltip formatter={(v,n)=>[`${Number(v).toFixed(2)}%`, n==="avance"?"Avance ponderado":"% cumplimiento"]} />
                <Legend />
                <Bar dataKey="avance" name="Avance ponderado" fill="#1e40af" radius={[4,4,0,0]}>
                  {(globalData.dependencias||[]).map((dep,i)=>(
                    <Cell key={i} fill={getSemaforo(dep.avance_ponderado_global).color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ═══ VISTA POR DEPENDENCIA ═══ */}
      {!vistaGlobal && (
        <>
          {/* Filtros */}
          <div style={{ display:"flex", gap:"12px", marginBottom:"20px", flexWrap:"wrap", alignItems:"end" }}>
            <div>
              <label style={{ display:"block", fontWeight:"600", fontSize:"12px", marginBottom:"4px", color:"#374151" }}>Dependencia</label>
              <select value={depSel} onChange={handleDepChange}
                style={{ padding:"9px 14px", borderRadius:"8px", border:"1px solid #d1d5db", fontSize:"13px", background:"white", minWidth:"260px" }}>
                <option value="">-- Selecciona dependencia --</option>
                {dependencias.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display:"block", fontWeight:"600", fontSize:"12px", marginBottom:"4px", color:"#374151" }}>Año</label>
              <select value={anio} onChange={handleAnioChange}
                style={{ padding:"9px 14px", borderRadius:"8px", border:"1px solid #d1d5db", fontSize:"13px", background:"white" }}>
                {AÑOS.map(a=><option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            {depSel && (
              <>
                <button onClick={calcularYGuardar} disabled={calculando}
                  style={{ padding:"9px 18px", background:"#7c3aed", color:"white", border:"none", borderRadius:"8px", cursor:"pointer", fontWeight:"600", fontSize:"13px", opacity:calculando?0.7:1, alignSelf:"flex-end" }}>
                  {calculando ? "Calculando..." : "⚡ Recalcular ponderación"}
                </button>
                {datos?.fichas?.length>0 && (
                  <button onClick={exportarExcel} disabled={exportando}
                    style={{ padding:"9px 18px", background:"#16a34a", color:"white", border:"none", borderRadius:"8px", cursor:"pointer", fontWeight:"600", fontSize:"13px", opacity:exportando?0.7:1, alignSelf:"flex-end" }}>
                    {exportando?"Exportando...":"📊 Excel"}
                  </button>
                )}
              </>
            )}
          </div>

          {/* Estado de carga */}
          {cargando && (
            <div style={{ textAlign:"center", padding:"80px", color:"#6b7280" }}>
              <p style={{ fontSize:"32px" }}>⏳</p>
              <p>Cargando ponderación...</p>
            </div>
          )}

          {/* Sin datos */}
          {!cargando && !datos && depSel && (
            <div style={{ textAlign:"center", padding:"60px", background:"white", borderRadius:"12px", border:"1px solid #e5e7eb", color:"#9ca3af" }}>
              <p style={{ fontSize:"40px", margin:"0 0 12px" }}>📋</p>
              <p style={{ fontWeight:"600", fontSize:"16px" }}>Sin fichas técnicas</p>
              <p style={{ fontSize:"13px" }}>Esta dependencia no tiene fichas técnicas con meta trianual para {anio}.</p>
              <p style={{ fontSize:"12px" }}>Haz clic en "⚡ Recalcular" para intentar calcular la ponderación.</p>
            </div>
          )}

          {/* ═══ RESUMEN CON DATOS ═══ */}
          {!cargando && datos && datos.fichas?.length > 0 && (
            <>
              {/* KPI GLOBAL */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr", gap:"16px", marginBottom:"20px" }}>

                {/* Indicador circular global */}
                <div style={{
                  background:"white", borderRadius:"14px", padding:"20px",
                  border:"1px solid #e5e7eb", display:"flex", flexDirection:"column",
                  alignItems:"center", justifyContent:"center", textAlign:"center"
                }}>
                  <p style={{ fontWeight:"700", fontSize:"13px", color:"#374151", margin:"0 0 10px" }}>
                    Avance Ponderado Global
                  </p>
                  <div style={{
                    width:"140px", height:"140px", borderRadius:"50%",
                    background:`conic-gradient(${getSemaforo(datos.totales?.avance_ponderado_global||0).color} ${datos.totales?.avance_ponderado_global||0}%, #f1f5f9 0%)`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    boxShadow:"0 4px 20px rgba(0,0,0,0.1)"
                  }}>
                    <div style={{ width:"110px", height:"110px", borderRadius:"50%", background:"white", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
                      <p style={{ margin:0, fontSize:"30px", fontWeight:"800", color:getSemaforo(datos.totales?.avance_ponderado_global||0).color }}>
                        {Number(datos.totales?.avance_ponderado_global||0).toFixed(1)}%
                      </p>
                      <p style={{ margin:0, fontSize:"11px", color:"#6b7280" }}>de 100%</p>
                    </div>
                  </div>
                  <div style={{ marginTop:"12px" }}>
                    {(() => {
                      const sem = getSemaforo(datos.totales?.avance_ponderado_global||0)
                      return (
                        <span style={{ background:sem.bg, color:sem.color, padding:"4px 14px", borderRadius:"999px", fontSize:"13px", fontWeight:"700" }}>
                          {sem.emoji} {sem.label}
                        </span>
                      )
                    })()}
                  </div>
                  <div style={{ marginTop:"12px", fontSize:"11px", color:"#6b7280", display:"flex", flexDirection:"column", gap:"2px" }}>
                    <span>{datos.fichas.length} indicador{datos.fichas.length!==1?"es":""}</span>
                    <span>Meta trianual total: <b>{Number(datos.totales?.total_meta_trianual||0).toLocaleString()}</b></span>
                    <span>Suma ponderaciones: <b>{Number(datos.totales?.suma_ponderaciones||0).toFixed(2)}%</b></span>
                  </div>
                </div>

                {/* Gráfica de dona de ponderaciones */}
                <div style={{ background:"white", borderRadius:"14px", padding:"16px", border:"1px solid #e5e7eb" }}>
                  <p style={{ fontWeight:"700", fontSize:"13px", color:"#374151", margin:"0 0 8px" }}>
                    Distribución de ponderaciones (% del total trianual)
                  </p>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={datos.fichas.map((f,i) => ({
                          name: f.nombre_indicador.substring(0,35),
                          value: Number(f.ponderacion||0),
                          avance: Number(f.avance_ponderado||0)
                        }))}
                        cx="40%" cy="50%" innerRadius={50} outerRadius={90}
                        paddingAngle={2} dataKey="value"
                      >
                        {datos.fichas.map((_,i)=>(
                          <Cell key={i} fill={COLORES[i%COLORES.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v,_,p)=>[
                        `Ponderación: ${Number(v).toFixed(2)}% | Avance: ${Number(p.payload.avance).toFixed(2)}%`,
                        p.name
                      ]} />
                      <Legend
                        layout="vertical" align="right" verticalAlign="middle"
                        formatter={(v)=><span style={{fontSize:"10px"}}>{v}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Gráfica de barras comparativa programado vs avance ponderado */}
              <div style={{ background:"white", borderRadius:"12px", padding:"16px", border:"1px solid #e5e7eb", marginBottom:"20px" }}>
                <p style={{ fontWeight:"700", fontSize:"13px", color:"#374151", margin:"0 0 12px" }}>
                  Ponderación vs Avance ponderado por indicador
                </p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={datos.fichas.map(f=>({
                      name: f.nombre_indicador.substring(0,25),
                      ponderacion: Number(f.ponderacion||0),
                      avance_ponderado: Number(f.avance_ponderado||0),
                    }))}
                    margin={{top:10,right:20,left:0,bottom:70}}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{fontSize:9}} angle={-40} textAnchor="end" />
                    <YAxis domain={[0,100]} tickFormatter={v=>`${v}%`} tick={{fontSize:10}} />
                    <Tooltip formatter={(v,n)=>[`${Number(v).toFixed(2)}%`, n==="ponderacion"?"Peso asignado":"Avance ponderado"]} />
                    <Legend formatter={v=>v==="ponderacion"?"Peso (100% total)":"Avance ponderado"} />
                    <Bar dataKey="ponderacion"     name="ponderacion"     fill="#dbeafe" stroke="#1e40af" strokeWidth={1} radius={[4,4,0,0]} />
                    <Bar dataKey="avance_ponderado" name="avance_ponderado" fill="#16a34a" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Tabla detallada de indicadores */}
              <div style={{ background:"white", borderRadius:"12px", border:"1px solid #e5e7eb", overflow:"hidden" }}>
                <div style={{ padding:"14px 16px", borderBottom:"1px solid #e5e7eb", background:"#f8fafc" }}>
                  <p style={{ fontWeight:"700", fontSize:"13px", color:"#374151", margin:0 }}>
                    Detalle por indicador
                  </p>
                </div>
                <div style={{ overflowX:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"12px" }}>
                    <thead>
                      <tr style={{ background:"#1e1e1e" }}>
                        {["#","Indicador","Meta trianual","Peso %","Meta anual","Avance","% Cumpl.","Avance pond.","Semáforo",""].map(h=>(
                          <th key={h} style={{ padding:"10px 10px", color:"white", textAlign: ["Meta trianual","Peso %","Meta anual","Avance","% Cumpl.","Avance pond."].includes(h)?"center":"left", fontWeight:"700", whiteSpace:"nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {datos.fichas.map((f,idx) => {
                        const sem  = getSemaforo(f.porcentaje_cumplimiento)
                        const expandida = fichaExpandida===f.id
                        return (
                          <React.Fragment key={f.id}>
                            <tr style={{ background:idx%2===0?"white":"#f9fafb", borderBottom:"1px solid #f1f5f9" }}>
                              <td style={{ padding:"10px 10px", textAlign:"center", color:"#9ca3af", fontWeight:"700" }}>
                                <div style={{ width:"24px", height:"24px", borderRadius:"50%", background:COLORES[idx%COLORES.length], color:"white", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"10px", fontWeight:"700", margin:"0 auto" }}>
                                  {idx+1}
                                </div>
                              </td>
                              <td style={{ padding:"10px 10px", maxWidth:"220px" }}>
                                <p style={{ margin:"0 0 2px", fontWeight:"600", color:"#1e293b", fontSize:"12px" }}>
                                  {f.nombre_indicador}
                                </p>
                                {f.tipo_indicador && (
                                  <span style={{ background:"#fef9c3", color:"#854d0e", padding:"1px 6px", borderRadius:"4px", fontSize:"9px", fontWeight:"600" }}>
                                    {f.tipo_indicador}
                                  </span>
                                )}
                              </td>
                              <td style={{ padding:"10px 10px", textAlign:"center", fontWeight:"700", color:"#374151" }}>
                                {Number(f.meta_trianual||0).toLocaleString()}
                              </td>
                              <td style={{ padding:"10px 10px", textAlign:"center" }}>
                                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"4px" }}>
                                  <span style={{ fontWeight:"700", color:COLORES[idx%COLORES.length], fontSize:"13px" }}>
                                    {Number(f.ponderacion||0).toFixed(2)}%
                                  </span>
                                  <BarraProgreso pct={Number(f.ponderacion||0)} color={COLORES[idx%COLORES.length]} height={6} />
                                </div>
                              </td>
                              <td style={{ padding:"10px 10px", textAlign:"center" }}>
                                {Number(f.meta_anual||0).toLocaleString()}
                              </td>
                              <td style={{ padding:"10px 10px", textAlign:"center", color:"#16a34a", fontWeight:"700" }}>
                                {Number(f.avance_anual_efectivo||0).toLocaleString()}
                              </td>
                              <td style={{ padding:"10px 10px", textAlign:"center" }}>
                                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"4px" }}>
                                  <span style={{ fontWeight:"700", color:sem.color }}>
                                    {Number(f.porcentaje_cumplimiento||0).toFixed(1)}%
                                  </span>
                                  <BarraProgreso pct={Number(f.porcentaje_cumplimiento||0)} color={sem.color} height={6} />
                                </div>
                              </td>
                              <td style={{ padding:"10px 10px", textAlign:"center" }}>
                                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"4px" }}>
                                  <span style={{ fontWeight:"800", color:sem.color, fontSize:"13px" }}>
                                    {Number(f.avance_ponderado||0).toFixed(2)}%
                                  </span>
                                  <BarraProgreso pct={(Number(f.avance_ponderado||0)/Number(f.ponderacion||1))*100} color={sem.color} height={6} />
                                </div>
                              </td>
                              <td style={{ padding:"10px 10px", textAlign:"center" }}>
                                <span style={{ background:sem.bg, color:sem.color, padding:"3px 8px", borderRadius:"6px", fontSize:"11px", fontWeight:"700" }}>
                                  {sem.emoji} {sem.label}
                                </span>
                              </td>
                              <td style={{ padding:"10px 10px", textAlign:"center" }}>
                                <button onClick={()=>setFichaExpandida(expandida?null:f.id)}
                                  style={{ background:"#f3f4f6", border:"none", borderRadius:"6px", padding:"4px 8px", cursor:"pointer", fontSize:"11px" }}>
                                  {expandida?"▲":"▼"}
                                </button>
                              </td>
                            </tr>

                            {/* Fila expandida con calendarización */}
                            {expandida && (
                              <tr style={{ background:"#fafafa" }}>
                                <td colSpan={10} style={{ padding:"14px 20px", borderBottom:"1px solid #e5e7eb" }}>
                                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"16px" }}>

                                    {/* Datos del indicador */}
                                    <div>
                                      <p style={{ fontWeight:"700", fontSize:"11px", color:"#374151", margin:"0 0 8px" }}>Datos del indicador</p>
                                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px" }}>
                                        {[
                                          ["Eje",f.eje],["Tema",f.tema],["Unidad",f.unidad_medida],
                                          ["Año base",f.anio_base],["Val. mínimo",f.valor_minimo]
                                        ].filter(([,v])=>v).map(([l,v])=>(
                                          <div key={l} style={{ fontSize:"10px" }}>
                                            <span style={{ color:"#6b7280" }}>{l}: </span>
                                            <span style={{ fontWeight:"600", color:"#374151" }}>{v}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Cálculo paso a paso */}
                                    <div>
                                      <p style={{ fontWeight:"700", fontSize:"11px", color:"#374151", margin:"0 0 8px" }}>Cálculo paso a paso</p>
                                      <div style={{ display:"flex", flexDirection:"column", gap:"4px", fontSize:"10px" }}>
                                        <div style={{ background:"#eff6ff", borderRadius:"4px", padding:"4px 8px" }}>
                                          <span style={{ color:"#1e40af" }}>Peso = ({Number(f.meta_trianual||0)} / {Number(datos.totales?.total_meta_trianual||0)}) × 100 = <b>{Number(f.ponderacion||0).toFixed(2)}%</b></span>
                                        </div>
                                        <div style={{ background:"#f0fdf4", borderRadius:"4px", padding:"4px 8px" }}>
                                          <span style={{ color:"#16a34a" }}>% Cumpl. = ({Number(f.avance_anual_efectivo||0)} / {Number(f.meta_anual||0)}) × 100 = <b>{Number(f.porcentaje_cumplimiento||0).toFixed(2)}%</b></span>
                                        </div>
                                        <div style={{ background:"#faf5ff", borderRadius:"4px", padding:"4px 8px" }}>
                                          <span style={{ color:"#7c3aed" }}>Avance pond. = ({Number(f.porcentaje_cumplimiento||0).toFixed(2)}% / 100) × {Number(f.ponderacion||0).toFixed(2)}% = <b>{Number(f.avance_ponderado||0).toFixed(2)}%</b></span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Calendarización mensual */}
                                    {f.calendarizacion && Object.keys(f.calendarizacion).length > 0 && (
                                      <div>
                                        <p style={{ fontWeight:"700", fontSize:"11px", color:"#374151", margin:"0 0 6px" }}>Calendarización mensual</p>
                                        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"4px" }}>
                                          {["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"].map(mes => {
                                            const cal = typeof f.calendarizacion==="string" ? JSON.parse(f.calendarizacion) : f.calendarizacion
                                            const prog = Number(cal[mes]?.programado||0)
                                            const real = Number(cal[mes]?.real||0)
                                            const pct  = prog>0 ? Math.min((real/prog)*100,100) : 0
                                            const sem2 = getSemaforo(pct)
                                            return (
                                              <div key={mes} style={{ background:"white", borderRadius:"4px", padding:"4px", border:"1px solid #e5e7eb", textAlign:"center" }}>
                                                <p style={{ margin:"0 0 2px", fontSize:"8px", color:"#6b7280", textTransform:"capitalize" }}>{mes.substring(0,3)}</p>
                                                <p style={{ margin:0, fontSize:"9px", color:"#1e40af" }}>{prog}</p>
                                                <p style={{ margin:0, fontSize:"9px", color:sem2.color, fontWeight:"700" }}>{real}</p>
                                              </div>
                                            )
                                          })}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        )
                      })}

                      {/* Fila de totales */}
                      <tr style={{ background:"#eff6ff", borderTop:"2px solid #1e40af" }}>
                        <td colSpan={2} style={{ padding:"12px 10px", fontWeight:"800", color:"#1e40af", fontSize:"13px" }}>
                          TOTAL GLOBAL
                        </td>
                        <td style={{ padding:"12px 10px", textAlign:"center", fontWeight:"700", color:"#374151" }}>
                          {Number(datos.totales?.total_meta_trianual||0).toLocaleString()}
                        </td>
                        <td style={{ padding:"12px 10px", textAlign:"center", fontWeight:"800", color:"#1e40af", fontSize:"14px" }}>
                          {Number(datos.totales?.suma_ponderaciones||0).toFixed(2)}%
                        </td>
                        <td style={{ padding:"12px 10px", textAlign:"center", fontWeight:"700" }}>
                          {datos.fichas.reduce((s,f)=>s+Number(f.meta_anual||0),0).toLocaleString()}
                        </td>
                        <td style={{ padding:"12px 10px", textAlign:"center", fontWeight:"700", color:"#16a34a" }}>
                          {datos.fichas.reduce((s,f)=>s+Number(f.avance_anual_efectivo||0),0).toLocaleString()}
                        </td>
                        <td style={{ padding:"12px 10px", textAlign:"center", fontWeight:"800", color:getSemaforo(datos.fichas.reduce((s,f)=>s+Number(f.porcentaje_cumplimiento||0),0)/datos.fichas.length).color, fontSize:"13px" }}>
                          {(datos.fichas.reduce((s,f)=>s+Number(f.porcentaje_cumplimiento||0),0)/datos.fichas.length).toFixed(1)}%
                        </td>
                        <td style={{ padding:"12px 10px", textAlign:"center" }}>
                          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"4px" }}>
                            <span style={{ fontWeight:"800", color:getSemaforo(datos.totales?.avance_ponderado_global||0).color, fontSize:"16px" }}>
                              {Number(datos.totales?.avance_ponderado_global||0).toFixed(2)}%
                            </span>
                            <BarraProgreso pct={Number(datos.totales?.avance_ponderado_global||0)} color={getSemaforo(datos.totales?.avance_ponderado_global||0).color} height={8} />
                          </div>
                        </td>
                        <td style={{ padding:"12px 10px", textAlign:"center" }}>
                          {(() => {
                            const sem = getSemaforo(datos.totales?.avance_ponderado_global||0)
                            return <span style={{ background:sem.bg,color:sem.color,padding:"4px 12px",borderRadius:"8px",fontSize:"12px",fontWeight:"800" }}>{sem.emoji} {sem.label}</span>
                          })()}
                        </td>
                        <td />
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}