import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]

// ═══════════════════════════════════════════════════════════════════
// LOGOS EN BASE64
// Para agregar tus logos reales:
//   1. Entra a: https://www.base64-image.de/
//   2. Sube la imagen (PNG recomendado)
//   3. Copia el string completo que empieza con "data:image/png;base64,..."
//   4. Pégalo en la variable correspondiente
// ═══════════════════════════════════════════════════════════════════
const LOGO_ESCUDO_B64 = ""      // ← Pega aquí el base64 del escudo/logo izquierdo
const LOGO_PIE_B64   = ""      // ← Pega aquí el base64 del "¡Qué viva Tuxtla!"

// ── Encabezado institucional (se repite en ambas páginas) ──
const dibujarEncabezado = (doc, W) => {
  doc.setFillColor(255,255,255)
  doc.rect(0, 0, W, 28, "F")

  // Logo escudo (izquierda)
  if (LOGO_ESCUDO_B64) {
    doc.addImage(LOGO_ESCUDO_B64, "PNG", 4, 2, 22, 22)
  } else {
    doc.setFillColor(245,242,235); doc.circle(13, 13, 10, "F")
    doc.setDrawColor(140,110,0); doc.setLineWidth(0.5); doc.circle(13, 13, 10, "S")
    doc.setFont("helvetica","bold"); doc.setFontSize(4); doc.setTextColor(100,80,0)
    doc.text("TUCHTLAN", 13, 9, {align:"center"})
    doc.setFontSize(5); doc.text("☆ ☆ ☆", 13, 13, {align:"center"})
    doc.setFontSize(3.5); doc.text("CHIAPAS", 13, 18, {align:"center"})
    doc.setLineWidth(0.2)
  }

  // Separador vertical dorado
  doc.setDrawColor(180,140,0); doc.setLineWidth(0.7)
  doc.line(56, 5, 56, 23); doc.setLineWidth(0.2)

  // "TUXTLA GUTIÉRREZ"
  doc.setFont("helvetica","bold"); doc.setFontSize(11.5); doc.setTextColor(180,140,0)
  doc.text("TUXTLA GUTIÉRREZ", 26, 13)
  doc.setFont("helvetica","normal"); doc.setFontSize(7); doc.setTextColor(60,60,60)
  doc.text("AYUNTAMIENTO 2024-2027", 26, 19)

  // "SECRETARÍA DE PLANEACIÓN"
  doc.setFont("helvetica","normal"); doc.setFontSize(7); doc.setTextColor(110,110,110)
  doc.text("SECRETARÍA DE", 59, 11)
  doc.setFont("helvetica","bold"); doc.setFontSize(9.5); doc.setTextColor(180,140,0)
  doc.text("PLANEACIÓN", 59, 18)

  // Badge oscuro derecha
  doc.setFillColor(85,85,85)
  doc.roundedRect(W-70, 4, 64, 17, 2, 2, "F")
  doc.setTextColor(255,255,255)
  doc.setFont("helvetica","bold"); doc.setFontSize(6.5)
  doc.text("SISTEMA DE PLANEACIÓN MUNICIPAL", W-38, 12, {align:"center"})
  doc.setFont("helvetica","normal"); doc.setFontSize(5.5)
  doc.text("Indicadores del PMD 2024-2027", W-38, 18, {align:"center"})

  // Línea dorada
  doc.setFillColor(180,140,0); doc.rect(0, 28, W, 1.2, "F")
}

// ── Pie de página (se repite en ambas páginas) ──
const dibujarPie = (doc, W, H, nPag, totalPag) => {
  const py = H - 20
  doc.setDrawColor(200,200,200); doc.line(8, py, W-8, py)

  if (LOGO_PIE_B64) {
    // Si tienes la imagen del logo pie, se centra
    doc.addImage(LOGO_PIE_B64, "PNG", W/2-28, py+2, 56, 14)
  } else {
    // Simulación del logo "¡Qué viva Tuxtla!"
    doc.setFont("helvetica","bold"); doc.setFontSize(9); doc.setTextColor(180,140,0)
    doc.text("¡Qué viva", W/2-22, py+9)
    doc.setFontSize(14); doc.setTextColor(0,0,0)
    doc.text("Tuxtla!", W/2, py+9)
    // Punto decorativo naranja simulando el conejo
    doc.setFontSize(10); doc.setTextColor(200,100,0)
    doc.text("●", W/2+19, py+7)
  }

  doc.setFont("helvetica","normal"); doc.setFontSize(6.5); doc.setTextColor(160,160,160)
  doc.text("Ficha Técnica de Indicadores", 10, py+11)
  doc.text(`Página ${nPag} de ${totalPag}`, W-10, py+11, {align:"right"})
}

export const exportarFichaPDF = (f) => {
  const doc  = new jsPDF({ orientation:"portrait", unit:"mm", format:"letter" })
  const W    = doc.internal.pageSize.width    // 215.9 mm
  const H    = doc.internal.pageSize.height   // 279.4 mm
  const M    = 8
  const TOP  = 32

  // ════════════════════════════════════════════════════
  // PÁGINA 1 — Ficha completa (igual a tu imagen 1)
  // ════════════════════════════════════════════════════
  dibujarEncabezado(doc, W)
  let y = TOP

  // Barra dorada "Ficha Técnica de Indicadores"
  doc.setFillColor(180,140,0); doc.rect(M, y, W-M*2, 5.5, "F")
  doc.setTextColor(255,255,255); doc.setFont("helvetica","bold"); doc.setFontSize(8)
  doc.text("Ficha Técnica de Indicadores", M+2, y+3.8)
  y += 6.5

  // ─ Helper fila label | valor ─
  const fila = (label, valor, lbW = 32, minH = 6) => {
    const lines = doc.splitTextToSize(String(valor||"-"), W-M*2-lbW-2)
    const h = Math.max(minH, lines.length*4+2)
    doc.setFillColor(215,215,215); doc.rect(M, y, lbW, h, "F")
    doc.setFillColor(255,255,255); doc.rect(M+lbW, y, W-M*2-lbW, h, "F")
    doc.setDrawColor(175,175,175); doc.rect(M, y, W-M*2, h); doc.rect(M, y, lbW, h)
    doc.setFont("helvetica","bold"); doc.setFontSize(7); doc.setTextColor(30,30,30)
    doc.text(label, M+1.5, y+h/2+1.2)
    doc.setFont("helvetica","normal"); doc.setFontSize(7.2); doc.setTextColor(0,0,0)
    doc.text(lines, M+lbW+2, y+4.5)
    y += h
  }

  fila("Nombre:", f.nombre_indicador, 32, 7)
  fila("Definición:", f.definicion, 32, 7)
  fila("Propósito:", f.proposito, 32, 7)
  fila("Fórmula:", f.formula, 32, 6)
  fila("Unidad de medida:", f.unidad_medida, 40, 5.5)
  fila("Medios de verificación:", f.medios_verificacion, 40, 5.5)
  fila("Supuesitos:", f.supuestos, 40, 5.5)
  y += 1

  // ─ EJE | TEMA | POLÍTICA PÚBLICA ─
  const c3 = (W-M*2)/3
  ;[["Eje:",0],["Tema:",c3],["Política Pública:",c3*2]].forEach(([lbl,ox])=>{
    doc.setFillColor(185,185,185); doc.rect(M+ox,y,c3,4.5,"F")
    doc.setDrawColor(160,160,160); doc.rect(M+ox,y,c3,4.5)
    doc.setFont("helvetica","bold"); doc.setFontSize(6.8); doc.setTextColor(30,30,30)
    doc.text(lbl, M+ox+2, y+3.2)
  })
  y += 4.5
  const ejeLns = doc.splitTextToSize(f.eje||"-", c3-4)
  const temLns = doc.splitTextToSize(f.tema||"-", c3-4)
  const polLns = doc.splitTextToSize(f.politica_publica||"-", c3-4)
  const h3 = Math.max(ejeLns.length,temLns.length,polLns.length)*4+3
  ;[[ejeLns,0],[temLns,c3],[polLns,c3*2]].forEach(([lines,ox])=>{
    doc.setFillColor(255,255,255); doc.rect(M+ox,y,c3,h3,"F")
    doc.setDrawColor(175,175,175); doc.rect(M+ox,y,c3,h3)
    doc.setFont("helvetica","normal"); doc.setFontSize(7); doc.setTextColor(0,0,0)
    doc.text(lines, M+ox+2, y+4)
  })
  y += h3

  // ─ OBJETIVO | ESTRATEGIA ─
  const c2 = (W-M*2)/2
  ;[["Objetivo:",0],["Estrategia:",c2]].forEach(([lbl,ox])=>{
    doc.setFillColor(185,185,185); doc.rect(M+ox,y,c2,4.5,"F")
    doc.setDrawColor(160,160,160); doc.rect(M+ox,y,c2,4.5)
    doc.setFont("helvetica","bold"); doc.setFontSize(6.8); doc.setTextColor(30,30,30)
    doc.text(lbl, M+ox+2, y+3.2)
  })
  y += 4.5
  const objLns = doc.splitTextToSize(f.objetivo||"-", c2-4)
  const estLns = doc.splitTextToSize(f.estrategia||"-", c2-4)
  const h2v = Math.max(objLns.length,estLns.length)*4+3
  ;[[objLns,0],[estLns,c2]].forEach(([lines,ox])=>{
    doc.setFillColor(255,255,255); doc.rect(M+ox,y,c2,h2v,"F")
    doc.setDrawColor(175,175,175); doc.rect(M+ox,y,c2,h2v)
    doc.setFont("helvetica","normal"); doc.setFontSize(7); doc.setTextColor(0,0,0)
    doc.text(lines, M+ox+2, y+4)
  })
  y += h2v + 1

  // ─ TIPO EVAL | PERIODICIDAD | TIPO IND | INF.GOB (2 filas: header + valor) ─
  const c4 = (W-M*2)/4
  const cl4 = [
    ["Tipo de Evaluación", f.tipo_evaluacion||"-"],
    ["Periodicidad",       f.periodicidad||"-"],
    ["Tipo Indicador",     f.tipo_indicador||"-"],
    ["Informe de Gobierno",f.informe_gobierno?"Sí":"No"],
  ]
  cl4.forEach(([h,],i)=>{
    doc.setFillColor(55,55,55); doc.rect(M+i*c4,y,c4,5,"F")
    doc.setDrawColor(70,70,70); doc.rect(M+i*c4,y,c4,5)
    doc.setFont("helvetica","bold"); doc.setFontSize(6); doc.setTextColor(255,255,255)
    doc.text(h, M+i*c4+c4/2, y+3.4, {align:"center"})
  })
  y += 5
  cl4.forEach(([,v],i)=>{
    doc.setFillColor(248,248,248); doc.rect(M+i*c4,y,c4,5.5,"F")
    doc.setDrawColor(180,180,180); doc.rect(M+i*c4,y,c4,5.5)
    doc.setFont("helvetica","bold"); doc.setFontSize(7.5); doc.setTextColor(0,0,0)
    doc.text(v, M+i*c4+c4/2, y+3.8, {align:"center"})
  })
  y += 5.5

  // ─ AÑO BASE | VAL AÑO BASE | VAL INICIAL | VAL MÍN | META ANUAL | TRIANUAL ─
  const c6 = (W-M*2)/6
  const v6h = ["Año base","Valor año base","Valor inicial","Valor mínimo","Meta anual","Trianual"]
  const v6d = [f.anio_base, f.valor_anio_base, f.valor_inicial, f.valor_minimo, f.meta_anual, f.meta_trianual]
  v6h.forEach((h,i)=>{
    doc.setFillColor(40,40,40); doc.rect(M+i*c6,y,c6,5,"F")
    doc.setDrawColor(55,55,55); doc.rect(M+i*c6,y,c6,5)
    doc.setFont("helvetica","bold"); doc.setFontSize(5.8); doc.setTextColor(255,255,255)
    doc.text(h, M+i*c6+c6/2, y+3.5, {align:"center"})
  })
  y += 5
  v6d.forEach((v,i)=>{
    doc.setFillColor(248,248,248); doc.rect(M+i*c6,y,c6,6,"F")
    doc.setDrawColor(175,175,175); doc.rect(M+i*c6,y,c6,6)
    doc.setFont("helvetica","bold"); doc.setFontSize(9); doc.setTextColor(0,0,0)
    doc.text(String(v||"-"), M+i*c6+c6/2, y+4.5, {align:"center"})
  })
  y += 6 + 1

  // ─ CALENDARIZACIÓN (izq) + ANÁLISIS CUALITATIVO (der) ─
  const calW = 67
  const anaX = M+calW+1
  const anaW = W-M*2-calW-1
  const startCal = y

  doc.setFillColor(50,50,50); doc.rect(M,y,calW,5.5,"F")
  doc.setTextColor(255,255,255); doc.setFont("helvetica","bold"); doc.setFontSize(7.5)
  doc.text("Calendarización", M+calW/2, y+3.8, {align:"center"})
  y += 5.5

  const mW = calW/3
  ;[["Meses",0],["Programado",mW],["Real",mW*2]].forEach(([h,ox])=>{
    doc.setFillColor(155,155,155); doc.rect(M+ox,y,mW,4,"F")
    doc.setDrawColor(135,135,135); doc.rect(M+ox,y,mW,4)
    doc.setFont("helvetica","bold"); doc.setFontSize(6); doc.setTextColor(20,20,20)
    doc.text(h, M+ox+mW/2, y+2.9, {align:"center"})
  })
  y += 4

  const cal = typeof f.calendarizacion==="string" ? JSON.parse(f.calendarizacion||"{}") : (f.calendarizacion||{})
  const rH = 4.2
  MESES.forEach((mes,idx)=>{
    const k = mes.toLowerCase()
    const bg = idx%2===0 ? [255,255,255] : [245,245,245]
    doc.setFillColor(...bg)
    ;[0,mW,mW*2].forEach(ox=>{
      doc.rect(M+ox,y,mW,rH,"F")
      doc.setDrawColor(185,185,185); doc.rect(M+ox,y,mW,rH)
    })
    doc.setFont("helvetica","normal"); doc.setFontSize(6.8); doc.setTextColor(0,0,0)
    doc.text(mes, M+mW/2, y+rH-1, {align:"center"})
    const prog = cal[k]?.programado||""
    const real = cal[k]?.real||""
    if(prog) doc.text(String(prog), M+mW+mW/2, y+rH-1, {align:"center"})
    if(real) doc.text(String(real), M+mW*2+mW/2, y+rH-1, {align:"center"})
    y += rH
  })
  const endCal = y

  // Análisis cualitativo (derecha, misma altura)
  const anaH = endCal - startCal
  doc.setFillColor(50,50,50); doc.rect(anaX,startCal,anaW,5.5,"F")
  doc.setTextColor(255,255,255); doc.setFont("helvetica","bold"); doc.setFontSize(7.5)
  doc.text("Análisis Cualitativo", anaX+anaW/2, startCal+3.8, {align:"center"})
  doc.setFillColor(255,255,255); doc.rect(anaX,startCal+5.5,anaW,anaH-5.5,"F")
  doc.setDrawColor(175,175,175); doc.rect(anaX,startCal,anaW,anaH)
  if(f.analisis_cualitativo){
    doc.setFont("helvetica","normal"); doc.setFontSize(7); doc.setTextColor(0,0,0)
    const aLns = doc.splitTextToSize(f.analisis_cualitativo, anaW-4)
    doc.text(aLns, anaX+2, startCal+10)
  }
  y = endCal+2

  // ─ UNIDAD ADMINISTRATIVA ─
  const uW = (W-M*2)/4
  const uH = ["Unidad Administrativa","Responsable","Correo electrónico","Teléfono y Ext."]
  const uV = [f.dependencia_nombre, f.responsable, f.correo_electronico, f.telefono]
  uH.forEach((h,i)=>{
    doc.setFillColor(165,165,165); doc.rect(M+i*uW,y,uW,4.5,"F")
    doc.setDrawColor(145,145,145); doc.rect(M+i*uW,y,uW,4.5)
    doc.setFont("helvetica","bold"); doc.setFontSize(6); doc.setTextColor(20,20,20)
    doc.text(h, M+i*uW+1.5, y+3.2)
  })
  y += 4.5
  uV.forEach((v,i)=>{
    doc.setFillColor(255,255,255); doc.rect(M+i*uW,y,uW,6,"F")
    doc.setDrawColor(175,175,175); doc.rect(M+i*uW,y,uW,6)
    doc.setFont("helvetica","normal"); doc.setFontSize(7); doc.setTextColor(0,0,0)
    const t = doc.splitTextToSize(v||"-", uW-3)
    doc.text(t[0]||"-", M+i*uW+2, y+4)
  })
  y += 6+4

  // ─ TABLA CREAM ─
  const tipoW = 30
  const cW = (W-M*2-tipoW)/6
  const cLbls = ["Claro","Relevante","Económico","Monitoreable","Adecuado","Aportación marginal"]
  const cFlds = ["criterio_claro","criterio_relevante","criterio_economico","criterio_monitoreable","criterio_adecuado","criterio_aportacion"]

  // Header dorado "Tipo de indicador"
  doc.setFillColor(180,140,0); doc.rect(M,y,tipoW,10,"F")
  doc.setDrawColor(150,115,0); doc.rect(M,y,tipoW,10)
  doc.setFont("helvetica","bold"); doc.setFontSize(6.5); doc.setTextColor(255,255,255)
  doc.text("Tipo de", M+tipoW/2, y+4, {align:"center"})
  doc.text("indicador", M+tipoW/2, y+8, {align:"center"})

  cLbls.forEach((h,i)=>{
    doc.setFillColor(28,105,28); doc.rect(M+tipoW+i*cW,y,cW,5,"F")
    doc.setDrawColor(20,85,20); doc.rect(M+tipoW+i*cW,y,cW,5)
    doc.setFont("helvetica","bold"); doc.setFontSize(5.8); doc.setTextColor(255,255,255)
    doc.text(h, M+tipoW+i*cW+cW/2, y+3.5, {align:"center"})
  })
  y += 5

  doc.setFillColor(255,210,50); doc.rect(M,y,tipoW,5,"F")
  doc.setDrawColor(150,115,0); doc.rect(M,y,tipoW,5)
  doc.setFont("helvetica","bold"); doc.setFontSize(6.8); doc.setTextColor(80,50,0)
  doc.text(f.tipo_indicador||"Estratégico", M+tipoW/2, y+3.5, {align:"center"})

  cFlds.forEach((c,i)=>{
    const ok = f[c]!==false
    doc.setFillColor(...(ok?[205,255,205]:[255,205,205]))
    doc.rect(M+tipoW+i*cW,y,cW,5,"F")
    doc.setDrawColor(165,165,165); doc.rect(M+tipoW+i*cW,y,cW,5)
    doc.setFont("helvetica","bold"); doc.setFontSize(8.5)
    doc.setTextColor(...(ok?[0,105,0]:[165,0,0]))
    doc.text(ok?"SI":"NO", M+tipoW+i*cW+cW/2, y+3.5, {align:"center"})
  })

  dibujarPie(doc, W, H, 1, 2)

  // ════════════════════════════════════════════════════
  // PÁGINA 2 — Visual con gráfica (igual a tu imagen 2)
  // ════════════════════════════════════════════════════
  doc.addPage()
  dibujarEncabezado(doc, W)
  y = TOP

  // Barra dorada con nombre del indicador
  doc.setFillColor(180,140,0); doc.rect(M,y,W-M*2,7,"F")
  doc.setTextColor(255,255,255); doc.setFont("helvetica","bold"); doc.setFontSize(9.5)
  doc.text(f.nombre_indicador||"Indicador", W/2, y+5, {align:"center"})
  y += 10

  // Alineación estratégica (label: valor simple)
  const aItems = [
    ["Eje:",              f.eje],
    ["Tema:",             f.tema],
    ["Política Pública:", f.politica_publica],
    ["Objetivo:",         f.objetivo],
    ["Estrategia:",       f.estrategia],
  ]
  const lbAW = 38
  aItems.forEach(([lbl,val])=>{
    const vLns = doc.splitTextToSize(val||"-", W-M*2-lbAW-2)
    const rH = Math.max(5.5, vLns.length*4.2+2)
    doc.setFont("helvetica","bold"); doc.setFontSize(8); doc.setTextColor(30,30,30)
    doc.text(lbl, M, y+rH/2+1)
    doc.setFont("helvetica","normal"); doc.setFontSize(8); doc.setTextColor(0,0,0)
    doc.text(vLns, M+lbAW, y+4.5)
    y += rH
  })
  y += 3

  // Barra dorada "Análisis cualitativo"
  doc.setFillColor(180,140,0); doc.rect(M,y,W-M*2,6,"F")
  doc.setTextColor(255,255,255); doc.setFont("helvetica","bold"); doc.setFontSize(9)
  doc.text("Análisis cualitativo", W/2, y+4.3, {align:"center"})
  y += 8

  // Texto del análisis
  if(f.analisis_cualitativo){
    const aLns = doc.splitTextToSize(f.analisis_cualitativo, W-M*2)
    doc.setFont("helvetica","normal"); doc.setFontSize(8.5); doc.setTextColor(15,15,15)
    doc.text(aLns, M, y)
    y += aLns.length*4.8 + 8
  } else { y += 8 }

  // GRÁFICA DE BARRAS
  const grafData = [
    {label:"valor inicial",  value:Number(f.valor_inicial||0),  color:[70,130,180]},
    {label:"avance anual",   value:Number(f.avance_anual||0),   color:[110,110,110]},
    {label:"meta anual",     value:Number(f.meta_anual||0),     color:[195,150,55]},
    {label:"meta trianual",  value:Number(f.meta_trianual||0),  color:[80,80,80]},
  ]
  const maxV   = Math.max(...grafData.map(d=>d.value), 1)
  const chartX = M+10
  const chartW = W-M*2-20
  const chartH = 55
  const barW   = chartW/grafData.length - 14
  const chartY = y

  grafData.forEach((d,i)=>{
    const barH = (d.value/maxV)*chartH
    const bx   = chartX + i*(chartW/grafData.length) + 7
    const by   = chartY + chartH - barH

    doc.setFillColor(...d.color)
    doc.rect(bx, by, barW, barH, "F")

    // Valor encima
    doc.setFont("helvetica","bold"); doc.setFontSize(9); doc.setTextColor(0,0,0)
    doc.text(String(d.value), bx+barW/2, by-3, {align:"center"})

    // Label debajo (con fondo amarillo excepto el azul, igual que en la imagen)
    const lblY = chartY+chartH+7
    if(i!==0){
      const lw = doc.getTextWidth(d.label)+4
      doc.setFillColor(255,255,150)
      doc.rect(bx+barW/2-lw/2, lblY-4, lw, 5, "F")
    }
    doc.setFont("helvetica","normal"); doc.setFontSize(7.5); doc.setTextColor(0,0,0)
    doc.text(d.label, bx+barW/2, lblY, {align:"center"})
  })

  y = chartY + chartH + 18

  // Tabla: Año | Valor Inicial | Avance anual | Meta anual | Meta trianual
  autoTable(doc, {
    startY: y,
    margin: {left:M, right:M},
    head: [["Año","Valor Inicial","Avance anual","Meta anual","Meta trianual"]],
    body: [[
      f.anio||"-",
      f.valor_inicial||"-",
      f.avance_anual||"-",
      f.meta_anual||"-",
      f.meta_trianual||"-"
    ]],
    styles: { fontSize:9, halign:"center", cellPadding:3 },
    headStyles: { fillColor:[255,255,255], textColor:[0,0,0], fontStyle:"bold", lineWidth:0.35, lineColor:[90,90,90] },
    bodyStyles: { fillColor:[255,255,255], textColor:[0,0,0], lineWidth:0.35, lineColor:[140,140,140] },
  })

  y = doc.lastAutoTable.finalY + 12

  // Info final: Dependencia, Unidad, Medios, Supuestos
  const infoF = [
    ["Dependencia:",          f.dependencia_nombre],
    ["Unidad de medida:",     f.unidad_medida],
    ["Medios de verificación:", f.medios_verificacion],
    ["Supuestos:",            f.supuestos],
  ]
  const lbFW = 52
  infoF.forEach(([lbl,val])=>{
    const vLns = doc.splitTextToSize(val||"-", W-M*2-lbFW-2)
    const rH = Math.max(5, vLns.length*4+2)
    doc.setFont("helvetica","bold"); doc.setFontSize(8); doc.setTextColor(0,0,0)
    doc.text(lbl, M, y+rH/2+1.2)
    doc.setFont("helvetica","normal"); doc.setFontSize(8); doc.setTextColor(30,30,30)
    doc.text(vLns, M+lbFW, y+4.5)
    y += rH
  })

  dibujarPie(doc, W, H, 2, 2)

  doc.save(`FichaTecnica_${(f.nombre_indicador||"ficha").replace(/ /g,"_")}_${f.anio||""}.pdf`)
}

// ══════════════════════════════════════════════════════
// EXCEL — sin cambios
// ══════════════════════════════════════════════════════
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

  ws.columns = [{width:22},{width:28},{width:18},{width:18},{width:18},{width:18},{width:18}]
  let r = 1

  ws.mergeCells(`A${r}:D${r}`)
  ws.getCell(`A${r}`).value = "TUXTLA GUTIÉRREZ — AYUNTAMIENTO 2024-2027 | SECRETARÍA DE PLANEACIÓN"
  ws.getCell(`A${r}`).fill=dorado; ws.getCell(`A${r}`).font=bWhite; ws.getCell(`A${r}`).alignment=center
  ws.mergeCells(`E${r}:G${r}`)
  ws.getCell(`E${r}`).value = "SISTEMA DE PLANEACIÓN MUNICIPAL\nIndicadores del PMD 2024-2027"
  ws.getCell(`E${r}`).fill=grisOsc; ws.getCell(`E${r}`).font=bWhite; ws.getCell(`E${r}`).alignment=center
  ws.getRow(r).height=24; r++

  ws.mergeCells(`A${r}:G${r}`)
  ws.getCell(`A${r}`).value="Ficha Técnica de Indicadores"
  ws.getCell(`A${r}`).fill=dorado; ws.getCell(`A${r}`).font={...bWhite,size:11}; ws.getCell(`A${r}`).alignment=center
  ws.getRow(r).height=18; r++

  const basicos=[["Nombre",f.nombre_indicador],["Definición",f.definicion],["Propósito",f.proposito],
    ["Fórmula",f.formula],["Unidad de medida",f.unidad_medida],["Medios de verificación",f.medios_verificacion],["Supuestos",f.supuestos]]
  basicos.forEach(([label,val])=>{
    ws.mergeCells(`B${r}:G${r}`)
    ws.getCell(`A${r}`).value=label; ws.getCell(`A${r}`).fill=grisL; ws.getCell(`A${r}`).font=bold
    ws.getCell(`B${r}`).value=val||"-"; ws.getCell(`B${r}`).alignment=wrap
    ws.getRow(r).height=20; r++
  })
  r++

  ws.mergeCells(`A${r}:G${r}`)
  ws.getCell(`A${r}`).value="Alineación Estratégica"
  ws.getCell(`A${r}`).fill=grisOsc; ws.getCell(`A${r}`).font=bWhite; ws.getCell(`A${r}`).alignment=center
  ws.getRow(r).height=14; r++

  ;[["Eje",f.eje,"A","D"],["Tema",f.tema,"E","G"]].forEach(([label,val,c1,c2])=>{
    ws.getCell(`${c1}${r}`).value=label; ws.getCell(`${c1}${r}`).fill=grisL; ws.getCell(`${c1}${r}`).font=bold
    ws.mergeCells(`${String.fromCharCode(c1.charCodeAt(0)+1)}${r}:${c2}${r}`)
    ws.getCell(`${String.fromCharCode(c1.charCodeAt(0)+1)}${r}`).value=val||"-"
    ws.getCell(`${String.fromCharCode(c1.charCodeAt(0)+1)}${r}`).alignment=wrap
  }); r++

  ws.getCell(`A${r}`).value="Política Pública"; ws.getCell(`A${r}`).fill=grisL; ws.getCell(`A${r}`).font=bold
  ws.mergeCells(`B${r}:G${r}`); ws.getCell(`B${r}`).value=f.politica_publica||"-"; ws.getCell(`B${r}`).alignment=wrap; r++
  ws.getCell(`A${r}`).value="Objetivo"; ws.getCell(`A${r}`).fill=grisL; ws.getCell(`A${r}`).font=bold
  ws.mergeCells(`B${r}:G${r}`); ws.getCell(`B${r}`).value=f.objetivo||"-"; ws.getCell(`B${r}`).alignment=wrap; ws.getRow(r).height=24; r++
  ws.getCell(`A${r}`).value="Estrategia"; ws.getCell(`A${r}`).fill=grisL; ws.getCell(`A${r}`).font=bold
  ws.mergeCells(`B${r}:G${r}`); ws.getCell(`B${r}`).value=f.estrategia||"-"; ws.getCell(`B${r}`).alignment=wrap; ws.getRow(r).height=24; r++
  r++

  const cols=["A","B","C","D","E","F","G"]
  ;[["Tipo Evaluación",f.tipo_evaluacion,"A","B"],["Periodicidad",f.periodicidad,"C","D"],
    ["Tipo Indicador",f.tipo_indicador,"E","F"],["Inf.Gobierno",f.informe_gobierno?"Sí":"No","G","G"]].forEach(([label,,c1,c2])=>{
    if(c1!==c2) ws.mergeCells(`${c1}${r}:${c2}${r}`)
    ws.getCell(`${c1}${r}`).value=label; ws.getCell(`${c1}${r}`).fill=grisOsc; ws.getCell(`${c1}${r}`).font=bWhite; ws.getCell(`${c1}${r}`).alignment=center
  }); r++
  ;[[f.tipo_evaluacion,"A","B"],[f.periodicidad,"C","D"],[f.tipo_indicador,"E","F"],[f.informe_gobierno?"Sí":"No","G","G"]].forEach(([val,c1,c2])=>{
    if(c1!==c2) ws.mergeCells(`${c1}${r}:${c2}${r}`)
    ws.getCell(`${c1}${r}`).value=val||"-"; ws.getCell(`${c1}${r}`).fill=grisL; ws.getCell(`${c1}${r}`).font=bold; ws.getCell(`${c1}${r}`).alignment=center
  }); r++; r++

  const vHdrs=["Año base","Val.año base","Val.inicial","Val.mínimo","Meta anual","Trianual","Avance anual"]
  const vVals=[f.anio_base,f.valor_anio_base,f.valor_inicial,f.valor_minimo,f.meta_anual,f.meta_trianual,f.avance_anual]
  vHdrs.forEach((h,i)=>{ ws.getCell(`${cols[i]}${r}`).value=h; ws.getCell(`${cols[i]}${r}`).fill=grisOsc; ws.getCell(`${cols[i]}${r}`).font=bWhite; ws.getCell(`${cols[i]}${r}`).alignment=center }); r++
  vVals.forEach((v,i)=>{ ws.getCell(`${cols[i]}${r}`).value=Number(v)||0; ws.getCell(`${cols[i]}${r}`).fill=grisL; ws.getCell(`${cols[i]}${r}`).font=bold; ws.getCell(`${cols[i]}${r}`).alignment=center }); r++; r++

  ws.mergeCells(`A${r}:C${r}`)
  ws.getCell(`A${r}`).value="Calendarización"; ws.getCell(`A${r}`).fill=grisOsc; ws.getCell(`A${r}`).font=bWhite; ws.getCell(`A${r}`).alignment=center
  ws.mergeCells(`D${r}:G${r}`)
  ws.getCell(`D${r}`).value="Análisis Cualitativo"; ws.getCell(`D${r}`).fill=grisOsc; ws.getCell(`D${r}`).font=bWhite; ws.getCell(`D${r}`).alignment=center
  ws.getRow(r).height=14; r++

  ;["Mes","Programado","Real"].forEach((h,i)=>{ ws.getCell(`${["A","B","C"][i]}${r}`).value=h; ws.getCell(`${["A","B","C"][i]}${r}`).fill=grisM; ws.getCell(`${["A","B","C"][i]}${r}`).font=bold; ws.getCell(`${["A","B","C"][i]}${r}`).alignment=center })
  const analStartRow = r; r++

  const calData = typeof f.calendarizacion==="string" ? JSON.parse(f.calendarizacion||"{}") : (f.calendarizacion||{})
  MESES.forEach((mes,idx)=>{
    const k=mes.toLowerCase()
    ws.getCell(`A${r}`).value=mes; ws.getCell(`A${r}`).fill=idx%2===0?blanco:grisL
    ws.getCell(`B${r}`).value=calData[k]?.programado||""
    ws.getCell(`C${r}`).value=calData[k]?.real||""
    r++
  })

  ws.mergeCells(`D${analStartRow}:G${analStartRow+12}`)
  ws.getCell(`D${analStartRow}`).value=f.analisis_cualitativo||"-"
  ws.getCell(`D${analStartRow}`).alignment={wrapText:true,vertical:"top"}
  r++

  ;["Unidad Administrativa","Responsable","Correo","Teléfono"].forEach((h,i)=>{ ws.getCell(`${["A","B","C","D"][i]}${r}`).value=h; ws.getCell(`${["A","B","C","D"][i]}${r}`).fill=grisM; ws.getCell(`${["A","B","C","D"][i]}${r}`).font=bold }); r++
  ;[f.dependencia_nombre,f.responsable,f.correo_electronico,f.telefono].forEach((v,i)=>{ ws.getCell(`${["A","B","C","D"][i]}${r}`).value=v||"-"; ws.getCell(`${["A","B","C","D"][i]}${r}`).alignment=wrap }); r++; r++

  ;["Tipo Indicador","Claro","Relevante","Económico","Monitoreable","Adecuado","Aportación"].forEach((h,i)=>{ ws.getCell(`${cols[i]}${r}`).value=h; ws.getCell(`${cols[i]}${r}`).fill=verde; ws.getCell(`${cols[i]}${r}`).font=bWhite; ws.getCell(`${cols[i]}${r}`).alignment=center }); r++
  const cF=["criterio_claro","criterio_relevante","criterio_economico","criterio_monitoreable","criterio_adecuado","criterio_aportacion"]
  ws.getCell(`A${r}`).value=f.tipo_indicador||"Estratégico"; ws.getCell(`A${r}`).fill=dorado; ws.getCell(`A${r}`).font=bold; ws.getCell(`A${r}`).alignment=center
  cF.forEach((c,i)=>{ const ok=f[c]!==false; ws.getCell(`${cols[i+1]}${r}`).value=ok?"SI":"NO"; ws.getCell(`${cols[i+1]}${r}`).fill=ok?verdeL:rojoL; ws.getCell(`${cols[i+1]}${r}`).font={bold:true,color:{argb:ok?"FF166534":"FF991B1B"}}; ws.getCell(`${cols[i+1]}${r}`).alignment=center }); r++; r++

  ws.mergeCells(`A${r}:G${r}`)
  ws.getCell(`A${r}`).value="¡Qué viva Tuxtla! — Sistema de Planeación Municipal"
  ws.getCell(`A${r}`).fill=dorado; ws.getCell(`A${r}`).font={...bWhite,size:11}; ws.getCell(`A${r}`).alignment=center
  ws.getRow(r).height=18

  const buf = await wb.xlsx.writeBuffer()
  const blob = new Blob([buf],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"})
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href=url; a.download=`FichaTecnica_${(f.nombre_indicador||"ficha").replace(/ /g,"_")}_${f.anio||""}.xlsx`; a.click()
  URL.revokeObjectURL(url)
}