import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import Header from '../components/common/Header'
import Question from '../components/Answer/Question'
import '../style/dash/ans.css'
import Usersans from '../components/Answer/Usersans'

const Qpost = ({setid, curpost, cudetails}) => {
  const {id} = useParams()
  setid(id)

  const [ans] = useState([
    {
      _id: '1',
      username: 'expert_developer',
      answer: 'Use functional components with hooks, implement proper error boundaries, optimize performance with React.memo and useMemo, and follow consistent naming conventions throughout your codebase.'
    },
    {
      _id: '2',
      username: 'senior_architect',
      answer: 'Focus on component composition over inheritance, keep components small and focused, use TypeScript for better type safety, and implement comprehensive testing strategies.'
    }
  ])

  return (
    <div className='anspage'>
      <Header/>
      <div className="anspagecon">
        <Question post={curpost} id={id} userdetails={cudetails}/>
        <Usersans postans={ans} />
      </div>
    </div>
  )
}

export default Qpost
