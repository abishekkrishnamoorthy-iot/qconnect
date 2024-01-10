import { Route, Routes } from "react-router-dom";
import Firstpage from "./pages/Firstpage";

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Firstpage/>}/>
      </Routes>
    </div>
  );
}

export default App;
