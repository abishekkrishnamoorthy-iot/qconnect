import React from 'react'
import Header from '../components/common/Header'
import Grouppanel from '../components/dash/Grouppanel'
import TrendingGroups from '../components/dash/TrendingGroups'
import Postpage from '../components/dash/Postpage'

const Dash = ({setid, qpost, setqpost, cudetails}) => {
  return (
    <div className='dash'>
      <Header/>
      <div className='dashcon'>
        <div className="dashcon-left">
          <TrendingGroups/>
          <Grouppanel/>
        </div>
        <Postpage setid={setid}
                  qpost={qpost}
                  setqpost={setqpost}
                  cudetails={cudetails}/>
      </div>
    </div>
  )
}

export default Dash