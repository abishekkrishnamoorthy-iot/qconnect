import React from 'react'
import Grp from './Grp'

const Grplist = () => {
const user =["abishek","king","abishek_krishnamoorthy","harrish","preethi","sahana","bharathi","raj"]
  return (
    <div>
      {user.map(i=> <Grp user={i}/>)}
    </div>
  )
}

export default Grplist