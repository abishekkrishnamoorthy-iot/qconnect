import React from 'react'
import Header from '../components/dash/Header'
import Grouppanel from '../components/dash/Grouppanel'
import Groups from '../components/dash/Groups'
import Post from '../components/dash/Post'
import Postpage from '../components/dash/Postpage'
import Addpost from '../components/dash/Addpost'
import Search from '../components/dash/Search'

const Dash = () => {
  return (
    <div className='dash'>
      <Header/>
      <Grouppanel/>
      <Groups/>
      <Search/>
      <Post/>
      <Postpage/>
      <Addpost/>
    </div>
  )
}

export default Dash