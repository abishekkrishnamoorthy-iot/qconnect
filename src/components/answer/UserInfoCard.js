import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAuth } from '../../context/AuthContext';
import { followUser, unfollowUser, isFollowing } from '../../services/db';
import '../../style/dash/ans.css';

const defaultStats = {
  followers: 0,
  questions: 0,
  groups: 0,
};

const UserInfoCard = ({ authorUid, authorProfile, stats = defaultStats, loading }) => {
  const { currentUser } = useAuth();
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const navigate = useNavigate();

  const canFollow =
    currentUser && authorUid && currentUser.uid !== authorUid;

  useEffect(() => {
    let isMounted = true;
    const checkFollowStatus = async () => {
      if (!canFollow) return;
      const result = await isFollowing(currentUser.uid, authorUid);
      if (result.success && isMounted) {
        setFollowing(result.isFollowing);
      }
    };
    checkFollowStatus();
    return () => {
      isMounted = false;
    };
  }, [authorUid, canFollow, currentUser]);

  const handleFollowToggle = async () => {
    if (!canFollow) return;
    setFollowLoading(true);

    if (following) {
      const result = await unfollowUser(currentUser.uid, authorUid);
      if (result.success) {
        setFollowing(false);
      }
    } else {
      const result = await followUser(currentUser.uid, authorUid);
      if (result.success) {
        setFollowing(true);
      }
    }

    setFollowLoading(false);
  };

  const username =
    authorProfile?.profile?.username ||
    authorProfile?.username ||
    'Qconnect user';
  const profilePic = authorProfile?.profile?.profilePic || authorProfile?.photoURL;
  const subtitle =
    authorProfile?.profile?.bio ||
    authorProfile?.profile?.role ||
    'Qconnect user';

  return (
    <aside className="answer-user-card">
      {loading ? (
        <div className="answer-user-loading">Loading author...</div>
      ) : (
        <>
          <div className="answer-user-avatar">
            {profilePic ? (
              <img src={profilePic} alt={username} />
            ) : (
              <FontAwesomeIcon icon="fa-solid fa-user" />
            )}
          </div>
          <h3>{username}</h3>
          <p className="answer-user-subtitle">{subtitle}</p>

          <div className="answer-user-stats">
            <div>
              <span>{stats.followers ?? 0}</span>
              <small>Followers</small>
            </div>
            <div>
              <span>{stats.questions ?? 0}</span>
              <small>Questions</small>
            </div>
            <div>
              <span>{stats.groups ?? 0}</span>
              <small>Groups</small>
            </div>
          </div>

          <div className="answer-user-actions">
            <button
              className="primary"
              onClick={() => navigate(`/profile/${authorUid}`)}
            >
              View Profile
            </button>
            {canFollow && (
              <button
                className="secondary"
                onClick={handleFollowToggle}
                disabled={followLoading}
              >
                {followLoading ? '...' : following ? 'Unfollow' : 'Follow'}
              </button>
            )}
          </div>
        </>
      )}
    </aside>
  );
};

export default UserInfoCard;

