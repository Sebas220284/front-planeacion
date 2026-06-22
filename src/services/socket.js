import { io } from "socket.io-client"

const socket = io("http://localhost:3100")

export default socket
