import React, { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useAuth } from '../../context/AuthContext'
import { createGroup } from '../../services/db'

const Creategrp = ({ onGroupCreated }) => {
  const { currentUser, userData } = useAuth()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('general')
  const [privacy, setPrivacy] = useState('public')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!name.trim() || !description.trim()) {
      setError('Please fill in all required fields')
      return
    }

    if (name.length < 3) {
      setError('Group name must be at least 3 characters')
      return
    }

    setLoading(true)

    const result = await createGroup({
      name: name.trim(),
      description: description.trim(),
      category,
      privacy,
      creatorId: currentUser.uid
    })

    if (result.success) {
      setSuccess('Group created successfully!')
      setName('')
      setDescription('')
      setCategory('general')
      setPrivacy('public')
      if (onGroupCreated) {
        onGroupCreated()
      }
    } else {
      setError(result.error || 'Failed to create group')
    }

    setLoading(false)
  }

  return (
    <div className='defaultpost'>
      <div className="userprofile">
        <div className="img">
          <FontAwesomeIcon icon="fa-solid fa-user" size='xl' className='user'/>
        </div>
        <div className="userdetials">
          <h5>{userData?.username || 'User'}</h5>
          <h6>Create a new group</h6>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
        {error && <div style={{color: 'red', marginBottom: '10px'}}>{error}</div>}
        {success && <div style={{color: 'green', marginBottom: '10px'}}>{success}</div>}
        
        <div style={{ marginBottom: '15px' }}>
          <input
            type="text"
            placeholder="Group Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            required
            style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <textarea
            placeholder="Group Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
            required
            rows="3"
            style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Category: </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={loading}
            style={{ padding: '5px', marginLeft: '10px' }}
          >
            <option value="general">General</option>
            <option value="technology">Technology</option>
            <option value="science">Science</option>
            <option value="education">Education</option>
            <option value="programming">Programming</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Privacy: </label>
          <select
            value={privacy}
            onChange={(e) => setPrivacy(e.target.value)}
            disabled={loading}
            style={{ padding: '5px', marginLeft: '10px' }}
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </div>

        <button type="submit" disabled={loading} style={{ padding: '10px 20px' }}>
          {loading ? 'Creating...' : 'Create Group'}
        </button>
      </form>
    </div>
  )
}

export default Creategrp