import React, { useState, useEffect } from 'react'
import { getQuizResults } from '../../services/quizDb'
import { getUser } from '../../services/db'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import '../../style/quiz/quiz.css'

const LeaderboardModal = ({ postId, onClose }) => {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadLeaderboard()
  }, [postId])

  const loadLeaderboard = async () => {
    setLoading(true)
    const result = await getQuizResults(postId)
    
    if (result.success) {
      // Sort by highest score first, then earliest finishedAt for ties
      const sorted = result.data.sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score
        }
        return a.finishedAt - b.finishedAt
      })

      // Get top 5
      const top5 = sorted.slice(0, 5)

      // Fetch user data for each result
      const resultsWithUsers = await Promise.all(
        top5.map(async (resultItem) => {
          const userResult = await getUser(resultItem.uid)
          return {
            ...resultItem,
            username: userResult.success 
              ? (userResult.data?.profile?.username || userResult.data?.username || 'Unknown')
              : 'Unknown',
            profilePic: userResult.success
              ? (userResult.data?.profile?.profilePic || userResult.data?.profilePic || '')
              : ''
          }
        })
      )

      setResults(resultsWithUsers)
    } else {
      setError(result.error || 'Failed to load leaderboard')
    }
    
    setLoading(false)
  }

  return (
    <div className="quiz-modal-overlay" onClick={onClose}>
      <div className="quiz-modal-content quiz-leaderboard-content" onClick={(e) => e.stopPropagation()}>
        <div className="quiz-modal-header">
          <h2>Leaderboard</h2>
          <button className="quiz-modal-close" onClick={onClose}>×</button>
        </div>

        {loading ? (
          <div className="quiz-leaderboard-loading">
            <p>Loading leaderboard...</p>
          </div>
        ) : error ? (
          <div className="quiz-leaderboard-error">
            <p>{error}</p>
          </div>
        ) : results.length === 0 ? (
          <div className="quiz-leaderboard-empty">
            <p>No results yet. Be the first to complete this quiz!</p>
          </div>
        ) : (
          <div className="quiz-leaderboard-list">
            {results.map((result, index) => (
              <div key={result.uid} className="quiz-leaderboard-item">
                <div className="leaderboard-rank">
                  <span className="rank-number">{index + 1}</span>
                </div>
                <div className="leaderboard-user">
                  <div className="leaderboard-user-img">
                    {result.profilePic ? (
                      <img 
                        src={result.profilePic} 
                        alt={result.username}
                        onError={(e) => {
                          e.target.style.display = 'none'
                          const iconElement = e.target.parentElement.querySelector('.leaderboard-user-icon')
                          if (iconElement) {
                            iconElement.style.display = 'flex'
                          }
                        }}
                      />
                    ) : null}
                    <FontAwesomeIcon 
                      icon="fa-solid fa-user" 
                      size='lg' 
                      className='leaderboard-user-icon'
                      style={{ display: result.profilePic ? 'none' : 'flex' }}
                    />
                  </div>
                  <div className="leaderboard-user-info">
                    <h4>{result.username}</h4>
                  </div>
                </div>
                <div className="leaderboard-score">
                  <span className="score-value">{result.score.toFixed(0)}%</span>
                  <span className="score-detail">{result.correctCount}/{result.answers.length}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default LeaderboardModal

