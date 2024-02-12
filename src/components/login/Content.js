import React from 'react'
import Header from './Header'

const Content = ({handlelogin,username,setusername,passcode,setpasscode,auth}) => {
  const wrong = {
    backgroundColor: 'red',
  }
  const nothing = {
    backgroundColor: 'rgba(0,0,0,0)',
  }
  return (
    <div className='loginpanel'>
        <Header />
        <form onSubmit={handlelogin}>
             <input 
                    type="text"
                    placeholder='Username'
                    value={username}
                    onChange={(e)=> setusername(e.target.value)
                    } />
             <input type="password"
                    placeholder='password'
                    value={passcode}
                    onChange={(e)=> setpasscode(e.target.value)} />
             <button style={auth?wrong:nothing}>Login</button>
        </form>
    </div>
  )
}

export default Content