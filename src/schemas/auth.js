import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(3, "Usuario requerido"),
  password: z.string().min(4, "Contraseña requerida"),
});