import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]

// ── Encabezado en cada página ──
const dibujarEncabezado = (doc, W) => {
  // Fondo blanco del encabezado
  doc.setFillColor(255,255,255)
  doc.rect(0, 0, W, 26, "F")
  doc.setDrawColor(210,210,210)
  doc.line(0, 26, W, 26)

  // Escudo (círculo simulado)
  doc.setFillColor(240,240,240)
  doc.circle(13, 13, 9, "F")
  doc.setDrawColor(80,80,80)
  doc.circle(13, 13, 9, "S")
  doc.setFont("helvetica","bold")
  doc.setFontSize(5)
  doc.setTextColor(80,80,80)
  doc.text("TUCHTLAN", 13, 11, { align:"center" })
  doc.setFontSize(4)
  doc.text("✦ ✦ ✦", 13, 14, { align:"center" })
  doc.text("ESCUDO", 13, 17, { align:"center" })

  // Separador vertical
  doc.setDrawColor(180,140,0)
  doc.setLineWidth(0.8)
  doc.line(55, 4, 55, 22)
  doc.setLineWidth(0.2)

  // "TUXTLA GUTIÉRREZ"
  doc.setFont("helvetica","bold")
  doc.setFontSize(11)
  doc.setTextColor(180,140,0)
  doc.text("TUXTLA GUTIÉRREZ", 25, 11)
  doc.setFontSize(7)
  doc.setTextColor(50,50,50)
  doc.text("AYUNTAMIENTO 2024-2027", 25, 16)

  // "SECRETARÍA DE PLANEACIÓN"
  doc.setFont("helvetica","normal")
  doc.setFontSize(7.5)
  doc.setTextColor(100,100,100)
  doc.text("SECRETARÍA DE", 58, 11)
  doc.setFont("helvetica","bold")
  doc.setFontSize(8.5)
  doc.setTextColor(180,140,0)
  doc.text("PLANEACIÓN", 58, 17)

  // Badge "SISTEMA DE PLANEACIÓN MUNICIPAL" (derecha)
  doc.setFillColor(100,100,100)
  doc.roundedRect(W-72, 4, 66, 18, 2, 2, "F")
  doc.setTextColor(255,255,255)
  doc.setFont("helvetica","bold")
  doc.setFontSize(7)
  doc.text("SISTEMA DE PLANEACIÓN MUNICIPAL", W-39, 11, { align:"center" })
  doc.setFont("helvetica","normal")
  doc.setFontSize(6)
  doc.text("Indicadores del PMD 2024-2027", W-39, 17, { align:"center" })

  // Línea dorada bajo encabezado
  doc.setFillColor(180,140,0)
  doc.rect(0, 26, W, 1.5, "F")
}

// ── Pie de página en cada página ──
const dibujarPiePagina = (doc, W, H, numPagina, totalPaginas) => {
  const footerY = H - 16

  // Línea divisora
  doc.setDrawColor(210,210,210)
  doc.line(8, footerY, W-8, footerY)

  // "¡Qué viva Tuxtla!" estilo logo
  doc.setFont("helvetica","bold")
  doc.setFontSize(9)
  doc.setTextColor(180,140,0)
  doc.text("¡Qué viva", W/2 - 18, footerY + 5)
  doc.setFontSize(13)
  doc.setTextColor(0,0,0)
  doc.text("Tuxtla!", W/2 - 1, footerY + 5)
  // Puntos decorativos simulando el conejo/edificios
  doc.setFontSize(7)
  doc.setTextColor(180,140,0)
  doc.text("●", W/2 + 16, footerY + 3)

  // Número de página
  doc.setFont("helvetica","normal")
  doc.setFontSize(7)
  doc.setTextColor(150,150,150)
  doc.text(`Página ${numPagina} de ${totalPaginas}`, W - 10, footerY + 5, { align:"right" })

  // "Ficha Técnica de Indicadores" izquierda
  doc.setTextColor(150,150,150)
  doc.text("Ficha Técnica de Indicadores", 10, footerY + 5)
}

// ── Fila de tabla simulada ──
const filaTabla = (doc, x, y, w, h, labelW, label, valor, bgLabel, bgVal) => {
  doc.setFillColor(...(bgLabel || [230,230,230]))
  doc.rect(x, y, labelW, h, "F")
  doc.setFillColor(...(bgVal || [255,255,255]))
  doc.rect(x+labelW, y, w-labelW, h, "F")
  doc.setDrawColor(190,190,190)
  doc.rect(x, y, w, h)
  doc.rect(x, y, labelW, h)
  doc.setFont("helvetica","bold")
  doc.setFontSize(7.5)
  doc.setTextColor(50,50,50)
  doc.text(label, x+2, y+h/2+1)
  doc.setFont("helvetica","normal")
  doc.setFontSize(7.5)
  const lines = doc.splitTextToSize(String(valor||"-"), w-labelW-3)
  doc.text(lines[0]||"-", x+labelW+2, y+h/2+1)
  return lines.length > 1 ? h*(lines.length*0.6) : h
}

export const exportarFichaPDF = (f) => {
  const doc = new jsPDF({ orientation:"portrait", unit:"mm", format:"letter" })
  const W = doc.internal.pageSize.width
  const H = doc.internal.pageSize.height
  const MARGEN = 8
  const CONTENT_TOP = 30  // bajo el encabezado
  const CONTENT_BOTTOM = H - 20  // sobre el pie

  // ═══════════════════════════════
  // PÁGINA 1
  // ═══════════════════════════════
  dibujarEncabezado(doc, W)
  let y = CONTENT_TOP

  // Subtítulo "Ficha Técnica de Indicadores"
  doc.setFillColor(180,140,0)
  doc.rect(MARGEN, y, W-MARGEN*2, 6, "F")
  doc.setTextColor(255,255,255)
  doc.setFont("helvetica","bold")
  doc.setFontSize(8)
  doc.text("Ficha Técnica de Indicadores", MARGEN+2, y+4.2)
  y += 8

  // NOMBRE
  doc.setFillColor(240,240,240)
  doc.rect(MARGEN, y, W-MARGEN*2, 7, "F")
  doc.setDrawColor(190,190,190)
  doc.rect(MARGEN, y, 28, 7)
  doc.rect(MARGEN, y, W-MARGEN*2, 7)
  doc.setFont("helvetica","bold"); doc.setFontSize(7.5); doc.setTextColor(50,50,50)
  doc.text("Nombre:", MARGEN+2, y+4.5)
  doc.setFont("helvetica","bold"); doc.setFontSize(8)
  doc.text(f.nombre_indicador||"-", MARGEN+30, y+4.5)
  y += 7

  // DEFINICIÓN
  const defLines = doc.splitTextToSize(f.definicion||"-", W-MARGEN*2-30)
  const defH = Math.max(7, defLines.length*4+3)
  doc.setFillColor(230,230,230); doc.rect(MARGEN,y,28,defH,"F")
  doc.setFillColor(255,255,255); doc.rect(MARGEN+28,y,W-MARGEN*2-28,defH,"F")
  doc.setDrawColor(190,190,190); doc.rect(MARGEN,y,W-MARGEN*2,defH); doc.rect(MARGEN,y,28,defH)
  doc.setFont("helvetica","bold"); doc.setFontSize(7.5); doc.setTextColor(50,50,50)
  doc.text("Definición:", MARGEN+2, y+4.5)
  doc.setFont("helvetica","normal"); doc.setFontSize(7.5)
  doc.text(defLines, MARGEN+30, y+4.5)
  y += defH

  // PROPÓSITO
  const propLines = doc.splitTextToSize(f.proposito||"-", W-MARGEN*2-30)
  const propH = Math.max(7, propLines.length*4+3)
  doc.setFillColor(230,230,230); doc.rect(MARGEN,y,28,propH,"F")
  doc.setFillColor(255,255,255); doc.rect(MARGEN+28,y,W-MARGEN*2-28,propH,"F")
  doc.setDrawColor(190,190,190); doc.rect(MARGEN,y,W-MARGEN*2,propH); doc.rect(MARGEN,y,28,propH)
  doc.setFont("helvetica","bold"); doc.setFontSize(7.5)
  doc.text("Propósito:", MARGEN+2, y+4.5)
  doc.setFont("helvetica","normal"); doc.setFontSize(7.5)
  doc.text(propLines, MARGEN+30, y+4.5)
  y += propH

  // FÓRMULA / UNIDAD / MEDIOS / SUPUESTOS (filas simples)
  const filasSimples = [
    ["Fórmula:", f.formula],
    ["Unidad de medida:", f.unidad_medida],
    ["Medios de verificación:", f.medios_verificacion],
    ["Supuestos:", f.supuestos],
  ]
  filasSimples.forEach(([label, val]) => {
    const vLines = doc.splitTextToSize(val||"-", W-MARGEN*2-38)
    const fH = Math.max(6, vLines.length*4+2)
    doc.setFillColor(230,230,230); doc.rect(MARGEN,y,38,fH,"F")
    doc.setFillColor(255,255,255); doc.rect(MARGEN+38,y,W-MARGEN*2-38,fH,"F")
    doc.setDrawColor(190,190,190); doc.rect(MARGEN,y,W-MARGEN*2,fH); doc.rect(MARGEN,y,38,fH)
    doc.setFont("helvetica","bold"); doc.setFontSize(7.5); doc.setTextColor(50,50,50)
    doc.text(label, MARGEN+2, y+4)
    doc.setFont("helvetica","normal")
    doc.text(vLines, MARGEN+40, y+4)
    y += fH
  })

  y += 3

  // EJE / TEMA / POLÍTICA
  const col3 = (W-MARGEN*2)/3
  ;[["Eje:", f.eje],["Tema:", f.tema],["Política Pública:", f.politica_publica]].forEach(([label,val],i)=>{
    const cx = MARGEN+i*col3
    doc.setFillColor(200,200,200); doc.rect(cx,y,col3,5,"F"); doc.setDrawColor(190,190,190); doc.rect(cx,y,col3,5)
    doc.setFont("helvetica","bold"); doc.setFontSize(7); doc.setTextColor(50,50,50)
    doc.text(label, cx+2, y+3.5)
  })
  y += 5
  ;[f.eje,f.tema,f.politica_publica].forEach((val,i)=>{
    const cx = MARGEN+i*col3
    const vLines = doc.splitTextToSize(val||"-", col3-4)
    const fH = Math.max(6, vLines.length*4+2)
    doc.setFillColor(255,255,255); doc.rect(cx,y,col3,fH,"F"); doc.setDrawColor(190,190,190); doc.rect(cx,y,col3,fH)
    doc.setFont("helvetica","normal"); doc.setFontSize(7); doc.setTextColor(0,0,0)
    doc.text(vLines, cx+2, y+4)
    if(i===2) y += fH
  })

  // OBJETIVO / ESTRATEGIA
  const col2 = (W-MARGEN*2)/2
  ;[["Objetivo:",f.objetivo],["Estrategia:",f.estrategia]].forEach(([label,val],i)=>{
    const cx = MARGEN+i*col2
    doc.setFillColor(200,200,200); doc.rect(cx,y,col2,5,"F"); doc.setDrawColor(190,190,190); doc.rect(cx,y,col2,5)
    doc.setFont("helvetica","bold"); doc.setFontSize(7); doc.setTextColor(50,50,50)
    doc.text(label, cx+2, y+3.5)
  })
  y += 5
  const objLines = doc.splitTextToSize(f.objetivo||"-", col2-4)
  const estLines = doc.splitTextToSize(f.estrategia||"-", col2-4)
  const h2 = Math.max(objLines.length, estLines.length)*4+3
  ;[objLines, estLines].forEach((lines,i)=>{
    const cx = MARGEN+i*col2
    doc.setFillColor(255,255,255); doc.rect(cx,y,col2,h2,"F"); doc.setDrawColor(190,190,190); doc.rect(cx,y,col2,h2)
    doc.setFont("helvetica","normal"); doc.setFontSize(7); doc.setTextColor(0,0,0)
    doc.text(lines, cx+2, y+4)
  })
  y += h2+3

  // CLASIFICACIÓN (tipo eval / periodicidad / tipo indicador / informe / producto)
  const cols5 = (W-MARGEN*2)/5
  const clasi = [
    ["Tipo Evaluación", f.tipo_evaluacion||"-"],
    ["Periodicidad", f.periodicidad||"-"],
    ["Tipo Indicador", f.tipo_indicador||"-"],
    ["Inf. Gobierno", f.informe_gobierno?"Sí":"No"],
    ["Producto", f.producto?"Sí":"No"],
  ]
  clasi.forEach(([label,val],i)=>{
    const cx = MARGEN+i*cols5
    doc.setFillColor(50,50,50); doc.rect(cx,y,cols5,5,"F"); doc.setDrawColor(80,80,80); doc.rect(cx,y,cols5,5)
    doc.setFont("helvetica","bold"); doc.setFontSize(6); doc.setTextColor(255,255,255)
    doc.text(label, cx+cols5/2, y+3.5, {align:"center"})
  })
  y += 5
  clasi.forEach(([,val],i)=>{
    const cx = MARGEN+i*cols5
    doc.setFillColor(245,245,245); doc.rect(cx,y,cols5,6,"F"); doc.setDrawColor(190,190,190); doc.rect(cx,y,cols5,6)
    doc.setFont("helvetica","bold"); doc.setFontSize(8); doc.setTextColor(0,0,0)
    doc.text(val, cx+cols5/2, y+4.2, {align:"center"})
  })
  y += 6+3

  // VALORES (año base / valor año base / valor mínimo / valor inicial / avance / meta / trianual)
  const cols7 = (W-MARGEN*2)/7
  const valHdrs = ["Año base","Val. año base","Val. inicial","Val. mínimo","Meta anual","Trianual","Avance anual"]
  const valDats = [f.anio_base, f.valor_anio_base, f.valor_inicial, f.valor_minimo, f.meta_anual, f.meta_trianual, f.avance_anual]
  valHdrs.forEach((h,i)=>{
    const cx = MARGEN+i*cols7
    doc.setFillColor(40,40,40); doc.rect(cx,y,cols7,5,"F"); doc.setDrawColor(80,80,80); doc.rect(cx,y,cols7,5)
    doc.setFont("helvetica","bold"); doc.setFontSize(5.5); doc.setTextColor(255,255,255)
    doc.text(h, cx+cols7/2, y+3.5, {align:"center"})
  })
  y += 5
  valDats.forEach((v,i)=>{
    const cx = MARGEN+i*cols7
    const color = [[70,130,180],[150,150,150],[70,130,180],[180,60,60],[210,150,50],[80,80,80],[100,100,100]][i]
    doc.setFillColor(245,245,245); doc.rect(cx,y,cols7,7,"F"); doc.setDrawColor(190,190,190); doc.rect(cx,y,cols7,7)
    doc.setFont("helvetica","bold"); doc.setFontSize(9); doc.setTextColor(...color)
    doc.text(String(v||"-"), cx+cols7/2, y+5, {align:"center"})
  })
  y += 7

  // Gráfica de barras (igual que antes)
  y += 4
  const grafData = [
    {label:"valor inicial", value:Number(f.valor_inicial||0), color:[70,130,180]},
    {label:"avance anual",  value:Number(f.avance_anual||0),  color:[100,100,100]},
    {label:"meta anual",    value:Number(f.meta_anual||0),    color:[210,150,50]},
    {label:"meta trianual", value:Number(f.meta_trianual||0), color:[80,80,80]},
  ]
  const maxV = Math.max(...grafData.map(d=>d.value),1)
  const chartX=20, chartW=W-40, chartH=35, barW=chartW/grafData.length-8
  const chartY = y
  grafData.forEach((d,i)=>{
    const barH=(d.value/maxV)*chartH
    const bx=chartX+i*(chartW/grafData.length)+4
    const by=chartY+chartH-barH
    doc.setFillColor(...d.color); doc.rect(bx,by,barW,barH,"F")
    doc.setFont("helvetica","bold"); doc.setFontSize(8); doc.setTextColor(0,0,0)
    doc.text(String(d.value), bx+barW/2, by-2, {align:"center"})
    doc.setFont("helvetica","normal"); doc.setFontSize(6.5)
    doc.text(d.label, bx+barW/2, chartY+chartH+5, {align:"center"})
  })
  y = chartY+chartH+10

  dibujarPiePagina(doc, W, H, 1, 2)

  // ═══════════════════════════════
  // PÁGINA 2
  // ═══════════════════════════════
  doc.addPage()
  dibujarEncabezado(doc, W)
  y = CONTENT_TOP

  // Subtítulo página 2
  doc.setFillColor(180,140,0)
  doc.rect(MARGEN, y, W-MARGEN*2, 6, "F")
  doc.setTextColor(255,255,255); doc.setFont("helvetica","bold"); doc.setFontSize(8)
  doc.text(`Ficha Técnica — ${f.nombre_indicador||""} (continuación)`, MARGEN+2, y+4.2)
  y += 9

  // CALENDARIZACIÓN + ANÁLISIS CUALITATIVO (lado a lado)
  const calW = 72
  const analX = MARGEN+calW+2
  const analW = W-MARGEN*2-calW-2
  const startY2 = y

  // Header calendarización
  doc.setFillColor(50,50,50); doc.rect(MARGEN,y,calW,6,"F")
  doc.setTextColor(255,255,255); doc.setFont("helvetica","bold"); doc.setFontSize(7.5)
  doc.text("Calendarización", MARGEN+calW/2, y+4, {align:"center"})
  y += 6

  // Sub-headers
  const mW = calW/3
  ;[["Meses",0],["Programado",mW],["Real",mW*2]].forEach(([h,ox])=>{
    doc.setFillColor(180,180,180); doc.rect(MARGEN+ox,y,mW,4.5,"F")
    doc.setDrawColor(150,150,150); doc.rect(MARGEN+ox,y,mW,4.5)
    doc.setFont("helvetica","bold"); doc.setFontSize(6.5); doc.setTextColor(40,40,40)
    doc.text(h, MARGEN+ox+mW/2, y+3.2, {align:"center"})
  })
  y += 4.5

  const cal = typeof f.calendarizacion==="string" ? JSON.parse(f.calendarizacion||"{}") : (f.calendarizacion||{})
  MESES.forEach((mes, idx)=>{
    const key = mes.toLowerCase()
    const prog = cal[key]?.programado||""
    const real = cal[key]?.real||""
    const bg = idx%2===0 ? [255,255,255] : [248,248,248]
    doc.setFillColor(...bg)
    ;[0,mW,mW*2].forEach(ox=>{ doc.rect(MARGEN+ox,y,mW,4.5,"F"); doc.setDrawColor(200,200,200); doc.rect(MARGEN+ox,y,mW,4.5) })
    doc.setFont("helvetica","normal"); doc.setFontSize(7); doc.setTextColor(0,0,0)
    doc.text(mes, MARGEN+mW/2, y+3.2, {align:"center"})
    if(prog) doc.text(String(prog), MARGEN+mW+mW/2, y+3.2, {align:"center"})
    if(real) doc.text(String(real), MARGEN+mW*2+mW/2, y+3.2, {align:"center"})
    y += 4.5
  })

  const endCalY = y
  const calBlockH = endCalY-startY2

  // ANÁLISIS CUALITATIVO (a la derecha de calendarización)
  doc.setFillColor(50,50,50); doc.rect(analX,startY2,analW,6,"F")
  doc.setTextColor(255,255,255); doc.setFont("helvetica","bold"); doc.setFontSize(7.5)
  doc.text("Análisis Cualitativo", analX+analW/2, startY2+4, {align:"center"})
  doc.setFillColor(255,255,255); doc.rect(analX,startY2+6,analW,calBlockH-6,"F")
  doc.setDrawColor(190,190,190); doc.rect(analX,startY2,analW,calBlockH)
  if(f.analisis_cualitativo){
    doc.setFont("helvetica","normal"); doc.setFontSize(7.5); doc.setTextColor(0,0,0)
    const aLines = doc.splitTextToSize(f.analisis_cualitativo, analW-4)
    doc.text(aLines, analX+2, startY2+11)
  }

  y = endCalY+4

  // UNIDAD ADMINISTRATIVA
  const cols4u = (W-MARGEN*2)/4
  const admHdrs = ["Unidad Administrativa","Responsable","Correo electrónico","Teléfono y Ext."]
  const admVals = [f.dependencia_nombre, f.responsable, f.correo_electronico, f.telefono]
  admHdrs.forEach((h,i)=>{
    const cx=MARGEN+i*cols4u
    doc.setFillColor(180,180,180); doc.rect(cx,y,cols4u,5,"F"); doc.setDrawColor(160,160,160); doc.rect(cx,y,cols4u,5)
    doc.setFont("helvetica","bold"); doc.setFontSize(6.5); doc.setTextColor(40,40,40)
    doc.text(h, cx+2, y+3.5)
  })
  y += 5
  admVals.forEach((v,i)=>{
    const cx=MARGEN+i*cols4u
    doc.setFillColor(255,255,255); doc.rect(cx,y,cols4u,7,"F"); doc.setDrawColor(190,190,190); doc.rect(cx,y,cols4u,7)
    doc.setFont("helvetica","normal"); doc.setFontSize(7.5); doc.setTextColor(0,0,0)
    const txt = doc.splitTextToSize(v||"-", cols4u-3)
    doc.text(txt[0]||"-", cx+2, y+4.5)
  })
  y += 7+4

  // TABLA CREAM
  const creamCols = 6
  const tipoW = 32
  const cremW = (W-MARGEN*2-tipoW)/creamCols
  const cremLabels = ["Claro","Relevante","Económico","Monitoreable","Adecuado","Aportación marginal"]
  const cremFields = ["criterio_claro","criterio_relevante","criterio_economico","criterio_monitoreable","criterio_adecuado","criterio_aportacion"]

  // Header
  doc.setFillColor(180,140,0); doc.rect(MARGEN,y,tipoW,10,"F"); doc.setDrawColor(160,140,0); doc.rect(MARGEN,y,tipoW,10)
  doc.setFont("helvetica","bold"); doc.setFontSize(7); doc.setTextColor(255,255,255)
  doc.text("Tipo de", MARGEN+tipoW/2, y+4, {align:"center"})
  doc.text("indicador", MARGEN+tipoW/2, y+8, {align:"center"})

  cremLabels.forEach((h,i)=>{
    const cx=MARGEN+tipoW+i*cremW
    doc.setFillColor(40,120,40); doc.rect(cx,y,cremW,5,"F"); doc.setDrawColor(30,100,30); doc.rect(cx,y,cremW,5)
    doc.setFont("helvetica","bold"); doc.setFontSize(6); doc.setTextColor(255,255,255)
    doc.text(h, cx+cremW/2, y+3.5, {align:"center"})
  })
  y += 5

  // Fila valores
  doc.setFillColor(255,220,80); doc.rect(MARGEN,y,tipoW,5,"F"); doc.setDrawColor(160,140,0); doc.rect(MARGEN,y,tipoW,5)
  doc.setFont("helvetica","bold"); doc.setFontSize(7); doc.setTextColor(100,60,0)
  doc.text(f.tipo_indicador||"Estratégico", MARGEN+tipoW/2, y+3.5, {align:"center"})

  cremFields.forEach((campo,i)=>{
    const cx=MARGEN+tipoW+i*cremW
    const esOk = f[campo]!==false
    doc.setFillColor(...(esOk?[220,255,220]:[255,220,220]))
    doc.rect(cx,y,cremW,5,"F"); doc.setDrawColor(190,190,190); doc.rect(cx,y,cremW,5)
    doc.setFont("helvetica","bold"); doc.setFontSize(8)
    doc.setTextColor(...(esOk?[0,120,0]:[180,0,0]))
    doc.text(esOk?"SI":"NO", cx+cremW/2, y+3.5, {align:"center"})
  })
  y += 5+10

  // FIRMAS
  const firmaY = Math.min(y, H-40)
  doc.setDrawColor(80,80,80); doc.setLineWidth(0.4)
  doc.line(MARGEN+10, firmaY, MARGEN+65, firmaY)
  doc.line(W-MARGEN-65, firmaY, W-MARGEN-10, firmaY)
  doc.setFont("helvetica","bold"); doc.setFontSize(8); doc.setTextColor(0,0,0)
  doc.text(f.responsable||f.enlace||"Elaboró", MARGEN+37, firmaY+5, {align:"center"})
  doc.text(f.titular||"Vo. Bo.", W-MARGEN-37, firmaY+5, {align:"center"})
  doc.setFont("helvetica","normal"); doc.setFontSize(7); doc.setTextColor(100,100,100)
  doc.text("Responsable / Enlace", MARGEN+37, firmaY+9, {align:"center"})
  doc.text("Titular", W-MARGEN-37, firmaY+9, {align:"center"})

  dibujarPiePagina(doc, W, H, 2, 2)

  doc.save(`FichaTecnica_${(f.nombre_indicador||"ficha").replace(/ /g,"_")}_${f.anio||""}.pdf`)
}

export const exportarFichaExcel = async (f) => {
  const ExcelJS = (await import("exceljs")).default
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet("Ficha Técnica")

  const dorado  = { type:"pattern", pattern:"solid", fgColor:{ argb:"FFB48C00" } }
  const grisOsc = { type:"pattern", pattern:"solid", fgColor:{ argb:"FF323232" } }
  const grisM   = { type:"pattern", pattern:"solid", fgColor:{ argb:"FFB0B0B0" } }
  const grisL   = { type:"pattern", pattern:"solid", fgColor:{ argb:"FFE6E6E6" } }
  const blanco  = { type:"pattern", pattern:"solid", fgColor:{ argb:"FFFFFFFF" } }
  const verde   = { type:"pattern", pattern:"solid", fgColor:{ argb:"FF287828" } }
  const verdeL  = { type:"pattern", pattern:"solid", fgColor:{ argb:"FFD4FFD4" } }
  const rojoL   = { type:"pattern", pattern:"solid", fgColor:{ argb:"FFFFD4D4" } }
  const bWhite  = { bold:true, color:{ argb:"FFFFFFFF" } }
  const bold    = { bold:true }
  const center  = { horizontal:"center", vertical:"middle", wrapText:true }
  const wrap    = { wrapText:true, vertical:"top" }

  ws.columns = [
    {width:22},{width:28},{width:18},{width:18},{width:18},{width:18},{width:18}
  ]

  let r = 1

  // Fila 1: Encabezado institucional
  ws.mergeCells(`A${r}:D${r}`)
  ws.getCell(`A${r}`).value = "TUXTLA GUTIÉRREZ — AYUNTAMIENTO 2024-2027 | SECRETARÍA DE PLANEACIÓN"
  ws.getCell(`A${r}`).fill = dorado; ws.getCell(`A${r}`).font = bWhite; ws.getCell(`A${r}`).alignment = center
  ws.mergeCells(`E${r}:G${r}`)
  ws.getCell(`E${r}`).value = "SISTEMA DE PLANEACIÓN MUNICIPAL\nIndicadores del PMD 2024-2027"
  ws.getCell(`E${r}`).fill = grisOsc; ws.getCell(`E${r}`).font = bWhite; ws.getCell(`E${r}`).alignment = center
  ws.getRow(r).height = 24; r++

  // Subtítulo
  ws.mergeCells(`A${r}:G${r}`)
  ws.getCell(`A${r}`).value = "Ficha Técnica de Indicadores"
  ws.getCell(`A${r}`).fill = dorado; ws.getCell(`A${r}`).font = {...bWhite, size:11}; ws.getCell(`A${r}`).alignment = center
  ws.getRow(r).height = 18; r++

  // Campos básicos
  const basicos = [
    ["Nombre",f.nombre_indicador],["Definición",f.definicion],
    ["Propósito",f.proposito],["Fórmula",f.formula],
    ["Unidad de medida",f.unidad_medida],
    ["Medios de verificación",f.medios_verificacion],
    ["Supuestos",f.supuestos],
  ]
  basicos.forEach(([label,val])=>{
    ws.mergeCells(`B${r}:G${r}`)
    ws.getCell(`A${r}`).value=label; ws.getCell(`A${r}`).fill=grisL; ws.getCell(`A${r}`).font=bold
    ws.getCell(`B${r}`).value=val||"-"; ws.getCell(`B${r}`).alignment=wrap
    ws.getRow(r).height=20; r++
  })
  r++

  // Alineación
  ws.mergeCells(`A${r}:G${r}`)
  ws.getCell(`A${r}`).value="Alineación Estratégica"
  ws.getCell(`A${r}`).fill=grisOsc; ws.getCell(`A${r}`).font=bWhite; ws.getCell(`A${r}`).alignment=center
  ws.getRow(r).height=14; r++

  ;[["Eje",f.eje,"A","D"],["Tema",f.tema,"E","G"]].forEach(([label,val,c1,c2])=>{
    ws.getCell(`${c1}${r}`).value=label; ws.getCell(`${c1}${r}`).fill=grisL; ws.getCell(`${c1}${r}`).font=bold
    ws.mergeCells(`${String.fromCharCode(c1.charCodeAt(0)+1)}${r}:${c2}${r}`)
    ws.getCell(`${String.fromCharCode(c1.charCodeAt(0)+1)}${r}`).value=val||"-"; ws.getCell(`${String.fromCharCode(c1.charCodeAt(0)+1)}${r}`).alignment=wrap
  }); r++

  ws.getCell(`A${r}`).value="Política Pública"; ws.getCell(`A${r}`).fill=grisL; ws.getCell(`A${r}`).font=bold
  ws.mergeCells(`B${r}:G${r}`); ws.getCell(`B${r}`).value=f.politica_publica||"-"; ws.getCell(`B${r}`).alignment=wrap; r++
  ws.getCell(`A${r}`).value="Objetivo"; ws.getCell(`A${r}`).fill=grisL; ws.getCell(`A${r}`).font=bold
  ws.mergeCells(`B${r}:G${r}`); ws.getCell(`B${r}`).value=f.objetivo||"-"; ws.getCell(`B${r}`).alignment=wrap; ws.getRow(r).height=24; r++
  ws.getCell(`A${r}`).value="Estrategia"; ws.getCell(`A${r}`).fill=grisL; ws.getCell(`A${r}`).font=bold
  ws.mergeCells(`B${r}:G${r}`); ws.getCell(`B${r}`).value=f.estrategia||"-"; ws.getCell(`B${r}`).alignment=wrap; ws.getRow(r).height=24; r++
  r++

  // Clasificación
  ;[["Tipo Evaluación",f.tipo_evaluacion,"A","B"],["Periodicidad",f.periodicidad,"C","D"],["Tipo Indicador",f.tipo_indicador,"E","F"],["Inf.Gobierno",f.informe_gobierno?"Sí":"No","G","G"]].forEach(([label,val,c1,c2])=>{
    ws.getCell(`${c1}${r}`).value=label; ws.getCell(`${c1}${r}`).fill=grisOsc; ws.getCell(`${c1}${r}`).font=bWhite; ws.getCell(`${c1}${r}`).alignment=center
    if(c1!==c2){ ws.mergeCells(`${c1}${r}:${c2}${r}`) }
  }); r++
  ;[[f.tipo_evaluacion,"A","B"],[f.periodicidad,"C","D"],[f.tipo_indicador,"E","F"],[f.informe_gobierno?"Sí":"No","G","G"]].forEach(([val,c1,c2])=>{
    if(c1!==c2) ws.mergeCells(`${c1}${r}:${c2}${r}`)
    ws.getCell(`${c1}${r}`).value=val||"-"; ws.getCell(`${c1}${r}`).fill=grisL; ws.getCell(`${c1}${r}`).font=bold; ws.getCell(`${c1}${r}`).alignment=center
  }); r++; r++

  // Valores
  const vHdrs=["Año base","Val.año base","Val.inicial","Val.mínimo","Meta anual","Trianual","Avance anual"]
  const vVals=[f.anio_base,f.valor_anio_base,f.valor_inicial,f.valor_minimo,f.meta_anual,f.meta_trianual,f.avance_anual]
  const cols=["A","B","C","D","E","F","G"]
  vHdrs.forEach((h,i)=>{ ws.getCell(`${cols[i]}${r}`).value=h; ws.getCell(`${cols[i]}${r}`).fill=grisOsc; ws.getCell(`${cols[i]}${r}`).font=bWhite; ws.getCell(`${cols[i]}${r}`).alignment=center }); r++
  vVals.forEach((v,i)=>{ ws.getCell(`${cols[i]}${r}`).value=Number(v)||0; ws.getCell(`${cols[i]}${r}`).fill=grisL; ws.getCell(`${cols[i]}${r}`).font=bold; ws.getCell(`${cols[i]}${r}`).alignment=center }); r++; r++

  // Calendarización
  ws.mergeCells(`A${r}:C${r}`)
  ws.getCell(`A${r}`).value="Calendarización"; ws.getCell(`A${r}`).fill=grisOsc; ws.getCell(`A${r}`).font=bWhite; ws.getCell(`A${r}`).alignment=center
  ws.mergeCells(`D${r}:G${r}`)
  ws.getCell(`D${r}`).value="Análisis Cualitativo"; ws.getCell(`D${r}`).fill=grisOsc; ws.getCell(`D${r}`).font=bWhite; ws.getCell(`D${r}`).alignment=center
  ws.getRow(r).height=14; r++

  ;["Mes","Programado","Real"].forEach((h,i)=>{ ws.getCell(`${["A","B","C"][i]}${r}`).value=h; ws.getCell(`${["A","B","C"][i]}${r}`).fill=grisM; ws.getCell(`${["A","B","C"][i]}${r}`).font=bold; ws.getCell(`${["A","B","C"][i]}${r}`).alignment=center })
  const analStartRow = r
  r++

  const calData = typeof f.calendarizacion==="string" ? JSON.parse(f.calendarizacion||"{}") : (f.calendarizacion||{})
  ;["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"].forEach((mes,idx)=>{
    const key=mes.toLowerCase()
    ws.getCell(`A${r}`).value=mes; ws.getCell(`A${r}`).fill=idx%2===0?blanco:grisL
    ws.getCell(`B${r}`).value=calData[key]?.programado||""
    ws.getCell(`C${r}`).value=calData[key]?.real||""
    r++
  })

  ws.mergeCells(`D${analStartRow}:G${analStartRow+12}`)
  ws.getCell(`D${analStartRow}`).value=f.analisis_cualitativo||"-"
  ws.getCell(`D${analStartRow}`).alignment={wrapText:true,vertical:"top"}
  r++

  // Unidad administrativa
  ;["Unidad Administrativa","Responsable","Correo","Teléfono"].forEach((h,i)=>{ ws.getCell(`${["A","B","C","D"][i]}${r}`).value=h; ws.getCell(`${["A","B","C","D"][i]}${r}`).fill=grisM; ws.getCell(`${["A","B","C","D"][i]}${r}`).font=bold }); r++
  ;[f.dependencia_nombre,f.responsable,f.correo_electronico,f.telefono].forEach((v,i)=>{ ws.getCell(`${["A","B","C","D"][i]}${r}`).value=v||"-"; ws.getCell(`${["A","B","C","D"][i]}${r}`).alignment=wrap }); r++; r++

  // CREAM
  ;["Tipo Indicador","Claro","Relevante","Económico","Monitoreable","Adecuado","Aportación"].forEach((h,i)=>{ ws.getCell(`${cols[i]}${r}`).value=h; ws.getCell(`${cols[i]}${r}`).fill=verde; ws.getCell(`${cols[i]}${r}`).font=bWhite; ws.getCell(`${cols[i]}${r}`).alignment=center }); r++
  const cFields=["criterio_claro","criterio_relevante","criterio_economico","criterio_monitoreable","criterio_adecuado","criterio_aportacion"]
  ws.getCell(`A${r}`).value=f.tipo_indicador||"Estratégico"; ws.getCell(`A${r}`).fill=dorado; ws.getCell(`A${r}`).font=bold; ws.getCell(`A${r}`).alignment=center
  cFields.forEach((c,i)=>{ const ok=f[c]!==false; ws.getCell(`${cols[i+1]}${r}`).value=ok?"SI":"NO"; ws.getCell(`${cols[i+1]}${r}`).fill=ok?verdeL:rojoL; ws.getCell(`${cols[i+1]}${r}`).font={bold:true,color:{argb:ok?"FF166534":"FF991B1B"}}; ws.getCell(`${cols[i+1]}${r}`).alignment=center }); r++; r++

  // Footer en Excel
  ws.mergeCells(`A${r}:G${r}`)
  ws.getCell(`A${r}`).value="¡Qué viva Tuxtla! — Sistema de Planeación Municipal"
  ws.getCell(`A${r}`).fill=dorado; ws.getCell(`A${r}`).font={...bWhite, size:11}; ws.getCell(`A${r}`).alignment=center
  ws.getRow(r).height=18

  const buf = await wb.xlsx.writeBuffer()
  const blob = new Blob([buf],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"})
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href=url; a.download=`FichaTecnica_${(f.nombre_indicador||"ficha").replace(/ /g,"_")}_${f.anio||""}.xlsx`; a.click()
  URL.revokeObjectURL(url)
}