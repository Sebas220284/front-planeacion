import {BrowserRouter,Routes,Route} from "react-router-dom";

import Login from "./pages/Login";
import DashboardDependencias from "./pages/DashboardDependencias";

function App(){

return(

<BrowserRouter>

<Routes>

<Route path="/" element={<Login/>}/>

<Route path="/dependencias" element={<DashboardDependencias/>}/>

</Routes>

</BrowserRouter>

);

}

export default App;