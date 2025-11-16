import { 
  ref, 
  set, 
  get, 
  push, 
  remove, 
  update, 
  query, 
  orderByChild, 
  equalTo, 
  onValue, 
  off
} from 'firebase/database';
import { database } from '../firebase/config';

// ========== USER FUNCTIONS ==========

/**
 * Create a new user in the database
 * @param {string} uid - User ID from Firebase Auth
 * @param {object} userData - User data object
 */
export const createUser = async (uid, userData) => {
  try {
    const userRef = ref(database, `users/${uid}`);
    await set(userRef, {
      ...userData,
      uid,
      createdAt: new Date().toISOString(),
      followerCount: 0,
      followingCount: 0
    });
    return { success: true };
  } catch (error) {
    console.error('Error creating user:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get user data by UID
 * @param {string} uid - User ID
 */
export const getUser = async (uid) => {
  try {
    const userRef = ref(database, `users/${uid}`);
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      return { success: true, data: snapshot.val() };
    }
    return { success: false, error: 'User not found' };
  } catch (error) {
    console.error('Error getting user:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update user data
 * @param {string} uid - User ID
 * @param {object} updates - Object with fields to update
 */
export const updateUser = async (uid, updates) => {
  try {
    const userRef = ref(database, `users/${uid}`);
    await update(userRef, updates);
    return { success: true };
  } catch (error) {
    console.error('Error updating user:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get user by username
 * @param {string} username - Username to search for
 */
export const getUserByUsername = async (username) => {
  try {
    const usersRef = ref(database, 'users');
    const snapshot = await get(usersRef);
    
    if (snapshot.exists()) {
      const users = snapshot.val();
      const foundUser = Object.values(users).find(
        user => user.username === username
      );
      
      if (foundUser) {
        return { success: true, data: foundUser };
      }
    }
    
    return { success: false, error: 'User not found' };
  } catch (error) {
    console.error('Error getting user by username:', error);
    return { success: false, error: error.message };
  }
};

// ========== POST FUNCTIONS ==========

/**
 * Create a new post
 * @param {object} postData - Post data object
 */
export const createPost = async (postData) => {
  try {
    const postsRef = ref(database, 'posts');
    const newPostRef = push(postsRef);
    
    const post = {
      ...postData,
      _id: newPostRef.key,
      createdAt: new Date().toISOString(),
      likes: {},
      views: 0,
      answers: {}
    };
    
    await set(newPostRef, post);
    return { success: true, postId: newPostRef.key, data: post };
  } catch (error) {
    console.error('Error creating post:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all posts with optional filters
 * @param {object} filters - Optional filters (groupId, userId)
 */
export const getPosts = async (filters = {}) => {
  try {
    let postsRef = ref(database, 'posts');
    
    // Apply filters
    if (filters.groupId) {
      postsRef = query(postsRef, orderByChild('groupId'), equalTo(filters.groupId));
    } else if (filters.userId) {
      postsRef = query(postsRef, orderByChild('userId'), equalTo(filters.userId));
    } else {
      postsRef = query(postsRef, orderByChild('createdAt'));
    }
    
    const snapshot = await get(postsRef);
    
    if (snapshot.exists()) {
      const posts = snapshot.val();
      // Convert to array and sort by createdAt (newest first)
      const postsArray = Object.values(posts).sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      return { success: true, data: postsArray };
    }
    
    return { success: true, data: [] };
  } catch (error) {
    console.error('Error getting posts:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get a single post by ID
 * @param {string} postId - Post ID
 */
export const getPost = async (postId) => {
  try {
    const postRef = ref(database, `posts/${postId}`);
    const snapshot = await get(postRef);
    
    if (snapshot.exists()) {
      return { success: true, data: snapshot.val() };
    }
    
    return { success: false, error: 'Post not found' };
  } catch (error) {
    console.error('Error getting post:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete a post
 * @param {string} postId - Post ID
 */
export const deletePost = async (postId) => {
  try {
    const postRef = ref(database, `posts/${postId}`);
    await remove(postRef);
    
    // Also delete all answers for this post
    const answersRef = ref(database, `answers`);
    const answersSnapshot = await get(answersRef);
    if (answersSnapshot.exists()) {
      const answers = answersSnapshot.val();
      const updates = {};
      Object.keys(answers).forEach(answerId => {
        if (answers[answerId].postId === postId) {
          updates[`answers/${answerId}`] = null;
        }
      });
      if (Object.keys(updates).length > 0) {
        await update(ref(database), updates);
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting post:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Subscribe to posts with real-time updates
 * @param {function} callback - Callback function to receive posts
 * @param {object} filters - Optional filters
 */
export const subscribeToPosts = (callback, filters = {}) => {
  let postsRef = ref(database, 'posts');
  
  if (filters.groupId) {
    postsRef = query(postsRef, orderByChild('groupId'), equalTo(filters.groupId));
  } else if (filters.userId) {
    postsRef = query(postsRef, orderByChild('userId'), equalTo(filters.userId));
  } else {
    postsRef = query(postsRef, orderByChild('createdAt'));
  }
  
  onValue(postsRef, (snapshot) => {
    if (snapshot.exists()) {
      const posts = snapshot.val();
      const postsArray = Object.values(posts).sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      callback(postsArray);
    } else {
      callback([]);
    }
  });
  
  return () => off(postsRef);
};

// ========== GROUP FUNCTIONS ==========

/**
 * Create a new group
 * @param {object} groupData - Group data object
 */
export const createGroup = async (groupData) => {
  try {
    const groupsRef = ref(database, 'groups');
    const newGroupRef = push(groupsRef);
    
    const group = {
      ...groupData,
      _id: newGroupRef.key,
      createdAt: new Date().toISOString(),
      members: {
        [groupData.creatorId]: {
          role: 'admin',
          joinedAt: new Date().toISOString()
        }
      }
    };
    
    await set(newGroupRef, group);
    return { success: true, groupId: newGroupRef.key, data: group };
  } catch (error) {
    console.error('Error creating group:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all groups with optional filters
 * @param {object} filters - Optional filters (privacy, category)
 */
export const getGroups = async (filters = {}) => {
  try {
    let groupsRef = ref(database, 'groups');
    
    if (filters.privacy) {
      groupsRef = query(groupsRef, orderByChild('privacy'), equalTo(filters.privacy));
    }
    
    const snapshot = await get(groupsRef);
    
    if (snapshot.exists()) {
      const groups = snapshot.val();
      const groupsArray = Object.values(groups).sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      return { success: true, data: groupsArray };
    }
    
    return { success: true, data: [] };
  } catch (error) {
    console.error('Error getting groups:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get a single group by ID
 * @param {string} groupId - Group ID
 */
export const getGroup = async (groupId) => {
  try {
    const groupRef = ref(database, `groups/${groupId}`);
    const snapshot = await get(groupRef);
    
    if (snapshot.exists()) {
      return { success: true, data: snapshot.val() };
    }
    
    return { success: false, error: 'Group not found' };
  } catch (error) {
    console.error('Error getting group:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Join a group
 * @param {string} groupId - Group ID
 * @param {string} uid - User ID
 */
export const joinGroup = async (groupId, uid) => {
  try {
    const groupRef = ref(database, `groups/${groupId}/members/${uid}`);
    await set(groupRef, {
      role: 'member',
      joinedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error('Error joining group:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Leave a group
 * @param {string} groupId - Group ID
 * @param {string} uid - User ID
 */
export const leaveGroup = async (groupId, uid) => {
  try {
    const memberRef = ref(database, `groups/${groupId}/members/${uid}`);
    await remove(memberRef);
    return { success: true };
  } catch (error) {
    console.error('Error leaving group:', error);
    return { success: false, error: error.message };
  }
};

// ========== ANSWER FUNCTIONS ==========

/**
 * Create an answer to a post
 * @param {object} answerData - Answer data object
 */
export const createAnswer = async (answerData) => {
  try {
    const answersRef = ref(database, 'answers');
    const newAnswerRef = push(answersRef);
    
    const answer = {
      ...answerData,
      _id: newAnswerRef.key,
      createdAt: new Date().toISOString()
    };
    
    await set(newAnswerRef, answer);
    
    // Also add to post's answers
    const postAnswerRef = ref(database, `posts/${answerData.postId}/answers/${newAnswerRef.key}`);
    await set(postAnswerRef, answer);
    
    return { success: true, answerId: newAnswerRef.key, data: answer };
  } catch (error) {
    console.error('Error creating answer:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get answers for a post
 * @param {string} postId - Post ID
 */
export const getAnswers = async (postId) => {
  try {
    const answersRef = ref(database, `posts/${postId}/answers`);
    const snapshot = await get(answersRef);
    
    if (snapshot.exists()) {
      const answers = snapshot.val();
      const answersArray = Object.values(answers).sort((a, b) => 
        new Date(a.createdAt) - new Date(b.createdAt)
      );
      return { success: true, data: answersArray };
    }
    
    return { success: true, data: [] };
  } catch (error) {
    console.error('Error getting answers:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Subscribe to answers for a post with real-time updates
 * @param {string} postId - Post ID
 * @param {function} callback - Callback function to receive answers
 */
export const subscribeToAnswers = (postId, callback) => {
  const answersRef = ref(database, `posts/${postId}/answers`);
  
  onValue(answersRef, (snapshot) => {
    if (snapshot.exists()) {
      const answers = snapshot.val();
      const answersArray = Object.values(answers).sort((a, b) => 
        new Date(a.createdAt) - new Date(b.createdAt)
      );
      callback(answersArray);
    } else {
      callback([]);
    }
  });
  
  return () => off(answersRef);
};

// ========== FOLLOW FUNCTIONS ==========

/**
 * Follow a user
 * @param {string} followerId - User ID of the follower
 * @param {string} followingId - User ID of the user being followed
 */
export const followUser = async (followerId, followingId) => {
  try {
    // Check if already following
    const followRef = ref(database, `follows/${followerId}/${followingId}`);
    const snapshot = await get(followRef);
    
    if (snapshot.exists()) {
      return { success: true }; // Already following
    }

    // Create follow relationship
    await set(followRef, true);
    
    // Get follower username for notification
    const followerUserRef = ref(database, `users/${followerId}`);
    const followerUserSnapshot = await get(followerUserRef);
    const followerUsername = followerUserSnapshot.exists() 
      ? followerUserSnapshot.val().username 
      : 'Someone';
    
    // Update follower count for the user being followed
    const followingUserRef = ref(database, `users/${followingId}`);
    const followingUserSnapshot = await get(followingUserRef);
    if (followingUserSnapshot.exists()) {
      const currentCount = followingUserSnapshot.val().followerCount || 0;
      await update(followingUserRef, { followerCount: currentCount + 1 });
    }
    
    // Update following count for the follower
    if (followerUserSnapshot.exists()) {
      const currentCount = followerUserSnapshot.val().followingCount || 0;
      await update(followerUserRef, { followingCount: currentCount + 1 });
    }
    
    // Create notification for the user being followed
    await createNotification(followingId, {
      type: 'follow',
      fromUserId: followerId,
      fromUsername: followerUsername,
      message: `${followerUsername} started following you`
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error following user:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Unfollow a user
 * @param {string} followerId - User ID of the follower
 * @param {string} followingId - User ID of the user being unfollowed
 */
export const unfollowUser = async (followerId, followingId) => {
  try {
    const followRef = ref(database, `follows/${followerId}/${followingId}`);
    await remove(followRef);
    
    // Update follower count for the user being unfollowed
    const followingUserRef = ref(database, `users/${followingId}`);
    const followingUserSnapshot = await get(followingUserRef);
    if (followingUserSnapshot.exists()) {
      const currentCount = followingUserSnapshot.val().followerCount || 0;
      await update(followingUserRef, { followerCount: Math.max(0, currentCount - 1) });
    }
    
    // Update following count for the unfollower
    const followerUserRef = ref(database, `users/${followerId}`);
    const followerUserSnapshot = await get(followerUserRef);
    if (followerUserSnapshot.exists()) {
      const currentCount = followerUserSnapshot.val().followingCount || 0;
      await update(followerUserRef, { followingCount: Math.max(0, currentCount - 1) });
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error unfollowing user:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if a user is following another user
 * @param {string} followerId - User ID of the follower
 * @param {string} followingId - User ID of the user being checked
 */
export const isFollowing = async (followerId, followingId) => {
  try {
    const followRef = ref(database, `follows/${followerId}/${followingId}`);
    const snapshot = await get(followRef);
    return { success: true, isFollowing: snapshot.exists() };
  } catch (error) {
    console.error('Error checking follow status:', error);
    return { success: false, error: error.message };
  }
};

// ========== NOTIFICATION FUNCTIONS ==========

/**
 * Create a notification
 * @param {string} uid - User ID to receive notification
 * @param {object} notificationData - Notification data
 */
export const createNotification = async (uid, notificationData) => {
  try {
    const notificationsRef = ref(database, `notifications/${uid}`);
    const newNotificationRef = push(notificationsRef);
    
    const notification = {
      ...notificationData,
      _id: newNotificationRef.key,
      read: false,
      createdAt: new Date().toISOString()
    };
    
    await set(newNotificationRef, notification);
    return { success: true, notificationId: newNotificationRef.key };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get notifications for a user
 * @param {string} uid - User ID
 */
export const getNotifications = async (uid) => {
  try {
    const notificationsRef = ref(database, `notifications/${uid}`);
    const snapshot = await get(notificationsRef);
    
    if (snapshot.exists()) {
      const notifications = snapshot.val();
      const notificationsArray = Object.values(notifications).sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      return { success: true, data: notificationsArray };
    }
    
    return { success: true, data: [] };
  } catch (error) {
    console.error('Error getting notifications:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Mark notification as read
 * @param {string} uid - User ID
 * @param {string} notificationId - Notification ID
 */
export const markNotificationAsRead = async (uid, notificationId) => {
  try {
    const notificationRef = ref(database, `notifications/${uid}/${notificationId}`);
    await update(notificationRef, { read: true });
    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Subscribe to notifications for a user with real-time updates
 * @param {string} uid - User ID
 * @param {function} callback - Callback function to receive notifications
 */
export const subscribeToNotifications = (uid, callback) => {
  const notificationsRef = ref(database, `notifications/${uid}`);
  
  onValue(notificationsRef, (snapshot) => {
    if (snapshot.exists()) {
      const notifications = snapshot.val();
      const notificationsArray = Object.values(notifications).sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      callback(notificationsArray);
    } else {
      callback([]);
    }
  });
  
  return () => off(notificationsRef);
};

// ========== QUIZ FUNCTIONS ==========

/**
 * Create a quiz
 * @param {object} quizData - Quiz data object
 */
export const createQuiz = async (quizData) => {
  try {
    const quizzesRef = ref(database, 'quizzes');
    const newQuizRef = push(quizzesRef);
    
    const quiz = {
      ...quizData,
      _id: newQuizRef.key,
      createdAt: new Date().toISOString()
    };
    
    await set(newQuizRef, quiz);
    return { success: true, quizId: newQuizRef.key, data: quiz };
  } catch (error) {
    console.error('Error creating quiz:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all quizzes
 */
export const getQuizzes = async () => {
  try {
    const quizzesRef = ref(database, 'quizzes');
    const snapshot = await get(quizzesRef);
    
    if (snapshot.exists()) {
      const quizzes = snapshot.val();
      const quizzesArray = Object.values(quizzes).sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      return { success: true, data: quizzesArray };
    }
    
    return { success: true, data: [] };
  } catch (error) {
    console.error('Error getting quizzes:', error);
    return { success: false, error: error.message };
  }
};

