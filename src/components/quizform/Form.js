import React, { useState } from 'react';
import '../../style/quiz/quizform.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useNavigate } from 'react-router-dom';
const Form = ({setQuizData,quizData,cudetails,setquizpost}) => {
  const navigate = useNavigate();
  console.log(cudetails?._id)
  const handleInputChange = (e, questionIndex) => {
    const { name, value } = e.target;
    const updatedQuestions = [...quizData.questions];
    updatedQuestions[questionIndex][name] = value;
    setQuizData({ ...quizData, questions: updatedQuestions });
  };
  const handleAnswerChange = (e, questionIndex, answerIndex) => {
    const { value } = e.target;
    const updatedQuestions = [...quizData.questions];
    updatedQuestions[questionIndex].answers[answerIndex] = value;
    setQuizData({ ...quizData, questions: updatedQuestions });
  };
  
  const handleAddQuestion = () => {
    setQuizData({
      ...quizData,
      questions: [
        ...quizData.questions,
        {
          question: '',
          questionType: '',
          answers: [''],
          correctAnswer: '',
          messageForCorrectAnswer: '',
          messageForIncorrectAnswer: '',
          explanation: '',
          point: '',
        },
      ],
    });
  };

  const handleAddAnswer = (questionIndex) => {
    const updatedQuestions = [...quizData.questions];
    updatedQuestions[questionIndex].answers.push('');
    setQuizData({ ...quizData, questions: updatedQuestions });
  };
  
  const handleRemoveAnswer = (questionIndex, answerIndex) => {
    const updatedQuestions = [...quizData.questions];
    updatedQuestions[questionIndex].answers.splice(answerIndex, 1);
    setQuizData({ ...quizData, questions: updatedQuestions });
  };
  

  const handleRemoveQuestion = (questionIndex) => {
    const updatedQuestions = [...quizData.questions];
    updatedQuestions.splice(questionIndex, 1);
    setQuizData({ ...quizData, questions: updatedQuestions });
  };

 

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      // Get access token from localStorage
      const accessToken = localStorage.getItem('accessToken');
  
      if (!accessToken) {
        throw new Error('Access token not found in localStorage');
      }
  
      // Make POST request with access token in headers
      const response = await fetch('http://localhost:3500/quizpost', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`, // Include access token in Authorization header
        },
        body: JSON.stringify({
          id: cudetails._id,
          quiz: quizData,
        }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to post quiz data');
      }
  
      const data = await response.json();
      console.log('Quiz data posted successfully:', data);

      try {
        // Get access token from local storage
        const accessToken = localStorage.getItem('accessToken');
        const response = await fetch('http://localhost:3500/quizpost', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch quiz posts');
        }

        const data = await response.json();
        console.log('Quiz posts:', data);
        // Update state with fetched quiz post data
         setquizpost(data);
      } catch (error) {
        console.error('Error fetching quiz posts:', error.message);
      }













      navigate('/home/quiz');

    } catch (error) {
      console.error('Error posting quiz data:', error.message);
    }
  };
  

  return (
      <div className="form">
      <h2>Create Quiz</h2>
      <form onSubmit={handleSubmit}>
        <div className='quiztitle'>
          <input required
            placeholder='Quiz Title'
            type="text"
            value={quizData.quizTitle}
            onChange={(e) => setQuizData({ ...quizData, quizTitle: e.target.value })}
          />
        </div>
        <div className='des'>
          <label></label>
          <textarea
            className='textarea'
            placeholder='Quiz Synopsis:'
            value={quizData.quizSynopsis}
            onChange={(e) => setQuizData({ ...quizData, quizSynopsis: e.target.value })}
          ></textarea>
        </div>
        <div className='creqesbtn'>
          <button type="button" onClick={handleAddQuestion}>
             Create Question
          </button>
        </div>
        {quizData.questions.map((question, index) => (
          <div key={index} className='ques'>
            <h3>Question {index + 1}</h3>
            <div className='qinput'>
              <input required
                placeholder={`question ${index+1}`}
                type="text"
                value={question.question}
                onChange={(e) => handleInputChange(e, index)}
                name="question"
              />
            </div>
            <div className='selecttype'>
              <select
                value={question.questionType}
                onChange={(e) => handleInputChange(e, index)}
                name="questionType"
              >
                <option value="">Select Question Type</option>
                <option value="text">Text</option>
                <option value="image">Image</option>
              </select>
            </div>
            <div className='ans'>
                            {question.answers.map((answer, answerIndex) => (
                <div key={answerIndex} className='choice'>
                  <input required
                  placeholder={`Answer ${answerIndex+1}`}
  type="text"
  value={question.answers[answerIndex]}
  onChange={(e) => handleAnswerChange(e, index, answerIndex)}
  name={`answer-${answerIndex}`}
/>

                  <button type="button" className='clans'onClick={() => handleRemoveAnswer(index, answerIndex)}>
                  <FontAwesomeIcon icon="fa-solid fa-minus" beat size='xl'/>
                  </button>
                </div>
              ))}
              <button type="button" className='adans'onClick={() => handleAddAnswer(index)}>
                Add Answer
              </button>
            </div>
            <div className='crctans'>
              <select
                value={question.correctAnswer}
                onChange={(e) => handleInputChange(e, index)}
                name="correctAnswer"
              >
                <option value="">Select Correct Answer</option>
                {question.answers.map((_, i) => (
                  <option key={i} value={i+1}>
                    Answer {i + 1}
                  </option>
                ))}
              </select>
            </div>
            <div className='msgcrct'>
              <input required
               placeholder='Message for Correct Answer'
                type="text"
                value={question.messageForCorrectAnswer}
                onChange={(e) => handleInputChange(e, index)}
                name="messageForCorrectAnswer"
              />
            </div>
            <div className='msgincrct'>
              <input required
               placeholder='Message for Incorrect Answer:'
                type="text"
                value={question.messageForIncorrectAnswer}
                onChange={(e) => handleInputChange(e, index)}
                name="messageForIncorrectAnswer"
              />
            </div>
            <div className='expl'>
              <input required
              placeholder='Explanation'
                type="text"
                value={question.explanation}
                onChange={(e) => handleInputChange(e, index)}
                name="explanation"
              />
            </div>
            <div className='points'>
              <input required
                placeholder='Points'
                type="number"
                value={question.point}
                onChange={(e) => handleInputChange(e, index)}
                name="point"
              />
            </div>
            <button  className="removeques"type="button" onClick={() => handleRemoveQuestion(index)}>
             Remove Question           
             </button>
          </div>
        ))}
         <div className='addqesbtn'>
          <button type="button" onClick={handleAddQuestion} className='addq'>
           Add question<FontAwesomeIcon icon="fa-solid fa-plus" shake size="2xl" />
          </button>
        </div>
        <button type="submit" className='submit'>Submit Quiz</button>
      </form>
     
    </div>
  );
};

export default Form;
