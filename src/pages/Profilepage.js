import React, { useState, useEffect } from 'react'
import Header from '../components/common/Header'
import '../style/profile/profile.css'
import { Container, Box, Avatar } from '@mui/material';
import Profileimg from './profile.jpeg';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Qpost from '../components/profilepage/Qpost';
import Qzpost from '../components/profilepage/Qzpost';
import { useAuth } from '../context/AuthContext';
import { getPosts, getQuizzes, getGroups } from '../services/db';
import GroupManageModal from '../components/profilepage/GroupManageModal';

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

  const loadUserContent = async () => {
    if (!currentUser) return

    setLoading(true)
    
    // Load user's posts
    const postsResult = await getPosts({ userId: currentUser.uid })
    if (postsResult.success) {
      setUserPosts(postsResult.data)
    }

    // Load user's quizzes
    const quizzesResult = await getQuizzes()
    if (quizzesResult.success) {
      const userQuizzesList = quizzesResult.data.filter(q => q.userId === currentUser.uid)
      setUserQuizzes(userQuizzesList)
    }

    // Load admin groups (groups created by user)
    const groupsResult = await getGroups()
    if (groupsResult.success) {
      const adminGroupsList = groupsResult.data.filter(group => group.creatorId === currentUser.uid)
      setAdminGroups(adminGroupsList)
    }

    setLoading(false)
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
        <Container maxWidth="sm" sx={{width:'50%', alignItems:'center'}}>
          <Box sx={{
            display:'flex',
            flexDirection:'column',
            bgcolor: '#F9F0DB',
            height: '40vh',
            marginTop:'20px',
            marginLeft:'20%',
            width:'60%',
            alignItems:'center',
            borderRadius:'20px'
          }}>
            <Avatar
              src={Profileimg}
              sx={{
                width:'50%',
                height:'20vh',
                alignSelf:'center',
                marginTop:'30px'
              }}
            />
            <h3 style={{color:'#463804', marginBottom:'2px'}}>{cudetails.username}</h3>
            <h4 style={{marginTop:'0', opacity:'0.5'}}>Qconnect Professional</h4>
          </Box>

          <Box sx={{
            bgcolor: '#F9F0DB',
            height: '40vh',
            marginTop:'20px',
            marginLeft:'20%',
            width:'60%',
            alignSelf:'center'
          }}>
            <Box sx={{
              width:'100%',
              height:'12vh',
              display:'flex',
              flexDirection:'row',
              alignItems:'center',
              justifyContent:'center',
              borderBottom:'2px solid gray',
            }}>
              <FontAwesomeIcon icon="fa-solid fa-user-group" bounce size='2xl'/>
              <h3 style={{marginLeft:'20px'}}>Followers: {userData?.followerCount || 0}</h3>
            </Box>

            <Box sx={{
              width:'100%',
              height:'12vh',
              display:'flex',
              flexDirection:'row',
              alignItems:'center',
              justifyContent:'center',
              borderBottom:'2px solid gray',
            }}>
              <FontAwesomeIcon icon="fa-solid fa-people-roof" bounce size='2xl'/>
              <h3 style={{marginLeft:'20px'}}>Groups: 5/10</h3>
            </Box>

            <Box sx={{
              width:'100%',
              height:'12vh',
              display:'flex',
              flexDirection:'row',
              alignItems:'center',
              justifyContent:'center',
              marginTop:'10px'
            }}>
              <FontAwesomeIcon icon="fa-solid fa-arrow-right-from-bracket" rotation={180} size='2xl'/>
              <h3 style={{marginLeft:'20px'}}>Logout</h3>
            </Box>
          </Box>
        </Container>

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
              userPosts.map(post => <Qpost key={post._id} post={post} />)
            ) : (
              <div>No questions posted yet.</div>
            )
          )}
          {activeButton === 'quiz' && (
            loading ? (
              <div>Loading quizzes...</div>
            ) : userQuizzes.length > 0 ? (
              userQuizzes.map(quiz => <Qzpost key={quiz._id} post={quiz} />)
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
