import React, { useEffect, useState } from "react";
import socket from "../services/socket";
import "../styles/dashboard.css";

export default function DashboardDependencias() {
  const [user, setUser] = useState(null);
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [lineas, setLineas] = useState([]);
  const [showStrategies, setShowStrategies] = useState(true);
  const [showNotificaciones, setShowNotificaciones] = useState(true);
  const [modalLinea, setModalLinea] = useState(false);
  const [nuevaLinea, setNuevaLinea] = useState("");
  const [notificaciones, setNotificaciones] = useState([]);
  const [anioFiltro, setAnioFiltro] = useState(2025);
  const [pdfsHabilitados, setPdfsHabilitados] = useState([]);
  const [modalPDF, setModalPDF] = useState(null); 
  const años = [2025, 2026];

  const logout = () => { localStorage.removeItem("token"); window.location.href = "/"; };

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("https://sistema-planeacion-production.up.railway.app/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        setUser(data);
        socket.emit("join_room", data.dependency_id);
        fetch(`http://localhost:3001/api/pdf/habilitados/${data.dependency_id}`)
          .then(r => r.json())
          .then(setPdfsHabilitados)
          .catch(() => {});
      });
  }, []);

  useEffect(() => {
    const handleLineaRevisada = (data) => {
      setNotificaciones(prev => [{ id: `${Date.now()}-${Math.random()}`, msg: data.mensaje, estado: data.estado }, ...prev]);
    };
    const handlePlaneacionReviso = (data) => {
      const emoji = data.estado === "aprobado" ? "✅" : "❌";
      const msg = `${emoji} Tu ${data.tipo} del T${data.trimestre}-${data.anio} fue ${data.estado.toUpperCase()}`;
      setNotificaciones(prev => [{ id: `${Date.now()}-${Math.random()}`, msg, estado: data.estado }, ...prev]);
      setLineas(prev => prev.map(l =>
        l.planning_id === data.planning_id ? {
          ...l,
          estado_revision_p25: data.anio === 2025 && data.tipo === "programado" ? data.estado : l.estado_revision_p25,
          estado_revision_e25: data.anio === 2025 && data.tipo === "ejecutado"  ? data.estado : l.estado_revision_e25,
          estado_revision_p26: data.anio === 2026 && data.tipo === "programado" ? data.estado : l.estado_revision_p26,
          estado_revision_e26: data.anio === 2026 && data.tipo === "ejecutado"  ? data.estado : l.estado_revision_e26,
        } : l
      ));
    };
    const handlePdfHabilitado = (data) => {
      setPdfsHabilitados(prev => [...prev, data]);
      setNotificaciones(prev => [{ id: `${Date.now()}-${Math.random()}`, msg: data.mensaje, estado: "aprobado" }, ...prev]);
    };

    socket.on("linea_revisada", handleLineaRevisada);
    socket.on("planeacion_reviso", handlePlaneacionReviso);
    socket.on("pdf_habilitado", handlePdfHabilitado);
    return () => {
      socket.off("linea_revisada", handleLineaRevisada);
      socket.off("planeacion_reviso", handlePlaneacionReviso);
      socket.off("pdf_habilitado", handlePdfHabilitado);
    };
  }, []);

  if (!user) return <p>Cargando...</p>;

  const pdfEstaHabilitado = (anio, trimestre) => {
    const porTrimestre = pdfsHabilitados.some(p => p.anio === anio && Number(p.trimestre) === trimestre);
    const porAnio = pdfsHabilitados.some(p => p.anio === anio && (p.trimestre === null || p.trimestre === undefined));
    return porTrimestre || porAnio;
  };

  const estrategiasAgrupadas = Object.values(
    user.estrategias.reduce((acc, e) => {
      if (!acc[e.id]) {
        acc[e.id] = { id: e.id, name: e.name, pmd_eje: e.pmd_eje, pmd_tema: e.pmd_tema, pmd_politica_publica: e.pmd_politica_publica, pmd_objetivo: e.pmd_objetivo, pmd_estrategia: e.pmd_estrategia, lineas: [] };
      }
      acc[e.id].lineas.push({ id: e.linea_id, lineas_accion: e.lineas_accion, nomenclatura: e.nomenclatura, nombre2: e.nombre2, responsable: e.responsable, plazo: e.plazo, linea_base: e.linea_base, total: e.total, ejercicio: e.ejercicio, columna1: e.columna1 });
      return acc;
    }, {})
  );

  const seleccionarEstrategia = async (e) => {
    setSelectedStrategy(e);
    const lineasIniciales = await Promise.all(e.lineas.map(async (l) => {
      const res = await fetch(`http://localhost:3001/api/trimestres/porLinea/${l.id}`);
      const trimestres = await res.json();
      const get = (anio, trim, tipo) => trimestres.find(t => t.anio === anio && t.trimestre === trim && t.tipo === tipo)?.valor || "";
      const getComentario = (anio, tipo) => trimestres.find(t => t.anio === anio && t.tipo === tipo)?.comentario || "";
      const getEstado = (anio, tipo) => trimestres.find(t => t.anio === anio && t.tipo === tipo)?.estado_revision || "pendiente";
      const getEnvio = (anio, tipo) => {
        const encontrado = trimestres.find(t => t.anio === anio && t.tipo === tipo);
        if (!encontrado) return "borrador";
        if (Number(encontrado.valor) === 0 && !encontrado.comentario) return "borrador";
        return encontrado.estado_envio || "borrador";
      };
      return {
        ...l, planning_id: l.id, estado: "Aprobado",
        estado_revision_p25: getEstado(2025, "programado"), estado_revision_e25: getEstado(2025, "ejecutado"),
        estado_revision_p26: getEstado(2026, "programado"), estado_revision_e26: getEstado(2026, "ejecutado"),
        envio_p25: getEnvio(2025, "programado"), envio_e25: getEnvio(2025, "ejecutado"),
        envio_p26: getEnvio(2026, "programado"), envio_e26: getEnvio(2026, "ejecutado"),
        p1t: get(2025,1,"programado"), p2t: get(2025,2,"programado"), p3t: get(2025,3,"programado"), p4t: get(2025,4,"programado"),
        e1t: get(2025,1,"ejecutado"),  e2t: get(2025,2,"ejecutado"),  e3t: get(2025,3,"ejecutado"),  e4t: get(2025,4,"ejecutado"),
        comentario25: getComentario(2025,"programado"), comentario25_exec: getComentario(2025,"ejecutado"),
        p1t26: get(2026,1,"programado"), p2t26: get(2026,2,"programado"), p3t26: get(2026,3,"programado"), p4t26: get(2026,4,"programado"),
        e1t26: get(2026,1,"ejecutado"),  e2t26: get(2026,2,"ejecutado"),  e3t26: get(2026,3,"ejecutado"),  e4t26: get(2026,4,"ejecutado"),
        comentario26: getComentario(2026,"programado"), comentario26_exec: getComentario(2026,"ejecutado"),
      };
    }));
    setLineas(lineasIniciales);
  };

  const bloqueado = (l, campo) => {
    const envioMap    = { p25: l.envio_p25, e25: l.envio_e25, p26: l.envio_p26, e26: l.envio_e26 };
    const revisionMap = { p25: l.estado_revision_p25, e25: l.estado_revision_e25, p26: l.estado_revision_p26, e26: l.estado_revision_e26 };
    return envioMap[campo] === "enviado" && revisionMap[campo] !== "rechazado";
  };

  const handleChange = (index, field, value) => {
    const nuevas = [...lineas];
    nuevas[index][field] = value;
    setLineas(nuevas);
  };

  const guardarPlaneacion = async () => {
    try {
      for (const l of lineas) {
        const registros = [
          { anio:2025, trimestre:1, tipo:"programado", valor:l.p1t,   comentario:l.comentario25 },
          { anio:2025, trimestre:2, tipo:"programado", valor:l.p2t,   comentario:l.comentario25 },
          { anio:2025, trimestre:3, tipo:"programado", valor:l.p3t,   comentario:l.comentario25 },
          { anio:2025, trimestre:4, tipo:"programado", valor:l.p4t,   comentario:l.comentario25 },
          { anio:2025, trimestre:1, tipo:"ejecutado",  valor:l.e1t,   comentario:l.comentario25_exec },
          { anio:2025, trimestre:2, tipo:"ejecutado",  valor:l.e2t,   comentario:l.comentario25_exec },
          { anio:2025, trimestre:3, tipo:"ejecutado",  valor:l.e3t,   comentario:l.comentario25_exec },
          { anio:2025, trimestre:4, tipo:"ejecutado",  valor:l.e4t,   comentario:l.comentario25_exec },
          { anio:2026, trimestre:1, tipo:"programado", valor:l.p1t26, comentario:l.comentario26 },
          { anio:2026, trimestre:2, tipo:"programado", valor:l.p2t26, comentario:l.comentario26 },
          { anio:2026, trimestre:3, tipo:"programado", valor:l.p3t26, comentario:l.comentario26 },
          { anio:2026, trimestre:4, tipo:"programado", valor:l.p4t26, comentario:l.comentario26 },
          { anio:2026, trimestre:1, tipo:"ejecutado",  valor:l.e1t26, comentario:l.comentario26_exec },
          { anio:2026, trimestre:2, tipo:"ejecutado",  valor:l.e2t26, comentario:l.comentario26_exec },
          { anio:2026, trimestre:3, tipo:"ejecutado",  valor:l.e3t26, comentario:l.comentario26_exec },
          { anio:2026, trimestre:4, tipo:"ejecutado",  valor:l.e4t26, comentario:l.comentario26_exec },
        ];
        for (const r of registros) {
          await fetch("http://localhost:3001/api/trimestres/guardar", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ planning_id: l.planning_id, anio: r.anio, trimestre: r.trimestre, tipo: r.tipo, valor: r.valor || 0, comentario: r.comentario || "" })
          });
        }
      }
      setLineas(prev => prev.map(l => ({
        ...l,
        envio_p25: (Number(l.p1t||0)+Number(l.p2t||0)+Number(l.p3t||0)+Number(l.p4t||0)) > 0 ? "enviado" : l.envio_p25,
        envio_e25: (Number(l.e1t||0)+Number(l.e2t||0)+Number(l.e3t||0)+Number(l.e4t||0)) > 0 ? "enviado" : l.envio_e25,
        envio_p26: (Number(l.p1t26||0)+Number(l.p2t26||0)+Number(l.p3t26||0)+Number(l.p4t26||0)) > 0 ? "enviado" : l.envio_p26,
        envio_e26: (Number(l.e1t26||0)+Number(l.e2t26||0)+Number(l.e3t26||0)+Number(l.e4t26||0)) > 0 ? "enviado" : l.envio_e26,
      })));
      alert("✅ Planeación enviada para revisión");
    } catch (err) { console.error(err); alert("Error al guardar"); }
  };

  const enviarRevision = async () => {
    if (!nuevaLinea.trim()) return;
    const res = await fetch("http://localhost:3001/api/lineas/nueva", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ estrategia_id: selectedStrategy.id, lineas_accion: nuevaLinea }) });
    const data = await res.json();
    setLineas([...lineas, data]);
    setNuevaLinea(""); setModalLinea(false);
  };

  const EstadoBadge = ({ estado }) => {
    const colores = { aprobado: { bg:"#d1fae5", color:"#065f46" }, rechazado: { bg:"#fee2e2", color:"#991b1b" }, pendiente: { bg:"#fef9c3", color:"#854d0e" }, enviado: { bg:"#dbeafe", color:"#1e40af" } };
    const c = colores[estado] || colores.pendiente;
    return <span style={{ background: c.bg, color: c.color, padding:"2px 8px", borderRadius:"999px", fontSize:"11px", fontWeight:"600" }}>{estado}</span>;
  };

  const colsAnio = {
    2025: {
      prog: { campos:["p1t","p2t","p3t","p4t"],     comentario:"comentario25",      bloqueo:"p25", estado:"estado_revision_p25" },
      exec: { campos:["e1t","e2t","e3t","e4t"],     comentario:"comentario25_exec", bloqueo:"e25", estado:"estado_revision_e25" },
    },
    2026: {
      prog: { campos:["p1t26","p2t26","p3t26","p4t26"], comentario:"comentario26",      bloqueo:"p26", estado:"estado_revision_p26" },
      exec: { campos:["e1t26","e2t26","e3t26","e4t26"], comentario:"comentario26_exec", bloqueo:"e26", estado:"estado_revision_e26" },
    },
  };
  const cols = colsAnio[anioFiltro];

  return (
    <div className="layout">
      <div className="sidebar">
        <h2>{user.dependencia}</h2>
        <div className="dependency-info">
          <p><b>Titular:</b> {user.titular}</p>
          <p><b>Enlace:</b> {user.enlace}</p>
          <button className="logout-btn" onClick={logout}>Cerrar sesión</button>
        </div>

        <button className="strategy-toggle" onClick={() => setShowStrategies(!showStrategies)}>
          Estrategias {showStrategies ? "▲" : "▼"}
        </button>
        {showStrategies && (
          <ul className="strategy-list">
            {estrategiasAgrupadas.map((e, index) => (
              <li key={e.id} className={selectedStrategy?.id === e.id ? "active" : ""} onClick={() => seleccionarEstrategia(e)}>
                <span className="strategy-number">{index + 1}</span>
                <span className="strategy-name">{e.name}</span>
              </li>
            ))}
          </ul>
        )}

        <div style={{ marginTop: "16px" }}>
          <button className="strategy-toggle" onClick={() => setShowNotificaciones(!showNotificaciones)} style={{ position: "relative", width: "100%" }}>
            🔔 Notificaciones {showNotificaciones ? "▲" : "▼"}
            {notificaciones.length > 0 && (
              <span style={{ position: "absolute", top: "-6px", right: "-6px", background: "#ef4444", color: "white", borderRadius: "999px", fontSize: "10px", padding: "2px 6px", fontWeight: "700" }}>{notificaciones.length}</span>
            )}
          </button>
          {showNotificaciones && (
            <div style={{ maxHeight: "300px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px", padding: "0 4px" }}>
              {notificaciones.length === 0 ? (
                <p style={{ fontSize: "12px", color: "#888", textAlign: "center", padding: "12px" }}>Sin notificaciones</p>
              ) : (
                <>
                  {notificaciones.map(n => (
                    <div key={n.id} style={{ padding: "8px 10px", borderRadius: "8px", background: n.estado === "aprobado" ? "#d1fae5" : "#fee2e2", color: n.estado === "aprobado" ? "#065f46" : "#991b1b", fontSize: "11px", fontWeight: "600", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "6px" }}>
                      <span>{n.msg}</span>
                      <button onClick={() => setNotificaciones(prev => prev.filter(x => x.id !== n.id))} style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "13px", flexShrink: 0 }}>✕</button>
                    </div>
                  ))}
                  <button onClick={() => setNotificaciones([])} style={{ marginTop: "4px", background: "transparent", border: "1px solid #ccc", borderRadius: "6px", padding: "4px", fontSize: "11px", cursor: "pointer", color: "#666" }}>Limpiar todo</button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="content">
        {!selectedStrategy && <div className="empty-panel"><h2>Selecciona una estrategia</h2></div>}

        {selectedStrategy && (
          <div className="strategy-panel">
            <h2>{selectedStrategy.name}</h2>
            <div className="planning-grid">
              <div><label>EJE</label><p>{selectedStrategy.pmd_eje || "-"}</p></div>
              <div><label>TEMA</label><p>{selectedStrategy.pmd_tema || "-"}</p></div>
              <div><label>POLÍTICA PÚBLICA</label><p>{selectedStrategy.pmd_politica_publica || "-"}</p></div>
              <div><label>OBJETIVO</label><p>{selectedStrategy.pmd_objetivo || "-"}</p></div>
              <div><label>ESTRATEGIA PMD</label><p>{selectedStrategy.pmd_estrategia || "-"}</p></div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "20px 0 12px" }}>
              <h3 style={{ margin: 0 }}>Planeación</h3>
              <div style={{ display: "flex", gap: "6px", background: "#f3f4f6", borderRadius: "10px", padding: "4px" }}>
                {años.map(a => (
                  <button key={a} onClick={() => setAnioFiltro(a)} style={{ padding: "6px 18px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "700", fontSize: "13px", background: anioFiltro === a ? "#2563eb" : "transparent", color: anioFiltro === a ? "white" : "#6b7280", transition: "all 0.15s" }}>{a}</button>
                ))}
              </div>
            </div>

            <div className="table-container">
              <table className="excel-table">
                <thead>
                  <tr>
                    <th rowSpan="2">#</th>
                    <th rowSpan="2">Línea de acción</th>
                    <th rowSpan="2">Estado</th>
                    <th colSpan="7">Programado {anioFiltro}</th>
                    <th colSpan="7">Ejecutado {anioFiltro}</th>
                  </tr>
                  <tr>
                    <th>T1</th><th>T2</th><th>T3</th><th>T4</th><th>Acumulado</th><th>Comentarios</th><th>Revisión</th><th>T1</th><th>T2</th><th>T3</th><th>T4</th><th>Acumulado</th><th>Comentarios</th><th>Revisión</th>
                  </tr>
                </thead>
                <tbody>
                  {lineas.map((l, i) => {
                    const pCampos = cols.prog.campos;
                    const eCampos = cols.exec.campos;
                    const pBloq = bloqueado(l, cols.prog.bloqueo);
                    const eBloq = bloqueado(l, cols.exec.bloqueo);
                    const pAcum = pCampos.reduce((s, c) => s + Number(l[c] || 0), 0);
                    const eAcum = eCampos.reduce((s, c) => s + Number(l[c] || 0), 0);
                    const stiloBloq = { background: "#f3f4f6", color: "#9ca3af" };
                    return (
                      <tr key={`${l.planning_id}-${i}`}>
                        <td>{i + 1}</td>
                        <td>{l.lineas_accion}</td>
                        <td>{l.estado === "Pendiente" ? <span className="estado-pendiente">Pendiente</span> : <span className="estado-aprobado">Aprobado</span>}</td>
                        {pCampos.map(campo => (
                          <td key={campo}><input disabled={pBloq} value={l[campo]} onChange={e => handleChange(i, campo, e.target.value)} style={pBloq ? stiloBloq : {}} /></td>
                        ))}
                        <td>{pAcum}</td>
                        <td><textarea disabled={pBloq} value={l[cols.prog.comentario] || ""} onChange={e => handleChange(i, cols.prog.comentario, e.target.value)} style={pBloq ? stiloBloq : {}} /></td>
                        <td><EstadoBadge estado={l[cols.prog.estado] || "pendiente"} /></td>
                        {eCampos.map(campo => (
                          <td key={campo}><input disabled={eBloq} value={l[campo]} onChange={e => handleChange(i, campo, e.target.value)} style={eBloq ? stiloBloq : {}} /></td>
                        ))}
                        <td>{eAcum}</td>
                        <td><textarea disabled={eBloq} value={l[cols.exec.comentario] || ""} onChange={e => handleChange(i, cols.exec.comentario, e.target.value)} style={eBloq ? stiloBloq : {}} /></td>
                        <td><EstadoBadge estado={l[cols.exec.estado] || "pendiente"} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Botones PDF por trimestre */}
            <div style={{ marginTop: "16px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {[
                { label:"T1-2025", anio:2025, trimestre:1 },
                { label:"T2-2025", anio:2025, trimestre:2 },
                { label:"T3-2025", anio:2025, trimestre:3 },
                { label:"T4-2025", anio:2025, trimestre:4 },
                { label:"Año 2025", anio:2025, trimestre:null },
                { label:"T1-2026", anio:2026, trimestre:1 },
                { label:"T2-2026", anio:2026, trimestre:2 },
                { label:"T3-2026", anio:2026, trimestre:3 },
                { label:"T4-2026", anio:2026, trimestre:4 },
                { label:"Año 2026", anio:2026, trimestre:null },
              ].map(({ label, anio, trimestre }) => {
                const habilitado = pdfEstaHabilitado(anio, trimestre);
                return (
                  <button
                    key={label}
                    disabled={!habilitado}
                    onClick={() => habilitado && setModalPDF({ anio, trimestre })}
                    title={!habilitado ? "Planeación aún no ha habilitado este PDF" : `Descargar PDF ${label}`}
                    style={{ background: habilitado ? "#dc2626" : "#e5e7eb", color: habilitado ? "white" : "#9ca3af", border: "none", borderRadius: "6px", padding: "6px 14px", fontSize: "12px", fontWeight: "600", cursor: habilitado ? "pointer" : "not-allowed", opacity: habilitado ? 1 : 0.7, transition: "all 0.2s" }}
                  >
                    📄 {label}
                  </button>
                );
              })}
            </div>

            <div className="save-container">
              <button className="save-btn" onClick={guardarPlaneacion}>Guardar y enviar a revisión</button>
              <button className="add-line-btn" onClick={() => setModalLinea(true)}>Añadir línea</button>
            </div>
          </div>
        )}
      </div>

      {/* Modal PDF descarga */}
      {modalPDF && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
          <div style={{ background: "white", borderRadius: "12px", padding: "24px", width: "320px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <h3 style={{ marginBottom: "12px" }}>📄 Descargar PDF</h3>
            <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "20px" }}>
              Período: <b>{modalPDF.trimestre ? `T${modalPDF.trimestre}-${modalPDF.anio}` : `Año ${modalPDF.anio}`}</b>
            </p>
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button onClick={() => setModalPDF(null)} style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #ddd", cursor: "pointer", background: "white" }}>Cancelar</button>
              <button
                onClick={async () => {
                  const { generarPDF } = await import("../utils/generarPDF");
                  const estrategiasParaPDF = estrategiasAgrupadas.reduce((acc, e) => ({ ...acc, [e.id]: e }), {});
                  const trimestresParaPDF = {};
                  lineas.forEach(l => { trimestresParaPDF[l.planning_id] = []; });
                  const depParaPDF = { name: user.dependencia, titular: user.titular, enlace: user.enlace };
                  generarPDF(depParaPDF, estrategiasParaPDF, trimestresParaPDF, modalPDF, user.enlace, user.titular);
                  setModalPDF(null);
                }}
                style={{ padding: "8px 16px", borderRadius: "6px", background: "#dc2626", color: "white", border: "none", cursor: "pointer", fontWeight: "600" }}
              >📄 Descargar</button>
            </div>
          </div>
        </div>
      )}

      {modalLinea && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Añadir línea de acción</h3>
            <input type="text" placeholder="Nombre de la línea" value={nuevaLinea} onChange={(e) => setNuevaLinea(e.target.value)} />
            <div className="modal-buttons">
              <button onClick={() => setModalLinea(false)}>Cancelar</button>
              <button onClick={enviarRevision}>Enviar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}