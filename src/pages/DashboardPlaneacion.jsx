import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../services/socket";
import { generarPDF } from "../utils/generarPDF";
import "../styles/dashboardPlaneacion.css";

export default function DashboardPlaneacion() {
  const [dependencias, setDependencias] = useState([]);
  const [activa, setActiva] = useState(null);
  const [openDependencias, setOpenDependencias] = useState(false);
  const [trimestres, setTrimestres] = useState({});
  const [modalPDF, setModalPDF] = useState(false);
  const [filtroPDF, setFiltroPDF] = useState({ anio: 2025, trimestre: 1 });
  const [lineasPendientes, setLineasPendientes] = useState([]);
  const [showLineasPendientes, setShowLineasPendientes] = useState(true);
  const [modalRechazar, setModalRechazar] = useState(null);
  const [comentarioRechazo, setComentarioRechazo] = useState("");
  const [anioFiltro, setAnioFiltro] = useState(2025);
  const [modalHabilitarPDF, setModalHabilitarPDF] = useState(null);
  const [filtroHabilitar, setFiltroHabilitar] = useState({ anio: 2025, trimestre: null });
  const navigate = useNavigate();
  const años = [2025, 2026];

  const eliminarLineaDeAccion = async (lineaId) => {
    const confirmar = window.confirm("¿Estás seguro de que deseas eliminar esta línea de acción? Se borrarán permanentemente todos sus datos.");
    if (!confirmar) return;
    try {
      const res = await fetch(`http://localhost:3001/api/lineas/eliminar/${lineaId}`, { method: "DELETE" });
      if (res.ok) {
        setDependencias((prev) =>
          prev.map((dep) => {
            if (dep.id === activa) {
              const nuevasEstrategias = { ...dep.estrategias };
              Object.keys(nuevasEstrategias).forEach((key) => {
                nuevasEstrategias[key].lineas = nuevasEstrategias[key].lineas.filter((l) => l.id !== lineaId);
              });
              return { ...dep, estrategias: nuevasEstrategias };
            }
            return dep;
          })
        );
        alert("✅ Línea eliminada correctamente.");
      } else {
        alert("❌ Error al eliminar la línea.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Hubo un fallo en la conexión.");
    }
  };

  const habilitarPDF = async () => {
    if (!dependencia) return;
    await fetch("http://localhost:3001/api/pdf/habilitar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dependency_id: dependencia.id,
        anio: filtroHabilitar.anio,
        trimestre: filtroHabilitar.trimestre ?? null,
        habilitado_por: null
      })
    });
    setModalHabilitarPDF(false);
    alert(`✅ PDF habilitado para ${dependencia.name}`);
  };

  useEffect(() => {
    socket.emit("join_planeacion");

    const fetchData = async () => {
      try {
        const resDep = await fetch("http://localhost:3001/api/planeacion/dashboard");
        const data = await resDep.json();
        setDependencias(data);
        if (data.length > 0) setActiva(data[0].id);

        const allTrimestres = {};
        for (const dep of data) {
          const estrategias = dep.estrategias ? Object.values(dep.estrategias) : [];
          for (const est of estrategias) {
            for (const linea of est.lineas) {
              const resT = await fetch(`http://localhost:3001/api/trimestres/porLinea/${linea.id}`);
              allTrimestres[linea.id] = await resT.json();
            }
          }
        }
        setTrimestres(allTrimestres);

        const resPend = await fetch("http://localhost:3001/api/lineas/pendientes");
        const dataPend = await resPend.json();
        setLineasPendientes(dataPend);
      } catch (error) {
        console.error("Error cargando datos:", error);
      }
    };

    fetchData();

    socket.on("nueva_linea_pendiente", (data) => setLineasPendientes((prev) => [data, ...prev]));
    socket.on("trimestre_actualizado", async (data) => {
      const res = await fetch(`http://localhost:3001/api/trimestres/porLinea/${data.planning_id}`);
      const t = await res.json();
      setTrimestres((prev) => ({ ...prev, [data.planning_id]: t }));
    });
    socket.on("revision-trimestre", (data) => {
      setTrimestres((prev) => {
        const lista = prev[data.planning_id] || [];
        return { ...prev, [data.planning_id]: lista.map((t) => (t.id === data.id ? data : t)) };
      });
    });

    return () => {
      socket.off("nueva_linea_pendiente");
      socket.off("trimestre_actualizado");
      socket.off("revision-trimestre");
    };
  }, []);

  const getValor = (planning_id, anio, trimestre, tipo) => {
    const lista = trimestres[planning_id] || [];
    return lista.find((t) => t.anio === anio && t.trimestre === trimestre && t.tipo === tipo)?.valor ?? "-";
  };

  const getComentario = (planning_id, anio, tipo) => {
    const lista = trimestres[planning_id] || [];
    return lista.find((t) => t.anio === anio && t.tipo === tipo)?.comentario ?? "";
  };

  const sumar = (planning_id, anio, tipo) =>
    [1, 2, 3, 4].reduce((acc, t) => acc + (Number(getValor(planning_id, anio, t, tipo)) || 0), 0);

  const getEstadoRevision = (planning_id, anio, tipo) => {
    const lista = trimestres[planning_id] || [];
    return lista.find((t) => t.anio === anio && t.tipo === tipo)?.estado_revision || "pendiente";
  };

  const getFechaEnvio = (planning_id, anio, tipo) => {
    const lista = trimestres[planning_id] || [];
    const t = lista.find((x) => x.anio === anio && x.tipo === tipo);
    if (!t?.fecha_envio) return "-";
    return new Date(t.fecha_envio).toLocaleString("es-MX", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  const revisarTrimestre = async (planning_id, anio, tipo, estado, dependency_id) => {
    const lista = trimestres[planning_id] || [];
    const registros = lista.filter((t) => t.anio === anio && t.tipo === tipo);
    for (const t of registros) {
      await fetch(`http://localhost:3001/api/review/${t.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado, comentario: "", user_id: null, dependency_id }),
      });
    }
    setTrimestres((prev) => {
      const nuevaLista = (prev[planning_id] || []).map((t) =>
        t.anio === anio && t.tipo === tipo ? { ...t, estado_revision: estado } : t
      );
      return { ...prev, [planning_id]: nuevaLista };
    });
  };

  const EstadoBadge = ({ estado }) => {
    const colores = {
      aprobado: { bg: "#d1fae5", color: "#065f46" },
      rechazado: { bg: "#fee2e2", color: "#991b1b" },
      pendiente: { bg: "#fef9c3", color: "#854d0e" },
    };
    const c = colores[estado] || colores.pendiente;
    return (
      <span style={{ background: c.bg, color: c.color, padding: "2px 8px", borderRadius: "999px", fontSize: "11px", fontWeight: "600" }}>
        {estado}
      </span>
    );
  };

  const dependencia = dependencias.find((d) => d.id === activa);

  return (
    <div className="layout">
      <div className="sidebar">
        <h2 className="logo">Planeación</h2>

        <button className="menu-btn" onClick={() => setOpenDependencias(!openDependencias)}>
          Dependencias {openDependencias ? "▲" : "▼"}
        </button>
        <div className={`submenu ${openDependencias ? "open" : ""}`}>
          {dependencias.map((dep) => (
            <button key={dep.id} className={`dep-item ${dep.id === activa ? "active" : ""}`} onClick={() => setActiva(dep.id)}>
              {dep.name}
            </button>
          ))}
        </div>

        <div style={{ marginTop: "16px" }}>
          <button className="menu-btn" onClick={() => setShowLineasPendientes(!showLineasPendientes)} style={{ position: "relative", width: "100%" }}>
            📋 Líneas pendientes {showLineasPendientes ? "▲" : "▼"}
            {lineasPendientes.length > 0 && (
              <span style={{ position: "absolute", top: "-6px", right: "-6px", background: "#ef4444", color: "white", borderRadius: "999px", fontSize: "10px", padding: "2px 6px", fontWeight: "700" }}>
                {lineasPendientes.length}
              </span>
            )}
          </button>
          {showLineasPendientes && (
            <div style={{ maxHeight: "400px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px", padding: "0 4px" }}>
              {lineasPendientes.length === 0 ? (
                <p style={{ fontSize: "12px", color: "#888", textAlign: "center", padding: "12px" }}>Sin líneas pendientes</p>
              ) : (
                lineasPendientes.map((l) => (
                  <div key={l.id} style={{ background: "white", borderRadius: "8px", padding: "10px", border: "1px solid #e5e7eb", fontSize: "11px" }}>
                    <p style={{ fontWeight: "700", marginBottom: "2px" }}>{l.dependencia}</p>
                    <p style={{ color: "#6b7280", fontSize: "10px", marginBottom: "2px" }}>{l.estrategia}</p>
                    <p style={{ marginBottom: "4px" }}>{l.lineas_accion}</p>
                    <p style={{ color: "#9ca3af", fontSize: "10px", marginBottom: "6px" }}>
                      📅 {new Date(l.created_at).toLocaleString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                    <div style={{ display: "flex", gap: "4px" }}>
                      <button
                        onClick={async () => {
                          await fetch(`http://localhost:3001/api/lineas/aprobar/${l.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user_id: null }) });
                          setLineasPendientes(prev => prev.filter(x => x.id !== l.id));
                        }}
                        style={{ flex: 1, background: "#16a34a", color: "white", border: "none", borderRadius: "4px", padding: "4px", cursor: "pointer", fontSize: "11px" }}
                      >✅ Aprobar</button>
                      <button onClick={() => setModalRechazar(l)} style={{ flex: 1, background: "#dc2626", color: "white", border: "none", borderRadius: "4px", padding: "4px", cursor: "pointer", fontSize: "11px" }}>❌ Rechazar</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <button className="logout-btn" onClick={() => { localStorage.removeItem("token"); localStorage.removeItem("user"); sessionStorage.clear(); navigate("/"); }}>
          Cerrar sesión
        </button>
      </div>

      <div className="contenido">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
          <h2 className="titulo" style={{ margin: 0 }}>
            {dependencia ? dependencia.name : "Selecciona una dependencia"}
          </h2>
          <div style={{ display: "flex", gap: "6px", background: "#f3f4f6", borderRadius: "10px", padding: "4px" }}>
            {años.map(a => (
              <button key={a} onClick={() => setAnioFiltro(a)} style={{ padding: "6px 20px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "700", fontSize: "13px", background: anioFiltro === a ? "#2563eb" : "transparent", color: anioFiltro === a ? "white" : "#6b7280", transition: "all 0.15s" }}>
                {a}
              </button>
            ))}
          </div>
        </div>

        {dependencia && Object.values(dependencia.estrategias || {}).map((est) => (
          <div key={est.id} className="card">
            <div className="card-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
              <h3 style={{ margin: 0 }}>{est.name}</h3>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="badge">{est.lineas.length} líneas</span>
                <button
                  onClick={() => { setModalHabilitarPDF(est.id); setFiltroHabilitar({ anio: anioFiltro, trimestre: null }); }}
                  style={{ background: "#2563eb", color: "white", border: "none", borderRadius: "6px", padding: "6px 14px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}
                >
                  📄 Habilitar PDF
                </button>
              </div>
            </div>

            <div className="tabla-wrapper">
              <table className="tabla-poa">
                <thead>
                  <tr>
                    <th rowSpan="2">Acción</th>
                    <th rowSpan="2">#</th>
                    <th rowSpan="2">Línea de acción</th>
                    <th colSpan="7">Programado {anioFiltro}</th>
                    <th colSpan="7">Ejecutado {anioFiltro}</th>
                  </tr>
                  <tr>
                    <th>T1</th><th>T2</th><th>T3</th><th>T4</th><th>Total</th><th>Comentario</th><th>Revisión</th><th>T1</th><th>T2</th><th>T3</th><th>T4</th><th>Total</th><th>Comentario</th><th>Revisión</th>
                  </tr>
                </thead>
                <tbody>
                  {est.lineas.map((linea, i) => (
                    <tr key={`${est.id}-${i}-${linea.id}`}>
                      <td style={{ textAlign: "center" }}>
                        <button onClick={() => eliminarLineaDeAccion(linea.id)} style={{ background: "#fee2e2", color: "#dc2626", border: "none", padding: "4px 8px", borderRadius: "4px", cursor: "pointer" }}>🗑️</button>
                      </td>
                      <td>{i + 1}</td>
                      <td style={{ minWidth: "200px" }}>{linea.lineas_accion}</td>
                      {[
                        { anio: anioFiltro, tipo: "programado" },
                        { anio: anioFiltro, tipo: "ejecutado" },
                      ].map(({ anio, tipo }) => (
                        <React.Fragment key={`${est.id}-${linea.id}-${i}-${anio}-${tipo}`}>
                          <td>{getValor(linea.id, anio, 1, tipo)}</td>
                          <td>{getValor(linea.id, anio, 2, tipo)}</td>
                          <td>{getValor(linea.id, anio, 3, tipo)}</td>
                          <td>{getValor(linea.id, anio, 4, tipo)}</td>
                          <td><b>{sumar(linea.id, anio, tipo)}</b></td>
                          <td style={{ fontSize: "10px" }}>{getComentario(linea.id, anio, tipo)}</td>
                          <td style={{ minWidth: "140px" }}>
                            <div style={{ fontSize: "9px", color: "#6b7280", marginBottom: "2px" }}>📅 {getFechaEnvio(linea.id, anio, tipo)}</div>
                            <EstadoBadge estado={getEstadoRevision(linea.id, anio, tipo)} />
                            <div style={{ display: "flex", gap: "2px", marginTop: "4px" }}>
                              <button onClick={() => revisarTrimestre(linea.id, anio, tipo, "aprobado", dependencia.id)} style={{ flex: 1, background: "#16a34a", color: "white", border: "none", borderRadius: "4px", padding: "2px 4px", fontSize: "10px", cursor: "pointer" }}>✅ Aprobar</button>
                              <button onClick={() => revisarTrimestre(linea.id, anio, tipo, "rechazado", dependencia.id)} style={{ flex: 1, background: "#dc2626", color: "white", border: "none", borderRadius: "4px", padding: "2px 4px", fontSize: "10px", cursor: "pointer" }}>❌ Rechazar</button>
                            </div>
                          </td>
                        </React.Fragment>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {dependencia && (
          <div style={{ marginTop: "24px", marginBottom: "24px", display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={() => setModalPDF(true)}
              style={{ background: "#dc2626", color: "white", border: "none", borderRadius: "8px", padding: "10px 24px", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}
            >
              📄 Exportar PDF
            </button>
          </div>
        )}
      </div>

      {/* Modal Habilitar PDF */}
      {modalHabilitarPDF && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
          <div style={{ background: "white", borderRadius: "12px", padding: "24px", width: "320px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <h3 style={{ marginBottom: "16px" }}>📄 Habilitar PDF para {dependencia?.name}</h3>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600" }}>Año</label>
            <select value={filtroHabilitar.anio} onChange={e => setFiltroHabilitar(prev => ({ ...prev, anio: Number(e.target.value) }))} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ddd", marginBottom: "12px" }}>
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
            </select>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600" }}>Período</label>
            <select value={filtroHabilitar.trimestre ?? ""} onChange={e => setFiltroHabilitar(prev => ({ ...prev, trimestre: e.target.value === "" ? null : Number(e.target.value) }))} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ddd", marginBottom: "20px" }}>
              <option value="">Año completo</option>
              <option value={1}>T1 - Enero a Marzo</option>
              <option value={2}>T2 - Abril a Junio</option>
              <option value={3}>T3 - Julio a Septiembre</option>
              <option value={4}>T4 - Octubre a Diciembre</option>
            </select>
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button onClick={() => setModalHabilitarPDF(false)} style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #ddd", cursor: "pointer", background: "white" }}>Cancelar</button>
              <button onClick={habilitarPDF} style={{ padding: "8px 16px", borderRadius: "6px", background: "#2563eb", color: "white", border: "none", cursor: "pointer", fontWeight: "600" }}>✅ Habilitar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal PDF exportar */}
      {modalPDF && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
          <div style={{ background: "white", borderRadius: "12px", padding: "24px", width: "320px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <h3 style={{ marginBottom: "16px" }}>📄 Exportar PDF</h3>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600" }}>Año</label>
            <select value={filtroPDF.anio} onChange={e => setFiltroPDF(prev => ({ ...prev, anio: Number(e.target.value) }))} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ddd", marginBottom: "12px" }}>
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
            </select>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600" }}>Trimestre</label>
            <select value={filtroPDF.trimestre ?? ""} onChange={e => setFiltroPDF(prev => ({ ...prev, trimestre: e.target.value === "" ? null : Number(e.target.value) }))} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ddd", marginBottom: "20px" }}>
              <option value="">Año completo</option>
              <option value={1}>T1 - Enero a Marzo</option>
              <option value={2}>T2 - Abril a Junio</option>
              <option value={3}>T3 - Julio a Septiembre</option>
              <option value={4}>T4 - Octubre a Diciembre</option>
            </select>
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button onClick={() => setModalPDF(false)} style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #ddd", cursor: "pointer", background: "white" }}>Cancelar</button>
              <button onClick={() => { generarPDF(dependencia, dependencia.estrategias, trimestres, filtroPDF, dependencia.enlace, dependencia.titular); setModalPDF(false); }} style={{ padding: "8px 16px", borderRadius: "6px", background: "#dc2626", color: "white", border: "none", cursor: "pointer", fontWeight: "600" }}>📄 Descargar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal rechazar línea */}
      {modalRechazar && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
          <div style={{ background: "white", borderRadius: "12px", padding: "24px", width: "360px" }}>
            <h3 style={{ marginBottom: "12px" }}>❌ Rechazar línea</h3>
            <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "12px" }}>{modalRechazar.lineas_accion}</p>
            <textarea placeholder="Motivo del rechazo..." value={comentarioRechazo} onChange={e => setComentarioRechazo(e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ddd", marginBottom: "16px", minHeight: "80px", resize: "vertical" }} />
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button onClick={() => { setModalRechazar(null); setComentarioRechazo(""); }} style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #ddd", cursor: "pointer" }}>Cancelar</button>
              <button
                onClick={async () => {
                  await fetch(`http://localhost:3001/api/lineas/rechazar/${modalRechazar.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ comentario: comentarioRechazo, user_id: null }) });
                  setLineasPendientes(prev => prev.filter(x => x.id !== modalRechazar.id));
                  setModalRechazar(null);
                  setComentarioRechazo("");
                }}
                style={{ padding: "8px 16px", borderRadius: "6px", background: "#dc2626", color: "white", border: "none", cursor: "pointer", fontWeight: "600" }}
              >Confirmar rechazo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}