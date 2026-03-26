import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import "../styles/dashboardPlaneacion.css"

export default function DashboardPlaneacion(){

const [dependencias,setDependencias] = useState([])
const [activa,setActiva] = useState(null)
const [openDependencias,setOpenDependencias] = useState(false)

const navigate = useNavigate()

useEffect(()=>{

fetch("http://localhost:3000/api/planeacion/dashboard")
.then(res=>res.json())
.then(data=>{

setDependencias(data)

if(data.length>0){
setActiva(data[0].id)
}

})

},[])

const dependencia = dependencias.find(d=>d.id===activa)


const cerrarSesion = () => {

localStorage.removeItem("token")
localStorage.removeItem("user")
sessionStorage.clear()

navigate("/")

}

return(

<div className="layout">


<div className="sidebar">

<h2 className="logo">Planeación</h2>

<button className="menu-btn">Dashboard</button>

<button
className="menu-btn"
onClick={()=>setOpenDependencias(!openDependencias)}
>

Dependencias {openDependencias ? "▲":"▼"}

</button>

<div className={`submenu ${openDependencias ? "open" : ""}`}>

{dependencias.map(dep=>(

<button
key={dep.id}
className={`dep-item ${dep.id===activa?"active":""}`}
onClick={()=>setActiva(dep.id)}
>

{dep.name}

</button>

))}

</div>

<button className="menu-btn">Reportes</button>
<button className="menu-btn">Estadísticas</button>




<button
className="logout-btn"
onClick={cerrarSesion}
>

Cerrar sesión

</button>

</div>

<div className="contenido">

<h2 className="titulo">

{dependencia ? dependencia.name : "Selecciona una dependencia"}

</h2>

{dependencia && Object.values(dependencia.estrategias).map(est => (

<div key={est.id} className="card">

<div className="card-header">

<h3>{est.name}</h3>

<span className="badge">
{est.lineas.length} líneas
</span>

</div>

<div className="tabla-wrapper">

<table className="tabla-poa">

<thead>

<tr>

<th>Eje</th>
<th>Tema</th>
<th>Politica Publica</th>
<th>Objetivo</th>
<th>Estrategia</th>
<th>Linea Base</th>
<th>Total</th>
<th>Ejercicio</th>
<th>Columna</th>
<th>Línea de acción</th>
<th>Nomenclatura</th>
<th>Responsable</th>
<th>Plazo</th>
<th>Estado</th>

</tr>

</thead>

<tbody>

{est.lineas.map(linea=>(

<tr key={linea.id}>

<td>{linea.pmd_eje}</td>
<td>{linea.pmd_tema}</td>
<td>{linea.pmd_politica_publica}</td>
<td>{linea.pmd_objetivo}</td>
<td>{linea.pmd_estrategia}</td>
<td>{linea.linea_base}</td>
<td>{linea.total}</td>
<td>{linea.ejercicio}</td>
<td>{linea.columna1}</td>
<td>{linea.lineas_accion}</td>
<td>{linea.nomenclatura}</td>
<td>{linea.responsable}</td>
<td>{linea.plazo}</td>

<td>

<span className={`estado ${linea.estado}`}>
{linea.estado}
</span>

</td>

</tr>

))}

</tbody>

</table>

</div>


<div className="acciones">

<div className="acciones-left">

<button className="btn aprobar">
Aprobar
</button>

<button className="btn rechazar">
Rechazar
</button>

<button className="btn observar">
Observaciones
</button>

</div>

<div className="export">

<button className="btn exportar">
Exportar PDF
</button>

<button className="btn exportar">
Exportar Excel
</button>

</div>

</div>

</div>

))}

</div>

</div>

)

}