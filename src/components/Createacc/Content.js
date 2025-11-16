import React from 'react'
import Header from '../login/Header'

const Content = ({username,setusername,passcode,setpasscode,conpass,setconpass,email,setemail,handlesignup,error,loading}) => {
  return (
    <div className='signuppanel'>
        <Header/>
         <form onSubmit={handlesignup}>
            {error && <div style={{color: 'red', marginBottom: '10px'}}>{error}</div>}
            <input type="text"
                    placeholder='Username'
                    value={username}
                    onChange={(e)=> setusername(e.target.value)}
                    disabled={loading}
                    required />
            <input type="email"
                    placeholder='Email'
                    value={email}
                    onChange={(e)=> setemail(e.target.value)}
                    disabled={loading}
                    required />
            <input type="password"
                    placeholder='create password'
                    value={passcode}
                    onChange={(e)=> setpasscode(e.target.value)}
                    disabled={loading}
                    required />
            <input type="password"
                    placeholder='confirm passcode'
                    value={conpass}
                    onChange={(e)=> setconpass(e.target.value)}
                    disabled={loading}
                    required />
             <button type="submit" disabled={loading}>
               {loading ? 'Creating account...' : 'Create account'}
             </button>
        </form>
    </div>
  )
}

export default Content