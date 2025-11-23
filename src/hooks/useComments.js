import { useState, useEffect, useCallback } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { database } from '../firebase/config';
import { addCommentToPost } from '../services/db';

const sortComments = (comments) =>
  [...comments].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

const normalizeComment = (key, value) => ({
  id: key,
  uid: value.uid,
  username: value.username || 'Qconnect user',
  profilePic: value.profilePic || '',
  text: value.text || '',
  createdAt: value.createdAt || 0,
});

export const useComments = (postId) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(!!postId);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!postId) return undefined;

    setLoading(true);
    const commentsRef = ref(database, `posts/${postId}/comments`);

    const unsubscribe = onValue(
      commentsRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setComments([]);
        } else {
          const value = snapshot.val();
          const parsed = Object.entries(value).map(([key, val]) =>
            normalizeComment(key, val)
          );
          setComments(sortComments(parsed));
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error loading comments:', err);
        setError(err.message || 'Failed to load comments');
        setLoading(false);
      }
    );

    return () => {
      off(commentsRef);
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [postId]);

  const addComment = useCallback(
    async ({ uid, username, profilePic, text }) => {
      if (!postId || !uid || !text?.trim()) {
        return { success: false, error: 'Invalid comment payload' };
      }

      setSubmitting(true);
      setError('');
      const payload = {
        uid,
        username: username || 'Qconnect user',
        profilePic: profilePic || '',
        text: text.trim(),
      };

      const result = await addCommentToPost(postId, payload);
      if (!result.success) {
        setError(result.error || 'Failed to add comment');
      }
      setSubmitting(false);
      return result;
    },
    [postId]
  );

  return {
    comments,
    loading,
    error,
    submitting,
    addComment,
  };
};

export default useComments;

