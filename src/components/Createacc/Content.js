import React from 'react'
import Header from '../login/Header'

const Content = ({username,setusername,passcode,setpasscode,conpass,setconpass,email,setemail,handlesignup}) => {
  return (
    <div className='signuppanel'>
        <Header/>
         <form onSubmit={handlesignup}>
            <input type="text"
                    placeholder='Username'
                    value={username}
                    onChange={(e)=> setusername(e.target.value)} />
            <input type="email"
                    placeholder='Email'
                    value={email}
                    onChange={(e)=> setemail(e.target.value)} />
            <input type="password"
                    placeholder='create password'
                    value={passcode}
                    onChange={(e)=> setpasscode(e.target.value)} />
            <input type="text"
                    placeholder='confrim passcode'
                    value={conpass}
                    onChange={(e)=> setconpass(e.target.value)} />
             <button>Create account</button>
        </form>
    </div>
  )
}

export default Content