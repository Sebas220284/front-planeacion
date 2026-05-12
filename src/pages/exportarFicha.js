import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]

export const exportarFichaPDF = (f) => {
  const doc = new jsPDF({ orientation:"portrait", unit:"mm", format:"letter" })
  const W = doc.internal.pageSize.width
  const H = doc.internal.pageSize.height
  let y = 0

  doc.setFillColor(255,255,255)
  doc.rect(0, 0, W, 28, "F")
  doc.setDrawColor(200,200,200)
  doc.rect(0, 0, W, 28)

  doc.setFont("helvetica","bold")
  doc.setFontSize(9)
  doc.setTextColor(180,140,0)
  doc.text("TUXTLA GUTIÉRREZ", 28, 8)
  doc.setFontSize(7)
  doc.setTextColor(80,80,80)
  doc.text("AYUNTAMIENTO 2024-2027", 28, 13)
  doc.setFont("helvetica","normal")
  doc.setFontSize(8)
  doc.text("SECRETARÍA DE", 28, 18)
  doc.setFont("helvetica","bold")
  doc.text("PLANEACIÓN", 28, 23)

  doc.setFillColor(40,40,40)
  doc.roundedRect(W-68, 5, 60, 14, 2, 2, "F")
  doc.setTextColor(255,255,255)
  doc.setFontSize(7)
  doc.setFont("helvetica","bold")
  doc.text("SISTEMA DE PLANEACIÓN MUNICIPAL", W-38, 11, { align:"center" })
  doc.setFont("helvetica","normal")
  doc.setFontSize(6)
  doc.text("Indicadores del PMD 2024-2027", W-38, 16, { align:"center" })

  doc.setFillColor(220,180,0)
  doc.rect(0, 28, W, 6, "F")
  doc.setTextColor(255,255,255)
  doc.setFont("helvetica","bold")
  doc.setFontSize(8)
  doc.text("Ficha Técnica de Indicadores", 8, 33)

  y = 38

  const camposBasicos = [
    ["Nombre:", f.nombre_indicador || "-"],
    ["Definición:", f.definicion || "-"],
    ["Propósito:", f.proposito || "-"],
    ["Fórmula:", f.formula || "-"],
    ["Unidad de medida:", f.unidad_medida || "-"],
    ["Medios de verificación:", f.medios_verificacion || "-"],
    ["Supuestos:", f.supuestos || "-"],
  ]

  doc.setDrawColor(180,180,180)
  doc.setFontSize(8)
  camposBasicos.forEach(([label, val]) => {
    doc.setFillColor(240,240,240)
    doc.rect(8, y, 42, 6, "F")
    doc.setFillColor(255,255,255)
    doc.rect(50, y, W-58, 6, "F")
    doc.setDrawColor(180,180,180)
    doc.rect(8, y, W-16, 6)
    doc.rect(8, y, 42, 6)
    doc.setFont("helvetica","bold")
    doc.setTextColor(50,50,50)
    doc.text(label, 10, y+4.2)
    doc.setFont("helvetica","normal")
    const lines = doc.splitTextToSize(val, W-62)
    doc.text(lines[0], 52, y+4.2)
    y += 6
  })

  y += 2

  const col3W = (W-16)/3
  doc.setFillColor(230,230,230)
  doc.rect(8, y, col3W, 5, "F")
  doc.rect(8+col3W, y, col3W, 5, "F")
  doc.rect(8+col3W*2, y, col3W, 5, "F")
  doc.setFont("helvetica","bold"); doc.setFontSize(7); doc.setTextColor(50,50,50)
  doc.text("Eje:", 10, y+3.5)
  doc.text("Tema:", 10+col3W, y+3.5)
  doc.text("Política Pública:", 10+col3W*2, y+3.5)
  doc.rect(8, y, W-16, 5)
  y += 5
  doc.setFillColor(255,255,255)
  doc.rect(8, y, col3W, 8, "F")
  doc.rect(8+col3W, y, col3W, 8, "F")
  doc.rect(8+col3W*2, y, col3W, 8, "F")
  doc.setFont("helvetica","normal"); doc.setFontSize(7)
  const ejeLines = doc.splitTextToSize(f.eje||"-", col3W-4)
  const temaLines = doc.splitTextToSize(f.tema||"-", col3W-4)
  const polLines = doc.splitTextToSize(f.politica_publica||"-", col3W-4)
  doc.text(ejeLines, 10, y+3.5)
  doc.text(temaLines, 10+col3W, y+3.5)
  doc.text(polLines, 10+col3W*2, y+3.5)
  doc.rect(8, y, W-16, 8)
  y += 8

  const col2W = (W-16)/2
  doc.setFillColor(230,230,230)
  doc.rect(8, y, col2W, 5, "F")
  doc.rect(8+col2W, y, col2W, 5, "F")
  doc.setFont("helvetica","bold"); doc.setFontSize(7)
  doc.text("Objetivo:", 10, y+3.5)
  doc.text("Estrategia", 10+col2W, y+3.5)
  doc.rect(8, y, W-16, 5)
  y += 5
  const objLines = doc.splitTextToSize(f.objetivo||"-", col2W-4)
  const estLines = doc.splitTextToSize(f.estrategia||"-", col2W-4)
  const h2 = Math.max(objLines.length, estLines.length) * 4 + 4
  doc.setFillColor(255,255,255)
  doc.rect(8, y, col2W, h2, "F")
  doc.rect(8+col2W, y, col2W, h2, "F")
  doc.setFont("helvetica","normal"); doc.setFontSize(7)
  doc.text(objLines, 10, y+3.5)
  doc.text(estLines, 10+col2W, y+3.5)
  doc.rect(8, y, W-16, h2)
  y += h2

  const cols4 = (W-16)/4
  const row4Labels = ["Tipo de Evaluación:","Periodicidad:","Tipo indicador:","Informe de Gobierno:"]
  const row4Vals   = [f.tipo_evaluacion||"-", f.periodicidad||"-", f.tipo_indicador||"-", f.informe_gobierno?"Sí":"No"]
  doc.setFillColor(230,230,230)
  row4Labels.forEach((lbl,i) => {
    doc.rect(8+i*cols4, y, cols4, 5, "F")
    doc.rect(8+i*cols4, y, cols4, 5)
    doc.setFont("helvetica","bold"); doc.setFontSize(6.5); doc.setTextColor(50,50,50)
    doc.text(lbl, 10+i*cols4, y+3.5)
  })
  y += 5
  doc.setFillColor(255,255,255)
  row4Vals.forEach((val,i) => {
    doc.rect(8+i*cols4, y, cols4, 6, "F")
    doc.rect(8+i*cols4, y, cols4, 6)
    doc.setFont("helvetica","normal"); doc.setFontSize(7.5); doc.setTextColor(0,0,0)
    doc.text(String(val), 10+i*cols4, y+4)
  })
  y += 6

  const cols6 = (W-16)/6
  const hdrVals = ["Año base","Valor año base","Valor inicial","Valor mínimo","Meta anual","Trianual"]
  const dataVals = [f.anio_base||"-", f.valor_anio_base||"-", f.valor_inicial||"-", f.valor_minimo||"-", f.meta_anual||"-", f.meta_trianual||"-"]
  doc.setFillColor(60,60,60)
  hdrVals.forEach((h,i) => {
    doc.rect(8+i*cols6, y, cols6, 5, "F")
    doc.rect(8+i*cols6, y, cols6, 5)
    doc.setFont("helvetica","bold"); doc.setFontSize(6.5); doc.setTextColor(255,255,255)
    doc.text(h, 8+i*cols6+cols6/2, y+3.5, { align:"center" })
  })
  y += 5
  doc.setFillColor(255,255,255)
  dataVals.forEach((v,i) => {
    doc.rect(8+i*cols6, y, cols6, 6, "F")
    doc.rect(8+i*cols6, y, cols6, 6)
    doc.setFont("helvetica","bold"); doc.setFontSize(8); doc.setTextColor(0,0,0)
    doc.text(String(v), 8+i*cols6+cols6/2, y+4.2, { align:"center" })
  })
  y += 6

  const calW = 70
  const analW = W-16-calW-2
  const calX = 8
  const analX = calX+calW+2
  const startCalY = y

  doc.setFillColor(50,50,50)
  doc.rect(calX, y, calW, 5, "F")
  doc.setTextColor(255,255,255); doc.setFont("helvetica","bold"); doc.setFontSize(6.5)
  doc.text("Calendarización", calX+calW/2, y+3.5, { align:"center" })
  y += 5

  doc.setFillColor(200,200,200)
  const mW = calW/3
  doc.rect(calX,y,mW,4,"F"); doc.rect(calX+mW,y,mW,4,"F"); doc.rect(calX+mW*2,y,mW,4,"F")
  doc.setTextColor(50,50,50); doc.setFontSize(6)
  doc.text("Meses", calX+mW/2, y+2.8, {align:"center"})
  doc.text("Programado", calX+mW+mW/2, y+2.8, {align:"center"})
  doc.text("Real", calX+mW*2+mW/2, y+2.8, {align:"center"})
  doc.rect(calX,y,calW,4)
  y += 4

  const cal = typeof f.calendarizacion === "string" ? JSON.parse(f.calendarizacion||"{}") : (f.calendarizacion||{})
  MESES.forEach(mes => {
    const key = mes.toLowerCase()
    const prog = cal[key]?.programado || ""
    const real = cal[key]?.real || ""
    doc.setFillColor(255,255,255)
    doc.rect(calX,y,mW,4,"F"); doc.rect(calX+mW,y,mW,4,"F"); doc.rect(calX+mW*2,y,mW,4,"F")
    doc.rect(calX,y,calW,4)
    doc.setFont("helvetica","normal"); doc.setFontSize(6.5); doc.setTextColor(0,0,0)
    doc.text(mes, calX+mW/2, y+2.8, {align:"center"})
    doc.text(String(prog), calX+mW+mW/2, y+2.8, {align:"center"})
    doc.text(String(real), calX+mW*2+mW/2, y+2.8, {align:"center"})
    y += 4
  })

  const endCalY = y

  const analH = endCalY - startCalY
  doc.setFillColor(230,230,230)
  doc.rect(analX, startCalY, analW, 9, "F")
  doc.setFont("helvetica","bold"); doc.setFontSize(7); doc.setTextColor(50,50,50)
  doc.text("Análisis Cualitativo", analX+analW/2, startCalY+3, {align:"center"})
  doc.setFont("helvetica","normal")
  doc.text("del indicador", analX+analW/2, startCalY+7, {align:"center"})
  doc.rect(analX, startCalY, analW, analH)
  if (f.analisis_cualitativo) {
    const aLines = doc.splitTextToSize(f.analisis_cualitativo, analW-4)
    doc.setFontSize(7)
    doc.text(aLines, analX+2, startCalY+13)
  }

  y = endCalY + 2

  const colsAdm = (W-16)/4
  const hdrAdm = ["Unidad Administrativa","Responsable","Correo electrónico","Teléfono y Ext."]
  const valAdm = [f.dependencia_nombre||"-", f.responsable||"-", f.correo_electronico||"-", f.telefono||"-"]
  doc.setFillColor(200,200,200)
  hdrAdm.forEach((h,i) => {
    doc.rect(8+i*colsAdm, y, colsAdm, 5, "F")
    doc.rect(8+i*colsAdm, y, colsAdm, 5)
    doc.setFont("helvetica","bold"); doc.setFontSize(6.5); doc.setTextColor(50,50,50)
    doc.text(h, 10+i*colsAdm, y+3.5)
  })
  y += 5
  doc.setFillColor(255,255,255)
  valAdm.forEach((v,i) => {
    doc.rect(8+i*colsAdm, y, colsAdm, 7, "F")
    doc.rect(8+i*colsAdm, y, colsAdm, 7)
    doc.setFont("helvetica","normal"); doc.setFontSize(7); doc.setTextColor(0,0,0)
    doc.text(v, 10+i*colsAdm, y+4.5)
  })
  y += 7+3

  const criterios = ["Claro","Relevante","Económico","Monitoreable","Adecuado","Aportación marginal"]
  const camposCREAM = ["criterio_claro","criterio_relevante","criterio_economico","criterio_monitoreable","criterio_adecuado","criterio_aportacion"]
  const creamW = (W-16-40)/6

  doc.setFillColor(220,180,0)
  doc.rect(8, y, 40, 10, "F")
  doc.rect(8, y, 40, 10)
  doc.setFont("helvetica","bold"); doc.setFontSize(7); doc.setTextColor(255,255,255)
  doc.text("Tipo de", 28, y+4, {align:"center"})
  doc.text("indicador", 28, y+8, {align:"center"})

  criterios.forEach((c,i) => {
    doc.setFillColor(40,120,40)
    doc.rect(48+i*creamW, y, creamW, 5, "F")
    doc.rect(48+i*creamW, y, creamW, 5)
    doc.setTextColor(255,255,255); doc.setFont("helvetica","bold"); doc.setFontSize(6)
    doc.text(c, 48+i*creamW+creamW/2, y+3.5, {align:"center"})
  })

  y += 5
  doc.setFillColor(220,180,0)
  doc.rect(8, y, 40, 5, "F")
  doc.rect(8, y, 40, 5)
  doc.setFont("helvetica","bold"); doc.setFontSize(7); doc.setTextColor(180,100,0)
  doc.text(f.tipo_indicador||"Estratégico", 28, y+3.5, {align:"center"})

  criterios.forEach((_,i) => {
    const val = f[camposCREAM[i]] !== false ? "SI" : "NO"
    doc.setFillColor(230,255,230)
    doc.rect(48+i*creamW, y, creamW, 5, "F")
    doc.rect(48+i*creamW, y, creamW, 5)
    doc.setFont("helvetica","bold"); doc.setFontSize(8)
    doc.setTextColor(0,100,0)
    doc.text(val, 48+i*creamW+creamW/2, y+3.5, {align:"center"})
  })
  y += 5

  doc.setFont("helvetica","bold"); doc.setFontSize(14)
  doc.setTextColor(180,0,0)
  doc.text("¡Qué viva Tuxtla!", W/2, H-8, {align:"center"})

  doc.save(`FichaTecnica_${(f.nombre_indicador||"ficha").replace(/ /g,"_")}.pdf`)
}

export const exportarFichaExcel = async (f) => {
  const ExcelJS = (await import("exceljs")).default
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet("Ficha Técnica")

  const dorado = { type:"pattern", pattern:"solid", fgColor:{ argb:"FFDC9900" } }
  const grisOsc = { type:"pattern", pattern:"solid", fgColor:{ argb:"FF333333" } }
  const grisClaro = { type:"pattern", pattern:"solid", fgColor:{ argb:"FFD9D9D9" } }
  const blanco = { type:"pattern", pattern:"solid", fgColor:{ argb:"FFFFFFFF" } }
  const verde = { type:"pattern", pattern:"solid", fgColor:{ argb:"FF2D7A2D" } }
  const verdeClaro = { type:"pattern", pattern:"solid", fgColor:{ argb:"FFE6FFE6" } }
  const bold = { bold:true }
  const boldWhite = { bold:true, color:{ argb:"FFFFFFFF" } }
  const center = { horizontal:"center", vertical:"middle", wrapText:true }

  ws.columns = [
    {width:22},{width:30},{width:20},{width:20},{width:18},{width:18},{width:16}
  ]

  let r = 1

  ws.mergeCells(`A${r}:G${r}`)
  ws.getCell(`A${r}`).value = "SISTEMA DE PLANEACIÓN MUNICIPAL — Indicadores del PMD 2024-2027"
  ws.getCell(`A${r}`).fill = grisOsc
  ws.getCell(`A${r}`).font = boldWhite
  ws.getCell(`A${r}`).alignment = center
  ws.getRow(r).height = 18; r++

  ws.mergeCells(`A${r}:G${r}`)
  ws.getCell(`A${r}`).value = "Ficha Técnica de Indicadores"
  ws.getCell(`A${r}`).fill = dorado
  ws.getCell(`A${r}`).font = bold
  ws.getCell(`A${r}`).alignment = center
  ws.getRow(r).height = 16; r++

  const basicos = [
    ["Nombre", f.nombre_indicador],["Definición", f.definicion],
    ["Propósito", f.proposito],["Fórmula", f.formula],
    ["Unidad de medida", f.unidad_medida],["Medios de verificación", f.medios_verificacion],
    ["Supuestos", f.supuestos],
  ]
  basicos.forEach(([label, val]) => {
    ws.mergeCells(`B${r}:G${r}`)
    ws.getCell(`A${r}`).value = label; ws.getCell(`A${r}`).fill = grisClaro; ws.getCell(`A${r}`).font = bold
    ws.getCell(`B${r}`).value = val||"-"; ws.getCell(`B${r}`).alignment = { wrapText:true }
    ws.getRow(r).height = 20; r++
  })

  r++
  ;["Eje","Tema","Política Pública"].forEach((h,i) => {
    const col = ["A","C","E"][i]; const col2 = ["B","D","G"][i]
    ws.getCell(`${col}${r}`).value = h; ws.getCell(`${col}${r}`).fill = grisClaro; ws.getCell(`${col}${r}`).font = bold
    ws.getCell(`${col2}${r}`).value = [f.eje,f.tema,f.politica_publica][i]||"-"
  }); r++

  ;["Objetivo","Estrategia"].forEach((h,i) => {
    const col = ["A","D"][i]; const endCol = ["C","G"][i]
    ws.mergeCells(`${col}${r}:${endCol}${r}`)
    ws.getCell(`${col}${r}`).value = `${h}: ${[f.objetivo,f.estrategia][i]||"-"}`
    ws.getCell(`${col}${r}`).fill = grisClaro; ws.getCell(`${col}${r}`).font = bold
    ws.getCell(`${col}${r}`).alignment = { wrapText:true }
    ws.getRow(r).height = 30
  }); r++

  r++
  ;[["Tipo Evaluación",f.tipo_evaluacion],["Periodicidad",f.periodicidad],["Tipo Indicador",f.tipo_indicador],["Inf. Gobierno",f.informe_gobierno?"Sí":"No"]].forEach(([h,v],i)=>{
    const c = ["A","B","C","D"][i]
    ws.getCell(`${c}${r}`).value = `${h}: ${v||"-"}`; ws.getCell(`${c}${r}`).fill = grisClaro; ws.getCell(`${c}${r}`).font = bold
  }); r++

  const hNums = ["Año base","Valor año base","Valor inicial","Valor mínimo","Meta anual","Trianual"]
  const vNums = [f.anio_base,f.valor_anio_base,f.valor_inicial,f.valor_minimo,f.meta_anual,f.meta_trianual]
  const colsN = ["A","B","C","D","E","F"]
  hNums.forEach((h,i)=>{ ws.getCell(`${colsN[i]}${r}`).value=h; ws.getCell(`${colsN[i]}${r}`).fill=grisOsc; ws.getCell(`${colsN[i]}${r}`).font=boldWhite; ws.getCell(`${colsN[i]}${r}`).alignment=center }); r++
  vNums.forEach((v,i)=>{ ws.getCell(`${colsN[i]}${r}`).value=Number(v)||0; ws.getCell(`${colsN[i]}${r}`).alignment=center; ws.getCell(`${colsN[i]}${r}`).font=bold }); r++

  r++
  ws.mergeCells(`A${r}:C${r}`)
  ws.getCell(`A${r}`).value="Calendarización"; ws.getCell(`A${r}`).fill=grisOsc; ws.getCell(`A${r}`).font=boldWhite; ws.getCell(`A${r}`).alignment=center
  ws.mergeCells(`D${r}:G${r}`)
  ws.getCell(`D${r}`).value="Análisis Cualitativo"; ws.getCell(`D${r}`).fill=grisClaro; ws.getCell(`D${r}`).font=bold; ws.getCell(`D${r}`).alignment=center; r++

  ;["Mes","Programado","Real"].forEach((h,i)=>{ ws.getCell(`${["A","B","C"][i]}${r}`).value=h; ws.getCell(`${["A","B","C"][i]}${r}`).fill=grisClaro; ws.getCell(`${["A","B","C"][i]}${r}`).font=bold })
  const analStartRow = r
  r++

  const cal = typeof f.calendarizacion==="string" ? JSON.parse(f.calendarizacion||"{}") : (f.calendarizacion||{})
  MESES.forEach((mes,idx)=>{
    const key=mes.toLowerCase()
    ws.getCell(`A${r}`).value=mes
    ws.getCell(`B${r}`).value=cal[key]?.programado||""
    ws.getCell(`C${r}`).value=cal[key]?.real||""
    r++
  })

  ws.mergeCells(`D${analStartRow}:G${analStartRow+12}`)
  ws.getCell(`D${analStartRow}`).value=f.analisis_cualitativo||"-"
  ws.getCell(`D${analStartRow}`).alignment={wrapText:true, vertical:"top"}
  r++

  const criteriosH = ["Tipo de Indicador","Claro","Relevante","Económico","Monitoreable","Adecuado","Aportación marginal"]
  criteriosH.forEach((h,i)=>{ ws.getCell(`${["A","B","C","D","E","F","G"][i]}${r}`).value=h; ws.getCell(`${["A","B","C","D","E","F","G"][i]}${r}`).fill=verde; ws.getCell(`${["A","B","C","D","E","F","G"][i]}${r}`).font=boldWhite; ws.getCell(`${["A","B","C","D","E","F","G"][i]}${r}`).alignment=center }); r++
  const camposCREAM=["criterio_claro","criterio_relevante","criterio_economico","criterio_monitoreable","criterio_adecuado","criterio_aportacion"]
  ws.getCell(`A${r}`).value=f.tipo_indicador||"Estratégico"; ws.getCell(`A${r}`).fill=dorado; ws.getCell(`A${r}`).font=bold; ws.getCell(`A${r}`).alignment=center
  camposCREAM.forEach((c,i)=>{ const col=["B","C","D","E","F","G"][i]; ws.getCell(`${col}${r}`).value=f[c]!==false?"SI":"NO"; ws.getCell(`${col}${r}`).fill=verdeClaro; ws.getCell(`${col}${r}`).font=bold; ws.getCell(`${col}${r}`).alignment=center }); r++

  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"})
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href=url; a.download=`FichaTecnica_${(f.nombre_indicador||"ficha").replace(/ /g,"_")}.xlsx`; a.click()
  URL.revokeObjectURL(url)
}