import { Route, Routes } from "react-router-dom";
import Firstpage from "./pages/Firstpage";
import Login from "./pages/Login";
import Dash from "./pages/Dash";
import { useEffect, useState } from "react";
import Createacc from "./pages/Createacc";


function App() {
  const [auth, setauth]=useState(false)
  const [user, setuser]=useState([])
  const url='http://localhost:5000/user'
  useEffect(()=>{
    const fetch_data=async ()=>{
      try {
        const res=await fetch(url)
        if(!res.ok) throw Error("error")
        const users= await res.json()
        setuser(users)
      } catch (error) {
        
      }  
    }
      fetch_data()},[user])
  
    useEffect(()=>{
  },[auth,user])
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Firstpage/>}/>
        <Route path="/login" element={<Login auth={auth}
                                             setauth={setauth}
                                             user={user}
                                             setuser={setuser}/>}/>
        <Route path="/signup" element={<Createacc user={user}
                                                  setuser={setuser}/>}/>
        
        <Route path="/dash" element={auth?<Dash/>:<Login auth={auth}
                                                         etauth={setauth}/>}/>
      </Routes>
    </div>
  );
}

export default App;
