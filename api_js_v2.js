/**
 * MSukasha — api.js v2
 * Works on BOTH msukasha.com AND sellermsukasha.com
 * Place AFTER main.js on every HTML page
 */

const API = "https://msukasha-backend-git-main-msukasha.vercel.app";

/* ============================================================
   TOKEN & USER HELPERS
   ============================================================ */
function getToken()    { return localStorage.getItem("ms_token") || ""; }
function setToken(t)   { localStorage.setItem("ms_token", t); }
function removeToken() { localStorage.removeItem("ms_token"); }

function authHeaders() {
  return {
    "Content-Type": "application/json",
    "Authorization": "Bearer " + getToken()
  };
}

/* ============================================================
   BASE FETCH
   ============================================================ */
async function apiFetch(path, options = {}) {
  try {
    const res  = await fetch(API + path, options);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
  } catch(e) {
    throw e;
  }
}

/* ============================================================
   AUTH
   ============================================================ */
async function apiRegister({ name, email, password, phone, city, role }) {
  const data = await apiFetch("/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, phone, city, role })
  });
  setToken(data.token);
  setUser(data.user);
  return data;
}

async function apiLogin(email, password) {
  const data = await apiFetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  setToken(data.token);
  setUser(data.user);
  if (data.user?.uid) {
    await syncCartFromDB(data.user.uid);
    await syncWishlistFromDB(data.user.uid);
  }
  return data;
}

function apiLogout() {
  removeToken();
  localStorage.removeItem("msukasha_user");
  localStorage.removeItem("msukasha_cart");
  localStorage.removeItem("msukasha_wishlist");
  showToast("Logged out successfully.", "info");
  // Redirect based on which site
  const isSeller = window.location.hostname.includes("sellermsukasha");
  setTimeout(() => {
    window.location.href = isSeller ? "seller-login.html" : "index.html";
  }, 800);
}

async function apiGetMe() {
  if (!getToken()) return null;
  try {
    const data = await apiFetch("/api/me", { headers: authHeaders() });
    setUser(data.user);
    return data.user;
  } catch {
    removeToken();
    localStorage.removeItem("msukasha_user");
    return null;
  }
}

async function apiUpdateProfile(profileData) {
  const data = await apiFetch("/api/me", {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(profileData)
  });
  setUser(data.user);
  return data;
}

/* ============================================================
   CART — per user, synced to MongoDB
   ============================================================ */
async function syncCartToDB() {
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
