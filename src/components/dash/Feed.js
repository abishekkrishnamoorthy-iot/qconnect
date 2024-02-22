import React, { useEffect, useState } from 'react'
import Post from './Post'
import Defaultpost from './Defaultpost'

const Feed = ({id,qpost,setqpost,cudetails}) => {
 
  const accessToken = localStorage.getItem('accessToken');

  useEffect(() => {
    // Fetch question posts from the server
    const fetchQuestionPosts = async () => {
      try {
        const response = await fetch('http://localhost:3500/qpost', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch question posts');
        }
        const data = await response.json();
        setqpost(data);
      } catch (error) {
        console.error('Error fetching question posts:', error.message);
      }
    };

    if (accessToken) {
      fetchQuestionPosts();
      // Call fetchUsers initially
  
    // Set up an interval to fetch data every minute
    const intervalId = setInterval(fetchQuestionPosts, 6000); // 60000 milliseconds = 1 minute
  
    // Clean-up function to clear the interval when the component unmounts or when user changes
    return () => clearInterval(intervalId);
    }
  }, [accessToken]);
  console.log(qpost)
  
  return (
    <div >
      <Defaultpost cudetails={cudetails}/>
      {qpost.map(post=> <Post key={post._id} post={post} postid={id} />)}
    </div>
  )
}

export default Feed