import React, { useEffect, useState } from "react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Cell, ResponsiveContainer, LabelList, LineChart, Line, Legend
} from "recharts"
import { exportarFichaPDF, exportarFichaExcel } from "../utils/exportarFicha"

const API    = "http://localhost:3100"
const MESES  = ["enero","febrero","marzo","abril","mayo","junio",
                 "julio","agosto","septiembre","octubre","noviembre","diciembre"]
const AÑOS   = [2024, 2025, 2026, 2027]

const FORM_VACIO = {
  nombre_indicador:"", definicion:"", proposito:"", formula:"",
  eje:"", tema:"", politica_publica:"", objetivo:"", estrategia:"",
  anio:2025, tipo_evaluacion:"Porcentaje", periodicidad:"Trimestral",
  tipo_indicador:"Gestión", informe_gobierno:false,
  anio_base:"", valor_anio_base:"", valor_minimo:"",
  valor_inicial:"", avance_anual:"", meta_anual:"", meta_trianual:"",
  producto:false, analisis_cualitativo:"", unidad_medida:"",
  medios_verificacion:"", supuestos:"", responsable:"",
  correo_electronico:"", telefono:"",
  criterio_claro:true, criterio_relevante:true, criterio_economico:true,
  criterio_monitoreable:true, criterio_adecuado:true, criterio_aportacion:true,
  calendarizacion:{}, dependency_id:"", strategy_id:"",
  planning_template_id: null
}

const CAMPOS_COMPARAR = [
  ["nombre_indicador","Nombre"],["definicion","Definición"],["proposito","Propósito"],
  ["formula","Fórmula"],["unidad_medida","Unidad"],["anio","Año"],
  ["valor_inicial","Valor inicial"],["avance_anual","Avance anual"],
  ["meta_anual","Meta anual"],["meta_trianual","Meta trianual"],
]

const UserBadge = ({ nombre, email, label, color="#2563eb" }) => {
  if (!nombre) return null
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"8px", background:`${color}10`, border:`1px solid ${color}30`, borderRadius:"8px", padding:"6px 10px" }}>
      <div style={{ width:"28px", height:"28px", borderRadius:"50%", background:color, display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontWeight:"700", fontSize:"12px", flexShrink:0 }}>
        {(nombre||"?")[0].toUpperCase()}
      </div>
      <div>
        <p style={{ margin:0, fontSize:"11px", color:"#6b7280" }}>{label}</p>
        <p style={{ margin:0, fontSize:"12px", fontWeight:"700", color:"#1e293b" }}>{nombre}</p>
        {email && <p style={{ margin:0, fontSize:"10px", color:"#6b7280" }}>{email}</p>}
      </div>
    </div>
  )
}

export default function FichasTecnicas({ dependencias = [] }) {
  const [vista, setVista]         = useState("lista")
  const [fichas, setFichas]       = useState([])
  const [form, setForm]           = useState(FORM_VACIO)
  const [editando, setEditando]   = useState(null)
  const [fichaSel, setFichaSel]   = useState(null)
  const [filtroAnio, setFiltroAnio] = useState(null)
  const [filtroDep, setFiltroDep]   = useState(null)
  const [enviando, setEnviando]   = useState(false)
  const [comentarioCambio, setComentarioCambio] = useState("")
  const [currentUser, setCurrentUser] = useState(null)

  // Historial
  const [historial, setHistorial]       = useState([])
  const [cargandoHist, setCargandoHist] = useState(false)
  const [modalHistorial, setModalHistorial] = useState(false)
  const [versionExpandida, setVersionExpandida] = useState(null)
  const [versionComparar, setVersionComparar]   = useState(null)

  // Conexión con POA
  const [lineasPOA, setLineasPOA]         = useState([])
  const [cargandoLineas, setCargandoLineas] = useState(false)
  const [lineaSelPOA, setLineaSelPOA]     = useState(null)
  const [anioConsulta, setAnioConsulta]   = useState(2025)
  const [cargandoAutoFill, setCargandoAutoFill] = useState(false)
  const [mostrarGraficaPOA, setMostrarGraficaPOA] = useState(false)
  const [datosTrimestres, setDatosTrimestres] = useState(null)

  useEffect(() => {
    cargarFichas()
    const token = localStorage.getItem("token")
    if (token) {
      fetch(`${API}/api/auth/me`, { headers:{ Authorization:`Bearer ${token}` } })
        .then(r=>r.json()).then(setCurrentUser).catch(()=>{})
    }
  }, [])

  const cargarFichas = async () => {
    try {
      const res  = await fetch(`${API}/api/fichas/lista-con-poa`)
      const data = await res.json()
      setFichas(Array.isArray(data) ? data : [])
    } catch(e) { console.error(e) }
  }

  // ── Cuando cambia la dependencia en el form, carga las líneas del POA ──
  const handleDepChange = async (e) => {
    const depId = e.target.value
    setForm(p => ({...p, dependency_id:depId, strategy_id:"", planning_template_id:null}))
    setLineasPOA([]); setLineaSelPOA(null); setDatosTrimestres(null)
    if (!depId) return

    setCargandoLineas(true)
    try {
      const res  = await fetch(`${API}/api/fichas/lineas-por-dep/${depId}`)
      const data = await res.json()
      setLineasPOA(Array.isArray(data) ? data : [])
    } catch(e) { console.error(e) }
    setCargandoLineas(false)
  }

  // ── Auto-rellena toda la ficha desde una línea del POA ──
  const handleLineaPOAChange = async (e) => {
    const planningId = e.target.value
    if (!planningId) {
      setLineaSelPOA(null); setDatosTrimestres(null)
      return
    }

    const linea = lineasPOA.find(l => l.id === planningId)
    setLineaSelPOA(linea)
    setCargandoAutoFill(true)

    try {
      const res  = await fetch(`${API}/api/fichas/datos-para-ficha/${planningId}/${anioConsulta}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      // ── Auto-rellena el formulario ──
      setForm(prev => ({
        ...prev,
        // Identificación
        nombre_indicador:   data.nombre_indicador,
        definicion:         data.definicion,
        proposito:          data.proposito,
        formula:            data.formula,
        unidad_medida:      data.unidad_medida,
        medios_verificacion: data.medios_verificacion,

        // Alineación estratégica
        eje:                 data.pmd_eje,
        tema:                data.pmd_tema,
        politica_publica:    data.pmd_politica_publica,
        objetivo:            data.pmd_objetivo,
        estrategia:          data.pmd_estrategia,
        strategy_id:         data.strategy_id,

        // Clasificación
        anio:               data.anio,
        periodicidad:        data.periodicidad,
        tipo_indicador:      data.tipo_indicador,
        tipo_evaluacion:     data.tipo_evaluacion,

        // Valores del indicador (calculados del POA)
        valor_inicial:   data.valor_inicial,
        avance_anual:    data.avance_anual,
        meta_anual:      data.meta_anual,
        meta_trianual:   data.meta_trianual,
        anio_base:       data.anio_base,
        valor_anio_base: data.valor_anio_base,
        valor_minimo:    data.valor_minimo,

        // Calendarización mensual (de los trimestres del POA)
        calendarizacion: data.calendarizacion,

        // Responsable
        responsable:       data.responsable,
        correo_electronico: data.correo_electronico,

        // Vínculo con POA
        planning_template_id: data.planning_template_id,
      }))

      setDatosTrimestres(data)
      setMostrarGraficaPOA(true)
    } catch(e) {
      alert("Error al cargar datos del POA: " + e.message)
    }
    setCargandoAutoFill(false)
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
    setForm(p => ({ ...p, calendarizacion: cal }))
  }

  const handleChange = e => setForm(p => ({...p, [e.target.name]: e.target.value}))
  const handleCheck  = e => setForm(p => ({...p, [e.target.name]: e.target.checked}))

  const handleGuardar = async () => {
    if (!form.nombre_indicador || !form.dependency_id) {
      alert("Nombre del indicador y dependencia son obligatorios"); return
    }
    setEnviando(true)
    try {
      const url = editando
        ? `${API}/api/fichas/actualizar/${editando}`
        : `${API}/api/fichas/crear`
      const payload = {
        ...form,
        creado_por:       editando ? form.creado_por : (currentUser?.id||null),
        modificado_por:   currentUser?.id||null,
        comentario_cambio: comentarioCambio
      }
      const res  = await fetch(url, {
        method: editando?"PUT":"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      if (editando) setFichas(p=>p.map(f=>f.id===editando?data:f))
      else          setFichas(p=>[data,...p])

      setForm(FORM_VACIO); setEditando(null)
      setComentarioCambio(""); setLineaSelPOA(null)
      setDatosTrimestres(null); setLineasPOA([])
      setVista("lista")
      alert("✅ Ficha guardada correctamente")
    } catch(e) { alert("Error: " + e.message) }
    setEnviando(false)
  }

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Eliminar esta ficha?")) return
    await fetch(`${API}/api/fichas/eliminar/${id}`, {method:"DELETE"})
    setFichas(p=>p.filter(f=>f.id!==id))
    if (fichaSel?.id===id) setFichaSel(null)
  }

  const abrirEditar = async (ficha) => {
    setForm({...FORM_VACIO,...ficha})
    setEditando(ficha.id)
    setComentarioCambio("")
    setLineaSelPOA(null)

    // Carga las líneas del POA de esa dependencia
    if (ficha.dependency_id) {
      setCargandoLineas(true)
      const res  = await fetch(`${API}/api/fichas/lineas-por-dep/${ficha.dependency_id}`)
      const data = await res.json()
      setLineasPOA(Array.isArray(data)?data:[])
      setCargandoLineas(false)
    }

    // Si ya tiene planning_template_id, carga los datos del POA
    if (ficha.planning_template_id) {
      const res  = await fetch(`${API}/api/fichas/datos-para-ficha/${ficha.planning_template_id}/${ficha.anio||2025}`)
      const data = await res.json()
      setDatosTrimestres(data)
      setLineaSelPOA({ id:ficha.planning_template_id })
    }

    setVista("form")
  }

  const cargarHistorial = async (fichaId) => {
    setCargandoHist(true)
    try {
      const res  = await fetch(`${API}/api/fichas/historial/${fichaId}`)
      setHistorial(await res.json())
    } catch(e) { console.error(e) }
    setCargandoHist(false)
    setModalHistorial(true)
  }

  const fichasFiltradas = fichas.filter(f => {
    if (filtroAnio && Number(f.anio)!==filtroAnio) return false
    if (filtroDep  && f.dependency_id!==filtroDep) return false
    return true
  })

  const aniosUnicos = [...new Set(fichas.map(f=>f.anio))].sort((a,b)=>b-a)
  const depsUnicas  = [...new Map(fichas.filter(f=>f.dependency_id)
    .map(f=>[f.dependency_id,{id:f.dependency_id,name:f.dependencia_nombre}])).values()]

  const datosGrafica = fichaSel ? [
    { name:"Valor ini.", value:Number(fichaSel.valor_inicial||0), fill:"#4682B4" },
    { name:"Avance",     value:Number(fichaSel.avance_anual||0),  fill:"#808080" },
    { name:"Meta anual", value:Number(fichaSel.meta_anual||0),    fill:"#D4A030" },
    { name:"Meta trianual", value:Number(fichaSel.meta_trianual||0), fill:"#505050" },
  ] : []

  const getDiferencias = (ant, act) =>
    CAMPOS_COMPARAR.filter(([c]) => String(ant[c]||"") !== String(act?.[c]||""))

  const fmtFecha = (f) => f ? new Date(f).toLocaleString("es-MX",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}) : "-"

  const inp = { width:"100%", padding:"8px 10px", borderRadius:"6px", border:"1px solid #d1d5db", fontSize:"13px", boxSizing:"border-box", color:"#000", background:"#fff" }
  const lbl = { display:"block", fontWeight:"600", fontSize:"12px", marginBottom:"4px", color:"#374151" }
  const sec = { background:"#f8fafc", borderRadius:"8px", padding:"16px", marginBottom:"16px", border:"1px solid #e5e7eb" }

  return (
    <div style={{ padding:"24px", background:"#f8fafc", minHeight:"100vh" }}>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"20px", flexWrap:"wrap", gap:"12px" }}>
        <div>
          <h2 style={{ margin:"0 0 4px", color:"#1e293b" }}>📋 Fichas Técnicas de Indicadores</h2>
          <p style={{ margin:0, color:"#6b7280", fontSize:"13px" }}>PMD 2024-2027 · Conectadas al POA</p>
        </div>
        <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
          {currentUser && (
            <div style={{ display:"flex", alignItems:"center", gap:"8px", background:"white", border:"1px solid #e5e7eb", borderRadius:"8px", padding:"6px 12px" }}>
              <div style={{ width:"28px", height:"28px", borderRadius:"50%", background:"#2563eb", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontWeight:"700", fontSize:"12px" }}>
                {(currentUser.name||"U")[0].toUpperCase()}
              </div>
              <div>
                <p style={{ margin:0, fontSize:"12px", fontWeight:"600", color:"#1e293b" }}>{currentUser.name}</p>
                <p style={{ margin:0, fontSize:"10px", color:"#6b7280" }}>{currentUser.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={()=>{ setForm(FORM_VACIO); setEditando(null); setLineaSelPOA(null); setLineasPOA([]); setDatosTrimestres(null); setVista(vista==="form"?"lista":"form") }}
            style={{ background:vista==="form"?"#6b7280":"#dc2626", color:"white", border:"none", borderRadius:"8px", padding:"10px 20px", fontSize:"13px", fontWeight:"600", cursor:"pointer" }}
          >
            {vista==="form" ? "← Volver" : "+ Nueva ficha"}
          </button>
        </div>
      </div>

      {/* ══════ FORMULARIO ══════ */}
      {vista==="form" && (
        <div style={{ background:"white", borderRadius:"12px", padding:"24px", boxShadow:"0 1px 4px rgba(0,0,0,0.08)", maxWidth:"900px", margin:"0 auto" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px" }}>
            <h3 style={{ margin:0, color:"#1e293b" }}>{editando?"✏️ Editar ficha":"✨ Nueva ficha técnica"}</h3>
            {currentUser && (
              <span style={{ fontSize:"11px", color:"#0369a1", background:"#f0f9ff", border:"1px solid #bae6fd", borderRadius:"6px", padding:"4px 10px" }}>
                {editando?"Editando":"Creando"} como: <b>{currentUser.name}</b>
              </span>
            )}
          </div>

          {/* ══ NUEVA SECCIÓN: Conexión con POA ══ */}
          <div style={{ ...sec, background:"#fefce8", border:"2px solid #fcd34d", marginBottom:"20px" }}>
            <p style={{ fontWeight:"700", fontSize:"13px", color:"#92400e", margin:"0 0 12px" }}>
              🔗 Conectar con línea del POA
              <span style={{ fontWeight:"400", fontSize:"11px", marginLeft:"8px", color:"#78350f" }}>
                (selecciona para auto-rellenar toda la ficha desde los datos del POA)
              </span>
            </p>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 120px", gap:"12px", alignItems:"end" }}>
              {/* Dependencia */}
              <div>
                <label style={lbl}>1. Dependencia</label>
                <select name="dependency_id" value={form.dependency_id} onChange={handleDepChange} style={inp}>
                  <option value="">-- Selecciona dependencia --</option>
                  {dependencias.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>

              {/* Año del POA */}
              <div>
                <label style={lbl}>2. Año del POA</label>
                <select value={anioConsulta} onChange={e=>setAnioConsulta(Number(e.target.value))} style={inp}>
                  {AÑOS.map(a=><option key={a} value={a}>{a}</option>)}
                </select>
              </div>

              {/* Estado de carga */}
              <div>
                {cargandoLineas && (
                  <div style={{ padding:"8px", textAlign:"center", color:"#d97706", fontSize:"12px" }}>⏳ Cargando...</div>
                )}
                {lineasPOA.length > 0 && (
                  <div style={{ padding:"6px 10px", background:"#d1fae5", borderRadius:"6px", fontSize:"11px", color:"#065f46", fontWeight:"600", textAlign:"center" }}>
                    ✅ {lineasPOA.length} líneas
                  </div>
                )}
              </div>
            </div>

            {/* Selector de línea del POA */}
            {lineasPOA.length > 0 && (
              <div style={{ marginTop:"12px" }}>
                <label style={lbl}>3. Línea de Acción del POA</label>
                <select
                  value={lineaSelPOA?.id||""}
                  onChange={handleLineaPOAChange}
                  style={{ ...inp, background:"white" }}
                  disabled={cargandoAutoFill}
                >
                  <option value="">-- Selecciona una línea de acción --</option>
                  {lineasPOA.map(l=>(
                    <option key={l.id} value={l.id}>
                      [{l.pmd_eje?.substring(0,20)||"Sin eje"}] {l.lineas_accion?.substring(0,80)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {cargandoAutoFill && (
              <div style={{ textAlign:"center", padding:"16px", color:"#d97706" }}>
                <p style={{ fontSize:"20px", margin:"0 0 4px" }}>⚡</p>
                <p style={{ fontSize:"13px", fontWeight:"600", margin:0 }}>Cargando y calculando datos del POA...</p>
              </div>
            )}

            {/* Preview de datos calculados del POA */}
            {datosTrimestres && !cargandoAutoFill && (
              <div style={{ marginTop:"14px", background:"white", borderRadius:"8px", padding:"14px", border:"1px solid #fcd34d" }}>
                <p style={{ fontWeight:"700", fontSize:"12px", color:"#92400e", margin:"0 0 10px" }}>
                  ✅ Datos extraídos del POA {anioConsulta} — Ya se rellenaron en el formulario
                </p>

                {/* Resumen trimestral */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"8px", marginBottom:"10px" }}>
                  {datosTrimestres.resumen_trimestral?.map(t=>(
                    <div key={t.trimestre} style={{ background:"#f8fafc", borderRadius:"6px", padding:"8px", textAlign:"center" }}>
                      <p style={{ margin:"0 0 4px", fontSize:"10px", fontWeight:"700", color:"#374151" }}>T{t.trimestre}</p>
                      <p style={{ margin:"0 0 2px", fontSize:"11px", color:"#1e40af" }}>Prog: {t.programado}</p>
                      <p style={{ margin:"0 0 2px", fontSize:"11px", color:"#16a34a" }}>Ejec: {t.ejecutado}</p>
                      <div style={{ background: t.cumplimiento>=100?"#d1fae5":t.cumplimiento>=50?"#fef3c7":"#fee2e2", borderRadius:"4px", padding:"2px", marginTop:"2px" }}>
                        <p style={{ margin:0, fontSize:"10px", fontWeight:"700", color: t.cumplimiento>=100?"#065f46":t.cumplimiento>=50?"#92400e":"#991b1b" }}>
                          {t.cumplimiento}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Gráfica de comparativo */}
                {mostrarGraficaPOA && (
                  <div>
                    <p style={{ fontSize:"11px", fontWeight:"700", color:"#374151", margin:"0 0 6px" }}>
                      Gráfica Programado vs Ejecutado (del POA {anioConsulta}):
                    </p>
                    <ResponsiveContainer width="100%" height={140}>
                      <BarChart data={datosTrimestres.resumen_trimestral} margin={{top:10,right:10,left:0,bottom:0}}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="trimestre" tickFormatter={v=>`T${v}`} tick={{fontSize:11}} />
                        <YAxis tick={{fontSize:10}} />
                        <Tooltip formatter={(v,n)=>[v, n==="programado"?"Programado":"Ejecutado"]} />
                        <Legend formatter={v=>v==="programado"?"Programado":"Ejecutado"} />
                        <Bar dataKey="programado" fill="#4682B4" radius={[4,4,0,0]} />
                        <Bar dataKey="ejecutado"  fill="#16a34a" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <div style={{ display:"flex", gap:"16px", marginTop:"8px", fontSize:"11px" }}>
                  <span style={{ color:"#1e40af" }}>📘 Total programado: <b>{datosTrimestres.meta_anual}</b></span>
                  <span style={{ color:"#16a34a" }}>📗 Total ejecutado: <b>{datosTrimestres.avance_anual}</b></span>
                  <span style={{ color:"#7c3aed" }}>🎯 Meta trianual: <b>{datosTrimestres.meta_trianual}</b></span>
                </div>
              </div>
            )}
          </div>

          {/* ── Identificación del indicador ── */}
          <div style={sec}>
            <p style={{ fontWeight:"700", fontSize:"13px", color:"#374151", margin:"0 0 12px" }}>📌 Identificación del indicador</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px" }}>
              <div style={{ gridColumn:"1/-1" }}>
                <label style={lbl}>Nombre del indicador *</label>
                <input name="nombre_indicador" value={form.nombre_indicador} onChange={handleChange} style={inp} />
              </div>
              <div style={{ gridColumn:"1/-1" }}>
                <label style={lbl}>Definición</label>
                <textarea name="definicion" value={form.definicion||""} onChange={handleChange} rows={3} style={{...inp,resize:"vertical"}} />
              </div>
              <div style={{ gridColumn:"1/-1" }}>
                <label style={lbl}>Propósito</label>
                <textarea name="proposito" value={form.proposito||""} onChange={handleChange} rows={2} style={{...inp,resize:"vertical"}} />
              </div>
              <div>
                <label style={lbl}>Fórmula</label>
                <input name="formula" value={form.formula||""} onChange={handleChange} style={inp} />
              </div>
              <div>
                <label style={lbl}>Unidad de medida</label>
                <input name="unidad_medida" value={form.unidad_medida||""} onChange={handleChange} style={inp} />
              </div>
              <div style={{ gridColumn:"1/-1" }}>
                <label style={lbl}>Medios de verificación</label>
                <input name="medios_verificacion" value={form.medios_verificacion||""} onChange={handleChange} style={inp} />
              </div>
              <div style={{ gridColumn:"1/-1" }}>
                <label style={lbl}>Supuestos</label>
                <input name="supuestos" value={form.supuestos||""} onChange={handleChange} style={inp} />
              </div>
            </div>
          </div>

          {/* ── Alineación estratégica (auto-rellenada desde POA) ── */}
          <div style={{ ...sec, background: form.eje?"#f0fdf4":"#f8fafc", border: form.eje?"1px solid #bbf7d0":"1px solid #e5e7eb" }}>
            <p style={{ fontWeight:"700", fontSize:"13px", color:"#374151", margin:"0 0 12px" }}>
              🎯 Alineación estratégica
              {form.planning_template_id && (
                <span style={{ marginLeft:"8px", background:"#bbf7d0", color:"#166534", padding:"2px 8px", borderRadius:"4px", fontSize:"10px", fontWeight:"700" }}>
                  ✅ Conectada al POA
                </span>
              )}
            </p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
              {[
                ["eje","Eje PMD"],["tema","Tema"],
                ["politica_publica","Política Pública"],["objetivo","Objetivo"],
              ].map(([n,l])=>(
                <div key={n}>
                  <label style={lbl}>{l}</label>
                  <input name={n} value={form[n]||""} onChange={handleChange}
                    style={{ ...inp, background:form.planning_template_id?"#f0fdf4":"white" }} />
                </div>
              ))}
              <div style={{ gridColumn:"1/-1" }}>
                <label style={lbl}>Estrategia</label>
                <input name="estrategia" value={form.estrategia||""} onChange={handleChange}
                  style={{ ...inp, background:form.planning_template_id?"#f0fdf4":"white" }} />
              </div>
            </div>
          </div>

          {/* ── Clasificación ── */}
          <div style={sec}>
            <p style={{ fontWeight:"700", fontSize:"13px", color:"#374151", margin:"0 0 12px" }}>🏷️ Clasificación</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:"12px" }}>
              <div>
                <label style={lbl}>Año</label>
                <select name="anio" value={form.anio} onChange={handleChange} style={inp}>
                  {AÑOS.map(a=><option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Tipo de Evaluación</label>
                <input name="tipo_evaluacion" value={form.tipo_evaluacion||""} onChange={handleChange} style={inp} />
              </div>
              <div>
                <label style={lbl}>Periodicidad</label>
                <select name="periodicidad" value={form.periodicidad||"Trimestral"} onChange={handleChange} style={inp}>
                  <option>Trimestral</option><option>Mensual</option><option>Semestral</option><option>Anual</option>
                </select>
              </div>
              <div>
                <label style={lbl}>Tipo de Indicador</label>
                <select name="tipo_indicador" value={form.tipo_indicador||"Gestión"} onChange={handleChange} style={inp}>
                  <option>Gestión</option><option>Estratégico</option><option>Resultado</option>
                </select>
              </div>
            </div>
          </div>

          {/* ── Valores del indicador (calculados del POA) ── */}
          <div style={{ ...sec, border: datosTrimestres?"1px solid #93c5fd":"1px solid #e5e7eb" }}>
            <p style={{ fontWeight:"700", fontSize:"13px", color:"#374151", margin:"0 0 12px" }}>
              📊 Valores del indicador
              {datosTrimestres && (
                <span style={{ marginLeft:"8px", background:"#dbeafe", color:"#1e40af", padding:"2px 8px", borderRadius:"4px", fontSize:"10px" }}>
                  Calculados del POA {anioConsulta}
                </span>
              )}
            </p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"12px", marginBottom:"12px" }}>
              <div>
                <label style={lbl}>Año base</label>
                <input name="anio_base" type="number" value={form.anio_base||""} onChange={handleChange} style={inp} />
              </div>
              <div>
                <label style={lbl}>Valor año base</label>
                <input name="valor_anio_base" type="number" value={form.valor_anio_base||""} onChange={handleChange} style={inp} />
              </div>
              <div>
                <label style={lbl}>Valor mínimo</label>
                <input name="valor_minimo" type="number" value={form.valor_minimo||""} onChange={handleChange} style={inp} />
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"12px" }}>
              {[
                {name:"valor_inicial", label:"Valor inicial",  color:"#4682B4"},
                {name:"avance_anual",  label:"Avance anual",   color:"#16a34a"},
                {name:"meta_anual",    label:"Meta anual",     color:"#D4A030"},
                {name:"meta_trianual", label:"Meta trianual",  color:"#505050"},
              ].map(f=>(
                <div key={f.name}>
                  <label style={{...lbl,color:f.color}}>
                    <span style={{display:"inline-block",width:"10px",height:"10px",background:f.color,borderRadius:"2px",marginRight:"4px"}} />
                    {f.label}
                  </label>
                  <input name={f.name} type="number" value={form[f.name]||""} onChange={handleChange}
                    style={{...inp,fontWeight:"700",borderColor:f.color}} />
                </div>
              ))}
            </div>
          </div>

          {/* ── Calendarización mensual (poblada desde POA) ── */}
          <div style={{ ...sec, border: datosTrimestres?"1px solid #93c5fd":"1px solid #e5e7eb" }}>
            <p style={{ fontWeight:"700", fontSize:"13px", color:"#374151", margin:"0 0 12px" }}>
              📅 Calendarización mensual
              {datosTrimestres && (
                <span style={{ marginLeft:"8px", background:"#dbeafe", color:"#1e40af", padding:"2px 8px", borderRadius:"4px", fontSize:"10px" }}>
                  Distribuida desde trimestres del POA
                </span>
              )}
            </p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"8px" }}>
              {MESES.map(mes => {
                const cal = getCal()
                const esTrimFin = ["marzo","junio","septiembre","diciembre"].includes(mes)
                return (
                  <div key={mes} style={{ background:"white", borderRadius:"6px", padding:"8px", border:`1px solid ${esTrimFin?"#93c5fd":"#e5e7eb"}` }}>
                    <p style={{ fontSize:"11px", fontWeight:"700", margin:"0 0 5px", textTransform:"capitalize", color:"#374151", display:"flex", justifyContent:"space-between" }}>
                      {mes}
                      {esTrimFin && <span style={{ fontSize:"9px", color:"#1e40af" }}>◆ cierre T</span>}
                    </p>
                    <input placeholder="Prog." type="number" value={cal[mes]?.programado||""}
                      onChange={e=>setCalMes(mes,"programado",e.target.value)}
                      style={{...inp,marginBottom:"4px",fontSize:"11px",padding:"4px 6px",color:"#1e40af"}} />
                    <input placeholder="Real" type="number" value={cal[mes]?.real||""}
                      onChange={e=>setCalMes(mes,"real",e.target.value)}
                      style={{...inp,fontSize:"11px",padding:"4px 6px",color:"#16a34a"}} />
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Análisis cualitativo ── */}
          <div style={sec}>
            <p style={{ fontWeight:"700", fontSize:"13px", color:"#374151", margin:"0 0 12px" }}>📝 Análisis cualitativo</p>
            <textarea name="analisis_cualitativo" value={form.analisis_cualitativo||""} onChange={handleChange}
              rows={5} style={{...inp,resize:"vertical"}} placeholder="Describe el comportamiento del indicador, logros, retos y acciones de mejora..." />
          </div>

          {/* ── Unidad administrativa ── */}
          <div style={sec}>
            <p style={{ fontWeight:"700", fontSize:"13px", color:"#374151", margin:"0 0 12px" }}>👤 Unidad administrativa</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"12px" }}>
              <div><label style={lbl}>Responsable</label><input name="responsable" value={form.responsable||""} onChange={handleChange} style={inp} /></div>
              <div><label style={lbl}>Correo electrónico</label><input name="correo_electronico" value={form.correo_electronico||""} onChange={handleChange} style={inp} /></div>
              <div><label style={lbl}>Teléfono</label><input name="telefono" value={form.telefono||""} onChange={handleChange} style={inp} /></div>
            </div>
          </div>

          {/* ── Criterios CREAM ── */}
          <div style={sec}>
            <p style={{ fontWeight:"700", fontSize:"13px", color:"#374151", margin:"0 0 12px" }}>✅ Criterios CREAM</p>
            <div style={{ display:"flex", gap:"10px", flexWrap:"wrap" }}>
              {[["criterio_claro","Claro"],["criterio_relevante","Relevante"],["criterio_economico","Económico"],
                ["criterio_monitoreable","Monitoreable"],["criterio_adecuado","Adecuado"],["criterio_aportacion","Aportación marginal"]
              ].map(([campo,label])=>(
                <label key={campo} style={{ display:"flex", alignItems:"center", gap:"6px", fontSize:"13px", cursor:"pointer",
                  background:form[campo]!==false?"#f0fdf4":"#fff1f2", padding:"7px 14px", borderRadius:"6px",
                  border:`1px solid ${form[campo]!==false?"#bbf7d0":"#fecaca"}` }}>
                  <input type="checkbox" name={campo} checked={form[campo]!==false} onChange={handleCheck} />
                  <span style={{ fontWeight:"600", color:form[campo]!==false?"#166534":"#991b1b" }}>{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Motivo actualización */}
          {editando && (
            <div style={{ ...sec, background:"#fffbeb", border:"1px solid #fcd34d" }}>
              <label style={{ ...lbl, color:"#92400e" }}>📝 Motivo de la actualización (opcional)</label>
              <textarea value={comentarioCambio} onChange={e=>setComentarioCambio(e.target.value)} rows={2}
                placeholder="Ej: Actualización de valores del tercer trimestre 2025..."
                style={{...inp,resize:"vertical"}} />
            </div>
          )}

          <div style={{ display:"flex", gap:"12px", justifyContent:"flex-end" }}>
            <button onClick={()=>{setVista("lista");setEditando(null);setForm(FORM_VACIO);setLineasPOA([]);setLineaSelPOA(null);setDatosTrimestres(null)}}
              style={{ padding:"10px 20px", borderRadius:"8px", border:"1px solid #d1d5db", cursor:"pointer", background:"white" }}>
              Cancelar
            </button>
            <button onClick={handleGuardar} disabled={enviando}
              style={{ padding:"10px 24px", borderRadius:"8px", background:"#dc2626", color:"white", border:"none", cursor:"pointer", fontWeight:"600", opacity:enviando?0.7:1 }}>
              {enviando?"Guardando...":editando?"✅ Actualizar":"✅ Guardar ficha"}
            </button>
          </div>
        </div>
      )}

      {/* ══════ LISTA ══════ */}
      {vista==="lista" && (
        <>
          <div style={{ display:"flex", gap:"10px", marginBottom:"16px", flexWrap:"wrap" }}>
            <select value={filtroAnio??""} onChange={e=>setFiltroAnio(e.target.value===""?null:Number(e.target.value))}
              style={{ padding:"8px 12px", borderRadius:"8px", border:"1px solid #e5e7eb", fontSize:"13px", background:"white" }}>
              <option value="">Todos los años</option>
              {aniosUnicos.map(a=><option key={a} value={a}>{a}</option>)}
            </select>
            <select value={filtroDep??""} onChange={e=>setFiltroDep(e.target.value===""?null:e.target.value)}
              style={{ padding:"8px 12px", borderRadius:"8px", border:"1px solid #e5e7eb", fontSize:"13px", background:"white", maxWidth:"280px" }}>
              <option value="">Todas las dependencias</option>
              {depsUnicas.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            {(filtroAnio||filtroDep) && (
              <button onClick={()=>{setFiltroAnio(null);setFiltroDep(null)}}
                style={{ padding:"8px 14px", borderRadius:"8px", border:"1px solid #e5e7eb", background:"white", cursor:"pointer", fontSize:"12px", color:"#6b7280" }}>
                ✕ Limpiar
              </button>
            )}
            <span style={{ marginLeft:"auto", fontSize:"12px", color:"#6b7280", alignSelf:"center" }}>
              {fichasFiltradas.length} ficha{fichasFiltradas.length!==1?"s":""}
            </span>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:fichaSel?"1fr 1.4fr":"1fr", gap:"20px" }}>
            <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
              {fichasFiltradas.length===0 ? (
                <div style={{ textAlign:"center", padding:"60px", color:"#9ca3af", background:"white", borderRadius:"12px", border:"1px solid #e5e7eb" }}>
                  <p style={{ fontSize:"40px", margin:"0 0 12px" }}>📋</p>
                  <p>No hay fichas técnicas aún.</p>
                </div>
              ) : fichasFiltradas.map(f=>(
                <div key={f.id} onClick={()=>setFichaSel(fichaSel?.id===f.id?null:f)}
                  style={{ background:"white", borderRadius:"10px", padding:"14px 16px", border:`2px solid ${fichaSel?.id===f.id?"#dc2626":"#e5e7eb"}`, cursor:"pointer", boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"4px" }}>
                        <p style={{ fontWeight:"700", color:"#1e293b", margin:0, fontSize:"13px" }}>{f.nombre_indicador}</p>
                        {f.planning_template_id && (
                          <span style={{ background:"#dbeafe", color:"#1e40af", padding:"1px 6px", borderRadius:"4px", fontSize:"9px", fontWeight:"700", flexShrink:0 }}>
                            🔗 POA
                          </span>
                        )}
                      </div>
                      <p style={{ color:"#dc2626", fontSize:"11px", margin:"0 0 2px", fontWeight:"600" }}>{f.dependencia_nombre}</p>
                      <p style={{ color:"#6b7280", fontSize:"11px", margin:0 }}>{f.eje} · Año {f.anio}</p>
                    </div>
                    <div style={{ display:"flex", gap:"5px", marginLeft:"8px", flexShrink:0 }}>
                      <button onClick={e=>{e.stopPropagation();abrirEditar(f)}}
                        style={{ background:"#dbeafe", color:"#1e40af", border:"none", borderRadius:"4px", padding:"4px 8px", cursor:"pointer", fontSize:"11px", fontWeight:"600" }}>✏️</button>
                      <button onClick={e=>{e.stopPropagation();cargarHistorial(f.id)}}
                        style={{ background:"#f3e8ff", color:"#7c3aed", border:"none", borderRadius:"4px", padding:"4px 8px", cursor:"pointer", fontSize:"11px" }}>🕘</button>
                      <button onClick={e=>{e.stopPropagation();handleEliminar(f.id)}}
                        style={{ background:"#fee2e2", color:"#dc2626", border:"none", borderRadius:"4px", padding:"4px 8px", cursor:"pointer", fontSize:"11px" }}>🗑️</button>
                    </div>
                  </div>

                  <div style={{ display:"flex", gap:"12px", marginTop:"8px" }}>
                    {[{label:"Ini",value:f.valor_inicial,color:"#4682B4"},{label:"Ava",value:f.avance_anual,color:"#16a34a"},{label:"Meta",value:f.meta_anual,color:"#D4A030"},{label:"Tri",value:f.meta_trianual,color:"#505050"}].map((d,i)=>(
                      <div key={i} style={{ textAlign:"center" }}>
                        <div style={{ fontSize:"13px", fontWeight:"700", color:d.color }}>{Number(d.value||0)}</div>
                        <div style={{ fontSize:"9px", color:"#9ca3af" }}>{d.label}</div>
                      </div>
                    ))}

                    {/* Si está conectada al POA, muestra el avance real */}
                    {f.planning_template_id && (
                      <div style={{ marginLeft:"auto", textAlign:"right" }}>
                        <div style={{ fontSize:"10px", color:"#1e40af" }}>POA Prog: {Number(f.programado_real_poa||0)}</div>
                        <div style={{ fontSize:"10px", color:"#16a34a" }}>POA Ejec: {Number(f.ejecutado_real_poa||0)}</div>
                      </div>
                    )}
                  </div>

                  {/* Usuarios */}
                  <div style={{ marginTop:"8px", paddingTop:"8px", borderTop:"1px solid #f1f5f9", display:"flex", gap:"16px", flexWrap:"wrap" }}>
                    {f.creado_por_nombre && (
                      <div style={{ display:"flex", alignItems:"center", gap:"5px", fontSize:"10px", color:"#6b7280" }}>
                        <div style={{ width:"16px", height:"16px", borderRadius:"50%", background:"#2563eb", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontWeight:"700", fontSize:"8px" }}>
                          {f.creado_por_nombre[0].toUpperCase()}
                        </div>
                        <span>Creó: <b style={{ color:"#374151" }}>{f.creado_por_nombre}</b></span>
                      </div>
                    )}
                    {f.actualizado_por_nombre && (
                      <div style={{ display:"flex", alignItems:"center", gap:"5px", fontSize:"10px", color:"#6b7280" }}>
                        <div style={{ width:"16px", height:"16px", borderRadius:"50%", background:"#d97706", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontWeight:"700", fontSize:"8px" }}>
                          {f.actualizado_por_nombre[0].toUpperCase()}
                        </div>
                        <span>Actualizó: <b style={{ color:"#374151" }}>{f.actualizado_por_nombre}</b></span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Panel de detalle */}
            {fichaSel && (
              <div style={{ background:"white", borderRadius:"12px", padding:"20px", boxShadow:"0 1px 4px rgba(0,0,0,0.08)", border:"1px solid #e5e7eb", alignSelf:"start", position:"sticky", top:"20px", maxHeight:"90vh", overflowY:"auto" }}>
                <div style={{ background:"#dc2626", margin:"-20px -20px 16px -20px", padding:"12px 20px", borderRadius:"12px 12px 0 0" }}>
                  <p style={{ color:"white", fontWeight:"700", fontSize:"13px", margin:"0 0 2px" }}>SISTEMA DE PLANEACIÓN MUNICIPAL</p>
                  <p style={{ color:"rgba(255,255,255,0.8)", fontSize:"11px", margin:0 }}>Indicadores del PMD 2024-2027</p>
                </div>

                <div style={{ background:"#f3f4f6", borderRadius:"6px", padding:"8px 12px", marginBottom:"12px", textAlign:"center" }}>
                  <p style={{ fontWeight:"700", fontSize:"13px", color:"#1e293b", margin:0 }}>{fichaSel.nombre_indicador}</p>
                </div>

                <div style={{ display:"flex", flexDirection:"column", gap:"8px", marginBottom:"14px" }}>
                  <UserBadge nombre={fichaSel.creado_por_nombre} email={fichaSel.creado_por_email} label={`Creó · ${fmtFecha(fichaSel.created_at)}`} color="#2563eb" />
                  {fichaSel.actualizado_por_nombre && (
                    <UserBadge nombre={fichaSel.actualizado_por_nombre} email={fichaSel.actualizado_por_email} label={`Actualizó · ${fmtFecha(fichaSel.fecha_actualizacion)}`} color="#d97706" />
                  )}
                </div>

                {fichaSel.planning_template_id && (
                  <div style={{ background:"#dbeafe", borderRadius:"6px", padding:"8px 12px", marginBottom:"12px", display:"flex", gap:"6px", alignItems:"center" }}>
                    <span style={{ fontSize:"14px" }}>🔗</span>
                    <div>
                      <p style={{ margin:0, fontSize:"11px", fontWeight:"700", color:"#1e40af" }}>Vinculada al POA</p>
                      <p style={{ margin:0, fontSize:"10px", color:"#1e40af" }}>
                        Programado: {Number(fichaSel.programado_real_poa||0)} · Ejecutado: {Number(fichaSel.ejecutado_real_poa||0)}
                      </p>
                    </div>
                  </div>
                )}

                {[["Eje",fichaSel.eje],["Tema",fichaSel.tema],["Política",fichaSel.politica_publica],["Objetivo",fichaSel.objetivo],["Estrategia",fichaSel.estrategia]].filter(([,v])=>v).map(([l,v])=>(
                  <div key={l} style={{ display:"flex", gap:"8px", marginBottom:"4px", fontSize:"12px" }}>
                    <span style={{ fontWeight:"700", color:"#374151", minWidth:"80px", flexShrink:0 }}>{l}:</span>
                    <span style={{ color:"#4b5563" }}>{v}</span>
                  </div>
                ))}

                <div style={{ margin:"16px 0 8px" }}>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={datosGrafica} margin={{top:16,right:8,left:0,bottom:20}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{fontSize:9}} angle={-10} textAnchor="end" />
                      <YAxis tick={{fontSize:9}} />
                      <Tooltip formatter={(v)=>[Number(v).toLocaleString(),""]} />
                      <Bar dataKey="value" radius={[4,4,0,0]}>
                        {datosGrafica.map((e,i)=><Cell key={i} fill={e.fill} />)}
                        <LabelList dataKey="value" position="top" style={{fontSize:"9px",fontWeight:"700"}} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ display:"flex", gap:"8px", marginTop:"12px" }}>
                  <button onClick={()=>exportarFichaPDF(fichaSel)} style={{ flex:1, background:"#dc2626", color:"white", border:"none", borderRadius:"8px", padding:"8px", cursor:"pointer", fontWeight:"600", fontSize:"11px" }}>📄 PDF</button>
                  <button onClick={()=>exportarFichaExcel(fichaSel)} style={{ flex:1, background:"#16a34a", color:"white", border:"none", borderRadius:"8px", padding:"8px", cursor:"pointer", fontWeight:"600", fontSize:"11px" }}>📊 Excel</button>
                  <button onClick={()=>cargarHistorial(fichaSel.id)} style={{ flex:1, background:"#7c3aed", color:"white", border:"none", borderRadius:"8px", padding:"8px", cursor:"pointer", fontWeight:"600", fontSize:"11px" }}>🕘 Historial</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ══════ MODAL HISTORIAL ══════ */}
      {modalHistorial && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:"20px" }}>
          <div style={{ background:"white", borderRadius:"16px", width:"100%", maxWidth:"860px", maxHeight:"90vh", display:"flex", flexDirection:"column", boxShadow:"0 25px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ padding:"20px 24px", borderBottom:"1px solid #e5e7eb", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <h3 style={{ margin:"0 0 4px", color:"#1e293b" }}>🕘 Historial de cambios</h3>
                <p style={{ margin:0, fontSize:"12px", color:"#6b7280" }}>
                  {fichaSel?.nombre_indicador} · {historial.length} versión{historial.length!==1?"es":""} registrada{historial.length!==1?"s":""}
                </p>
              </div>
              <button onClick={()=>{setModalHistorial(false);setVersionExpandida(null);setVersionComparar(null)}}
                style={{ background:"#f3f4f6", border:"none", borderRadius:"8px", padding:"8px 16px", cursor:"pointer", fontWeight:"600" }}>
                ✕ Cerrar
              </button>
            </div>

            <div style={{ overflowY:"auto", padding:"20px 24px", flex:1 }}>
              {cargandoHist ? (
                <div style={{ textAlign:"center", padding:"40px", color:"#6b7280" }}>Cargando historial...</div>
              ) : historial.length===0 ? (
                <div style={{ textAlign:"center", padding:"60px", color:"#9ca3af" }}>
                  <p style={{ fontSize:"40px", margin:"0 0 12px" }}>📋</p>
                  <p>Sin historial aún. Se genera al actualizar la ficha.</p>
                </div>
              ) : (
                <>
                  <div style={{ background:"#f0f9ff", border:"1px solid #bae6fd", borderRadius:"8px", padding:"12px 16px", marginBottom:"16px", display:"flex", gap:"12px", alignItems:"center", flexWrap:"wrap" }}>
                    <span style={{ fontSize:"13px", fontWeight:"600", color:"#0369a1" }}>🔍 Comparar versión:</span>
                    <select value={versionComparar??""} onChange={e=>setVersionComparar(e.target.value===""?null:Number(e.target.value))}
                      style={{ padding:"6px 12px", borderRadius:"6px", border:"1px solid #bae6fd", fontSize:"13px", background:"white" }}>
                      <option value="">-- Selecciona una versión --</option>
                      {historial.map(h=>(
                        <option key={h.id} value={h.version}>v{h.version} — {fmtFecha(h.fecha_modificacion)}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
                    {historial.map((h,idx) => {
                      const expandida = versionExpandida===h.id
                      const diffs = idx<historial.length-1 ? getDiferencias(h, historial[idx+1]) : []
                      return (
                        <div key={h.id} style={{ border:`2px solid ${expandida?"#7c3aed":"#e5e7eb"}`, borderRadius:"10px", overflow:"hidden" }}>
                          <div onClick={()=>setVersionExpandida(expandida?null:h.id)}
                            style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 16px", background:expandida?"#f5f3ff":"white", cursor:"pointer" }}>
                            <div style={{ display:"flex", gap:"12px", alignItems:"center" }}>
                              <div style={{ background:expandida?"#7c3aed":"#6b7280", color:"white", borderRadius:"999px", padding:"2px 10px", fontSize:"12px", fontWeight:"700" }}>v{h.version}</div>
                              <div>
                                <p style={{ margin:"0 0 2px", fontSize:"13px", fontWeight:"600", color:"#1e293b" }}>{fmtFecha(h.fecha_modificacion)}</p>
                                {h.modificado_por_nombre && (
                                  <p style={{ margin:0, fontSize:"11px", color:"#374151" }}>
                                    Por: <b>{h.modificado_por_nombre}</b>
                                    {h.modificado_por_email && <span style={{ color:"#6b7280" }}> ({h.modificado_por_email})</span>}
                                  </p>
                                )}
                                {h.comentario_cambio && <p style={{ margin:"2px 0 0", fontSize:"11px", color:"#6b7280" }}>💬 {h.comentario_cambio}</p>}
                              </div>
                            </div>
                            <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
                              {diffs.length>0 && (
                                <span style={{ background:"#fee2e2", color:"#991b1b", padding:"2px 8px", borderRadius:"999px", fontSize:"10px", fontWeight:"600" }}>
                                  {diffs.length} cambio{diffs.length!==1?"s":""}
                                </span>
                              )}
                              <span style={{ color:"#7c3aed", fontSize:"12px" }}>{expandida?"▲":"▼"}</span>
                            </div>
                          </div>
                          {expandida && (
                            <div style={{ padding:"14px 16px", borderTop:"1px solid #e5e7eb", background:"#fafafa" }}>
                              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"8px", marginBottom:"12px" }}>
                                {[["Valor inicial",h.valor_inicial,"#4682B4"],["Avance anual",h.avance_anual,"#16a34a"],["Meta anual",h.meta_anual,"#D4A030"],["Meta trianual",h.meta_trianual,"#505050"]].map(([l,v,c])=>(
                                  <div key={l} style={{ background:"white", borderRadius:"6px", padding:"8px", border:"1px solid #e5e7eb", textAlign:"center" }}>
                                    <p style={{ fontSize:"9px", color:"#6b7280", margin:"0 0 2px" }}>{l}</p>
                                    <p style={{ fontSize:"16px", fontWeight:"700", color:c, margin:0 }}>{Number(v||0)}</p>
                                  </div>
                                ))}
                              </div>
                              {diffs.length>0 && (
                                <div style={{ background:"#fff7ed", borderRadius:"6px", padding:"10px 12px" }}>
                                  <p style={{ fontWeight:"700", fontSize:"11px", color:"#92400e", margin:"0 0 6px" }}>⚡ Campos modificados respecto a versión anterior:</p>
                                  <div style={{ display:"flex", flexWrap:"wrap", gap:"4px" }}>
                                    {diffs.map(([,label])=>(
                                      <span key={label} style={{ background:"#fed7aa", color:"#9a3412", padding:"2px 8px", borderRadius:"999px", fontSize:"10px", fontWeight:"600" }}>{label}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}