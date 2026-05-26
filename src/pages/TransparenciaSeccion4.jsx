import React, { useEffect, useState } from "react"

const COLS = [
  { key:"ejercicio",          label:"Ejercicio",              w:60  },
  { key:"fecha_inicio",       label:"Fecha inicio período",   w:100 },
  { key:"titulo",             label:"TÍTULO",                 w:200 },
  { key:"fecha_termino",      label:"Fecha término período",  w:100 },
  { key:"denominacion_area",  label:"Denominación del área",  w:200 },
  { key:"descripcion",        label:"Descripción del objetivo",w:300 },
  { key:"nombre_corto",       label:"Nombre corto",           w:220 },
  { key:"tabla_campo_id",     label:"Tabla Campos",           w:80  },
  { key:"hipervinculos",      label:"Hipervínculo al documento",w:280},
  { key:"area_responsable",   label:"Área responsable",       w:260 },
  { key:"fecha_actualizacion",label:"Fecha de Actualización", w:120 },
  { key:"nota",               label:"Nota",                   w:300 },
]

const CONFIG_DEFAULT = {
  ejercicio: 2025,
  fecha_inicio: "2025-01-01",
  fecha_termino: "2025-12-31",
  titulo: "Objetivos y metas institucionales",
  hipervinculos: "",
  area_responsable: "Secretaría de Planeación_Dirección de Seguimiento y Evaluación",
  fecha_actualizacion: "2025-12-31",
  nota: "Contienen los indicadores de los Programas Operativos Anuales de las dependencias de la Administración Pública Municipal.",
}

export default function TransparenciaSeccion4() {
  const [datos, setDatos] = useState({ config:{}, filas:[] })
  const [config, setConfig] = useState(CONFIG_DEFAULT)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [exportando, setExportando] = useState(false)
  const [modalConfig, setModalConfig] = useState(false)
  const [busqueda, setBusqueda] = useState("")
  const [filtroDep, setFiltroDep] = useState("")

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    setCargando(true)
    try {
      const res = await fetch("http://localhost:3000/api/transparencia/seccion4")
      const data = await res.json()
      setDatos(data)
      if (data.config) {
        setConfig(prev => ({ ...prev, ...data.config }))
      }
    } catch(e) { console.error(e) }
    setCargando(false)
  }

  const guardarConfig = async () => {
    setGuardando(true)
    try {
      await fetch("http://localhost:3000/api/transparencia/config/4", {
        method:"PUT",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify(config)
      })
      await cargar()
      setModalConfig(false)
      alert("✅ Configuración guardada")
    } catch(e) { alert("Error al guardar") }
    setGuardando(false)
  }

  const filasFiltradas = datos.filas.filter(f => {
    const q = busqueda.toLowerCase()
    const matchQ = !q || Object.values(f).some(v => String(v||"").toLowerCase().includes(q))
    const matchDep = !filtroDep || f.denominacion_area === filtroDep
    return matchQ && matchDep
  })

  const dependencias = [...new Set(datos.filas.map(f=>f.denominacion_area))].filter(Boolean).sort()

  const exportarExcel = async () => {
    setExportando(true)
    try {
      const ExcelJS = (await import("exceljs")).default
      const wb = new ExcelJS.Workbook()
      const ws = wb.addWorksheet("Sección 4 - 18LTAIPECHF4")

      const hdBg   = { type:"pattern", pattern:"solid", fgColor:{ argb:"FF1F1F1F" } }
      const hdFont = { bold:true, color:{ argb:"FFFFFFFF" }, size:9 }
      const center = { horizontal:"center", vertical:"middle", wrapText:true }
      const wrap   = { wrapText:true, vertical:"top" }

      ws.mergeCells(`A1:L1`)
      ws.getCell("A1").value = "18LTAIPECHF4 — Objetivos y metas institucionales"
      ws.getCell("A1").font = { bold:true, size:12, color:{ argb:"FFFFFFFF" } }
      ws.getCell("A1").fill = { type:"pattern", pattern:"solid", fgColor:{ argb:"FFC00000" } }
      ws.getCell("A1").alignment = center
      ws.getRow(1).height = 22

      const hdrs = COLS.map(c=>c.label)
      const hdRow = ws.addRow(hdrs)
      hdRow.eachCell(cell => {
        cell.fill = hdBg; cell.font = hdFont; cell.alignment = center
        cell.border = { bottom:{ style:"thin", color:{ argb:"FF888888" } } }
      })
      ws.getRow(2).height = 32

      COLS.forEach((col, i) => {
        ws.getColumn(i+1).width = Math.round(col.w / 7.5)
      })

      filasFiltradas.forEach((fila, idx) => {
        const row = ws.addRow(COLS.map(c => {
          const v = fila[c.key]
          return c.key === "tabla_campo_id" ? Number(v) : String(v||"")
        }))
        const bg = idx%2===0
          ? { type:"pattern", pattern:"solid", fgColor:{ argb:"FFFFFFFF" } }
          : { type:"pattern", pattern:"solid", fgColor:{ argb:"FFF5F5F5" } }
        row.eachCell((cell, colNum) => {
          cell.fill = bg
          cell.alignment = wrap
          cell.font = { size:8 }
          if (COLS[colNum-1]?.key === "hipervinculos" && cell.value) {
            cell.value = { text: String(cell.value), hyperlink: String(cell.value) }
            cell.font = { size:8, color:{ argb:"FF0563C1" }, underline:true }
          }
        })
        ws.getRow(idx+3).height = 24
      })

      const totalRow = ws.addRow([`Total de registros: ${filasFiltradas.length}`, ...Array(11).fill("")])
      ws.mergeCells(`A${filasFiltradas.length+3}:L${filasFiltradas.length+3}`)
      totalRow.getCell(1).font = { bold:true, size:9 }
      totalRow.getCell(1).fill = { type:"pattern", pattern:"solid", fgColor:{ argb:"FFE8E8E8" } }

      const buf = await wb.xlsx.writeBuffer()
      const blob = new Blob([buf], { type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `18LTAIPECHF4_Seccion4_${config.ejercicio}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch(e) { console.error(e); alert("Error al exportar Excel") }
    setExportando(false)
  }

  const exportarPDF = async () => {
    setExportando(true)
    try {
      const jsPDF = (await import("jspdf")).default
      const autoTable = (await import("jspdf-autotable")).default
      const doc = new jsPDF({ orientation:"landscape", unit:"mm", format:"letter" })
      const W = doc.internal.pageSize.width
      const H = doc.internal.pageSize.height

      const dibujarEncabezado = () => {
        doc.setFillColor(192,0,0); doc.rect(0,0,W,14,"F")
        doc.setTextColor(255,255,255); doc.setFont("helvetica","bold"); doc.setFontSize(10)
        doc.text("18LTAIPECHF4 — Objetivos y metas institucionales", W/2, 9, {align:"center"})
        doc.setFont("helvetica","normal"); doc.setFontSize(7)
        doc.text(`Ejercicio ${config.ejercicio} · Período: ${config.fecha_inicio} al ${config.fecha_termino}`, W/2, 13, {align:"center"})
      }

      dibujarEncabezado()

      autoTable(doc, {
        startY: 18,
        margin: { left:5, right:5 },
        head: [COLS.map(c=>c.label)],
        body: filasFiltradas.map(fila => COLS.map(c => String(fila[c.key]||""))),
        styles: { fontSize:5.5, cellPadding:1.5, overflow:"linebreak", valign:"top" },
        headStyles: {
          fillColor:[30,30,30], textColor:[255,255,255],
          fontStyle:"bold", fontSize:6, halign:"center"
        },
        alternateRowStyles: { fillColor:[248,248,248] },
        columnStyles: {
          0:  { cellWidth:12 },  
          1:  { cellWidth:18 },  
          2:  { cellWidth:32 },  
          3:  { cellWidth:18 },  
          4:  { cellWidth:30 }, 
          5:  { cellWidth:45 },
          6:  { cellWidth:35 },  
          7:  { cellWidth:16 },  
          8:  { cellWidth:40 },  
          9:  { cellWidth:38 },  
          10: { cellWidth:18 },  
          11: { cellWidth:45 }, 
        },
        didDrawPage: (d) => {
          if (d.pageNumber > 1) dibujarEncabezado()
          doc.setFont("helvetica","normal"); doc.setFontSize(6.5); doc.setTextColor(150,150,150)
          doc.text(`Página ${d.pageNumber}`, W-8, H-4, {align:"right"})
          doc.text("Sistema de Planeación Municipal — Secretaría de Planeación", 8, H-4)
        }
      })

      const finalY = doc.lastAutoTable.finalY + 6
      doc.setFont("helvetica","italic"); doc.setFontSize(7); doc.setTextColor(100,100,100)
      doc.text(`Total de registros: ${filasFiltradas.length}`, 8, finalY)

      doc.save(`18LTAIPECHF4_Seccion4_${config.ejercicio}.pdf`)
    } catch(e) { console.error(e); alert("Error al exportar PDF") }
    setExportando(false)
  }

  const inputStyle = { width:"100%", padding:"7px 10px", borderRadius:"6px", border:"1px solid #d1d5db", fontSize:"13px", boxSizing:"border-box" }
  const labelStyle = { display:"block", fontWeight:"600", fontSize:"12px", marginBottom:"4px", color:"#374151" }

  return (
    <div style={{ padding:"24px", background:"#f8fafc", minHeight:"100vh" }}>

      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:"20px", flexWrap:"wrap", gap:"12px" }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"4px" }}>
            <span style={{ background:"#dc2626", color:"white", fontWeight:"700", fontSize:"11px", padding:"3px 10px", borderRadius:"4px" }}>
              18LTAIPECHF4
            </span>
            <h2 style={{ margin:0, color:"#1e293b", fontSize:"18px" }}>Sección 4 — Transparencia</h2>
          </div>
          <p style={{ margin:0, color:"#6b7280", fontSize:"13px" }}>
            Objetivos y metas institucionales · Ejercicio {config.ejercicio} ·{" "}
            {datos.filas.length} registros generados
          </p>
        </div>
        <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
          <button onClick={()=>setModalConfig(true)} style={{ padding:"8px 16px", background:"#f3f4f6", border:"1px solid #d1d5db", borderRadius:"8px", cursor:"pointer", fontSize:"13px", fontWeight:"600", color:"#374151" }}>
            Configurar
          </button>
          <button onClick={exportarExcel} disabled={exportando||cargando} style={{ padding:"8px 18px", background:"#16a34a", color:"white", border:"none", borderRadius:"8px", cursor:"pointer", fontSize:"13px", fontWeight:"600", opacity:exportando?0.7:1 }}>
            {exportando?"Exportando...":"📊 Excel"}
          </button>
          <button onClick={exportarPDF} disabled={exportando||cargando} style={{ padding:"8px 18px", background:"#dc2626", color:"white", border:"none", borderRadius:"8px", cursor:"pointer", fontSize:"13px", fontWeight:"600", opacity:exportando?0.7:1 }}>
            {exportando?"Exportando...":"📄 PDF"}
          </button>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:"12px", marginBottom:"20px" }}>
        {[
          { label:"Total registros",    value:datos.filas.length,        color:"#2563eb", icon:"📋" },
          { label:"Dependencias",       value:dependencias.length,        color:"#7c3aed", icon:"🏛️" },
          { label:"Ejercicio",          value:config.ejercicio||2025,     color:"#d97706", icon:"📅" },
          { label:"Registros filtrados",value:filasFiltradas.length,      color:"#16a34a", icon:"🔍" },
        ].map((kpi,i) => (
          <div key={i} style={{ background:"white", borderRadius:"10px", padding:"14px 16px", border:"1px solid #e5e7eb", boxShadow:"0 1px 3px rgba(0,0,0,0.05)" }}>
            <p style={{ fontSize:"18px", margin:"0 0 4px" }}>{kpi.icon}</p>
            <p style={{ fontSize:"22px", fontWeight:"700", color:kpi.color, margin:"0 0 2px" }}>{kpi.value}</p>
            <p style={{ fontSize:"11px", color:"#6b7280", margin:0 }}>{kpi.label}</p>
          </div>
        ))}
      </div>

      <div style={{ display:"flex", gap:"10px", marginBottom:"16px", flexWrap:"wrap" }}>
        <input
          value={busqueda}
          onChange={e=>setBusqueda(e.target.value)}
          placeholder="🔍 Buscar en todos los campos..."
          style={{ ...inputStyle, width:"260px", fontSize:"13px" }}
        />
        <select value={filtroDep} onChange={e=>setFiltroDep(e.target.value)}
          style={{ padding:"8px 12px", borderRadius:"8px", border:"1px solid #e5e7eb", fontSize:"13px", background:"white", maxWidth:"300px" }}>
          <option value="">Todas las dependencias ({datos.filas.length})</option>
          {dependencias.map(d => (
            <option key={d} value={d}>{d} ({datos.filas.filter(f=>f.denominacion_area===d).length})</option>
          ))}
        </select>
        {(busqueda||filtroDep) && (
          <button onClick={()=>{setBusqueda("");setFiltroDep("")}} style={{ padding:"8px 14px", borderRadius:"8px", border:"1px solid #e5e7eb", background:"white", cursor:"pointer", fontSize:"12px", color:"#6b7280" }}>
            ✕ Limpiar
          </button>
        )}
      </div>

      {cargando ? (
        <div style={{ textAlign:"center", padding:"80px", color:"#6b7280" }}>
          <p>Generando reporte desde la base de datos...</p>
        </div>
      ) : (
        <div style={{ background:"white", borderRadius:"12px", boxShadow:"0 1px 4px rgba(0,0,0,0.07)", overflow:"hidden", border:"1px solid #e5e7eb" }}>
          <div style={{ overflowX:"auto", maxHeight:"65vh" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"11px", minWidth:"1600px" }}>
              <thead style={{ position:"sticky", top:0, zIndex:10 }}>
                <tr style={{ background:"#1e1e1e" }}>
                  <th style={{ padding:"8px 6px", color:"white", textAlign:"center", fontWeight:"700", whiteSpace:"nowrap", borderRight:"1px solid #333" }}>#</th>
                  {COLS.map(col => (
                    <th key={col.key} style={{ padding:"8px 8px", color:"white", textAlign:"left", fontWeight:"700", whiteSpace:"nowrap", borderRight:"1px solid #333", minWidth:`${col.w}px` }}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={COLS.length+1} style={{ padding:"60px", textAlign:"center", color:"#9ca3af" }}>
                      No hay registros que coincidan con la búsqueda
                    </td>
                  </tr>
                ) : (
                  filasFiltradas.map((fila, idx) => (
                    <tr key={idx} style={{ background:idx%2===0?"white":"#f9fafb", borderBottom:"1px solid #f1f5f9" }}>
                      <td style={{ padding:"6px 8px", textAlign:"center", color:"#9ca3af", fontSize:"10px", borderRight:"1px solid #f1f5f9", fontWeight:"600" }}>
                        {idx+1}
                      </td>
                      {COLS.map(col => (
                        <td key={col.key} style={{ padding:"6px 8px", verticalAlign:"top", borderRight:"1px solid #f1f5f9", maxWidth:`${col.w}px` }}>
                          {col.key === "hipervinculos" && fila[col.key] ? (
                            <a href={fila[col.key]} target="_blank" rel="noreferrer"
                              style={{ color:"#2563eb", textDecoration:"underline", fontSize:"10px", wordBreak:"break-all" }}>
                              {String(fila[col.key]).length > 60 ? String(fila[col.key]).substring(0,60)+"..." : fila[col.key]}
                            </a>
                          ) : col.key === "tabla_campo_id" ? (
                            <span style={{ fontWeight:"700", color:"#374151" }}>{fila[col.key]}</span>
                          ) : col.key === "ejercicio" ? (
                            <span style={{ fontWeight:"700", color:"#2563eb" }}>{fila[col.key]}</span>
                          ) : col.key === "denominacion_area" ? (
                            <span style={{ fontWeight:"600", color:"#dc2626", fontSize:"10px" }}>{fila[col.key]}</span>
                          ) : (
                            <span style={{ color:"#374151", fontSize:"11px", lineHeight:"1.4" }}>
                              {String(fila[col.key]||"").length > 120
                                ? String(fila[col.key]).substring(0,120)+"..."
                                : fila[col.key] || "-"}
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div style={{ padding:"10px 16px", background:"#f8fafc", borderTop:"1px solid #e5e7eb", display:"flex", justifyContent:"space-between", fontSize:"12px", color:"#6b7280" }}>
            <span>Mostrando {filasFiltradas.length} de {datos.filas.length} registros</span>
            <span>18LTAIPECHF4 · Ejercicio {config.ejercicio}</span>
          </div>
        </div>
      )}

      {modalConfig && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:"20px" }}>
          <div style={{ background:"white", borderRadius:"16px", width:"100%", maxWidth:"600px", maxHeight:"90vh", overflowY:"auto", boxShadow:"0 25px 60px rgba(0,0,0,0.3)" }}>

            <div style={{ padding:"20px 24px", borderBottom:"1px solid #e5e7eb", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <h3 style={{ margin:0, color:"#1e293b" }}>Configuracion de la  Sección 4</h3>
              <button onClick={()=>setModalConfig(false)} style={{ background:"#f3f4f6", border:"none", borderRadius:"8px", padding:"8px 14px", cursor:"pointer", fontWeight:"600" }}>✕</button>
            </div>

            <div style={{ padding:"20px 24px" }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px" }}>

                <div>
                  <label style={labelStyle}>Ejercicio (Año)</label>
                  <input type="number" value={config.ejercicio||2025} onChange={e=>setConfig(p=>({...p,ejercicio:Number(e.target.value)}))} style={inputStyle} />
                </div>

                <div>
                  <label style={labelStyle}>Fecha inicio del período</label>
                  <input type="date" value={config.fecha_inicio||"2025-01-01"} onChange={e=>setConfig(p=>({...p,fecha_inicio:e.target.value}))} style={inputStyle} />
                </div>

                <div>
                  <label style={labelStyle}>Fecha término del período</label>
                  <input type="date" value={config.fecha_termino||"2025-12-31"} onChange={e=>setConfig(p=>({...p,fecha_termino:e.target.value}))} style={inputStyle} />
                </div>

                <div>
                  <label style={labelStyle}>Fecha de Actualización</label>
                  <input type="date" value={config.fecha_actualizacion||"2025-12-31"} onChange={e=>setConfig(p=>({...p,fecha_actualizacion:e.target.value}))} style={inputStyle} />
                </div>

                <div style={{ gridColumn:"1/-1" }}>
                  <label style={labelStyle}>TÍTULO</label>
                  <input value={config.titulo||""} onChange={e=>setConfig(p=>({...p,titulo:e.target.value}))} style={inputStyle} />
                </div>

                <div style={{ gridColumn:"1/-1" }}>
                  <label style={labelStyle}>Hipervínculo al documento (URL del POA)</label>
                  <input value={config.hipervinculos||""} onChange={e=>setConfig(p=>({...p,hipervinculos:e.target.value}))} placeholder="https://..." style={inputStyle} />
                  <p style={{ fontSize:"11px", color:"#6b7280", margin:"4px 0 0" }}>Esta URL aparecerá en todas las filas del reporte.</p>
                </div>

                <div style={{ gridColumn:"1/-1" }}>
                  <label style={labelStyle}>Área(s) responsable(s)</label>
                  <input value={config.area_responsable||""} onChange={e=>setConfig(p=>({...p,area_responsable:e.target.value}))} style={inputStyle} />
                </div>

                <div style={{ gridColumn:"1/-1" }}>
                  <label style={labelStyle}>Nota</label>
                  <textarea value={config.nota||""} onChange={e=>setConfig(p=>({...p,nota:e.target.value}))} rows={3} style={{ ...inputStyle, resize:"vertical" }} />
                </div>
              </div>

              <div style={{ display:"flex", gap:"10px", justifyContent:"flex-end", marginTop:"20px" }}>
                <button onClick={()=>setModalConfig(false)} style={{ padding:"10px 20px", borderRadius:"8px", border:"1px solid #d1d5db", cursor:"pointer", background:"white" }}>
                  Cancelar
                </button>
                <button onClick={guardarConfig} disabled={guardando} style={{ padding:"10px 24px", borderRadius:"8px", background:"#dc2626", color:"white", border:"none", cursor:"pointer", fontWeight:"600", opacity:guardando?0.7:1 }}>
                  {guardando?"Guardando...":" Guardar configuración"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}