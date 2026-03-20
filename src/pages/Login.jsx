import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import axios from "axios"
import { FaEye, FaEyeSlash } from "react-icons/fa"
import { motion } from "framer-motion"
import "../styles/login.css"

const schema = z.object({
email: z.string().min(3,"Usuario requerido"),
password: z.string().min(4,"Contraseña requerida")
})

export default function Login(){

const [error,setError] = useState("")
const [showPassword,setShowPassword] = useState(false)

const {
register,
handleSubmit,
formState:{errors,isSubmitting}
} = useForm({
resolver:zodResolver(schema)
})

const onSubmit = async(data)=>{

setError("")

try{

const res = await axios.post(
"http://localhost:3000/api/auth/login",
data
)

localStorage.setItem("token",res.data.token)

window.location.href="/dashboard"

}catch(err){

setError("Usuario o contraseña incorrectos")

}

}

return(

<div className="login-wrapper">

<motion.div 
className="login-card"
initial={{opacity:0,scale:0.95}}
animate={{opacity:1,scale:1}}
transition={{duration:0.4}}
>

<h1>Sistema de Planeación</h1>

<form onSubmit={handleSubmit(onSubmit)}>

<div className="input-group">

<input
placeholder="Usuario"
{...register("email")}
/>

{errors.email && (
<p className="error">{errors.email.message}</p>
)}

</div>

<div className="input-group password-group">

<input
type={showPassword ? "text" : "password"}
placeholder="Contraseña"
{...register("password")}
/>

<span
className="eye"
onClick={()=>setShowPassword(!showPassword)}
>
{showPassword ? <FaEyeSlash/> : <FaEye/>}
</span>

{errors.password && (
<p className="error">{errors.password.message}</p>
)}

</div>

{error && <p className="error">{error}</p>}

<button disabled={isSubmitting}>
{isSubmitting ? "Ingresando..." : "Iniciar sesión"}
</button>

</form>

</motion.div>

</div>

)

}