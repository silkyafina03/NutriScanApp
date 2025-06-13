// src/utils/api.js
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Default timeout untuk semua requests
const DEFAULT_TIMEOUT = 10000; // 10 seconds

// Helper function untuk timeout
const fetchWithTimeout = (url, options = {}, timeout = DEFAULT_TIMEOUT) => {
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      reject(new Error('Request timeout'));
    }, timeout);

    fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
      }
    })
    .then(resolve)
    .catch(reject)
    .finally(() => clearTimeout(timeoutId));
  });
};

// Enhanced error handler
const handleApiError = async (response) => {
  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } else {
        const errorText = await response.text();
        if (errorText) {
          errorMessage = errorText;
        }
      }
    } catch (parseError) {
      console.warn('Could not parse error response:', parseError);
    }
    
    const error = new Error(errorMessage);
    error.status = response.status;
    error.statusText = response.statusText;
    throw error;
  }
  
  return response;
};

// GET request dengan error handling
export const getData = async (endpoint, options = {}) => {
  try {
    console.log(`[API GET] ${BASE_URL}${endpoint}`);
    
    const response = await fetchWithTimeout(
      `${BASE_URL}${endpoint}`,
      {
        method: 'GET',
        ...options
      }
    );
    
    await handleApiError(response);
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log(`[API GET Success] ${endpoint}:`, data);
      return data;
    } else {
      const text = await response.text();
      console.log(`[API GET Success] ${endpoint}:`, text);
      return text;
    }
  } catch (error) {
    console.error(`[API GET Error] ${endpoint}:`, error);
    
    // Re-throw dengan informasi tambahan
    const apiError = new Error(error.message);
    apiError.endpoint = endpoint;
    apiError.method = 'GET';
    apiError.status = error.status;
    apiError.originalError = error;
    
    throw apiError;
  }
};

// POST request dengan error handling
export const postData = async (endpoint, data = {}, options = {}) => {
  try {
    console.log(`[API POST] ${BASE_URL}${endpoint}`, data);
    
    const response = await fetchWithTimeout(
      `${BASE_URL}${endpoint}`,
      {
        method: 'POST',
        body: JSON.stringify(data),
        ...options
      }
    );
    
    await handleApiError(response);
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const responseData = await response.json();
      console.log(`[API POST Success] ${endpoint}:`, responseData);
      return responseData;
    } else {
      const text = await response.text();
      console.log(`[API POST Success] ${endpoint}:`, text);
      return text;
    }
  } catch (error) {
    console.error(`[API POST Error] ${endpoint}:`, error);
    
    // Re-throw dengan informasi tambahan
    const apiError = new Error(error.message);
    apiError.endpoint = endpoint;
    apiError.method = 'POST';
    apiError.status = error.status;
    apiError.originalError = error;
    
    throw apiError;
  }
};

// PUT request
export const putData = async (endpoint, data = {}, options = {}) => {
  try {
    console.log(`[API PUT] ${BASE_URL}${endpoint}`, data);
    
    const response = await fetchWithTimeout(
      `${BASE_URL}${endpoint}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
        ...options
      }
    );
    
    await handleApiError(response);
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const responseData = await response.json();
      console.log(`[API PUT Success] ${endpoint}:`, responseData);
      return responseData;
    } else {
      const text = await response.text();
      console.log(`[API PUT Success] ${endpoint}:`, text);
      return text;
    }
  } catch (error) {
    console.error(`[API PUT Error] ${endpoint}:`, error);
    
    const apiError = new Error(error.message);
    apiError.endpoint = endpoint;
    apiError.method = 'PUT';
    apiError.status = error.status;
    apiError.originalError = error;
    
    throw apiError;
  }
};

// DELETE request
export const deleteData = async (endpoint, options = {}) => {
  try {
    console.log(`[API DELETE] ${BASE_URL}${endpoint}`);
    
    const response = await fetchWithTimeout(
      `${BASE_URL}${endpoint}`,
      {
        method: 'DELETE',
        ...options
      }
    );
    
    await handleApiError(response);
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const responseData = await response.json();
      console.log(`[API DELETE Success] ${endpoint}:`, responseData);
      return responseData;
    } else {
      const text = await response.text();
      console.log(`[API DELETE Success] ${endpoint}:`, text);
      return text;
    }
  } catch (error) {
    console.error(`[API DELETE Error] ${endpoint}:`, error);
    
    const apiError = new Error(error.message);
    apiError.endpoint = endpoint;
    apiError.method = 'DELETE';
    apiError.status = error.status;
    apiError.originalError = error;
    
    throw apiError;
  }
};

// Upload file (multipart/form-data)
export const uploadFile = async (endpoint, formData, options = {}) => {
  try {
    console.log(`[API UPLOAD] ${BASE_URL}${endpoint}`);
    
    const response = await fetchWithTimeout(
      `${BASE_URL}${endpoint}`,
      {
        method: 'POST',
        body: formData,
        // Don't set Content-Type for FormData, browser will set it automatically
        headers: {
          'Accept': 'application/json',
          ...options.headers
        },
        ...options
      }
    );
    
    await handleApiError(response);
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const responseData = await response.json();
      console.log(`[API UPLOAD Success] ${endpoint}:`, responseData);
      return responseData;
    } else {
      const text = await response.text();
      console.log(`[API UPLOAD Success] ${endpoint}:`, text);
      return text;
    }
  } catch (error) {
    console.error(`[API UPLOAD Error] ${endpoint}:`, error);
    
    const apiError = new Error(error.message);
    apiError.endpoint = endpoint;
    apiError.method = 'POST (UPLOAD)';
    apiError.status = error.status;
    apiError.originalError = error;
    
    throw apiError;
  }
};

// Health check utility
export const checkApiHealth = async () => {
  try {
    const response = await fetchWithTimeout(`${BASE_URL}/health`, {}, 5000);
    return response.ok;
  } catch (error) {
    console.warn('API health check failed:', error);
    return false;
  }
};

// Get API base URL (useful for debugging)
export const getApiBaseUrl = () => BASE_URL;

// Export BASE_URL for components that need it
export { BASE_URL };

// Default export dengan semua functions
export default {
  getData,
  postData,
  putData,
  deleteData,
  uploadFile,
  checkApiHealth,
  getApiBaseUrl,
  BASE_URL
};