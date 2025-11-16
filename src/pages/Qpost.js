import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import Header from '../components/common/Header'
import Question from '../components/Answer/Question'
import '../style/dash/ans.css'
import Usersans from '../components/Answer/Usersans'
import { getPost, getAnswers, subscribeToAnswers } from '../services/db'

const Qpost = ({ setid, cudetails }) => {
  const { id } = useParams()
  const [post, setPost] = useState(null)
  const [answers, setAnswers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (setid) setid(id)
    loadPost()
    loadAnswers()
  }, [id])

  const loadPost = async () => {
    const result = await getPost(id)
    if (result.success) {
      setPost(result.data)
    } else {
      setError('Post not found')
    }
    setLoading(false)
  }

  const loadAnswers = () => {
    // Subscribe to answers for real-time updates
    const unsubscribe = subscribeToAnswers(id, (answersList) => {
      setAnswers(answersList)
    })

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }

  const handleAnswerCreated = () => {
    // Answers will update automatically via subscription
  }

  if (loading) {
    return (
      <div className='anspage'>
        <Header/>
        <div className="anspagecon">
          <div>Loading post...</div>
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className='anspage'>
        <Header/>
        <div className="anspagecon">
          <div style={{color: 'red'}}>{error || 'Post not found'}</div>
        </div>
      </div>
    )
  }

  return (
    <div className='anspage'>
      <Header/>
      <div className="anspagecon">
        <Question post={post} id={id} userdetails={cudetails} onAnswerCreated={handleAnswerCreated} />
        <Usersans postans={answers} />
      </div>
    </div>
  )
}

export default Qpost
