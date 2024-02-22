import React from 'react'

import Form from '../components/quizform/Form'
import '../style/quiz/quizform.css'
const QuizForm = ({cudetails,setQuizData,quizData,quizpost,setquizpost}) => {
  return (
    <div className='quizform'>
        <Form user={cudetails}
              setQuizData={setQuizData}
              quizData={quizData}
              quizpost={quizpost}
              setquizpost={setquizpost}
              cudetails={cudetails}
              />
    </div>
  )
}

export default QuizForm