export function createApiClient({ baseUrl = "" } = {}) {
  async function request(path, { method = "GET", body } = {}) {
    // Get auth token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const userId = (() => {
      if (typeof window === 'undefined') return null;
      try {
        const raw = localStorage.getItem('user_data');
        const obj = raw ? JSON.parse(raw) : null;
        return obj?.id ?? null;
      } catch (_e) {
        return null;
      }
    })();
    
    const res = await fetch(baseUrl + path, {
      method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        // Add authorization header if token exists
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(userId != null && { "X-User-Id": String(userId) }),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const contentType = res.headers.get("content-type") || "";
      let errorData;
      
      if (contentType.includes("application/json")) {
        errorData = await res.json().catch(() => ({}));
      } else {
        const text = await res.text().catch(() => "");
        errorData = { message: text || res.statusText };
      }
      
      const errorMessage = errorData.message || `Request failed (${res.status})`;
      const error = new Error(errorMessage);
      error.status = res.status;
      error.data = errorData;
      throw error;
    }

    if (res.status === 204) {
      return null;
    }

    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return res.json();
    }

    const text = await res.text().catch(() => "");
    if (!text) {
      return null;
    }
    throw new Error(`Expected JSON but received: ${contentType || "unknown"}. Body: ${text}`);
  }

  function get(path) {
    return request(path, { method: "GET" });
  }

  function post(path, body) {
    return request(path, { method: "POST", body });
  }

  function put(path, body) {
    return request(path, { method: "PUT", body });
  }

  function del(path) {
    return request(path, { method: "DELETE" });
  }

  return { get, post, put, delete: del };
}

export const backendApi = createApiClient({ baseUrl: "api.yashrajent.com/api" });

export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
