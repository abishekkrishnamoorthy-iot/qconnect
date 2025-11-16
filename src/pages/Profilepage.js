import React, { useState } from 'react'
import Header from '../components/common/Header'
import '../style/profile/profile.css'
import { Container, Box, Avatar } from '@mui/material';
import Profileimg from './profile.jpeg';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Qpost from '../components/profilepage/Qpost';
import Qzpost from '../components/profilepage/Qzpost';

const Profilepage = ({cudetails, cupost}) => {
  const [activeButton, setActiveButton] = useState('question');

  const handleButtonClick = (button) => {
    setActiveButton(button);
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
              <h3 style={{marginLeft:'20px'}}>Followers: 324</h3>
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
            </ul>
          </div>
          {activeButton === 'question' && cupost.questionPosts?.map(post => <Qpost key={post._id} post={post} />)}
          {activeButton === 'quiz' && cupost.quizPosts?.map(post => <Qzpost key={post._id} post={post} />)}
        </div>
      </div>
    </div>
  )
}

export default Profilepage
