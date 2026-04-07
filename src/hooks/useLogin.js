import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import axios from "axios"
import { loginSchema } from "../schemas/auth"

export function useLogin() {
    const [error,setError] = useState("")
    const [showPassword,setShowPassword] = useState(false)
    
    const {
        register,
        handleSubmit,
        formState:{errors,isSubmitting}
    } = useForm({
        resolver:zodResolver(loginSchema)
    });
    
    const onSubmit = async(data)=>{
        setError("")
        try{
            const res = await axios.post("http://localhost:3001/api/auth/login",data)
            localStorage.setItem("token",res.data.token)
            window.location.href="/dashboard"
        } catch(err){
            setError("Usuario o contraseña incorrectos")
        }
    };
    
    return {
        register,
        handleSubmit: handleSubmit(onSubmit), //devolucion de funcion
        errors,
        isSubmitting,
        error,
        showPassword,
        togglePassword: () => setShowPassword(!showPassword),
    };
}