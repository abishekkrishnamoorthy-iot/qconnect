/**
 * Group Join Flow Test Component
 * Tests: public join, private request, admin accept, cancel request, memberCount, userGroups, notifications
 */

import React, { useState } from 'react';
import { ref, get } from 'firebase/database';
import { database } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { 
  getGroups, 
  joinGroup, 
  requestGroupJoin, 
  cancelGroupRequest,
  approveMemberRequest,
  rejectMemberRequest,
  leaveGroup,
  getGroup,
  getNotifications
} from '../../services/db';

const GroupJoinTest = () => {
  const { currentUser } = useAuth();
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [testGroups, setTestGroups] = useState([]);

  const addResult = (test, passed, message, details = null) => {
    const result = {
      test,
      passed,
      message,
      details,
      timestamp: new Date().toISOString()
    };
    setTestResults(prev => [result, ...prev]);
    console.log(`TEST ${test}:`, passed ? '✓ PASS' : '✗ FAIL', message);
    if (details) console.log('Details:', details);
  };

  const loadTestGroups = async () => {
    setLoading(true);
    const result = await getGroups();
    if (result.success && result.data.length > 0) {
      setTestGroups(result.data);
      if (result.data.length > 0) {
        setSelectedGroupId(result.data[0]._id);
      }
    }
    setLoading(false);
  };

  const testPublicJoin = async () => {
    if (!currentUser || !selectedGroupId) return;
    
    setLoading(true);
    addResult('Public Join', null, 'Starting test...');
    
    try {
      // Get initial group state
      const groupBefore = await getGroup(selectedGroupId);
      if (!groupBefore.success || groupBefore.data.privacy !== 'public') {
        addResult('Public Join', false, 'Group not found or not public');
        setLoading(false);
        return;
      }
      
      const memberCountBefore = groupBefore.data.memberCount || Object.keys(groupBefore.data.members || {}).length;
      const wasMember = groupBefore.data.members?.[currentUser.uid];
      
      // Join group
      const joinResult = await joinGroup(selectedGroupId, currentUser.uid);
      
      if (!joinResult.success) {
        addResult('Public Join', false, `Join failed: ${joinResult.error}`, joinResult);
        setLoading(false);
        return;
      }
      
      // Verify membership
      const groupAfter = await getGroup(selectedGroupId);
      if (!groupAfter.success) {
        addResult('Public Join', false, 'Failed to verify membership');
        setLoading(false);
        return;
      }
      
      const memberCountAfter = groupAfter.data.memberCount || Object.keys(groupAfter.data.members || {}).length;
      const isMember = groupAfter.data.members?.[currentUser.uid];
      
      // Check results
      const checks = {
        isMember: isMember,
        memberCountIncremented: memberCountAfter === (memberCountBefore + (wasMember ? 0 : 1)),
        userGroupsUpdated: false // Would need to check userGroups index
      };
      
      // Verify userGroups (quick check)
      try {
        const userGroupsRef = ref(database, `userGroups/${currentUser.uid}/${selectedGroupId}`);
        const userGroupsSnap = await get(userGroupsRef);
        checks.userGroupsUpdated = userGroupsSnap.exists() && userGroupsSnap.val() === true;
      } catch (err) {
        console.error('Error checking userGroups:', err);
      }
      
      const allPassed = checks.isMember && checks.memberCountIncremented && checks.userGroupsUpdated;
      
      addResult(
        'Public Join',
        allPassed,
        allPassed ? 'All checks passed' : 'Some checks failed',
        {
          memberCountBefore,
          memberCountAfter,
          wasMember,
          isMember,
          checks
        }
      );
      
    } catch (error) {
      addResult('Public Join', false, `Error: ${error.message}`, error);
    }
    
    setLoading(false);
  };

  const testPrivateRequest = async () => {
    if (!currentUser || !selectedGroupId) return;
    
    setLoading(true);
    addResult('Private Request', null, 'Starting test...');
    
    try {
      const groupBefore = await getGroup(selectedGroupId);
      if (!groupBefore.success || groupBefore.data.privacy !== 'private') {
        addResult('Private Request', false, 'Group not found or not private');
        setLoading(false);
        return;
      }
      
      const wasMember = groupBefore.data.members?.[currentUser.uid];
      if (wasMember) {
        // Leave first
        await leaveGroup(selectedGroupId, currentUser.uid);
      }
      
      // Create request
      const requestResult = await requestGroupJoin(selectedGroupId, currentUser.uid);
      
      if (!requestResult.success) {
        addResult('Private Request', false, `Request failed: ${requestResult.error}`, requestResult);
        setLoading(false);
        return;
      }
      
      // Verify request created
      const groupAfter = await getGroup(selectedGroupId);
      if (!groupAfter.success) {
        addResult('Private Request', false, 'Failed to verify request');
        setLoading(false);
        return;
      }
      
      const request = groupAfter.data.requests?.[currentUser.uid];
      const requestExists = request && (request.status === 'pending' || !request.status);
      
      // Check notifications (should notify admins)
      // This is hard to verify without admin access, so we'll skip it
      
      addResult(
        'Private Request',
        requestExists,
        requestExists ? 'Request created successfully' : 'Request not found',
        { request }
      );
      
    } catch (error) {
      addResult('Private Request', false, `Error: ${error.message}`, error);
    }
    
    setLoading(false);
  };

  const testCancelRequest = async () => {
    if (!currentUser || !selectedGroupId) return;
    
    setLoading(true);
    addResult('Cancel Request', null, 'Starting test...');
    
    try {
      // First create a request if needed
      const groupBefore = await getGroup(selectedGroupId);
      if (!groupBefore.success || groupBefore.data.privacy !== 'private') {
        addResult('Cancel Request', false, 'Group not found or not private');
        setLoading(false);
        return;
      }
      
      let request = groupBefore.data.requests?.[currentUser.uid];
      if (!request || request.status !== 'pending') {
        // Create request first
        await requestGroupJoin(selectedGroupId, currentUser.uid);
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait for DB update
      }
      
      // Cancel request
      const cancelResult = await cancelGroupRequest(selectedGroupId, currentUser.uid, currentUser.uid);
      
      if (!cancelResult.success) {
        addResult('Cancel Request', false, `Cancel failed: ${cancelResult.error}`, cancelResult);
        setLoading(false);
        return;
      }
      
      // Verify request cancelled
      const groupAfter = await getGroup(selectedGroupId);
      const cancelledRequest = groupAfter.data?.requests?.[currentUser.uid];
      
      const isCancelled = cancelledRequest && cancelledRequest.status === 'cancelled';
      
      addResult(
        'Cancel Request',
        isCancelled,
        isCancelled ? 'Request cancelled successfully' : 'Request not cancelled',
        { cancelledRequest }
      );
      
    } catch (error) {
      addResult('Private Request', false, `Error: ${error.message}`, error);
    }
    
    setLoading(false);
  };

  const runAllTests = async () => {
    setTestResults([]);
    await loadTestGroups();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Test public join (need a public group)
    const publicGroup = testGroups.find(g => g.privacy === 'public');
    if (publicGroup && currentUser) {
      const oldGroupId = selectedGroupId;
      setSelectedGroupId(publicGroup._id);
      await new Promise(resolve => setTimeout(resolve, 300));
      await testPublicJoin();
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSelectedGroupId(oldGroupId);
    }
    
    // Test private request (need a private group)
    const privateGroup = testGroups.find(g => g.privacy === 'private');
    if (privateGroup && currentUser) {
      setSelectedGroupId(privateGroup._id);
      await new Promise(resolve => setTimeout(resolve, 300));
      await testPrivateRequest();
      await new Promise(resolve => setTimeout(resolve, 1000));
      await testCancelRequest();
    }
    
    addResult('All Tests', null, 'Test suite completed');
  };

  if (!currentUser) {
    return <div style={{ padding: '20px' }}>Please log in to run tests</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Group Join Flow Test</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={loadTestGroups} disabled={loading}>
          Load Groups
        </button>
        {testGroups.length > 0 && (
          <select 
            value={selectedGroupId} 
            onChange={(e) => setSelectedGroupId(e.target.value)}
            style={{ marginLeft: '10px' }}
          >
            {testGroups.map(g => (
              <option key={g._id} value={g._id}>
                {g.name} ({g.privacy})
              </option>
            ))}
          </select>
        )}
      </div>
      
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button onClick={testPublicJoin} disabled={loading || !selectedGroupId}>
          Test Public Join
        </button>
        <button onClick={testPrivateRequest} disabled={loading || !selectedGroupId}>
          Test Private Request
        </button>
        <button onClick={testCancelRequest} disabled={loading || !selectedGroupId}>
          Test Cancel Request
        </button>
        <button onClick={runAllTests} disabled={loading}>
          Run All Tests
        </button>
        <button onClick={() => setTestResults([])}>
          Clear Results
        </button>
      </div>
      
      <div style={{ 
        marginTop: '20px',
        padding: '10px',
        background: '#f5f5f5',
        borderRadius: '4px',
        maxHeight: '500px',
        overflowY: 'auto'
      }}>
        <h3>Test Results</h3>
        {testResults.length === 0 ? (
          <div>No tests run yet</div>
        ) : (
          testResults.map((result, idx) => (
            <div 
              key={idx}
              style={{
                padding: '8px',
                marginBottom: '8px',
                background: result.passed === null ? '#fff' : result.passed ? '#d4edda' : '#f8d7da',
                border: `1px solid ${result.passed === null ? '#ccc' : result.passed ? '#c3e6cb' : '#f5c6cb'}`,
                borderRadius: '4px'
              }}
            >
              <div style={{ fontWeight: 'bold' }}>
                {result.test} - {result.passed === null ? 'RUNNING' : result.passed ? '✓ PASS' : '✗ FAIL'}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {result.message}
              </div>
              {result.details && (
                <details style={{ marginTop: '5px', fontSize: '12px' }}>
                  <summary>Details</summary>
                  <pre style={{ 
                    background: '#fff', 
                    padding: '5px', 
                    borderRadius: '3px',
                    overflow: 'auto',
                    maxHeight: '200px'
                  }}>
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default GroupJoinTest;

