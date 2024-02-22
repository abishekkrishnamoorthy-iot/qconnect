import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React from 'react'
import Popup from 'reactjs-popup'
import Quiz from 'react-quiz-component';
const Quizpost = ({post ,quizData}) => {
  
  const LimitedParagraph = ({ text, limit }) => {
    // Check if text is defined
    if (!text) return null;
  
    // Split the text into words
    const words = text.split(' ');
  
    // Trim the array to the specified limit
    const trimmedWords = words.slice(0, limit);
  
    // Join the words back into a string
    const trimmedText = trimmedWords.join(' ');
  
    return <p className='desc'>{trimmedText}</p>;
  };

  const setQuizResult = (obj) => {
    console.log(obj);
    // YOUR LOGIC GOES HERE
  }


  return (
    
    <div className='quizpost'>
        <div className="userprofile">
        <div className="img">
          <FontAwesomeIcon icon="fa-solid fa-user" size='xl' className='user'/>
        </div>
        <div className="userdetials">
          <h5>{post?.createdBy.username}</h5>
          <h6>Qconnect user</h6>
        </div>
      </div>
      <div className="quizcon">
      <div className="conimg">
      </div>
       <div className="context">
        <h1>{post.quiz.quizTitle? post.quiz.quizTitle : "Title"}</h1>
        <div>
          <LimitedParagraph text={post.quiz.quizSynopsis?post.quiz.quizSynopsis:
       "Elon Musk is a prominent entrepreneur and business magnate known for his involvement in various innovative ventures.Born on June 28, 1971, in Pretoria, South Africa, Musk is the CEO and lead designer of SpaceX, CEO and product architect of Tesla, Inc., CEO of Neuralink, and founder of The Boring Company. He's also a co-founder of OpenAI and formerly served as chairman of SolarCity before it was acquired by Tesla."} limit={30} />
        </div>
        
        <Popup trigger={<button className='btn'>Quiz</button>} position={'top right'}>
            <div className='quizplay'>
                <Quiz quiz={post.quiz} shuffle={true} onComplete={setQuizResult}/>
            </div>      
        </Popup> 
        </div>
      </div>
    </div>
  )
}

export default Quizpost