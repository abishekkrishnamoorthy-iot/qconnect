export const normalizePostType = (type) => {
  if (!type) return 'blog';
  if (type === 'post') return 'blog';
  return type;
};

export const isBlogPost = (type) => normalizePostType(type) === 'blog';

