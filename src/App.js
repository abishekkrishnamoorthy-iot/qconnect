import { Route, Routes } from "react-router-dom";
import Firstpage from "./pages/Firstpage";
import Login from "./pages/Login";
import Dash from "./pages/Dash";
import { useEffect, useState } from "react";
import Createacc from "./pages/Createacc";
import { library } from '@fortawesome/fontawesome-svg-core'
import { fab } from '@fortawesome/free-brands-svg-icons'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'

function App() {
  const [auth, setauth]=useState(false)
  const [user, setuser]=useState([])
  const [curuser,setcuruser]=useState([])
  const url='http://localhost:5000/user'
  useEffect(()=>{
    console.log(auth)
    const fetch_data=async ()=>{
      try {
        const res=await fetch(url)
        if(!res.ok) throw Error("error")
        const users= await res.json()
        setauth(users[1].Auth)
        setuser(users)
      } catch (error) {
        
      }  
    }
      fetch_data()},[auth,user])
    useEffect(()=>{
  },[user])
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Firstpage/>}/>
        <Route path="/login" element={<Login auth={auth}
                                             setauth={setauth}
                                             user={user}
                                             setuser={setuser}
                                             curuser={curuser}
                                             setcuruser={setcuruser}/>}/>
        <Route path="/signup" element={<Createacc user={user}
                                                  setuser={setuser}/>}/>
        
        <Route path="/dash" element={auth?<Dash/>:<Login auth={auth}
                                                         etauth={setauth}
                                                         curuser={curuser}
                                                         setcuruser={setcuruser}/>}/>
      </Routes>
    </div>
  );
}

export default App;
library.add(fab, fas, far)