import React, { useEffect, useState } from "react"

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
      alert("✅ Proyecto guardado correctamente")
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
              ? "⏳ Cargando catálogos..."
              : `✅ Catálogos listos · ${dependencias.length} deps · ${catProgramas.length} programas · ${catFuentes.length} fuentes`
            }
          </p>
        </div>
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
            <div style={{ textAlign:"center", padding:"80px", color:"#6b7280" }}>⏳ Cargando proyectos...</div>
          ) : proyectosFiltrados.length===0 ? (
            <div style={{ textAlign:"center", padding:"80px", background:"white", borderRadius:"12px", border:"1px solid #e5e7eb", color:"#9ca3af" }}>
              <p style={{ fontSize:"48px", margin:"0 0 12px" }}>🏗️</p>
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
                          <span>📅 {p.periodo_ejecucion || p.anio}</span>
                          <span>💰 ${Number(p.costo_total||0).toLocaleString("es-MX",{minimumFractionDigits:2})}</span>
                          {p.programa_desc && <span>📂 {p.clave_programa} — {p.programa_desc}</span>}
                          <span>🎯 {p.total_metas||0} meta{p.total_metas!==1?"s":""}</span>
                        </div>
                      </div>
                      <button onClick={()=>abrirEditar(p)}
                        style={{ background:"#dbeafe", color:"#1e40af", border:"none", borderRadius:"6px", padding:"7px 14px", cursor:"pointer", fontSize:"12px", fontWeight:"600", marginLeft:"12px" }}>
                        ✏️ Editar
                      </button>
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
              [1,"🏢 1. Identificación"],[2,"💰 2. Presupuesto"],[3,"🎯 3. Metas"],
              [4,"👥 4. Población"],[5,"📝 5. Narrativa"],[6,"📍 6. Georef"],[7,"✅ 7. Responsables"]
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
                  🌍 Alineación ODS y Ejes Rectores
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
                  🎯 Alineación al PMD
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
                <p style={{ fontWeight:"700", fontSize:"13px", color:"#374151", margin:"0 0 12px" }}>🏗️ Datos del Proyecto</p>
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
                <p style={{ fontWeight:"700", fontSize:"13px", color:"#374151", margin:"0 0 10px" }}>📂 Tipo de Programa/Proyecto</p>
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
                <p style={{ fontWeight:"700", fontSize:"13px", color:"#374151", margin:"0 0 10px" }}>📁 Documentación Soporte</p>
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
                  {enviando ? "Guardando..." : editando ? "✅ Actualizar" : "✅ Guardar y continuar →"}
                </button>
              </div>
            </>
          )}

          {seccion===2 && (
            <div style={sec}>
              <p style={{ fontWeight:"700", fontSize:"13px", color:"#374151", margin:"0 0 14px" }}>💰 Desglose del Presupuesto</p>
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
              <p style={{ fontWeight:"700", fontSize:"13px", color:"#374151", margin:"0 0 14px" }}>🎯 Metas Trimestrales</p>
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
              <p style={{ fontWeight:"700", fontSize:"13px", color:"#374151", margin:"0 0 14px" }}>👥 Población Objetivo / Área de Enfoque</p>
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
                  {enviando?"Guardando...":"✅ Guardar"}
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
                  {enviando?"Guardando...":"✅ Guardar narrativa"}
                </button>
              </div>
            </div>
          )}

          {seccion===6 && (
            <div>
              <div style={{ ...sec, background:"#fffbeb", border:"1px solid #fcd34d" }}>
                <p style={{ fontWeight:"700", fontSize:"13px", color:"#92400e", margin:"0 0 6px" }}>📍 Croquis Macro (Georreferenciación)</p>
                <p style={{ fontSize:"11px", color:"#92400e", margin:"0 0 12px" }}>
                  Mapbox se integra en Fase 2. Por ahora ingresa coordenadas manualmente. Puedes obtenerlas desde Google Maps (clic derecho → "¿Qué hay aquí?").
                </p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"12px" }}>
                  <div><label style={lbl}>Latitud</label><input name="georef_macro_lat" type="number" step="any" value={form.georef_macro_lat||""} onChange={handleChange} style={inp} placeholder="16.7516" /></div>
                  <div><label style={lbl}>Longitud</label><input name="georef_macro_lng" type="number" step="any" value={form.georef_macro_lng||""} onChange={handleChange} style={inp} placeholder="-93.1040" /></div>
                  <div><label style={lbl}>Localidad</label><input name="georef_macro_localidad" value={form.georef_macro_localidad||""} onChange={handleChange} style={inp} placeholder="Tuxtla Gutiérrez" /></div>
                </div>
              </div>
              <div style={{ ...sec, background:"#fffbeb", border:"1px solid #fcd34d" }}>
                <p style={{ fontWeight:"700", fontSize:"13px", color:"#92400e", margin:"0 0 12px" }}>📍 Croquis Micro</p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"12px" }}>
                  <div><label style={lbl}>Latitud</label><input name="georef_micro_lat" type="number" step="any" value={form.georef_micro_lat||""} onChange={handleChange} style={inp} /></div>
                  <div><label style={lbl}>Longitud</label><input name="georef_micro_lng" type="number" step="any" value={form.georef_micro_lng||""} onChange={handleChange} style={inp} /></div>
                  <div><label style={lbl}>Localidad</label><input name="georef_micro_localidad" value={form.georef_micro_localidad||""} onChange={handleChange} style={inp} /></div>
                </div>
              </div>
              <div style={{ display:"flex", justifyContent:"flex-end" }}>
                <button onClick={handleGuardar} disabled={enviando}
                  style={{ padding:"10px 24px", borderRadius:"8px", background:"#1e40af", color:"white", border:"none", cursor:"pointer", fontWeight:"600", opacity:enviando?0.7:1 }}>
                  {enviando?"Guardando...":"✅ Guardar"}
                </button>
              </div>
            </div>
          )}

          {seccion===7 && (
            <div style={sec}>
              <p style={{ fontWeight:"700", fontSize:"13px", color:"#374151", margin:"0 0 14px" }}>✅ Responsable del Proyecto</p>
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
                  {enviando?"Guardando...":"✅ Guardar CIP completa"}
                </button>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  )
}