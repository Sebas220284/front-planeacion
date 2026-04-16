import React, { useEffect, useState } from "react";
import { Menu, ChevronDown, Save, Plus, Bell, BookOpen, FileText, LogOut, User } from "lucide-react";
import "../styles/dashboardPlaneacionRe.css";

export default function DashboardPlaneacionRe() {
  const [user, setUser] = useState(null);
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [lineas, setLineas] = useState([]);
  const [activeYear, setActiveYear] = useState(2025);
  const [activeMode, setActiveMode] = useState("programado");
  const [showUserCard, setShowUserCard] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Estados para los menús
  const [openMenus, setOpenMenus] = useState({
    estrategias: true,
    notificaciones: false,
    informes: false
  });

  const toggleMenu = (menu) => {
    setOpenMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
  };

  useEffect(() => {
    const dataFicticia = {
      dependencia: "Secretaría de Protección Civil Municipal",
      titular: "C. Eder Fabián Mancilla Velázquez",
      enlace: "C. Oscar Mitzumory Andrade García",
      estrategias: [
        {
          id: 1,
          name: "Estrategia 2.2.1.1. Reconocer y valorar las pérdidas o daños probables...",
          pmd_eje: "2. Seguridad y Protección Ciudadana",
          pmd_tema: "Tema 2.2. Gestión Integral de Riesgos de Desastre y Protección Civil",
          pmd_politica_publica: "Política Pública 2.2.1. Cultura de la prevención de riesgos y Protección Civil",
          pmd_objetivo: "Generar una cultura de prevención de riesgos para la ciudadanía, salvaguardando la vida, integridad, salud, sus bienes, infraestructura y medio ambiente...",
          pmd_estrategia: "Estrategia 2.2.1.1. Reconocer y valorar las pérdidas o daños probables...",
          lineas: [{ id: 101, lineas_accion: "Actividad 2.2.1.1.01. Realización de Valoraciones de Riesgos", estado: "Aprobado" }]
        }
      ]
    };
    setUser(dataFicticia);
  }, []);

  const seleccionarEstrategia = (e) => {
    setSelectedStrategy(e);
    const mockLineas = e.lineas.map(l => ({
      ...l,
      data: {
        2024: { p: [0,0,0,0], e: [0,0,0,0], com: "", rev: "aprobado" },
        2025: { p: [1,1,1,1], e: [11,11,11,11], com: "ok", rev: "pendiente" },
        2026: { p: [0,0,0,0], e: [0,0,0,0], com: "", rev: "pendiente" },
      }
    }));
    setLineas(mockLineas);
  };

  if (!user) return <div className="loading">Cargando...</div>;

  return (
    <div className={`layout ${sidebarCollapsed ? "collapsed" : ""}`}>
      
      {/* --- SIDEBAR --- */}
      <aside className="sidebar">
        <div className="sidebar-top">
          <button className="hamburger-btn" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
            <Menu size={22} />
          </button>
          {!sidebarCollapsed && (
            <div className="sidebar-logo">
              <div className="logo-placeholder">Logo Ayuntam.</div>
            </div>
          )}
        </div>

        <div className={`user-card ${showUserCard ? "expanded" : ""}`}>
          <div className="user-card-header" onClick={() => setShowUserCard(!showUserCard)}>
            <div className="user-icon-bg"><User size={20} /></div>
            {!sidebarCollapsed && (
              <>
                <div className="user-card-info">
                  <h3>{user.dependencia}</h3>
                </div>
                <ChevronDown size={14} className={`arrow ${showUserCard ? "up" : ""}`} />
              </>
            )}
          </div>
          {showUserCard && !sidebarCollapsed && (
            <div className="user-card-content">
              <div className="user-item"><label>Titular</label><p>{user.titular}</p></div>
              <div className="user-item"><label>Enlace</label><p>{user.enlace}</p></div>
              <button className="logout-button"><LogOut size={14} /> Cerrar sesión</button>
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          {/* ESTRATEGIAS */}
          <div className="nav-group">
            <button className={`nav-header ${openMenus.estrategias ? 'active' : ''}`} onClick={() => toggleMenu('estrategias')}>
              <div className="nav-title"><BookOpen size={18} /> {!sidebarCollapsed && "Estrategias"}</div>
              {!sidebarCollapsed && <ChevronDown size={14} className={`arrow ${openMenus.estrategias ? 'up' : ''}`} />}
            </button>
            <div className={`nav-collapse ${openMenus.estrategias && !sidebarCollapsed ? 'open' : ''}`}>
              <ul className="nav-list">
                {user.estrategias.map((e, i) => (
                  <li key={e.id} className={selectedStrategy?.id === e.id ? "selected" : ""} onClick={() => seleccionarEstrategia(e)}>
                    <span>{i+1}</span> {e.name}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* NOTIFICACIONES */}
          <div className="nav-group">
            <button className={`nav-header ${openMenus.notificaciones ? 'active' : ''}`} onClick={() => toggleMenu('notificaciones')}>
              <div className="nav-title"><Bell size={18} /> {!sidebarCollapsed && "Notificaciones"}</div>
              {!sidebarCollapsed && <ChevronDown size={14} className={`arrow ${openMenus.notificaciones ? 'up' : ''}`} />}
            </button>
            <div className={`nav-collapse ${openMenus.notificaciones && !sidebarCollapsed ? 'open' : ''}`}>
              <div className="nav-subtext">Sin notificaciones</div>
            </div>
          </div>

          {/* INFORMES */}
          <div className="nav-group">
            <button className={`nav-header ${openMenus.informes ? 'active' : ''}`} onClick={() => toggleMenu('informes')}>
              <div className="nav-title"><FileText size={18} /> {!sidebarCollapsed && "Informes"}</div>
              {!sidebarCollapsed && <ChevronDown size={14} className={`arrow ${openMenus.informes ? 'up' : ''}`} />}
            </button>
            <div className={`nav-collapse ${openMenus.informes && !sidebarCollapsed ? 'open' : ''}`}>
              <ul className="nav-list">
                <li>Reporte Anual</li>
                <li>Avances Trimestrales</li>
              </ul>
            </div>
          </div>
        </nav>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="main-content">
        {selectedStrategy ? (
          <div className="panel">
            <div className="pmd-cards">
              <div className="pmd-card"><label>EJE</label><p>{selectedStrategy.pmd_eje}</p></div>
              <div className="pmd-card"><label>TEMA</label><p>{selectedStrategy.pmd_tema}</p></div>
              <div className="pmd-card"><label>POLÍTICA PÚBLICA</label><p>{selectedStrategy.pmd_politica_publica}</p></div>
              <div className="pmd-card full"><label>OBJETIVO</label><p>{selectedStrategy.pmd_objetivo}</p></div>
              <div className="pmd-card full"><label>ESTRATEGIA PMD</label><p>{selectedStrategy.pmd_estrategia}</p></div>
            </div>

            <div className="table-section">
              <div className="year-tabs">
                {[2024, 2025, 2026].map(y => (
                  <button key={y} className={activeYear === y ? "active" : ""} onClick={() => setActiveYear(y)}>Año {y}</button>
                ))}
              </div>
              <div className="mode-tabs">
                <button className={activeMode === "programado" ? "active" : ""} onClick={() => setActiveMode("programado")}>PROGRAMADO</button>
                <button className={activeMode === "ejecutado" ? "active" : ""} onClick={() => setActiveMode("ejecutado")}>EJECUTADO</button>
              </div>

              <div className="table-container">
                <table className="planning-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th className="th-left">LÍNEA DE ACCIÓN</th>
                      <th>ESTADO</th>
                      <th>T1</th><th>T2</th><th>T3</th><th>T4</th>
                      <th>ACUM.</th>
                      <th>COMENTARIOS</th>
                      <th>REVISIÓN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineas.map((l, i) => {
                      const yearData = l.data[activeYear];
                      const vals = activeMode === "programado" ? yearData.p : yearData.e;
                      return (
                        <tr key={i}>
                          <td>{i + 1}</td>
                          <td className="text-left">{l.lineas_accion}</td>
                          <td><span className="badge-ok">Aprobado</span></td>
                          {vals.map((v, idx) => (<td><input type="text" defaultValue={v} /></td>))}
                          <td className="bold">{vals.reduce((a,b)=>a+b,0)}</td>
                          <td><textarea defaultValue={yearData.com} /></td>
                          <td><span className={`rev-${yearData.rev}`}>{yearData.rev}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bottom-actions">
              <button className="btn-mini-green"><Save size={14}/> Guardar y enviar</button>
              <button className="btn-mini-blue"><Plus size={14}/> Añadir línea</button>
            </div>
          </div>
        ) : (
          <div className="placeholder">Selecciona una estrategia en el menú lateral</div>
        )}
      </main>
    </div>
  );
}