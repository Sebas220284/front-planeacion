import React, { useEffect, useState } from "react"

const COLS = [
  { key:"ejercicio",                label:"Ejercicio",                                  w:65  },
  { key:"fecha_inicio_periodo_fmt", label:"Fecha inicio del período",                   w:110 },
  { key:"fecha_termino_periodo_fmt",label:"Fecha término del período",                  w:110 },
  { key:"denominacion_programa",    label:"Denominación del programa evaluado",         w:260 },
  { key:"denominacion_evaluacion",  label:"Denominación de la evaluación y/o encuesta", w:280 },
  { key:"objetivo_general",         label:"Objetivo general de la evaluación o encuesta",w:300},
  { key:"fecha_inicio_eval_fmt",    label:"Fecha inicio de la evaluación",              w:110 },
  { key:"fecha_termino_eval_fmt",   label:"Fecha término de la evaluación",             w:110 },
  { key:"hipervinculos",            label:"Hipervínculo a los resultados",              w:280 },
  { key:"area_responsable",         label:"Área(s) responsable(s)",                     w:260 },
  { key:"fecha_actualizacion_fmt",  label:"Fecha de Actualización",                     w:110 },
  { key:"nota",                     label:"Nota",                                       w:240 },
]

const FORM_VACIO = {
  ejercicio: 2025,
  fecha_inicio_periodo:  "2025-10-01",
  fecha_termino_periodo: "2025-12-31",
  denominacion_programa:    "",
  denominacion_evaluacion:  "",
  objetivo_general:         "",
  fecha_inicio_evaluacion:  "",
  fecha_termino_evaluacion: "",
  hipervinculos: "",
  area_responsable: "Secretaría de Planeación_Dirección de Seguimiento y Evaluación",
  fecha_actualizacion: "2025-12-31",
  nota: "Se publicarán todas las evaluaciones y encuestas realizadas a programas financiados con recursos públicos.",
}

const fmtFecha = (f) => {
  if (!f) return "-"
  const d = new Date(f)
  return `${d.getDate().toString().padStart(2,"0")}/${(d.getMonth()+1).toString().padStart(2,"0")}/${d.getFullYear()}`
}

export default function TransparenciaSeccion40() {
  const [registros, setRegistros]     = useState([])
  const [cargando, setCargando]       = useState(true)
  const [vista, setVista]             = useState("lista")
  const [form, setForm]               = useState(FORM_VACIO)
  const [editando, setEditando]       = useState(null)
  const [enviando, setEnviando]       = useState(false)
  const [exportando, setExportando]   = useState(false)
  const [busqueda, setBusqueda]       = useState("")
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    cargar()
    const token = localStorage.getItem("token")
    if (token) {
      fetch("http://localhost:3000/api/auth/me", {
        headers:{ Authorization:`Bearer ${token}` }
      }).then(r=>r.json()).then(setCurrentUser).catch(()=>{})
    }
  }, [])

  const cargar = async () => {
    setCargando(true)
    try {
      const res  = await fetch("http://localhost:3000/api/transparencia/seccion40")
      const data = await res.json()
      setRegistros(data.map(r => ({
        ...r,
        fecha_inicio_periodo_fmt:  fmtFecha(r.fecha_inicio_periodo),
        fecha_termino_periodo_fmt: fmtFecha(r.fecha_termino_periodo),
        fecha_inicio_eval_fmt:     fmtFecha(r.fecha_inicio_evaluacion),
        fecha_termino_eval_fmt:    fmtFecha(r.fecha_termino_evaluacion),
        fecha_actualizacion_fmt:   fmtFecha(r.fecha_actualizacion),
      })))
    } catch(e) { console.error(e) }
    setCargando(false)
  }

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleGuardar = async () => {
    if (!form.denominacion_programa) {
      alert("La denominación del programa es obligatoria")
      return
    }
    setEnviando(true)
    try {
      const url = editando
        ? `http://localhost:3000/api/transparencia/seccion40/${editando}`
        : "http://localhost:3000/api/transparencia/seccion40"
      await fetch(url, {
        method: editando ? "PUT" : "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ ...form, creado_por: currentUser?.id||null })
      })
      await cargar()
      setForm(FORM_VACIO); setEditando(null); setVista("lista")
      alert(" Registro guardado")
    } catch { alert("Error al guardar") }
    setEnviando(false)
  }

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Eliminar este registro?")) return
    await fetch(`http://localhost:3000/api/transparencia/seccion40/${id}`, { method:"DELETE" })
    setRegistros(prev => prev.filter(r => r.id!==id))
  }

  const abrirEditar = (reg) => {
    const { fecha_inicio_periodo_fmt, fecha_termino_periodo_fmt,
            fecha_inicio_eval_fmt, fecha_termino_eval_fmt,
            fecha_actualizacion_fmt, ...rest } = reg
    setForm({
      ...FORM_VACIO, ...rest,
      fecha_inicio_periodo:     rest.fecha_inicio_periodo?.substring(0,10)     || "2025-10-01",
      fecha_termino_periodo:    rest.fecha_termino_periodo?.substring(0,10)    || "2025-12-31",
      fecha_inicio_evaluacion:  rest.fecha_inicio_evaluacion?.substring(0,10)  || "",
      fecha_termino_evaluacion: rest.fecha_termino_evaluacion?.substring(0,10) || "",
      fecha_actualizacion:      rest.fecha_actualizacion?.substring(0,10)      || "2025-12-31",
    })
    setEditando(reg.id)
    setVista("form")
  }

  const registrosFiltrados = registros.filter(r => {
    const q = busqueda.toLowerCase()
    return !q || Object.values(r).some(v => String(v||"").toLowerCase().includes(q))
  })

  const exportarExcel = async () => {
    setExportando(true)
    try {
      const ExcelJS = (await import("exceljs")).default
      const wb  = new ExcelJS.Workbook()
      const ws  = wb.addWorksheet("Sección 40 - 40LGT_Art_70")

      const hdBg   = { type:"pattern", pattern:"solid", fgColor:{ argb:"FF1F1F1F" } }
      const tbBg   = { type:"pattern", pattern:"solid", fgColor:{ argb:"FF3A3A3A" } }
      const rojoBg = { type:"pattern", pattern:"solid", fgColor:{ argb:"FFC00000" } }
      const hdFont = { bold:true, color:{ argb:"FFFFFFFF" }, size:9 }
      const center = { horizontal:"center", vertical:"middle", wrapText:true }
      const wrap   = { wrapText:true, vertical:"top" }

      ws.columns = COLS.map(c => ({ width: Math.round(c.w/7.2) }))

      ws.getRow(1).height = 6

      ws.mergeCells("A2:D2")
      ws.getCell("A2").value = "TÍTULO"
      ws.getCell("A2").fill  = hdBg; ws.getCell("A2").font = hdFont; ws.getCell("A2").alignment = center

      ws.mergeCells("E2:F2")
      ws.getCell("E2").value = "NOMBRE CORTO"
      ws.getCell("E2").fill  = hdBg; ws.getCell("E2").font = hdFont; ws.getCell("E2").alignment = center

      ws.mergeCells("G2:L2")
      ws.getCell("G2").value = "DESCRIPCIÓN"
      ws.getCell("G2").fill  = hdBg; ws.getCell("G2").font = hdFont; ws.getCell("G2").alignment = center
      ws.getRow(2).height = 16

      ws.mergeCells("A3:D3")
      ws.getCell("A3").value = "Evaluaciones y encuestas a programas financiados con recursos públicos"
      ws.getCell("A3").font  = { size:9 }

      ws.mergeCells("E3:F3")
      ws.getCell("E3").value = "40 LGT_Art_70_Fr_XL"
      ws.getCell("E3").font  = { bold:true, size:9 }

      ws.mergeCells("G3:L3")
      ws.getCell("G3").value = "Se publicarán todas las evaluaciones y encuestas realizadas a programas financiados con recursos públicos"
      ws.getCell("G3").font  = { size:9 }
      ws.getCell("G3").alignment = wrap
      ws.getRow(3).height = 20

      ws.getRow(4).height = 6
      ws.getRow(5).height = 6

      ws.mergeCells("F6:L6")
      ws.getCell("F6").value = "Tabla Campos"
      ws.getCell("F6").fill  = tbBg; ws.getCell("F6").font = hdFont; ws.getCell("F6").alignment = center
      ws.getRow(6).height = 14

      const hdRow = ws.getRow(7)
      COLS.forEach((col, i) => {
        const cell = hdRow.getCell(i+1)
        cell.value = col.label
        cell.fill  = hdBg; cell.font = hdFont; cell.alignment = center
        cell.border = { bottom:{ style:"thin", color:{ argb:"FF888888" } } }
      })
      ws.getRow(7).height = 38

      registrosFiltrados.forEach((reg, idx) => {
        const row = ws.getRow(idx + 8)
        COLS.forEach((col, i) => {
          const cell = row.getCell(i+1)
          const v    = reg[col.key]

          if (col.key==="hipervinculos" && v && String(v).startsWith("http")) {
            cell.value = { text: String(v), hyperlink: String(v) }
            cell.font  = { size:8, color:{ argb:"FF0563C1" }, underline:true }
          } else if (col.key==="ejercicio") {
            cell.value = Number(v||2025)
            cell.font  = { bold:true, size:8, color:{ argb:"FF1C3D6E" } }
          } else {
            cell.value = String(v||"")
            cell.font  = { size:8 }
          }

          cell.fill = idx%2===0
            ? { type:"pattern", pattern:"solid", fgColor:{ argb:"FFFFFFFF" } }
            : { type:"pattern", pattern:"solid", fgColor:{ argb:"FFF5F5F5" } }
          cell.alignment = wrap
        })
        row.height = 48 
      })

      const totalRow = registrosFiltrados.length + 8
      ws.mergeCells(`A${totalRow}:L${totalRow}`)
      const tCell = ws.getRow(totalRow).getCell(1)
      tCell.value = `Total de registros: ${registrosFiltrados.length}`
      tCell.font  = { bold:true, size:9 }
      tCell.fill  = { type:"pattern", pattern:"solid", fgColor:{ argb:"FFE8E8E8" } }
      ws.getRow(totalRow).height = 16

      const buf  = await wb.xlsx.writeBuffer()
      const blob = new Blob([buf],{ type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement("a")
      a.href = url; a.download = `40LGT_Art70_Seccion40_2025.xlsx`; a.click()
      URL.revokeObjectURL(url)
    } catch(e) { console.error(e); alert("Error al exportar Excel") }
    setExportando(false)
  }

  const exportarPDF = async () => {
    setExportando(true)
    try {
      const jsPDF    = (await import("jspdf")).default
      const autoTable = (await import("jspdf-autotable")).default
      const doc = new jsPDF({ orientation:"landscape", unit:"mm", format:"letter" })
      const W   = doc.internal.pageSize.width
      const H   = doc.internal.pageSize.height

      const dibujarEncabezado = () => {
        doc.setFillColor(192,0,0); doc.rect(0,0,W,18,"F")
        doc.setTextColor(255,255,255)
        doc.setFont("helvetica","bold"); doc.setFontSize(10)
        doc.text("40 LGT_Art_70_Fr_XL", W/2, 8, { align:"center" })
        doc.setFont("helvetica","normal"); doc.setFontSize(7.5)
        doc.text("Evaluaciones y encuestas a programas financiados con recursos públicos", W/2, 14, { align:"center" })
      }

      dibujarEncabezado()

      autoTable(doc, {
        startY: 22,
        margin: { left:5, right:5 },
        head: [ COLS.map(c => c.label) ],
        body: registrosFiltrados.map(reg =>
          COLS.map(c => String(reg[c.key]||""))
        ),
        styles: {
          fontSize: 6, cellPadding: 1.8,
          overflow: "linebreak", valign: "top"
        },
        headStyles: {
          fillColor: [30,30,30], textColor: [255,255,255],
          fontStyle: "bold", fontSize: 6.5, halign: "center"
        },
        alternateRowStyles: { fillColor: [248,248,248] },
        columnStyles: {
          0:  { cellWidth:11 },   
          1:  { cellWidth:18 },   
          2:  { cellWidth:18 },  
          3:  { cellWidth:42 },  
          5:  { cellWidth:70 },   
          6:  { cellWidth:18 },   
          7:  { cellWidth:18 },   
          8:  { cellWidth:40 },   
          9:  { cellWidth:38 },  
          10: { cellWidth:18 },   
          11: { cellWidth:32 },  
        },
        didDrawPage: (d) => {
          if (d.pageNumber > 1) dibujarEncabezado()
          doc.setFont("helvetica","normal"); doc.setFontSize(6.5)
          doc.setTextColor(150,150,150)
          doc.text(`Página ${d.pageNumber}`, W-8, H-4, { align:"right" })
          doc.text("Sistema de Planeación Municipal · Transparencia", 8, H-4)
        }
      })

      const finalY = doc.lastAutoTable.finalY + 6
      doc.setFont("helvetica","italic"); doc.setFontSize(7); doc.setTextColor(100,100,100)
      doc.text(`Total: ${registrosFiltrados.length} evaluación(es) registrada(s)`, 8, finalY)

      doc.save(`40LGT_Art70_Seccion40_2025.pdf`)
    } catch(e) { console.error(e); alert("Error al exportar PDF") }
    setExportando(false)
  }

  const inputStyle = {
    width:"100%", padding:"8px 10px", borderRadius:"6px",
    border:"1px solid #d1d5db", fontSize:"13px",
    boxSizing:"border-box", color:"#000", background:"#fff"
  }
  const labelStyle = {
    display:"block", fontWeight:"600", fontSize:"12px",
    marginBottom:"4px", color:"#374151"
  }
  const sectionStyle = {
    background:"#f8fafc", borderRadius:"8px", padding:"16px",
    marginBottom:"16px", border:"1px solid #e5e7eb"
  }

  return (
    <div style={{ padding:"24px", background:"#f8fafc", minHeight:"100vh" }}>

      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:"20px", flexWrap:"wrap", gap:"12px" }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"4px" }}>
            <span style={{ background:"#dc2626", color:"white", fontWeight:"700", fontSize:"11px", padding:"3px 10px", borderRadius:"4px" }}>
              40 LGT_Art_70_Fr_XL
            </span>
            <h2 style={{ margin:0, color:"#1e293b", fontSize:"18px" }}>Sección 40</h2>
          </div>
          <p style={{ margin:0, color:"#6b7280", fontSize:"13px" }}>
            Evaluaciones y encuestas a programas financiados con recursos públicos · {registros.length} registro{registros.length!==1?"s":""}
          </p>
        </div>
        <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
          <button
            onClick={()=>{ setForm(FORM_VACIO); setEditando(null); setVista(vista==="form"?"lista":"form") }}
            style={{ padding:"8px 18px", background:vista==="form"?"#6b7280":"#2563eb", color:"white", border:"none", borderRadius:"8px", cursor:"pointer", fontSize:"13px", fontWeight:"600" }}
          >
            {vista==="form" ? "← Volver" : "+ Nueva evaluación"}
          </button>
          <button onClick={exportarExcel} disabled={exportando||cargando}
            style={{ padding:"8px 18px", background:"#16a34a", color:"white", border:"none", borderRadius:"8px", cursor:"pointer", fontSize:"13px", fontWeight:"600", opacity:exportando?0.7:1 }}>
            {exportando ? "Exportando..." : " Excel"}
          </button>
          <button onClick={exportarPDF} disabled={exportando||cargando}
            style={{ padding:"8px 18px", background:"#dc2626", color:"white", border:"none", borderRadius:"8px", cursor:"pointer", fontSize:"13px", fontWeight:"600", opacity:exportando?0.7:1 }}>
            {exportando ? "Exportando..." : " PDF"}
          </button>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:"12px", marginBottom:"20px" }}>
        {[
          { label:"Total evaluaciones",  value:registros.length,                                         color:"#2563eb", icon:"" },
          { label:"Con hipervínculo",     value:registros.filter(r=>r.hipervinculos).length,              color:"#7c3aed", icon:"" },
          { label:"Ejercicio actual",     value:registros.filter(r=>Number(r.ejercicio)===2025).length,   color:"#d97706", icon:"" },
          { label:"Sin hipervínculo",     value:registros.filter(r=>!r.hipervinculos).length,             color:"#dc2626", icon:"" },
        ].map((kpi,i) => (
          <div key={i} style={{ background:"white", borderRadius:"10px", padding:"14px 16px", border:"1px solid #e5e7eb", boxShadow:"0 1px 3px rgba(0,0,0,0.05)" }}>
            <p style={{ fontSize:"20px", margin:"0 0 4px" }}>{kpi.icon}</p>
            <p style={{ fontSize:"22px", fontWeight:"700", color:kpi.color, margin:"0 0 2px" }}>{kpi.value}</p>
            <p style={{ fontSize:"11px", color:"#6b7280", margin:0 }}>{kpi.label}</p>
          </div>
        ))}
      </div>

      {vista==="form" && (
        <div style={{ background:"white", borderRadius:"12px", padding:"24px", boxShadow:"0 1px 4px rgba(0,0,0,0.08)", maxWidth:"860px", margin:"0 auto 24px" }}>
          <h3 style={{ margin:"0 0 20px", color:"#1e293b" }}>
            {editando ? " Editar evaluación" : " Nueva evaluación / encuesta"}
          </h3>

          <div style={sectionStyle}>
            <p style={{ fontWeight:"700", fontSize:"13px", color:"#374151", margin:"0 0 12px" }}> Período del reporte</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"14px" }}>
              <div>
                <label style={labelStyle}>Ejercicio</label>
                <input name="ejercicio" type="number" value={form.ejercicio} onChange={handleChange} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Fecha inicio del período que se informa</label>
                <input name="fecha_inicio_periodo" type="date" value={form.fecha_inicio_periodo} onChange={handleChange} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Fecha término del período que se informa</label>
                <input name="fecha_termino_periodo" type="date" value={form.fecha_termino_periodo} onChange={handleChange} style={inputStyle} />
              </div>
            </div>
          </div>

          <div style={sectionStyle}>
            <p style={{ fontWeight:"700", fontSize:"13px", color:"#374151", margin:"0 0 12px" }}> Programa evaluado</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px" }}>
              <div style={{ gridColumn:"1/-1" }}>
                <label style={labelStyle}>Denominación del programa evaluado *</label>
                <textarea name="denominacion_programa" value={form.denominacion_programa||""} onChange={handleChange}
                  rows={2} style={{ ...inputStyle, resize:"vertical" }}
                  placeholder="Ej: Fondo de aportaciones para la infraestructura Social Municipal del Ayuntamiento constitucional de Tuxtla Gutiérrez; Chiapas" />
              </div>
              <div style={{ gridColumn:"1/-1" }}>
                <label style={labelStyle}>Denominación de la evaluación y/o encuesta realizada</label>
                <textarea name="denominacion_evaluacion" value={form.denominacion_evaluacion||""} onChange={handleChange}
                  rows={2} style={{ ...inputStyle, resize:"vertical" }}
                  placeholder="Ej: Evaluación específica de Desempeño al Fondo de aportaciones para la infraestructura..." />
              </div>
            </div>
          </div>

          <div style={{ ...sectionStyle, border:"1px solid #6366f1" }}>
            <p style={{ fontWeight:"700", fontSize:"13px", color:"#4338ca", margin:"0 0 12px" }}> Tabla Campos — Datos de la evaluación</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr", gap:"14px" }}>

              <div>
                <label style={labelStyle}>Objetivo general de la evaluación o encuesta</label>
                <textarea name="objetivo_general" value={form.objetivo_general||""} onChange={handleChange}
                  rows={5} style={{ ...inputStyle, resize:"vertical" }}
                  placeholder="Ej: Evaluar de manera específica el desempeño y la orientación de los recursos del Fondo..." />
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px" }}>
                <div>
                  <label style={labelStyle}>Fecha de inicio de la evaluación o encuesta</label>
                  <input name="fecha_inicio_evaluacion" type="date" value={form.fecha_inicio_evaluacion||""} onChange={handleChange} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Fecha de término de la evaluación o encuesta</label>
                  <input name="fecha_termino_evaluacion" type="date" value={form.fecha_termino_evaluacion||""} onChange={handleChange} style={inputStyle} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Hipervínculo a los resultados de la evaluación o encuesta</label>
                <input name="hipervinculos" value={form.hipervinculos||""} onChange={handleChange}
                  placeholder="https://www.tuxtla.gob.mx/..." style={inputStyle} />
                {form.hipervinculos && (
                  <a href={form.hipervinculos} target="_blank" rel="noreferrer"
                    style={{ fontSize:"11px", color:"#2563eb", textDecoration:"underline", marginTop:"4px", display:"block" }}>
                     Verificar enlace
                  </a>
                )}
              </div>
            </div>
          </div>
          <div style={sectionStyle}>
            <p style={{ fontWeight:"700", fontSize:"13px", color:"#374151", margin:"0 0 12px" }}>👤 Responsable y actualización</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px" }}>
              <div style={{ gridColumn:"1/-1" }}>
                <label style={labelStyle}>Área(s) responsable(s) que genera(n), posee(n), publica(n) y actualizan la información</label>
                <input name="area_responsable" value={form.area_responsable||""} onChange={handleChange} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Fecha de actualización</label>
                <input name="fecha_actualizacion" type="date" value={form.fecha_actualizacion||"2025-12-31"} onChange={handleChange} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Nota</label>
                <textarea name="nota" value={form.nota||""} onChange={handleChange}
                  rows={2} style={{ ...inputStyle, resize:"vertical" }} />
              </div>
            </div>
          </div>

          <div style={{ display:"flex", gap:"12px", justifyContent:"flex-end" }}>
            <button onClick={()=>{setVista("lista");setEditando(null);setForm(FORM_VACIO)}}
              style={{ padding:"10px 20px", borderRadius:"8px", border:"1px solid #d1d5db", cursor:"pointer", background:"white", fontSize:"13px" }}>
              Cancelar
            </button>
            <button onClick={handleGuardar} disabled={enviando}
              style={{ padding:"10px 24px", borderRadius:"8px", background:"#dc2626", color:"white", border:"none", cursor:"pointer", fontWeight:"600", fontSize:"13px", opacity:enviando?0.7:1 }}>
              {enviando ? "Guardando..." : editando ? " Actualizar" : " Guardar evaluación"}
            </button>
          </div>
        </div>
      )}

      {vista==="lista" && (
        <>
          <div style={{ display:"flex", gap:"10px", marginBottom:"16px", flexWrap:"wrap" }}>
            <input value={busqueda} onChange={e=>setBusqueda(e.target.value)}
              placeholder="🔍 Buscar en todos los campos..."
              style={{ padding:"8px 12px", borderRadius:"8px", border:"1px solid #e5e7eb", fontSize:"13px", width:"280px" }} />
            {busqueda && (
              <button onClick={()=>setBusqueda("")}
                style={{ padding:"8px 14px", borderRadius:"8px", border:"1px solid #e5e7eb", background:"white", cursor:"pointer", fontSize:"12px", color:"#6b7280" }}>
                ✕ Limpiar
              </button>
            )}
            <span style={{ marginLeft:"auto", fontSize:"12px", color:"#6b7280", alignSelf:"center" }}>
              {registrosFiltrados.length} de {registros.length} registro{registros.length!==1?"s":""}
            </span>
          </div>

          {cargando ? (
            <div style={{ textAlign:"center", padding:"80px", color:"#6b7280" }}>
              <p style={{ fontSize:"32px" }}></p>
              <p>Cargando evaluaciones...</p>
            </div>
          ) : registros.length===0 ? (
            <div style={{ textAlign:"center", padding:"80px", color:"#9ca3af", background:"white", borderRadius:"12px", border:"1px solid #e5e7eb" }}>
              <p style={{ fontSize:"48px", margin:"0 0 12px" }}></p>
              <p style={{ fontWeight:"600", fontSize:"16px" }}>Sin evaluaciones registradas</p>
              <p style={{ fontSize:"13px" }}>Haz clic en "+ Nueva evaluación" para agregar registros.</p>
            </div>
          ) : (
            <div style={{ background:"white", borderRadius:"12px", boxShadow:"0 1px 4px rgba(0,0,0,0.07)", overflow:"hidden", border:"1px solid #e5e7eb" }}>
              <div style={{ overflowX:"auto", maxHeight:"65vh" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"11px", minWidth:"1600px" }}>
                  <thead style={{ position:"sticky", top:0, zIndex:10 }}>
                    <tr style={{ background:"#1e1e1e" }}>
                      <th style={{ padding:"10px 8px", color:"white", textAlign:"center", fontWeight:"700", borderRight:"1px solid #333", whiteSpace:"nowrap" }}>#</th>
                      <th style={{ padding:"10px 8px", color:"white", textAlign:"center", fontWeight:"700", borderRight:"1px solid #333", whiteSpace:"nowrap" }}>Acciones</th>
                      {COLS.map(col => (
                        <th key={col.key} style={{ padding:"10px 10px", color:"white", textAlign:"left", fontWeight:"700", borderRight:"1px solid #333", minWidth:`${col.w}px`, whiteSpace:"nowrap" }}>
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {registrosFiltrados.map((reg, idx) => (
                      <tr key={reg.id} style={{ background:idx%2===0?"white":"#f9fafb", borderBottom:"1px solid #f1f5f9" }}>
                        <td style={{ padding:"8px 10px", textAlign:"center", color:"#9ca3af", fontSize:"11px", borderRight:"1px solid #f1f5f9", fontWeight:"600" }}>{idx+1}</td>
                        <td style={{ padding:"8px 10px", textAlign:"center", borderRight:"1px solid #f1f5f9" }}>
                          <div style={{ display:"flex", gap:"4px", justifyContent:"center" }}>
                            <button onClick={()=>abrirEditar(reg)}
                              style={{ background:"#dbeafe", color:"#1e40af", border:"none", borderRadius:"4px", padding:"5px 10px", cursor:"pointer", fontSize:"11px", fontWeight:"600" }}>
                              
                            </button>
                            <button onClick={()=>handleEliminar(reg.id)}
                              style={{ background:"#fee2e2", color:"#dc2626", border:"none", borderRadius:"4px", padding:"5px 10px", cursor:"pointer", fontSize:"11px" }}>
                              
                            </button>
                          </div>
                        </td>
                        {COLS.map(col => (
                          <td key={col.key} style={{ padding:"8px 10px", verticalAlign:"top", borderRight:"1px solid #f1f5f9", maxWidth:`${col.w}px` }}>
                            {col.key==="hipervinculos" && reg[col.key] ? (
                              <a href={reg[col.key]} target="_blank" rel="noreferrer"
                                style={{ color:"#2563eb", textDecoration:"underline", fontSize:"10px", wordBreak:"break-all" }}>
                               {String(reg[col.key]).length>50 ? String(reg[col.key]).substring(0,50)+"..." : reg[col.key]}
                              </a>
                            ) : col.key==="ejercicio" ? (
                              <span style={{ fontWeight:"700", color:"#2563eb" }}>{reg[col.key]}</span>
                            ) : col.key==="objetivo_general" ? (
                              <span style={{ color:"#374151", fontSize:"10px", lineHeight:"1.5", display:"block" }}>
                                {String(reg[col.key]||"").length>200 ? String(reg[col.key]).substring(0,200)+"..." : reg[col.key]||"-"}
                              </span>
                            ) : col.key==="denominacion_programa" ? (
                              <span style={{ fontWeight:"600", color:"#1e293b", fontSize:"11px" }}>
                                {String(reg[col.key]||"").length>80 ? String(reg[col.key]).substring(0,80)+"..." : reg[col.key]||"-"}
                              </span>
                            ) : (
                              <span style={{ color:"#374151", fontSize:"11px", lineHeight:"1.4" }}>
                                {String(reg[col.key]||"").length>80 ? String(reg[col.key]).substring(0,80)+"..." : reg[col.key]||"-"}
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ padding:"10px 16px", background:"#f8fafc", borderTop:"1px solid #e5e7eb", display:"flex", justifyContent:"space-between", fontSize:"12px", color:"#6b7280" }}>
                <span>Mostrando {registrosFiltrados.length} de {registros.length} evaluaciones</span>
                <span>40 LGT_Art_70_Fr_XL · Transparencia</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}