import React, { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer
} from "recharts";

const COLORES = ["#2563eb","#16a34a","#dc2626","#d97706","#7c3aed","#0891b2","#be185d","#059669"];

export default function ReportesPlaneacion() {
  const [datos, setDatos] = useState([]);
  const [anioFiltro, setAnioFiltro] = useState(2025);
  const [trimestreFiltro, setTrimestreFiltro] = useState(null);
  const [depFiltro, setDepFiltro] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    fetch("http://localhost:3001/api/planeacion/reportes")
      .then(r => r.json())
      .then(data => { setDatos(data); setCargando(false); })
      .catch(() => setCargando(false));
  }, []);

  if (cargando) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"400px", color:"#6b7280" }}>
      Cargando reportes...
    </div>
  );

  const filtrados = datos.filter(d => {
    if (d.anio !== anioFiltro) return false;
    if (trimestreFiltro && Number(d.trimestre) !== trimestreFiltro) return false;
    if (depFiltro && d.dep_id !== depFiltro) return false;
    return true;
  });

  const dependencias = [...new Map(datos.map(d => [d.dep_id, { id: d.dep_id, name: d.dependencia }])).values()];

  const progVsExec = dependencias.map(dep => {
    const prog = filtrados.filter(d => d.dep_id === dep.id && d.tipo === "programado").reduce((s, d) => s + Number(d.total_valor), 0);
    const exec = filtrados.filter(d => d.dep_id === dep.id && d.tipo === "ejecutado").reduce((s, d) => s + Number(d.total_valor), 0);
    const pct = prog > 0 ? Math.round((exec / prog) * 100) : 0;
    return {
      name: dep.name.length > 25 ? dep.name.substring(0, 25) + "..." : dep.name,
      fullName: dep.name,
      Programado: prog,
      Ejecutado: exec,
      Avance: pct
    };
  }).filter(d => d.Programado > 0 || d.Ejecutado > 0);

  const estadoRevisiones = dependencias.map(dep => {
    const rows = filtrados.filter(d => d.dep_id === dep.id);
    return {
      name: dep.name.length > 25 ? dep.name.substring(0, 25) + "..." : dep.name,
      fullName: dep.name,
      Aprobados: rows.reduce((s, d) => s + Number(d.aprobados), 0),
      Rechazados: rows.reduce((s, d) => s + Number(d.rechazados), 0),
      Pendientes: rows.reduce((s, d) => s + Number(d.pendientes), 0),
    };
  }).filter(d => d.Aprobados + d.Rechazados + d.Pendientes > 0);

  const porTrimestre = [1,2,3,4].map(t => {
    const rows = datos.filter(d => d.anio === anioFiltro && Number(d.trimestre) === t && (!depFiltro || d.dep_id === depFiltro));
    const prog = rows.filter(d => d.tipo === "programado").reduce((s,d) => s + Number(d.total_valor), 0);
    const exec = rows.filter(d => d.tipo === "ejecutado").reduce((s,d) => s + Number(d.total_valor), 0);
    return { name: `T${t}`, Programado: prog, Ejecutado: exec };
  });

  const totalAprobados = filtrados.reduce((s,d) => s + Number(d.aprobados), 0);
  const totalRechazados = filtrados.reduce((s,d) => s + Number(d.rechazados), 0);
  const totalPendientes = filtrados.reduce((s,d) => s + Number(d.pendientes), 0);
  const pieData = [
    { name:"Aprobados", value: totalAprobados, color:"#16a34a" },
    { name:"Pendientes", value: totalPendientes, color:"#d97706" },
    { name:"Rechazados", value: totalRechazados, color:"#dc2626" },
  ].filter(d => d.value > 0);

  const TooltipCustom = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const full = payload[0]?.payload?.fullName || label;
    return (
      <div style={{ background:"white", border:"1px solid #e5e7eb", borderRadius:"8px", padding:"10px 14px", fontSize:"12px", boxShadow:"0 4px 12px rgba(0,0,0,0.1)", maxWidth:"280px" }}>
        <p style={{ fontWeight:"700", marginBottom:"6px", color:"#1e293b" }}>{full}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color, margin:"2px 0" }}>
            {p.name}: <b>{Number(p.value).toLocaleString()}</b>
          </p>
        ))}
      </div>
    );
  };

  return (
    <div style={{ padding:"24px", background:"#f8fafc", minHeight:"100vh", color: "#1e293b" }}>

      <div style={{ marginBottom:"24px" }}>
        <h2 style={{ margin:"0 0 4px 0", color:"#1e293b", fontSize:"22px" }}>📊 Reportes y Seguimiento</h2>
        <p style={{ margin:0, color:"#64748b", fontSize:"13px" }}>Progreso de dependencias municipales</p>
      </div>

      <div style={{ display:"flex", gap:"15px", marginBottom:"28px", flexWrap:"wrap", alignItems:"center" }}>
        
        <div style={{ display:"flex", gap:"4px", background:"#e2e8f0", borderRadius:"10px", padding:"4px", border:"1px solid #cbd5e1" }}>
          {[2025, 2026].map(a => (
            <button 
              key={a} 
              onClick={() => setAnioFiltro(a)} 
              style={{ 
                padding:"8px 20px", 
                borderRadius:"8px", 
                border:"none", 
                cursor:"pointer", 
                fontWeight:"700", 
                fontSize:"13px", 
                background: anioFiltro === a ? "#2563eb" : "transparent", 
                color: anioFiltro === a ? "white" : "#475569", 
                transition:"all 0.2s" 
              }}
            >
              {a}
            </button>
          ))}
        </div>

        <select
          value={trimestreFiltro ?? ""}
          onChange={e => setTrimestreFiltro(e.target.value === "" ? null : Number(e.target.value))}
          style={{ 
            padding:"10px 14px", 
            borderRadius:"10px", 
            border:"1px solid #cbd5e1", 
            fontSize:"13px", 
            background:"white", 
            color: "#1e293b", 
            cursor:"pointer",
            fontWeight: "500",
            minWidth: "180px",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
          }}
        >
          <option value="" style={{ color: "#1e293b" }}>Todos los trimestres</option>
          <option value={1} style={{ color: "#1e293b" }}>T1 - Enero a Marzo</option>
          <option value={2} style={{ color: "#1e293b" }}>T2 - Abril a Junio</option>
          <option value={3} style={{ color: "#1e293b" }}>T3 - Julio a Septiembre</option>
          <option value={4} style={{ color: "#1e293b" }}>T4 - Octubre a Diciembre</option>
        </select>

        <select
          value={depFiltro ?? ""}
          onChange={e => setDepFiltro(e.target.value === "" ? null : e.target.value)}
          style={{ 
            padding:"10px 14px", 
            borderRadius:"10px", 
            border:"2px solid #2563eb",
            fontSize:"13px", 
            background:"white", 
            color: "#1e293b", 
            cursor:"pointer",
            fontWeight: "500",
            maxWidth:"320px",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
          }}
        >
          <option value="" style={{ color: "#64748b" }}>🔍 Todas las dependencias</option>
          {dependencias.map(d => (
            <option key={d.id} value={d.id} style={{ color: "#1e293b" }}>{d.name}</option>
          ))}
        </select>

        {(trimestreFiltro || depFiltro) && (
          <button
            onClick={() => { setTrimestreFiltro(null); setDepFiltro(null); }}
            style={{ 
              padding:"10px 16px", 
              borderRadius:"10px", 
              border:"1px solid #fca5a5", 
              background:"#fff1f2", 
              cursor:"pointer", 
              fontSize:"12px", 
              color:"#be123c",
              fontWeight: "600"
            }}
          >
            ✕ Limpiar filtros
          </button>
        )}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px,1fr))", gap:"16px", marginBottom:"28px" }}>
        {[
          { label:"Dependencias activas", value: progVsExec.length, color:"#2563eb", icon:"🏛️" },
          { label:"Total programado", value: progVsExec.reduce((s,d)=>s+d.Programado,0).toLocaleString(), color:"#7c3aed", icon:"📋" },
          { label:"Total ejecutado", value: progVsExec.reduce((s,d)=>s+d.Ejecutado,0).toLocaleString(), color:"#16a34a", icon:"✅" },
          { label:"Registros aprobados", value: totalAprobados, color:"#059669", icon:"👍" },
          { label:"Registros pendientes", value: totalPendientes, color:"#d97706", icon:"⏳" },
          { label:"Registros rechazados", value: totalRechazados, color:"#dc2626", icon:"❌" },
        ].map((kpi, i) => (
          <div key={i} style={{ background:"white", borderRadius:"12px", padding:"16px 20px", boxShadow:"0 1px 4px rgba(0,0,0,0.06)", border:"1px solid #e5e7eb" }}>
            <p style={{ fontSize:"20px", margin:"0 0 6px 0" }}>{kpi.icon}</p>
            <p style={{ fontSize:"22px", fontWeight:"700", color:kpi.color, margin:"0 0 4px 0" }}>{kpi.value}</p>
            <p style={{ fontSize:"11px", color:"#6b7280", margin:0 }}>{kpi.label}</p>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"20px", marginBottom:"20px" }}>
        <div style={{ background:"white", borderRadius:"12px", padding:"20px", boxShadow:"0 1px 4px rgba(0,0,0,0.06)", border:"1px solid #e5e7eb" }}>
          <h3 style={{ margin:"0 0 16px 0", fontSize:"14px", color:"#1e293b" }}>📊 Programado vs Ejecutado por dependencia</h3>
          {progVsExec.length === 0 ? (
            <p style={{ color:"#9ca3af", textAlign:"center", padding:"40px 0", fontSize:"13px" }}>Sin datos para el período</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={progVsExec} margin={{ top:5, right:10, left:0, bottom:60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize:10 }} angle={-35} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize:10 }} />
                <Tooltip content={<TooltipCustom />} />
                <Legend wrapperStyle={{ fontSize:"12px", paddingTop:"16px" }} />
                <Bar dataKey="Programado" fill="#2563eb" radius={[4,4,0,0]} />
                <Bar dataKey="Ejecutado" fill="#16a34a" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={{ background:"white", borderRadius:"12px", padding:"20px", boxShadow:"0 1px 4px rgba(0,0,0,0.06)", border:"1px solid #e5e7eb" }}>
          <h3 style={{ margin:"0 0 16px 0", fontSize:"14px", color:"#1e293b" }}>📋 Estado de revisiones por dependencia</h3>
          {estadoRevisiones.length === 0 ? (
            <p style={{ color:"#9ca3af", textAlign:"center", padding:"40px 0", fontSize:"13px" }}>Sin datos para el período</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={estadoRevisiones} margin={{ top:5, right:10, left:0, bottom:60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize:10 }} angle={-35} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize:10 }} />
                <Tooltip content={<TooltipCustom />} />
                <Legend wrapperStyle={{ fontSize:"12px", paddingTop:"16px" }} />
                <Bar dataKey="Aprobados" fill="#16a34a" radius={[4,4,0,0]} stackId="a" />
                <Bar dataKey="Pendientes" fill="#d97706" radius={[0,0,0,0]} stackId="a" />
                <Bar dataKey="Rechazados" fill="#dc2626" radius={[0,0,4,4]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}