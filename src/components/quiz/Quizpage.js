import React, { useState } from 'react'
import Dashnav from '../dash/Dashnav'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import QuizFeed from './QuizFeed'
import QuizCreationModal from './QuizCreationModal'
import '../../style/quiz/quiz.css'

const Quizpage = ({ cudetails }) => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleOpenModal = () => {
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  const handleQuizCreated = () => {
    // Quiz feed will update automatically via real-time subscription
    handleCloseModal()
  }

  return (
    <div className='postbox'>
      <Dashnav/>
      <div className='createquiz'>
        <div className="userprofile">
          <div className="img">
            <FontAwesomeIcon icon="fa-solid fa-user" size='xl' className='user'/>
          </div>
          <div className="userdetials">
            <h5>{cudetails?.username}</h5>
            <h6>Qconnect user</h6>
          </div>
        </div>
        <button className='btn' onClick={handleOpenModal}>Create Quiz</button>
      </div>
      <QuizFeed cudetails={cudetails} onQuizCreated={handleQuizCreated} />
      {isModalOpen && (
        <QuizCreationModal
          onClose={handleCloseModal}
          onQuizCreated={handleQuizCreated}
          cudetails={cudetails}
        />
      )}
    </div>
  )
}

export default Quizpage