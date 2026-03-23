import {useEffect,useState} from "react"

import DashboardDependencias from "./DashboardDependencias"
import DashboardPlaneacion from "./DashboardPlaneacion"
import DashboardAdmin from "./DashboardAdmin"

export default function DashboardRouter(){

const [user,setUser] = useState(null)

useEffect(()=>{

const token = localStorage.getItem("token")

fetch("http://localhost:3000/api/auth/me",{
headers:{
Authorization:`Bearer ${localStorage.getItem("token")}`
}
})
.then(res => res.json())
.then(data=>{
console.log("DATA DEL USUARIO:",data)
setUser(data)
})
},[])

if(!user) return <p>Cargando...</p>


if(user.rol === "dependencias"){
return <DashboardDependencias/>
}

if(user.rol === "planeacion"){
return <DashboardPlaneacion/>
}

if(user.rol === "admin"){
return <DashboardAdmin/>
}

return <p>No autorizado</p>

}