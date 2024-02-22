import React from 'react'

import Ans from './Ans'

const Usersans = ({postans}) => {
  
  return (
    <div className='useranspanel'>
        <h3 className='relatedans'>RELATED ANSWER</h3>
        <div className="answerspanel">
        {postans?.map(ans=> <Ans key={ans._id} ans={ans} />)}
        </div>
    </div>
  )
}

export default Usersans