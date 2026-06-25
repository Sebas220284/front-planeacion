import React, { useEffect, useState } from "react"

const FORM_VACIO = {
  name:"", email:"", password:"", role_id:"",
  dependency_id:"", dependency_position:"", dependency_role:""
}

export default function GestionUsers({ dependencias = [], currentUser = null }) {
  const [usuarios, setUsuarios]   = useState([])
  const [roles, setRoles]         = useState([])
  const [vista, setVista]         = useState("lista")
  const [form, setForm]           = useState(FORM_VACIO)
  const [editando, setEditando]   = useState(null)
  const [enviando, setEnviando]   = useState(false)
  const [cargando, setCargando]   = useState(true)
  const [busqueda, setBusqueda]   = useState("")
  const [filtroRol, setFiltroRol] = useState("")

  const [modalPassword, setModalPassword] = useState(null) 
  const [nuevaPassword, setNuevaPassword] = useState("")
  const [confirmarPassword, setConfirmarPassword] = useState("")
  const [enviandoPassword, setEnviandoPassword] = useState(false)

  const API = "http://localhost:3100/api/usuarios"

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    setCargando(true)
    try {
      const [usrs, rls] = await Promise.all([
        fetch(`${API}/`).then(r=>r.json()),
        fetch(`${API}/roles`).then(r=>r.json()),
      ])
      setUsuarios(Array.isArray(usrs) ? usrs : [])
      setRoles(Array.isArray(rls) ? rls : [])
    } catch(e) { console.error(e) }
    setCargando(false)
  }

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleGuardar = async () => {
    if (!form.name || !form.email || !form.role_id) {
      alert("Nombre, correo y rol son obligatorios"); return
    }
    if (!editando && !form.password) {
      alert("La contraseña es obligatoria al crear un usuario"); return
    }
    setEnviando(true)
    try {
      const url = editando ? `${API}/${editando}` : `${API}/`
      const res = await fetch(url, {
        method: editando ? "PUT" : "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al guardar")

      await cargar()
      setForm(FORM_VACIO)
      setEditando(null)
      setVista("lista")
      alert(editando ? "✅ Usuario actualizado" : "✅ Usuario creado correctamente")
    } catch(e) {
      alert("Error: " + e.message)
    }
    setEnviando(false)
  }

  const abrirEditar = (u) => {
    setForm({
      name: u.name || "",
      email: u.email || "",
      password: "", // nunca se precarga
      role_id: u.role_id || "",
      dependency_id: u.dependency_id || "",
      dependency_position: u.dependency_position || "",
      dependency_role: u.dependency_role || "",
    })
    setEditando(u.id)
    setVista("form")
  }

  const handleEliminar = async (u) => {
    if (u.id === currentUser?.id) { alert("No puedes eliminar tu propio usuario"); return }
    if (!window.confirm(`¿Eliminar al usuario "${u.name}"? Esta acción no se puede deshacer.`)) return
    try {
      const res = await fetch(`${API}/${u.id}?solicitante_id=${currentUser?.id||""}`, { method:"DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setUsuarios(prev => prev.filter(x => x.id !== u.id))
    } catch(e) { alert("Error: " + e.message) }
  }

  const abrirModalPassword = (u) => {
    setModalPassword(u)
    setNuevaPassword("")
    setConfirmarPassword("")
  }

  const handleCambiarPassword = async () => {
    if (nuevaPassword.length < 6) { alert("La contraseña debe tener al menos 6 caracteres"); return }
    if (nuevaPassword !== confirmarPassword) { alert("Las contraseñas no coinciden"); return }

    setEnviandoPassword(true)
    try {
      const res = await fetch(`${API}/${modalPassword.id}/password`, {
        method:"PUT",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ password: nuevaPassword })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      alert(`✅ Contraseña actualizada para ${modalPassword.name}`)
      setModalPassword(null)
    } catch(e) { alert("Error: " + e.message) }
    setEnviandoPassword(false)
  }

  const usuariosFiltrados = usuarios.filter(u => {
    const q = busqueda.toLowerCase()
    const matchQ = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    const matchRol = !filtroRol || u.role_id === filtroRol
    return matchQ && matchRol
  })

  const colorRol = (nivel) => {
    if (nivel >= 100) return { bg:"#fee2e2", color:"#991b1b" } // admin
    if (nivel >= 80)  return { bg:"#dbeafe", color:"#1e40af" } // planeacion
    if (nivel >= 70)  return { bg:"#e9d5ff", color:"#6b21a8" } // estrategica/inversion
    if (nivel >= 50)  return { bg:"#d1fae5", color:"#065f46" } // dependencias
    return { bg:"#f3f4f6", color:"#374151" } // viewer
  }

  const inp = { width:"100%", padding:"9px 12px", borderRadius:"6px", border:"1px solid #d1d5db", fontSize:"13px", boxSizing:"border-box", color:"#000", background:"#fff" }
  const lbl = { display:"block", fontWeight:"600", fontSize:"12px", marginBottom:"4px", color:"#374151" }
  const sec = { background:"#f8fafc", borderRadius:"8px", padding:"16px", marginBottom:"16px", border:"1px solid #e5e7eb" }

  return (
    <div style={{ padding:"24px", background:"#f8fafc", minHeight:"100vh" }}>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"20px", flexWrap:"wrap", gap:"12px" }}>
        <div>
          <h2 style={{ margin:"0 0 4px", color:"#1e293b" }}>👤 Gestión de Usuarios</h2>
          <p style={{ margin:0, color:"#6b7280", fontSize:"13px" }}>{usuarios.length} usuario{usuarios.length!==1?"s":""} registrado{usuarios.length!==1?"s":""}</p>
        </div>
        <div>
          {vista==="form" && (
            <button onClick={()=>{ setVista("lista"); setEditando(null); setForm(FORM_VACIO) }}
              style={{ padding:"9px 18px", background:"#6b7280", color:"white", border:"none", borderRadius:"8px", cursor:"pointer", fontSize:"13px", fontWeight:"600", marginRight:"8px" }}>
              ← Volver
            </button>
          )}
          {vista==="lista" && (
            <button onClick={()=>{ setForm(FORM_VACIO); setEditando(null); setVista("form") }}
              style={{ padding:"9px 20px", background:"#1e40af", color:"white", border:"none", borderRadius:"8px", cursor:"pointer", fontSize:"13px", fontWeight:"600" }}>
              + Nuevo usuario
            </button>
          )}
        </div>
      </div>

      {/* ── LISTA ── */}
      {vista==="lista" && (
        <>
          <div style={{ display:"flex", gap:"10px", marginBottom:"16px", flexWrap:"wrap" }}>
            <input value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="🔍 Buscar nombre o correo..."
              style={{ padding:"9px 12px", borderRadius:"8px", border:"1px solid #e5e7eb", fontSize:"13px", width:"260px" }} />
            <select value={filtroRol} onChange={e=>setFiltroRol(e.target.value)}
              style={{ padding:"9px 12px", borderRadius:"8px", border:"1px solid #e5e7eb", fontSize:"13px", background:"white" }}>
              <option value="">Todos los roles</option>
              {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>

          {cargando ? (
            <div style={{ textAlign:"center", padding:"60px", color:"#6b7280" }}>⏳ Cargando...</div>
          ) : (
            <div style={{ background:"white", borderRadius:"12px", border:"1px solid #e5e7eb", overflow:"hidden" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"13px" }}>
                <thead>
                  <tr style={{ background:"#1e1e1e" }}>
                    {["Nombre","Correo","Rol","Dependencia","Acciones"].map(h=>(
                      <th key={h} style={{ padding:"10px 14px", color:"white", textAlign:"left", fontWeight:"700" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {usuariosFiltrados.length===0 ? (
                    <tr><td colSpan={5} style={{ padding:"40px", textAlign:"center", color:"#9ca3af" }}>Sin usuarios encontrados</td></tr>
                  ) : usuariosFiltrados.map((u,i) => {
                    const colorB = colorRol(u.rol_nivel)
                    return (
                      <tr key={u.id} style={{ background:i%2===0?"white":"#f9fafb", borderBottom:"1px solid #f1f5f9" }}>
                        <td style={{ padding:"10px 14px", fontWeight:"600", color:"#1e293b" }}>
                          {u.name} {u.id===currentUser?.id && <span style={{ fontSize:"10px", color:"#6b7280" }}>(tú)</span>}
                        </td>
                        <td style={{ padding:"10px 14px", color:"#6b7280" }}>{u.email}</td>
                        <td style={{ padding:"10px 14px" }}>
                          <span style={{ background:colorB.bg, color:colorB.color, padding:"3px 10px", borderRadius:"999px", fontSize:"11px", fontWeight:"700" }}>
                            {u.rol_nombre}
                          </span>
                        </td>
                        <td style={{ padding:"10px 14px", color:"#374151", fontSize:"12px" }}>{u.dependencia_nombre || "-"}</td>
                        <td style={{ padding:"10px 14px" }}>
                          <div style={{ display:"flex", gap:"6px" }}>
                            <button onClick={()=>abrirEditar(u)}
                              style={{ background:"#dbeafe", color:"#1e40af", border:"none", borderRadius:"6px", padding:"6px 10px", cursor:"pointer", fontSize:"11px", fontWeight:"600" }}>
                              ✏️ Editar
                            </button>
                            <button onClick={()=>abrirModalPassword(u)}
                              style={{ background:"#fef3c7", color:"#92400e", border:"none", borderRadius:"6px", padding:"6px 10px", cursor:"pointer", fontSize:"11px", fontWeight:"600" }}>
                              🔑 Contraseña
                            </button>
                            <button onClick={()=>handleEliminar(u)}
                              style={{ background:"#fee2e2", color:"#dc2626", border:"none", borderRadius:"6px", padding:"6px 10px", cursor:"pointer", fontSize:"11px" }}>
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ── FORM CREAR/EDITAR ── */}
      {vista==="form" && (
        <div style={{ background:"white", borderRadius:"12px", padding:"24px", maxWidth:"640px", margin:"0 auto", border:"1px solid #e5e7eb" }}>
          <h3 style={{ margin:"0 0 20px", color:"#1e293b" }}>{editando ? "✏️ Editar usuario" : "✨ Nuevo usuario"}</h3>

          <div style={sec}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px" }}>
              <div>
                <label style={lbl}>Nombre completo *</label>
                <input name="name" value={form.name} onChange={handleChange} style={inp} />
              </div>
              <div>
                <label style={lbl}>Correo electrónico *</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} style={inp} />
              </div>

              {!editando && (
                <div style={{ gridColumn:"1/-1" }}>
                  <label style={lbl}>Contraseña *</label>
                  <input name="password" type="password" value={form.password} onChange={handleChange} style={inp} placeholder="Mínimo 6 caracteres" />
                  <p style={{ fontSize:"11px", color:"#6b7280", margin:"4px 0 0" }}>Se encriptará automáticamente con bcrypt antes de guardarla.</p>
                </div>
              )}

              {editando && (
                <div style={{ gridColumn:"1/-1", background:"#fffbeb", border:"1px solid #fcd34d", borderRadius:"6px", padding:"10px 14px" }}>
                  <p style={{ fontSize:"12px", color:"#92400e", margin:0 }}>
                    🔒 Para cambiar la contraseña usa el botón "🔑 Contraseña" en la lista de usuarios.
                  </p>
                </div>
              )}

              <div style={{ gridColumn:"1/-1" }}>
                <label style={lbl}>Rol *</label>
                <select name="role_id" value={form.role_id} onChange={handleChange} style={inp}>
                  <option value="">-- Selecciona un rol --</option>
                  {roles.map(r => <option key={r.id} value={r.id}>{r.name} — {r.description}</option>)}
                </select>
              </div>

              <div style={{ gridColumn:"1/-1" }}>
                <label style={lbl}>Dependencia (opcional)</label>
                <select name="dependency_id" value={form.dependency_id} onChange={handleChange} style={inp}>
                  <option value="">Sin dependencia asignada</option>
                  {dependencias.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>

              <div>
                <label style={lbl}>Puesto en dependencia</label>
                <input name="dependency_position" value={form.dependency_position} onChange={handleChange} style={inp} placeholder="Ej: Director" />
              </div>
              <div>
                <label style={lbl}>Rol en dependencia</label>
                <input name="dependency_role" value={form.dependency_role} onChange={handleChange} style={inp} placeholder="Ej: Enlace" />
              </div>
            </div>
          </div>

          <div style={{ display:"flex", gap:"10px", justifyContent:"flex-end" }}>
            <button onClick={()=>{setVista("lista");setEditando(null);setForm(FORM_VACIO)}}
              style={{ padding:"10px 20px", borderRadius:"8px", border:"1px solid #d1d5db", cursor:"pointer", background:"white" }}>
              Cancelar
            </button>
            <button onClick={handleGuardar} disabled={enviando}
              style={{ padding:"10px 24px", borderRadius:"8px", background:"#1e40af", color:"white", border:"none", cursor:"pointer", fontWeight:"600", opacity:enviando?0.7:1 }}>
              {enviando ? "Guardando..." : editando ? "✅ Actualizar usuario" : "✅ Crear usuario"}
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL CAMBIAR CONTRASEÑA ── */}
      {modalPassword && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}>
          <div style={{ background:"white", borderRadius:"14px", padding:"24px", width:"100%", maxWidth:"420px", boxShadow:"0 25px 60px rgba(0,0,0,0.3)" }}>
            <h3 style={{ margin:"0 0 6px", color:"#1e293b" }}>🔑 Cambiar contraseña</h3>
            <p style={{ margin:"0 0 16px", fontSize:"13px", color:"#6b7280" }}>
              Usuario: <b style={{ color:"#374151" }}>{modalPassword.name}</b> ({modalPassword.email})
            </p>

            <div style={{ marginBottom:"12px" }}>
              <label style={lbl}>Nueva contraseña</label>
              <input type="password" value={nuevaPassword} onChange={e=>setNuevaPassword(e.target.value)}
                style={inp} placeholder="Mínimo 6 caracteres" />
            </div>
            <div style={{ marginBottom:"16px" }}>
              <label style={lbl}>Confirmar contraseña</label>
              <input type="password" value={confirmarPassword} onChange={e=>setConfirmarPassword(e.target.value)}
                style={inp} placeholder="Repite la contraseña" />
            </div>

            {nuevaPassword && confirmarPassword && nuevaPassword !== confirmarPassword && (
              <p style={{ color:"#dc2626", fontSize:"12px", margin:"0 0 12px" }}>⚠️ Las contraseñas no coinciden</p>
            )}

            <div style={{ display:"flex", gap:"10px", justifyContent:"flex-end" }}>
              <button onClick={()=>setModalPassword(null)}
                style={{ padding:"9px 18px", borderRadius:"8px", border:"1px solid #d1d5db", cursor:"pointer", background:"white" }}>
                Cancelar
              </button>
              <button onClick={handleCambiarPassword} disabled={enviandoPassword}
                style={{ padding:"9px 20px", borderRadius:"8px", background:"#d97706", color:"white", border:"none", cursor:"pointer", fontWeight:"600", opacity:enviandoPassword?0.7:1 }}>
                {enviandoPassword ? "Guardando..." : "✅ Cambiar contraseña"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}