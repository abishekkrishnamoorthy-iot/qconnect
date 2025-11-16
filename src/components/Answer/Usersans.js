import React from 'react'
import Ans from './Ans'

const Usersans = ({ postans }) => {
  if (!postans || postans.length === 0) {
    return (
      <div className='useranspanel'>
        <h3 className='relatedans'>RELATED ANSWERS</h3>
        <div className="answerspanel">
          <p>No answers yet. Be the first to answer!</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className='useranspanel'>
        <h3 className='relatedans'>RELATED ANSWERS</h3>
        <div className="answerspanel">
        {postans.map(ans => <Ans key={ans._id} ans={ans} />)}
        </div>
    </div>
  )
}

export default Usersans