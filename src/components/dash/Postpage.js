import React from 'react'
import { useLocation } from 'react-router-dom'
import Feed from './Feed'
import AllFeed from './AllFeed'
import Dashnav from './Dashnav'

const Postpage = ({cudetails, id, qpost, setqpost}) => {
  const location = useLocation()
  const path = location.pathname

  return (
    <div className='postbox'>
      <Dashnav/>
      {path === '/home/all' ? (
        <AllFeed 
          id={id}
          qpost={qpost}
          setqpost={setqpost}
          cudetails={cudetails}
        />
      ) : (
        <Feed 
          id={id}
          qpost={qpost}
          setqpost={setqpost}
          cudetails={cudetails}
        />
      )}
    </div>
  )
}

export default Postpage