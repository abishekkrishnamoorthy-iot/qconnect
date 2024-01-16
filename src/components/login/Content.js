import React from 'react'
import Header from './Header'

const Content = ({handlelogin,username,setusername,passcode,setpasscode}) => {
  return (
    <div className='loginpanel'>
        <Header />
        <form onSubmit={handlelogin}>
             <input type="text"
                    placeholder='Username'
                    value={username}
                    onChange={(e)=> setusername(e.target.value)} />
             <input type="password"
                    placeholder='password'
                    value={passcode}
                    onChange={(e)=> setpasscode(e.target.value)} />
             <button>Login</button>
        </form>
    </div>
  )
}

export default Content