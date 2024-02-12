import { Route, Routes, useNavigate } from "react-router-dom";
import Firstpage from "./pages/Firstpage";
import Login from "./pages/Login";
import Dash from "./pages/Dash";
import { useEffect, useState } from "react";
import Createacc from "./pages/Createacc";
import { library } from '@fortawesome/fontawesome-svg-core'
import { fab } from '@fortawesome/free-brands-svg-icons'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'
import Group from "./pages/Group";
import Profile from "./pages/Profile";

function App() {
  const [auth, setauth]=useState(false)
  const [user, setuser]=useState([])
  const [username,setusername]=useState('')
  const [passcode, setpasscode]=useState("")
  const [curuser,setcuruser]=useState([])
  const navigate=useNavigate()
  const url='http://localhost:3500/users'
  useEffect(()=>{
    console.log(auth)
    const fetch_data=async ()=>{
      try {
        const res=await fetch(url)
        if(!res.ok) throw Error("error")
        const users= await res.json()
        setuser(users)
        console.log(users)
      } catch (error) {
        
      }  
    }
      fetch_data()},[auth])
      useEffect(()=>{
        if(user){
          console.log(user)
        }
    },[user])

// login verification
const handlelogin= async(e)=>{
  e.preventDefault()
  console.log(`${username}\t ${passcode}`)
  const getuser= user.filter(i=>i.username === username && i.password===passcode)
  const bool=()=>{
    if(getuser.length){
      console.log(getuser)
      return true
    }else{
      return false
    }
  }
  bool()? navigate('/home'):navigate('/login')
  setauth(bool)
}
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Firstpage/>}/>
        <Route path="/login" element={<Login auth={auth}
                                             setauth={setauth}
                                             user={user}
                                             setuser={setuser}
                                             username={username}
                                             setusername={setusername}
                                             passcode={passcode}
                                             setpasscode={setpasscode}
                                             handlelogin={handlelogin}
                                            />}/>
        <Route path="/signup" element={<Createacc user={user}
                                                  setuser={setuser}/>}/>
        
        <Route path="/home" element={auth?<Dash/>:<Login auth={auth}
                                                         etauth={setauth}
                                              />}/>
        <Route path="/Group" element={<Group/>}/>
        
      </Routes>
      
    </div>
  );
}

export default App;
library.add(fab, fas, far)