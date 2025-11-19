import { Route, Routes, Navigate } from "react-router-dom";
import Firstpage from "./pages/Firstpage";
import Login from "./pages/Login";
import Dash from "./pages/Dash";
import { useState } from "react";
import Createacc from "./pages/Createacc";
import { library } from '@fortawesome/fontawesome-svg-core'
import { fab } from '@fortawesome/free-brands-svg-icons'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'
import Group from "./pages/Group";
import GroupPage from "./pages/GroupPage";
import Qpost from "./pages/Qpost";
import Quiz from "./pages/Quiz";
import QuizForm from "./pages/QuizForm";
import Mygrp from "./pages/Mygrp";
import Profilepage from "./pages/Profilepage";
import NotificationsPage from "./pages/NotificationsPage";
import ProtectedRoute from "./components/common/ProtectedRoute";
import OnboardingRoute from "./components/common/OnboardingRoute";
import LoadingSpinner from "./components/common/LoadingSpinner";
import { useAuth } from "./context/AuthContext";

function App() {
  const { currentUser, userData, loading, authReady, profileLoaded } = useAuth();
  
  // Posts will be loaded from Firebase in Feed component
  const [qpost, setqpost] = useState([])

  // Quiz posts will be loaded from Firebase when needed
  const [quizpost, setquizpost] = useState([])

  const [quizData, setQuizData] = useState({
    quizTitle: '',
    quizSynopsis: '',
    questions: [],
  })

  const [postId, setpostId] = useState('')
  
  // Show loading spinner until auth and profile are loaded
  if (loading || !authReady || (currentUser && !profileLoaded)) {
    return <LoadingSpinner />;
  }
  
  // Use userData from auth context if available, otherwise use placeholder
  const cudetails = userData ? {
    _id: currentUser?.uid || '',
    username: userData.profile?.username || userData.username || '',
    email: userData.email || currentUser?.email || ''
  } : {
    _id: '',
    username: '',
    email: ''
  }

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Firstpage/>}/>
        <Route 
          path="/login" 
          element={currentUser ? <Navigate to="/home" /> : <Login />}
        />
        <Route 
          path="/signup" 
          element={currentUser ? <Navigate to="/home" /> : <Createacc/>}
        />

        <Route 
          path="/setup" 
          element={<OnboardingRoute />}
        />

        <Route path="/home" element={
          <ProtectedRoute>
            <Navigate to="/home/all" replace />
          </ProtectedRoute>
        }/>

        <Route path="/home/all" element={
          <ProtectedRoute>
            <Dash
              setid={setpostId}
              qpost={qpost}
              setqpost={setqpost}
              cudetails={cudetails}
            />
          </ProtectedRoute>
        }/>

        <Route path="/Group" element={
          <ProtectedRoute>
            <Group/>
          </ProtectedRoute>
        }/>

        <Route path="/group/:id" element={
          <ProtectedRoute>
            <GroupPage/>
          </ProtectedRoute>
        }/>

        <Route path="/home/:id" element={
          <ProtectedRoute>
            <Qpost
              setid={setpostId}
              cudetails={cudetails}
            />
          </ProtectedRoute>
        }/>

        <Route path="/home/qpost" element={
          <ProtectedRoute>
            <Dash
              setid={setpostId}
              qpost={qpost}
              setqpost={setqpost}
              cudetails={cudetails}
            />
          </ProtectedRoute>
        }/>

        <Route path="/home/quiz" element={
          <ProtectedRoute>
            <Quiz cudetails={cudetails} />
          </ProtectedRoute>
        }/>

        <Route path="/home/quizform" element={
          <ProtectedRoute>
            <QuizForm
              setid={setpostId}
              qpost={qpost}
              setqpost={setqpost}
              cudetails={cudetails}
              setQuizData={setQuizData}
              quizData={quizData}
              quizpost={quizpost}
              setquizpost={setquizpost}
            />
          </ProtectedRoute>
        }/>

        <Route path="/profile" element={
          <ProtectedRoute>
            <Profilepage
              setid={setpostId}
              qpost={qpost}
              setqpost={setqpost}
              cudetails={cudetails}
              setQuizData={setQuizData}
              quizData={quizData}
            />
          </ProtectedRoute>
        }/>

        <Route path="/notification" element={
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        }/>
      </Routes>
    </div>
  );
}

export default App;
library.add(fab, fas, far)
