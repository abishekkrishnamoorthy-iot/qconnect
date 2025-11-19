/**
 * XSS Protection utilities
 * Sanitizes user input to prevent XSS attacks
 */

/**
 * Escape HTML entities to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
export const escapeHtml = (text) => {
  if (!text || typeof text !== 'string') return ''
  
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  
  return text.replace(/[&<>"']/g, (m) => map[m])
}

/**
 * Sanitize text but allow line breaks (for descriptions)
 * @param {string} text - Text to sanitize
 * @returns {string} Sanitized text
 */
export const sanitizeText = (text) => {
  if (!text || typeof text !== 'string') return ''
  
  // Escape HTML but preserve line breaks by converting to <br> safe format
  let sanitized = escapeHtml(text)
  
  // Allow line breaks by converting \n to space (will be handled by CSS white-space)
  // or can be preserved for textarea display
  return sanitized
}

/**
 * Validate group name
 * @param {string} name - Group name to validate
 * @returns {object} { valid: boolean, error?: string }
 */
export const validateGroupName = (name) => {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Group name is required' }
  }
  
  const trimmed = name.trim()
  
  if (trimmed.length < 3) {
    return { valid: false, error: 'Group name must be at least 3 characters' }
  }
  
  if (trimmed.length > 60) {
    return { valid: false, error: 'Group name must be at most 60 characters' }
  }
  
  // Allowed: letters, numbers, spaces, hyphens, underscores
  const allowedPattern = /^[a-zA-Z0-9\s\-_]+$/
  if (!allowedPattern.test(trimmed)) {
    return { valid: false, error: 'Group name can only contain letters, numbers, spaces, hyphens, and underscores' }
  }
  
  return { valid: true }
}

/**
 * Validate group description
 * @param {string} description - Group description to validate
 * @returns {object} { valid: boolean, error?: string }
 */
export const validateGroupDescription = (description) => {
  if (!description || typeof description !== 'string') {
    return { valid: false, error: 'Description is required' }
  }
  
  const trimmed = description.trim()
  
  if (trimmed.length < 10) {
    return { valid: false, error: 'Description must be at least 10 characters' }
  }
  
  if (trimmed.length > 500) {
    return { valid: false, error: 'Description must be at most 500 characters' }
  }
  
  return { valid: true }
}

/**
 * Validate group category
 * @param {string} category - Category to validate
 * @returns {object} { valid: boolean, error?: string }
 */
export const validateGroupCategory = (category) => {
  const allowedCategories = [
    'Technology',
    'Education',
    'NEET',
    'JEE',
    'Coding',
    'Health',
    'Entertainment',
    'College Life',
    'Others'
  ]
  
  if (!category || typeof category !== 'string') {
    return { valid: false, error: 'Category is required' }
  }
  
  if (!allowedCategories.includes(category)) {
    return { valid: false, error: 'Invalid category' }
  }
  
  return { valid: true }
}

/**
 * Validate group privacy setting
 * @param {string} privacy - Privacy setting to validate
 * @returns {object} { valid: boolean, error?: string }
 */
export const validateGroupPrivacy = (privacy) => {
  const allowedPrivacy = ['public', 'private', 'restricted']
  
  if (!privacy || typeof privacy !== 'string') {
    return { valid: false, error: 'Privacy setting is required' }
  }
  
  if (!allowedPrivacy.includes(privacy)) {
    return { valid: false, error: 'Privacy must be public, private, or restricted' }
  }
  
  return { valid: true }
}

/**
 * Sanitize and validate group data
 * @param {object} groupData - Group data to sanitize and validate
 * @returns {object} { valid: boolean, sanitized?: object, errors?: string[] }
 */
export const sanitizeAndValidateGroup = (groupData) => {
  const errors = []
  const sanitized = {}
  
  // Validate and sanitize name
  const nameValidation = validateGroupName(groupData.name)
  if (!nameValidation.valid) {
    errors.push(nameValidation.error)
  } else {
    sanitized.name = groupData.name.trim()
  }
  
  // Validate and sanitize description
  const descValidation = validateGroupDescription(groupData.description)
  if (!descValidation.valid) {
    errors.push(descValidation.error)
  } else {
    sanitized.description = sanitizeText(groupData.description.trim())
  }
  
  // Validate category
  const categoryValidation = validateGroupCategory(groupData.category)
  if (!categoryValidation.valid) {
    errors.push(categoryValidation.error)
  } else {
    sanitized.category = groupData.category
  }
  
  // Validate privacy
  const privacyValidation = validateGroupPrivacy(groupData.privacy)
  if (!privacyValidation.valid) {
    errors.push(privacyValidation.error)
  } else {
    sanitized.privacy = groupData.privacy
  }
  
  // Other fields (no validation needed, just copy)
  if (groupData.creatorId) sanitized.creatorId = groupData.creatorId
  if (groupData.banner) sanitized.banner = groupData.banner
  if (groupData.icon) sanitized.icon = groupData.icon
  
  if (errors.length > 0) {
    return { valid: false, errors }
  }
  
  return { valid: true, sanitized }
}

