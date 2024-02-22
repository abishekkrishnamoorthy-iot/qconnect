import React from 'react'
import Dashnav from '../dash/Dashnav'
import QuizForm from '../quizform/Form'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Link } from 'react-router-dom'
import Quizpost from './Quizpost'

const Quizpage = ({cudetails,quizData,post }) => {
  const Posts = post.filter(p => p.date);

  Posts.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  console.log(quizData)
  console.log(Posts[0]?.createdBy)
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
        <Link to='/home/quizform' className='btn'>Create Quiz</Link>
      </div>
      {Posts.map(post=> <Quizpost key={post._id} post={post}  quizData={quizData}/>)}
    </div>
  )
}

export default Quizpage