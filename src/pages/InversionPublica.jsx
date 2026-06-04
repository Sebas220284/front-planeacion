import React, { useEffect, useState } from "react"
import MapSelector from "./MapSelector"
import EstadoCIP from "./EstadoCIP"

const ESTADO_COLORS = {
  borrador:  { bg:"#f3f4f6", color:"#374151", label:"Borrador"  },
  enviado:   { bg:"#dbeafe", color:"#1e40af", label:"Enviado"   },
  aprobado:  { bg:"#d1fae5", color:"#065f46", label:"Aprobado"  },
  rechazado: { bg:"#fee2e2", color:"#991b1b", label:"Rechazado" },
}

const FORM_VACIO = {
  anio:2026, nombre_proyecto:"", localidad:"Tuxtla Gutiérrez",
  clave_programa:"", clave_subprograma:"", dependency_id:"", unidad_responsable:"",
  ods:"", plan_nacional:"", plan_estatal:"", plan_municipal:"",
  pmd_eje:"", pmd_tema:"", pmd_politica_publica:"", pmd_objetivo:"",
  pmd_estrategia:"", pmd_lineas_accion:"", strategy_id:null,
  fuente_financiamiento_1:"", fuente_porcentaje_1:100,
  fuente_financiamiento_2:"", fuente_porcentaje_2:0,
  otra_fuente:"", costo_total:0, periodo_ejecucion:"Enero-Diciembre 2026",
  tipo_nuevo:false, tipo_continuidad:false, tipo_ampliacion:false,
  tipo_rehabilitacion:false, tipo_mantenimiento:false, tipo_construccion:false,
  tipo_equipamiento:false, tipo_instalacion:false, tipo_otros:"",
  doc_expediente_tecnico:false, doc_viabilidad:false, doc_analisis_costo:false,
  doc_acreditacion_propiedad:false, doc_peticion_ciudadania:false,
  doc_aceptacion_comunidad:false, doc_convenio:false,
  doc_padron_beneficiarios:false, doc_otros_especifique:"",
  origen_antecedentes:"", situacion_sin_proyecto:"", situacion_con_proyecto:"",
  descripcion_presupuesto:"", objetivos_beneficios:"", consideraciones_diagnostico:"N/A",
  unidad_medida_poblacion:"Habitantes", poblacion_total:"",
  poblacion_mujeres:"", poblacion_hombres:"",
  tipo_poblacion:"Población total de Tuxtla Gutiérrez según INEGI Censo 2020",
  georef_macro_lat:"", georef_macro_lng:"", georef_macro_localidad:"",
  georef_micro_lat:"", georef_micro_lng:"", georef_micro_localidad:"",
  elaboro_nombre:"", elaboro_cargo:"", visto_bueno_nombre:"", visto_bueno_cargo:""
}

const API = "http://localhost:3000/api/cip"

export default function InversionPublica({ currentUser = null }) {
  const [vista, setVista]     = useState("lista")
  const [seccion, setSeccion] = useState(1)
  const [proyectos, setProyectos] = useState([])
  const [form, setForm]       = useState(FORM_VACIO)
  const [editando, setEditando] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [cargando, setCargando] = useState(true)

  const [dependencias, setDependencias] = useState([])
  const [catProgramas, setCatProgramas] = useState([])
  const [catSubprog,   setCatSubprog]   = useState([])
  const [catFuentes,   setCatFuentes]   = useState([])
  const [catPartidas,  setCatPartidas]  = useState([])
  const [pmdOpciones,  setPmdOpciones]  = useState([])
  const [cargandoCat,  setCargandoCat]  = useState(true)

  const [desglose, setDesglose] = useState([])
  const [metas,    setMetas]    = useState([])
  const [nuevoDesglose, setNuevoDesglose] = useState({
    partida_clave:"3000", grupo_nombre:"", descripcion:"", importe_sin_iva:0, tiene_iva:true
  })
  const [nuevaMeta, setNuevaMeta] = useState({
    descripcion:"", unidad_medida:"Evento", cantidad_total:0, t1:0, t2:0, t3:0, t4:0
  })

  const [filtroEstado, setFiltroEstado] = useState("")
  const [filtroDep,    setFiltroDep]    = useState("")
  const [busqueda,     setBusqueda]     = useState("")

  useEffect(() => {
    cargarProyectos()
    cargarCatalogos()
  }, [])

  const cargarCatalogos = async () => {
    setCargandoCat(true)
    try {
      const [deps, progs, fuentes, partidas] = await Promise.all([
        fetch(`${API}/catalogos/dependencias`).then(r => r.json()),
        fetch(`${API}/catalogos/programas`).then(r => r.json()),
        fetch(`${API}/catalogos/fuentes`).then(r => r.json()),
        fetch(`${API}/catalogos/partidas`).then(r => r.json()),
      ])
      setDependencias(Array.isArray(deps)    ? deps    : [])
      setCatProgramas(Array.isArray(progs)   ? progs   : [])
      setCatFuentes(  Array.isArray(fuentes) ? fuentes : [])
      setCatPartidas( Array.isArray(partidas)? partidas: [])
    } catch(e) {
      console.error("Error cargando catálogos:", e)
    }
    setCargandoCat(false)
  }

  const cargarProyectos = async () => {
    setCargando(true)
    try {
      const r = await fetch(`${API}/`)
      const data = await r.json()
      setProyectos(Array.isArray(data) ? data : [])
    } catch(e) { console.error(e) }
    setCargando(false)
  }

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  const handleCheck  = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.checked }))

  const handleProgramaChange = async (e) => {
    const clave = e.target.value
    setForm(prev => ({ ...prev, clave_programa: clave, clave_subprograma:"" }))
    setCatSubprog([])
    if (!clave) return
    try {
      const r = await fetch(`${API}/catalogos/subprogramas/${clave}`)
      const data = await r.json()
      setCatSubprog(Array.isArray(data) ? data : [])
    } catch(e) { console.error("Error subprogramas:", e) }
  }

  const handleDepChange = async (e) => {
    const depId = e.target.value
    setForm(prev => ({
      ...prev,
      dependency_id: depId,
      pmd_eje:"", pmd_tema:"", pmd_politica_publica:"",
      pmd_objetivo:"", pmd_estrategia:"", pmd_lineas_accion:"", strategy_id:null
    }))
    setPmdOpciones([])
    if (!depId) return
    try {
      const r = await fetch(`${API}/catalogos/pmd/${depId}`)
      const data = await r.json()
      setPmdOpciones(Array.isArray(data) ? data : [])
    } catch(e) { console.error("Error PMD:", e) }
  }

  const handlePMDChange = (e) => {
    const val = e.target.value
    if (!val) return
    const p = pmdOpciones.find(x => x.pmd_estrategia === val)
    if (!p) return
    setForm(prev => ({
      ...prev,
      pmd_eje:              p.pmd_eje            || "",
      pmd_tema:             p.pmd_tema           || "",
      pmd_politica_publica: p.pmd_politica_publica|| "",
      pmd_objetivo:         p.pmd_objetivo       || "",
      pmd_estrategia:       p.pmd_estrategia     || "",
      pmd_lineas_accion:    p.lineas_accion      || "",
      strategy_id:          p.strategy_id        || null,
    }))
  }

const exportarPDF = async (proyectoId) => {
  try {
    const res = await fetch(`${API}/${proyectoId}/exportar`)
    const p   = await res.json()
    const jsPDF    = (await import("jspdf")).default
    const autoTable = (await import("jspdf-autotable")).default

    const doc = new jsPDF({ orientation:"portrait", unit:"mm", format:"letter" })
    const W   = doc.internal.pageSize.width
    const gris   = [50,50,50]
    const blanco = [255,255,255]
    const azul   = [30,64,175]

    const seccion = (titulo, y) => {
      doc.setFillColor(...gris); doc.rect(10, y, W-20, 7, "F")
      doc.setTextColor(...blanco); doc.setFont("helvetica","bold"); doc.setFontSize(9)
      doc.text(titulo.toUpperCase(), W/2, y+5, { align:"center" })
      doc.setTextColor(0,0,0); doc.setFont("helvetica","normal")
      return y + 9
    }

    const campo = (label, valor, x, y, wLabel=40, wValor=70) => {
      doc.setFont("helvetica","bold"); doc.setFontSize(7.5); doc.setTextColor(...gris)
      doc.text(label, x, y)
      doc.setFont("helvetica","normal"); doc.setTextColor(0,0,0)
      doc.text(String(valor||"-"), x + wLabel, y)
    }

    doc.setFillColor(...azul); doc.rect(0,0,W,18,"F")
    doc.setTextColor(...blanco); doc.setFont("helvetica","bold"); doc.setFontSize(11)
    doc.text("SISTEMA DE PLANEACIÓN MUNICIPAL", W/2, 8, { align:"center" })
    doc.setFontSize(9)
    doc.text("Cédula de Información del Proyecto (CIP)", W/2, 13, { align:"center" })
    doc.setFontSize(8); doc.text(`Año ${p.anio||2026}`, W/2, 17, { align:"center" })

    let y = 22
    y = seccion("1. Identificación del Programa/Proyecto", y)
    doc.setFontSize(8)
    campo("Programa Presupuestario:", `${p.clave_programa||""} ${p.programa_desc||""}`, 12, y+5)
    campo("Subprograma:", `${p.clave_subprograma||""} ${p.subprograma_desc||""}`, 12, y+10)
    campo("Dependencia:", p.dependencia_nombre||"", 12, y+15)
    campo("Unidad Responsable:", p.unidad_responsable||"", 12, y+20)
    y += 26

    y = seccion("2. Alineación ODS y Ejes Rectores", y)
    doc.setFontSize(8)
    campo("ODS:", p.ods||"", 12, y+5, 35, 150)
    campo("Plan Nacional:", p.plan_nacional||"", 12, y+10, 35, 150)
    campo("Plan Estatal:", p.plan_estatal||"", 12, y+15, 35, 150)
    campo("Plan Municipal:", p.plan_municipal||"", 12, y+20, 35, 150)
    y += 26

    y = seccion("3. Alineación al Plan Municipal de Desarrollo (PMD)", y)
    doc.setFontSize(8)
    campo("Eje:", p.pmd_eje||"", 12, y+5, 25, 165)
    campo("Tema:", p.pmd_tema||"", 12, y+10, 25, 165)
    campo("Política Pública:", p.pmd_politica_publica||"", 12, y+15, 35, 155)
    campo("Objetivo:", p.pmd_objetivo||"", 12, y+20, 25, 165)
    campo("Estrategia:", p.pmd_estrategia||"", 12, y+25, 25, 165)
    campo("Línea(s) de Acción:", p.pmd_lineas_accion||"", 12, y+30, 38, 152)
    y += 36

    y = seccion("4. Programa/Proyecto", y)
    doc.setFontSize(8)
    const fuente1 = `${p.fuente_financiamiento_1||""} — ${p.fuente1_desc||p.otra_fuente||""} ${p.fuente_porcentaje_1?`(${p.fuente_porcentaje_1}%)`:""}`.trim()
    const fuente2 = p.fuente_financiamiento_2 ? `${p.fuente_financiamiento_2} — ${p.fuente2_desc||""} (${p.fuente_porcentaje_2||0}%)` : ""
    campo("Nombre del Proyecto:", p.nombre_proyecto||"", 12, y+5, 40, 150)
    campo("Localidad:", p.localidad||"", 12, y+10, 28, 80)
    campo("Fuente de Financiamiento:", fuente1, 12, y+15, 52, 138)
    if (fuente2) campo("Fuente 2:", fuente2, 12, y+20, 28, 160)
    campo("Costo Total:", `$${Number(p.costo_total||0).toLocaleString("es-MX",{minimumFractionDigits:2})}`, 12, y+25, 28, 80)
    campo("Período de Ejecución:", p.periodo_ejecucion||"", 105, y+25, 38, 55)
    y += 30

    const tipos = ["tipo_nuevo","tipo_continuidad","tipo_ampliacion","tipo_rehabilitacion",
                   "tipo_mantenimiento","tipo_construccion","tipo_equipamiento","tipo_instalacion"]
      .filter(t => p[t]).map(t => t.replace("tipo_","").charAt(0).toUpperCase() + t.replace("tipo_","").slice(1))
    campo("Tipo:", tipos.join(", ")||"-", 12, y, 20, 170)
    y += 6

    const docs = ["doc_expediente_tecnico:Exp.Técnico","doc_viabilidad:Viabilidad",
                  "doc_analisis_costo:Análisis C/B","doc_acreditacion_propiedad:Acreditación",
                  "doc_peticion_ciudadania:Petición Ciudadana","doc_convenio:Convenio",
                  "doc_padron_beneficiarios:Padrón Benef."]
      .filter(d => p[d.split(":")[0]]).map(d => d.split(":")[1])
    if (docs.length) { campo("Documentación:", docs.join(", "), 12, y, 28, 162); y += 6 }

    doc.addPage()
    y = 15

    const textArea = (titulo, texto, yPos) => {
      if (!texto) return yPos
      doc.setFillColor(...gris); doc.rect(10, yPos, W-20, 6, "F")
      doc.setTextColor(...blanco); doc.setFont("helvetica","bold"); doc.setFontSize(8.5)
      doc.text(titulo.toUpperCase(), 12, yPos+4.5)
      doc.setTextColor(0,0,0); doc.setFont("helvetica","normal"); doc.setFontSize(7.5)
      const lines = doc.splitTextToSize(String(texto), W-24)
      const blockH = lines.length * 4 + 4
      doc.rect(10, yPos+6, W-20, blockH)
      doc.text(lines, 12, yPos+10)
      return yPos + 6 + blockH + 3
    }

    y = textArea("A. Origen y Antecedentes",   p.origen_antecedentes,   y)
    y = textArea("Situación Actual y Sin Proyecto", p.situacion_sin_proyecto, y)
    y = textArea("Situación Con Proyecto",      p.situacion_con_proyecto, y)
    y = textArea("Descripción del Presupuesto", p.descripcion_presupuesto, y)
    y = textArea("Objetivos — Beneficios Esperados", p.objetivos_beneficios, y)

    if (y > 230) { doc.addPage(); y = 15 }
    y = textArea("Diagnóstico de Visita de Campo", p.consideraciones_diagnostico, y)

    doc.addPage()
    y = 15
    y = seccion("8. Desglose del Presupuesto", y)

    if (p.desglose && p.desglose.length > 0) {
      autoTable(doc, {
        startY: y + 2,
        margin: { left:10, right:10 },
        head: [["Partida","Grupo/Área","Descripción","Sin IVA","Con IVA"]],
        body: p.desglose.map(d => [
          d.partida_clave||"",
          d.grupo_nombre||"",
          d.descripcion||"",
          `$${Number(d.importe_sin_iva||0).toLocaleString("es-MX",{minimumFractionDigits:2})}`,
          `$${Number(d.importe_con_iva||0).toLocaleString("es-MX",{minimumFractionDigits:2})}`
        ]),
        foot: [[
          { content:"TOTAL", colSpan:4, styles:{ halign:"right", fontStyle:"bold" } },
          { content:`$${p.desglose.reduce((s,d)=>s+Number(d.importe_con_iva||0),0).toLocaleString("es-MX",{minimumFractionDigits:2})}`,
            styles:{ fontStyle:"bold", textColor:azul } }
        ]],
        styles: { fontSize:7.5, cellPadding:2 },
        headStyles: { fillColor:gris, textColor:blanco, fontStyle:"bold" },
        footStyles: { fillColor:[240,240,240] },
        columnStyles: { 0:{cellWidth:18}, 3:{halign:"right"}, 4:{halign:"right", fontStyle:"bold"} }
      })
      y = doc.lastAutoTable.finalY + 6
    } else {
      doc.setFontSize(8); doc.text("Sin partidas registradas", 12, y+6); y += 12
    }

    y = seccion("9. Metas Trimestrales", y)

    if (p.metas && p.metas.length > 0) {
      autoTable(doc, {
        startY: y + 2,
        margin: { left:10, right:10 },
        head: [["Descripción","U.M.","Total","T-1","T-2","T-3","T-4"]],
        body: p.metas.map(m => [
          m.descripcion||"", m.unidad_medida||"",
          m.cantidad_total||0, m.t1||0, m.t2||0, m.t3||0, m.t4||0
        ]),
        styles: { fontSize:7.5, cellPadding:2 },
        headStyles: { fillColor:gris, textColor:blanco, fontStyle:"bold" },
        columnStyles: { 2:{halign:"center"}, 3:{halign:"center"}, 4:{halign:"center"}, 5:{halign:"center"}, 6:{halign:"center"} }
      })
      y = doc.lastAutoTable.finalY + 6
    } else {
      doc.setFontSize(8); doc.text("Sin metas registradas", 12, y+6); y += 12
    }

    if (y > 220) { doc.addPage(); y = 15 }
    y = seccion("10. Población Objetivo", y)
    doc.setFontSize(8)
    campo("Unidad de Medida:", p.unidad_medida_poblacion||"Habitantes", 12, y+5)
    campo("Total:", String(p.poblacion_total||"-"), 12, y+10)
    campo("Mujeres:", String(p.poblacion_mujeres||"-"), 12, y+15)
    campo("Hombres:", String(p.poblacion_hombres||"-"), 80, y+15)
    campo("Tipo de Población:", p.tipo_poblacion||"", 12, y+20, 35, 150)
    y += 26

    if (p.georef_macro_lat || p.georef_micro_lat) {
      y = seccion("11. Georreferenciación", y)
      doc.setFontSize(8)
      if (p.georef_macro_lat) {
        campo("Croquis Macro — Lat:", String(p.georef_macro_lat), 12, y+5)
        campo("Lng:", String(p.georef_macro_lng), 80, y+5)
        campo("Localidad:", p.georef_macro_localidad||"", 12, y+10, 25, 165)
      }
      if (p.georef_micro_lat) {
        campo("Croquis Micro — Lat:", String(p.georef_micro_lat), 12, y+16)
        campo("Lng:", String(p.georef_micro_lng), 80, y+16)
      }
      y += 22
    }

    if (y > 230) { doc.addPage(); y = 15 }
    y = seccion("Responsable del Proyecto", y)
    doc.setFontSize(8)

    const firmaY = y + 30
    doc.line(20, firmaY, 85, firmaY)
    doc.line(W-85, firmaY, W-20, firmaY)

    doc.setFontSize(8); doc.setFont("helvetica","bold")
    doc.text(p.elaboro_nombre||"__________________________", 52, firmaY+5, { align:"center" })
    doc.text(p.visto_bueno_nombre||"__________________________", W-52, firmaY+5, { align:"center" })
    doc.setFont("helvetica","normal"); doc.setFontSize(7)
    doc.text(p.elaboro_cargo||"Nombre del Titular Unidad Responsable", 52, firmaY+9, { align:"center" })
    doc.text(p.visto_bueno_cargo||"Nombre del Titular de la Dependencia", W-52, firmaY+9, { align:"center" })
    doc.setFontSize(7.5); doc.setFont("helvetica","bold")
    doc.text("Elaboró", 52, firmaY+14, { align:"center" })
    doc.text("Visto Bueno", W-52, firmaY+14, { align:"center" })

    const totalPags = doc.internal.getNumberOfPages()
    for (let i=1; i<=totalPags; i++) {
      doc.setPage(i)
      doc.setFontSize(6.5); doc.setTextColor(150,150,150)
      doc.text(`Página ${i} de ${totalPags}`, W-12, 287, { align:"right" })
      doc.text("Sistema de Planeación Municipal — H. Ayuntamiento de Tuxtla Gutiérrez", 12, 287)
    }

    doc.save(`CIP_${p.nombre_proyecto?.replace(/\s+/g,"_")||p.id}_${p.anio||2026}.pdf`)
  } catch(e) {
    console.error("Error exportar PDF:", e)
    alert("Error al generar PDF: " + e.message)
  }
}

const exportarExcel = async (proyectoId) => {
  try {
    const res = await fetch(`${API}/${proyectoId}/exportar`)
    const p   = await res.json()
    const ExcelJS = (await import("exceljs")).default
    const wb = new ExcelJS.Workbook()
    wb.creator = "Sistema de Planeación Municipal"
    wb.created = new Date()

    const ws1 = wb.addWorksheet("Datos Generales CIP")
    ws1.columns = [
      { width:35 }, { width:70 }
    ]

    const hdAzul = { type:"pattern", pattern:"solid", fgColor:{ argb:"FF1E40AF" } }
    const hdGris = { type:"pattern", pattern:"solid", fgColor:{ argb:"FF323232" } }
    const fntBlancoB = { bold:true, color:{ argb:"FFFFFFFF" }, size:11 }
    const fntBlancoSm = { bold:true, color:{ argb:"FFFFFFFF" }, size:9 }
    const fntGrisB = { bold:true, color:{ argb:"FF374151" }, size:9 }
    const wrap = { wrapText:true, vertical:"top" }
    const center = { horizontal:"center", vertical:"middle" }

    ws1.mergeCells("A1:B1")
    ws1.getCell("A1").value = "CÉDULA DE INFORMACIÓN DEL PROYECTO (CIP)"
    ws1.getCell("A1").fill = hdAzul
    ws1.getCell("A1").font = fntBlancoB
    ws1.getCell("A1").alignment = center
    ws1.getRow(1).height = 22

    ws1.mergeCells("A2:B2")
    ws1.getCell("A2").value = `Sistema de Planeación Municipal — Ayuntamiento de Tuxtla Gutiérrez ${p.anio||2026}`
    ws1.getCell("A2").fill = { type:"pattern", pattern:"solid", fgColor:{ argb:"FFE0E7FF" } }
    ws1.getCell("A2").font = { bold:true, color:{ argb:"FF1E40AF" }, size:9 }
    ws1.getCell("A2").alignment = center
    ws1.getRow(2).height = 14

    const bloqueSeccion = (ws, titulo, filaInicio) => {
      ws.mergeCells(`A${filaInicio}:B${filaInicio}`)
      ws.getCell(`A${filaInicio}`).value = titulo.toUpperCase()
      ws.getCell(`A${filaInicio}`).fill = hdGris
      ws.getCell(`A${filaInicio}`).font = fntBlancoSm
      ws.getCell(`A${filaInicio}`).alignment = { horizontal:"center", vertical:"middle" }
      ws.getRow(filaInicio).height = 14
      return filaInicio + 1
    }

    const fila = (ws, label, valor, filaNum) => {
      ws.getCell(`A${filaNum}`).value = label
      ws.getCell(`A${filaNum}`).font = fntGrisB
      ws.getCell(`A${filaNum}`).fill = { type:"pattern", pattern:"solid", fgColor:{ argb:"FFF8FAFC" } }
      ws.getCell(`A${filaNum}`).border = { bottom:{ style:"thin", color:{ argb:"FFE5E7EB" } } }
      ws.getCell(`B${filaNum}`).value = String(valor||"-")
      ws.getCell(`B${filaNum}`).alignment = wrap
      ws.getCell(`B${filaNum}`).border = { bottom:{ style:"thin", color:{ argb:"FFE5E7EB" } } }
      ws.getRow(filaNum).height = 16
      return filaNum + 1
    }

    let f = 3

    f = bloqueSeccion(ws1, "1. Identificación del Programa/Proyecto", f)
    f = fila(ws1,"Programa Presupuestario", `${p.clave_programa||""} — ${p.programa_desc||""}`, f)
    f = fila(ws1,"Subprograma", `${p.clave_subprograma||""} — ${p.subprograma_desc||""}`, f)
    f = fila(ws1,"Dependencia", p.dependencia_nombre, f)
    f = fila(ws1,"Unidad Responsable", p.unidad_responsable, f)

    f = bloqueSeccion(ws1,"2. Alineación ODS y Ejes Rectores", f)
    f = fila(ws1,"ODS", p.ods, f)
    f = fila(ws1,"Plan Nacional de Desarrollo", p.plan_nacional, f)
    f = fila(ws1,"Plan Estatal de Desarrollo", p.plan_estatal, f)
    f = fila(ws1,"Plan Municipal de Desarrollo", p.plan_municipal, f)

    f = bloqueSeccion(ws1,"3. Alineación al PMD", f)
    f = fila(ws1,"Eje", p.pmd_eje, f)
    f = fila(ws1,"Tema", p.pmd_tema, f)
    f = fila(ws1,"Política Pública", p.pmd_politica_publica, f)
    f = fila(ws1,"Objetivo", p.pmd_objetivo, f)
    f = fila(ws1,"Estrategia", p.pmd_estrategia, f)
    f = fila(ws1,"Línea(s) de Acción", p.pmd_lineas_accion, f)

    f = bloqueSeccion(ws1,"4. Datos del Proyecto", f)
    f = fila(ws1,"Nombre del Proyecto", p.nombre_proyecto, f)
    f = fila(ws1,"Localidad", p.localidad, f)
    f = fila(ws1,"Fuente de Financiamiento 1", `${p.fuente_financiamiento_1||""} — ${p.fuente1_desc||""} (${p.fuente_porcentaje_1||0}%)`, f)
    if (p.fuente_financiamiento_2) f = fila(ws1,"Fuente de Financiamiento 2", `${p.fuente_financiamiento_2} — ${p.fuente2_desc||""} (${p.fuente_porcentaje_2||0}%)`, f)
    f = fila(ws1,"Costo Total", `$${Number(p.costo_total||0).toLocaleString("es-MX",{minimumFractionDigits:2})}`, f)
    f = fila(ws1,"Período de Ejecución", p.periodo_ejecucion, f)

    const tipos = ["tipo_nuevo","tipo_continuidad","tipo_ampliacion","tipo_rehabilitacion",
                   "tipo_mantenimiento","tipo_construccion","tipo_equipamiento","tipo_instalacion"]
      .filter(t=>p[t]).map(t=>t.replace("tipo_","").charAt(0).toUpperCase()+t.replace("tipo_","").slice(1))
    f = fila(ws1,"Tipo de Proyecto", tipos.join(", ")||"-", f)

    f = bloqueSeccion(ws1,"5. Narrativa del Proyecto", f)
    f = fila(ws1,"Origen y Antecedentes", p.origen_antecedentes, f)
    if (ws1.getRow(f-1).height < 40) ws1.getRow(f-1).height = 40
    f = fila(ws1,"Situación Sin Proyecto", p.situacion_sin_proyecto, f)
    ws1.getRow(f-1).height = 50
    f = fila(ws1,"Situación Con Proyecto", p.situacion_con_proyecto, f)
    ws1.getRow(f-1).height = 50
    f = fila(ws1,"Objetivos / Beneficios Esperados", p.objetivos_beneficios, f)
    ws1.getRow(f-1).height = 50
    f = fila(ws1,"Diagnóstico de Visita de Campo", p.consideraciones_diagnostico, f)

    f = bloqueSeccion(ws1,"10. Población Objetivo", f)
    f = fila(ws1,"Unidad de Medida", p.unidad_medida_poblacion, f)
    f = fila(ws1,"Total", p.poblacion_total, f)
    f = fila(ws1,"Mujeres", p.poblacion_mujeres, f)
    f = fila(ws1,"Hombres", p.poblacion_hombres, f)
    f = fila(ws1,"Tipo de Población", p.tipo_poblacion, f)

    f = bloqueSeccion(ws1,"Responsables del Proyecto", f)
    f = fila(ws1,"Elaboró — Nombre", p.elaboro_nombre, f)
    f = fila(ws1,"Elaboró — Cargo", p.elaboro_cargo, f)
    f = fila(ws1,"Visto Bueno — Nombre", p.visto_bueno_nombre, f)
    f = fila(ws1,"Visto Bueno — Cargo", p.visto_bueno_cargo, f)

    const ws2 = wb.addWorksheet("8. Desglose Presupuesto")
    ws2.columns = [
      {width:14},{width:30},{width:50},{width:22},{width:22}
    ]
    ws2.mergeCells("A1:E1")
    ws2.getCell("A1").value = "DESGLOSE DEL PRESUPUESTO"
    ws2.getCell("A1").fill = hdAzul; ws2.getCell("A1").font = fntBlancoB
    ws2.getCell("A1").alignment = center; ws2.getRow(1).height = 18

    const hdRow2 = ws2.addRow(["Partida","Grupo/Área","Descripción","Sin IVA","Con IVA"])
    hdRow2.eachCell(cell => {
      cell.fill = hdGris; cell.font = fntBlancoSm
      cell.alignment = { horizontal:"center", vertical:"middle", wrapText:true }
    })
    ws2.getRow(2).height = 18

    let totalConIva = 0
    ;(p.desglose||[]).forEach((d,i) => {
      const row = ws2.addRow([
        d.partida_clave||"", d.grupo_nombre||"", d.descripcion||"",
        Number(d.importe_sin_iva||0), Number(d.importe_con_iva||0)
      ])
      row.getCell(4).numFmt = '"$"#,##0.00'
      row.getCell(5).numFmt = '"$"#,##0.00'
      row.getCell(5).font = { bold:true, color:{ argb:"FF1E40AF" } }
      row.getCell(1).fill = row.getCell(2).fill = row.getCell(3).fill =
      row.getCell(4).fill = row.getCell(5).fill = {
        type:"pattern", pattern:"solid",
        fgColor:{ argb: i%2===0?"FFFFFFFF":"FFF5F5F5" }
      }
      row.height = 18
      totalConIva += Number(d.importe_con_iva||0)
    })

    const totalRow = ws2.addRow(["","","","TOTAL:", totalConIva])
    totalRow.getCell(4).font = { bold:true, size:10 }
    totalRow.getCell(5).numFmt = '"$"#,##0.00'
    totalRow.getCell(5).font = { bold:true, size:11, color:{ argb:"FF1E40AF" } }
    totalRow.getCell(5).fill = { type:"pattern", pattern:"solid", fgColor:{ argb:"FFE0E7FF" } }
    totalRow.height = 20

    const ws3 = wb.addWorksheet("9. Metas Trimestrales")
    ws3.columns = [ {width:50},{width:15},{width:12},{width:12},{width:12},{width:12},{width:12} ]

    ws3.mergeCells("A1:G1")
    ws3.getCell("A1").value = "METAS TRIMESTRALES"
    ws3.getCell("A1").fill = hdAzul; ws3.getCell("A1").font = fntBlancoB
    ws3.getCell("A1").alignment = center; ws3.getRow(1).height = 18

    const hdMetas = ws3.addRow(["Descripción","U.M.","Total","T-1","T-2","T-3","T-4"])
    hdMetas.eachCell(cell => {
      cell.fill = hdGris; cell.font = fntBlancoSm
      cell.alignment = { horizontal:"center", vertical:"middle" }
    })
    ws3.getRow(2).height = 18

    ;(p.metas||[]).forEach((m,i) => {
      const row = ws3.addRow([
        m.descripcion||"", m.unidad_medida||"",
        m.cantidad_total||0, m.t1||0, m.t2||0, m.t3||0, m.t4||0
      ])
      for(let c=2;c<=7;c++) row.getCell(c).alignment = { horizontal:"center" }
      row.eachCell(cell => {
        cell.fill = { type:"pattern", pattern:"solid", fgColor:{ argb: i%2===0?"FFFFFFFF":"FFF5F5F5" } }
      })
      row.height = 18
    })

    const buf  = await wb.xlsx.writeBuffer()
    const blob = new Blob([buf], { type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement("a")
    a.href = url
    a.download = `CIP_${p.nombre_proyecto?.replace(/\s+/g,"_")||p.id}_${p.anio||2026}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  } catch(e) {
    console.error("Error exportar Excel:", e)
    alert("Error al generar Excel: " + e.message)
  }
}



  const handleGuardar = async () => {
    if (!form.nombre_proyecto)  { alert("El nombre del proyecto es obligatorio"); return }
    if (!form.dependency_id)    { alert("Selecciona una dependencia"); return }
    setEnviando(true)
    try {
      const url = editando ? `${API}/${editando}` : `${API}/`
      const res = await fetch(url, {
        method: editando ? "PUT" : "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ ...form, creado_por: currentUser?.id || null })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error del servidor")

      if (editando) {
        setProyectos(prev => prev.map(p => p.id===editando ? data : p))
      } else {
        setProyectos(prev => [data, ...prev])
        setEditando(data.id)
        setDesglose([]); setMetas([])
      }
      alert(" Proyecto guardado correctamente")
    } catch(e) {
      console.error(e)
      alert("Error al guardar: " + e.message)
    }
    setEnviando(false)
  }

  const abrirEditar = async (p) => {
    const limpio = { ...FORM_VACIO }
    Object.keys(limpio).forEach(k => { if (p[k] !== undefined) limpio[k] = p[k] })
    setForm(limpio)
    setEditando(p.id)
    setSeccion(1)

    if (p.clave_programa) {
      try {
        const r = await fetch(`${API}/catalogos/subprogramas/${p.clave_programa}`)
        const data = await r.json()
        setCatSubprog(Array.isArray(data) ? data : [])
      } catch(e) { console.error(e) }
    }

    if (p.dependency_id) {
      try {
        const r = await fetch(`${API}/catalogos/pmd/${p.dependency_id}`)
        const data = await r.json()
        setPmdOpciones(Array.isArray(data) ? data : [])
      } catch(e) { console.error(e) }
    }

    try {
      const [desR, metR] = await Promise.all([
        fetch(`${API}/${p.id}/desglose`).then(r=>r.json()),
        fetch(`${API}/${p.id}/metas`).then(r=>r.json()),
      ])
      setDesglose(Array.isArray(desR) ? desR : [])
      setMetas(Array.isArray(metR) ? metR : [])
    } catch(e) { console.error(e) }

    setVista("detalle")
  }

  const agregarDesgloseRow = async () => {
    if (!editando)                     { alert("Guarda primero la sección 1"); return }
    if (!nuevoDesglose.descripcion)    { alert("Escribe una descripción"); return }
    try {
      const r = await fetch(`${API}/${editando}/desglose`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ ...nuevoDesglose, orden:desglose.length })
      })
      const data = await r.json()
      setDesglose(prev => [...prev, data])
      setNuevoDesglose({ partida_clave:"3000", grupo_nombre:"", descripcion:"", importe_sin_iva:0, tiene_iva:true })
    } catch(e) { console.error(e) }
  }

  const eliminarDesgloseRow = async (id) => {
    if (!window.confirm("¿Eliminar esta partida?")) return
    await fetch(`${API}/desglose/${id}`, { method:"DELETE" })
    setDesglose(prev => prev.filter(d => d.id!==id))
  }

  const agregarMetaRow = async () => {
    if (!editando)               { alert("Guarda primero la sección 1"); return }
    if (!nuevaMeta.descripcion)  { alert("Escribe la descripción de la meta"); return }
    try {
      const r = await fetch(`${API}/${editando}/metas`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ ...nuevaMeta, orden:metas.length })
      })
      const data = await r.json()
      setMetas(prev => [...prev, data])
      setNuevaMeta({ descripcion:"", unidad_medida:"Evento", cantidad_total:0, t1:0, t2:0, t3:0, t4:0 })
    } catch(e) { console.error(e) }
  }

  const eliminarMetaRow = async (id) => {
    if (!window.confirm("¿Eliminar esta meta?")) return
    await fetch(`${API}/metas/${id}`, { method:"DELETE" })
    setMetas(prev => prev.filter(m => m.id!==id))
  }

  const totalDesglose = desglose.reduce((s,d) => s + Number(d.importe_con_iva||0), 0)

  const proyectosFiltrados = proyectos.filter(p => {
    const q = busqueda.toLowerCase()
    return (!filtroEstado || p.estado===filtroEstado) &&
           (!filtroDep    || p.dependency_id===filtroDep) &&
           (!q || [p.nombre_proyecto,p.dependencia_nombre,p.folio].some(v=>String(v||"").toLowerCase().includes(q)))
  })

  const inp = { width:"100%", padding:"8px 10px", borderRadius:"6px", border:"1px solid #d1d5db", fontSize:"13px", boxSizing:"border-box", color:"#000", background:"#fff" }
  const lbl = { display:"block", fontWeight:"600", fontSize:"12px", marginBottom:"4px", color:"#374151" }
  const sec = { background:"#f8fafc", borderRadius:"8px", padding:"16px", marginBottom:"16px", border:"1px solid #e5e7eb" }
  const apiTag = { background:"#fef3c7", border:"1px solid #fcd34d", color:"#92400e", padding:"1px 5px", borderRadius:"3px", fontSize:"9px", fontWeight:"700", marginLeft:"5px" }

  return (
    <div style={{ padding:"24px", background:"#f8fafc", minHeight:"100vh" }}>

      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:"20px", flexWrap:"wrap", gap:"12px" }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"4px" }}>
            <span style={{ background:"#1e40af", color:"white", fontWeight:"700", fontSize:"11px", padding:"3px 10px", borderRadius:"4px" }}>CIP 2026</span>
            <h2 style={{ margin:0, color:"#1e293b", fontSize:"18px" }}>Inversión Pública</h2>
          </div>
          <p style={{ margin:0, color:"#6b7280", fontSize:"13px" }}>
            {cargandoCat
              ? " Cargando catálogos..."
              : ` Catálogos listos · ${dependencias.length} deps · ${catProgramas.length} programas · ${catFuentes.length} fuentes`
            }
          </p>
        </div>
        {/* ═══ SECCIÓN ESTADO (arriba de los tabs cuando editando) ═══ */}
{editando && vista==="detalle" && (
  <EstadoCIP
    proyecto={proyectos.find(p=>p.id===editando) || form}
    currentUser={currentUser}
    onCambioEstado={(actualizado) => {
      setProyectos(prev => prev.map(p => p.id===actualizado.id ? {...p,...actualizado} : p))
      setForm(prev => ({ ...prev, estado:actualizado.estado, comentario_revision:actualizado.comentario_revision }))
    }}
  />
)}
{["planeacion","admin"].includes(currentUser?.rol) && (
  (() => {
    const pendientes = proyectos.filter(p=>p.estado==="enviado")
    if (pendientes.length === 0) return null
    return (
      <div style={{ background:"#fffbeb", border:"1px solid #fcd34d", borderRadius:"10px", padding:"12px 16px", marginBottom:"16px", display:"flex", alignItems:"center", gap:"12px" }}>
        <span style={{ fontSize:"20px" }}>📬</span>
        <div>
          <p style={{ fontWeight:"700", color:"#92400e", margin:"0 0 2px", fontSize:"14px" }}>
            {pendientes.length} CIP{pendientes.length!==1?"s":""} pendiente{pendientes.length!==1?"s":""} de revisión
          </p>
          <p style={{ color:"#78350f", fontSize:"12px", margin:0 }}>
            {pendientes.map(p=>p.nombre_proyecto).join(", ")}
          </p>
        </div>
        <button onClick={()=>setFiltroEstado("enviado")}
          style={{ marginLeft:"auto", padding:"6px 14px", background:"#d97706", color:"white", border:"none", borderRadius:"6px", cursor:"pointer", fontSize:"12px", fontWeight:"600" }}>
          Ver pendientes
        </button>
      </div>
    )
  })()
)}
        <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
          {vista!=="lista" && (
            <button onClick={()=>{ setVista("lista"); setEditando(null); setForm(FORM_VACIO); setCatSubprog([]); setPmdOpciones([]) }}
              style={{ padding:"8px 18px", background:"#6b7280", color:"white", border:"none", borderRadius:"8px", cursor:"pointer", fontSize:"13px", fontWeight:"600" }}>
              ← Lista
            </button>
          )}
          {vista==="lista" && (
            <button onClick={()=>{ setForm(FORM_VACIO); setEditando(null); setDesglose([]); setMetas([]); setCatSubprog([]); setPmdOpciones([]); setVista("form"); setSeccion(1) }}
              style={{ padding:"8px 18px", background:"#1e40af", color:"white", border:"none", borderRadius:"8px", cursor:"pointer", fontSize:"13px", fontWeight:"600" }}>
              + Nueva CIP
            </button>
          )}
        </div>
      </div>

      {vista==="lista" && (
        <>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:"12px", marginBottom:"20px" }}>
            {[
              { label:"Total proyectos", value:proyectos.length, color:"#1e40af", icon:"📋" },
              { label:"Aprobados",       value:proyectos.filter(p=>p.estado==="aprobado").length, color:"#16a34a", icon:"✅" },
              { label:"Enviados",        value:proyectos.filter(p=>p.estado==="enviado").length,  color:"#d97706", icon:"📤" },
              { label:"Borradores",      value:proyectos.filter(p=>p.estado==="borrador").length, color:"#6b7280", icon:"📝" },
              {
                label:"Inversión total",
                value:"$"+proyectos.reduce((s,p)=>s+Number(p.costo_total||0),0)
                  .toLocaleString("es-MX",{minimumFractionDigits:2,maximumFractionDigits:2}),
                color:"#7c3aed", icon:"💰"
              },
            ].map((kpi,i) => (
              <div key={i} style={{ background:"white", borderRadius:"10px", padding:"12px 14px", border:"1px solid #e5e7eb" }}>
                <p style={{ fontSize:"18px", margin:"0 0 4px" }}>{kpi.icon}</p>
                <p style={{ fontSize:i===4?"12px":"22px", fontWeight:"700", color:kpi.color, margin:"0 0 2px" }}>{kpi.value}</p>
                <p style={{ fontSize:"11px", color:"#6b7280", margin:0 }}>{kpi.label}</p>
              </div>
            ))}
          </div>

          <div style={{ display:"flex", gap:"10px", marginBottom:"16px", flexWrap:"wrap" }}>
            <input value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="🔍 Buscar proyecto..."
              style={{ padding:"8px 12px", borderRadius:"8px", border:"1px solid #e5e7eb", fontSize:"13px", width:"220px" }} />
            <select value={filtroEstado} onChange={e=>setFiltroEstado(e.target.value)}
              style={{ padding:"8px 12px", borderRadius:"8px", border:"1px solid #e5e7eb", fontSize:"13px", background:"white" }}>
              <option value="">Todos los estados</option>
              {Object.entries(ESTADO_COLORS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
            </select>
            <select value={filtroDep} onChange={e=>setFiltroDep(e.target.value)}
              style={{ padding:"8px 12px", borderRadius:"8px", border:"1px solid #e5e7eb", fontSize:"13px", background:"white", maxWidth:"260px" }}>
              <option value="">Todas las dependencias</option>
              {dependencias.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>

          {cargando ? (
            <div style={{ textAlign:"center", padding:"80px", color:"#6b7280" }}> Cargando proyectos...</div>
          ) : proyectosFiltrados.length===0 ? (
            <div style={{ textAlign:"center", padding:"80px", background:"white", borderRadius:"12px", border:"1px solid #e5e7eb", color:"#9ca3af" }}>
              <p style={{ fontSize:"48px", margin:"0 0 12px" }}></p>
              <p style={{ fontWeight:"600", fontSize:"16px" }}>Sin proyectos aún</p>
              <p style={{ fontSize:"13px" }}>Haz clic en "+ Nueva CIP" para comenzar.</p>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
              {proyectosFiltrados.map(p => {
                const est = ESTADO_COLORS[p.estado] || ESTADO_COLORS.borrador
                return (
                  <div key={p.id} style={{ background:"white", borderRadius:"10px", padding:"16px 18px", border:"1px solid #e5e7eb", boxShadow:"0 1px 3px rgba(0,0,0,0.05)" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"4px" }}>
                          <p style={{ fontWeight:"700", color:"#1e293b", margin:0, fontSize:"14px" }}>{p.nombre_proyecto}</p>
                          <span style={{ background:est.bg, color:est.color, padding:"2px 8px", borderRadius:"999px", fontSize:"10px", fontWeight:"700", flexShrink:0 }}>{est.label}</span>
                        </div>
                        <p style={{ color:"#dc2626", fontSize:"11px", margin:"0 0 4px", fontWeight:"600" }}>{p.dependencia_nombre}</p>
                        <div style={{ display:"flex", gap:"16px", fontSize:"11px", color:"#6b7280", flexWrap:"wrap" }}>
                          <span> {p.periodo_ejecucion || p.anio}</span>
                          <span> ${Number(p.costo_total||0).toLocaleString("es-MX",{minimumFractionDigits:2})}</span>
                          {p.programa_desc && <span> {p.clave_programa} — {p.programa_desc}</span>}
                          <span> {p.total_metas||0} meta{p.total_metas!==1?"s":""}</span>
                        </div>
                      </div>
                     <div style={{ display:"flex", gap:"6px", marginLeft:"12px", flexShrink:0 }}>
  <button onClick={()=>abrirEditar(p)}
    style={{ background:"#dbeafe", color:"#1e40af", border:"none", borderRadius:"6px", padding:"7px 12px", cursor:"pointer", fontSize:"12px", fontWeight:"600" }}>
     Editar
  </button>
  <button onClick={()=>exportarPDF(p.id)}
    style={{ background:"#fee2e2", color:"#dc2626", border:"none", borderRadius:"6px", padding:"7px 12px", cursor:"pointer", fontSize:"12px", fontWeight:"600" }}
    title="Exportar PDF">
     PDF
  </button>
  <button onClick={()=>exportarExcel(p.id)}
    style={{ background:"#d1fae5", color:"#065f46", border:"none", borderRadius:"6px", padding:"7px 12px", cursor:"pointer", fontSize:"12px", fontWeight:"600" }}
    title="Exportar Excel">
     XLS
  </button>
</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {(vista==="form" || vista==="detalle") && (
        <div style={{ maxWidth:"940px", margin:"0 auto" }}>

          <div style={{ display:"flex", gap:"4px", marginBottom:"20px", flexWrap:"wrap" }}>
            {[
              [1," 1. Identificación"],[2," 2. Presupuesto"],[3," 3. Metas"],
              [4," 4. Población"],[5," 5. Narrativa"],[6," 6. Georef"],[7," 7. Responsables"]
            ].map(([n,label]) => (
              <button key={n} onClick={()=>setSeccion(n)}
                style={{ padding:"8px 14px", borderRadius:"8px", border:"none", cursor:"pointer", fontSize:"12px", fontWeight:"600",
                  background:seccion===n?"#1e40af":"#e2e8f0", color:seccion===n?"white":"#374151" }}>
                {label}
              </button>
            ))}
          </div>

          {seccion===1 && (
            <>
              <div style={sec}>
                <p style={{ fontWeight:"700", fontSize:"13px", color:"#374151", margin:"0 0 12px" }}>1️⃣ Identificación del Programa/Proyecto</p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px" }}>

                  <div>
                    <label style={lbl}>
                      Programa Presupuestario
                      <span style={apiTag}>CATÁLOGO</span>
                      <span style={{ fontSize:"10px", color:"#6b7280", marginLeft:"6px" }}>({catProgramas.length} opciones)</span>
                    </label>
                    <select name="clave_programa" value={form.clave_programa} onChange={handleProgramaChange} style={inp}>
                      <option value="">-- Selecciona un programa --</option>
                      {catProgramas.map(p=>(
                        <option key={p.clave} value={p.clave}>{p.clave} — {p.descripcion}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={lbl}>
                      Subprograma
                      <span style={apiTag}>CATÁLOGO</span>
                      <span style={{ fontSize:"10px", color:"#6b7280", marginLeft:"6px" }}>({catSubprog.length} opciones)</span>
                    </label>
                    <select name="clave_subprograma" value={form.clave_subprograma} onChange={handleChange} style={inp}
                      disabled={!form.clave_programa}>
                      <option value="">
                        {!form.clave_programa ? "Selecciona primero el programa" :
                         catSubprog.length===0 ? "Sin subprogramas para este programa" :
                         "-- Selecciona subprograma --"}
                      </option>
                      {catSubprog.map(s=>(
                        <option key={s.clave_subprog} value={s.clave_subprog}>
                          {s.clave_subprog} — {s.descripcion}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={lbl}>
                      Dependencia *
                      <span style={{ fontSize:"10px", color:"#6b7280", marginLeft:"6px" }}>({dependencias.length} registradas)</span>
                    </label>
                    <select name="dependency_id" value={form.dependency_id} onChange={handleDepChange} style={inp}>
                      <option value="">-- Selecciona una dependencia --</option>
                      {dependencias.map(d=>(
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={lbl}>Unidad Responsable</label>
                    <input name="unidad_responsable" value={form.unidad_responsable||""} onChange={handleChange} style={inp}
                      placeholder="Ej: Congresos, Convenciones y Eventos" />
                  </div>
                </div>
              </div>

              <div style={sec}>
                <p style={{ fontWeight:"700", fontSize:"13px", color:"#374151", margin:"0 0 8px" }}>
                   Alineación ODS y Ejes Rectores
                  <span style={{ ...apiTag, fontSize:"10px", marginLeft:"8px" }}>API en desarrollo — texto libre por ahora</span>
                </p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
                  <div><label style={lbl}>ODS</label><input name="ods" value={form.ods||""} onChange={handleChange} style={inp} placeholder="Ej: ODS 8 Trabajo Decente..." /></div>
                  <div><label style={lbl}>Plan Nacional de Desarrollo</label><input name="plan_nacional" value={form.plan_nacional||""} onChange={handleChange} style={inp} /></div>
                  <div><label style={lbl}>Plan Estatal de Desarrollo</label><input name="plan_estatal" value={form.plan_estatal||""} onChange={handleChange} style={inp} /></div>
                  <div><label style={lbl}>Plan Municipal de Desarrollo</label><input name="plan_municipal" value={form.plan_municipal||""} onChange={handleChange} style={inp} /></div>
                </div>
              </div>

              <div style={{ ...sec, border:"1px solid #bbf7d0", background:"#f0fdf4" }}>
                <p style={{ fontWeight:"700", fontSize:"13px", color:"#166534", margin:"0 0 8px" }}>
                   Alineación al PMD
                  <span style={{ ...apiTag, background:"#bbf7d0", color:"#166534", marginLeft:"8px" }}>
                    Desde tu BD — {pmdOpciones.length} estrategia{pmdOpciones.length!==1?"s":""}
                  </span>
                </p>

                {!form.dependency_id && (
                  <p style={{ color:"#6b7280", fontSize:"12px", fontStyle:"italic" }}>
                    👆 Selecciona primero una dependencia para ver las estrategias del PMD disponibles.
                  </p>
                )}

                {form.dependency_id && pmdOpciones.length===0 && (
                  <p style={{ color:"#d97706", fontSize:"12px", background:"#fffbeb", padding:"8px 12px", borderRadius:"6px", border:"1px solid #fcd34d" }}>
                    ⚠️ Esta dependencia no tiene estrategias PMD registradas en planning_templates. Puedes llenar los campos manualmente.
                  </p>
                )}

                {pmdOpciones.length > 0 && (
                  <div style={{ marginBottom:"12px" }}>
                    <label style={lbl}>Seleccionar estrategia (auto-rellena los demás campos)</label>
                    <select onChange={handlePMDChange} style={{ ...inp, background:"white" }} defaultValue="">
                      <option value="">-- Selecciona una estrategia para auto-rellenar --</option>
                      {pmdOpciones.map((s,i) => (
                        <option key={i} value={s.pmd_estrategia}>
                          {s.pmd_estrategia || s.pmd_objetivo || `Estrategia ${i+1}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
                  <div>
                    <label style={lbl}>Tema</label>
                    <input name="pmd_tema" value={form.pmd_tema||""} onChange={handleChange} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Política Pública</label>
                    <input name="pmd_politica_publica" value={form.pmd_politica_publica||""} onChange={handleChange} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Objetivo</label>
                    <input name="pmd_objetivo" value={form.pmd_objetivo||""} onChange={handleChange} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Estrategia</label>
                    <input name="pmd_estrategia" value={form.pmd_estrategia||""} onChange={handleChange} style={inp} />
                  </div>
                  <div style={{ gridColumn:"1/-1" }}>
                    <label style={lbl}>Línea(s) de Acción</label>
                    <input name="pmd_lineas_accion" value={form.pmd_lineas_accion||""} onChange={handleChange} style={inp} />
                  </div>
                </div>
              </div>

              <div style={sec}>
                <p style={{ fontWeight:"700", fontSize:"13px", color:"#374151", margin:"0 0 12px" }}> Datos del Proyecto</p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px" }}>
                  <div style={{ gridColumn:"1/-1" }}>
                    <label style={lbl}>Nombre del Programa/Proyecto *</label>
                    <input name="nombre_proyecto" value={form.nombre_proyecto||""} onChange={handleChange}
                      style={{ ...inp, fontWeight:"700", fontSize:"14px" }} placeholder="Ej: Apoyo en Sitio" />
                  </div>
                  <div>
                    <label style={lbl}>Localidad</label>
                    <input name="localidad" value={form.localidad||""} onChange={handleChange} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Período de Ejecución</label>
                    <input name="periodo_ejecucion" value={form.periodo_ejecucion||""} onChange={handleChange} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Fuente de Financiamiento 1 <span style={apiTag}>CATÁLOGO</span></label>
                    <select name="fuente_financiamiento_1" value={form.fuente_financiamiento_1||""} onChange={handleChange} style={inp}>
                      <option value="">-- Selecciona fuente --</option>
                      {catFuentes.map(f=><option key={f.clave} value={f.clave}>{f.clave} — {f.descripcion}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>% Fuente 1</label>
                    <input name="fuente_porcentaje_1" type="number" min="0" max="100" value={form.fuente_porcentaje_1||0} onChange={handleChange} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Fuente de Financiamiento 2 (opcional)</label>
                    <select name="fuente_financiamiento_2" value={form.fuente_financiamiento_2||""} onChange={handleChange} style={inp}>
                      <option value="">Sin segunda fuente</option>
                      {catFuentes.map(f=><option key={f.clave} value={f.clave}>{f.clave} — {f.descripcion}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>% Fuente 2</label>
                    <input name="fuente_porcentaje_2" type="number" min="0" max="100" value={form.fuente_porcentaje_2||0} onChange={handleChange} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Costo Total $</label>
                    <input name="costo_total" type="number" value={form.costo_total||0} onChange={handleChange}
                      style={{ ...inp, fontWeight:"700", color:"#1e40af", fontSize:"14px" }} />
                  </div>
                  <div>
                    <label style={lbl}>Año</label>
                    <select name="anio" value={form.anio||2026} onChange={handleChange} style={inp}>
                      <option value={2025}>2025</option><option value={2026}>2026</option><option value={2027}>2027</option>
                    </select>
                  </div>
                </div>
              </div>

              <div style={sec}>
                <p style={{ fontWeight:"700", fontSize:"13px", color:"#374151", margin:"0 0 10px" }}> Tipo de Programa/Proyecto</p>
                <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
                  {[["tipo_nuevo","Nuevo"],["tipo_continuidad","Continuidad"],["tipo_ampliacion","Ampliación"],
                    ["tipo_rehabilitacion","Rehabilitación"],["tipo_mantenimiento","Mantenimiento"],
                    ["tipo_construccion","Construcción"],["tipo_equipamiento","Equipamiento"],["tipo_instalacion","Instalación"]
                  ].map(([n,l])=>(
                    <label key={n} style={{ display:"flex", alignItems:"center", gap:"6px", fontSize:"12px", cursor:"pointer",
                      background:form[n]?"#dbeafe":"#f3f4f6", padding:"6px 12px", borderRadius:"6px",
                      border:`1px solid ${form[n]?"#93c5fd":"#e5e7eb"}` }}>
                      <input type="checkbox" name={n} checked={!!form[n]} onChange={handleCheck} />
                      <span style={{ fontWeight:form[n]?"700":"400", color:form[n]?"#1e40af":"#374151" }}>{l}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={sec}>
                <p style={{ fontWeight:"700", fontSize:"13px", color:"#374151", margin:"0 0 10px" }}> Documentación Soporte</p>
                <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
                  {[["doc_expediente_tecnico","Expediente Técnico"],["doc_viabilidad","Viabilidad"],
                    ["doc_analisis_costo","Análisis Costo/Beneficio"],["doc_acreditacion_propiedad","Acreditación Propiedad"],
                    ["doc_peticion_ciudadania","Petición Ciudadanía"],["doc_aceptacion_comunidad","Aceptación Comunidad"],
                    ["doc_convenio","Convenio o Acuerdo"],["doc_padron_beneficiarios","Padrón Beneficiarios"]
                  ].map(([n,l])=>(
                    <label key={n} style={{ display:"flex", alignItems:"center", gap:"6px", fontSize:"12px", cursor:"pointer",
                      background:form[n]?"#d1fae5":"#f3f4f6", padding:"5px 10px", borderRadius:"6px",
                      border:`1px solid ${form[n]?"#6ee7b7":"#e5e7eb"}` }}>
                      <input type="checkbox" name={n} checked={!!form[n]} onChange={handleCheck} />
                      <span style={{ fontWeight:form[n]?"700":"400", color:form[n]?"#065f46":"#374151" }}>{l}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display:"flex", justifyContent:"flex-end" }}>
                <button onClick={handleGuardar} disabled={enviando}
                  style={{ padding:"11px 28px", borderRadius:"8px", background:"#1e40af", color:"white", border:"none", cursor:"pointer", fontWeight:"600", fontSize:"14px", opacity:enviando?0.7:1 }}>
                  {enviando ? "Guardando..." : editando ? " Actualizar" : " Guardar y continuar →"}
                </button>
              </div>
            </>
          )}

          {seccion===2 && (
            <div style={sec}>
              <p style={{ fontWeight:"700", fontSize:"13px", color:"#374151", margin:"0 0 14px" }}> Desglose del Presupuesto</p>
              {!editando
                ? <p style={{ color:"#dc2626", fontSize:"12px", background:"#fee2e2", padding:"10px", borderRadius:"6px" }}>⚠️ Guarda primero la Sección 1 para poder agregar partidas.</p>
                : (
                <>
                  <div style={{ background:"white", borderRadius:"8px", padding:"12px", border:"1px solid #e5e7eb", marginBottom:"14px" }}>
                    <p style={{ fontWeight:"600", fontSize:"12px", color:"#374151", margin:"0 0 10px" }}>Agregar partida</p>
                    <div style={{ display:"grid", gridTemplateColumns:"120px 1fr 1fr 120px 70px 50px", gap:"8px", alignItems:"end" }}>
                      <div>
                        <label style={lbl}>Partida</label>
                        <select value={nuevoDesglose.partida_clave} onChange={e=>setNuevoDesglose(p=>({...p,partida_clave:e.target.value}))} style={inp}>
                          {catPartidas.map(p=><option key={p.clave} value={p.clave}>{p.clave}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={lbl}>Grupo/Área</label>
                        <input value={nuevoDesglose.grupo_nombre} onChange={e=>setNuevoDesglose(p=>({...p,grupo_nombre:e.target.value}))} style={inp} placeholder="Ej: BURÓ MUNICIPAL DE TURISMO" />
                      </div>
                      <div>
                        <label style={lbl}>Descripción del servicio</label>
                        <input value={nuevoDesglose.descripcion} onChange={e=>setNuevoDesglose(p=>({...p,descripcion:e.target.value}))} style={inp} placeholder="Ej: SERVICIOS GENERALES" />
                      </div>
                      <div>
                        <label style={lbl}>Importe sin IVA $</label>
                        <input type="number" value={nuevoDesglose.importe_sin_iva} onChange={e=>setNuevoDesglose(p=>({...p,importe_sin_iva:Number(e.target.value)}))} style={inp} />
                      </div>
                      <div>
                        <label style={lbl}>IVA 16%</label>
                        <label style={{ display:"flex", alignItems:"center", gap:"6px", marginTop:"10px" }}>
                          <input type="checkbox" checked={nuevoDesglose.tiene_iva} onChange={e=>setNuevoDesglose(p=>({...p,tiene_iva:e.target.checked}))} />
                          <span style={{ fontSize:"12px" }}>Sí</span>
                        </label>
                      </div>
                      <div>
                        <label style={{ ...lbl, opacity:0 }}>x</label>
                        <button onClick={agregarDesgloseRow} style={{ padding:"8px 12px", background:"#1e40af", color:"white", border:"none", borderRadius:"6px", cursor:"pointer", fontSize:"14px", width:"100%" }}>+</button>
                      </div>
                    </div>
                    {nuevoDesglose.importe_sin_iva>0 && (
                      <p style={{ fontSize:"11px", color:"#16a34a", margin:"8px 0 0" }}>
                        Con IVA: ${(nuevoDesglose.tiene_iva ? nuevoDesglose.importe_sin_iva*1.16 : nuevoDesglose.importe_sin_iva).toLocaleString("es-MX",{minimumFractionDigits:2})}
                      </p>
                    )}
                  </div>

                  {desglose.length > 0 ? (
                    <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"12px" }}>
                      <thead>
                        <tr style={{ background:"#1e1e1e" }}>
                          {["Partida","Grupo","Descripción","Sin IVA","Con IVA",""].map(h=>(
                            <th key={h} style={{ padding:"8px 10px", color:"white", textAlign:["Sin IVA","Con IVA"].includes(h)?"right":"left", fontWeight:"700" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {desglose.map((d,i) => (
                          <tr key={d.id} style={{ background:i%2===0?"white":"#f9fafb", borderBottom:"1px solid #f1f5f9" }}>
                            <td style={{ padding:"8px 10px" }}><span style={{ background:"#dbeafe", color:"#1e40af", padding:"2px 7px", borderRadius:"4px", fontSize:"10px", fontWeight:"700" }}>{d.partida_clave}</span></td>
                            <td style={{ padding:"8px 10px", color:"#6b7280", fontSize:"11px" }}>{d.grupo_nombre}</td>
                            <td style={{ padding:"8px 10px" }}>{d.descripcion}</td>
                            <td style={{ padding:"8px 10px", textAlign:"right" }}>${Number(d.importe_sin_iva||0).toLocaleString("es-MX",{minimumFractionDigits:2})}</td>
                            <td style={{ padding:"8px 10px", textAlign:"right", fontWeight:"700", color:"#1e40af" }}>${Number(d.importe_con_iva||0).toLocaleString("es-MX",{minimumFractionDigits:2})}</td>
                            <td style={{ padding:"8px 10px", textAlign:"center" }}>
                              <button onClick={()=>eliminarDesgloseRow(d.id)} style={{ background:"#fee2e2", color:"#dc2626", border:"none", borderRadius:"4px", padding:"3px 9px", cursor:"pointer", fontSize:"10px" }}>🗑️</button>
                            </td>
                          </tr>
                        ))}
                        <tr style={{ background:"#e0e7ff" }}>
                          <td colSpan={4} style={{ padding:"10px", fontWeight:"700", textAlign:"right", fontSize:"13px" }}>TOTAL:</td>
                          <td style={{ padding:"10px", fontWeight:"700", color:"#1e40af", fontSize:"16px", textAlign:"right" }}>
                            ${totalDesglose.toLocaleString("es-MX",{minimumFractionDigits:2})}
                          </td>
                          <td></td>
                        </tr>
                      </tbody>
                    </table>
                  ) : (
                    <p style={{ textAlign:"center", color:"#9ca3af", padding:"30px", fontSize:"13px" }}>Sin partidas aún. Agrega la primera.</p>
                  )}
                </>
              )}
            </div>
          )}

          {seccion===3 && (
            <div style={sec}>
              <p style={{ fontWeight:"700", fontSize:"13px", color:"#374151", margin:"0 0 14px" }}> Metas Trimestrales</p>
              {!editando
                ? <p style={{ color:"#dc2626", fontSize:"12px", background:"#fee2e2", padding:"10px", borderRadius:"6px" }}>⚠️ Guarda primero la Sección 1.</p>
                : (
                <>
                  <div style={{ background:"white", borderRadius:"8px", padding:"12px", border:"1px solid #e5e7eb", marginBottom:"14px" }}>
                    <p style={{ fontWeight:"600", fontSize:"12px", color:"#374151", margin:"0 0 10px" }}>Agregar meta</p>
                    <div style={{ display:"grid", gridTemplateColumns:"2fr 80px 80px 70px 70px 70px 70px 50px", gap:"8px", alignItems:"end" }}>
                      {[
                        {f:"descripcion",l:"Descripción",t:"text",ph:"Ej: Bienvenida Tuxtleca"},
                        {f:"unidad_medida",l:"U.M.",t:"text",ph:"Evento"},
                        {f:"cantidad_total",l:"Total",t:"number"},
                        {f:"t1",l:"T-1",t:"number"},
                        {f:"t2",l:"T-2",t:"number"},
                        {f:"t3",l:"T-3",t:"number"},
                        {f:"t4",l:"T-4",t:"number"},
                      ].map(({f,l,t,ph})=>(
                        <div key={f}>
                          <label style={lbl}>{l}</label>
                          <input type={t} value={nuevaMeta[f]} placeholder={ph||""}
                            onChange={e=>setNuevaMeta(p=>({...p,[f]:t==="number"?Number(e.target.value):e.target.value}))}
                            style={inp} />
                        </div>
                      ))}
                      <div>
                        <label style={{ ...lbl, opacity:0 }}>x</label>
                        <button onClick={agregarMetaRow} style={{ padding:"8px 12px", background:"#16a34a", color:"white", border:"none", borderRadius:"6px", cursor:"pointer", fontSize:"14px", width:"100%" }}>+</button>
                      </div>
                    </div>
                  </div>

                  {metas.length > 0 ? (
                    <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"12px" }}>
                      <thead>
                        <tr style={{ background:"#1e1e1e" }}>
                          {["Descripción","U.M.","Total","T-1","T-2","T-3","T-4",""].map(h=>(
                            <th key={h} style={{ padding:"8px", color:"white", textAlign:"center", fontWeight:"700" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {metas.map((m,i) => (
                          <tr key={m.id} style={{ background:i%2===0?"white":"#f9fafb" }}>
                            <td style={{ padding:"8px", textAlign:"left" }}>{m.descripcion}</td>
                            <td style={{ padding:"8px", textAlign:"center" }}>{m.unidad_medida}</td>
                            <td style={{ padding:"8px", textAlign:"center", fontWeight:"700" }}>{m.cantidad_total}</td>
                            {[m.t1,m.t2,m.t3,m.t4].map((v,j)=>(<td key={j} style={{ padding:"8px", textAlign:"center" }}>{v||"-"}</td>))}
                            <td style={{ padding:"8px", textAlign:"center" }}>
                              <button onClick={()=>eliminarMetaRow(m.id)} style={{ background:"#fee2e2", color:"#dc2626", border:"none", borderRadius:"4px", padding:"3px 9px", cursor:"pointer", fontSize:"10px" }}>🗑️</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p style={{ textAlign:"center", color:"#9ca3af", padding:"30px", fontSize:"13px" }}>Sin metas. Agrega la primera.</p>
                  )}
                </>
              )}
            </div>
          )}

          {seccion===4 && (
            <div style={sec}>
              <p style={{ fontWeight:"700", fontSize:"13px", color:"#374151", margin:"0 0 14px" }}> Población Objetivo / Área de Enfoque</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"14px" }}>
                <div><label style={lbl}>Unidad de Medida</label><input name="unidad_medida_poblacion" value={form.unidad_medida_poblacion||"Habitantes"} onChange={handleChange} style={inp} /></div>
                <div><label style={lbl}>Total</label><input name="poblacion_total" type="number" value={form.poblacion_total||""} onChange={handleChange} style={inp} /></div>
                <div><label style={lbl}>Mujeres</label><input name="poblacion_mujeres" type="number" value={form.poblacion_mujeres||""} onChange={handleChange} style={inp} /></div>
                <div><label style={lbl}>Hombres</label><input name="poblacion_hombres" type="number" value={form.poblacion_hombres||""} onChange={handleChange} style={inp} /></div>
                <div style={{ gridColumn:"2/-1" }}><label style={lbl}>Tipo de Población</label><input name="tipo_poblacion" value={form.tipo_poblacion||""} onChange={handleChange} style={inp} /></div>
              </div>
              <div style={{ display:"flex", justifyContent:"flex-end", marginTop:"16px" }}>
                <button onClick={handleGuardar} disabled={enviando}
                  style={{ padding:"10px 24px", borderRadius:"8px", background:"#1e40af", color:"white", border:"none", cursor:"pointer", fontWeight:"600", opacity:enviando?0.7:1 }}>
                  {enviando?"Guardando...":" Guardar"}
                </button>
              </div>
            </div>
          )}

          {seccion===5 && (
            <div>
              {[
                ["origen_antecedentes","A. Origen y Antecedentes"],
                ["situacion_sin_proyecto","A. Situación Actual y Sin Proyecto"],
                ["situacion_con_proyecto","5. Situación Con Proyecto (Justificación)"],
                ["descripcion_presupuesto","6. Descripción del Desglose de Presupuesto"],
                ["objetivos_beneficios","Objetivos — Beneficios Esperados"],
                ["consideraciones_diagnostico","9. Consideraciones del Diagnóstico de Visita de Campo"],
              ].map(([name,label])=>(
                <div key={name} style={{ ...sec, marginBottom:"12px" }}>
                  <label style={{ ...lbl, fontSize:"13px", marginBottom:"8px" }}>{label}</label>
                  <textarea name={name} value={form[name]||""} onChange={handleChange} rows={5}
                    style={{ ...inp, resize:"vertical", lineHeight:"1.5" }} />
                </div>
              ))}
              <div style={{ display:"flex", justifyContent:"flex-end" }}>
                <button onClick={handleGuardar} disabled={enviando}
                  style={{ padding:"10px 24px", borderRadius:"8px", background:"#1e40af", color:"white", border:"none", cursor:"pointer", fontWeight:"600", opacity:enviando?0.7:1 }}>
                  {enviando?"Guardando...":" Guardar narrativa"}
                </button>
              </div>
            </div>
          )}

         {/* ═══ SECCIÓN 6: GEORREFERENCIACIÓN CON MAPBOX ═══ */}
{seccion===6 && (
  <div>
    {/* Macro */}
    <div style={sec}>
      <p style={{ fontWeight:"700", fontSize:"13px", color:"#374151", margin:"0 0 12px" }}>
        📍 Croquis Macro — Ubicación General
      </p>
      <MapSelector
        lat={form.georef_macro_lat ? Number(form.georef_macro_lat) : undefined}
        lng={form.georef_macro_lng ? Number(form.georef_macro_lng) : undefined}
        titulo="Croquis Macro (clic para ubicar)"
        height={280}
        onSelect={({ lat, lng }) => {
          setForm(prev => ({ ...prev, georef_macro_lat:lat, georef_macro_lng:lng }))
        }}
      />
      <div style={{ marginTop:"10px" }}>
        <label style={lbl}>Localidad / descripción del punto macro</label>
        <input name="georef_macro_localidad" value={form.georef_macro_localidad||""}
          onChange={handleChange} style={inp} placeholder="Ej: Tuxtla Gutiérrez, Chiapas" />
      </div>
    </div>

    {/* Micro */}
    <div style={sec}>
      <p style={{ fontWeight:"700", fontSize:"13px", color:"#374151", margin:"0 0 12px" }}>
        📍 Croquis Micro — Ubicación Específica
      </p>
      <MapSelector
        lat={form.georef_micro_lat ? Number(form.georef_micro_lat) : undefined}
        lng={form.georef_micro_lng ? Number(form.georef_micro_lng) : undefined}
        titulo="Croquis Micro (clic para ubicar)"
        height={280}
        onSelect={({ lat, lng }) => {
          setForm(prev => ({ ...prev, georef_micro_lat:lat, georef_micro_lng:lng }))
        }}
      />
      <div style={{ marginTop:"10px" }}>
        <label style={lbl}>Localidad / descripción del punto micro</label>
        <input name="georef_micro_localidad" value={form.georef_micro_localidad||""}
          onChange={handleChange} style={inp} placeholder="Ej: Calle Libramiento Norte esquina con Blvd. Belisario" />
      </div>
    </div>

    <div style={{ display:"flex", justifyContent:"flex-end" }}>
      <button onClick={handleGuardar} disabled={enviando}
        style={{ padding:"10px 24px", borderRadius:"8px", background:"#1e40af", color:"white", border:"none", cursor:"pointer", fontWeight:"600", opacity:enviando?0.7:1 }}>
        {enviando?"Guardando...":"✅ Guardar ubicaciones"}
      </button>
    </div>
  </div>
)}

          {seccion===7 && (
            <div style={sec}>
              <p style={{ fontWeight:"700", fontSize:"13px", color:"#374151", margin:"0 0 14px" }}>Responsable del Proyecto</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px" }}>
                <div style={{ background:"#f0fdf4", borderRadius:"8px", padding:"14px" }}>
                  <p style={{ fontWeight:"700", fontSize:"12px", color:"#166534", margin:"0 0 10px" }}>Elaboró</p>
                  <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
                    <div><label style={lbl}>Nombre</label><input name="elaboro_nombre" value={form.elaboro_nombre||""} onChange={handleChange} style={inp} /></div>
                    <div><label style={lbl}>Cargo / Unidad</label><input name="elaboro_cargo" value={form.elaboro_cargo||""} onChange={handleChange} style={inp} /></div>
                  </div>
                </div>
                <div style={{ background:"#eff6ff", borderRadius:"8px", padding:"14px" }}>
                  <p style={{ fontWeight:"700", fontSize:"12px", color:"#1e40af", margin:"0 0 10px" }}>Visto Bueno</p>
                  <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
                    <div><label style={lbl}>Nombre del Titular</label><input name="visto_bueno_nombre" value={form.visto_bueno_nombre||""} onChange={handleChange} style={inp} /></div>
                    <div><label style={lbl}>Cargo</label><input name="visto_bueno_cargo" value={form.visto_bueno_cargo||""} onChange={handleChange} style={inp} /></div>
                  </div>
                </div>
              </div>
              <div style={{ display:"flex", gap:"10px", justifyContent:"flex-end", marginTop:"16px" }}>
                <button onClick={handleGuardar} disabled={enviando}
                  style={{ padding:"11px 28px", borderRadius:"8px", background:"#1e40af", color:"white", border:"none", cursor:"pointer", fontWeight:"600", fontSize:"14px", opacity:enviando?0.7:1 }}>
                  {enviando?"Guardando...":" Guardar CIP completa"}
                </button>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  )
}