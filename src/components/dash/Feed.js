import React from 'react'
import Post from './Post'
import Defaultpost from './Defaultpost'

const Feed = () => {
  const user =["abishek","king","abishek_krishnamoorthy","harrish","preethi","sahana","bharathi","raj"]
  return (
    <div >
      <Defaultpost/>
      {user.map(i=> <Post user={i}/>)}
    </div>
  )
}

export default Feed