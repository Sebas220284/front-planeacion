import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../services/socket";
import { generarPDF } from "../utils/generarPDF";
import ReportesPlaneacion from "./ReportesPlaneacion";
import FichasTecnicas from "./FichasTecnicas";
import TransparenciaSeccion4 from "./TransparenciaSeccion4"
import TransparenciaSeccion5 from "./TransparenciaSeccion5"
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
  const [vistaFichas, setVistaFichas] = useState(false);
  const [filtroEstrategia, setFiltroEstrategia] = useState("todas");
const [vistaTransparencia, setVistaTransparencia] = useState(null) // null | "s4" | "s5"

  const navigate = useNavigate();
  const años = [2025, 2026];

  const dependencia = dependencias.find((d) => d.id === activa);

  useEffect(() => {
    socket.emit("join_planeacion");
    const fetchData = async () => {
      try {
        const resDep = await fetch("http://localhost:3000/api/planeacion/dashboard");
        const data = await resDep.json();
        setDependencias(data);
        if (data.length > 0) setActiva(data[0].id);

        const allTrimestres = {};
        for (const dep of data) {
          const estrategias = dep.estrategias ? Object.values(dep.estrategias) : [];
          for (const est of estrategias) {
            for (const linea of est.lineas) {
              const resT = await fetch(`http://localhost:3000/api/trimestres/porLinea/${linea.id}`);
              allTrimestres[linea.id] = await resT.json();
            }
          }
        }
        setTrimestres(allTrimestres);

        const resPend = await fetch("http://localhost:3000/api/lineas/pendientes");
        const dataPend = await resPend.json();
        setLineasPendientes(dataPend);
      } catch (error) {
        console.error("Error cargando datos:", error);
      }
    };
    fetchData();

    socket.on("nueva_linea_pendiente", (data) => setLineasPendientes((prev) => [data, ...prev]));
    socket.on("trimestre_actualizado", async (data) => {
      const res = await fetch(`http://localhost:3000/api/trimestres/porLinea/${data.planning_id}`);
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

  useEffect(() => {
    setFiltroEstrategia("todas");
  }, [activa]);

  const eliminarLineaDeAccion = async (lineaId) => {
    const confirmar = window.confirm("¿Estás seguro de que deseas eliminar esta línea de acción?");
    if (!confirmar) return;
    try {
      const res = await fetch(`http://localhost:3000/api/lineas/eliminar/${lineaId}`, { method: "DELETE" });
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
      }
    } catch (error) { console.error(error); }
  };

  const habilitarPDF = async () => {
    if (!activa) return;
    await fetch("http://localhost:3000/api/pdf/habilitar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dependency_id: activa,
        anio: filtroHabilitar.anio,
        trimestre: filtroHabilitar.trimestre ?? null,
      })
    });
    setModalHabilitarPDF(null);
    alert(`✅ PDF habilitado`);
  };

  const descargarPDFGlobal = async () => {
    if (!dependencia) return;
    const res = await fetch(`http://localhost:3000/api/pdf/datos/${dependencia.id}/${filtroPDF.anio}/${filtroPDF.trimestre}`);
    const data = await res.json();
    generarPDF(data, dependencia.name, filtroPDF.anio, filtroPDF.trimestre);
    setModalPDF(false);
  };

  const revisarTrimestre = async (planning_id, anio, tipo, estado, dependency_id) => {
    const lista = trimestres[planning_id] || [];
    const registros = lista.filter((t) => t.anio === anio && t.tipo === tipo);
    for (const t of registros) {
      await fetch(`http://localhost:3000/api/review/${t.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado, comentario: estado === "rechazado" ? comentarioRechazo : "", dependency_id }),
      });
    }
    setTrimestres((prev) => ({
      ...prev,
      [planning_id]: (prev[planning_id] || []).map((t) => t.anio === anio && t.tipo === tipo ? { ...t, estado_revision: estado } : t)
    }));
    setModalRechazar(null);
  };

  const getValor = (planning_id, anio, trimestre, tipo) => {
    const lista = trimestres[planning_id] || [];
    return lista.find((t) => t.anio === anio && t.trimestre === trimestre && t.tipo === tipo)?.valor ?? "-";
  };

  const sumar = (planning_id, anio, tipo) =>
    [1, 2, 3, 4].reduce((acc, t) => acc + (Number(getValor(planning_id, anio, t, tipo)) || 0), 0);

  const getEstadoRevision = (planning_id, anio, tipo) => {
    const lista = trimestres[planning_id] || [];
    return lista.find((t) => t.anio === anio && t.tipo === tipo)?.estado_revision || "pendiente";
  };

  const EstadoBadge = ({ estado }) => {
    const colores = { aprobado: { bg: "#d1fae5", color: "#065f46" }, rechazado: { bg: "#fee2e2", color: "#991b1b" }, pendiente: { bg: "#fef9c3", color: "#854d0e" } };
    const c = colores[estado] || colores.pendiente;
    return <span style={{ background: c.bg, color: c.color, padding: "2px 8px", borderRadius: "999px", fontSize: "11px", fontWeight: "600" }}>{estado}</span>;
  };

  const listaEstrategiasDisponibles = dependencia ? Object.values(dependencia.estrategias || {}) : [];
  const estrategiasAMostrar = filtroEstrategia === "todas"
    ? listaEstrategiasDisponibles
    : listaEstrategiasDisponibles.filter(e => String(e.id) === String(filtroEstrategia));

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
      <div className="alineacion-container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
          <h2 style={{ color: "#1e293b", margin: 0 }}>🎯 Alineación Estratégica PMD</h2>
          <button onClick={() => setVistaAlineacion(false)} className="btn-tabla" style={{ background: "#64748b", color: "white", padding: "10px 20px" }}>← Volver</button>
        </div>
        <div className="filter-container">
          <button className={`filter-pill ${filtroEje === null ? 'active' : ''}`} onClick={() => setFiltroEje(null)}>Ver Todo</button>
          {ejesUnicos.map(eje => (
            <button key={eje} className={`filter-pill ${filtroEje === eje ? 'active' : ''}`} onClick={() => setFiltroEje(eje)}>{eje.substring(0, 40)}...</button>
          ))}
        </div>
        {Object.entries(porEje).map(([eje, temas]) => (
          <div key={eje} style={{ marginBottom: "30px" }}>
            <div style={{ background: "#1e293b", color: "white", padding: "16px", borderRadius: "12px" }}><h3>{eje}</h3></div>
            {Object.entries(temas).map(([tema, politicas]) => (
              <div key={tema} style={{ marginLeft: "20px", borderLeft: "3px solid #fecaca", paddingLeft: "15px", marginTop: "15px" }}>
                <p style={{ color: "#b91c1c", fontWeight: "700" }}>TEMA: {tema}</p>
                {Object.entries(politicas).map(([politica, objetivos]) => (
                  <div key={politica} style={{ marginLeft: "20px", borderLeft: "3px solid #fed7aa", paddingLeft: "15px" }}>
                    <p style={{ color: "#c2410c", fontWeight: "600" }}>POLÍTICA: {politica}</p>
                    {Object.entries(objetivos).map(([objetivo, estrategias]) => (
                      <div key={objetivo} style={{ marginLeft: "20px", borderLeft: "3px solid #bbf7d0", paddingLeft: "15px" }}>
                        <p style={{ color: "#15803d" }}>OBJETIVO: {objetivo}</p>
                        {estrategias.map((est, idx) => <div key={idx} className="notif-card-dark" style={{margin: "4px 0"}}>{est}</div>)}
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
        <button onClick={() => { setVistaReportes(true); setVistaAlineacion(false); setVistaFichas(false); setActiva(null); }} className={`menu-btn ${vistaReportes ? "active" : ""}`}>📊 Reportes Globales</button>
        <button onClick={() => { setVistaFichas(true); setVistaAlineacion(false); setVistaReportes(false); setActiva(null); }} style={{ marginTop: "8px", background: vistaFichas ? "#854d0e" : "#d97706", color: "white", border: "none", borderRadius: "8px", padding: "12px", width: "100%", cursor: "pointer" }}>📋 Fichas Técnicas</button>
        <button onClick={() => { 
          fetch("http://localhost:3000/api/pmd/aprobados").then(r => r.json()).then(setEstrategiasPMD);
          setVistaAlineacion(true); setVistaReportes(false); setVistaFichas(false); setActiva(null);
        }} style={{ marginTop: "8px", background: vistaAlineacion ? "#5b21b6" : "#7c3aed", color: "white", border: "none", borderRadius: "8px", padding: "12px", width: "100%", cursor: "pointer" }}>🎯 Alineación Estratégica</button>

        <div style={{ margin: "15px 0", borderBottom: "1px solid #334155" }} />
        <button className="menu-btn" onClick={() => setOpenDependencias(!openDependencias)}>🏢 Dependencias {openDependencias ? "▲" : "▼"}</button>
        <div className={`submenu ${openDependencias ? "open" : ""}`}>
          {dependencias.map((dep) => (
            <button key={dep.id} className={`dep-item ${dep.id === activa && !vistaAlineacion && !vistaReportes && !vistaFichas ? "active" : ""}`} onClick={() => { setActiva(dep.id); setVistaAlineacion(false); setVistaReportes(false); setVistaFichas(false); }}>{dep.name}</button>
          ))}
        </div>
        <button className="logout-btn" onClick={() => { localStorage.removeItem("token"); navigate("/"); }}>Cerrar sesión</button>
      <div style={{ marginTop:"8px" }}>
  <p style={{ fontSize:"10px", color:"#94a3b8", margin:"0 0 4px 6px", fontWeight:"600" }}>🔍 TRANSPARENCIA</p>
  <button onClick={()=>{ setVistaTransparencia("s4"); setVistaAlineacion(false); setVistaReportes(false); setVistaFichas(false); setActiva(null) }}
    style={{ background:vistaTransparencia==="s4"?"#065f46":"#059669", color:"white", border:"none", borderRadius:"8px", padding:"8px 12px", width:"100%", cursor:"pointer", fontSize:"12px", fontWeight:"600", marginBottom:"4px" }}>
    Sección 4 (F4)
  </button>
  <button onClick={()=>{ setVistaTransparencia("s5"); setVistaAlineacion(false); setVistaReportes(false); setVistaFichas(false); setActiva(null) }}
    style={{ background:vistaTransparencia==="s5"?"#065f46":"#059669", color:"white", border:"none", borderRadius:"8px", padding:"8px 12px", width:"100%", cursor:"pointer", fontSize:"12px", fontWeight:"600" }}>
    Sección 5 (F5)
  </button>
</div>
      </div>

      <div className="contenido">
    {vistaTransparencia==="s4" ? <TransparenciaSeccion4 /> :
 vistaTransparencia==="s5" ? <TransparenciaSeccion5 /> :
 vistaFichas ? <FichasTecnicas dependencias={dependencias} /> :
 vistaReportes ? <ReportesPlaneacion /> :
 vistaAlineacion ? renderAlineacion() : <>...dashboard normal...</>
}
        {vistaReportes ? (
          <ReportesPlaneacion />
        ) : vistaFichas ? (
          <FichasTecnicas dependencias={dependencias} />
        ) : vistaAlineacion ? (
          renderAlineacion()
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <h2 className="titulo">{dependencia ? dependencia.name : "Selecciona una dependencia"}</h2>
              
              <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
                {dependencia && (
                  <select 
                    value={filtroEstrategia} 
                    onChange={(e) => setFiltroEstrategia(e.target.value)}
                    style={{ padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", background: "white", color: "#000" }}
                  >
                    <option value="todas">Todas las estrategias</option>
                    {listaEstrategiasDisponibles.map(est => <option key={est.id} value={est.id}>{est.name}</option>)}
                  </select>
                )}

                <div style={{ display: "flex", gap: "10px", background: "#f3f4f6", padding: "5px", borderRadius: "12px" }}>
                  {años.map((a) => (
                    <button
                      key={a}
                      onClick={() => setAnioFiltro(a)}
                      style={{
                        padding: "10px 25px",
                        borderRadius: "10px",
                        border: "none",
                        cursor: "pointer",
                        fontWeight: "bold",
                        background: anioFiltro === a ? "#2563eb" : "transparent",
                        color: anioFiltro === a ? "white" : "#64748b",
                        transition: "all 0.3s"
                      }}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {dependencia && estrategiasAMostrar.length > 0 ? (
              <div className="card">
                <div className="tabla-wrapper">
                  <table className="tabla-poa">
                    <thead>
                      <tr>
                        <th rowSpan="2">Acción</th>
                        <th rowSpan="2" style={{ textAlign: "left", minWidth: "300px" }}>Línea de Acción</th>
                        <th colSpan="6" className="header-section-prog">PROGRAMADO {anioFiltro}</th>
                        <th colSpan="6" className="header-section-ejec">EJECUTADO {anioFiltro}</th>
                      </tr>
                      <tr>
                        <th>T1</th><th>T2</th><th>T3</th><th>T4</th><th className="col-total">Total</th><th>Revisión</th>
                        <th>T1</th><th>T2</th><th>T3</th><th>T4</th><th className="col-total">Total</th><th>Revisión</th>
                      </tr>
                    </thead>
                    <tbody>
                      {estrategiasAMostrar.map((est) => (
                        <React.Fragment key={est.id}>
                          {filtroEstrategia === "todas" && (
                            <tr style={{ background: "#f1f5f9" }}>
                              <td colSpan="14" style={{ padding: "12px", fontWeight: "800", color: "#334155", fontSize: "12px", textTransform: "uppercase" }}>
                                ESTRATEGIA: {est.name}
                                <button onClick={() => setModalHabilitarPDF(est.id)} style={{ marginLeft: "20px", background: "#2563eb", color: "white", border: "none", borderRadius: "6px", padding: "5px 12px", fontSize: "11px", cursor: "pointer" }}>Habilitar PDF</button>
                              </td>
                            </tr>
                          )}
                          {est.lineas.map((linea) => (
                            <tr key={linea.id}>
                              <td style={{ textAlign: "center" }}><button onClick={() => eliminarLineaDeAccion(linea.id)} style={{ background: "#fee2e2", color: "#dc2626", border: "none", padding: "8px", borderRadius: "8px", cursor: "pointer" }}>🗑️</button></td>
                              <td style={{ fontSize: "13px", padding: "10px" }}>{linea.lineas_accion}</td>
                              {[{ tipo: "programado" }, { tipo: "ejecutado" }].map(({ tipo }) => (
                                <React.Fragment key={`${tipo}-${linea.id}`}>
                                  <td style={{ textAlign: "center" }}>{getValor(linea.id, anioFiltro, 1, tipo)}</td>
                                  <td style={{ textAlign: "center" }}>{getValor(linea.id, anioFiltro, 2, tipo)}</td>
                                  <td style={{ textAlign: "center" }}>{getValor(linea.id, anioFiltro, 3, tipo)}</td>
                                  <td style={{ textAlign: "center" }}>{getValor(linea.id, anioFiltro, 4, tipo)}</td>
                                  <td className="col-total" style={{ textAlign: "center", fontWeight: "bold" }}>{sumar(linea.id, anioFiltro, tipo)}</td>
                                  <td>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "5px", alignItems: "center" }}>
                                      <EstadoBadge estado={getEstadoRevision(linea.id, anioFiltro, tipo)} />
                                      <div style={{ display: "flex", gap: "5px" }}>
                                        <button className="btn-tabla btn-aprobar" onClick={() => revisarTrimestre(linea.id, anioFiltro, tipo, "aprobado", dependencia.id)}>Ok</button>
                                        <button className="btn-tabla btn-rechazar" onClick={() => setModalRechazar({ id: linea.id, anio: anioFiltro, tipo })}>X</button>
                                      </div>
                                    </div>
                                  </td>
                                </React.Fragment>
                              ))}
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : dependencia && <div className="card" style={{padding: "50px", textAlign: "center", color: "#94a3b8", fontSize: "18px"}}>No hay líneas de acción para mostrar.</div>}

            {dependencia && (
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "30px" }}>
                <button onClick={() => setModalPDF(true)} style={{ background: "#dc2626", color: "white", border: "none", borderRadius: "10px", padding: "15px 35px", fontWeight: "bold", cursor: "pointer", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>📄 Exportar PDF Global</button>
              </div>
            )}
          </>
        )}
      </div>

      {modalPDF && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: "30px", borderRadius: "20px", width: "400px" }}>
            <h3 style={{ marginBottom: "20px" }}>Configurar Exportación PDF</h3>
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}>Año:</label>
              <select style={{ width: "100%", padding: "10px", borderRadius: "8px" }} value={filtroPDF.anio} onChange={e => setFiltroPDF({...filtroPDF, anio: Number(e.target.value)})}>
                {años.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: "25px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}>Trimestre:</label>
              <select style={{ width: "100%", padding: "10px", borderRadius: "8px" }} value={filtroPDF.trimestre} onChange={e => setFiltroPDF({...filtroPDF, trimestre: Number(e.target.value)})}>
                <option value={1}>Trimestre 1</option><option value={2}>Trimestre 2</option><option value={3}>Trimestre 3</option><option value={4}>Trimestre 4</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setModalPDF(false)} style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "1px solid #ccc", background: "none" }}>Cancelar</button>
              <button onClick={descargarPDFGlobal} style={{ flex: 1, padding: "12px", borderRadius: "10px", background: "#dc2626", color: "white", border: "none", fontWeight: "bold" }}>Descargar</button>
            </div>
          </div>
        </div>
      )}

      {modalRechazar && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: "30px", borderRadius: "20px", width: "400px" }}>
            <h3 style={{ color: "#b91c1c", marginBottom: "15px" }}>Rechazar Registro</h3>
            <textarea
              style={{ width: "100%", height: "120px", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1", marginBottom: "20px" }}
              placeholder="Escribe el motivo del rechazo para que la dependencia pueda corregirlo..."
              value={comentarioRechazo}
              onChange={(e) => setComentarioRechazo(e.target.value)}
            />
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setModalRechazar(null)} style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "1px solid #ccc" }}>Cancelar</button>
              <button onClick={() => revisarTrimestre(modalRechazar.id, modalRechazar.anio, modalRechazar.tipo, "rechazado", activa)} style={{ flex: 1, padding: "12px", borderRadius: "10px", background: "#b91c1c", color: "white", border: "none", fontWeight: "bold" }}>Confirmar Rechazo</button>
            </div>
          </div>
        </div>
      )}

      {modalHabilitarPDF && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: "30px", borderRadius: "20px", width: "400px" }}>
            <h3 style={{ marginBottom: "20px" }}>Habilitar Envío de PDF</h3>
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px" }}>Seleccionar Año:</label>
              <select style={{ width: "100%", padding: "10px", borderRadius: "8px" }} value={filtroHabilitar.anio} onChange={e => setFiltroHabilitar({...filtroHabilitar, anio: Number(e.target.value)})}>
                {años.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "5px" }}>Seleccionar Periodo:</label>
              <select style={{ width: "100%", padding: "10px", borderRadius: "8px" }} value={filtroHabilitar.trimestre ?? ""} onChange={e => setFiltroHabilitar({...filtroHabilitar, trimestre: e.target.value === "" ? null : Number(e.target.value)})}>
                <option value="">Todo el Año (POA)</option>
                <option value={1}>Trimestre 1</option><option value={2}>Trimestre 2</option><option value={3}>Trimestre 3</option><option value={4}>Trimestre 4</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setModalHabilitarPDF(null)} style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "1px solid #ccc" }}>Cerrar</button>
              <button onClick={habilitarPDF} style={{ flex: 1, padding: "12px", borderRadius: "10px", background: "#2563eb", color: "white", border: "none", fontWeight: "bold" }}>Habilitar Ahora</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}