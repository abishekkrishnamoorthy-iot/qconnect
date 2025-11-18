import React, { useState, useEffect } from 'react';
import Grp from './Grp';
import { getGroups } from '../../services/db';

const Grplist = ({ refreshTrigger }) => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [privacy, setPrivacy] = useState('All');

  useEffect(() => {
    loadGroups();
  }, [refreshTrigger]);

  const loadGroups = async () => {
    setLoading(true);
    setError('');

    const result = await getGroups();

    if (result.success) {
      setGroups(result.data);
    } else {
      setError(result.error || 'Failed to load groups');
    }

    setLoading(false);
  };

  const filteredGroups = groups
    .filter((group) =>
      group.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter((group) => category === 'All' || group.category === category)
    .filter((group) => privacy === 'All' || group.privacy === privacy);

  if (loading) {
    return <div>Loading groups...</div>;
  }

  if (error) {
    // Hide database errors from user
    return <div>Failed to load groups. Please try again later.</div>;
  }

  return (
    <div className="groups-panel">
      <div className="filter-container">
        <input
          type="text"
          placeholder="Search groups..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="group-search-input"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="filter-dropdown"
        >
          <option value="All">All Categories</option>
          <option value="general">General</option>
          <option value="education">Education</option>
          <option value="technology">Technology</option>
          <option value="entertainment">Entertainment</option>
          <option value="other">Other</option>
        </select>
        <select
          value={privacy}
          onChange={(e) => setPrivacy(e.target.value)}
          className="filter-dropdown"
        >
          <option value="All">All Privacy</option>
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>
      </div>
      <div className="explore-groups-grid">
        {filteredGroups.length === 0 ? (
          <div className="no-groups-found">
            No groups found. Try adjusting your search or filters.
          </div>
        ) : (
          filteredGroups.map((group) => (
            <Grp key={group._id} group={group} onJoin={loadGroups} />
          ))
        )}
      </div>
    </div>
  );
};

export default Grplist;