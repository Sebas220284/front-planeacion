import { io } from "socket.io-client"

const socket = io("https://sistema-planeacion-production.up.railway.app")

export default socket
