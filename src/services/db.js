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
  off,
  runTransaction
} from 'firebase/database';
import { database } from '../firebase/config';
import { normalizePostType } from '../utils/postTypes';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/config';
import { sendNotificationEmail } from '../utils/notificationEmailService';

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
 * Update user profile data
 * @param {string} uid - User ID
 * @param {object} profileData - Profile data to update
 */
export const updateUserProfile = async (uid, profileData) => {
  try {
    const profileRef = ref(database, `users/${uid}/profile`);
    await set(profileRef, {
      ...profileData,
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating user profile:', error);
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

/**
 * Check if username exists in username index (fast lookup)
 * @param {string} username - Username to check
 * @param {string} excludeUserId - Optional: User ID to exclude from check (for editing own profile)
 */
export const checkUsernameInIndex = async (username, excludeUserId = null) => {
  try {
    if (!username || username.trim().length === 0) {
      return { success: true, available: false };
    }

    const usernameIndexRef = ref(database, `usernames/${username}`);
    const snapshot = await get(usernameIndexRef);
    
    if (snapshot.exists()) {
      const existingUid = snapshot.val();
      // If checking for own username during edit, allow it
      if (excludeUserId && existingUid === excludeUserId) {
        return { success: true, available: true };
      }
      return { success: true, available: false, uid: existingUid };
    }
    
    return { success: true, available: true };
  } catch (error) {
    console.error('Error checking username in index:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if username is available (uses username index for fast lookup)
 * @param {string} username - Username to check
 * @param {string} excludeUserId - Optional: User ID to exclude from check (for editing own profile)
 */
export const checkUsernameAvailability = async (username, excludeUserId = null) => {
  // Use username index for fast lookup
  return await checkUsernameInIndex(username, excludeUserId);
};

/**
 * Create username index entry
 * @param {string} username - Username
 * @param {string} uid - User ID
 */
export const createUsernameIndex = async (username, uid) => {
  try {
    const usernameIndexRef = ref(database, `usernames/${username}`);
    await set(usernameIndexRef, uid);
    return { success: true };
  } catch (error) {
    console.error('Error creating username index:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update username index using transaction (atomic)
 * @param {string} oldUsername - Old username (null/empty if new)
 * @param {string} newUsername - New username
 * @param {string} uid - User ID
 */
export const updateUsernameIndex = async (oldUsername, newUsername, uid) => {
  try {
    // If username is the same, no update needed
    if (oldUsername && oldUsername === newUsername) {
      return { success: true };
    }
    
    // If username changed, update index atomically
    if (oldUsername && oldUsername !== newUsername) {
      // Remove old username index
      const oldIndexRef = ref(database, `usernames/${oldUsername}`);
      await remove(oldIndexRef);
    }
    
    // Add new username index using transaction (atomic check)
    const newIndexRef = ref(database, `usernames/${newUsername}`);
    const result = await runTransaction(newIndexRef, (current) => {
      // If current value is null, username is available
      if (current === null) {
        return uid;
      }
      // If current value is same uid (updating own username), allow it
      if (current === uid) {
        return uid;
      }
      // Otherwise, abort transaction (username taken)
      return undefined; // Abort transaction
    });
    
    if (result.committed) {
      return { success: true };
    } else {
      return { success: false, error: 'Username is already taken' };
    }
  } catch (error) {
    console.error('Error updating username index:', error);
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
    console.group("CREATE POST - DB SAVE");
    console.log("Post data before save:", {
      userId: postData.userId,
      username: postData.username,
      title: postData.title,
      type: postData.type,
      mediaCount: postData.media ? postData.media.length : 0
    });
    
    if (postData.media && postData.media.length > 0) {
      console.log("Media array:", postData.media);
      postData.media.forEach((item, index) => {
        console.log(`  Media ${index + 1}:`, {
          type: item.type,
          url: item.url ? item.url.substring(0, 50) + '...' : 'MISSING URL'
        });
      });
    }
    
    const postsRef = ref(database, 'posts');
    const newPostRef = push(postsRef);
    
    // Set postedTo field: "everyone" or groupId
    const postedTo = postData.postedTo || "everyone"
    // Keep groupId for backward compatibility
    const groupId = postedTo === "everyone" ? null : postedTo

    const post = {
      ...postData,
      postId: newPostRef.key,
      _id: newPostRef.key,
      createdAt: Date.now(),
      likes: postData.likes || {},
      views: postData.views || 0,
      comments: postData.comments || {},
      answers: postData.answers || {},
      media: postData.media || [],
      postedTo: postedTo,
      groupId: groupId // Backward compatibility
    };
    
    console.log("Post object to save:", {
      postId: post.postId,
      createdAt: post.createdAt,
      mediaCount: post.media.length,
      hasMediaArray: Array.isArray(post.media)
    });
    
    await set(newPostRef, post);
    console.log("✓ Post saved to Firebase");
    
    // Verify the saved post
    try {
      const savedPostRef = ref(database, `posts/${newPostRef.key}`);
      const snapshot = await get(savedPostRef);
      const savedPost = snapshot.val();
      
      if (savedPost) {
        console.log("✓ Post verification successful");
        console.log("Saved post ID:", savedPost.postId || savedPost._id);
        console.log("Saved post createdAt:", savedPost.createdAt);
        console.log("Saved post media count:", savedPost.media ? savedPost.media.length : 0);
        
        // Verify media array
        if (savedPost.media && Array.isArray(savedPost.media)) {
          console.log("✓ Media array exists and is correct");
          const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || 'dfayzbhpu';
          savedPost.media.forEach((item, index) => {
            if (item.url && item.url.startsWith(`https://res.cloudinary.com/${cloudName}/`)) {
              console.log(`  ✓ Media ${index + 1} URL valid`);
            } else {
              console.error(`  ✗ Media ${index + 1} URL invalid:`, item.url);
            }
          });
        } else {
          console.warn("⚠ Media array missing or not an array");
        }
        
        // Check for old fields
        const oldFields = ['images', 'videos', 'documents', 'imageUrl', 'fileUrl', 'fileType'];
        const foundOldFields = oldFields.filter(field => savedPost[field] !== undefined);
        if (foundOldFields.length > 0) {
          console.warn("⚠ Old fields found in saved post:", foundOldFields);
        } else {
          console.log("✓ No old fields found (unified schema)");
        }
      } else {
        console.error("✗ Post verification failed: Post not found in database");
      }
    } catch (verifyError) {
      console.error("✗ Error verifying post:", verifyError);
    }
    
    // Create notifications for group members if post is in a group
    if (postedTo && postedTo !== "everyone") {
      try {
        const groupResult = await getGroup(postedTo);
        if (groupResult.success) {
          const group = groupResult.data;
          const members = group.members || {};
          const memberIds = Object.keys(members);
          
          // Get post author username
          const authorUsername = postData.username || 'Someone';
          
          // Format post title for message (truncate if too long)
          let postTitle = postData.title || '';
          if (postTitle.length > 50) {
            postTitle = postTitle.substring(0, 47) + '...';
          }
          
          // Create notification message
          const message = postTitle 
            ? `${authorUsername} posted '${postTitle}' in ${group.name}`
            : `${authorUsername} posted in ${group.name}`;
          
          // Create notifications for all members except the post author
          const notificationPromises = memberIds
            .filter(memberId => memberId !== postData.userId) // Exclude post author
            .map(async (memberId) => {
              await createNotification(memberId, {
                type: 'group_post',
                fromUserId: postData.userId, // Post author
                groupId: postedTo,
                postId: newPostRef.key,
                message: message,
                read: false
              });
            });
          
          await Promise.all(notificationPromises);
          console.log(`✓ Created notifications for ${notificationPromises.length} group members`);
        } else {
          console.warn('⚠ Group not found for notification creation:', postedTo);
        }
      } catch (notifError) {
        // Don't block post creation if notification fails
        console.error('Error creating group post notifications:', notifError);
      }
    }
    
    // Create notifications for followers if post is posted to "everyone"
    if (postedTo === "everyone") {
      try {
        // Get all users who follow the post author
        const followsRef = ref(database, 'follows');
        const followsSnapshot = await get(followsRef);
        
        if (followsSnapshot.exists()) {
          const allFollows = followsSnapshot.val();
          const followerIds = [];
          
          // Find all users who follow this post author
          // Structure: follows/{followerId}/{followingId} = true
          for (const followerId in allFollows) {
            if (followerId !== postData.userId && allFollows[followerId] && allFollows[followerId][postData.userId]) {
              followerIds.push(followerId);
            }
          }
          
          if (followerIds.length > 0) {
            // Get post author username
            const authorUsername = postData.username || 'Someone';
            
            // Format post title for message (truncate if too long)
            let postTitle = postData.title || '';
            if (postTitle.length > 50) {
              postTitle = postTitle.substring(0, 47) + '...';
            }
            
            // Create notification message
            const message = postTitle 
              ? `${authorUsername} shared a new post: '${postTitle}'`
              : `${authorUsername} shared a new post`;
            
            // Create notifications for all followers
            const followNotificationPromises = followerIds.map(async (followerId) => {
              await createNotification(followerId, {
                type: 'follow_post',
                fromUserId: postData.userId, // Post author
                postId: newPostRef.key,
                message: message,
                postTitle: postData.title || '',
                postContent: postData.text || '',
                read: false
              });
            });
            
            await Promise.all(followNotificationPromises);
            console.log(`✓ Created follow_post notifications for ${followNotificationPromises.length} followers`);
          }
        }
      } catch (followNotifError) {
        // Don't block post creation if notification fails
        console.error('Error creating follow_post notifications:', followNotifError);
      }
    }
    
    console.groupEnd();
    
    return { success: true, postId: newPostRef.key, data: post, verified: true };
  } catch (error) {
    console.error('✗ Error creating post:', error);
    console.groupEnd();
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
    // Prepare multi-path update for atomic deletion
    const updates = {};
    
    // Delete the post itself
    updates[`posts/${postId}`] = null;
    
    // Delete all answers for this post
    const answersRef = ref(database, `answers`);
    const answersSnapshot = await get(answersRef);
    if (answersSnapshot.exists()) {
      const answers = answersSnapshot.val();
      Object.keys(answers).forEach(answerId => {
        if (answers[answerId].postId === postId) {
          updates[`answers/${answerId}`] = null;
        }
      });
    }
    
    // Execute all deletions atomically
    if (Object.keys(updates).length > 0) {
      await update(ref(database), updates);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting post:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update a post
 * @param {string} postId - Post ID
 * @param {object} updates - Fields to update (title, text, description, topic, media, banner, questions)
 * @returns {Promise<object>} { success: boolean, error?: string }
 */
export const updatePost = async (postId, updates) => {
  try {
    // Validate that only allowed fields are being updated
    const allowedFields = ['title', 'text', 'description', 'topic', 'media', 'banner', 'questions', 'updatedAt'];
    const updateData = {};
    
    // Only include allowed fields
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        updateData[key] = updates[key];
      }
    });
    
    // Add updatedAt timestamp
    updateData.updatedAt = Date.now();
    
    // Update the post
    const postRef = ref(database, `posts/${postId}`);
    await update(postRef, updateData);
    
    return { success: true };
  } catch (error) {
    console.error('Error updating post:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Toggle like on a post
 * @param {string} postId - Post ID
 * @param {string} userId - User ID
 * @returns {Promise<object>} { success: boolean, isLiked: boolean, error?: string }
 */
export const toggleLikePost = async (postId, userId) => {
  try {
    const postRef = ref(database, `posts/${postId}`)
    
    // Use transaction to safely toggle like
    let wasLiked = false
    const result = await runTransaction(postRef, (post) => {
      if (!post) {
        return null // Post doesn't exist
      }
      
      // Initialize likes if it doesn't exist
      if (!post.likes) {
        post.likes = {}
      }
      
      // Check current state and toggle
      wasLiked = post.likes[userId] === true
      if (wasLiked) {
        // Unlike: remove user from likes
        delete post.likes[userId]
      } else {
        // Like: add user to likes
        post.likes[userId] = true
      }
      
      return post
    })
    
    if (result.committed) {
      // Return the new state (opposite of what it was)
      return { success: true, isLiked: !wasLiked }
    } else {
      return { success: false, error: 'Failed to toggle like' }
    }
  } catch (error) {
    console.error('Error toggling like:', error)
    return { success: false, error: error.message }
  }
}

// ========== COMMENT FUNCTIONS ==========

export const addCommentToPost = async (postId, commentData) => {
  try {
    if (!postId) {
      return { success: false, error: 'Missing postId' };
    }

    const trimmedText = (commentData.text || '').trim();
    if (!trimmedText) {
      return { success: false, error: 'Comment cannot be empty' };
    }

    const commentsRef = ref(database, `posts/${postId}/comments`);
    const newCommentRef = push(commentsRef);
    const payload = {
      ...commentData,
      text: trimmedText,
      createdAt: Date.now()
    };

    await set(newCommentRef, payload);

    // Increment comment count inside stats
    const statsRef = ref(database, `posts/${postId}/stats/commentCount`);
    await runTransaction(statsRef, (current) => {
      if (current === null || current === undefined) {
        return 1;
      }
      return current + 1;
    });

    return { success: true, commentId: newCommentRef.key };
  } catch (error) {
    console.error('Error adding comment:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Subscribe to posts with real-time updates
 * @param {function} callback - Callback function to receive posts
 * @param {object} filters - Optional filters (postedTo, groupId, userId)
 */
export const subscribeToPosts = (callback, filters = {}) => {
  let postsRef = ref(database, 'posts');
  
  // Priority: postedTo > groupId (backward compat) > userId
  if (filters.postedTo !== undefined) {
    // Filter by postedTo field
    postsRef = query(postsRef, orderByChild('postedTo'), equalTo(filters.postedTo));
  } else if (filters.groupId) {
    // Backward compatibility: filter by groupId
    postsRef = query(postsRef, orderByChild('groupId'), equalTo(filters.groupId));
  } else if (filters.userId) {
    postsRef = query(postsRef, orderByChild('userId'), equalTo(filters.userId));
  } else {
    // For default case, get all posts (don't use orderByChild to avoid excluding posts without createdAt)
    // We'll sort client-side instead
    postsRef = ref(database, 'posts');
  }
  
  onValue(postsRef, (snapshot) => {
    if (snapshot.exists()) {
      const posts = snapshot.val();
      let postsArray = Object.values(posts);
      
      // Additional client-side filtering for postedTo if needed
      // (Firebase queries work, but we do extra filtering for safety)
      if (filters.postedTo !== undefined) {
        // Explicit filter by postedTo
        postsArray = postsArray.filter(post => post.postedTo === filters.postedTo);
      } else if (filters.groupId || filters.userId) {
        // If filtering by groupId or userId, don't filter by postedTo
        // (these filters are for specific use cases)
      } else {
        // Default: only show posts posted to "everyone" (home feed)
        // Include posts with postedTo === "everyone" OR posts without postedTo field (backward compatibility)
        postsArray = postsArray.filter(post => {
          const postedTo = post.postedTo;
          // Include if postedTo is "everyone", undefined, null, or doesn't exist
          return postedTo === "everyone" || postedTo === undefined || postedTo === null || !post.hasOwnProperty('postedTo');
        });
      }

      if (filters.type) {
        postsArray = postsArray.filter(post => normalizePostType(post.type) === filters.type);
      }
      
      // Sort by createdAt DESC (client-side)
      postsArray = postsArray.sort((a, b) => {
        const aTime = a.createdAt || 0;
        const bTime = b.createdAt || 0;
        return bTime - aTime;
      });
      
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
    console.group('CREATE GROUP');
    console.log('GroupData:', groupData);
    
    // Import validation utilities
    const { sanitizeAndValidateGroup } = await import('../utils/sanitize');
    
    // Sanitize and validate input
    const validation = sanitizeAndValidateGroup(groupData);
    if (!validation.valid) {
      console.error('Validation errors:', validation.errors);
      console.groupEnd();
      return { success: false, error: validation.errors.join(', ') };
    }
    
    const sanitizedData = validation.sanitized;
    
    const groupsRef = ref(database, 'groups');
    const newGroupRef = push(groupsRef);
    
    const group = {
      ...sanitizedData,
      _id: newGroupRef.key,
      createdAt: new Date().toISOString(),
      banner: sanitizedData.banner || null,
      icon: sanitizedData.icon || null,
      members: {
        [sanitizedData.creatorId]: {
          role: 'admin',
          joinedAt: new Date().toISOString()
        }
      },
      admins: {
        [sanitizedData.creatorId]: true
      },
      requests: {},
      memberCount: 1 // Initialize with creator as first member
    };
    
    // Also add to userGroups for creator
    const updates = {};
    updates[`groups/${newGroupRef.key}`] = group;
    updates[`userGroups/${sanitizedData.creatorId}/${newGroupRef.key}`] = true;
    
    await update(ref(database), updates);
    
    console.log('Successfully created group:', newGroupRef.key);
    console.groupEnd();
    
    return { success: true, groupId: newGroupRef.key, data: group };
  } catch (error) {
    console.error('Error creating group:', error);
    console.groupEnd();
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
 * Search groups by name (case-insensitive)
 * @param {string} query - Search query string
 * @param {number} limit - Maximum number of results (default: 10)
 */
export const searchGroups = async (query, limit = 10) => {
  try {
    if (!query || query.trim().length === 0) {
      return { success: true, data: [] };
    }

    const groupsRef = ref(database, 'groups');
    const snapshot = await get(groupsRef);
    
    if (!snapshot.exists()) {
      return { success: true, data: [] };
    }

    const groups = snapshot.val();
    const searchTerm = query.toLowerCase().trim();
    
    const matchingGroups = Object.values(groups)
      .filter(group => {
        const name = (group.name || '').toLowerCase();
        return name.includes(searchTerm);
      })
      .slice(0, limit);

    return { success: true, data: matchingGroups };
  } catch (error) {
    console.error('Error searching groups:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Search users by username (case-insensitive)
 * @param {string} query - Search query string
 * @param {number} limit - Maximum number of results (default: 10)
 */
export const searchUsers = async (query, limit = 10) => {
  try {
    if (!query || query.trim().length === 0) {
      return { success: true, data: [] };
    }

    const usersRef = ref(database, 'users');
    const snapshot = await get(usersRef);
    
    if (!snapshot.exists()) {
      return { success: true, data: [] };
    }

    const users = snapshot.val();
    const searchTerm = query.toLowerCase().trim();
    
    const matchingUsers = Object.entries(users)
      .map(([uid, user]) => ({
        ...user,
        uid
      }))
      .filter(user => {
        const username = (user.profile?.username || user.username || '').toLowerCase();
        const displayName = (user.profile?.displayName || user.displayName || '').toLowerCase();
        return username.includes(searchTerm) || displayName.includes(searchTerm);
      })
      .slice(0, limit);

    return { success: true, data: matchingUsers };
  } catch (error) {
    console.error('Error searching users:', error);
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
 * Join a group (public groups only - immediate membership)
 * Uses atomic multi-path update: members + userGroups + memberCount
 * @param {string} groupId - Group ID
 * @param {string} uid - User ID
 */
export const joinGroup = async (groupId, uid) => {
  try {
    console.group('JOIN GROUP');
    console.log('GroupId:', groupId, 'UserId:', uid);
    
    // Check if group exists and is public
    const groupResult = await getGroup(groupId);
    if (!groupResult.success) {
      console.error('Group not found');
      console.groupEnd();
      return { success: false, error: 'Group not found' };
    }
    
    const group = groupResult.data;
    if (group.privacy === 'private') {
      console.error('Cannot directly join private group. Use requestGroupJoin instead.');
      console.groupEnd();
      return { success: false, error: 'Cannot directly join private group. Please request to join.' };
    }
    
    // Check if already a member
    if (group.members && group.members[uid]) {
      console.log('User is already a member');
      console.groupEnd();
      return { success: true, message: 'Already a member' };
    }
    
    // Prepare atomic multi-path update
    const updates = {};
    const memberData = {
      role: 'member',
      joinedAt: new Date().toISOString()
    };
    
    updates[`groups/${groupId}/members/${uid}`] = memberData;
    updates[`userGroups/${uid}/${groupId}`] = true;
    
    // Perform atomic update first (members + userGroups)
    await update(ref(database), updates);
    
    // Use transaction to increment memberCount atomically (after member add)
    const memberCountRef = ref(database, `groups/${groupId}/memberCount`);
    const memberCountResult = await runTransaction(memberCountRef, (current) => {
      // If current is null or undefined, start at 1 (including the new member)
      // If it exists, increment it
      return (current || 0) + 1;
    });
    
    if (!memberCountResult.committed) {
      console.error('Failed to update memberCount, but member was added');
      // Member was already added, but count update failed
      // This is acceptable - count can be recalculated
      console.groupEnd();
      return { success: true, warning: 'Member added but count update failed' };
    }
    
    console.log('Successfully joined group');
    console.log('Member count:', memberCountResult.snapshot.val());
    console.groupEnd();
    
    return { success: true };
  } catch (error) {
    console.error('Error joining group:', error);
    console.groupEnd();
    return { success: false, error: error.message };
  }
};

/**
 * Leave a group
 * Uses atomic multi-path update: remove from members + userGroups + decrement memberCount
 * @param {string} groupId - Group ID
 * @param {string} uid - User ID
 */
export const leaveGroup = async (groupId, uid) => {
  try {
    console.group('LEAVE GROUP');
    console.log('GroupId:', groupId, 'UserId:', uid);
    
    // Check if user is a member
    const groupResult = await getGroup(groupId);
    if (!groupResult.success) {
      console.error('Group not found');
      console.groupEnd();
      return { success: false, error: 'Group not found' };
    }
    
    const group = groupResult.data;
    if (!group.members || !group.members[uid]) {
      console.log('User is not a member');
      console.groupEnd();
      return { success: true, message: 'Not a member' };
    }
    
    // Prepare atomic multi-path update
    const updates = {};
    updates[`groups/${groupId}/members/${uid}`] = null;
    updates[`userGroups/${uid}/${groupId}`] = null;
    
    // Perform atomic update first (remove member + userGroups)
    await update(ref(database), updates);
    
    // Use transaction to decrement memberCount atomically (after member remove)
    const memberCountRef = ref(database, `groups/${groupId}/memberCount`);
    const memberCountResult = await runTransaction(memberCountRef, (current) => {
      const currentCount = current || (group.members ? Object.keys(group.members).length : 0);
      const newCount = Math.max(0, currentCount - 1);
      return newCount;
    });
    
    if (!memberCountResult.committed) {
      console.error('Failed to update memberCount, but member was removed');
      // Member was already removed, but count update failed
      // This is acceptable - count can be recalculated
      console.groupEnd();
      return { success: true, warning: 'Member removed but count update failed' };
    }
    
    console.log('Successfully left group');
    console.log('Member count:', memberCountResult.snapshot.val());
    console.groupEnd();
    
    return { success: true };
  } catch (error) {
    console.error('Error leaving group:', error);
    console.groupEnd();
    return { success: false, error: error.message };
  }
};

/**
 * Update group fields
 * @param {string} groupId - Group ID
 * @param {object} updates - Fields to update (name, description, category, privacy, banner, icon)
 */
export const updateGroup = async (groupId, updates) => {
  try {
    console.group('UPDATE GROUP');
    console.log('GroupId:', groupId, 'Updates:', updates);
    
    // Import validation utilities
    const { 
      validateGroupName, 
      validateGroupDescription, 
      validateGroupCategory, 
      validateGroupPrivacy,
      sanitizeText
    } = await import('../utils/sanitize');
    
    // Only update provided fields with validation
    const updateData = {};
    
    if (updates.name !== undefined) {
      const nameValidation = validateGroupName(updates.name);
      if (!nameValidation.valid) {
        console.error('Name validation error:', nameValidation.error);
        console.groupEnd();
        return { success: false, error: nameValidation.error };
      }
      updateData.name = updates.name.trim();
    }
    
    if (updates.description !== undefined) {
      const descValidation = validateGroupDescription(updates.description);
      if (!descValidation.valid) {
        console.error('Description validation error:', descValidation.error);
        console.groupEnd();
        return { success: false, error: descValidation.error };
      }
      updateData.description = sanitizeText(updates.description.trim());
    }
    
    if (updates.category !== undefined) {
      const categoryValidation = validateGroupCategory(updates.category);
      if (!categoryValidation.valid) {
        console.error('Category validation error:', categoryValidation.error);
        console.groupEnd();
        return { success: false, error: categoryValidation.error };
      }
      updateData.category = updates.category;
    }
    
    if (updates.privacy !== undefined) {
      const privacyValidation = validateGroupPrivacy(updates.privacy);
      if (!privacyValidation.valid) {
        console.error('Privacy validation error:', privacyValidation.error);
        console.groupEnd();
        return { success: false, error: privacyValidation.error };
      }
      updateData.privacy = updates.privacy;
    }
    
    if (updates.banner !== undefined) updateData.banner = updates.banner;
    if (updates.icon !== undefined) updateData.icon = updates.icon;
    
    const groupRef = ref(database, `groups/${groupId}`);
    await update(groupRef, updateData);
    
    console.log('Successfully updated group');
    console.groupEnd();
    
    return { success: true };
  } catch (error) {
    console.error('Error updating group:', error);
    console.groupEnd();
    return { success: false, error: error.message };
  }
};

/**
 * Delete a group and all related data
 * @param {string} groupId - Group ID
 */
export const deleteGroup = async (groupId) => {
  try {
    console.group('DELETE GROUP');
    console.log('GroupId:', groupId);
    
    // Get group to clean up userGroups index
    const groupResult = await getGroup(groupId);
    if (!groupResult.success) {
      console.error('Group not found');
      console.groupEnd();
      return { success: false, error: 'Group not found' };
    }
    
    const group = groupResult.data;
    
    // Delete all posts in this group first
    const postsRef = ref(database, 'posts');
    const postsSnapshot = await get(postsRef);
    
    if (postsSnapshot.exists()) {
      const posts = postsSnapshot.val();
      const deletePromises = [];
      
      for (const postId in posts) {
        if (posts[postId].groupId === groupId) {
          const postRef = ref(database, `posts/${postId}`);
          deletePromises.push(remove(postRef));
        }
      }
      
      await Promise.all(deletePromises);
      console.log('Deleted', deletePromises.length, 'posts');
    }
    
    // Clean up userGroups index for all members
    if (group.members) {
      const userGroupUpdates = {};
      Object.keys(group.members).forEach(uid => {
        userGroupUpdates[`userGroups/${uid}/${groupId}`] = null;
      });
      
      if (Object.keys(userGroupUpdates).length > 0) {
        await update(ref(database), userGroupUpdates);
        console.log('Cleaned up userGroups for', Object.keys(group.members).length, 'members');
      }
    }
    
    // Delete group node
    const groupRef = ref(database, `groups/${groupId}`);
    await remove(groupRef);
    
    console.log('Successfully deleted group');
    console.groupEnd();
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting group:', error);
    console.groupEnd();
    return { success: false, error: error.message };
  }
};

/**
 * Approve a member join request and add to members
 * Uses atomic multi-path update: members + userGroups + memberCount + update request status + notifications
 * @param {string} groupId - Group ID
 * @param {string} requestId - Request ID (typically userId)
 * @param {string} userId - User ID (for backwards compatibility, can use requestId)
 */
export const approveMemberRequest = async (groupId, requestId, userId = null) => {
  try {
    console.group('APPROVE MEMBER REQUEST');
    const actualUserId = userId || requestId;
    console.log('GroupId:', groupId, 'RequestId:', requestId, 'UserId:', actualUserId);
    
    // Get group and request data
    const groupResult = await getGroup(groupId);
    if (!groupResult.success) {
      console.error('Group not found');
      console.groupEnd();
      return { success: false, error: 'Group not found' };
    }
    
    const group = groupResult.data;
    
    // Check if request exists
    const requestsRef = ref(database, `groups/${groupId}/requests/${requestId}`);
    const requestSnapshot = await get(requestsRef);
    
    if (!requestSnapshot.exists()) {
      console.error('Request not found');
      console.groupEnd();
      return { success: false, error: 'Request not found' };
    }
    
    const requestData = requestSnapshot.val();
    
    // Check if already a member (race condition protection)
    if (group.members && group.members[actualUserId]) {
      console.log('User is already a member, removing request');
      // Still update request status and notify
      await update(requestsRef, { status: 'accepted' });
      
      // Get user for notification
      const userResult = await getUser(actualUserId);
      const username = userResult.success ? (userResult.data.profile?.username || userResult.data.username || 'User') : 'User';
      
      // Notify requester
      await createNotification(actualUserId, {
        type: 'group_request_response',
        groupId: groupId,
        requestId: requestId,
        message: `Your request to join ${group.name} was accepted.`,
        read: false
      });
      
      console.groupEnd();
      return { success: true, message: 'Already a member' };
    }
    
    // Check if request status is pending (prevent double-approval)
    if (requestData.status && requestData.status !== 'pending') {
      console.error('Request already processed:', requestData.status);
      console.groupEnd();
      return { success: false, error: `Request already ${requestData.status}` };
    }
    
    // Prepare atomic multi-path update
    const updates = {};
    const memberData = {
      role: 'member',
      joinedAt: new Date().toISOString()
    };
    
    updates[`groups/${groupId}/members/${actualUserId}`] = memberData;
    updates[`userGroups/${actualUserId}/${groupId}`] = true;
    updates[`groups/${groupId}/requests/${requestId}/status`] = 'accepted';
    // Also remove from new schema: groupRequests/{groupId}/{userId}
    updates[`groupRequests/${groupId}/${actualUserId}`] = null;
    
    // Perform atomic update first (members + userGroups + request status + remove from new schema)
    await update(ref(database), updates);
    
    // Use transaction to increment memberCount atomically (after member add)
    const memberCountRef = ref(database, `groups/${groupId}/memberCount`);
    const memberCountResult = await runTransaction(memberCountRef, (current) => {
      return (current || 0) + 1;
    });
    
    if (!memberCountResult.committed) {
      console.error('Failed to update memberCount, but member was added');
      // Member was already added, but count update failed
      // This is acceptable - count can be recalculated
      console.groupEnd();
      return { success: true, warning: 'Member added but count update failed' };
    }
    
    // Get user data for notifications
    const userResult = await getUser(actualUserId);
    const username = userResult.success ? (userResult.data.profile?.username || userResult.data.username || 'User') : 'User';
    
    // Notify requester
    await createNotification(actualUserId, {
      type: 'group_request_response',
      groupId: groupId,
      requestId: requestId,
      message: `Your request to join ${group.name} was accepted.`,
      read: false
    });
    
    // Mark admin notifications as read (optional - find and mark all related notifications)
    // This would require querying notifications, which is handled in the UI
    
    console.log('Successfully approved request');
    console.log('Member count:', memberCountResult.snapshot.val());
    console.groupEnd();
    
    return { success: true };
  } catch (error) {
    console.error('Error approving member request:', error);
    console.groupEnd();
    return { success: false, error: error.message };
  }
};

/**
 * Remove a member from group
 * @param {string} groupId - Group ID
 * @param {string} userId - User ID
 */
export const removeMember = async (groupId, userId) => {
  try {
    console.group('REMOVE MEMBER');
    console.log('GroupId:', groupId, 'UserId:', userId);
    
    // Get group to check if member exists
    const groupResult = await getGroup(groupId);
    if (!groupResult.success) {
      console.error('Group not found');
      console.groupEnd();
      return { success: false, error: 'Group not found' };
    }
    
    const group = groupResult.data;
    if (!group.members || !group.members[userId]) {
      console.log('User is not a member');
      console.groupEnd();
      return { success: true, message: 'Not a member' };
    }
    
    // Prepare atomic multi-path update
    const updates = {};
    updates[`groups/${groupId}/members/${userId}`] = null;
    updates[`userGroups/${userId}/${groupId}`] = null;
    
    // Also remove from admins if they were an admin
    if (group.admins && group.admins[userId]) {
      updates[`groups/${groupId}/admins/${userId}`] = null;
    }
    
    // Perform atomic update first
    await update(ref(database), updates);
    
    // Use transaction to decrement memberCount atomically
    const memberCountRef = ref(database, `groups/${groupId}/memberCount`);
    const memberCountResult = await runTransaction(memberCountRef, (current) => {
      const currentCount = current || (group.members ? Object.keys(group.members).length : 0);
      const newCount = Math.max(0, currentCount - 1);
      return newCount;
    });
    
    if (!memberCountResult.committed) {
      console.error('Failed to update memberCount, but member was removed');
      console.groupEnd();
      return { success: true, warning: 'Member removed but count update failed' };
    }
    
    console.log('Successfully removed member');
    console.log('Member count:', memberCountResult.snapshot.val());
    console.groupEnd();
    
    return { success: true };
  } catch (error) {
    console.error('Error removing member:', error);
    console.groupEnd();
    return { success: false, error: error.message };
  }
};

/**
 * Promote a member to admin
 * @param {string} groupId - Group ID
 * @param {string} userId - User ID
 */
export const promoteToAdmin = async (groupId, userId) => {
  try {
    // Update member role to admin
    const memberRef = ref(database, `groups/${groupId}/members/${userId}/role`);
    await set(memberRef, 'admin');
    
    // Add to admins object
    const adminRef = ref(database, `groups/${groupId}/admins/${userId}`);
    await set(adminRef, true);
    
    return { success: true };
  } catch (error) {
    console.error('Error promoting to admin:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get pending join requests for a group
 * @param {string} groupId - Group ID
 */
export const getGroupMemberRequests = async (groupId) => {
  try {
    const requestsRef = ref(database, `groups/${groupId}/requests`);
    const snapshot = await get(requestsRef);
    
    if (snapshot.exists()) {
      const requests = snapshot.val();
      // Filter to only pending requests
      const pendingRequests = {};
      Object.keys(requests).forEach(requestId => {
        if (requests[requestId].status === 'pending' || !requests[requestId].status) {
          pendingRequests[requestId] = requests[requestId];
        }
      });
      return { success: true, data: pendingRequests };
    }
    
    return { success: true, data: {} };
  } catch (error) {
    console.error('Error getting group member requests:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get group requests from new schema: groupRequests/{groupId}
 * @param {string} groupId - Group ID
 */
export const getGroupRequests = async (groupId) => {
  try {
    const requestsRef = ref(database, `groupRequests/${groupId}`);
    const snapshot = await get(requestsRef);
    
    if (snapshot.exists()) {
      const requests = snapshot.val();
      // Return object with userId as keys
      return { success: true, data: requests };
    }
    
    return { success: true, data: {} };
  } catch (error) {
    console.error('Error getting group requests:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Request to join a private group
 * Creates a request node and notifies all group admins
 * @param {string} groupId - Group ID
 * @param {string} uid - User ID
 */
export const requestGroupJoin = async (groupId, uid) => {
  try {
    console.group('REQUEST GROUP JOIN');
    console.log('GroupId:', groupId, 'UserId:', uid);
    
    // Check if group exists and is private
    const groupResult = await getGroup(groupId);
    if (!groupResult.success) {
      console.error('Group not found');
      console.groupEnd();
      return { success: false, error: 'Group not found' };
    }
    
    const group = groupResult.data;
    if (group.privacy === 'public') {
      console.error('Group is public. Use joinGroup instead.');
      console.groupEnd();
      return { success: false, error: 'Group is public. Use Join button instead.' };
    }
    
    // Check if already a member
    if (group.members && group.members[uid]) {
      console.log('User is already a member');
      console.groupEnd();
      return { success: false, error: 'Already a member of this group' };
    }
    
    // Check for existing pending request (rate limiting)
    const requestsRef = ref(database, `groups/${groupId}/requests/${uid}`);
    const existingRequestSnapshot = await get(requestsRef);
    
    if (existingRequestSnapshot.exists()) {
      const existingRequest = existingRequestSnapshot.val();
      
      // Check if request is pending
      if (existingRequest.status === 'pending' || !existingRequest.status) {
        console.log('Request already pending');
        console.groupEnd();
        return { success: false, error: 'Request already pending' };
      }
      
      // Check rate limit (1 request per 10 seconds)
      if (existingRequest.createdAt) {
        const requestTime = new Date(existingRequest.createdAt).getTime();
        const now = Date.now();
        const timeSinceRequest = (now - requestTime) / 1000;
        
        if (timeSinceRequest < 10) {
          const waitTime = Math.ceil(10 - timeSinceRequest);
          console.error(`Rate limit: Please wait ${waitTime} seconds before requesting again`);
          console.groupEnd();
          return { success: false, error: `Please wait ${waitTime} seconds before requesting again` };
        }
      }
    }
    
    // Get user data for notification
    const userResult = await getUser(uid);
    const username = userResult.success ? (userResult.data.profile?.username || userResult.data.username || 'User') : 'User';
    
    // Create request
    const requestData = {
      userId: uid,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };
    
    // Store in both locations for compatibility
    await set(requestsRef, requestData);
    
    // Also store in new schema: groupRequests/{groupId}/{userId}
    const newRequestsRef = ref(database, `groupRequests/${groupId}/${uid}`);
    await set(newRequestsRef, true);
    
    // Notify all admins
    const admins = group.admins || {};
    if (Object.keys(admins).length === 0 && group.creatorId) {
      // Fallback to creator if no admins object
      admins[group.creatorId] = true;
    }
    
    const adminIds = Object.keys(admins);
    
    if (adminIds.length === 0) {
      console.warn('No admins found for group:', groupId);
      console.groupEnd();
      return { success: false, error: 'No admins found for this group' };
    }
    
    // Get website link for action URL
    const websiteLink = process.env.REACT_APP_WEBSITE_LINK || process.env.REACT_APP_WEBSITE_URL || 'https://qconnect.com';
    const actionLink = `${websiteLink}/group/${groupId}`;
    
    const notificationPromises = adminIds.map(async (adminId) => {
      // Create in-app notification
      await createNotification(adminId, {
        type: 'group_request',
        fromUserId: uid,
        groupId: groupId,
        requestId: uid,
        message: `${username} requested to join ${group.name}`,
        groupName: group.name,
        read: false
      });
      
      // Send email notification
      try {
        const adminUserResult = await getUser(adminId);
        if (adminUserResult.success) {
          const adminUser = adminUserResult.data;
          // Get email from userData (could be at root level)
          // For manual signup: email is at root level
          // For Google OAuth: email should also be stored at root level when user is created
          const adminEmail = adminUser.email;
          
          if (adminEmail && adminEmail.includes('@')) {
            const emailResult = await sendNotificationEmail(adminEmail, {
              type: 'group_request',
              memberName: username,
              groupName: group.name,
              actionLink: actionLink
            });
            
            if (emailResult.success) {
              console.log(`✓ Notification email sent to admin ${adminId}: ${adminEmail}`);
            } else {
              console.warn(`⚠ Failed to send email to admin ${adminId}: ${emailResult.error}`);
            }
          } else {
            console.warn(`⚠ Admin ${adminId} has no valid email address in database`);
            console.log('Admin user data:', { hasEmail: !!adminUser.email, email: adminUser.email });
          }
        } else {
          console.warn(`⚠ Could not fetch admin user data for ${adminId}:`, adminUserResult.error);
        }
      } catch (emailError) {
        // Don't fail the request if email fails - notification is still created
        console.error(`✗ Error sending email to admin ${adminId}:`, emailError);
      }
    });
    
    await Promise.all(notificationPromises);
    
    console.log('Successfully created join request');
    console.log('Notified', adminIds.length, 'admin(s) with notifications and emails');
    console.groupEnd();
    
    return { success: true, requestId: uid };
  } catch (error) {
    console.error('Error requesting to join group:', error);
    console.groupEnd();
    return { success: false, error: error.message };
  }
};

/**
 * Cancel a pending join request
 * @param {string} groupId - Group ID
 * @param {string} requestId - Request ID (typically userId)
 * @param {string} uid - User ID (must match request userId)
 */
export const cancelGroupRequest = async (groupId, requestId, uid) => {
  try {
    console.group('CANCEL GROUP REQUEST');
    console.log('GroupId:', groupId, 'RequestId:', requestId, 'UserId:', uid);
    
    // Verify request exists and belongs to user
    const requestRef = ref(database, `groups/${groupId}/requests/${requestId}`);
    const requestSnapshot = await get(requestRef);
    
    if (!requestSnapshot.exists()) {
      console.error('Request not found');
      console.groupEnd();
      return { success: false, error: 'Request not found' };
    }
    
    const requestData = requestSnapshot.val();
    
    if (requestData.userId !== uid) {
      console.error('Request does not belong to user');
      console.groupEnd();
      return { success: false, error: 'Unauthorized' };
    }
    
    if (requestData.status && requestData.status !== 'pending') {
      console.error('Request already processed:', requestData.status);
      console.groupEnd();
      return { success: false, error: `Cannot cancel ${requestData.status} request` };
    }
    
    // Update request status to cancelled
    await update(requestRef, { status: 'cancelled' });
    
    // Also remove from new schema: groupRequests/{groupId}/{userId}
    const newRequestsRef = ref(database, `groupRequests/${groupId}/${uid}`);
    await remove(newRequestsRef);
    
    // Note: Admin notifications can remain - they'll see it as cancelled
    // In a production system, you might want to notify admins or mark notifications
    
    console.log('Successfully cancelled request');
    console.groupEnd();
    
    return { success: true };
  } catch (error) {
    console.error('Error cancelling group request:', error);
    console.groupEnd();
    return { success: false, error: error.message };
  }
};

/**
 * Reject a member join request
 * Updates request status and notifies requester
 * @param {string} groupId - Group ID
 * @param {string} requestId - Request ID (typically userId)
 * @param {string} userId - User ID (for backwards compatibility)
 */
export const rejectMemberRequest = async (groupId, requestId, userId = null) => {
  try {
    console.group('REJECT MEMBER REQUEST');
    const actualUserId = userId || requestId;
    console.log('GroupId:', groupId, 'RequestId:', requestId, 'UserId:', actualUserId);
    
    // Get group and request data
    const groupResult = await getGroup(groupId);
    if (!groupResult.success) {
      console.error('Group not found');
      console.groupEnd();
      return { success: false, error: 'Group not found' };
    }
    
    const group = groupResult.data;
    
    // Check if request exists
    const requestsRef = ref(database, `groups/${groupId}/requests/${requestId}`);
    const requestSnapshot = await get(requestsRef);
    
    if (!requestSnapshot.exists()) {
      console.error('Request not found');
      console.groupEnd();
      return { success: false, error: 'Request not found' };
    }
    
    const requestData = requestSnapshot.val();
    
    // Check if request status is pending
    if (requestData.status && requestData.status !== 'pending') {
      console.error('Request already processed:', requestData.status);
      console.groupEnd();
      return { success: false, error: `Request already ${requestData.status}` };
    }
    
    // Update request status
    await update(requestsRef, { status: 'rejected' });
    
    // Also remove from new schema: groupRequests/{groupId}/{userId}
    const newRequestsRef = ref(database, `groupRequests/${groupId}/${actualUserId}`);
    await remove(newRequestsRef);
    
    // Notify requester
    await createNotification(actualUserId, {
      type: 'group_request_response',
      groupId: groupId,
      requestId: requestId,
      message: `Your request to join ${group.name} was rejected.`,
      read: false
    });
    
    console.log('Successfully rejected request');
    console.groupEnd();
    
    return { success: true };
  } catch (error) {
    console.error('Error rejecting member request:', error);
    console.groupEnd();
    return { success: false, error: error.message };
  }
};

/**
 * Get groups that a user is a member of
 * @param {string} uid - User ID
 */
export const getUserGroups = async (uid) => {
  try {
    const userGroupsRef = ref(database, `userGroups/${uid}`);
    const snapshot = await get(userGroupsRef);
    
    if (snapshot.exists()) {
      const userGroups = snapshot.val();
      const groupIds = Object.keys(userGroups);
      
      // Fetch group details for each group
      const groupPromises = groupIds.map(groupId => getGroup(groupId));
      const groupResults = await Promise.all(groupPromises);
      
      const groups = groupResults
        .filter(result => result.success)
        .map(result => result.data);
      
      return { success: true, data: groups };
    }
    
    return { success: true, data: [] };
  } catch (error) {
    console.error('Error getting user groups:', error);
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
      createdAt: new Date().toISOString(),
      media: answerData.media || []
    };
    
    await set(newAnswerRef, answer);
    
    // Also add to post's answers
    const postAnswerRef = ref(database, `posts/${answerData.postId}/answers/${newAnswerRef.key}`);
    await set(postAnswerRef, answer);

    const statsRef = ref(database, `posts/${answerData.postId}/stats/answerCount`);
    await runTransaction(statsRef, (current) => {
      if (current === null || current === undefined) return 1;
      return current + 1;
    });
    
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

/**
 * Get list of users following a specific user (followers)
 * @param {string} userId - User ID to get followers for
 */
export const getFollowers = async (userId) => {
  try {
    const followsRef = ref(database, `follows`);
    const snapshot = await get(followsRef);
    
    if (!snapshot.exists()) {
      return { success: true, data: [] };
    }
    
    const allFollows = snapshot.val();
    const followers = [];
    
    // Find all users who follow this userId
    // Structure: follows/{followerId}/{followingId} = true
    for (const followerId in allFollows) {
      if (followerId !== userId && allFollows[followerId] && allFollows[followerId][userId]) {
        // Get follower user data
        const userRef = ref(database, `users/${followerId}`);
        const userSnapshot = await get(userRef);
        if (userSnapshot.exists()) {
          const userData = userSnapshot.val();
          // Check if current user follows this follower back
          const isFollowingBack = allFollows[userId] && allFollows[userId][followerId];
          followers.push({
            uid: followerId,
            ...userData,
            isFollowingBack: !!isFollowingBack
          });
        }
      }
    }
    
    return { success: true, data: followers };
  } catch (error) {
    console.error('Error getting followers:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get list of users a specific user is following
 * @param {string} userId - User ID to get following list for
 */
export const getFollowing = async (userId) => {
  try {
    const followingRef = ref(database, `follows/${userId}`);
    const snapshot = await get(followingRef);
    
    if (!snapshot.exists()) {
      return { success: true, data: [] };
    }
    
    const following = snapshot.val();
    const followingList = [];
    
    // Get user data for each followed user
    for (const followingId in following) {
      const userRef = ref(database, `users/${followingId}`);
      const userSnapshot = await get(userRef);
      if (userSnapshot.exists()) {
        const userData = userSnapshot.val();
        followingList.push({
          uid: followingId,
          ...userData
        });
      }
    }
    
    return { success: true, data: followingList };
  } catch (error) {
    console.error('Error getting following:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Block a user
 * @param {string} userId - User ID blocking
 * @param {string} targetId - User ID to block
 */
export const blockUser = async (userId, targetId) => {
  try {
    const blockRef = ref(database, `users/${userId}/blocked/${targetId}`);
    await set(blockRef, true);
    
    // Unfollow each other if they were following
    await unfollowUser(userId, targetId);
    await unfollowUser(targetId, userId);
    
    return { success: true };
  } catch (error) {
    console.error('Error blocking user:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Unblock a user
 * @param {string} userId - User ID unblocking
 * @param {string} targetId - User ID to unblock
 */
export const unblockUser = async (userId, targetId) => {
  try {
    const blockRef = ref(database, `users/${userId}/blocked/${targetId}`);
    await remove(blockRef);
    return { success: true };
  } catch (error) {
    console.error('Error unblocking user:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if a user is blocked
 * @param {string} userId - User ID checking
 * @param {string} targetId - User ID to check
 */
export const isBlocked = async (userId, targetId) => {
  try {
    const blockRef = ref(database, `users/${userId}/blocked/${targetId}`);
    const snapshot = await get(blockRef);
    return { success: true, isBlocked: snapshot.exists() };
  } catch (error) {
    console.error('Error checking block status:', error);
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
      const notificationsArray = Object.values(notifications).sort((a, b) => {
        // First, prioritize unread over read
        if (!a.read && b.read) return -1;
        if (a.read && !b.read) return 1;
        // Then sort by date (newest first) within each group
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
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

// ========== PENDING USER FUNCTIONS (Email Verification) ==========

/**
 * Create a pending user entry (before email verification)
 * @param {string} email - User email
 * @param {string} password - User password (will be stored, used when verifying)
 * @param {string} username - Username
 * @param {string} verificationCode - 6-digit OTP code
 * @param {number} expiryTimestamp - Unix timestamp when OTP expires
 * @returns {Promise<Object>} - { success, tempUserId, error }
 */
export const createPendingUser = async (email, password, username, verificationCode, expiryTimestamp) => {
  try {
    const timestamp = new Date().toISOString();
    
    // Create temporary user data
    const tempUserId = push(ref(database, 'pending_users')).key;
    const pendingUserRef = ref(database, `pending_users/${tempUserId}`);
    
    const pendingUserData = {
      email,
      password, // Store plain password temporarily (will be used when creating actual user)
      username: username?.trim() || '',
      verificationCode,
      expiryTimestamp,
      createdAt: timestamp,
      wrongAttempts: 0,
      lastAttemptAt: null,
      lockedUntil: null
    };
    
    await set(pendingUserRef, pendingUserData);
    
    return { success: true, tempUserId };
  } catch (error) {
    console.error('Error creating pending user:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get pending user by tempUserId
 * @param {string} tempUserId - Temporary user ID
 * @returns {Promise<Object>} - { success, data, error }
 */
export const getPendingUser = async (tempUserId) => {
  try {
    const pendingUserRef = ref(database, `pending_users/${tempUserId}`);
    const snapshot = await get(pendingUserRef);
    
    if (snapshot.exists()) {
      return { success: true, data: snapshot.val() };
    }
    
    return { success: false, error: 'Pending user not found' };
  } catch (error) {
    console.error('Error getting pending user:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Find pending user by email
 * @param {string} email - User email
 * @returns {Promise<Object>} - { success, data, tempUserId, error }
 */
export const findPendingUserByEmail = async (email) => {
  try {
    const pendingUsersRef = ref(database, 'pending_users');
    const snapshot = await get(pendingUsersRef);
    
    if (snapshot.exists()) {
      const pendingUsers = snapshot.val();
      
      // Find user by email
      for (const [tempUserId, userData] of Object.entries(pendingUsers)) {
        if (userData.email === email) {
          return { success: true, data: userData, tempUserId };
        }
      }
    }
    
    return { success: false, error: 'Pending user not found' };
  } catch (error) {
    console.error('Error finding pending user:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Verify OTP and check if pending user is locked or expired
 * @param {string} tempUserId - Temporary user ID
 * @param {string} otp - OTP code to verify
 * @returns {Promise<Object>} - { success, valid, data, error }
 */
export const verifyPendingUserOTP = async (tempUserId, otp) => {
  try {
    const pendingUserRef = ref(database, `pending_users/${tempUserId}`);
    const snapshot = await get(pendingUserRef);
    
    if (!snapshot.exists()) {
      return { success: false, valid: false, error: 'Pending user not found' };
    }
    
    const pendingUser = snapshot.val();
    const now = Date.now();
    
    // Check if account is locked
    if (pendingUser.lockedUntil && now < pendingUser.lockedUntil) {
      const lockMinutes = Math.ceil((pendingUser.lockedUntil - now) / 60000);
      return { 
        success: false, 
        valid: false, 
        error: `Account locked. Try again in ${lockMinutes} minute(s).`,
        locked: true
      };
    }
    
    // Check if OTP is expired
    if (now > pendingUser.expiryTimestamp) {
      return { 
        success: false, 
        valid: false, 
        error: 'Verification code has expired. Please request a new one.',
        expired: true
      };
    }
    
    // Verify OTP
    if (pendingUser.verificationCode !== otp) {
      // Increment wrong attempts
      const wrongAttempts = (pendingUser.wrongAttempts || 0) + 1;
      const updates = {
        wrongAttempts,
        lastAttemptAt: now
      };
      
      // Lock account after 3 wrong attempts for 5 minutes
      if (wrongAttempts >= 3) {
        updates.lockedUntil = now + (5 * 60 * 1000); // 5 minutes
        await update(pendingUserRef, updates);
        return { 
          success: false, 
          valid: false, 
          error: 'Too many wrong attempts. Account locked for 5 minutes.',
          locked: true
        };
      }
      
      await update(pendingUserRef, updates);
      const remainingAttempts = 3 - wrongAttempts;
      return { 
        success: false, 
        valid: false, 
        error: `Invalid code. ${remainingAttempts} attempt(s) remaining.`,
        remainingAttempts
      };
    }
    
    // OTP is correct
    return { success: true, valid: true, data: pendingUser };
    
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return { success: false, valid: false, error: error.message };
  }
};

/**
 * Update OTP for pending user (resend)
 * @param {string} tempUserId - Temporary user ID
 * @param {string} newVerificationCode - New OTP code
 * @param {number} newExpiryTimestamp - New expiry timestamp
 * @returns {Promise<Object>} - { success, error }
 */
export const updatePendingUserOTP = async (tempUserId, newVerificationCode, newExpiryTimestamp) => {
  try {
    const pendingUserRef = ref(database, `pending_users/${tempUserId}`);
    const snapshot = await get(pendingUserRef);
    
    if (!snapshot.exists()) {
      return { success: false, error: 'Pending user not found' };
    }
    
    await update(pendingUserRef, {
      verificationCode: newVerificationCode,
      expiryTimestamp: newExpiryTimestamp,
      wrongAttempts: 0, // Reset wrong attempts
      lockedUntil: null, // Remove lock
      lastAttemptAt: null
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating pending user OTP:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Move verified user from pending_users to users and create Firebase Auth account
 * @param {string} tempUserId - Temporary user ID
 * @returns {Promise<Object>} - { success, user, userData, error }
 */
export const movePendingUserToVerified = async (tempUserId) => {
  try {
    const pendingUserRef = ref(database, `pending_users/${tempUserId}`);
    const snapshot = await get(pendingUserRef);
    
    if (!snapshot.exists()) {
      return { success: false, error: 'Pending user not found' };
    }
    
    const pendingUser = snapshot.val();
    
    // Create Firebase Auth account
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      pendingUser.email, 
      pendingUser.password
    );
    const user = userCredential.user;
    const timestamp = new Date().toISOString();
    const sanitizedUsername = pendingUser.username?.trim() || '';
    
    // Create user entry in Realtime Database
    const userRef = ref(database, `users/${user.uid}`);
    await set(userRef, {
      uid: user.uid,
      email: pendingUser.email,
      username: sanitizedUsername,
      displayName: sanitizedUsername,
      followerCount: 0,
      followingCount: 0,
      createdAt: timestamp,
      authProvider: 'password',
      auth: {
        providers: ['password'],
        emailVerified: true,
        lastVerificationCheck: timestamp
      },
      preferences: {
        theme: 'system',
        language: 'en',
        region: 'global'
      },
      account: {
        status: 'active',
        deletionRequestedAt: null
      }
    });
    
    // Create username index for fast lookup
    if (sanitizedUsername) {
      const usernameIndexRef = ref(database, `usernames/${sanitizedUsername}`);
      await set(usernameIndexRef, user.uid);
    }
    
    // Create empty profile with firstLoginCompleted: false
    const profileRef = ref(database, `users/${user.uid}/profile`);
    await set(profileRef, {
      username: sanitizedUsername,
      displayName: sanitizedUsername,
      firstName: '',
      bio: '',
      description: '',
      interests: [],
      profilePic: '',
      bannerPic: '',
      firstLoginCompleted: false,
      updatedAt: timestamp
    });
    
    // Delete pending user entry
    await remove(pendingUserRef);
    
    // Fetch user data
    const userSnapshot = await get(userRef);
    const profileSnapshot = await get(profileRef);
    
    let userData = null;
    if (userSnapshot.exists()) {
      userData = userSnapshot.val();
      if (profileSnapshot.exists()) {
        userData.profile = profileSnapshot.val();
      }
    }
    
    return { success: true, user, userData };
  } catch (error) {
    console.error('Error moving pending user to verified:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete pending user (cleanup)
 * @param {string} tempUserId - Temporary user ID
 * @returns {Promise<Object>} - { success, error }
 */
export const deletePendingUser = async (tempUserId) => {
  try {
    const pendingUserRef = ref(database, `pending_users/${tempUserId}`);
    await remove(pendingUserRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting pending user:', error);
    return { success: false, error: error.message };
  }
};


