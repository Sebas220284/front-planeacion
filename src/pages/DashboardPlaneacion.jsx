import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../services/socket";
import { generarPDF } from "../utils/generarPDF";
import ReportesPlaneacion from "./ReportesPlaneacion"
import FichasTecnicas from "./FichasTecnicas";
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
  const [vistaAlineacion, setVistaAlineacion] = useState(false);
  const [estrategiasPMD, setEstrategiasPMD] = useState([]);
  const [filtroEje, setFiltroEje] = useState(null);
  const [vistaReportes, setVistaReportes] = useState(false);
  const [vistaFichas, setVistaFichas] = useState(false)
  const navigate = useNavigate();
  const años = [2025, 2026];
const irAReportes = () => {
    setVistaReportes(true);
    setVistaAlineacion(false);
    setActiva(null);
  };
  const irADashboard = (depId) => {
    setVistaReportes(false);
    setVistaAlineacion(false);
    setActiva(depId);
  };
  const dependencia = dependencias.find((d) => d.id === activa);

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
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const cargarAlineacion = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/pmd/aprobados");
      const data = await res.json();
      setEstrategiasPMD(data);
      setVistaAlineacion(true);
      setFiltroEje(null);
    } catch (e) {
      alert("Error cargando alineación");
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
    return t?.fecha_envio ? new Date(t.fecha_envio).toLocaleString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-";
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
    setTrimestres((prev) => ({
      ...prev,
      [planning_id]: (prev[planning_id] || []).map((t) => t.anio === anio && t.tipo === tipo ? { ...t, estado_revision: estado } : t)
    }));
  };

  const EstadoBadge = ({ estado }) => {
    const colores = { aprobado: { bg: "#d1fae5", color: "#065f46" }, rechazado: { bg: "#fee2e2", color: "#991b1b" }, pendiente: { bg: "#fef9c3", color: "#854d0e" } };
    const c = colores[estado] || colores.pendiente;
    return <span style={{ background: c.bg, color: c.color, padding: "2px 8px", borderRadius: "999px", fontSize: "11px", fontWeight: "600" }}>{estado}</span>;
  };

  const renderAlineacion = () => {
    const ejesUnicos = [...new Set(estrategiasPMD.map(e => e.eje))];
    const filtradas = filtroEje ? estrategiasPMD.filter(e => e.eje === filtroEje) : estrategiasPMD;
    const porEje = filtradas.reduce((acc, e) => {
      if (!acc[e.eje]) acc[e.eje] = {};
      if (!acc[e.eje][e.tema]) acc[e.eje][e.tema] = {};
      if (!acc[e.eje][e.tema][e.politica_publica]) acc[e.eje][e.tema][e.politica_publica] = {};
      if (!acc[e.eje][e.tema][e.politica_publica][e.objetivo]) acc[e.eje][e.tema][e.politica_publica][e.objetivo] = [];
      if (!acc[e.eje][e.tema][e.politica_publica][e.objetivo].includes(e.estrategia)) acc[e.eje][e.tema][e.politica_publica][e.objetivo].push(e.estrategia);
      return acc;
    }, {});

    return (
      <div className="alineacion-container" style={{ animation: "fadeIn 0.4s ease" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
          <div>
            <h2 style={{ color: "#1e293b", margin: 0 }}>🎯 Alineación Estratégica PMD</h2>
            <p style={{ color: "#64748b", fontSize: "13px", marginTop: "4px" }}>Explora la jerarquía del Plan Municipal de Desarrollo</p>
          </div>
          <button onClick={() => setVistaAlineacion(false)} className="btn-tabla" style={{ background: "#64748b", color: "white", padding: "10px 20px", borderRadius: "8px" }}>
            ← Volver al Dashboard
          </button>
        </div>

        <div className="filter-container" style={{ display: "flex", flexWrap: "wrap", gap: "10px", background: "#f1f5f9", padding: "15px", borderRadius: "12px", marginBottom: "25px" }}>
          <button className={`filter-pill ${filtroEje === null ? 'active' : ''}`} onClick={() => setFiltroEje(null)}>Ver Todo ({estrategiasPMD.length})</button>
          {ejesUnicos.map(eje => (
            <button key={eje} className={`filter-pill ${filtroEje === eje ? 'active' : ''}`} onClick={() => setFiltroEje(eje)} title={eje}>
              {eje.length > 40 ? eje.substring(0, 40) + "..." : eje}
            </button>
          ))}
        </div>

        {Object.entries(porEje).map(([eje, temas]) => (
          <div key={eje} style={{ marginBottom: "30px" }}>
            <div style={{ background: "#1e293b", color: "white", padding: "16px 24px", borderRadius: "12px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
              <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px", opacity: 0.7 }}>Eje Rector</span>
              <h3 style={{ margin: 0, fontSize: "16px", marginTop: "4px" }}>{eje}</h3>
            </div>
            {Object.entries(temas).map(([tema, politicas]) => (
              <div key={tema} className="nivel-tema" style={{ marginLeft: "20px", borderLeft: "3px solid #fecaca", paddingLeft: "15px", marginTop: "15px" }}>
                <p style={{ color: "#b91c1c", fontWeight: "700", fontSize: "13px", textTransform: "uppercase" }}>📍 TEMA: {tema}</p>
                {Object.entries(politicas).map(([politica, objetivos]) => (
                  <div key={politica} className="nivel-politica" style={{ marginLeft: "20px", borderLeft: "3px solid #fed7aa", paddingLeft: "15px", marginTop: "10px" }}>
                    <p style={{ color: "#c2410c", fontWeight: "600", fontSize: "12px" }}>📜 POLÍTICA: {politica}</p>
                    {Object.entries(objetivos).map(([objetivo, estrategias]) => (
                      <div key={objetivo} className="nivel-objetivo" style={{ marginLeft: "20px", borderLeft: "3px solid #bbf7d0", paddingLeft: "15px", marginTop: "10px" }}>
                        <p style={{ color: "#15803d", fontWeight: "600", fontSize: "12px" }}>🎯 OBJETIVO: {objetivo}</p>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "6px", marginTop: "8px" }}>
                          {estrategias.map((est, idx) => (
                            <div key={idx} style={{ background: "#eff6ff", border: "1px solid #dbeafe", padding: "10px 14px", borderRadius: "8px", fontSize: "12px", color: "#1e40af", display: "flex", gap: "10px" }}>
                              <span style={{ fontWeight: "800", color: "#3b82f6" }}>E{idx+1}</span>
                              <span>{est}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
  <div className="layout">
  <div className="sidebar">
    <h2 className="logo">Planeación</h2>

    <button
      onClick={() => {
        setVistaReportes(true);
        setVistaAlineacion(false);
        setActiva(null);
      }}
      className={`menu-btn ${vistaReportes ? "active" : ""}`}
      style={{
        background: vistaReportes ? "#0e7490" : "#0891b2",
        color: "white",
        marginBottom: "8px",
        width: "100%",
        border: "none",
        borderRadius: "8px",
        padding: "10px",
        cursor: "pointer"
      }}
    >
      📊 Reportes Globales
    </button>
<button
  onClick={() => { 
    setVistaFichas(true);    
    setVistaAlineacion(false); 
    setVistaReportes(false);  
    setActiva(null);          
  }}
  style={{ 
    marginTop: "8px", 
    background: vistaFichas ? "#854d0e" : "#d97706", 
    color: "white", 
    border: "none", 
    borderRadius: "8px", 
    padding: "12px", 
    cursor: "pointer", 
    fontSize: "13px", 
    fontWeight: "600", 
    width: "100%" 
  }}
>
  📋 Fichas Técnicas
</button>
    <button
      onClick={() => {
        cargarAlineacion(); 
        setVistaAlineacion(true);
        setVistaReportes(false);
        setActiva(null);
      }}
      style={{
        marginTop: "4px",
        background: vistaAlineacion ? "#5b21b6" : "#7c3aed",
        color: "white",
        border: "none",
        borderRadius: "8px",
        padding: "12px",
        cursor: "pointer",
        fontSize: "13px",
        fontWeight: "600",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px"
      }}
    >
      🎯 Alineación Estratégica
    </button>

    <div style={{ margin: "15px 0", borderBottom: "1px solid #334155" }} />

    <button className="menu-btn" onClick={() => setOpenDependencias(!openDependencias)}>
      🏢 Dependencias {openDependencias ? "▲" : "▼"}
    </button>
    
    <div className={`submenu ${openDependencias ? "open" : ""}`}>
      {dependencias.map((dep) => (
        <button
          key={dep.id}
          className={`dep-item ${dep.id === activa && !vistaAlineacion && !vistaReportes ? "active" : ""}`}
          onClick={() => {
            setActiva(dep.id);
            setVistaAlineacion(false);
            setVistaReportes(false);
          }}
        >
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
        <div style={{ maxHeight: "300px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
          {lineasPendientes.map((l) => (
            <div key={l.id} className="notif-card-dark" style={{ background: "white", borderRadius: "8px", padding: "10px", border: "1px solid #e5e7eb", fontSize: "11px" }}>
              <p style={{ fontWeight: "700", color: "#1e293b" }}>{l.dependencia}</p>
              <p style={{ margin: "4px 0", color: "#475569" }}>{l.lineas_accion}</p>
              <div style={{ display: "flex", gap: "4px", marginTop: "8px" }}>
                <button className="btn-aprobar-mini" onClick={() => { /* tu lógica */ }}>Aprobar</button>
                <button className="btn-rechazar-mini" onClick={() => setModalRechazar(l)}>Rechazar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

    <button className="logout-btn" onClick={() => { localStorage.removeItem("token"); navigate("/"); }}>
      Cerrar sesión
    </button>
  </div>

      <div className="contenido">
        {vistaReportes ? (
          <ReportesPlaneacion />
        ) : vistaAlineacion ? (
          renderAlineacion()
        ) : (


          
          <>
          <div className="contenido">
  {vistaFichas ? (
    <FichasTecnicas dependencias={dependencias} />
  ) : vistaReportes ? (
    <ReportesPlaneacion />
  ) : vistaAlineacion ? (
    renderAlineacion()
  ) : dependencia ? (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <h2 className="titulo">{dependencia.name}</h2>
      </div>
    </>
  ) : (
    <div className="p-10">Selecciona una dependencia o un apartado del menú</div>
  )}
</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <h2 className="titulo" style={{ margin: 0 }}>{dependencia ? dependencia.name : "Selecciona una dependencia"}</h2>
              <div style={{ display: "flex", gap: "6px", background: "#f3f4f6", borderRadius: "10px", padding: "4px" }}>
                {años.map(a => (
                  <button key={a} onClick={() => setAnioFiltro(a)} style={{ padding: "8px 22px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "700", fontSize: "13px", background: anioFiltro === a ? "#2563eb" : "transparent", color: anioFiltro === a ? "white" : "#6b7280", transition: "0.2s" }}>{a}</button>
                ))}
              </div>
            </div>

            {dependencia && Object.values(dependencia.estrategias || {}).map((est) => (
              <div key={est.id} className="card" style={{ marginBottom: "25px" }}>
                <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ margin: 0, fontSize: "15px", color: "#1e293b" }}>{est.name}</h3>
                  <button onClick={() => setModalHabilitarPDF(est.id)} style={{ background: "#2563eb", color: "white", border: "none", borderRadius: "6px", padding: "8px 14px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>📄 Habilitar PDF</button>
                </div>
                <div className="tabla-wrapper">
                  <table className="tabla-poa">
                    <thead>
                      <tr>
                        <th rowSpan="2" style={{ width: "50px" }}>Acción</th>
                        <th rowSpan="2" style={{ width: "40px" }}>#</th>
                        <th rowSpan="2" style={{ textAlign: "left", minWidth: "250px" }}>Línea de Acción</th>
                        <th colSpan="7" className="header-section-prog">📊 Programado {anioFiltro}</th>
                        <th colSpan="7" className="header-section-ejec">✅ Ejecutado {anioFiltro}</th>
                      </tr>
                      <tr>
                        <th>T1</th><th>T2</th><th>T3</th><th>T4</th><th className="col-total">Total</th><th>Comentario</th><th>Revisión</th>
                        <th>T1</th><th>T2</th><th>T3</th><th>T4</th><th className="col-total">Total</th><th>Comentario</th><th>Revisión</th>
                      </tr>
                    </thead>
                    <tbody>
                      {est.lineas.map((linea, i) => (
                        <tr key={linea.id}>
                          <td style={{ textAlign: "center" }}><button onClick={() => eliminarLineaDeAccion(linea.id)} style={{ background: "#fee2e2", color: "#dc2626", border: "none", padding: "6px", borderRadius: "6px", cursor: "pointer" }}>🗑️</button></td>
                          <td style={{ textAlign: "center", fontWeight: "600", color: "#64748b" }}>{i + 1}</td>
                          <td style={{ fontSize: "12px", lineHeight: "1.4" }}>{linea.lineas_accion}</td>
                          {[{ anio: anioFiltro, tipo: "programado" }, { anio: anioFiltro, tipo: "ejecutado" }].map(({ anio, tipo }) => (
                            <React.Fragment key={`${tipo}-${linea.id}`}>
                              <td style={{ textAlign: "center" }}>{getValor(linea.id, anio, 1, tipo)}</td>
                              <td style={{ textAlign: "center" }}>{getValor(linea.id, anio, 2, tipo)}</td>
                              <td style={{ textAlign: "center" }}>{getValor(linea.id, anio, 3, tipo)}</td>
                              <td style={{ textAlign: "center" }}>{getValor(linea.id, anio, 4, tipo)}</td>
                              <td className="col-total" style={{ textAlign: "center" }}>{sumar(linea.id, anio, tipo)}</td>
                              <td style={{ fontSize: "10px", color: "#64748b", maxWidth: "150px" }}>{getComentario(linea.id, anio, tipo) || "-"}</td>
                              <td>
                                <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "center" }}>
                                  <EstadoBadge estado={getEstadoRevision(linea.id, anio, tipo)} />
                                  <div style={{ display: "flex", gap: "4px" }}>
                                    <button className="btn-tabla btn-aprobar" onClick={() => revisarTrimestre(linea.id, anio, tipo, "aprobado", dependencia.id)}>Aprobar</button>
                                    <button className="btn-tabla btn-rechazar" onClick={() => revisarTrimestre(linea.id, anio, tipo, "rechazado", dependencia.id)}>Rechazar</button>
                                  </div>
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
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
                <button onClick={() => setModalPDF(true)} style={{ background: "#dc2626", color: "white", border: "none", borderRadius: "8px", padding: "12px 25px", fontSize: "14px", fontWeight: "700", cursor: "pointer", boxShadow: "0 4px 10px rgba(220, 38, 38, 0.2)" }}>📄 Exportar PDF Global</button>
              </div>
            )}
          </>
        )}
      </div>

      {modalHabilitarPDF && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "white", borderRadius: "15px", padding: "25px", width: "350px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            <h3 style={{ marginBottom: "15px", fontSize: "16px" }}>Habilitar PDF</h3>
            <select value={filtroHabilitar.anio} onChange={e => setFiltroHabilitar(p => ({ ...p, anio: Number(e.target.value) }))} style={{ width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <option value={2025}>2025</option><option value={2026}>2026</option>
            </select>
            <select value={filtroHabilitar.trimestre ?? ""} onChange={e => setFiltroHabilitar(p => ({ ...p, trimestre: e.target.value === "" ? null : Number(e.target.value) }))} style={{ width: "100%", padding: "10px", marginBottom: "20px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <option value="">Año completo</option><option value={1}>Trimestre 1</option><option value={2}>Trimestre 2</option><option value={3}>Trimestre 3</option><option value={4}>Trimestre 4</option>
            </select>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setModalHabilitarPDF(null)} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "white" }}>Cancelar</button>
              <button onClick={habilitarPDF} style={{ flex: 1, padding: "10px", borderRadius: "8px", background: "#2563eb", color: "white", border: "none", fontWeight: "600" }}>Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {modalRechazar && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "white", borderRadius: "15px", padding: "25px", width: "400px" }}>
            <h3 style={{ color: "#b91c1c" }}>Rechazar Línea de Acción</h3>
            <textarea placeholder="Explica el motivo del rechazo..." value={comentarioRechazo} onChange={e => setComentarioRechazo(e.target.value)} style={{ width: "100%", height: "100px", padding: "12px", marginTop: "15px", borderRadius: "8px", border: "1px solid #cbd5e1", resize: "none" }} />
            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button onClick={() => setModalRechazar(null)} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>Cerrar</button>
              <button onClick={async () => { await fetch(`http://localhost:3001/api/lineas/rechazar/${modalRechazar.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ comentario: comentarioRechazo, user_id: null }) }); setLineasPendientes(p => p.filter(x => x.id !== modalRechazar.id)); setModalRechazar(null); setComentarioRechazo(""); }} style={{ flex: 1, background: "#dc2626", color: "white", border: "none", borderRadius: "8px", fontWeight: "600" }}>Enviar Rechazo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}