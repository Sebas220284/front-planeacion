import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export const exportarFichaPDF = (ficha) => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" })
  const W = doc.internal.pageSize.width
  let y = 15

  doc.setFillColor(180, 0, 0)
  doc.rect(0, 0, W, 18, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.text("TUXTLA GUTIÉRREZ | SECRETARÍA DE PLANEACIÓN", 14, 8)
  doc.setFontSize(8)
  doc.text("SISTEMA DE PLANEACIÓN MUNICIPAL", W - 14, 8, { align: "right" })
  doc.text("Indicadores del PMD 2024-2027", W - 14, 13, { align: "right" })

  y = 24

  doc.setFillColor(240, 240, 240)
  doc.rect(10, y, W - 20, 8, "F")
  doc.setTextColor(0, 0, 0)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.text(ficha.nombre_indicador || "Sin nombre", W / 2, y + 5.5, { align: "center" })
  y += 12

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  const campos = [
    ["Eje:", ficha.eje || "-"],
    ["Tema:", ficha.tema || "-"],
    ["Política Pública:", ficha.politica_publica || "-"],
    ["Objetivo:", ficha.objetivo || "-"],
    ["Estrategia:", ficha.estrategia || "-"],
  ]
  campos.forEach(([label, valor]) => {
    doc.setFont("helvetica", "bold")
    doc.text(label, 14, y)
    doc.setFont("helvetica", "normal")
    const lines = doc.splitTextToSize(valor, W - 55)
    doc.text(lines, 50, y)
    y += lines.length * 5 + 1
  })

  y += 4

  if (ficha.analisis_cualitativo) {
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.text("Análisis cualitativo", W / 2, y, { align: "center" })
    y += 5
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8.5)
    const lines = doc.splitTextToSize(ficha.analisis_cualitativo, W - 28)
    doc.text(lines, 14, y)
    y += lines.length * 4.5 + 6
  }

  const datos = [
    { label: "valor inicial", value: Number(ficha.valor_inicial || 0), color: [70, 130, 180] },
    { label: "avance anual",  value: Number(ficha.avance_anual  || 0), color: [100, 100, 100] },
    { label: "meta anual",    value: Number(ficha.meta_anual    || 0), color: [210, 150, 50] },
    { label: "meta trianual", value: Number(ficha.meta_trianual || 0), color: [80, 80, 80] },
  ]

  const maxVal = Math.max(...datos.map(d => d.value), 1)
  const chartX = 20
  const chartY = y
  const chartW = W - 40
  const chartH = 45
  const barW = chartW / datos.length - 8

  datos.forEach((d, i) => {
    const barH = (d.value / maxVal) * chartH
    const bx = chartX + i * (chartW / datos.length) + 4
    const by = chartY + chartH - barH

    doc.setFillColor(...d.color)
    doc.rect(bx, by, barW, barH, "F")

    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)
    doc.setTextColor(0, 0, 0)
    doc.text(String(d.value), bx + barW / 2, by - 2, { align: "center" })

    doc.setFont("helvetica", "normal")
    doc.setFontSize(7)
    doc.text(d.label, bx + barW / 2, chartY + chartH + 5, { align: "center" })
  })

  y = chartY + chartH + 14

  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    head: [["Año", "Valor Inicial", "Avance Anual", "Meta Anual", "Meta Trianual"]],
    body: [[
      ficha.anio,
      ficha.valor_inicial,
      ficha.avance_anual,
      ficha.meta_anual,
      ficha.meta_trianual
    ]],
    styles: { fontSize: 9, halign: "center" },
    headStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  })

  y = doc.lastAutoTable.finalY + 10

  doc.setFontSize(8.5)
  doc.setFont("helvetica", "normal")
  const infoDep = [
    ["Dependencia:", ficha.dependencia_nombre || "-"],
    ["Unidad de medida:", ficha.unidad_medida || "-"],
    ["Medios de verificación:", ficha.medios_verificacion || "-"],
    ["Supuestos:", ficha.supuestos || "-"],
  ]
  infoDep.forEach(([label, valor]) => {
    doc.setFont("helvetica", "bold")
    doc.text(label, 14, y)
    doc.setFont("helvetica", "normal")
    const lines = doc.splitTextToSize(valor, W - 70)
    doc.text(lines, 65, y)
    y += lines.length * 4.5 + 1
  })

  y += 10

  const pageH = doc.internal.pageSize.height
  const firmaY = Math.max(y, pageH - 30)
  doc.line(20, firmaY, 80, firmaY)
  doc.line(W - 80, firmaY, W - 20, firmaY)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.text(ficha.enlace || "Enlace", 50, firmaY + 5, { align: "center" })
  doc.text(ficha.titular || "Titular", W - 50, firmaY + 5, { align: "center" })
  doc.setFont("helvetica", "normal")
  doc.text("Elaboró", 50, firmaY + 9, { align: "center" })
  doc.text("Vo. Bo.", W - 50, firmaY + 9, { align: "center" })

  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.setTextColor(180, 0, 0)
  doc.text("¡Qué viva Tuxtla!", W / 2, pageH - 8, { align: "center" })

  doc.save(`FichaTecnica_${(ficha.nombre_indicador || "ficha").replace(/ /g,"_")}_${ficha.anio}.pdf`)
}

export const exportarFichaExcel = async (ficha) => {
  const ExcelJS = (await import("exceljs")).default
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet("Ficha Técnica")

  ws.columns = [
    { key:"A", width:30 },
    { key:"B", width:60 },
  ]

  const rojo = { type:"pattern", pattern:"solid", fgColor:{ argb:"FFC00000" } }
  const gris = { type:"pattern", pattern:"solid", fgColor:{ argb:"FFD9D9D9" } }
  const blanco = { type:"pattern", pattern:"solid", fgColor:{ argb:"FFFFFFFF" } }
  const boldRed = { bold:true, color:{ argb:"FFC00000" } }
  const bold = { bold:true }

  
  ws.mergeCells("A1:B1")
  ws.getCell("A1").value = "SISTEMA DE PLANEACIÓN MUNICIPAL - Indicadores del PMD 2024-2027"
  ws.getCell("A1").font = { bold:true, color:{ argb:"FFFFFFFF" }, size:11 }
  ws.getCell("A1").fill = rojo
  ws.getCell("A1").alignment = { horizontal:"center" }
  ws.getRow(1).height = 20

  ws.mergeCells("A2:B2")
  ws.getCell("A2").value = ficha.nombre_indicador
  ws.getCell("A2").font = { bold:true, size:11 }
  ws.getCell("A2").fill = gris
  ws.getCell("A2").alignment = { horizontal:"center" }

  const info = [
    ["Eje", ficha.eje],
    ["Tema", ficha.tema],
    ["Política Pública", ficha.politica_publica],
    ["Objetivo", ficha.objetivo],
    ["Estrategia", ficha.estrategia],
  ]

  let row = 3
  info.forEach(([label, val]) => {
    ws.getCell(`A${row}`).value = label
    ws.getCell(`A${row}`).font = bold
    ws.getCell(`A${row}`).fill = gris
    ws.getCell(`B${row}`).value = val || "-"
    ws.getCell(`B${row}`).fill = blanco
    ws.getRow(row).height = 18
    row++
  })

  row++
  ws.mergeCells(`A${row}:B${row}`)
  ws.getCell(`A${row}`).value = "Análisis cualitativo"
  ws.getCell(`A${row}`).font = bold
  ws.getCell(`A${row}`).alignment = { horizontal:"center" }
  ws.getCell(`A${row}`).fill = gris
  row++
  ws.mergeCells(`A${row}:B${row}`)
  ws.getCell(`A${row}`).value = ficha.analisis_cualitativo || ""
  ws.getCell(`A${row}`).alignment = { wrapText:true }
  ws.getRow(row).height = 60
  row += 2

  const headers = ["Año", "Valor Inicial", "Avance Anual", "Meta Anual", "Meta Trianual"]
  const colLetters = ["A","B","C","D","E"]

  ws.columns = [
    { key:"A", width:12 },
    { key:"B", width:18 },
    { key:"C", width:18 },
    { key:"D", width:18 },
    { key:"E", width:18 },
  ]

  headers.forEach((h, i) => {
    const cell = ws.getCell(`${colLetters[i]}${row}`)
    cell.value = h
    cell.font = { bold:true, color:{ argb:"FFFFFFFF" } }
    cell.fill = { type:"pattern", pattern:"solid", fgColor:{ argb:"FF333333" } }
    cell.alignment = { horizontal:"center" }
  })
  row++

  const vals = [ficha.anio, ficha.valor_inicial, ficha.avance_anual, ficha.meta_anual, ficha.meta_trianual]
  vals.forEach((v, i) => {
    const cell = ws.getCell(`${colLetters[i]}${row}`)
    cell.value = Number(v) || 0
    cell.alignment = { horizontal:"center" }
    cell.fill = { type:"pattern", pattern:"solid", fgColor:{ argb:"FFF5F5F5" } }
  })
  row += 2

  const infoDep = [
    ["Dependencia", ficha.dependencia_nombre],
    ["Unidad de medida", ficha.unidad_medida],
    ["Medios de verificación", ficha.medios_verificacion],
    ["Supuestos", ficha.supuestos],
  ]
  infoDep.forEach(([label, val]) => {
    ws.getCell(`A${row}`).value = label
    ws.getCell(`A${row}`).font = bold
    ws.getCell(`A${row}`).fill = gris
    ws.mergeCells(`B${row}:E${row}`)
    ws.getCell(`B${row}`).value = val || "-"
    ws.getCell(`B${row}`).alignment = { wrapText:true }
    ws.getRow(row).height = 20
    row++
  })

  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `FichaTecnica_${(ficha.nombre_indicador||"ficha").replace(/ /g,"_")}_${ficha.anio}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}