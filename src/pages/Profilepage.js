import React, { useState, useEffect } from 'react'
import Header from '../components/common/Header'
import '../style/profile/profile.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Qpost from '../components/profilepage/Qpost';
import Qzpost from '../components/profilepage/Qzpost';
import { useAuth } from '../context/AuthContext';
import { subscribeToPosts, getGroups } from '../services/db';
import GroupManageModal from '../components/profilepage/GroupManageModal';
import ProfileUserProfileCard from '../components/profilepage/ProfileUserProfileCard';
import ProfileUserStatsCard from '../components/profilepage/ProfileUserStatsCard';

const Profilepage = ({cudetails, cupost}) => {
  const { currentUser, userData } = useAuth()
  const [activeButton, setActiveButton] = useState('question');
  const [userPosts, setUserPosts] = useState([])
  const [userQuizzes, setUserQuizzes] = useState([])
  const [adminGroups, setAdminGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedGroup, setSelectedGroup] = useState(null)

  useEffect(() => {
    if (currentUser) {
      loadUserContent()
    }
  }, [currentUser])

  // Subscribe to user's posts for real-time updates
  useEffect(() => {
    if (!currentUser) return

    console.log('Profilepage: Setting up post subscription for userId:', currentUser.uid)
    
    // Subscribe to posts filtered by userId
    const unsubscribe = subscribeToPosts((posts) => {
      const uid = currentUser.uid
      
      console.group('Profilepage: Posts received from subscription')
      console.log('Total posts received:', posts.length)
      
      if (posts.length > 0) {
        console.log('Sample post structure:', {
          id: posts[0]._id || posts[0].postId,
          type: posts[0].type,
          userId: posts[0].userId,
          createdBy: posts[0].createdBy,
          title: posts[0].title?.substring(0, 30),
          hasUserId: !!posts[0].userId,
          hasCreatedBy: !!posts[0].createdBy
        })
      }
      
      // Debug: Log all posts received
      console.log('Profilepage: All posts received:', posts.map(p => ({
        id: p._id || p.postId,
        type: p.type,
        userId: p.userId,
        createdBy: p.createdBy,
        title: p.title?.substring(0, 30)
      })))
      
      // Filter questions: type === 'question' AND (userId === uid OR createdBy === uid)
      const questions = posts.filter(post => {
        if (!post || typeof post !== 'object') {
          console.log('Profilepage: Excluding invalid post (null/undefined):', post)
          return false
        }
        
        const isQuestion = post.type === 'question'
        const isOwner = post.userId === uid || post.createdBy === uid
        
        if (!isQuestion) {
          console.log('Profilepage: Post is not a question:', {
            id: post._id || post.postId,
            type: post.type,
            title: post.title?.substring(0, 30)
          })
        }
        
        if (isQuestion && !isOwner) {
          console.log('Profilepage: Excluding question (not owner):', {
            id: post._id || post.postId,
            type: post.type,
            userId: post.userId,
            createdBy: post.createdBy,
            currentUid: uid,
            userIdMatch: post.userId === uid,
            createdByMatch: post.createdBy === uid
          })
        }
        
        if (isQuestion && isOwner) {
          console.log('Profilepage: ✓ Including question:', {
            id: post._id || post.postId,
            title: post.title?.substring(0, 30),
            userId: post.userId,
            createdBy: post.createdBy
          })
        }
        
        return isQuestion && isOwner
      })
      
      // Filter quizzes: type === 'quiz' AND (userId === uid OR createdBy === uid)
      const quizzes = posts.filter(post => {
        if (!post || typeof post !== 'object') {
          console.log('Profilepage: Excluding invalid post (null/undefined):', post)
          return false
        }
        
        const isQuiz = post.type === 'quiz'
        const isOwner = post.userId === uid || post.createdBy === uid
        
        if (!isQuiz) {
          console.log('Profilepage: Post is not a quiz:', {
            id: post._id || post.postId,
            type: post.type,
            title: post.title?.substring(0, 30)
          })
        }
        
        if (isQuiz && !isOwner) {
          console.log('Profilepage: Excluding quiz (not owner):', {
            id: post._id || post.postId,
            type: post.type,
            userId: post.userId,
            createdBy: post.createdBy,
            currentUid: uid,
            userIdMatch: post.userId === uid,
            createdByMatch: post.createdBy === uid
          })
        }
        
        if (isQuiz && isOwner) {
          console.log('Profilepage: ✓ Including quiz:', {
            id: post._id || post.postId,
            title: post.title?.substring(0, 30),
            userId: post.userId,
            createdBy: post.createdBy
          })
        }
        
        return isQuiz && isOwner
      })
      
      console.log('Profilepage: Questions found:', questions.length)
      console.log('Profilepage: Quizzes found:', quizzes.length)
      
      if (questions.length > 0) {
        console.log('Profilepage: Question IDs:', questions.map(q => q._id || q.postId))
        console.log('Profilepage: Question titles:', questions.map(q => q.title))
      } else {
        console.warn('Profilepage: ⚠️ No questions found! Check if posts have type="question" and userId/createdBy matches current user.')
      }
      
      if (quizzes.length > 0) {
        console.log('Profilepage: Quiz IDs:', quizzes.map(q => q._id || q.postId))
        console.log('Profilepage: Quiz titles:', quizzes.map(q => q.title))
      } else {
        console.warn('Profilepage: ⚠️ No quizzes found! Check if posts have type="quiz" and userId/createdBy matches current user.')
      }
      
      console.groupEnd()
      
      setUserPosts(questions)
      setUserQuizzes(quizzes)
      setLoading(false)
    }, { userId: currentUser.uid })

    return () => {
      console.log('Profilepage: Cleaning up post subscription')
      if (unsubscribe) unsubscribe()
    }
  }, [currentUser])

  const loadUserContent = async () => {
    if (!currentUser) return

    setLoading(true)

    // Load admin groups (groups created by user)
    const groupsResult = await getGroups()
    if (groupsResult.success) {
      const adminGroupsList = groupsResult.data.filter(group => group.creatorId === currentUser.uid)
      setAdminGroups(adminGroupsList)
    }

    // Posts are now loaded via subscribeToPosts in useEffect above
    // No need to call getPosts here anymore
  }

  const handleButtonClick = (button) => {
    setActiveButton(button);
  };

  const handleGroupUpdated = () => {
    loadUserContent();
    setSelectedGroup(null);
  };

  const handleGroupDeleted = () => {
    loadUserContent();
    setSelectedGroup(null);
  };

  const handlePostUpdated = (postId) => {
    // Reload user content to reflect updates
    loadUserContent();
  };

  const handlePostDeleted = (postId) => {
    // Remove post from local state immediately
    setUserPosts(prevPosts => prevPosts.filter(p => (p._id || p.postId) !== postId));
    setUserQuizzes(prevQuizzes => prevQuizzes.filter(q => (q._id || q.postId) !== postId));
  };

  // Admin Group Card Component
  const AdminGroupCard = ({ group, onManage }) => {
    const memberCount = group.members ? Object.keys(group.members).length : 0;

    return (
      <div className='profile-admin-group-card'>
        <img 
          src={group.banner || '/default-banner.jpg'} 
          className="profile-group-card-banner" 
          alt={group.name}
        />
        <img 
          src={group.icon || '/default-icon.png'} 
          className="profile-group-card-icon" 
          alt={group.name}
        />
        <div className="profile-group-card-title">{group.name}</div>
        <div className="profile-group-card-meta">
          {memberCount} {memberCount === 1 ? 'member' : 'members'} • {group.category} • {group.privacy}
        </div>
        <div className="profile-group-card-desc">{group.description}</div>
        <button 
          onClick={onManage}
          className="profile-group-card-manage-button"
        >
          Manage
        </button>
      </div>
    );
  };

  return (
    <div className='propage'>
      <Header/>
      <div className="propagecon">
        {/* Left Sidebar */}
        <div className="profile-left-sidebar">
          <ProfileUserProfileCard />
          <ProfileUserStatsCard />
        </div>

        {/* Right Content Area */}
        <div className="probox">
          <div className='grpnav'>
            <ul>
              <button
                className={activeButton === 'question' ? 'text active' : 'text'}
                onClick={() => handleButtonClick('question')}
              >
                Questions
              </button>
              <button
                className={activeButton === 'quiz' ? 'text active' : 'text'}
                onClick={() => handleButtonClick('quiz')}
              >
                Quizzes
              </button>
              <button
                className={activeButton === 'groups' ? 'text active' : 'text'}
                onClick={() => handleButtonClick('groups')}
              >
                Groups
              </button>
            </ul>
          </div>
          {activeButton === 'question' && (
            loading ? (
              <div>Loading posts...</div>
            ) : userPosts.length > 0 ? (
              userPosts.map(post => (
                <Qpost 
                  key={post._id || post.postId} 
                  post={post} 
                  onPostUpdated={handlePostUpdated}
                  onPostDeleted={handlePostDeleted}
                  cudetails={cudetails}
                />
              ))
            ) : (
              <div>No questions posted yet.</div>
            )
          )}
          {activeButton === 'quiz' && (
            loading ? (
              <div>Loading quizzes...</div>
            ) : userQuizzes.length > 0 ? (
              userQuizzes.map(quiz => (
                <Qzpost 
                  key={quiz._id || quiz.postId} 
                  post={quiz} 
                  onPostUpdated={handlePostUpdated}
                  onPostDeleted={handlePostDeleted}
                  cudetails={cudetails}
                />
              ))
            ) : (
              <div>No quizzes created yet.</div>
            )
          )}
          {activeButton === 'groups' && (
            loading ? (
              <div>Loading groups...</div>
            ) : adminGroups.length > 0 ? (
              <div className="admin-groups-list">
                {adminGroups.map(group => (
                  <AdminGroupCard 
                    key={group._id} 
                    group={group} 
                    onManage={() => setSelectedGroup(group)}
                  />
                ))}
              </div>
            ) : (
              <div>No admin groups yet.</div>
            )
          )}
        </div>
      </div>
      
      {selectedGroup && (
        <GroupManageModal
          group={selectedGroup}
          onClose={() => setSelectedGroup(null)}
          onGroupUpdated={handleGroupUpdated}
          onGroupDeleted={handleGroupDeleted}
        />
      )}
    </div>
  )
}

export default Profilepage
