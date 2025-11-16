import React from 'react'
import Feed from './Feed'
import Dashnav from './Dashnav'

const Postpage = ({cudetails, id, qpost, setqpost}) => {
  return (
    <div className='postbox'>
      <Dashnav/>
      <Feed id={id}
            qpost={qpost}
            setqpost={setqpost}
            cudetails={cudetails}/>
    </div>
  )
}

export default Postpage