/**
 * MSukasha — api.js v2
 * Works as a local auth helper for the static site.
 * Place AFTER main.js on every HTML page.
 */

const API = (window.MSUKASHA_API_BASE || localStorage.getItem("msukasha_api_base") || "https://msukasha-backend-git-main-msukasha.vercel.app").replace(/\/$/, "");
const USE_REMOTE_API = true;

/* ============================================================
   TOKEN & USER HELPERS
   ============================================================ */
function getToken()    { return localStorage.getItem("ms_token") || ""; }
function setToken(t)   { localStorage.setItem("ms_token", t); }
function removeToken() { localStorage.removeItem("ms_token"); }

function getUser() {
  try { return JSON.parse(localStorage.getItem('msukasha_user') || 'null'); } catch { return null; }
}
function setUser(user) {
  if (!user) return;
  localStorage.setItem('msukasha_user', JSON.stringify(user));
}

function getUsers() {
  try { return JSON.parse(localStorage.getItem('msukasha_users') || '[]'); } catch { return []; }
}
function saveUsers(users) {
  localStorage.setItem('msukasha_users', JSON.stringify(users));
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    "Authorization": "Bearer " + getToken()
  };
}

/* ============================================================
   BASE FETCH
   ============================================================ */
function buildApiUrl(path) {
  return `${API}${path.startsWith('/') ? '' : '/'}${path.replace(/^\/+/, '')}`;
}

function normalizeAuthResult(data, fallbackUser = null) {
  const token = data?.token || data?.accessToken || data?.jwt || data?.authToken || '';
  const user = data?.user || data?.profile || data?.data || fallbackUser || null;
  if (user && !user.uid) {
    user.uid = user.id || user._id || (user.email ? 'remote_' + user.email.trim().toLowerCase() : 'remote_user');
  }
  return { token, user };
}

async function apiFetch(path, options = {}) {
  if (!USE_REMOTE_API) {
    throw new Error('Remote API disabled.');
  }
  const url = buildApiUrl(path);
  const headers = {
    Accept: 'application/json',
    ...(options.headers || {})
  };

  try {
    const res = await fetch(url, { ...options, headers });
    const text = await res.text();
    let data = {};
    if (text) {
      try { data = JSON.parse(text); } catch { data = { message: text }; }
    }
    if (!res.ok) throw new Error(data.error || data.message || data.detail || 'Request failed');
    return data;
  } catch (e) {
    throw e;
  }
}

function makeSessionToken(email) {
  return 'msukasha_' + email.trim().toLowerCase() + '_' + Date.now();
}

function createLocalUser({ firstName = '', lastName = '', name = '', email, password, phone = '', city = '', role = 'buyer', accountType = 'buyer' }) {
  const fullName = name || `${firstName} ${lastName}`.trim();
  const normalizedEmail = (email || '').trim().toLowerCase();
  return {
    uid: 'local_' + normalizedEmail,
    name: fullName || normalizedEmail,
    firstName: firstName.trim() || fullName.split(' ')[0] || '',
    lastName: lastName.trim() || fullName.split(' ').slice(1).join(' ') || '',
    email: normalizedEmail,
    phone: phone.trim(),
    city: city || '',
    role: role || accountType || 'buyer',
    accountType: accountType || role || 'buyer',
    password: password,
    createdAt: new Date().toISOString(),
    orders: [],
    wishlist: [],
    messages: [],
    profile: {
      about: '',
      address: '',
      joinedAt: new Date().toISOString(),
    }
  };
}

function registerLocalUser(data) {
  const users = getUsers();
  const email = (data.email || '').trim().toLowerCase();
  if (!email || !data.password) {
    throw new Error('Email and password are required.');
  }
  if (users.some(user => user.email === email)) {
    throw new Error('This email is already registered.');
  }
  const user = createLocalUser(data);
  users.push(user);
  saveUsers(users);
  setToken(makeSessionToken(email));
  setUser(user);
  return { token: getToken(), user };
}

function loginLocalUser(email, password) {
  const users = getUsers();
  const normalizedEmail = (email || '').trim().toLowerCase();
  const user = users.find(u => u.email === normalizedEmail);
  if (!user) {
    throw new Error('No account found with that email. Please register first.');
  }
  if (user.password !== password) {
    throw new Error('Incorrect password. Please try again.');
  }
  setToken(makeSessionToken(normalizedEmail));
  setUser(user);
  return { token: getToken(), user };
}

/* ============================================================
   AUTH
   ============================================================ */
async function apiRegister(payload) {
  try {
    const data = await apiFetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const auth = normalizeAuthResult(data);
    if (auth.token) setToken(auth.token);
    if (auth.user) setUser(auth.user);
    return auth;
  } catch (error) {
    console.warn("Remote register failed, using local fallback:", error.message);
    return registerLocalUser(payload);
  }
}

async function apiLogin(email, password) {
  try {
    const data = await apiFetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const auth = normalizeAuthResult(data);
    if (auth.token) setToken(auth.token);
    if (auth.user) setUser(auth.user);
    if (auth.user?.uid) {
      await syncCartFromDB(auth.user.uid);
      await syncWishlistFromDB(auth.user.uid);
    }
    return auth;
  } catch (error) {
    console.warn("Remote login failed, using local fallback:", error.message);
    const data = loginLocalUser(email, password);
    await syncCartFromDB(data.user.uid);
    await syncWishlistFromDB(data.user.uid);
    return data;
  }
}

function apiLogout() {
  removeToken();
  localStorage.removeItem("msukasha_user");
  localStorage.removeItem("msukasha_cart");
  localStorage.removeItem("msukasha_wishlist");
  showToast("Logged out successfully.", "info");
  const isSeller = window.location.hostname.includes("sellermsukasha");
  setTimeout(() => {
    window.location.href = isSeller ? "seller-login.html" : "index.html";
  }, 800);
}

async function apiGetMe() {
  if (!getToken()) return null;
  const user = getUser();
  if (user) return user;
  if (!USE_REMOTE_API) return null;
  try {
    const data = await apiFetch("/api/profile", { headers: authHeaders() });
    const auth = normalizeAuthResult(data);
    if (auth.user) setUser(auth.user);
    return auth.user;
  } catch {
    removeToken();
    localStorage.removeItem("msukasha_user");
    return null;
  }
}

async function apiUpdateProfile(profileData) {
  const user = getUser();
  if (!user) throw new Error('Not logged in');
  const updated = { ...user, profile: { ...user.profile, ...profileData } };
  setUser(updated);
  const users = getUsers();
  const index = users.findIndex(u => u.email === user.email);
  if (index !== -1) {
    users[index] = updated;
    saveUsers(users);
  }
  return { user: updated };
}

/* ============================================================
   CART — per user, synced to MongoDB
   ============================================================ */
async function syncCartToDB() {
  if (!USE_REMOTE_API) return;
  const user = getUser();
  if (!user || !getToken()) return;
  try {
    await apiFetch("/api/cart/sync", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ items: getCart() })
    });
  } catch(e) { console.warn("Cart sync:", e.message); }
}

async function syncCartFromDB(uid) {
  if (!USE_REMOTE_API) return;
  if (!getToken()) return;
  try {
    const data = await apiFetch("/api/cart/" + uid, { headers: authHeaders() });
    localStorage.setItem("msukasha_cart", JSON.stringify(data.items || []));
    updateCartCount();
  } catch(e) { console.warn("Cart load:", e.message); }
}

/* Override addToCart */
window.addToCart = function(product) {
  const cart = getCart();
  const ex   = cart.find(i => i.id === product.id);
  if (ex) ex.qty = (ex.qty || 1) + 1;
  else cart.push({ ...product, qty: 1 });
  saveCart(cart);
  updateCartCount();
  showToast("Added to cart!", "success");
  syncCartToDB();
};

/* Override removeFromCart */
window.removeFromCart = function(id) {
  saveCart(getCart().filter(i => i.id !== id));
  updateCartCount();
  syncCartToDB();
};

/* ============================================================
   WISHLIST — per user, synced to MongoDB
   ============================================================ */
async function syncWishlistToDB() {
  if (!getToken()) return;
  try {
    await apiFetch("/api/wishlist/sync", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ items: getWishlist() })
    });
  } catch(e) { console.warn("Wishlist sync:", e.message); }
}

async function syncWishlistFromDB(uid) {
  if (!getToken()) return;
  try {
    const data = await apiFetch("/api/wishlist/" + uid, { headers: authHeaders() });
    localStorage.setItem("msukasha_wishlist", JSON.stringify(data.items || []));
  } catch(e) { console.warn("Wishlist load:", e.message); }
}

/* Override addToWishlist */
window.addToWishlist = function(product) {
  const list = getWishlist();
  if (!list.find(i => i.id === product.id)) {
    list.push(product);
    localStorage.setItem("msukasha_wishlist", JSON.stringify(list));
    showToast("Added to wishlist!", "success");
    syncWishlistToDB();
  } else {
    showToast("Already in wishlist!", "info");
  }
};

/* ============================================================
   PRODUCTS (seller portal — sellermsukasha.com)
   ============================================================ */
async function apiAddProduct(productData) {
  return await apiFetch("/api/products", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(productData)
  });
}

async function apiGetProducts(filters = {}) {
  const p = new URLSearchParams(filters);
  return await apiFetch("/api/products?" + p.toString());
}

async function apiGetMyProducts() {
  if (!getToken()) return { products: [] };
  return await apiFetch("/api/products/my", { headers: authHeaders() });
}

async function apiUpdateProduct(id, data) {
  return await apiFetch("/api/products/" + id, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data)
  });
}

async function apiDeleteProduct(id) {
  return await apiFetch("/api/products/" + id, {
    method: "DELETE",
    headers: authHeaders()
  });
}

async function apiGetProduct(id) {
  return await apiFetch("/api/products/" + id);
}

/* ============================================================
   C2C ADS (msukasha.com)
   ============================================================ */
async function apiPostAd(adData) {
  return await apiFetch("/api/ads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(adData)
  });
}

async function apiGetAds(filters = {}) {
  const p = new URLSearchParams(filters);
  const data = await apiFetch("/api/ads?" + p.toString());
  return data.ads || [];
}

async function apiGetMyAds() {
  if (!getToken()) return [];
  const data = await apiFetch("/api/ads/my", { headers: authHeaders() });
  return data.ads || [];
}

/* ============================================================
   ORDERS
   ============================================================ */
async function apiPlaceOrder(orderData) {
  return await apiFetch("/api/orders", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(orderData)
  });
}

async function apiGetMyOrders() {
  if (!getToken()) return [];
  const data = await apiFetch("/api/orders/my", { headers: authHeaders() });
  return data.orders || [];
}

async function apiGetSellerOrders() {
  if (!getToken()) return [];
  const data = await apiFetch("/api/orders/seller", { headers: authHeaders() });
  return data.orders || [];
}

/* ============================================================
   SELLER STATS
   ============================================================ */
async function apiGetSellerStats() {
  if (!getToken()) return null;
  try {
    const data = await apiFetch("/api/seller/stats", { headers: authHeaders() });
    return data.stats;
  } catch { return null; }
}

/* ============================================================
   MESSAGES
   ============================================================ */
async function apiSendMessage(conversationId, receiverId, text) {
  return await apiFetch("/api/messages", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ conversationId, receiverId, text })
  });
}

async function apiGetMessages(conversationId) {
  const data = await apiFetch("/api/messages/" + conversationId, { headers: authHeaders() });
  return data.messages || [];
}

/* ============================================================
   FORMS
   ============================================================ */
async function apiSendContact(d) {
  return await apiFetch("/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(d)
  });
}

async function apiSubmitJobApp(d) {
  return await apiFetch("/api/job-application", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(d)
  });
}

async function apiSubmitVerification(d) {
  return await apiFetch("/api/verification", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(d)
  });
}

async function apiSubmitPartner(d) {
  return await apiFetch("/api/partner", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(d)
  });
}

async function apiBookCall(d) {
  return await apiFetch("/api/book-call", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(d)
  });
}

/* ============================================================
   INIT — runs on every page load
   ============================================================ */
document.addEventListener("DOMContentLoaded", async function() {
  if (getToken()) {
    const user = await apiGetMe();
    if (user?.uid) {
      await syncCartFromDB(user.uid);
      await syncWishlistFromDB(user.uid);
    }
  }
  if (typeof updateAuthButton === "function") updateAuthButton();
  if (typeof updateCartCount  === "function") updateCartCount();
});

/* Override logout */
window.logout = apiLogout;



/* ============================================================
   DIRECT BUSINESS ADVERTISING — MongoDB/Vercel API
   ============================================================ */

/**
 * Create a paid business advertisement.
 * Backend route: POST /api/business-ads
 */
async function apiCreateBusinessAd(adData) {
  return await apiFetch("/api/business-ads", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(adData)
  });
}

/**
 * Get business advertisements.
 * Example filters: { status: "approved" }, { package: "premium" }
 */
async function apiGetBusinessAds(filters = {}) {
  const p = new URLSearchParams(filters);
  const data = await apiFetch("/api/business-ads?" + p.toString());
  return data.ads || [];
}

/**
 * Get currently active business advertisements.
 * Backend should enforce start/end date and approved status.
 */
async function apiGetActiveBusinessAds() {
  const data = await apiFetch("/api/business-ads/active");
  return data.ads || [];
}

/**
 * Get advertisements submitted by the logged-in advertiser.
 */
async function apiGetMyBusinessAds() {
  if (!getToken()) return [];
  const data = await apiFetch("/api/business-ads/my", {
    headers: authHeaders()
  });
  return data.ads || [];
}

/**
 * Get one business advertisement.
 */
async function apiGetBusinessAd(id) {
  return await apiFetch("/api/business-ads/" + encodeURIComponent(id));
}

/**
 * Update an advertiser's own pending advertisement.
 */
async function apiUpdateBusinessAd(id, adData) {
  return await apiFetch("/api/business-ads/" + encodeURIComponent(id), {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(adData)
  });
}

/**
 * Delete an advertiser's own advertisement.
 */
async function apiDeleteBusinessAd(id) {
  return await apiFetch("/api/business-ads/" + encodeURIComponent(id), {
    method: "DELETE",
    headers: authHeaders()
  });
}

/* -------------------- ADMIN AD MANAGEMENT -------------------- */

/**
 * Admin: get all business advertisements.
 */
async function apiAdminGetBusinessAds(filters = {}) {
  const p = new URLSearchParams(filters);
  const data = await apiFetch("/api/admin/business-ads?" + p.toString(), {
    headers: authHeaders()
  });
  return data.ads || [];
}

/**
 * Admin: approve an advertisement.
 */
async function apiAdminApproveBusinessAd(id, approvalData = {}) {
  return await apiFetch(
    "/api/admin/business-ads/" + encodeURIComponent(id) + "/approve",
    {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(approvalData)
    }
  );
}

/**
 * Admin: reject an advertisement.
 */
async function apiAdminRejectBusinessAd(id, reason = "") {
  return await apiFetch(
    "/api/admin/business-ads/" + encodeURIComponent(id) + "/reject",
    {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ reason })
    }
  );
}

/**
 * Admin: update advertisement details/status/dates.
 */
async function apiAdminUpdateBusinessAd(id, adData) {
  return await apiFetch(
    "/api/admin/business-ads/" + encodeURIComponent(id),
    {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(adData)
    }
  );
}

/* -------------------- AD ANALYTICS -------------------- */

/**
 * Record one advertisement impression.
 */
async function apiRecordAdImpression(id) {
  return await apiFetch(
    "/api/business-ads/" + encodeURIComponent(id) + "/impression",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    }
  );
}

/**
 * Record one advertisement click.
 */
async function apiRecordAdClick(id) {
  return await apiFetch(
    "/api/business-ads/" + encodeURIComponent(id) + "/click",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    }
  );
}
