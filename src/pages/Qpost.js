import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import Header from '../components/common/Header'
import Question from '../components/Answer/Question'
import Usersans from '../components/Answer/Usersans'
import UserInfoCard from '../components/answer/UserInfoCard'
import WriteAnswerModal from '../components/answer/WriteAnswerModal'
import '../style/dash/ans.css'
import { getPost, subscribeToAnswers, getUser, getUserGroups, getPosts } from '../services/db'
import { normalizePostType } from '../utils/postTypes'

const Qpost = ({ setid }) => {
  const { id } = useParams()
  const [post, setPost] = useState(null)
  const [answers, setAnswers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [authorProfile, setAuthorProfile] = useState(null)
  const [authorStats, setAuthorStats] = useState({ followers: 0, questions: 0, groups: 0 })
  const [authorLoading, setAuthorLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    if (setid) setid(id)
  }, [id, setid])

  useEffect(() => {
    const loadPost = async () => {
      setLoading(true)
      const result = await getPost(id)
      if (result.success) {
        setPost(result.data)
        loadAuthorDetails(result.data.userId || result.data.createdBy)
      } else {
        setError('Post not found')
      }
      setLoading(false)
    }

    const loadAuthorDetails = async (uid) => {
      if (!uid) {
        setAuthorProfile(null)
        return
      }
      setAuthorLoading(true)
      try {
        const [userResult, groupsResult, postsResult] = await Promise.all([
          getUser(uid),
          getUserGroups(uid),
          getPosts({ userId: uid })
        ])

        if (userResult.success) {
          setAuthorProfile(userResult.data)
        }

        const questionsCount = postsResult.success
          ? postsResult.data.filter(p => normalizePostType(p.type) === 'question').length
          : 0

        setAuthorStats({
          followers: userResult.success ? (userResult.data.followerCount || 0) : 0,
          questions: questionsCount,
          groups: groupsResult.success ? groupsResult.data.length : 0
        })
      } catch (authorError) {
        console.error('Error loading author info:', authorError)
      } finally {
        setAuthorLoading(false)
      }
    }

    loadPost()
  }, [id])

  useEffect(() => {
    const unsubscribe = subscribeToAnswers(id, (answersList) => {
      setAnswers(answersList)
    })

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [id])

  const handleAnswerCreated = () => {
    // answers update via subscription
  }

  if (loading) {
    return (
      <div className='anspage'>
        <Header/>
        <div className="answer-layout" style={{ justifyContent: 'center' }}>
          <div>Loading post...</div>
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className='anspage'>
        <Header/>
        <div className="answer-layout" style={{ justifyContent: 'center' }}>
          <div style={{color: 'red'}}>{error || 'Post not found'}</div>
        </div>
      </div>
    )
  }

  const postOwnerId = post.userId || post.createdBy

  return (
    <div className='anspage'>
      <Header/>
      <div className="answer-layout">
        <div className="answer-left">
          <UserInfoCard
            authorUid={postOwnerId}
            authorProfile={authorProfile}
            stats={authorStats}
            loading={authorLoading}
          />
        </div>
        <div className="answer-content">
          <Question
            post={post}
            onWriteAnswer={() => setIsModalOpen(true)}
          />
          <Usersans postans={answers} />
        </div>
      </div>
      <WriteAnswerModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        post={post}
        onAnswerCreated={handleAnswerCreated}
      />
    </div>
  )
}

export default Qpost
