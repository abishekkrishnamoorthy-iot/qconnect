import React, { useState, useEffect, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { searchGroups, searchUsers, getGroup } from '../../services/db'
import GroupJoinModal from './GroupJoinModal'

const Search = () => {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [groups, setGroups] = useState([])
  const [users, setUsers] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState(null)
  const wrapperRef = useRef(null)
  const searchTimeoutRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // If query is empty, clear results
    if (!query.trim()) {
      setGroups([])
      setUsers([])
      setIsOpen(false)
      return
    }

    // Debounce search
    setLoading(true)
    setIsOpen(true)

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const [groupsResult, usersResult] = await Promise.all([
          searchGroups(query, 10),
          searchUsers(query, 10)
        ])

        if (groupsResult.success) {
          setGroups(groupsResult.data)
        }
        if (usersResult.success) {
          setUsers(usersResult.data)
        }
      } catch (error) {
        console.error('Error searching:', error)
      } finally {
        setLoading(false)
      }
    }, 400)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [query])

  const handleGroupClick = async (group) => {
    if (!currentUser) {
      navigate('/login')
      return
    }

    // Check if user is a member
    try {
      const groupResult = await getGroup(group._id)
      if (groupResult.success) {
        const members = groupResult.data.members || {}
        const isMember = !!members[currentUser.uid]

        if (isMember) {
          // Navigate to group page
          setIsOpen(false)
          setQuery('')
          navigate(`/group/${group._id}`)
        } else {
          // Show join modal
          setSelectedGroup(groupResult.data)
          setIsOpen(false)
        }
      }
    } catch (error) {
      console.error('Error checking group membership:', error)
      // If error, just show modal anyway
      setSelectedGroup(group)
      setIsOpen(false)
    }
  }

  const handleUserClick = (user) => {
    setIsOpen(false)
    setQuery('')
    // Navigate to profile - for now just use /profile since there's no user ID route
    // TODO: Update when user profile route with ID is available
    navigate('/profile')
  }

  const handleJoinSuccess = () => {
    setSelectedGroup(null)
  }

  const hasResults = groups.length > 0 || users.length > 0

  return (
    <>
      {isOpen && query.trim() && <div className="search-dropdown-overlay" onClick={() => setIsOpen(false)} />}
      <div className="search" ref={wrapperRef}>
        <form onSubmit={(e) => e.preventDefault()} className="search-form">
          <div className="search-input-wrapper">
            <FontAwesomeIcon icon="fa-solid fa-magnifying-glass" className="search-icon" />
            <input
              type="text"
              placeholder="Search groups, users..."
              id="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                if (query.trim() && (groups.length > 0 || users.length > 0)) {
                  setIsOpen(true)
                }
              }}
              className="search-input"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('')
                  setIsOpen(false)
                }}
                className="search-clear-btn"
                aria-label="Clear search"
              >
                <FontAwesomeIcon icon="fa-solid fa-times" />
              </button>
            )}
          </div>
        </form>

        {isOpen && query.trim() && (
          <div className="search-dropdown-card">
            {loading ? (
              <div className="search-dropdown-loading">
                <FontAwesomeIcon icon="fa-solid fa-spinner" spin />
                <span>Searching...</span>
              </div>
            ) : !hasResults ? (
              <div className="search-dropdown-empty">
                <p>No results found</p>
              </div>
            ) : (
              <>
                {groups.length > 0 && (
                  <div className="search-dropdown-section">
                    <div className="search-dropdown-section-header">Groups</div>
                    <div className="search-dropdown-items">
                      {groups.map((group) => (
                        <div
                          key={group._id}
                          className="search-dropdown-item search-dropdown-group-item"
                          onClick={() => handleGroupClick(group)}
                        >
                          <div className="search-dropdown-item-icon">
                            {group.icon || group.profileUrl ? (
                              <img
                                src={group.icon || group.profileUrl}
                                alt={group.name}
                                onError={(e) => {
                                  e.target.style.display = 'none'
                                }}
                              />
                            ) : (
                              <FontAwesomeIcon icon="fa-solid fa-users" />
                            )}
                          </div>
                          <div className="search-dropdown-item-info">
                            <h4>{group.name || 'Unnamed Group'}</h4>
                            <p>{group.description || 'No description'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {users.length > 0 && (
                  <div className="search-dropdown-section">
                    <div className="search-dropdown-section-header">Users</div>
                    <div className="search-dropdown-items">
                      {users.map((user) => (
                        <div
                          key={user.uid}
                          className="search-dropdown-item search-dropdown-user-item"
                          onClick={() => handleUserClick(user)}
                        >
                          <div className="search-dropdown-item-icon">
                            {user.profile?.profilePic || user.profilePic ? (
                              <img
                                src={user.profile?.profilePic || user.profilePic}
                                alt={user.profile?.username || user.username || 'User'}
                                onError={(e) => {
                                  e.target.style.display = 'none'
                                }}
                              />
                            ) : (
                              <FontAwesomeIcon icon="fa-solid fa-user" />
                            )}
                          </div>
                          <div className="search-dropdown-item-info">
                            <h4>{user.profile?.username || user.username || 'Unknown User'}</h4>
                            <p>{user.email || ''}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {selectedGroup && (
        <GroupJoinModal
          group={selectedGroup}
          onClose={() => setSelectedGroup(null)}
          onJoinSuccess={handleJoinSuccess}
        />
      )}
    </>
  )
}

export default Search
