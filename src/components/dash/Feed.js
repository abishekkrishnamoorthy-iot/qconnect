import React from 'react'
import Post from './Post'
import Defaultpost from './Defaultpost'

const Feed = ({id, qpost, cudetails}) => {
  return (
    <div>
      <Defaultpost cudetails={cudetails}/>
      {qpost.map(post => <Post key={post._id} post={post} postid={id} />)}
    </div>
  )
}

export default Feed
