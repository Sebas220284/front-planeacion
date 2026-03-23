import {BrowserRouter,Routes,Route} from "react-router-dom"

import Login from "./pages/Login"
import DashboardRouter from "./pages/DashboardRouter"

function App(){

return(

<BrowserRouter>

<Routes>

<Route path="/" element={<Login/>} />

<Route path="/dashboard" element={<DashboardRouter/>} />

</Routes>

</BrowserRouter>

)

}

export default App