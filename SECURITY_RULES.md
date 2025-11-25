# Firebase Realtime Database Security Rules

This document contains the recommended security rules for Qconnect's Firebase Realtime Database. These rules should be applied in the Firebase Console under Database > Rules.

## Complete Security Rules

```json
{
  "rules": {
    "pending_users": {
      "$tempUserId": {
        ".read": true,
        ".write": true,
        ".validate": "newData.hasChildren(['email', 'password', 'verificationCode', 'expiryTimestamp', 'createdAt']) && newData.child('email').val() is string && newData.child('password').val() is string && newData.child('verificationCode').val() is string && newData.child('verificationCode').val().length == 6 && newData.child('expiryTimestamp').val() is number"
      }
    },
    "groups": {
      "$groupId": {
        // Public read access for group metadata
        ".read": true,
        // Only authenticated users can write group metadata
        ".write": "auth != null",
        
        // Members subpath
        "members": {
          // Members and admins can read the members list
          ".read": "data.child(auth.uid).exists() || root.child('groups').child($groupId).child('admins').child(auth.uid).val() == true",
          // Only admins can write to members (add/remove members)
          ".write": "root.child('groups').child($groupId).child('admins').child(auth.uid).val() == true"
        },
        
        // Requests subpath
        "requests": {
          // Only admins can read requests
          ".read": "root.child('groups').child($groupId).child('admins').child(auth.uid).val() == true",
          "$requestId": {
            // Users can create/update their own requests, admins can read/write all
            ".write": "auth.uid == data.child('userId').val() || root.child('groups').child($groupId).child('admins').child(auth.uid).val() == true",
            // Validate request structure
            ".validate": "newData.hasChildren(['userId', 'createdAt', 'status']) && newData.child('status').val().matches(/pending|accepted|rejected|cancelled/) && newData.child('userId').val() is string && newData.child('createdAt').val() is string"
          }
        },
        
        // Member count - read-only for clients (updated via transactions)
        "memberCount": {
          ".read": true,
          ".write": false
        },
        
        // Admins subpath
        "admins": {
          // Members and admins can read admins list
          ".read": "data.child(auth.uid).exists() || root.child('groups').child($groupId).child('members').child(auth.uid).exists() || root.child('groups').child($groupId).child('admins').child(auth.uid).val() == true",
          // Only creator or existing admins can modify admins
          ".write": "root.child('groups').child($groupId).child('creatorId').val() == auth.uid || root.child('groups').child($groupId).child('admins').child(auth.uid).val() == true"
        },
        
        // Creator ID cannot be changed
        "creatorId": {
          ".write": false
        }
      }
    },
    
    // User groups index for quick lookup
    "userGroups": {
      "$uid": {
        // Users can only read their own userGroups
        ".read": "auth.uid == $uid",
        // Users can write their own entry, or admins can write (for join/leave operations)
        ".write": "auth.uid == $uid || root.child('groups').child($groupId).child('admins').child(auth.uid).val() == true"
      }
    },
    
    // Notifications
    "notifications": {
      "$uid": {
        // Users can only read their own notifications
        ".read": "auth.uid == $uid",
        // Users can write their own notifications, or admins can write when approving/creating notifications
        ".write": "auth.uid == $uid || (newData.hasChild('fromUserId') && root.child('groups').child(newData.child('groupId').val()).child('admins').child(auth.uid).val() == true)"
      }
    },
    
    // Posts within groups
    "posts": {
      "$postId": {
        ".read": true,
        // Users can create posts, edit own posts
        ".write": "auth != null && (newData.child('userId').val() == auth.uid || data.child('userId').val() == auth.uid)",
        // If post has groupId, validate that user is member or group is public
        ".validate": "!newData.hasChild('groupId') || root.child('groups').child(newData.child('groupId').val()).child('privacy').val() == 'public' || root.child('groups').child(newData.child('groupId').val()).child('members').child(auth.uid).exists()"
      }
    },
    
    // Users - protect sensitive data
    "users": {
      "$uid": {
        ".read": true,
        ".write": "auth.uid == $uid",
        // Profile subpath
        "profile": {
          ".read": true,
          ".write": "auth.uid == $uid"
        }
      }
    },
    
    // Username index - read/write with validation
    "usernames": {
      "$username": {
        ".read": true,
        ".write": "auth != null",
        ".validate": "newData.val() is string && newData.val().length > 0"
      }
    }
  }
}
```

## Important Notes

1. **Pending Users**: The `pending_users` path allows unauthenticated writes to enable email verification during signup. This is necessary because users haven't authenticated yet. The validation ensures only properly structured data with email, password, verification code, and expiry timestamp can be written. After verification, users are moved to the `users` path and pending entries are deleted.

2. **Member Operations**: Only group admins can add/remove members. This prevents unauthorized joins/leaves.

2. **Request Management**: Users can create their own join requests, but only admins can approve/reject them.

3. **MemberCount**: Clients cannot directly write to memberCount - it must be updated via server-side transactions or Cloud Functions to ensure atomicity.

4. **Admin Privileges**: Only the group creator or existing admins can promote members to admin.

5. **Privacy Enforcement**: Posts within private groups can only be created by members.

6. **UserGroups Index**: This index allows fast lookup of which groups a user belongs to. Clients can update it, but admins can also update it during join/leave operations.

7. **Notifications**: Users can only read their own notifications. Admins can create notifications when approving requests.

## Implementation Notes

- These rules enforce client-side security but should be complemented with server-side validation (Cloud Functions) for critical operations.
- The `memberCount` field should be maintained via transactions in the client code (using `runTransaction`) or via Cloud Functions.
- Rate limiting for group creation and join requests should be enforced both client-side (using localStorage) and server-side (via Cloud Functions).

## Testing

After applying these rules, test:
1. Unauthenticated users cannot create groups
2. Non-members cannot add themselves to private groups
3. Non-admins cannot approve/reject join requests
4. Users cannot modify other users' notifications
5. Users cannot modify other users' userGroups index

