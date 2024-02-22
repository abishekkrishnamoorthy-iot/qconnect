import React from 'react'
import Feed from './Feed'
import Dashnav from './Dashnav'

const Postpage = ({cudetails,setauth,id,qpost,setqpost}) => {
  return (
    <div className='postbox'>
      <Dashnav/>
      <Feed setauth={setauth}
            id={id}
            qpost={qpost}
            setqpost={setqpost}
            cudetails={cudetails}/>
    </div>
  )
}

export default Postpage