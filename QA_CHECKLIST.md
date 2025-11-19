# Group Join Flows - QA Checklist

## Manual Testing Checklist

### Public Group Join Flow
- [ ] **Join Button Visible**: For public groups, "Join" button is visible to non-members
- [ ] **Immediate Membership**: Clicking "Join" adds user to group immediately
- [ ] **Member Status**: After joining, "Member" label and "Leave" button appear
- [ ] **Atomic Updates**: Member added to `groups/{groupId}/members/{uid}`
- [ ] **UserGroups Index**: Entry created in `userGroups/{uid}/{groupId}`
- [ ] **MemberCount Incremented**: `groups/{groupId}/memberCount` increases by 1
- [ ] **Success Toast**: Shows "You joined {groupName}" message
- [ ] **UI Update**: Group card updates to show member status
- [ ] **Duplicate Prevention**: Attempting to join twice doesn't create duplicate members
- [ ] **Transaction Safety**: Multiple simultaneous joins don't cause count mismatch

### Private Group Request Flow
- [ ] **Request Button Visible**: For private groups, "Request to Join" button is visible to non-members
- [ ] **Request Creation**: Clicking creates entry in `groups/{groupId}/requests/{userId}`
- [ ] **Request Status**: Request has status "pending"
- [ ] **Admin Notification**: All group admins receive notification with type "group_request"
- [ ] **Button State**: Button changes to "Request sent" or "Cancel Request"
- [ ] **Duplicate Prevention**: Cannot create duplicate pending requests
- [ ] **Rate Limiting**: Rate limit prevents requests within 10 seconds

### Admin Approval Flow
- [ ] **Notification Display**: Admin sees join request notification in notification panel
- [ ] **Requester Info**: Notification shows requester username and profile pic
- [ ] **Accept Button**: Accept button visible on group_request notifications
- [ ] **Reject Button**: Reject button visible on group_request notifications
- [ ] **Accept Action**: Clicking Accept adds member atomically
- [ ] **UserGroups Update**: `userGroups/{userId}/{groupId}` created on accept
- [ ] **MemberCount Update**: `memberCount` incremented on accept
- [ ] **Request Status**: Request status updated to "accepted"
- [ ] **Requester Notification**: Requester receives "group_request_response" notification
- [ ] **Notification Marked Read**: Admin notification marked as read after action
- [ ] **Race Condition**: Multiple admins accepting same request doesn't create duplicates
- [ ] **Already Member**: If user already member, admin action returns success without duplicate

### Admin Rejection Flow
- [ ] **Reject Action**: Clicking Reject updates request status to "rejected"
- [ ] **Requester Notification**: Requester receives rejection notification
- [ ] **Notification Marked Read**: Admin notification marked as read
- [ ] **No Membership**: User does NOT become member after rejection

### Cancel Request Flow
- [ ] **Cancel Button**: "Cancel Request" button visible when request is pending
- [ ] **Request Removal**: Clicking removes request or sets status to "cancelled"
- [ ] **Button Reverts**: Button returns to "Request to Join"
- [ ] **Unauthorized Cancel**: Cannot cancel other users' requests

### Member Count Accuracy
- [ ] **Initial Count**: Group creation initializes `memberCount` to 1 (creator)
- [ ] **Join Increments**: Public join increments count correctly
- [ ] **Accept Increments**: Admin accept increments count correctly
- [ ] **Leave Decrements**: Leave decreases count correctly
- [ ] **Remove Decrements**: Admin remove member decreases count correctly
- [ ] **Transaction Safety**: Count updates are atomic via transactions
- [ ] **Race Condition**: Concurrent operations don't cause count mismatch

### UserGroups Index
- [ ] **Join Creates Entry**: Joining public group creates `userGroups/{uid}/{groupId}` entry
- [ ] **Accept Creates Entry**: Admin accept creates `userGroups/{uid}/{groupId}` entry
- [ ] **Leave Removes Entry**: Leaving group removes `userGroups/{uid}/{groupId}` entry
- [ ] **Remove Removes Entry**: Admin remove member removes entry
- [ ] **Atomic Updates**: userGroups updated atomically with member operations

### Input Validation
- [ ] **Group Name**: Validates 3-60 characters, alphanumeric + spaces/hyphens/underscores only
- [ ] **Description**: Validates 10-500 characters
- [ ] **Category**: Must be from allowed list
- [ ] **Privacy**: Must be 'public', 'private', or 'restricted'
- [ ] **XSS Prevention**: HTML entities escaped in group name/description display
- [ ] **Client Validation**: Frontend validation shows errors before submit
- [ ] **Server Validation**: Backend validation rejects invalid data

### Rate Limiting
- [ ] **Group Creation**: Rate limited to 1 per 60 seconds (client-side)
- [ ] **Join Request**: Rate limited to 1 per 10 seconds per group (server + client)
- [ ] **Error Messages**: Rate limit errors show wait time clearly

### Security
- [ ] **Unauthorized Join**: Non-authenticated users cannot join groups
- [ ] **Private Group Privacy**: Non-members cannot see private group member lists
- [ ] **Admin Only Approve**: Only admins can approve/reject requests
- [ ] **Request Ownership**: Users can only cancel their own requests
- [ ] **Firebase Rules**: Security rules prevent unauthorized writes

### Notifications
- [ ] **Request Notification**: Admins receive notification when user requests to join
- [ ] **Accept Notification**: Requester receives notification when request accepted
- [ ] **Reject Notification**: Requester receives notification when request rejected
- [ ] **Notification Display**: Notifications show correctly in notification panel
- [ ] **Real-time Updates**: Notifications update in real-time via subscription

### Edge Cases
- [ ] **Leave After Request**: Can leave group after pending request (request remains)
- [ ] **Join After Rejection**: Can request again after rejection (after rate limit)
- [ ] **Double Accept**: Two admins accepting same request doesn't duplicate member
- [ ] **Count Recovery**: If memberCount update fails, member still added (count can be recalculated)
- [ ] **Network Failure**: Partial failures handled gracefully
- [ ] **Group Deletion**: Group deletion cleans up userGroups index for all members

### UI/UX
- [ ] **Loading States**: Buttons show loading state during operations
- [ ] **Error Messages**: Clear error messages shown to user
- [ ] **Success Feedback**: Success toasts/indicators shown after operations
- [ ] **Button States**: Buttons disabled appropriately during operations
- [ ] **Member Label**: "Member" label appears for members
- [ ] **No Flash**: No UI flash when navigating between pages

### Smoke Test Script
Run the automated test component at `/debug/GroupJoinTest`:
- [ ] Test Public Join completes
- [ ] Test Private Request completes
- [ ] Test Cancel Request completes
- [ ] All automated checks pass

## Test Scenarios

### Scenario 1: Public Group Join
1. Find a public group
2. Verify "Join" button visible
3. Click Join
4. Verify immediate membership
5. Verify memberCount incremented
6. Verify userGroups entry created
7. Click Leave
8. Verify membership removed
9. Verify memberCount decremented

### Scenario 2: Private Group Request → Admin Accept
1. Find a private group
2. Click "Request to Join"
3. Verify request created in DB
4. Login as admin
5. Verify notification received
6. Click Accept in notification
7. Login as requester
8. Verify membership granted
9. Verify notification received
10. Verify memberCount updated

### Scenario 3: Private Group Request → Cancel
1. Request to join private group
2. Verify "Cancel Request" button appears
3. Click Cancel
4. Verify request removed/cancelled
4. Verify button reverts to "Request to Join"

### Scenario 4: Concurrent Operations
1. Two admins approve same request simultaneously
2. Verify only one member entry created
3. Verify memberCount incremented only once

## Known Issues / Notes

- Rate limiting is client-side only (localStorage) - server-side rate limiting requires Cloud Functions
- memberCount may temporarily be inaccurate if transaction fails (acceptable - can be recalculated)
- Admin notifications for group requests are not automatically cleaned up when user cancels (acceptable - will show as cancelled)

## Pass Criteria

All checkboxes above must be checked for production deployment.

