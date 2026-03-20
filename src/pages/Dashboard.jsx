import { useEffect, useState } from "react"
import "../styles/dashboard.css"

export default function Dashboard(){

const [user,setUser] = useState(null)
const [selectedStrategy,setSelectedStrategy] = useState(null)
const [lineas,setLineas] = useState([])
const [showStrategies,setShowStrategies] = useState(true)

const [modalLinea,setModalLinea] = useState(false)
const [nuevaLinea,setNuevaLinea] = useState("")

const logout = () => {
localStorage.removeItem("token")
window.location.href="/"
}

useEffect(()=>{

const token = localStorage.getItem("token")

fetch("http://localhost:3000/api/auth/me",{
headers:{
Authorization:`Bearer ${token}`
}
})
.then(res=>res.json())
.then(data=>{
setUser(data)
})

},[])

if(!user) return <p>Cargando...</p>



const estrategiasAgrupadas = Object.values(
user.estrategias.reduce((acc,e)=>{

if(!acc[e.id]){
acc[e.id] = {...e,lineas:[]}
}

acc[e.id].lineas.push(e)
return acc

},{})
)



const seleccionarEstrategia = (e) => {

setSelectedStrategy(e)

const lineasIniciales = e.lineas.map(l => ({
...l,
estado:"Aprobado",

p1t:"",p2t:"",p3t:"",p4t:"",
e1t:"",e2t:"",e3t:"",e4t:"",
comentario25_exec:"",

p1t26:"",p2t26:"",p3t26:"",p4t26:"",
e1t26:"",e2t26:"",e3t26:"",e4t26:"",
comentario26_exec:""

}))

setLineas(lineasIniciales)

}



const handleChange = (index,field,value)=>{

const nuevas = [...lineas]
nuevas[index][field] = value
setLineas(nuevas)

}


const guardarPlaneacion = ()=>{

console.log(lineas)
alert("Planeación guardada")

}



const enviarRevision = ()=>{

if(!nuevaLinea.trim()){
alert("Escribe el nombre")
return
}

const nueva = {

lineas_accion:nuevaLinea,
estado:"Pendiente",

p1t:"",p2t:"",p3t:"",p4t:"",
e1t:"",e2t:"",e3t:"",e4t:"",
comentario25_exec:"",

p1t26:"",p2t26:"",p3t26:"",p4t26:"",
e1t26:"",e2t26:"",e3t26:"",e4t26:"",
comentario26_exec:""

}

setLineas([...lineas,nueva])

setNuevaLinea("")
setModalLinea(false)

}

return(

<div className="layout">

<div className="sidebar">

<h2>{user.dependencia}</h2>

<div className="dependency-info">

<p><b>Titular:</b> {user.titular}</p>
<p><b>Enlace:</b> {user.enlace}</p>

<button
className="logout-btn"
onClick={logout}
>
Cerrar sesión
</button>

</div>

<button
className="strategy-toggle"
onClick={()=>setShowStrategies(!showStrategies)}
>
Estrategias {showStrategies ? "▲" : "▼"}
</button>

{showStrategies && (

<ul className="strategy-list">

{estrategiasAgrupadas.map((e,index)=>(

<li
key={e.id}
className={selectedStrategy?.id === e.id ? "active" : ""}
onClick={()=>seleccionarEstrategia(e)}
>

<span className="strategy-number">{index+1}</span>
<span className="strategy-name">{e.name}</span>

</li>

))}

</ul>

)}

</div>

<div className="content">

{!selectedStrategy && (

<div className="empty-panel">
<h2>Selecciona una estrategia</h2>
</div>

)}

{selectedStrategy && (

<div className="strategy-panel">

<h2>{selectedStrategy.name}</h2>

<div className="planning-grid">

<div>
<label>EJE</label>
<p>{selectedStrategy.pmd_eje || "-"}</p>
</div>

<div>
<label>TEMA</label>
<p>{selectedStrategy.pmd_tema || "-"}</p>
</div>

<div>
<label>POLÍTICA PÚBLICA</label>
<p>{selectedStrategy.pmd_politica_publica || "-"}</p>
</div>

<div>
<label>OBJETIVO</label>
<p>{selectedStrategy.pmd_objetivo || "-"}</p>
</div>

<div>
<label>ESTRATEGIA PMD</label>
<p>{selectedStrategy.pmd_estrategia || "-"}</p>
</div>

</div>

<h3 style={{marginTop:"20px"}}>Planeación</h3>

<div className="table-container">

<table className="excel-table">

<thead>

<tr>

<th rowSpan="2">#</th>
<th rowSpan="2">Línea de acción</th>
<th rowSpan="2">Estado</th>

<th colSpan="6">Programado 2025</th>
<th colSpan="6">Ejecutado 2025</th>

<th colSpan="6">Programado 2026</th>
<th colSpan="6">Ejecutado 2026</th>

</tr>

<tr>

<th>P/1T-2025(Ene-Mar)</th>
<th>P/2T-2025(Abr-Jun)</th>
<th>P/3T-2025(Jul-Sep)</th>
<th>P/4T-2025(Oct-Dic)</th>
<th>Acumlado</th>
<th>Comentarios</th>

<th>E/1T-2025(Ene-Mar)</th>
<th>E/2T-2025(Abr-Jun)</th>
<th>E/3T-2025(Jul-Sep)</th>
<th>E/4T-2025(Oct-Dic)</th>
<th>Acumulado</th>
<th>Comentarios</th>

<th>P/1T-2026(Ene-Mar)</th>
<th>P/2T-2026(Abr-Jun)</th>
<th>P/3T-2026(Jul-Sep)</th>
<th>P/4T-2026(Oct-Dic)</th>
<th>Acumulado</th>
<th>Comentarios</th>

<th>E/1T-2026(Ene-Mar)</th>
<th>E/2T-2026(Abr-Jun)</th>
<th>E/3T2026(Jul-Sep)</th>
<th>E/4T-2026(Oct-Dic)</th>
<th>Acumulado</th>
<th>Comentarios</th>

</tr>

</thead>

<tbody>

{lineas.map((l,i)=>(

<tr key={i}>

<td>{i+1}</td>

<td>{l.lineas_accion}</td>

<td>

{l.estado==="Pendiente" ? (
<span className="estado-pendiente">Pendiente</span>
) : (
<span className="estado-aprobado">Aprobado</span>
)}

</td>

<td><input value={l.p1t} onChange={(e)=>handleChange(i,"p1t",e.target.value)}/></td>
<td><input value={l.p2t} onChange={(e)=>handleChange(i,"p2t",e.target.value)}/></td>
<td><input value={l.p3t} onChange={(e)=>handleChange(i,"p3t",e.target.value)}/></td>
<td><input value={l.p4t} onChange={(e)=>handleChange(i,"p4t",e.target.value)}/></td>

<td>{Number(l.p1t||0)+Number(l.p2t||0)+Number(l.p3t||0)+Number(l.p4t||0)}</td>

<td>
<textarea onChange={(e)=>handleChange(i,"comentario25",e.target.value)}/>
</td>

<td><input value={l.e1t} onChange={(e)=>handleChange(i,"e1t",e.target.value)}/></td>
<td><input value={l.e2t} onChange={(e)=>handleChange(i,"e2t",e.target.value)}/></td>
<td><input value={l.e3t} onChange={(e)=>handleChange(i,"e3t",e.target.value)}/></td>
<td><input value={l.e4t} onChange={(e)=>handleChange(i,"e4t",e.target.value)}/></td>

<td>{Number(l.e1t||0)+Number(l.e2t||0)+Number(l.e3t||0)+Number(l.e4t||0)}</td>

<td>
<textarea onChange={(e)=>handleChange(i,"comentario25_exec",e.target.value)}/>
</td>

<td><input value={l.p1t26} onChange={(e)=>handleChange(i,"p1t26",e.target.value)}/></td>
<td><input value={l.p2t26} onChange={(e)=>handleChange(i,"p2t26",e.target.value)}/></td>
<td><input value={l.p3t26} onChange={(e)=>handleChange(i,"p3t26",e.target.value)}/></td>
<td><input value={l.p4t26} onChange={(e)=>handleChange(i,"p4t26",e.target.value)}/></td>

<td>{Number(l.p1t26||0)+Number(l.p2t26||0)+Number(l.p3t26||0)+Number(l.p4t26||0)}</td>

<td>
<textarea onChange={(e)=>handleChange(i,"comentario26",e.target.value)}/>
</td>

<td><input value={l.e1t26} onChange={(e)=>handleChange(i,"e1t26",e.target.value)}/></td>
<td><input value={l.e2t26} onChange={(e)=>handleChange(i,"e2t26",e.target.value)}/></td>
<td><input value={l.e3t26} onChange={(e)=>handleChange(i,"e3t26",e.target.value)}/></td>
<td><input value={l.e4t26} onChange={(e)=>handleChange(i,"e4t26",e.target.value)}/></td>

<td>{Number(l.e1t26||0)+Number(l.e2t26||0)+Number(l.e3t26||0)+Number(l.e4t26||0)}</td>

<td>
<textarea onChange={(e)=>handleChange(i,"comentario26_exec",e.target.value)}/>
</td>

</tr>

))}

</tbody>

</table>

</div>

<div className="save-container">

<button className="save-btn" onClick={guardarPlaneacion}>
Guardar
</button>

<button
className="add-line-btn"
onClick={()=>setModalLinea(true)}
>
Añadir línea
</button>

</div>

</div>

)}

</div>

{modalLinea && (

<div className="modal-overlay">

<div className="modal">

<h3>Añadir línea de acción</h3>

<input
type="text"
placeholder="Nombre de la línea"
value={nuevaLinea}
onChange={(e)=>setNuevaLinea(e.target.value)}
/>

<div className="modal-buttons">

<button onClick={()=>setModalLinea(false)}>
Cancelar
</button>

<button onClick={enviarRevision}>
Enviar
</button>

</div>

</div>

</div>

)}

</div>

)

}