import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home/Home";
import Login from "./pages/Login/Login";
import { Toaster } from "react-hot-toast";

const App = () => {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={ <Home /> }></Route>
          <Route path="/login" element={ <Login /> }></Route>
        </Routes>
        <Toaster />
      </BrowserRouter>
    </>
  )
}

export default App;