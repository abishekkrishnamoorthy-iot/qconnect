import { Route, Routes } from "react-router-dom";
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
import Qpost from "./pages/Qpost";
import Quiz from "./pages/Quiz";
import QuizForm from "./pages/QuizForm";
import Mygrp from "./pages/Mygrp";
import Profilepage from "./pages/Profilepage";

function App() {
  const [auth, setauth] = useState(true)
  const [cudetails] = useState({
    _id: '1',
    username: 'demo_user',
    email: 'demo@qconnect.com'
  })

  const [qpost, setqpost] = useState([
    {
      _id: '1',
      username: 'sarah_johnson',
      title: 'What are the best practices for React development in 2024?',
      text: 'Looking for comprehensive guidelines on modern React development.',
      answers: [{_id: '1', username: 'expert_dev', answer: 'Use functional components with hooks.'}],
      user: { username: 'sarah_johnson' },
      likes: [],
      views: 142
    },
    {
      _id: '2',
      username: 'alex_chen',
      title: 'How to implement secure authentication in web applications?',
      text: 'Need expert advice on implementing robust authentication systems.',
      answers: [],
      user: { username: 'alex_chen' },
      likes: [],
      views: 87
    },
    {
      _id: '3',
      username: 'maria_garcia',
      title: 'Which database is best for scalable modern applications?',
      text: 'Comparing PostgreSQL, MongoDB, and other options for high-traffic apps.',
      answers: [{_id: '2', username: 'db_expert', answer: 'PostgreSQL offers great scalability.'}],
      user: { username: 'maria_garcia' },
      likes: [],
      views: 156
    },
    {
      _id: '4',
      username: 'david_kumar',
      title: 'Best practices for API design and documentation?',
      text: 'Looking for industry standards in RESTful API development.',
      answers: [],
      user: { username: 'david_kumar' },
      likes: [],
      views: 93
    }
  ])

  const [quizpost, setquizpost] = useState([
    {
      _id: '1',
      createdBy: { username: 'tech_educator' },
      date: new Date('2024-01-15'),
      quiz: {
        quizTitle: 'JavaScript Fundamentals Assessment',
        quizSynopsis: 'Comprehensive test covering JavaScript basics including variables, functions, data types, and modern ES6+ features. Perfect for beginners and intermediate developers.',
        questions: [
          {
            question: 'What is the correct syntax for declaring a function in JavaScript?',
            questionType: 'text',
            answers: ['function myFunc()', 'def myFunc()', 'func myFunc()', 'function: myFunc()'],
            correctAnswer: '1',
            messageForCorrectAnswer: 'Excellent! You understand JavaScript function syntax.',
            messageForIncorrectAnswer: 'Not quite. Review function declaration syntax.',
            explanation: 'Functions in JavaScript are declared using the function keyword followed by the function name and parentheses.',
            point: 10
          }
        ]
      }
    },
    {
      _id: '2',
      createdBy: { username: 'react_master' },
      date: new Date('2024-01-20'),
      quiz: {
        quizTitle: 'React Hooks Deep Dive',
        quizSynopsis: 'Test your knowledge of React Hooks including useState, useEffect, useContext, and custom hooks. Advanced concepts for experienced developers.',
        questions: [
          {
            question: 'Which hook is used for side effects in React?',
            questionType: 'text',
            answers: ['useState', 'useEffect', 'useContext', 'useReducer'],
            correctAnswer: '2',
            messageForCorrectAnswer: 'Perfect! useEffect is the correct answer.',
            messageForIncorrectAnswer: 'Incorrect. Think about lifecycle methods.',
            explanation: 'useEffect is used for handling side effects like data fetching and subscriptions.',
            point: 15
          }
        ]
      }
    }
  ])

  const [cupost] = useState({
    questionPosts: qpost.slice(0, 2),
    quizPosts: quizpost
  })

  const [quizData, setQuizData] = useState({
    quizTitle: '',
    quizSynopsis: '',
    questions: [],
  })

  const [postId, setpostId] = useState('1')

  const [curpost] = useState({
    qpost: qpost[0],
    user: { username: 'sarah_johnson' }
  })

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Firstpage/>}/>
        <Route path="/login" element={<Login auth={auth} setauth={setauth} setcudetails={() => {}}/>}/>
        <Route path="/signup" element={<Createacc/>}/>

        <Route path="/home" element={
          <Dash
            setauth={setauth}
            setid={setpostId}
            qpost={qpost}
            setqpost={setqpost}
            cudetails={cudetails}
          />
        }/>

        <Route path="/Group" element={<Group/>}/>

        <Route path="/home/:id" element={
          <Qpost
            setid={setpostId}
            qpost={qpost}
            curpost={curpost}
            cudetails={cudetails}
          />
        }/>

        <Route path="/home/qpost" element={
          <Dash
            setauth={setauth}
            setid={setpostId}
            qpost={qpost}
            setqpost={setqpost}
            cudetails={cudetails}
          />
        }/>

        <Route path="/home/quiz" element={
          <Quiz
            setauth={setauth}
            setid={setpostId}
            qpost={qpost}
            setqpost={setqpost}
            cudetails={cudetails}
            quizData={quizData}
            quizpost={quizpost}
          />
        }/>

        <Route path="/home/quizform" element={
          <QuizForm
            setauth={setauth}
            setid={setpostId}
            qpost={qpost}
            setqpost={setqpost}
            cudetails={cudetails}
            setQuizData={setQuizData}
            quizData={quizData}
            quizpost={quizpost}
            setquizpost={setquizpost}
          />
        }/>

        <Route path="/group/id" element={
          <Mygrp
            setauth={setauth}
            setid={setpostId}
            qpost={qpost}
            setqpost={setqpost}
            cudetails={cudetails}
            setQuizData={setQuizData}
            quizData={quizData}
          />
        }/>

        <Route path="/followedgrp/id" element={
          <Mygrp
            setauth={setauth}
            setid={setpostId}
            qpost={qpost}
            setqpost={setqpost}
            cudetails={cudetails}
            setQuizData={setQuizData}
            quizData={quizData}
          />
        }/>

        <Route path="/profile" element={
          <Profilepage
            setauth={setauth}
            setid={setpostId}
            qpost={qpost}
            setqpost={setqpost}
            cudetails={cudetails}
            setQuizData={setQuizData}
            quizData={quizData}
            setcupost={() => {}}
            cupost={cupost}
          />
        }/>
      </Routes>
    </div>
  );
}

export default App;
library.add(fab, fas, far)
