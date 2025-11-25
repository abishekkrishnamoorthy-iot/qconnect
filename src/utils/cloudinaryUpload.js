/**
 * Upload file to Cloudinary using unsigned upload preset
 * @param {File} file - File to upload
 * @param {number} retryAttempt - Current retry attempt (internal use)
 * @returns {Promise<string>} - Returns Cloudinary secure URL
 */
export async function uploadToCloudinary(file, retryAttempt = 0) {
  const MAX_RETRIES = 2;
  const RETRY_DELAY = 500; // ms
  
  // Get values from environment variables - required
  const cloud_name = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
  const upload_preset = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;

  if (!cloud_name || !upload_preset) {
    throw new Error(
      'Missing required Cloudinary environment variables. Please set REACT_APP_CLOUDINARY_CLOUD_NAME ' +
      'and REACT_APP_CLOUDINARY_UPLOAD_PRESET in your .env file. See .env.example for reference.'
    );
  }

  const endpoint = `https://api.cloudinary.com/v1_1/${cloud_name}/auto/upload`;

  // Start debug logging
  console.group("CLOUDINARY UPLOAD DEBUG");
  console.log("Uploading to Cloudinary:", {
    name: file.name,
    type: file.type,
    size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
    lastModified: new Date(file.lastModified).toISOString()
  });
  console.log("Preset:", upload_preset);
  console.log("Cloud:", cloud_name);
  console.log("Endpoint:", endpoint);
  console.log("Using env vars:", usingEnvVars);
  console.log("Attempt:", retryAttempt + 1);

  try {
    // Create FormData - For unsigned uploads, ONLY include file and upload_preset
    // Do NOT include cloud_name, api_key, or api_secret
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", upload_preset);

    console.log("FormData created (file + upload_preset only)");

    // Upload to Cloudinary
    console.log("Sending upload request...");
    const response = await fetch(endpoint, {
      method: "POST",
      body: formData,
    });

    console.log("Response status:", response.status, response.statusText);

    // Handle non-OK responses
    if (!response.ok) {
      let errorMessage = `Upload failed: ${response.statusText}`;
      
      // Try to parse error from response
      try {
        const errorData = await response.json();
        console.error("Cloudinary error response:", errorData);
        console.log("Cloudinary Response:", errorData);
        
        // Extract error message from nested structure
        if (errorData.error) {
          // Check for nested error object: error.error.message or error.message
          if (typeof errorData.error === 'object' && errorData.error.message) {
            errorMessage = errorData.error.message;
          } else if (typeof errorData.error === 'string') {
            errorMessage = errorData.error;
          } else {
            errorMessage = JSON.stringify(errorData.error);
          }
          
          // Specific handling for "Upload preset not found" errors
          if (errorMessage.includes("preset") || errorMessage.includes("Preset")) {
            errorMessage = `Cloudinary Upload Preset '${upload_preset}' is missing or invalid.`;
          } else {
            errorMessage = `Cloudinary error: ${errorMessage}`;
          }
        } else if (errorData.message) {
          // Top-level message
          errorMessage = `Cloudinary error: ${errorData.message}`;
        }
      } catch (parseError) {
        console.warn("Could not parse error response:", parseError);
        errorMessage = `Upload failed: ${response.statusText}`;
      }

      // Retry logic for network/timeout errors
      const isRetryableError = !response.ok && (response.status >= 500 || response.status === 0);
      
      if (isRetryableError && retryAttempt < MAX_RETRIES) {
        console.log(`Retryable error detected. Retrying in ${RETRY_DELAY}ms... (Attempt ${retryAttempt + 1}/${MAX_RETRIES})`);
        console.groupEnd();
        
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return uploadToCloudinary(file, retryAttempt + 1);
      }

      console.error("Upload failed:", errorMessage);
      console.groupEnd();
      throw new Error(errorMessage);
    }

    // Parse response
    const data = await response.json();
    console.log("Cloudinary Response:", data);
    console.log("Full Cloudinary response:", data);

    // Validate secure_url exists
    if (!data.secure_url) {
      console.error("Invalid response: missing secure_url", data);
      console.groupEnd();
      throw new Error("Invalid Cloudinary response: missing secure_url");
    }

    // Validate URL format
    const secure_url = data.secure_url;
    const expectedUrlPattern = `https://res.cloudinary.com/${cloud_name}/`;
    
    if (!secure_url.startsWith(expectedUrlPattern)) {
      console.error("Invalid URL format:", secure_url);
      console.groupEnd();
      throw new Error(`Invalid Cloudinary URL format. Expected to start with: ${expectedUrlPattern}`);
    }

    console.log("Secure URL extracted:", secure_url);
    console.log("✓ Upload successful");
    console.groupEnd();

    return secure_url;
  } catch (error) {
    // Handle network errors with retry
    const isNetworkError = error instanceof TypeError || error.message.includes("fetch") || error.message.includes("network");
    
    if (isNetworkError && retryAttempt < MAX_RETRIES) {
      console.log(`Network error detected. Retrying in ${RETRY_DELAY}ms... (Attempt ${retryAttempt + 1}/${MAX_RETRIES})`);
      console.groupEnd();
      
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return uploadToCloudinary(file, retryAttempt + 1);
    }

    console.error("Upload error:", error);
    console.groupEnd();
    throw error;
  }
}

