import {BrowserRouter,Routes,Route} from "react-router-dom"

import Login from "./pages/Login"
import DashboardRouter from "./pages/DashboardRouter"
import DashboardDependencias from "./pages/DashboardDependencias"
import DashboardPlaneacionRe from "./pages/DashboardPlaneacionRe"

function App(){

return(

<BrowserRouter>

<Routes>

{/*<Route path="/" element={<Login/>} /> */}

<Route path="/" element={<DashboardPlaneacionRe/>} />

</Routes>

</BrowserRouter>

)

}

export default App