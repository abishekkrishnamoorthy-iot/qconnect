import React from 'react'
import Header from '../components/common/Header'
import Grouppanel from '../components/dash/Grouppanel'
import Quizpage from '../components/quiz/Quizpage'
import '../style/quiz/quiz.css'
const Quiz = ({cudetails,setauth,quizData,quizpost}) => {
  return (
    <div className='dash'>
    <Header/>
    <div className='dashcon'>
    <Grouppanel/>
    <Quizpage setauth={setauth}
              cudetails={cudetails}
              quizData={quizData}
              post={quizpost}/>
    </div>
  </div>
  )
}

export default Quiz