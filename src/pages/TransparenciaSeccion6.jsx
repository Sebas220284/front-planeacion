import React, { useEffect, useState } from "react"

const DIMENSIONES = ["Gestión","Desempeño","Eficiencia","Eficacia","Calidad","Economía"]
const UNIDADES_MEDIDA = [
  "documento","porcentaje","capacitación","actualización","sistema",
  "pláticas","evento","convenio","quejas y denuncias","cursos","campañas",
  "recomendaciones","acciones","programas","inspecciones","opiniones",
  "solicitudes","propuestas","encuestas","constancia","reuniones","informes"
]
const FRECUENCIAS = ["Trimestral","Mensual","Bimestral","Semestral","Anual"]
const SENTIDOS = ["Ascendente","Descendente","Sin sentido"]

const COLS = [
  { key:"ejercicio",             label:"Ejercicio",                            w:60  },
  { key:"fecha_inicio_fmt",      label:"Fecha inicio período",                 w:100 },
  { key:"fecha_termino_fmt",     label:"Fecha término período",                w:100 },
  { key:"nombre_programa",       label:"Nombre del programa o concepto",       w:200 },
  { key:"objetivo_institucional",label:"Objetivo institucional",               w:260 },
  { key:"nombre_indicador",      label:"Nombre(s) del(os) indicador(es)",      w:220 },
  { key:"dimension",             label:"Dimensión(es) a medir",                w:100 },
  { key:"definicion_indicador",  label:"Definición del indicador",             w:220 },
  { key:"metodo_calculo",        label:"Método de cálculo con variables",      w:220 },
  { key:"unidad_medida",         label:"Unidad de medida",                     w:120 },
  { key:"frecuencia_medicion",   label:"Frecuencia de medición",               w:100 },
  { key:"linea_base",            label:"Línea base",                           w:70  },
  { key:"metas_programadas",     label:"Metas programadas",                    w:90  },
  { key:"metas_ajustadas",       label:"Metas ajustadas en su caso",           w:90  },
  { key:"avance_metas",          label:"Avance de metas",                      w:90  },
  { key:"sentido_indicador",     label:"Sentido del indicador (catálogo)",     w:120 },
  { key:"fuente_informacion",    label:"Fuente de información",                w:220 },
  { key:"area_responsable",      label:"Área(s) responsable(s)",               w:260 },
  { key:"fecha_actualizacion_fmt",label:"Fecha de Actualización",              w:120 },
  { key:"nota",                  label:"Nota",                                 w:240 },
]

const FORM_VACIO = {
  ejercicio:2025, fecha_inicio:"2025-10-01", fecha_termino:"2025-12-31",
  nombre_programa:"Programa Operativo Anual",
  objetivo_institucional:"", nombre_indicador:"", dimension:"Gestión",
  definicion_indicador:"", metodo_calculo:"", unidad_medida:"documento",
  frecuencia_medicion:"Trimestral", linea_base:"ND",
  metas_programadas:0, metas_ajustadas:0, avance_metas:0,
  sentido_indicador:"Ascendente",
  fuente_informacion:"Programa Operativo Anual",
  area_responsable:"Secretaría de Planeación_Dirección de Seguimiento y Evaluación",
  fecha_actualizacion:"2025-12-31",
  nota:"Contienen los indicadores de los Programas Operativos Anuales de las dependencias de la Administración Pública Municipal."
}

const fmtFecha = (f) => {
  if (!f) return "-"
  const d = new Date(f)
  return `${d.getDate().toString().padStart(2,"0")}/${(d.getMonth()+1).toString().padStart(2,"0")}/${d.getFullYear()}`
}

export default function TransparenciaSeccion6() {
  const [registros, setRegistros] = useState([])
  const [cargando, setCargando] = useState(true)
  const [vista, setVista] = useState("lista")
  const [form, setForm] = useState(FORM_VACIO)
  const [editando, setEditando] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [exportando, setExportando] = useState(false)
  const [busqueda, setBusqueda] = useState("")
  const [filtroDim, setFiltroDim] = useState("")
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    cargar()
    const token = localStorage.getItem("token")
    if (token) {
      fetch("http://localhost:3100/api/auth/me", { headers:{ Authorization:`Bearer ${token}` } })
        .then(r=>r.json()).then(setCurrentUser).catch(()=>{})
    }
  }, [])

  const cargar = async () => {
    setCargando(true)
    try {
      const res = await fetch("http://localhost:3100/api/transparencia/seccion6")
      const data = await res.json()
      setRegistros(data.map(r => ({
        ...r,
        fecha_inicio_fmt:        fmtFecha(r.fecha_inicio),
        fecha_termino_fmt:       fmtFecha(r.fecha_termino),
        fecha_actualizacion_fmt: fmtFecha(r.fecha_actualizacion),
      })))
    } catch(e) { console.error(e) }
    setCargando(false)
  }

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleGuardar = async () => {
    if (!form.nombre_indicador) { alert("El nombre del indicador es obligatorio"); return }
    setEnviando(true)
    try {
      const url = editando
        ? `http://localhost:3100/api/transparencia/seccion6/${editando}`
        : "http://localhost:3100/api/transparencia/seccion6"
      await fetch(url, {
        method: editando?"PUT":"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ ...form, creado_por: currentUser?.id||null })
      })
      await cargar()
      setForm(FORM_VACIO); setEditando(null); setVista("lista")
      alert("Registro guardado")
    } catch { alert("Error al guardar") }
    setEnviando(false)
  }

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Eliminar este registro?")) return
    await fetch(`http://localhost:3100/api/transparencia/seccion6/${id}`, { method:"DELETE" })
    setRegistros(prev => prev.filter(r => r.id!==id))
  }

  const abrirEditar = (reg) => {
    const { fecha_inicio_fmt, fecha_termino_fmt, fecha_actualizacion_fmt, ...rest } = reg
    setForm({
      ...FORM_VACIO, ...rest,
      fecha_inicio:        rest.fecha_inicio?.substring(0,10)        || "2025-10-01",
      fecha_termino:       rest.fecha_termino?.substring(0,10)       || "2025-12-31",
      fecha_actualizacion: rest.fecha_actualizacion?.substring(0,10) || "2025-12-31",
    })
    setEditando(reg.id)
    setVista("form")
  }

  const registrosFiltrados = registros.filter(r => {
    const q = busqueda.toLowerCase()
    const matchQ = !q || Object.values(r).some(v => String(v||"").toLowerCase().includes(q))
    const matchD = !filtroDim || r.dimension===filtroDim
    return matchQ && matchD
  })

  const exportarExcel = async () => {
    setExportando(true)
    try {
      const ExcelJS = (await import("exceljs")).default
      const wb = new ExcelJS.Workbook()
      const ws = wb.addWorksheet("Sección 6 - 18LTAIPECHF6")

      const hdBg   = { type:"pattern", pattern:"solid", fgColor:{ argb:"FF1F1F1F" } }
      const tbBg   = { type:"pattern", pattern:"solid", fgColor:{ argb:"FF3A3A3A" } }
      const hdFont = { bold:true, color:{ argb:"FFFFFFFF" }, size:9 }
      const center = { horizontal:"center", vertical:"middle", wrapText:true }
      const wrap   = { wrapText:true, vertical:"top" }

      ws.mergeCells("A1:D1")
      ws.getCell("A1").value = "TÍTULO"
      ws.getCell("A1").fill = hdBg; ws.getCell("A1").font = hdFont; ws.getCell("A1").alignment = center

      ws.mergeCells("E1:J1")
      ws.getCell("E1").value = "NOMBRE CORTO"
      ws.getCell("E1").fill = hdBg; ws.getCell("E1").font = hdFont; ws.getCell("E1").alignment = center

      ws.mergeCells("K1:T1")
      ws.getCell("K1").value = "DESCRIPCIÓN"
      ws.getCell("K1").fill = hdBg; ws.getCell("K1").font = hdFont; ws.getCell("K1").alignment = center
      ws.getRow(1).height = 18

      ws.mergeCells("A2:D2")
      ws.getCell("A2").value = "Indicadores de resultados"
      ws.getCell("A2").font = { size:10 }

      ws.mergeCells("E2:J2")
      ws.getCell("E2").value = "18LTAIPECHF6"
      ws.getCell("E2").font = { bold:true, size:10 }

      ws.mergeCells("K2:T2")
      ws.getCell("K2").value = "Indicadores de desempeño de sus objetivos institucionales"
      ws.getRow(2).height = 16

      for(let i=3;i<=6;i++) ws.getRow(i).height = 8

      ws.mergeCells("H6:T6")
      ws.getCell("H6").value = "Tabla Campos"
      ws.getCell("H6").fill = tbBg; ws.getCell("H6").font = hdFont; ws.getCell("H6").alignment = center
      ws.getRow(6).height = 14

      const hdRow = ws.getRow(7)
      COLS.forEach((col, i) => {
        const cell = hdRow.getCell(i+1)
        cell.value = col.label; cell.fill = hdBg; cell.font = hdFont; cell.alignment = center
        cell.border = { bottom:{ style:"thin", color:{ argb:"FF888888" } } }
      })
      ws.getRow(7).height = 40

      COLS.forEach((col, i) => { ws.getColumn(i+1).width = Math.round(col.w/7.5) })

      registrosFiltrados.forEach((reg, idx) => {
        const rowNum = idx + 8
        const row = ws.getRow(rowNum)
        COLS.forEach((col, i) => {
          const cell = row.getCell(i+1)
          const v = reg[col.key]
          if (["metas_programadas","metas_ajustadas","avance_metas"].includes(col.key)) cell.value = Number(v||0)
          else if (col.key==="ejercicio") cell.value = Number(v||2025)
          else cell.value = String(v||"")

          cell.fill = idx%2===0
            ? { type:"pattern", pattern:"solid", fgColor:{ argb:"FFFFFFFF" } }
            : { type:"pattern", pattern:"solid", fgColor:{ argb:"FFF5F5F5" } }
          cell.alignment = wrap
          cell.font = { size:8 }

          if (col.key==="sentido_indicador") {
            cell.font = { size:8, bold:true, color:{ argb: v==="Ascendente"?"FF1A5C1A":"FFA00000" } }
          }
          if (col.key==="dimension") {
            cell.font = { size:8, bold:true, color:{ argb:"FF1C3D6E" } }
          }
          if (col.key==="nombre_programa") {
            cell.font = { size:8, italic:true, color:{ argb:"FF555555" } }
          }
        })
        row.height = 22
      })

      const totalRow = registrosFiltrados.length + 8
      ws.mergeCells(`A${totalRow}:T${totalRow}`)
      ws.getRow(totalRow).getCell(1).value = `Total de registros: ${registrosFiltrados.length}`
      ws.getRow(totalRow).getCell(1).font = { bold:true, size:9 }
      ws.getRow(totalRow).getCell(1).fill = { type:"pattern", pattern:"solid", fgColor:{ argb:"FFE8E8E8" } }
      ws.getRow(totalRow).height = 16

      const buf = await wb.xlsx.writeBuffer()
      const blob = new Blob([buf],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"})
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href=url; a.download=`18LTAIPECHF6_Seccion6_2025.xlsx`; a.click()
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
        doc.text("18LTAIPECHF6 — Indicadores de resultados", W/2, 9, {align:"center"})
        doc.setFont("helvetica","normal"); doc.setFontSize(7)
        doc.text("Sección 6 · Sistema de Planeación Municipal", W/2, 13, {align:"center"})
      }

      dibujarEncabezado()

      autoTable(doc, {
        startY: 18,
        margin: { left:4, right:4 },
        head: [COLS.map(c => c.label)],
        body: registrosFiltrados.map(reg =>
          COLS.map(c => {
            const v = reg[c.key]
            if (["metas_programadas","metas_ajustadas","avance_metas"].includes(c.key)) return String(Number(v||0))
            return String(v||"")
          })
        ),
        styles: { fontSize:4.8, cellPadding:1.2, overflow:"linebreak", valign:"top" },
        headStyles: { fillColor:[30,30,30], textColor:[255,255,255], fontStyle:"bold", fontSize:5, halign:"center" },
        alternateRowStyles: { fillColor:[248,248,248] },
        columnStyles: {
          0: {cellWidth:9},  1: {cellWidth:15}, 2: {cellWidth:15},
          3: {cellWidth:26}, 4: {cellWidth:28}, 5: {cellWidth:26},
          6: {cellWidth:14}, 7: {cellWidth:26}, 8: {cellWidth:26},
          9: {cellWidth:16}, 10:{cellWidth:15}, 11:{cellWidth:10},
          12:{cellWidth:12}, 13:{cellWidth:12}, 14:{cellWidth:12},
          15:{cellWidth:17}, 16:{cellWidth:28}, 17:{cellWidth:32},
          18:{cellWidth:15}, 19:{cellWidth:32},
        },
        didDrawPage: (d) => {
          if (d.pageNumber>1) dibujarEncabezado()
          doc.setFont("helvetica","normal"); doc.setFontSize(6.5); doc.setTextColor(150,150,150)
          doc.text(`Página ${d.pageNumber}`, W-8, H-4, {align:"right"})
          doc.text("Sistema de Planeación Municipal", 8, H-4)
        }
      })

      doc.save(`18LTAIPECHF6_Seccion6_2025.pdf`)
    } catch(e) { console.error(e); alert("Error al exportar PDF") }
    setExportando(false)
  }

  const inputStyle = { width:"100%", padding:"7px 10px", borderRadius:"6px", border:"1px solid #d1d5db", fontSize:"13px", boxSizing:"border-box", color:"#000", background:"#fff" }
  const labelStyle = { display:"block", fontWeight:"600", fontSize:"12px", marginBottom:"4px", color:"#374151" }
  const sectionStyle = { background:"#f8fafc", borderRadius:"8px", padding:"16px", marginBottom:"16px", border:"1px solid #e5e7eb" }

  const SelectCat = ({ name, value, options, label }) => (
    <div>
      <label style={labelStyle}>{label}</label>
      <select name={name} value={value||""} onChange={handleChange} style={{ ...inputStyle, cursor:"pointer" }}>
        <option value="">-- Selecciona --</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )

  return (
    <div style={{ padding:"24px", background:"#f8fafc", minHeight:"100vh" }}>

      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:"20px", flexWrap:"wrap", gap:"12px" }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"4px" }}>
            <span style={{ background:"#dc2626", color:"white", fontWeight:"700", fontSize:"11px", padding:"3px 10px", borderRadius:"4px" }}>18LTAIPECHF6</span>
            <h2 style={{ margin:0, color:"#1e293b", fontSize:"18px" }}>Sección 6 — Indicadores de resultados</h2>
          </div>
          <p style={{ margin:0, color:"#6b7280", fontSize:"13px" }}>
            {registros.length} registros · Indicadores de desempeño institucional
          </p>
        </div>
        <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
          <button onClick={()=>{ setForm(FORM_VACIO); setEditando(null); setVista(vista==="form"?"lista":"form") }}
            style={{ padding:"8px 18px", background:vista==="form"?"#6b7280":"#2563eb", color:"white", border:"none", borderRadius:"8px", cursor:"pointer", fontSize:"13px", fontWeight:"600" }}>
            {vista==="form"?"← Volver":"+ Nuevo registro"}
          </button>
          <button onClick={exportarExcel} disabled={exportando||cargando}
            style={{ padding:"8px 18px", background:"#16a34a", color:"white", border:"none", borderRadius:"8px", cursor:"pointer", fontSize:"13px", fontWeight:"600", opacity:exportando?0.7:1 }}>
            {exportando?"Exportando...":" Excel"}
          </button>
          <button onClick={exportarPDF} disabled={exportando||cargando}
            style={{ padding:"8px 18px", background:"#dc2626", color:"white", border:"none", borderRadius:"8px", cursor:"pointer", fontSize:"13px", fontWeight:"600", opacity:exportando?0.7:1 }}>
            {exportando?"Exportando...":" PDF"}
          </button>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:"12px", marginBottom:"20px" }}>
        {[
          { label:"Total registros",  value:registros.length,                                    color:"#2563eb", icon:"" },
          { label:"Con avance",       value:registros.filter(r=>Number(r.avance_metas)>0).length, color:"#16a34a", icon:"" },
          { label:"Sin avance",       value:registros.filter(r=>Number(r.avance_metas)===0).length,color:"#d97706",icon:"" },
          { label:"Ascendentes",      value:registros.filter(r=>r.sentido_indicador==="Ascendente").length,color:"#7c3aed",icon:""},
        ].map((kpi,i) => (
          <div key={i} style={{ background:"white", borderRadius:"10px", padding:"14px 16px", border:"1px solid #e5e7eb" }}>
            <p style={{ fontSize:"18px", margin:"0 0 4px" }}>{kpi.icon}</p>
            <p style={{ fontSize:"22px", fontWeight:"700", color:kpi.color, margin:"0 0 2px" }}>{kpi.value}</p>
            <p style={{ fontSize:"11px", color:"#6b7280", margin:0 }}>{kpi.label}</p>
          </div>
        ))}
      </div>

      {vista==="form" && (
        <div style={{ background:"white", borderRadius:"12px", padding:"24px", boxShadow:"0 1px 4px rgba(0,0,0,0.08)", maxWidth:"920px", margin:"0 auto 24px" }}>
          <h3 style={{ margin:"0 0 20px", color:"#1e293b" }}>{editando?"✏️ Editar registro":"✨ Nuevo registro — Sección 6"}</h3>

          <div style={sectionStyle}>
            <p style={{ fontWeight:"700", fontSize:"13px", color:"#374151", margin:"0 0 12px" }}>Período del reporte</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"14px" }}>
              <div>
                <label style={labelStyle}>Ejercicio</label>
                <input name="ejercicio" type="number" value={form.ejercicio} onChange={handleChange} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Fecha inicio del período</label>
                <input name="fecha_inicio" type="date" value={form.fecha_inicio} onChange={handleChange} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Fecha término del período</label>
                <input name="fecha_termino" type="date" value={form.fecha_termino} onChange={handleChange} style={inputStyle} />
              </div>
            </div>
          </div>

          <div style={sectionStyle}>
            <p style={{ fontWeight:"700", fontSize:"13px", color:"#374151", margin:"0 0 12px" }}>Programa y Objetivo</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px" }}>
              <div style={{ gridColumn:"1/-1" }}>
                <label style={labelStyle}>Nombre del programa o concepto al que corresponde el indicador</label>
                <input name="nombre_programa" value={form.nombre_programa||""} onChange={handleChange}
                  placeholder="Ej: Programa Operativo Anual" style={inputStyle} />
              </div>
              <div style={{ gridColumn:"1/-1" }}>
                <label style={labelStyle}>Objetivo institucional (redactado con perspectiva de género)</label>
                <textarea name="objetivo_institucional" value={form.objetivo_institucional||""} onChange={handleChange}
                  rows={3} style={{ ...inputStyle, resize:"vertical" }}
                  placeholder="Ej: Mejorar la atención ciudadana de los trámites y/o servicios..." />
              </div>
              <div style={{ gridColumn:"1/-1" }}>
                <label style={labelStyle}>Nombre(s) del(os) indicador(es) *</label>
                <input name="nombre_indicador" value={form.nombre_indicador||""} onChange={handleChange}
                  placeholder="Ej: Establecer la Agenda de Simplificación..." style={inputStyle} />
              </div>
            </div>
          </div>

          <div style={{ ...sectionStyle, border:"1px solid #6366f1" }}>
            <p style={{ fontWeight:"700", fontSize:"13px", color:"#4338ca", margin:"0 0 12px" }}>Tabla Campos</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"14px" }}>

              <SelectCat name="dimension" value={form.dimension} options={DIMENSIONES} label="Dimensión(es) a medir" />

              <div>
                <label style={labelStyle}>Definición del indicador</label>
                <input name="definicion_indicador" value={form.definicion_indicador||""} onChange={handleChange} style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Método de cálculo con variables de la fórmula</label>
                <input name="metodo_calculo" value={form.metodo_calculo||""} onChange={handleChange}
                  placeholder="Ej: (Número de documentos elaborados / Núm...)" style={inputStyle} />
              </div>

              <SelectCat name="unidad_medida" value={form.unidad_medida} options={UNIDADES_MEDIDA} label="Unidad de medida" />

              <SelectCat name="frecuencia_medicion" value={form.frecuencia_medicion} options={FRECUENCIAS} label="Frecuencia de medición" />

              <div>
                <label style={labelStyle}>Línea base</label>
                <input name="linea_base" value={form.linea_base||"ND"} onChange={handleChange} style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Metas programadas</label>
                <input name="metas_programadas" type="number" value={form.metas_programadas||0} onChange={handleChange}
                  style={{ ...inputStyle, fontWeight:"700" }} />
              </div>

              <div>
                <label style={labelStyle}>Metas ajustadas que existan, en su caso</label>
                <input name="metas_ajustadas" type="number" value={form.metas_ajustadas||0} onChange={handleChange}
                  style={{ ...inputStyle, fontWeight:"700" }} />
              </div>

              <div>
                <label style={labelStyle}>Avance de metas</label>
                <input name="avance_metas" type="number" value={form.avance_metas||0} onChange={handleChange}
                  style={{ ...inputStyle, fontWeight:"700", color:Number(form.avance_metas)>0?"#16a34a":"#dc2626" }} />
              </div>

              <SelectCat name="sentido_indicador" value={form.sentido_indicador} options={SENTIDOS} label="Sentido del indicador (catálogo)" />
            </div>
          </div>

          <div style={sectionStyle}>
            <p style={{ fontWeight:"700", fontSize:"13px", color:"#374151", margin:"0 0 12px" }}>Fuente y responsable</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px" }}>
              <div>
                <label style={labelStyle}>Fuente de información</label>
                <textarea name="fuente_informacion" value={form.fuente_informacion||""} onChange={handleChange}
                  rows={2} style={{ ...inputStyle, resize:"vertical" }} />
              </div>
              <div>
                <label style={labelStyle}>Área(s) responsable(s)</label>
                <textarea name="area_responsable" value={form.area_responsable||""} onChange={handleChange}
                  rows={2} style={{ ...inputStyle, resize:"vertical" }} />
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
              style={{ padding:"10px 20px", borderRadius:"8px", border:"1px solid #d1d5db", cursor:"pointer", background:"white" }}>
              Cancelar
            </button>
            <button onClick={handleGuardar} disabled={enviando}
              style={{ padding:"10px 24px", borderRadius:"8px", background:"#dc2626", color:"white", border:"none", cursor:"pointer", fontWeight:"600", opacity:enviando?0.7:1 }}>
              {enviando?"Guardando...":editando?" Actualizar":" Guardar"}
            </button>
          </div>
        </div>
      )}

      {vista==="lista" && (
        <>
          <div style={{ display:"flex", gap:"10px", marginBottom:"16px", flexWrap:"wrap" }}>
            <input value={busqueda} onChange={e=>setBusqueda(e.target.value)}
              placeholder="🔍 Buscar en todos los campos..."
              style={{ padding:"8px 12px", borderRadius:"8px", border:"1px solid #e5e7eb", fontSize:"13px", width:"260px" }} />
            <select value={filtroDim} onChange={e=>setFiltroDim(e.target.value)}
              style={{ padding:"8px 12px", borderRadius:"8px", border:"1px solid #e5e7eb", fontSize:"13px", background:"white" }}>
              <option value="">Todas las dimensiones ({registros.length})</option>
              {DIMENSIONES.map(d => (
                <option key={d} value={d}>{d} ({registros.filter(r=>r.dimension===d).length})</option>
              ))}
            </select>
            {(busqueda||filtroDim) && (
              <button onClick={()=>{setBusqueda("");setFiltroDim("")}}
                style={{ padding:"8px 14px", borderRadius:"8px", border:"1px solid #e5e7eb", background:"white", cursor:"pointer", fontSize:"12px", color:"#6b7280" }}>
                ✕ Limpiar
              </button>
            )}
            <span style={{ marginLeft:"auto", fontSize:"12px", color:"#6b7280", alignSelf:"center" }}>
              {registrosFiltrados.length} de {registros.length} registros
            </span>
          </div>

          {cargando ? (
            <div style={{ textAlign:"center", padding:"80px", color:"#6b7280" }}>
              <p style={{ fontSize:"32px" }}>⏳</p><p>Cargando registros...</p>
            </div>
          ) : registros.length===0 ? (
            <div style={{ textAlign:"center", padding:"80px", color:"#9ca3af", background:"white", borderRadius:"12px", border:"1px solid #e5e7eb" }}>
              <p style={{ fontSize:"48px", margin:"0 0 12px" }}>📊</p>
              <p style={{ fontWeight:"600", fontSize:"16px" }}>Sin registros aún</p>
              <p style={{ fontSize:"13px" }}>Haz clic en "+ Nuevo registro" para agregar indicadores de resultados.</p>
            </div>
          ) : (
            <div style={{ background:"white", borderRadius:"12px", boxShadow:"0 1px 4px rgba(0,0,0,0.07)", overflow:"hidden", border:"1px solid #e5e7eb" }}>
              <div style={{ overflowX:"auto", maxHeight:"60vh" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"11px", minWidth:"2400px" }}>
                  <thead style={{ position:"sticky", top:0, zIndex:10 }}>
                    <tr style={{ background:"#1e1e1e" }}>
                      <th style={{ padding:"8px 6px", color:"white", textAlign:"center", fontWeight:"700", borderRight:"1px solid #333", whiteSpace:"nowrap" }}>#</th>
                      <th style={{ padding:"8px 6px", color:"white", textAlign:"center", fontWeight:"700", borderRight:"1px solid #333", whiteSpace:"nowrap" }}>Acciones</th>
                      {COLS.map(col => (
                        <th key={col.key} style={{ padding:"8px 8px", color:"white", textAlign:"left", fontWeight:"700", borderRight:"1px solid #333", minWidth:`${col.w}px`, whiteSpace:"nowrap" }}>
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {registrosFiltrados.map((reg, idx) => (
                      <tr key={reg.id} style={{ background:idx%2===0?"white":"#f9fafb", borderBottom:"1px solid #f1f5f9" }}>
                        <td style={{ padding:"6px 8px", textAlign:"center", color:"#9ca3af", fontSize:"10px", borderRight:"1px solid #f1f5f9", fontWeight:"600" }}>{idx+1}</td>
                        <td style={{ padding:"6px 8px", textAlign:"center", borderRight:"1px solid #f1f5f9" }}>
                          <div style={{ display:"flex", gap:"4px" }}>
                            <button onClick={()=>abrirEditar(reg)}
                              style={{ background:"#dbeafe", color:"#1e40af", border:"none", borderRadius:"4px", padding:"4px 8px", cursor:"pointer", fontSize:"10px", fontWeight:"600" }}>✏️</button>
                            <button onClick={()=>handleEliminar(reg.id)}
                              style={{ background:"#fee2e2", color:"#dc2626", border:"none", borderRadius:"4px", padding:"4px 8px", cursor:"pointer", fontSize:"10px" }}>🗑️</button>
                          </div>
                        </td>
                        {COLS.map(col => (
                          <td key={col.key} style={{ padding:"6px 8px", verticalAlign:"top", borderRight:"1px solid #f1f5f9", maxWidth:`${col.w}px` }}>
                            {col.key==="dimension" ? (
                              <span style={{ background:"#eff6ff", color:"#1e40af", padding:"2px 6px", borderRadius:"4px", fontSize:"10px", fontWeight:"600" }}>{reg[col.key]}</span>
                            ) : col.key==="sentido_indicador" ? (
                              <span style={{ background:reg[col.key]==="Ascendente"?"#d1fae5":"#fee2e2", color:reg[col.key]==="Ascendente"?"#065f46":"#991b1b", padding:"2px 6px", borderRadius:"4px", fontSize:"10px", fontWeight:"600" }}>
                                {reg[col.key]==="Ascendente"?"📈":"📉"} {reg[col.key]}
                              </span>
                            ) : col.key==="frecuencia_medicion" ? (
                              <span style={{ background:"#f3f4f6", color:"#374151", padding:"2px 6px", borderRadius:"4px", fontSize:"10px", fontWeight:"600" }}>{reg[col.key]}</span>
                            ) : ["metas_programadas","metas_ajustadas","avance_metas"].includes(col.key) ? (
                              <span style={{ fontWeight:"700", color:Number(reg[col.key])>0?"#16a34a":"#374151" }}>{Number(reg[col.key]||0)}</span>
                            ) : col.key==="ejercicio" ? (
                              <span style={{ fontWeight:"700", color:"#2563eb" }}>{reg[col.key]}</span>
                            ) : col.key==="nombre_programa" ? (
                              <span style={{ fontStyle:"italic", color:"#6b7280", fontSize:"11px" }}>{reg[col.key]||"-"}</span>
                            ) : (
                              <span style={{ color:"#374151", fontSize:"11px", lineHeight:"1.4" }}>
                                {String(reg[col.key]||"").length>100 ? String(reg[col.key]).substring(0,100)+"..." : reg[col.key]||"-"}
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
                <span>Mostrando {registrosFiltrados.length} de {registros.length} registros</span>
                <span>18LTAIPECHF6 · Sección 6</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}