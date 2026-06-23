import React, { useEffect, useState } from "react"

export default function ExportarGlobalModal({ onClose }) {
  const [anios, setAnios] = useState([])
  const [anioSel, setAnioSel] = useState(new Date().getFullYear())
  const [datos, setDatos] = useState([])
  const [cargando, setCargando] = useState(false)
  const [exportando, setExportando] = useState(false)

  useEffect(() => {
    fetch("http://localhost:3001/api/reportes/anios-disponibles")
      .then(r=>r.json())
      .then(data => {
        const lista = Array.isArray(data) && data.length ? data : [new Date().getFullYear()]
        setAnios(lista)
        setAnioSel(lista[0])
      })
      .catch(()=>setAnios([new Date().getFullYear()]))
  }, [])

  useEffect(() => { cargarDatos() }, [anioSel])

  const cargarDatos = async () => {
    setCargando(true)
    try {
      const res = await fetch(`http://localhost:3001/api/reportes/programado-ejecutado?anio=${anioSel}`)
      const data = await res.json()
      setDatos(data.filas || [])
    } catch(e) { console.error(e) }
    setCargando(false)
  }

  // ── EXPORTAR EXCEL ──
  const exportarExcel = async () => {
    setExportando(true)
    try {
      const ExcelJS = (await import("exceljs")).default
      const wb = new ExcelJS.Workbook()
      const ws = wb.addWorksheet(`Programado vs Ejecutado ${anioSel}`)

      const COLS = [
        { key:"dependencia",     label:"Dependencia",      w:28 },
        { key:"linea_accion",    label:"Línea de Acción",  w:35 },
        { key:"eje",             label:"Eje",               w:18 },
        { key:"objetivo",        label:"Objetivo",          w:30 },
        { key:"unidad_medida",   label:"Unidad",            w:14 },
        { key:"t1_programado",   label:"T1 Prog.",          w:11 },
        { key:"t1_ejecutado",    label:"T1 Ejec.",          w:11 },
        { key:"t2_programado",   label:"T2 Prog.",          w:11 },
        { key:"t2_ejecutado",    label:"T2 Ejec.",          w:11 },
        { key:"t3_programado",   label:"T3 Prog.",          w:11 },
        { key:"t3_ejecutado",    label:"T3 Ejec.",          w:11 },
        { key:"t4_programado",   label:"T4 Prog.",          w:11 },
        { key:"t4_ejecutado",    label:"T4 Ejec.",          w:11 },
        { key:"total_programado",label:"Total Prog.",       w:13 },
        { key:"total_ejecutado", label:"Total Ejec.",       w:13 },
      ]

      ws.mergeCells(1,1,1,COLS.length)
      ws.getCell(1,1).value = `REPORTE GLOBAL — PROGRAMADO VS EJECUTADO ${anioSel}`
      ws.getCell(1,1).fill = { type:"pattern", pattern:"solid", fgColor:{ argb:"FFC00000" } }
      ws.getCell(1,1).font = { bold:true, color:{ argb:"FFFFFFFF" }, size:12 }
      ws.getCell(1,1).alignment = { horizontal:"center", vertical:"middle" }
      ws.getRow(1).height = 22

      const hdRow = ws.getRow(2)
      COLS.forEach((c,i) => {
        const cell = hdRow.getCell(i+1)
        cell.value = c.label
        cell.fill = { type:"pattern", pattern:"solid", fgColor:{ argb:"FF1F1F1F" } }
        cell.font = { bold:true, color:{ argb:"FFFFFFFF" }, size:9 }
        cell.alignment = { horizontal:"center", vertical:"middle", wrapText:true }
      })
      ws.getRow(2).height = 30
      COLS.forEach((c,i) => { ws.getColumn(i+1).width = c.w })

      datos.forEach((fila, idx) => {
        const row = ws.getRow(idx+3)
        COLS.forEach((c,i) => {
          const cell = row.getCell(i+1)
          const v = fila[c.key]
          cell.value = typeof v === "number" ? v : String(v||"-")
          cell.alignment = { vertical:"top", wrapText: i<4 }
          cell.font = { size:9 }
          cell.fill = { type:"pattern", pattern:"solid", fgColor:{ argb: idx%2===0?"FFFFFFFF":"FFF5F5F5" } }
          if (c.key.includes("ejecutado")) cell.font = { size:9, color:{ argb:"FF065F46" }, bold:c.key.startsWith("total") }
          if (c.key.includes("programado")) cell.font = { size:9, color:{ argb:"FF1E40AF" }, bold:c.key.startsWith("total") }
        })
        row.height = 20
      })

      const buf = await wb.xlsx.writeBuffer()
      const blob = new Blob([buf], { type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url; a.download = `Reporte_Global_${anioSel}.xlsx`; a.click()
      URL.revokeObjectURL(url)
    } catch(e) { console.error(e); alert("Error al exportar Excel") }
    setExportando(false)
  }

  // ── EXPORTAR PDF ──
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
        doc.setTextColor(255,255,255); doc.setFont("helvetica","bold"); doc.setFontSize(11)
        doc.text(`Reporte Global — Programado vs Ejecutado ${anioSel}`, W/2, 9, {align:"center"})
      }
      dibujarEncabezado()

      autoTable(doc, {
        startY: 18,
        margin: { left:5, right:5 },
        head: [["Dependencia","Línea de Acción","Unidad","T1 P/E","T2 P/E","T3 P/E","T4 P/E","Total P/E"]],
        body: datos.map(f => [
          f.dependencia,
          f.linea_accion,
          f.unidad_medida || "-",
          `${f.t1_programado}/${f.t1_ejecutado}`,
          `${f.t2_programado}/${f.t2_ejecutado}`,
          `${f.t3_programado}/${f.t3_ejecutado}`,
          `${f.t4_programado}/${f.t4_ejecutado}`,
          `${f.total_programado}/${f.total_ejecutado}`,
        ]),
        styles: { fontSize:7, cellPadding:1.8, overflow:"linebreak" },
        headStyles: { fillColor:[30,30,30], textColor:[255,255,255], fontStyle:"bold", fontSize:7.5, halign:"center" },
        alternateRowStyles: { fillColor:[248,248,248] },
        columnStyles: {
          0:{cellWidth:38}, 1:{cellWidth:60}, 2:{cellWidth:20},
          3:{cellWidth:22,halign:"center"}, 4:{cellWidth:22,halign:"center"},
          5:{cellWidth:22,halign:"center"}, 6:{cellWidth:22,halign:"center"},
          7:{cellWidth:25,halign:"center", fontStyle:"bold"},
        },
        didDrawPage: (d) => {
          if (d.pageNumber>1) dibujarEncabezado()
          doc.setFont("helvetica","normal"); doc.setFontSize(7); doc.setTextColor(150,150,150)
          doc.text(`Página ${d.pageNumber}`, W-8, H-4, {align:"right"})
        }
      })

      doc.setFont("helvetica","italic"); doc.setFontSize(7.5); doc.setTextColor(80,80,80)
      doc.text("P = Programado · E = Ejecutado", 8, doc.lastAutoTable.finalY + 6)

      doc.save(`Reporte_Global_${anioSel}.pdf`)
    } catch(e) { console.error(e); alert("Error al exportar PDF") }
    setExportando(false)
  }

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:"20px" }}>
      <div style={{ background:"white", borderRadius:"16px", width:"100%", maxWidth:"720px", maxHeight:"85vh", display:"flex", flexDirection:"column", boxShadow:"0 25px 60px rgba(0,0,0,0.3)" }}>

        <div style={{ padding:"20px 24px", borderBottom:"1px solid #e5e7eb", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <h3 style={{ margin:"0 0 4px", color:"#1e293b" }}>📊 Exportar Reporte Global</h3>
            <p style={{ margin:0, fontSize:"12px", color:"#6b7280" }}>Programado vs Ejecutado de todas las dependencias</p>
          </div>
          <button onClick={onClose} style={{ background:"#f3f4f6", border:"none", borderRadius:"8px", padding:"8px 16px", cursor:"pointer", fontWeight:"600" }}>✕ Cerrar</button>
        </div>

        <div style={{ padding:"20px 24px", flex:1, overflowY:"auto" }}>
          <div style={{ display:"flex", gap:"12px", alignItems:"center", marginBottom:"16px" }}>
            <label style={{ fontWeight:"600", fontSize:"13px", color:"#374151" }}>Filtrar por año:</label>
            <select value={anioSel} onChange={e=>setAnioSel(Number(e.target.value))}
              style={{ padding:"8px 14px", borderRadius:"8px", border:"1px solid #d1d5db", fontSize:"13px" }}>
              {anios.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <span style={{ marginLeft:"auto", fontSize:"12px", color:"#6b7280" }}>
              {cargando ? "Cargando..." : `${datos.length} línea(s) de acción encontradas`}
            </span>
          </div>

          {cargando ? (
            <div style={{ textAlign:"center", padding:"60px", color:"#6b7280" }}>⏳ Cargando datos...</div>
          ) : datos.length === 0 ? (
            <div style={{ textAlign:"center", padding:"60px", color:"#9ca3af" }}>
              <p style={{ fontSize:"40px", margin:"0 0 10px" }}>📭</p>
              <p>Sin datos para el año {anioSel}</p>
            </div>
          ) : (
            <div style={{ border:"1px solid #e5e7eb", borderRadius:"10px", overflow:"hidden" }}>
              <div style={{ overflowX:"auto", maxHeight:"320px" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"11px" }}>
                  <thead style={{ position:"sticky", top:0 }}>
                    <tr style={{ background:"#1e1e1e" }}>
                      {["Dependencia","Línea de Acción","Unidad","T1","T2","T3","T4","Total"].map(h=>(
                        <th key={h} style={{ padding:"8px", color:"white", textAlign:"left", fontWeight:"700", whiteSpace:"nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {datos.slice(0,50).map((f,i)=>(
                      <tr key={i} style={{ background:i%2===0?"white":"#f9fafb" }}>
                        <td style={{ padding:"6px 8px", color:"#dc2626", fontWeight:"600", fontSize:"10px" }}>{f.dependencia}</td>
                        <td style={{ padding:"6px 8px" }}>{f.linea_accion}</td>
                        <td style={{ padding:"6px 8px", textAlign:"center" }}>{f.unidad_medida||"-"}</td>
                        {[1,2,3,4].map(t=>(
                          <td key={t} style={{ padding:"6px 8px", textAlign:"center", whiteSpace:"nowrap" }}>
                            <span style={{ color:"#1e40af" }}>{f[`t${t}_programado`]}</span>
                            <span style={{ color:"#9ca3af" }}> / </span>
                            <span style={{ color:"#16a34a" }}>{f[`t${t}_ejecutado`]}</span>
                          </td>
                        ))}
                        <td style={{ padding:"6px 8px", textAlign:"center", fontWeight:"700" }}>
                          <span style={{ color:"#1e40af" }}>{f.total_programado}</span>
                          <span style={{ color:"#9ca3af" }}> / </span>
                          <span style={{ color:"#16a34a" }}>{f.total_ejecutado}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {datos.length > 50 && (
                <p style={{ textAlign:"center", fontSize:"11px", color:"#9ca3af", padding:"8px" }}>
                  Mostrando 50 de {datos.length} registros (el archivo exportado incluye todos)
                </p>
              )}
            </div>
          )}
        </div>

        <div style={{ padding:"16px 24px", borderTop:"1px solid #e5e7eb", display:"flex", gap:"10px", justifyContent:"flex-end" }}>
          <button onClick={exportarExcel} disabled={exportando || datos.length===0}
            style={{ padding:"10px 22px", background:"#16a34a", color:"white", border:"none", borderRadius:"8px", cursor:"pointer", fontWeight:"600", fontSize:"13px", opacity:(exportando||datos.length===0)?0.6:1 }}>
            {exportando?"Exportando...":"📊 Exportar Excel"}
          </button>
          <button onClick={exportarPDF} disabled={exportando || datos.length===0}
            style={{ padding:"10px 22px", background:"#dc2626", color:"white", border:"none", borderRadius:"8px", cursor:"pointer", fontWeight:"600", fontSize:"13px", opacity:(exportando||datos.length===0)?0.6:1 }}>
            {exportando?"Exportando...":"📄 Exportar PDF"}
          </button>
        </div>
      </div>
    </div>
  )
}