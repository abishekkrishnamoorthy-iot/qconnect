import React from 'react'
import Header from '../components/common/Header'
import Grouppanel from '../components/dash/Grouppanel'
import Postpage from '../components/dash/Postpage'
import '../style/group/grouppage.css'
import Grpmain from '../components/grouppage/Grpmain'
const Group = () => {
  return (
    <div className='grpdash'>
      <Header/>
      <div className='grpdashcon'>
       <Grpmain/>
      </div>
    </div>
    
  )
}

export default Group