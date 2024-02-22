import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Header from '../components/common/Header'
import Question from '../components/Answer/Question'
import '../style/dash/ans.css'
import Usersans from '../components/Answer/Usersans'
const Qpost = ({setid,curpost,cudetails}) => {
    console.log(cudetails?._id)
    const {id}=useParams()
    setid(id)
    console.log(curpost.user)
    const [ans,setans]=useState([])
    useEffect(() => {
      const fetchPostans = async () => {
        try {
          const accessToken = localStorage.getItem('accessToken');
          const response = await fetch(`http://localhost:3500/answers/${id}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          });
          if (!response.ok) {
            throw new Error('Failed to fetch user details');
          }
          const Data = await response.json();
          setans(Data)
        } catch (error) {
           console.log(error.message);
        }
      };
      if(id?.length){
        fetchPostans();
      }
    }, []);
    console.log(ans)



  return (
    <div className='anspage'>
      <Header/>
      <div className="anspagecon">
        <Question post={curpost} id={id} userdetails={cudetails}/>
        <Usersans postans={ans} />
      </div>
    </div>
  )
}

export default Qpost