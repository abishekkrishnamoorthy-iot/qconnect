import React, { useEffect, useState } from 'react'
import Header from '../components/common/Header'
import '../style/profile/profile.css'
import { Container,Box , Avatar, colors} from '@mui/material';
import Profileimg from './profile.jpeg';
import { Link , useLocation} from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Post from '../components/profilepage/Qzpost';
import Question from '../components/profilepage/Qzpost';
import Qpost from '../components/profilepage/Qpost';
import Qzpost from '../components/profilepage/Qzpost';
const Profilepage = ({qpost,cudetails,cupost,setcupost}) => {
   
   const [activeButton, setActiveButton] = useState('question');

   const handleButtonClick = (button) => {
     setActiveButton(button);
   };
   
  const accessToken = localStorage.getItem('accessToken'); // Get the access token from localStorage

  useEffect(() => {
    const fetchUserPosts = async () => {
      try {
        const response = await fetch(`http://localhost:3500/userpost/${cudetails._id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}` // Include the access token in the request headers
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch user posts');
        }
        const data = await response.json();
        setcupost(data);
      } catch (error) {
        console.error('Error fetching user posts:', error.message);
      }
    };

    fetchUserPosts();
  }, [cudetails._id, accessToken]);
  console.log(cupost)

  return (
    <div className='propage'>
     <Header/>
     <div className="propagecon">

     <Container maxWidth="sm" sx={{width:'50%', alignItems:'center'}}>
        <Box sx={{ display:'flex',flexDirection:'column',bgcolor: '#F9F0DB', height: '40vh' , marginTop:'20px', marginLeft:'20%', width:'60%', alignItems:'center', borderRadius:'20px'}} >
            <Avatar src={Profileimg}
                    sx={{
                       width:'50%',
                       height:'20vh',
                       alignSelf:'center',
                       marginTop:'30px'
                    }}/>
              <h3 style={{color:'#463804', marginBottom:'2px'}}>{cudetails.username}</h3>
              <h4 style={{marginTop:'0',opacity:'0.5'}}>Qconnect user</h4>
          </Box>
          <Box sx={{ bgcolor: '#F9F0DB', height: '40vh' , marginTop:'20px', marginLeft:'20%', width:'60%', alignSelf:'center'}} >
            <Box sx={
                {
                  width:'100%',
                  height:'12vh',
                  display:'flex',
                  flexDirection:'row',
                  alignItems:'center',
                  justifyContent:'center',
                  borderBottom:'2px solid gray',
                }              
            }>
              <FontAwesomeIcon icon="fa-solid fa-user-group" bounce  size='2xl'/>
              <h3 style={{marginLeft:'20px'}}>Followers: 30</h3>
            </Box>
            <Box sx={
                {
                  width:'100%',
                  height:'12vh',
                  display:'flex',
                  flexDirection:'row',
                  alignItems:'center',
                  justifyContent:'center',
                  borderBottom:'2px solid gray',
                }              
            }>
              <FontAwesomeIcon icon="fa-solid fa-people-roof" bounce size='2xl'/>
              <h3 style={{marginLeft:'20px'}}> Groups : 3/5</h3>
            </Box>

            <Box sx={
                {
                  width:'100%',
                  height:'12vh',
                  display:'flex',
                  flexDirection:'row',
                  alignItems:'center',
                  justifyContent:'center',
                  marginTop:'10px'
                }              
            }>
              <FontAwesomeIcon icon="fa-solid fa-arrow-right-from-bracket" rotation={180} size='2xl'/>
              <h3 style={{marginLeft:'20px'}}> Logout</h3>
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
        Question
      </button>
      <button
        className={activeButton === 'quiz' ? 'text active' : 'text'}
        onClick={() => handleButtonClick('quiz')}
      >
        Quiz
      </button>
      </ul>
    </div>
    {activeButton === 'question' && cupost.questionPosts?.map(post=> <Qpost key={post._id} post={post} />)}
    {activeButton ==='quiz' && cupost.quizPosts?.map(post=> <Qzpost key={post._id} post={post} />)}
    </div>
    </div>   
    </div>
  )
}

export default Profilepage