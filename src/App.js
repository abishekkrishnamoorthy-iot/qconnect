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
import Qpost from "./pages/Qpost";
import Quiz from "./pages/Quiz";
import isEqual from 'lodash/isEqual';
import QuizForm from "./pages/QuizForm";
import Mygrp from "./pages/Mygrp";
import Profile from "./pages/Profilepage";
import Profilepage from "./pages/Profilepage";


function App() {
  const [auth, setauth]=useState(false)
  const [user, setuser]=useState([])
  const [username,setusername]=useState('')
  const [passcode, setpasscode]=useState("")
  const [cudetails,setcudetails]=useState(null)
  const [curuser,setcuruser]=useState('')
  const [qpost,setqpost]=useState([])
  const [quizpost,setquizpost]=useState([])
  const [cupost,setcupost]=useState([])
  const [quizData, setQuizData] = useState({
    quizTitle: '',
    quizSynopsis: '',
    questions: [],
  });


  const navigate=useNavigate()
  const url='http://localhost:3500/users'
  console.log(cudetails?.username)
  console.log(qpost)

  useEffect(() => {
    const storedCudetails = localStorage.getItem('cudetails');
    if (storedCudetails) {
      setcudetails(JSON.parse(storedCudetails));
    }
  },[localStorage.getItem('accessToken')]);
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
          throw new Error('Access token not found');
        }
  
        const response = await fetch('http://localhost:3500/users', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });
  
        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }
        
        const data = await response.json();
        setuser(data);
        console.log(user);
        setauth(true);
      } catch (error) {
        console.error('Error fetching user data:', error.message);
        setauth(false);
        localStorage.clear();
      }
    };
  
    // Call fetchUsers initially
    fetchUsers();
    
    // Set up an interval to fetch data every minute
    const intervalId = setInterval(fetchUsers, 6000); // 60000 milliseconds = 1 minute
  
    // Clean-up function to clear the interval when the component unmounts or when user changes
    return () => clearInterval(intervalId);
  }, [auth]); // Empty dependency array ensures this effect only runs once on mount
  
  const [curpost,setcurpost]=useState([])
  const [postId,setpostId]=useState('12414')
  const [ans,setans]=useState([])
  useEffect(() => {
    const fetchPostans = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        const response = await fetch(`http://localhost:3500/qpost/${postId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch user details');
        }
        const Data = await response.json();
        setcurpost(Data)
        console.log(curpost)
        console.log(postId)
      } catch (error) {
         console.log(error.message);
      }
    };
    fetchPostans();
    
  }, [postId]);
  
 
  useEffect(() => {
    // Fetch quiz post data after quizData changes
    const fetchQuizPosts = async () => {
      try {
        // Get access token from local storage
        const accessToken = localStorage.getItem('accessToken');

        const response = await fetch('http://localhost:3500/quizpost', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch quiz posts');
        }

        const data = await response.json();
        console.log('Quiz posts:', data);
        // Update state with fetched quiz post data
        if (!isEqual(data, quizpost)) { // You need to import isEqual function from lodash or write your own function to compare objects
          setquizpost(data); // Update the state only if there are differences
        }
      } catch (error) {
        console.error('Error fetching quiz posts:', error.message);
      }
    };

    fetchQuizPosts();
  }, []); // Run effect when quizData changes
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Firstpage/>}/>
        <Route path="/login" element={<Login auth={auth}
                                             setauth={setauth} 
                                             setcudetails={setcudetails}   
                                             setcuruser={setcuruser}                   
                                            />}/>
        <Route path="/signup" element={<Createacc user={user}
                                                  setuser={setuser}/>}/>
        
        <Route path="/home" element={auth?<Dash setauth={setauth}
                                                setid={setpostId}
                                                qpost={qpost}
                                                setqpost={setqpost}
                                                cudetails={cudetails}/>:<p><center>wrongpasscode or session timeout</center></p>
                                              }/>
        <Route path="/Group" element={<Group/>}/>
        <Route path="/home/:id" element={<Qpost     setid={setpostId}
                                                    qpost={qpost}
                                                    curpost={curpost}
                                                    cudetails={cudetails}/>}/>
         <Route path="/home/qpost" element={auth?<Dash setauth={setauth}
                                                setid={setpostId}
                                                qpost={qpost}
                                                setqpost={setqpost}
                                                cudetails={cudetails}/>:<p><center>wrongpasscode or session timeout</center></p>}/>
        <Route path="/home/quiz" element={auth?<Quiz setauth={setauth}
                                                setid={setpostId}
                                                qpost={qpost}
                                                setqpost={setqpost}
                                                cudetails={cudetails}
                                                quizData={quizData}
                                                quizpost={quizpost}/>:<p><center>wrongpasscode or session timeout</center></p>}/>
        <Route path="/home/quizform" element={auth?<QuizForm setauth={setauth}
                                                setid={setpostId}
                                                qpost={qpost}
                                                setqpost={setqpost}
                                                cudetails={cudetails}
                                                setQuizData={setQuizData}
                                                quizData={quizData}
                                                quizpost={quizpost}
                                                
                                                setquizpost={setquizpost}/>:<p><center>wrongpasscode or session timeout</center></p>}/>
        <Route path="/group/id" element={auth?<Mygrp setauth={setauth}
                                                setid={setpostId}
                                                qpost={qpost}
                                                setqpost={setqpost}
                                                cudetails={cudetails}
                                                setQuizData={setQuizData}
                                                quizData={quizData}/>:<p><center>wrongpasscode or session timeout</center></p>}/>
        <Route path="/followedgrp/id" element={auth?<Mygrp setauth={setauth}
                                                setid={setpostId}
                                                qpost={qpost}
                                                setqpost={setqpost}
                                                cudetails={cudetails}
                                                setQuizData={setQuizData}
                                                quizData={quizData}/>:<p><center>wrongpasscode or session timeout</center></p>}/>
        <Route path="/profile" element={auth?<Profilepage setauth={setauth}
                                                setid={setpostId}
                                                qpost={qpost}
                                                setqpost={setqpost}
                                                cudetails={cudetails}
                                                setQuizData={setQuizData}
                                                quizData={quizData}
                                                setcupost={setcupost}
                                                cupost={cupost}/>:<p><center>wrongpasscode or session timeout</center></p>}/>
      </Routes>
      
    </div>
  );
}

export default App;
library.add(fab, fas, far)

