import React from 'react'
import Grplist from './Grplist'
import Creategrp from './Creategrp'

const Grpmain = () => {
  return (
    <div className='grpbox'>
        <Creategrp/>
        <Grplist/>
    </div>
  )
}

export default Grpmain