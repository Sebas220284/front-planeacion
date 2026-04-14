import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

// Agregamos enlace y titular a los parámetros
export const generarPDF = (dependencia, estrategias, trimestres, filtro, enlace, titular) => {

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "letter" })

  const { anio, trimestre } = filtro

  const getValor = (planning_id, a, t, tipo) => {
    const lista = trimestres[planning_id] || []
    return lista.find(x => x.anio === a && x.trimestre === t && x.tipo === tipo)?.valor ?? 0
  }

  const getComentario = (planning_id, a, tipo) => {
    const lista = trimestres[planning_id] || []
    if (trimestre) {
      return lista.find(x => x.anio === a && x.trimestre === trimestre && x.tipo === tipo)?.comentario ?? ""
    }
    return lista.find(x => x.anio === a && x.tipo === tipo)?.comentario ?? ""
  }

  const trimestresNums = trimestre ? [trimestre] : [1, 2, 3, 4]

  Object.values(estrategias).forEach((est, estIndex) => {

    if (estIndex > 0) doc.addPage()

    let y = 10

    doc.setFillColor(220, 53, 69)
    doc.rect(0, y, 280, 8, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.text("SISTEMA DE PLANEACIÓN MUNICIPAL", 200, y + 5.5, { align: "center" })
    
    y += 14
    doc.setFillColor(40, 40, 40)
    doc.rect(10, y, 260, 7, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.text(dependencia.name || "", 140, y + 5, { align: "center" })

    y += 10

    doc.setTextColor(180, 0, 0)
    doc.setFontSize(9)
    const tituloTrim = trimestre
      ? `${["Primer", "Segundo", "Tercer", "Cuarto"][trimestre - 1]} Trimestre / ${["Enero-Marzo", "Abril-Junio", "Julio-Septiembre", "Octubre-Diciembre"][trimestre - 1]} (POA ${anio})`
      : `Año Completo (POA ${anio})`
    doc.text(tituloTrim, 140, y + 4, { align: "center" })

    y += 8

    const linea1 = est.lineas[0]
    if (linea1) {
      doc.setTextColor(180, 0, 0)
      doc.setFont("helvetica", "bold")
      doc.text(`${linea1.pmd_eje || ""}`, 10, y)
      y += 5
      doc.setTextColor(0, 0, 0)
      doc.setFont("helvetica", "normal")
      doc.text(`${linea1.pmd_tema || ""}`, 10, y); y += 5
      doc.text(`${linea1.pmd_politica_publica || ""}`, 10, y); y += 5
      doc.text(`Objetivo: ${linea1.pmd_objetivo || ""}`, 10, y, { maxWidth: 260 }); y += 10

      doc.setFillColor(180, 0, 0)
      doc.rect(10, y, 260, 7, "F")
      doc.setTextColor(255, 255, 255)
      doc.setFont("helvetica", "bold")
      doc.text(`${est.name || ""}`, 140, y + 5, { align: "center", maxWidth: 255 })
      y += 10
    }

    const headers = [
      { content: "Líneas de Acción", rowSpan: 2, styles: { valign: "middle", halign: "center" } },
      { content: "U.M.", rowSpan: 2, styles: { valign: "middle", halign: "center" } },
      { content: `Programado ${anio}`, colSpan: trimestresNums.length + 2, styles: { halign: "center" } },
      { content: `Ejecutado ${anio}`, colSpan: trimestresNums.length + 2, styles: { halign: "center" } },
    ]

    const subHeaders = [
      ...trimestresNums.map(t => ({ content: trimestre ? "Meta" : `T${t}`, styles: { halign: "center", fontSize: 7 } })),
      { content: "Total", styles: { halign: "center" } },
      { content: "Comentario", styles: { halign: "center" } },
      ...trimestresNums.map(t => ({ content: trimestre ? "Logro" : `T${t}`, styles: { halign: "center", fontSize: 7 } })),
      { content: "Total", styles: { halign: "center" } },
      { content: "Comentario", styles: { halign: "center" } },
    ]

    const rows = est.lineas.map(l => {
      const progVals = trimestresNums.map(t => getValor(l.id, anio, t, "programado"))
      const execVals = trimestresNums.map(t => getValor(l.id, anio, t, "ejecutado"))
      const progTotal = progVals.reduce((a, b) => Number(a) + Number(b), 0)
      const execTotal = execVals.reduce((a, b) => Number(a) + Number(b), 0)

      return [
        l.lineas_accion || "",
        l.nombre2 || "",
        ...progVals,
        progTotal,
        getComentario(l.id, anio, "programado"),
        ...execVals,
        execTotal,
        getComentario(l.id, anio, "ejecutado"),
      ]
    })

    autoTable(doc, {
      startY: y,
      head: [headers, subHeaders],
      body: rows,
      margin: { left: 10, right: 10 },
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 20, halign: "center" },
      },
      didDrawPage: (data) => {
        const pageHeight = doc.internal.pageSize.height
        doc.setFontSize(8)
        doc.setTextColor(0, 0, 0)
        doc.setFont("helvetica", "normal")
        
        doc.text("Elaboró", 60, pageHeight - 25, { align: "center" })
        doc.text("Vo. Bo.", 220, pageHeight - 25, { align: "center" })
        
        doc.line(30, pageHeight - 20, 90, pageHeight - 20)
        doc.line(190, pageHeight - 20, 250, pageHeight - 20)
        
        doc.setFont("helvetica", "bold")
        doc.text(`${enlace}`  || "", 60, pageHeight - 16, { align: "center" })
        doc.text(`${titular}` || "", 220, pageHeight - 16, { align: "center" })
        
        doc.setFont("helvetica", "normal")
        doc.text("Enlace", 60, pageHeight - 12, { align: "center" })
        doc.text("Titular", 220, pageHeight - 12, { align: "center" })
      }
    })
  })

  const nombreArchivo = trimestre
    ? `POA_${anio}_T${trimestre}_${dependencia.name?.replace(/ /g, "_")}.pdf`
    : `POA_${anio}_Completo_${dependencia.name?.replace(/ /g, "_")}.pdf`

  doc.save(nombreArchivo)
}