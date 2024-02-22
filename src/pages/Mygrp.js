import React from 'react'
import Header from '../components/common/Header'
import '../style/group/mygrp.css'
import Grpnav from '../components/grouppage/Grpnav'
const Mygrp = () => {
  return (
    <div className='mygrp'>
        <Header/>
        <div className="mygrpcon">
            <div className="grpbox">
                <Grpnav/>
            </div>
        </div>

    </div>
  )
}

export default Mygrp