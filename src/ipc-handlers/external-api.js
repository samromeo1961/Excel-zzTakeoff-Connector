const axios = require('axios');

/**
 * Whitelist of allowed domains for HTTP requests
 *
 * SECURITY: Only these domains (and their subdomains) can be accessed
 * via the HTTP request handler. This prevents SSRF attacks.
 */
const ALLOWED_DOMAINS = [
  'api.zztakeoff.com',
  'app.zztakeoff.com',
  'zztakeoff.com',
  'www.zztakeoff.com'
  // Add more allowed domains as needed
];

/**
 * Validate URL for security
 *
 * SECURITY CHECKS:
 * 1. Valid URL format
 * 2. HTTPS only (no HTTP)
 * 3. Domain whitelist enforcement
 * 4. Block internal/private IPs
 *
 * @param {string} url - URL to validate
 * @throws {Error} If URL is not allowed
 * @returns {boolean} True if validation passes
 */
function validateUrl(url) {
  let urlObj;

  try {
    urlObj = new URL(url);
  } catch (err) {
    throw new Error('Invalid URL format');
  }

  // 1. Check protocol (only HTTPS allowed for security)
  if (urlObj.protocol !== 'https:') {
    throw new Error('Only HTTPS URLs are allowed. HTTP is not permitted for security reasons.');
  }

  // 2. Check against whitelist
  const isAllowed = ALLOWED_DOMAINS.some(domain =>
    urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
  );

  if (!isAllowed) {
    console.error('[HTTP] Blocked request to non-whitelisted domain:', urlObj.hostname);
    throw new Error(`Domain "${urlObj.hostname}" is not whitelisted. Allowed domains: ${ALLOWED_DOMAINS.join(', ')}`);
  }

  // 3. Block internal/private IPs (prevent SSRF attacks)
  const hostname = urlObj.hostname.toLowerCase();
  const privatePatterns = [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    /^192\.168\./,
    /^10\./,
    /^172\.(1[6-9]|2\d|3[01])\./,  // 172.16.0.0 - 172.31.255.255
    /^169\.254\./,  // Link-local
    '::1',          // IPv6 localhost
    /^fd[0-9a-f]{2}:/i,  // IPv6 private
    /^fe80:/i       // IPv6 link-local
  ];

  const isPrivate = privatePatterns.some(pattern =>
    pattern instanceof RegExp ? pattern.test(hostname) : hostname === pattern
  );

  if (isPrivate) {
    console.error('[HTTP] Blocked request to private IP/hostname:', hostname);
    throw new Error('Cannot access internal/private resources');
  }

  console.log('[HTTP] URL validation passed:', url);
  return true;
}

/**
 * Validate HTTP headers
 *
 * SECURITY: Prevent setting dangerous headers that could be exploited
 *
 * @param {Object} headers - Headers object
 * @throws {Error} If headers contain forbidden values
 * @returns {boolean} True if validation passes
 */
function validateHeaders(headers) {
  if (!headers || typeof headers !== 'object') {
    return true;
  }

  // Headers that should not be set by the client
  const forbiddenHeaders = [
    'host',
    'connection',
    'content-length',
    'transfer-encoding'
    // Authorization and Cookie are allowed for API authentication
  ];

  Object.keys(headers).forEach(header => {
    const headerLower = header.toLowerCase();
    if (forbiddenHeaders.includes(headerLower)) {
      throw new Error(`Header "${header}" is not allowed to be set manually`);
    }
  });

  return true;
}

/**
 * Example: Send data to zzTakeoff external API
 * This demonstrates how to make HTTP calls to external APIs
 * from the main Electron process (serverless architecture)
 *
 * IPC Handler: 'external:send-to-zztakeoff'
 *
 * NOTE: This currently returns sample success response for demonstration.
 * Replace with actual zzTakeoff API calls when API is available.
 */
async function sendToZzTakeoff(event, data) {
  try {
    const { projectId, items } = data;

    // For now, return sample success response
    // TODO: Replace with actual API call when zzTakeoff API is available

    console.log(`[DEMO] Would send ${items.length} item(s) to project ${projectId}`);
    console.log('[DEMO] Items:', JSON.stringify(items, null, 2));

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      success: true,
      message: `Successfully sent ${items.length} item(s) to zzTakeoff (demo mode)`,
      data: {
        itemsCreated: items.length,
        projectId: projectId,
        timestamp: new Date().toISOString()
      }
    };

    /*
    // When real API is available, use this code instead:
    const { apiKey } = data;
    const apiUrl = 'https://api.zztakeoff.com/v1/projects';

    const response = await axios.post(
      `${apiUrl}/${projectId}/items`,
      {
        items: items
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    return {
      success: true,
      message: 'Data sent successfully to zzTakeoff',
      data: response.data
    };
    */

  } catch (err) {
    console.error('Error sending to zzTakeoff:', err);
    return {
      success: false,
      error: 'Failed to send data to zzTakeoff',
      message: err.message,
      statusCode: err.response?.status
    };
  }
}

/**
 * Example: Get projects from zzTakeoff API
 * IPC Handler: 'external:get-zztakeoff-projects'
 *
 * NOTE: This currently returns sample data for demonstration.
 * Replace with actual zzTakeoff API calls when API is available.
 */
async function getZzTakeoffProjects(event, data) {
  try {
    // For now, return sample projects similar to zzTakeoff's structure
    // TODO: Replace with actual API call when zzTakeoff API is available

    // Sample projects matching zzTakeoff's structure
    const sampleProjects = [
      {
        id: 'demo-metric-1',
        name: 'Demo Metric',
        workspace: "zzTakeoff Demo's Projects",
        favorite: false,
        recent: true
      },
      {
        id: 'test-lagging-pdf-1',
        name: 'Test Lagging PDF',
        workspace: "zzTakeoff Demo's Projects",
        favorite: false,
        recent: true
      },
      {
        id: 'american-farmhouse-1',
        name: 'American Farmhouse',
        workspace: "zzTakeoff Demo's Projects",
        favorite: false,
        recent: false
      },
      {
        id: 'commercial-project-1',
        name: 'Commercial Project',
        workspace: "zzTakeoff Demo's Projects",
        favorite: false,
        recent: false
      },
      {
        id: 'farmhouse-1',
        name: 'farmhouse',
        workspace: "zzTakeoff Demo's Projects",
        favorite: false,
        recent: false
      },
      {
        id: 'farmhouse-demo-1',
        name: 'Farmhouse Demo',
        workspace: "zzTakeoff Demo's Projects",
        favorite: false,
        recent: false
      },
      {
        id: 'holidays-1',
        name: 'Holidays',
        workspace: "zzTakeoff Demo's Projects",
        favorite: false,
        recent: false
      }
    ];

    // Get unique workspaces
    const workspaces = [...new Set(sampleProjects.map(p => p.workspace))];

    return {
      success: true,
      data: {
        projects: sampleProjects,
        workspaces: workspaces
      }
    };

    /*
    // When real API is available, use this code instead:
    const { apiKey } = data;
    const apiUrl = 'https://api.zztakeoff.com/v1/projects';

    const response = await axios.get(apiUrl, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });

    return {
      success: true,
      data: response.data
    };
    */

  } catch (err) {
    console.error('Error fetching zzTakeoff projects:', err);
    return {
      success: false,
      error: 'Failed to fetch projects',
      message: err.message,
      statusCode: err.response?.status
    };
  }
}

/**
 * Get zzTakeoff takeoff types
 * IPC Handler: 'external:get-zztakeoff-takeoff-types'
 *
 * NOTE: This currently returns sample data for demonstration.
 * Replace with actual zzTakeoff API calls when API is available.
 */
async function getZzTakeoffTakeoffTypes(event, data) {
  try {
    // Sample takeoff types matching zzTakeoff's structure
    const sampleTakeoffTypes = [
      { id: 'area', name: 'Area' },
      { id: 'linear', name: 'Linear' },
      { id: 'count', name: 'Count' },
      { id: 'volume', name: 'Volume' }
    ];

    return {
      success: true,
      data: sampleTakeoffTypes
    };
  } catch (err) {
    console.error('Error fetching zzTakeoff takeoff types:', err);
    return {
      success: false,
      error: 'Failed to fetch takeoff types',
      message: err.message
    };
  }
}

/**
 * Get zzTakeoff cost types
 * IPC Handler: 'external:get-zztakeoff-cost-types'
 *
 * NOTE: This currently returns sample data for demonstration.
 * Replace with actual zzTakeoff API calls when API is available.
 */
async function getZzTakeoffCostTypes(event, data) {
  try {
    // Sample cost types matching zzTakeoff's structure
    const sampleCostTypes = [
      { id: 'material', name: 'Material' },
      { id: 'labor', name: 'Labor' },
      { id: 'equipment', name: 'Equipment' },
      { id: 'subcontractor', name: 'Subcontractor' }
    ];

    return {
      success: true,
      data: sampleCostTypes
    };
  } catch (err) {
    console.error('Error fetching zzTakeoff cost types:', err);
    return {
      success: false,
      error: 'Failed to fetch cost types',
      message: err.message
    };
  }
}

/**
 * Generic HTTP request handler
 * IPC Handler: 'external:http-request'
 *
 * SECURITY: This handler validates all URLs and headers before making requests
 * to prevent SSRF attacks and unauthorized access.
 *
 * This allows the frontend to make HTTP requests through the main process
 * (useful for external APIs that require CORS bypass)
 */
async function makeHttpRequest(event, config) {
  try {
    const { method, url, data, headers, timeout = 15000 } = config;

    // SECURITY: Validate URL before making request
    validateUrl(url);

    // SECURITY: Validate headers
    validateHeaders(headers);

    // SECURITY: Validate timeout (max 60 seconds to prevent resource exhaustion)
    if (timeout > 60000) {
      throw new Error('Timeout cannot exceed 60 seconds');
    }

    // SECURITY: Validate HTTP method
    const allowedMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
    const httpMethod = (method || 'GET').toUpperCase();
    if (!allowedMethods.includes(httpMethod)) {
      throw new Error(`HTTP method "${httpMethod}" is not allowed`);
    }

    console.log(`[HTTP] Making ${httpMethod} request to ${url}`);

    const response = await axios({
      method: httpMethod,
      url,
      data,
      headers: headers || {},
      timeout,
      maxRedirects: 5,  // Limit redirects
      validateStatus: null  // Don't throw on any status code
    });

    return {
      success: true,
      status: response.status,
      headers: response.headers,
      data: response.data
    };

  } catch (err) {
    console.error('[HTTP] Request error:', err.message);
    return {
      success: false,
      error: 'HTTP request failed',
      message: err.message,
      status: err.response?.status,
      data: err.response?.data
    };
  }
}

module.exports = {
  sendToZzTakeoff,
  getZzTakeoffProjects,
  getZzTakeoffTakeoffTypes,
  getZzTakeoffCostTypes,
  makeHttpRequest
};
