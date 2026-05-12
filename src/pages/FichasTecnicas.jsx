import React, { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer, LabelList } from "recharts"
import { exportarFichaPDF, exportarFichaExcel } from "../utils/exportarFicha"

const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"]

const FORM_VACIO = {
  nombre_indicador:"", definicion:"", proposito:"", formula:"",
  eje:"", tema:"", politica_publica:"", objetivo:"", estrategia:"",
  anio:2025, tipo_evaluacion:"Porcentaje", periodicidad:"Anual",
  tipo_indicador:"Estratégico", informe_gobierno:false,
  anio_base:"", valor_anio_base:"", valor_minimo:"",
  valor_inicial:"", avance_anual:"", meta_anual:"", meta_trianual:"",
  producto:false, analisis_cualitativo:"", unidad_medida:"",
  medios_verificacion:"", supuestos:"", responsable:"",
  correo_electronico:"", telefono:"",
  criterio_claro:true, criterio_relevante:true, criterio_economico:true,
  criterio_monitoreable:true, criterio_adecuado:true, criterio_aportacion:true,
  calendarizacion:{}, dependency_id:"", strategy_id:""
}

export default function FichasTecnicas({ dependencias = [] }) {
  const [vista, setVista] = useState("lista")
  const [fichas, setFichas] = useState([])
  const [form, setForm] = useState(FORM_VACIO)
  const [editando, setEditando] = useState(null)
  const [fichaSel, setFichaSel] = useState(null)
  const [filtroAnio, setFiltroAnio] = useState(null)
  const [filtroDep, setFiltroDep] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [estrategiasDep, setEstrategiasDep] = useState([])
  const [cargandoEst, setCargandoEst] = useState(false)

  useEffect(() => {
    fetch("http://localhost:3001/api/fichas/lista")
      .then(r => r.json()).then(setFichas).catch(() => {})
  }, [])

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleDependenciaChange = async (e) => {
    const depId = e.target.value
    setForm(prev => ({ ...prev, dependency_id:depId, strategy_id:"", eje:"", tema:"", politica_publica:"", objetivo:"", estrategia:"" }))
    setEstrategiasDep([])
    if (!depId) return
    setCargandoEst(true)
    try {
      const res = await fetch(`http://localhost:3001/api/fichas/estrategias/${depId}`)
      setEstrategiasDep(await res.json())
    } catch(e) { console.error(e) }
    setCargandoEst(false)
  }

  const handleEstrategiaChange = (e) => {
    const sel = estrategiasDep.find(s => String(s.strategy_id) === String(e.target.value))
    if (!sel) return
    setForm(prev => ({ ...prev, strategy_id:sel.strategy_id, eje:sel.eje||"", tema:sel.tema||"", politica_publica:sel.politica_publica||"", objetivo:sel.objetivo||"", estrategia:sel.estrategia||"" }))
  }

  const getCal = () => {
    if (!form.calendarizacion) return {}
    if (typeof form.calendarizacion === "string") {
      try { return JSON.parse(form.calendarizacion) } catch { return {} }
    }
    return form.calendarizacion
  }

  const setCalMes = (mes, campo, valor) => {
    const cal = { ...getCal() }
    cal[mes] = { ...(cal[mes]||{}), [campo]: valor }
    setForm(prev => ({ ...prev, calendarizacion: cal }))
  }

  const handleGuardar = async () => {
    if (!form.nombre_indicador || !form.dependency_id) { alert("Nombre e indicador y dependencia son obligatorios"); return }
    setEnviando(true)
    try {
      const url = editando ? `http://localhost:3001/api/fichas/actualizar/${editando}` : "http://localhost:3001/api/fichas/crear"
      const res = await fetch(url, { method: editando?"PUT":"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(form) })
      const data = await res.json()
      if (editando) setFichas(prev => prev.map(f => f.id===editando ? data : f))
      else setFichas(prev => [data, ...prev])
      setForm(FORM_VACIO); setEditando(null); setVista("lista")
      alert("✅ Ficha guardada correctamente")
    } catch { alert("Error al guardar") }
    setEnviando(false)
  }

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Eliminar esta ficha?")) return
    await fetch(`http://localhost:3001/api/fichas/eliminar/${id}`, { method:"DELETE" })
    setFichas(prev => prev.filter(f => f.id!==id))
    if (fichaSel?.id===id) setFichaSel(null)
  }

  const abrirEditar = (ficha) => { setForm({...FORM_VACIO, ...ficha}); setEditando(ficha.id); setVista("form") }

  const fichasFiltradas = fichas.filter(f => {
    if (filtroAnio && Number(f.anio)!==filtroAnio) return false
    if (filtroDep && f.dependency_id!==filtroDep) return false
    return true
  })

  const aniosUnicos = [...new Set(fichas.map(f=>f.anio))].sort((a,b)=>b-a)
  const depsUnicas = [...new Map(fichas.filter(f=>f.dependency_id).map(f=>[f.dependency_id,{id:f.dependency_id,name:f.dependencia_nombre}])).values()]

  const datosGrafica = fichaSel ? [
    { name:"valor inicial", value:Number(fichaSel.valor_inicial||0), fill:"#4682B4" },
    { name:"avance anual",  value:Number(fichaSel.avance_anual||0),  fill:"#808080" },
    { name:"meta anual",    value:Number(fichaSel.meta_anual||0),    fill:"#D4A030" },
    { name:"meta trianual", value:Number(fichaSel.meta_trianual||0), fill:"#505050" },
  ] : []

  const inputStyle = { width:"100%", padding:"8px 10px", borderRadius:"6px", border:"1px solid #d1d5db", fontSize:"13px", boxSizing:"border-box", color:"#000", background:"#fff" }
  const labelStyle = { display:"block", fontWeight:"600", fontSize:"12px", marginBottom:"4px", color:"#374151" }
  const sectionStyle = { background:"#f8fafc", borderRadius:"8px", padding:"16px", marginBottom:"16px", border:"1px solid #e5e7eb" }

  return (
    <div style={{ padding:"24px", background:"#f8fafc", minHeight:"100vh" }}>

      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"20px", flexWrap:"wrap", gap:"12px" }}>
        <div>
          <h2 style={{ margin:"0 0 4px", color:"#1e293b" }}>📋 Fichas Técnicas de Indicadores</h2>
          <p style={{ margin:0, color:"#6b7280", fontSize:"13px" }}>PMD 2024-2027</p>
        </div>
        <button onClick={() => { setForm(FORM_VACIO); setEditando(null); setVista(vista==="form"?"lista":"form") }}
          style={{ background:vista==="form"?"#6b7280":"#dc2626", color:"white", border:"none", borderRadius:"8px", padding:"10px 20px", fontSize:"13px", fontWeight:"600", cursor:"pointer" }}>
          {vista==="form"?"← Volver":"+ Nueva ficha"}
        </button>
      </div>

      {/* ── FORMULARIO ── */}
      {vista==="form" && (
        <div style={{ background:"white", borderRadius:"12px", padding:"24px", boxShadow:"0 1px 4px rgba(0,0,0,0.08)", maxWidth:"860px", margin:"0 auto" }}>
          <h3 style={{ margin:"0 0 20px", color:"#1e293b" }}>{editando?"✏️ Editar ficha":"✨ Nueva ficha técnica"}</h3>

          {/* SECCIÓN 1: Identificación */}
          <div style={sectionStyle}>
            <p style={{ fontWeight:"700", fontSize:"13px", color:"#374151", margin:"0 0 12px" }}>📌 Identificación del indicador</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px" }}>

              <div style={{ gridColumn:"1/-1" }}>
                <label style={labelStyle}>Nombre del indicador *</label>
                <input name="nombre_indicador" value={form.nombre_indicador} onChange={handleChange} placeholder="Ej: Incremento del índice de vialidades en buen estado" style={inputStyle} />
              </div>

              <div style={{ gridColumn:"1/-1" }}>
                <label style={labelStyle}>Definición</label>
                <textarea name="definicion" value={form.definicion||""} onChange={handleChange} rows={3} placeholder="Describe qué mide este indicador..." style={{ ...inputStyle, resize:"vertical" }} />
              </div>

              <div style={{ gridColumn:"1/-1" }}>
                <label style={labelStyle}>Propósito</label>
                <textarea name="proposito" value={form.proposito||""} onChange={handleChange} rows={2} style={{ ...inputStyle, resize:"vertical" }} />
              </div>

              <div>
                <label style={labelStyle}>Fórmula</label>
                <input name="formula" value={form.formula||""} onChange={handleChange} placeholder="Ej: (Valor N - Línea base) / Línea base × 100" style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Unidad de medida</label>
                <input name="unidad_medida" value={form.unidad_medida||""} onChange={handleChange} placeholder="Porcentaje, Número, Metros..." style={inputStyle} />
              </div>

              <div style={{ gridColumn:"1/-1" }}>
                <label style={labelStyle}>Medios de verificación</label>
                <input name="medios_verificacion" value={form.medios_verificacion||""} onChange={handleChange} style={inputStyle} />
              </div>

              <div style={{ gridColumn:"1/-1" }}>
                <label style={labelStyle}>Supuestos</label>
                <input name="supuestos" value={form.supuestos||""} onChange={handleChange} style={inputStyle} />
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: Alineación estratégica */}
          <div style={sectionStyle}>
            <p style={{ fontWeight:"700", fontSize:"13px", color:"#374151", margin:"0 0 12px" }}>🎯 Alineación estratégica</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px" }}>

              <div style={{ gridColumn:"1/-1" }}>
                <label style={labelStyle}>Dependencia *</label>
                <select name="dependency_id" value={form.dependency_id} onChange={handleDependenciaChange} style={inputStyle}>
                  <option value="">Selecciona una dependencia</option>
                  {dependencias.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>

              {form.dependency_id && (
                <div style={{ gridColumn:"1/-1" }}>
                  <label style={labelStyle}>Estrategia {cargandoEst && <span style={{ fontWeight:"400", color:"#6b7280", marginLeft:"8px" }}>Cargando...</span>}</label>
                  <select value={form.strategy_id||""} onChange={handleEstrategiaChange}
                    style={{ ...inputStyle, background:!estrategiasDep.length?"#f9fafb":"white" }}
                    disabled={!estrategiasDep.length||cargandoEst}>
                    <option value="">{cargandoEst?"Cargando...":estrategiasDep.length===0?"Sin estrategias":"Selecciona una estrategia"}</option>
                    {estrategiasDep.map(s => <option key={s.strategy_id} value={s.strategy_id}>{s.estrategia}</option>)}
                  </select>
                </div>
              )}

              {form.estrategia && (
                <div style={{ gridColumn:"1/-1", background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:"8px", padding:"14px" }}>
                  <p style={{ fontWeight:"700", fontSize:"12px", color:"#166534", margin:"0 0 10px" }}>✅ Auto-rellenado desde BD</p>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px" }}>
                    {[["Eje",form.eje],["Tema",form.tema],["Política Pública",form.politica_publica],["Objetivo",form.objetivo]].map(([label,val])=>(
                      <div key={label}>
                        <p style={{ fontSize:"11px", fontWeight:"700", color:"#374151", margin:"0 0 2px" }}>{label}</p>
                        <p style={{ fontSize:"12px", color:"#000", margin:0, background:"white", padding:"5px 8px", borderRadius:"4px", border:"1px solid #e5e7eb" }}>{val||"-"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SECCIÓN 3: Clasificación */}
          <div style={sectionStyle}>
            <p style={{ fontWeight:"700", fontSize:"13px", color:"#374151", margin:"0 0 12px" }}>🏷️ Clasificación</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:"14px" }}>
              <div>
                <label style={labelStyle}>Año</label>
                <select name="anio" value={form.anio} onChange={handleChange} style={inputStyle}>
                  <option value={2024}>2024</option><option value={2025}>2025</option><option value={2026}>2026</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Tipo de Evaluación</label>
                <input name="tipo_evaluacion" value={form.tipo_evaluacion||""} onChange={handleChange} placeholder="Porcentaje" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Periodicidad</label>
                <select name="periodicidad" value={form.periodicidad||"Anual"} onChange={handleChange} style={inputStyle}>
                  <option>Anual</option><option>Trimestral</option><option>Semestral</option><option>Mensual</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Tipo de Indicador</label>
                <select name="tipo_indicador" value={form.tipo_indicador||"Estratégico"} onChange={handleChange} style={inputStyle}>
                  <option>Estratégico</option><option>Gestión</option><option>Resultado</option>
                </select>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:"8px", paddingTop:"18px" }}>
                <input type="checkbox" id="informe_gobierno" checked={!!form.informe_gobierno} onChange={e=>setForm(p=>({...p,informe_gobierno:e.target.checked}))} />
                <label htmlFor="informe_gobierno" style={{ fontSize:"13px", color:"#374151", fontWeight:"600" }}>Informe de Gobierno</label>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:"8px", paddingTop:"18px" }}>
                <input type="checkbox" id="producto" checked={!!form.producto} onChange={e=>setForm(p=>({...p,producto:e.target.checked}))} />
                <label htmlFor="producto" style={{ fontSize:"13px", color:"#374151", fontWeight:"600" }}>Producto</label>
              </div>
            </div>
          </div>

          {/* SECCIÓN 4: Valores numéricos */}
          <div style={sectionStyle}>
            <p style={{ fontWeight:"700", fontSize:"13px", color:"#374151", margin:"0 0 12px" }}>📊 Valores del indicador</p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"14px", marginBottom:"12px" }}>
              <div>
                <label style={labelStyle}>Año base</label>
                <input name="anio_base" type="number" value={form.anio_base||""} onChange={handleChange} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Valor año base</label>
                <input name="valor_anio_base" type="number" value={form.valor_anio_base||""} onChange={handleChange} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Valor mínimo</label>
                <input name="valor_minimo" type="number" value={form.valor_minimo||""} onChange={handleChange} style={inputStyle} />
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"12px" }}>
              {[
                { name:"valor_inicial",  label:"Valor inicial",  color:"#4682B4" },
                { name:"avance_anual",   label:"Avance anual",   color:"#808080" },
                { name:"meta_anual",     label:"Meta anual",     color:"#D4A030" },
                { name:"meta_trianual",  label:"Meta trianual",  color:"#505050" },
              ].map(f=>(
                <div key={f.name}>
                  <label style={{ ...labelStyle, color:f.color }}>
                    <span style={{ display:"inline-block", width:"10px", height:"10px", background:f.color, borderRadius:"2px", marginRight:"4px" }} />{f.label}
                  </label>
                  <input name={f.name} type="number" value={form[f.name]||""} onChange={handleChange} style={{ ...inputStyle, fontWeight:"700" }} />
                </div>
              ))}
            </div>
          </div>

          {/* SECCIÓN 5: Calendarización mensual */}
          <div style={sectionStyle}>
            <p style={{ fontWeight:"700", fontSize:"13px", color:"#374151", margin:"0 0 12px" }}>📅 Calendarización mensual</p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"8px" }}>
              {MESES.map(mes => {
                const cal = getCal()
                return (
                  <div key={mes} style={{ background:"white", borderRadius:"6px", padding:"8px", border:"1px solid #e5e7eb" }}>
                    <p style={{ fontSize:"11px", fontWeight:"700", margin:"0 0 5px", textTransform:"capitalize", color:"#374151" }}>{mes}</p>
                    <input placeholder="Programado" type="number" value={cal[mes]?.programado||""}
                      onChange={e=>setCalMes(mes,"programado",e.target.value)}
                      style={{ ...inputStyle, marginBottom:"4px", fontSize:"11px", padding:"4px 6px" }} />
                    <input placeholder="Real" type="number" value={cal[mes]?.real||""}
                      onChange={e=>setCalMes(mes,"real",e.target.value)}
                      style={{ ...inputStyle, fontSize:"11px", padding:"4px 6px" }} />
                  </div>
                )
              })}
            </div>
          </div>

          {/* SECCIÓN 6: Análisis cualitativo */}
          <div style={sectionStyle}>
            <p style={{ fontWeight:"700", fontSize:"13px", color:"#374151", margin:"0 0 12px" }}>📝 Análisis cualitativo</p>
            <textarea name="analisis_cualitativo" value={form.analisis_cualitativo||""} onChange={handleChange} rows={5}
              placeholder="Describe el análisis cualitativo del indicador..." style={{ ...inputStyle, resize:"vertical" }} />
          </div>

          {/* SECCIÓN 7: Responsable */}
          <div style={sectionStyle}>
            <p style={{ fontWeight:"700", fontSize:"13px", color:"#374151", margin:"0 0 12px" }}>👤 Unidad administrativa</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"14px" }}>
              <div>
                <label style={labelStyle}>Responsable</label>
                <input name="responsable" value={form.responsable||""} onChange={handleChange} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Correo electrónico</label>
                <input name="correo_electronico" value={form.correo_electronico||""} onChange={handleChange} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Teléfono y Ext.</label>
                <input name="telefono" value={form.telefono||""} onChange={handleChange} style={inputStyle} />
              </div>
            </div>
          </div>

          {/* SECCIÓN 8: Criterios CREAM */}
          <div style={sectionStyle}>
            <p style={{ fontWeight:"700", fontSize:"13px", color:"#374151", margin:"0 0 12px" }}>✅ Criterios CREAM</p>
            <div style={{ display:"flex", gap:"10px", flexWrap:"wrap" }}>
              {[
                ["criterio_claro","Claro"],["criterio_relevante","Relevante"],
                ["criterio_economico","Económico"],["criterio_monitoreable","Monitoreable"],
                ["criterio_adecuado","Adecuado"],["criterio_aportacion","Aportación marginal"]
              ].map(([campo,label])=>(
                <label key={campo} style={{ display:"flex", alignItems:"center", gap:"6px", fontSize:"13px", background: form[campo]!==false?"#f0fdf4":"#fff1f2", padding:"7px 14px", borderRadius:"6px", border:`1px solid ${form[campo]!==false?"#bbf7d0":"#fecaca"}`, cursor:"pointer" }}>
                  <input type="checkbox" checked={form[campo]!==false} onChange={e=>setForm(p=>({...p,[campo]:e.target.checked}))} />
                  <span style={{ fontWeight:"600", color: form[campo]!==false?"#166534":"#991b1b" }}>{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div style={{ display:"flex", gap:"12px", justifyContent:"flex-end" }}>
            <button onClick={()=>{setVista("lista");setEditando(null);setForm(FORM_VACIO)}} style={{ padding:"10px 20px", borderRadius:"8px", border:"1px solid #d1d5db", cursor:"pointer", background:"white", fontSize:"13px", color:"#000" }}>Cancelar</button>
            <button onClick={handleGuardar} disabled={enviando} style={{ padding:"10px 24px", borderRadius:"8px", background:"#dc2626", color:"white", border:"none", cursor:"pointer", fontWeight:"600", fontSize:"13px", opacity:enviando?0.7:1 }}>
              {enviando?"Guardando...":editando?"✅ Actualizar":"✅ Guardar ficha"}
            </button>
          </div>
        </div>
      )}

      {/* ── LISTA ── */}
      {vista==="lista" && (
        <>
          <div style={{ display:"flex", gap:"10px", marginBottom:"20px", flexWrap:"wrap" }}>
            <select value={filtroAnio??""} onChange={e=>setFiltroAnio(e.target.value===""?null:Number(e.target.value))} style={{ padding:"8px 12px", borderRadius:"8px", border:"1px solid #e5e7eb", fontSize:"13px", background:"white", color:"#000" }}>
              <option value="">Todos los años</option>
              {aniosUnicos.map(a=><option key={a} value={a}>{a}</option>)}
            </select>
            <select value={filtroDep??""} onChange={e=>setFiltroDep(e.target.value===""?null:e.target.value)} style={{ padding:"8px 12px", borderRadius:"8px", border:"1px solid #e5e7eb", fontSize:"13px", background:"white", color:"#000", maxWidth:"280px" }}>
              <option value="">Todas las dependencias</option>
              {depsUnicas.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            {(filtroAnio||filtroDep) && <button onClick={()=>{setFiltroAnio(null);setFiltroDep(null)}} style={{ padding:"8px 14px", borderRadius:"8px", border:"1px solid #e5e7eb", background:"white", cursor:"pointer", fontSize:"12px", color:"#6b7280" }}>✕ Limpiar</button>}
            <span style={{ marginLeft:"auto", fontSize:"12px", color:"#6b7280", alignSelf:"center" }}>{fichasFiltradas.length} ficha{fichasFiltradas.length!==1?"s":""}</span>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:fichaSel?"1fr 1.4fr":"1fr", gap:"20px" }}>

            <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
              {fichasFiltradas.length===0 && (
                <div style={{ textAlign:"center", padding:"60px", color:"#9ca3af" }}>
                  <p style={{ fontSize:"48px", margin:"0 0 12px" }}>📋</p>
                  <p>No hay fichas técnicas aún.</p>
                </div>
              )}
              {fichasFiltradas.map(f=>(
                <div key={f.id} onClick={()=>setFichaSel(fichaSel?.id===f.id?null:f)}
                  style={{ background:"white", borderRadius:"10px", padding:"14px 16px", border:`2px solid ${fichaSel?.id===f.id?"#dc2626":"#e5e7eb"}`, cursor:"pointer", boxShadow:"0 1px 3px rgba(0,0,0,0.06)", transition:"all 0.15s" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontWeight:"700", color:"#1e293b", margin:"0 0 4px", fontSize:"13px" }}>{f.nombre_indicador}</p>
                      <p style={{ color:"#dc2626", fontSize:"11px", margin:"0 0 2px", fontWeight:"600" }}>{f.dependencia_nombre}</p>
                      <p style={{ color:"#6b7280", fontSize:"11px", margin:0 }}>{f.eje} · Año {f.anio} · {f.tipo_indicador}</p>
                    </div>
                    <div style={{ display:"flex", gap:"6px", marginLeft:"8px", flexShrink:0 }}>
                      <button onClick={e=>{e.stopPropagation();abrirEditar(f)}} style={{ background:"#dbeafe", color:"#1e40af", border:"none", borderRadius:"4px", padding:"4px 8px", cursor:"pointer", fontSize:"11px", fontWeight:"600" }}>✏️</button>
                      <button onClick={e=>{e.stopPropagation();handleEliminar(f.id)}} style={{ background:"#fee2e2", color:"#dc2626", border:"none", borderRadius:"4px", padding:"4px 8px", cursor:"pointer", fontSize:"11px" }}>🗑️</button>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:"12px", marginTop:"8px" }}>
                    {[
                      {label:"Ini",  value:f.valor_inicial,  color:"#4682B4"},
                      {label:"Ava",  value:f.avance_anual,   color:"#808080"},
                      {label:"Meta", value:f.meta_anual,     color:"#D4A030"},
                      {label:"Tri",  value:f.meta_trianual,  color:"#505050"},
                    ].map((d,i)=>(
                      <div key={i} style={{ textAlign:"center" }}>
                        <div style={{ fontSize:"13px", fontWeight:"700", color:d.color }}>{Number(d.value||0)}</div>
                        <div style={{ fontSize:"9px", color:"#9ca3af" }}>{d.label}</div>
                      </div>
                    ))}
                    {f.tipo_indicador && <span style={{ marginLeft:"auto", background:"#fef9c3", color:"#854d0e", padding:"2px 8px", borderRadius:"999px", fontSize:"10px", fontWeight:"600", alignSelf:"center" }}>{f.tipo_indicador}</span>}
                  </div>
                </div>
              ))}
            </div>

            {fichaSel && (
              <div style={{ background:"white", borderRadius:"12px", padding:"20px", boxShadow:"0 1px 4px rgba(0,0,0,0.08)", border:"1px solid #e5e7eb", alignSelf:"start", position:"sticky", top:"20px", maxHeight:"90vh", overflowY:"auto" }}>

                <div style={{ background:"#dc2626", margin:"-20px -20px 16px -20px", padding:"12px 20px", borderRadius:"12px 12px 0 0" }}>
                  <p style={{ color:"white", fontWeight:"700", fontSize:"13px", margin:"0 0 2px" }}>SISTEMA DE PLANEACIÓN MUNICIPAL</p>
                  <p style={{ color:"rgba(255,255,255,0.8)", fontSize:"11px", margin:0 }}>Indicadores del PMD 2024-2027</p>
                </div>

                <div style={{ background:"#f3f4f6", borderRadius:"6px", padding:"8px 12px", marginBottom:"12px", textAlign:"center" }}>
                  <p style={{ fontWeight:"700", fontSize:"13px", color:"#1e293b", margin:0 }}>{fichaSel.nombre_indicador}</p>
                </div>

                {[["Eje",fichaSel.eje],["Tema",fichaSel.tema],["Política Pública",fichaSel.politica_publica],["Objetivo",fichaSel.objetivo],["Estrategia",fichaSel.estrategia]].filter(([,v])=>v).map(([label,val])=>(
                  <div key={label} style={{ display:"flex", gap:"8px", marginBottom:"4px", fontSize:"12px" }}>
                    <span style={{ fontWeight:"700", color:"#374151", minWidth:"120px", flexShrink:0 }}>{label}:</span>
                    <span style={{ color:"#4b5563" }}>{val}</span>
                  </div>
                ))}

                {fichaSel.analisis_cualitativo && (
                  <div style={{ margin:"12px 0", padding:"10px 12px", background:"#f9fafb", borderRadius:"6px", border:"1px solid #e5e7eb" }}>
                    <p style={{ fontWeight:"700", fontSize:"12px", margin:"0 0 6px", textAlign:"center", color:"#000" }}>Análisis cualitativo</p>
                    <p style={{ fontSize:"11px", color:"#4b5563", margin:0, lineHeight:"1.6" }}>{fichaSel.analisis_cualitativo}</p>
                  </div>
                )}

                <div style={{ margin:"16px 0 8px" }}>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={datosGrafica} margin={{ top:20, right:10, left:0, bottom:30 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize:10 }} angle={-10} textAnchor="end" />
                      <YAxis tick={{ fontSize:10 }} />
                      <Tooltip formatter={(v)=>[Number(v).toLocaleString(),""]} />
                      <Bar dataKey="value" radius={[4,4,0,0]}>
                        {datosGrafica.map((entry,i)=><Cell key={i} fill={entry.fill} />)}
                        <LabelList dataKey="value" position="top" style={{ fontSize:"10px", fontWeight:"700" }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"11px", marginBottom:"12px" }}>
                  <thead>
                    <tr style={{ background:"#333" }}>
                      {["Año","Valor Inicial","Avance Anual","Meta Anual","Meta Trianual"].map(h=>(
                        <th key={h} style={{ padding:"6px 8px", color:"white", textAlign:"center", fontWeight:"600" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ background:"#f5f5f5" }}>
                      {[fichaSel.anio,fichaSel.valor_inicial,fichaSel.avance_anual,fichaSel.meta_anual,fichaSel.meta_trianual].map((v,i)=>(
                        <td key={i} style={{ padding:"6px 8px", textAlign:"center", color:"#000", fontWeight:i>0?"700":"400" }}>{Number(v||0)}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>

                {/* Datos adicionales */}
                {[
                  ["Dependencia",fichaSel.dependencia_nombre],["Unidad de medida",fichaSel.unidad_medida],
                  ["Tipo evaluación",fichaSel.tipo_evaluacion],["Periodicidad",fichaSel.periodicidad],
                  ["Tipo indicador",fichaSel.tipo_indicador],["Responsable",fichaSel.responsable],
                  ["Correo",fichaSel.correo_electronico],["Teléfono",fichaSel.telefono],
                  ["Medios de verificación",fichaSel.medios_verificacion],["Supuestos",fichaSel.supuestos],
                ].filter(([,v])=>v).map(([label,val])=>(
                  <div key={label} style={{ display:"flex", gap:"8px", marginBottom:"3px", fontSize:"11px" }}>
                    <span style={{ fontWeight:"700", color:"#374151", minWidth:"130px", flexShrink:0 }}>{label}:</span>
                    <span style={{ color:"#4b5563" }}>{val}</span>
                  </div>
                ))}

                {/* CREAM */}
                <div style={{ marginTop:"12px", background:"#f0fdf4", borderRadius:"6px", padding:"8px 12px" }}>
                  <p style={{ fontWeight:"700", fontSize:"11px", color:"#166534", margin:"0 0 6px" }}>Criterios CREAM</p>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:"4px" }}>
                    {[["criterio_claro","Claro"],["criterio_relevante","Relevante"],["criterio_economico","Económico"],["criterio_monitoreable","Monitoreable"],["criterio_adecuado","Adecuado"],["criterio_aportacion","Aportación"]].map(([campo,label])=>(
                      <span key={campo} style={{ background:fichaSel[campo]!==false?"#16a34a":"#dc2626", color:"white", padding:"2px 8px", borderRadius:"999px", fontSize:"10px", fontWeight:"600" }}>
                        {label}: {fichaSel[campo]!==false?"SI":"NO"}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ display:"flex", gap:"8px", marginTop:"16px" }}>
                  <button onClick={()=>exportarFichaPDF(fichaSel)} style={{ flex:1, background:"#dc2626", color:"white", border:"none", borderRadius:"8px", padding:"10px", cursor:"pointer", fontWeight:"600", fontSize:"12px" }}>📄 PDF</button>
                  <button onClick={()=>exportarFichaExcel(fichaSel)} style={{ flex:1, background:"#16a34a", color:"white", border:"none", borderRadius:"8px", padding:"10px", cursor:"pointer", fontWeight:"600", fontSize:"12px" }}>📊 Excel</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}