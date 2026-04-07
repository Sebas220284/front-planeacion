import { motion } from "framer-motion";
import { FaEye, FaEyeSlash } from "react-icons/fa"
import { useLogin } from "../hooks/useLogin"
import "../styles/login.css"

export default function Login() {
  const { 
    register, handleSubmit, errors, isSubmitting, 
    error, showPassword, togglePassword 
  } = useLogin();

  return (
    <div className="login-wrapper"> 
        <div className="login-left">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
            >
                <h2>Sistema de planeacion</h2>
            </motion.div>
        </div>

        <div className="login-right"> 
            <motion.div
                className="login-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1>Iniciar Sesión</h1>
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <input placeholder="Usuario" {...register("email")} />
                        {errors.email && <p className="error">{errors.email.message}</p>}
                    </div>

                    <div className="input-group password-group">
                        <input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="Contraseña" 
                        {...register("password")} 
                        />
                        <span className="eye" onClick={togglePassword}>
                        {showPassword ? <FaEyeSlash/> : <FaEye/>}
                        </span>
                        {errors.password && <p className="error">{errors.password.message}</p>}
                    </div>

                    {error && <p className="error">{error}</p>}

                    <button disabled={isSubmitting}>
                        {isSubmitting ? "Ingresando..." : "Iniciar sesión"}
                    </button>
                    </form>
            </motion.div>
        </div>
    </div>
  );
}