import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardPlaneacion from "./DashboardPlaneacion";
import DashboardDependencias from "./DashboardDependencias";
import DashboardAdmin from "./DashboardAdmin";
import "../styles/selectorModulos.css";

const MODULOS_POR_ROL = {
  planeacion: ["SEGUIMIENTO", "ESTRATEGICA", "INVERSION"],
  admin:      ["SEGUIMIENTO", "ESTRATEGICA", "INVERSION"],
  dependencias: ["SEGUIMIENTO"],
}

const MODULOS_INFO = {
  SEGUIMIENTO: {
    titulo: "Seguimiento y Estrategia",
    subtitulo: "Control de indicadores y POA",
    icon: "📊",
  },
  ESTRATEGICA: {
    titulo: "Planeación Estratégica",
    subtitulo: "Gestión de planes a largo plazo",
    icon: "🎯",
  },
  INVERSION: {
    titulo: "Inversión Pública",
    subtitulo: "Seguimiento de obras y recursos",
    icon: "💰",
  },
}

export default function DashboardRouter() {
  const [user, setUser] = useState(null);
  const [moduloSeleccionado, setModuloSeleccionado] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch("http://localhost:3001/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setUser(data)
        const modulosPermitidos = MODULOS_POR_ROL[data.rol] || []
        if (modulosPermitidos.length === 1) {
          setModuloSeleccionado(modulosPermitidos[0])
        }
      })
      .catch(err => console.error("Error auth:", err));
  }, []);

  if (!user) return <div className="loading">Cargando sistema...</div>;

  const modulosPermitidos = MODULOS_POR_ROL[user.rol] || []

  return (
    <AnimatePresence mode="wait">
      {!moduloSeleccionado ? (
        <motion.div
          key="selector"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: -20 }}
          className="selector-screen"
        >
          <div className="selector-header">
            <h1>Sistema de Planeación Municipal</h1>
            <p>Bienvenido, {user.name || user.nombre}. Seleccione el área de trabajo:</p>
          </div>

          <div className="card-grid">
            {modulosPermitidos.map(modulo => (
              <ModuleCard
                key={modulo}
                titulo={MODULOS_INFO[modulo].titulo}
                subtitulo={MODULOS_INFO[modulo].subtitulo}
                icon={MODULOS_INFO[modulo].icon}
                onClick={() => setModuloSeleccionado(modulo)}
              />
            ))}
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          className="dashboard-wrapper"
        >
          {modulosPermitidos.length > 1 && (
            <button className="back-to-menu" onClick={() => setModuloSeleccionado(null)}>
              ← Cambiar de Módulo
            </button>
          )}

          {moduloSeleccionado === "SEGUIMIENTO" && (
            user.rol === "dependencias"
              ? <DashboardDependencias />
              : <DashboardPlaneacion />
          )}

          {moduloSeleccionado === "ESTRATEGICA" && (
            <div className="placeholder">
              <h2>🎯 Planeación Estratégica</h2>
              <p>Módulo en desarrollo</p>
            </div>
          )}

          {moduloSeleccionado === "INVERSION" && (
            <div className="placeholder">
              <h2>💰 Inversión Pública</h2>
              <p>Módulo en desarrollo</p>
            </div>
          )}

          {moduloSeleccionado === "ADMIN" && <DashboardAdmin />}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ModuleCard({ titulo, subtitulo, icon, onClick }) {
  return (
    <motion.div
      className="module-card"
      whileHover={{ scale: 1.05, translateY: -10 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    >
      <div className="card-icon">{icon}</div>
      <h3>{titulo}</h3>
      <p>{subtitulo}</p>
      <div className="card-arrow">Ingresar →</div>
    </motion.div>
  );
}