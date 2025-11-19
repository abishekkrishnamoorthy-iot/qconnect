import React from 'react'
import Header from '../components/common/Header'
import Grouppanel from '../components/dash/Grouppanel'
import TrendingGroups from '../components/dash/TrendingGroups'
import Quizpage from '../components/quiz/Quizpage'
import '../style/quiz/quiz.css'

const Quiz = ({ cudetails }) => {
  return (
    <div className='dash'>
      <Header/>
      <div className='dashcon'>
        <Grouppanel/>
        <Quizpage cudetails={cudetails} />
        <TrendingGroups/>
      </div>
    </div>
  )
}

export default Quiz