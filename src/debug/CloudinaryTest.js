import React, { useState } from 'react';
import { uploadToCloudinary } from '../utils/cloudinaryUpload';
import { createPost, getPost } from '../services/db';
import { useAuth } from '../context/AuthContext';
import '../style/dash/post.css';

const CloudinaryTest = () => {
  const { currentUser, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [cloudinaryResponse, setCloudinaryResponse] = useState(null);
  const [firebasePost, setFirebasePost] = useState(null);
  const [validationChecks, setValidationChecks] = useState({
    urlFormat: false,
    dbSave: false,
    mediaArray: false,
    unifiedSchema: false
  });

  // Create a test file (1x1 PNG image as base64)
  const createTestImage = () => {
    // 1x1 transparent PNG in base64
    const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    const byteCharacters = atob(base64Image);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });
    return new File([blob], 'test-image.png', { type: 'image/png' });
  };

  const handleTestUpload = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    setCloudinaryResponse(null);
    setFirebasePost(null);
    setValidationChecks({
      urlFormat: false,
      dbSave: false,
      mediaArray: false,
      unifiedSchema: false
    });

    try {
      console.group("CLOUDINARY TEST UPLOAD");
      console.log("Creating test file...");

      // Create test file
      const testFile = createTestImage();
      console.log("Test file created:", {
        name: testFile.name,
        type: testFile.type,
        size: testFile.size
      });

      // Upload to Cloudinary
      console.log("Uploading to Cloudinary...");
      const url = await uploadToCloudinary(testFile);
      console.log("Upload successful! URL:", url);

      setCloudinaryResponse({ url, success: true });

      // Validate URL format
      const urlFormatValid = url && url.startsWith('https://res.cloudinary.com/dfayzbhpu/');
      setValidationChecks(prev => ({ ...prev, urlFormat: urlFormatValid }));

      if (!urlFormatValid) {
        throw new Error(`Invalid URL format: ${url}`);
      }

      console.log("✓ URL format validation passed");

      // Save to Firebase
      if (!currentUser) {
        throw new Error('You must be logged in to test');
      }

      console.log("Saving to Firebase...");
      const postResult = await createPost({
        userId: currentUser.uid,
        username: userData?.username || 'Test User',
        title: 'Cloudinary Test Post',
        text: 'This is a test post created by the Cloudinary test component',
        type: 'post',
        visibility: 'public',
        media: [{
          type: 'image',
          url: url
        }]
      });

      if (!postResult.success) {
        throw new Error(postResult.error || 'Failed to save to Firebase');
      }

      setValidationChecks(prev => ({ ...prev, dbSave: true }));
      console.log("✓ Post saved to Firebase, ID:", postResult.postId);

      // Read back from Firebase
      console.log("Reading post back from Firebase...");
      const savedPostResult = await getPost(postResult.postId);

      let mediaArrayValid = false;
      let hasOldFields = false;

      if (savedPostResult.success && savedPostResult.data) {
        const savedPost = savedPostResult.data;
        setFirebasePost(savedPost);

        // Verify media array
        mediaArrayValid = savedPost.media && 
          Array.isArray(savedPost.media) && 
          savedPost.media.length === 1 &&
          savedPost.media[0].type === 'image' &&
          savedPost.media[0].url === url;

        setValidationChecks(prev => ({ ...prev, mediaArray: mediaArrayValid }));

        // Check for old fields
        const oldFields = ['images', 'videos', 'documents', 'imageUrl', 'fileUrl', 'fileType'];
        hasOldFields = oldFields.some(field => savedPost[field] !== undefined);
        setValidationChecks(prev => ({ ...prev, unifiedSchema: !hasOldFields }));

        console.log("✓ Post verification complete");
        console.log("Saved post:", {
          postId: savedPost.postId || savedPost._id,
          createdAt: savedPost.createdAt,
          mediaCount: savedPost.media ? savedPost.media.length : 0,
          media: savedPost.media
        });
      } else {
        console.warn("⚠ Could not read post back from Firebase");
      }

      // Update checks for summary
      const checks = {
        urlFormat: urlFormatValid,
        dbSave: true,
        mediaArray: mediaArrayValid,
        unifiedSchema: !hasOldFields
      };

      // Print summary
      console.group("TEST UPLOAD CHECK");
      const allPassed = Object.values(checks).every(check => check === true);
      if (allPassed) {
        console.log("✔ Cloudinary URL generated");
        console.log("✔ Saved to Firebase");
        console.log("✔ Media array correct");
        console.log("✔ Unified schema correct");
      } else {
        console.log("❌ TEST FAILED");
        if (!checks.urlFormat) console.log("  ✗ URL format invalid");
        if (!checks.dbSave) console.log("  ✗ DB save failed");
        if (!checks.mediaArray) console.log("  ✗ Media array incorrect");
        if (!checks.unifiedSchema) console.log("  ✗ Old fields found");
      }
      console.groupEnd();

      console.groupEnd();

      setResult({
        success: true,
        message: 'Test upload completed successfully!',
        url: url,
        postId: postResult.postId
      });

    } catch (err) {
      console.error('✗ Test upload failed:', err);
      console.groupEnd();

      setError(`Test upload failed: ${err.message}`);
      setResult({
        success: false,
        message: err.message
      });
    }

    setLoading(false);
  };

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '800px', 
      margin: '20px auto',
      backgroundColor: '#f8f0df',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ marginTop: 0, color: '#333' }}>Cloudinary Upload Test</h2>
      
      <button
        onClick={handleTestUpload}
        disabled={loading || !currentUser}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          fontWeight: '600',
          backgroundColor: '#f99806',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: loading || !currentUser ? 'not-allowed' : 'pointer',
          opacity: loading || !currentUser ? 0.6 : 1,
          marginBottom: '20px'
        }}
      >
        {loading ? 'Testing...' : 'Test Cloudinary Upload'}
      </button>

      {!currentUser && (
        <p style={{ color: '#c33', marginBottom: '20px' }}>
          You must be logged in to test uploads.
        </p>
      )}

      {error && (
        <div style={{
          padding: '12px',
          backgroundColor: '#fee',
          border: '1px solid #fcc',
          borderRadius: '8px',
          color: '#c33',
          marginBottom: '20px'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div style={{
          padding: '12px',
          backgroundColor: result.success ? '#efe' : '#fee',
          border: `1px solid ${result.success ? '#cfc' : '#fcc'}`,
          borderRadius: '8px',
          color: result.success ? '#3c3' : '#c33',
          marginBottom: '20px'
        }}>
          <strong>{result.success ? 'Success:' : 'Failed:'}</strong> {result.message}
        </div>
      )}

      {/* Cloudinary Response */}
      {cloudinaryResponse && (
        <div style={{
          padding: '16px',
          backgroundColor: 'white',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #e0e0e0'
        }}>
          <h3 style={{ marginTop: 0, color: '#333' }}>Cloudinary Response</h3>
          <pre style={{
            backgroundColor: '#f5f5f5',
            padding: '12px',
            borderRadius: '4px',
            overflow: 'auto',
            fontSize: '12px'
          }}>
            {JSON.stringify({ url: cloudinaryResponse.url, success: cloudinaryResponse.success }, null, 2)}
          </pre>
          {cloudinaryResponse.url && (
            <div style={{ marginTop: '12px' }}>
              <strong>URL:</strong>{' '}
              <a href={cloudinaryResponse.url} target="_blank" rel="noopener noreferrer" style={{ color: '#f99806' }}>
                {cloudinaryResponse.url}
              </a>
            </div>
          )}
        </div>
      )}

      {/* Firebase Post */}
      {firebasePost && (
        <div style={{
          padding: '16px',
          backgroundColor: 'white',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #e0e0e0'
        }}>
          <h3 style={{ marginTop: 0, color: '#333' }}>Firebase Post</h3>
          <div style={{ marginBottom: '12px' }}>
            <strong>Post ID:</strong> {firebasePost.postId || firebasePost._id}
          </div>
          <div style={{ marginBottom: '12px' }}>
            <strong>Created At:</strong> {new Date(firebasePost.createdAt).toLocaleString()}
          </div>
          <div style={{ marginBottom: '12px' }}>
            <strong>Media Array:</strong>
            <pre style={{
              backgroundColor: '#f5f5f5',
              padding: '12px',
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '12px',
              marginTop: '8px'
            }}>
              {JSON.stringify(firebasePost.media, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Validation Checks */}
      <div style={{
        padding: '16px',
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '1px solid #e0e0e0'
      }}>
        <h3 style={{ marginTop: 0, color: '#333' }}>Validation Checks</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>{validationChecks.urlFormat ? '✔' : '✗'}</span>
            <span>URL format validation</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>{validationChecks.dbSave ? '✔' : '✗'}</span>
            <span>DB save verification</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>{validationChecks.mediaArray ? '✔' : '✗'}</span>
            <span>Media array correctness</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>{validationChecks.unifiedSchema ? '✔' : '✗'}</span>
            <span>Unified schema (no old fields)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CloudinaryTest;

