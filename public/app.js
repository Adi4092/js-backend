const API_BASE = "/api/v1";
let currentUser = null;
let currentPlayingVideo = null;

// DOM Elements
const authButtons = document.getElementById("auth-buttons");
const userProfileMenu = document.getElementById("user-profile-menu");
const userAvatarImg = document.getElementById("user-avatar-img");
const userDropdown = document.getElementById("user-dropdown");
const userAvatarTrigger = document.getElementById("user-avatar-trigger");
const dropdownUserFullname = document.getElementById("dropdown-user-fullname");
const dropdownUserUsername = document.getElementById("dropdown-user-username");

// Modals
const modalLogin = document.getElementById("modal-login");
const modalRegister = document.getElementById("modal-register");
const modalUpload = document.getElementById("modal-upload");
const modalPlayer = document.getElementById("modal-player");

// Toast Helper
function showToast(message, isError = false) {
    const toast = document.getElementById("toast");
    const toastMsg = document.getElementById("toast-message");
    const toastIcon = document.getElementById("toast-icon");

    toastMsg.textContent = message;
    toastIcon.className = isError ? "ri-error-warning-line" : "ri-checkbox-circle-line";
    toast.style.borderColor = isError ? "var(--accent-coral)" : "var(--accent-violet)";

    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3500);
}

// Get Auth Token
function getToken() {
    return localStorage.getItem("accessToken") || "";
}

// Global Fetch Wrapper
async function apiRequest(endpoint, method = "GET", body = null, isFormData = false) {
    const headers = {};
    const token = getToken();
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    if (body && !isFormData) {
        headers["Content-Type"] = "application/json";
    }

    const options = {
        method,
        headers,
        body: body ? (isFormData ? body : JSON.stringify(body)) : null
    };

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, options);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "An error occurred");
        }
        return data;
    } catch (err) {
        console.error(`API Error [${endpoint}]:`, err.message);
        throw err;
    }
}

// Initial Load & Auth Check
async function initApp() {
    setupEventListeners();
    await checkCurrentUser();
    await loadFeed();
}

async function checkCurrentUser() {
    const token = getToken();
    if (!token) {
        updateAuthUI(null);
        return;
    }

    try {
        const res = await apiRequest("/users/get-user");
        currentUser = res.data;
        updateAuthUI(currentUser);
    } catch (err) {
        console.warn("Session expired or invalid token.");
        localStorage.removeItem("accessToken");
        updateAuthUI(null);
    }
}

function updateAuthUI(user) {
    if (user) {
        authButtons.style.display = "none";
        userProfileMenu.style.display = "block";
        document.getElementById("btn-open-upload").style.display = "inline-flex";
        document.getElementById("create-post-card").style.display = "block";
        document.getElementById("add-comment-box").style.display = "flex";

        userAvatarImg.src = user.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100";
        dropdownUserFullname.textContent = user.fullname;
        dropdownUserUsername.textContent = `@${user.username}`;
    } else {
        authButtons.style.display = "flex";
        userProfileMenu.style.display = "none";
        document.getElementById("btn-open-upload").style.display = "none";
        document.getElementById("create-post-card").style.display = "none";
        document.getElementById("add-comment-box").style.display = "none";
    }
}

// Load Feed Videos
async function loadFeed(searchQuery = "") {
    const videoGrid = document.getElementById("video-grid");
    const countBadge = document.getElementById("video-count-badge");
    videoGrid.innerHTML = `<div class="skeleton-card"></div><div class="skeleton-card"></div>`;

    try {
        const queryParam = searchQuery ? `?query=${encodeURIComponent(searchQuery)}` : "";
        const res = await apiRequest(`/videos${queryParam}`);
        const videos = res.data?.docs || res.data || [];

        countBadge.textContent = `${videos.length} videos available`;

        if (videos.length === 0) {
            videoGrid.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1; text-align:center; padding: 40px;">
                    <i class="ri-film-line" style="font-size:3rem; color:var(--text-muted);"></i>
                    <h3 style="margin-top:12px;">No Videos Found</h3>
                    <p style="color:var(--text-secondary);">Be the first creator to upload a video!</p>
                </div>`;
            return;
        }

        videoGrid.innerHTML = videos.map(video => createVideoCardHTML(video)).join("");
        attachVideoCardEvents();
    } catch (err) {
        videoGrid.innerHTML = `<p style="color:var(--accent-coral);">Failed to load videos: ${err.message}</p>`;
    }
}

function createVideoCardHTML(video) {
    const ownerAvatar = video.owner?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100";
    const ownerName = video.owner?.fullname || video.owner?.username || "Creator";
    const durationMin = Math.floor((video.duration || 120) / 60);
    const durationSec = Math.floor((video.duration || 120) % 60).toString().padStart(2, '0');

    return `
        <div class="video-card" data-id="${video._id}" data-video='${JSON.stringify(video).replace(/'/g, "&apos;")}'>
            <div class="thumbnail-wrapper">
                <img src="${video.thumbnail}" alt="${video.title}" loading="lazy">
                <span class="duration-tag">${durationMin}:${durationSec}</span>
            </div>
            <div class="video-info">
                <img class="owner-avatar" src="${ownerAvatar}" alt="${ownerName}">
                <div class="video-details">
                    <h3>${video.title}</h3>
                    <div class="channel-name">${ownerName}</div>
                    <div class="video-meta-stats">${video.views || 0} views • ${new Date(video.createdAt).toLocaleDateString()}</div>
                </div>
            </div>
        </div>`;
}

function attachVideoCardEvents() {
    document.querySelectorAll(".video-card").forEach(card => {
        card.addEventListener("click", () => {
            const videoData = JSON.parse(card.getAttribute("data-video"));
            openPlayerModal(videoData);
        });
    });
}

// Open Player Modal & Increment Views
async function openPlayerModal(video) {
    currentPlayingVideo = video;
    document.getElementById("main-video-element").src = video.videoFile;
    document.getElementById("player-title").textContent = video.title;
    document.getElementById("player-description").textContent = video.description || "No description provided.";
    document.getElementById("player-owner-avatar").src = video.owner?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100";
    document.getElementById("player-owner-fullname").textContent = video.owner?.fullname || "Creator";
    document.getElementById("player-owner-subs").textContent = `${video.owner?.subscribersCount || 0} subscribers`;

    modalPlayer.classList.add("show");

    // Fetch details & view increment
    try {
        const res = await apiRequest(`/videos/${video._id}`);
        const details = res.data;
        document.getElementById("like-count").textContent = details.likesCount || 0;
        await loadComments(video._id);
    } catch (err) {
        console.warn("Failed to load detailed video stats:", err.message);
    }
}

// Load Comments
async function loadComments(videoId) {
    const commentsList = document.getElementById("comments-list");
    commentsList.innerHTML = "<p>Loading comments...</p>";

    try {
        const res = await apiRequest(`/comments/${videoId}`);
        const comments = res.data?.docs || res.data || [];
        document.getElementById("comments-count").textContent = `(${comments.length})`;

        if (comments.length === 0) {
            commentsList.innerHTML = `<p style="color:var(--text-muted); font-size:0.9rem;">No comments yet. Be the first to comment!</p>`;
            return;
        }

        commentsList.innerHTML = comments.map(c => `
            <div style="display:flex; gap:12px; margin-top:16px;">
                <img src="${c.owner?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}" style="width:36px; height:36px; border-radius:50%; object-fit:cover;">
                <div>
                    <strong style="font-size:0.88rem;">${c.owner?.fullname || c.owner?.username || 'User'}</strong>
                    <span style="font-size:0.75rem; color:var(--text-muted); margin-left:6px;">${new Date(c.createdAt).toLocaleDateString()}</span>
                    <p style="font-size:0.9rem; margin-top:4px; color:var(--text-secondary);">${c.content}</p>
                </div>
            </div>
        `).join("");
    } catch (err) {
        commentsList.innerHTML = `<p style="color:var(--text-muted);">Sign in to view and add comments.</p>`;
    }
}

// Submit Comment
async function handleCommentSubmit() {
    const input = document.getElementById("comment-input");
    const content = input.value.trim();
    if (!content || !currentPlayingVideo) return;

    try {
        await apiRequest(`/comments/${currentPlayingVideo._id}`, "POST", { content });
        input.value = "";
        showToast("Comment posted!");
        await loadComments(currentPlayingVideo._id);
    } catch (err) {
        showToast(err.message, true);
    }
}

// Handle Like Toggle
async function handleLikeToggle() {
    if (!currentPlayingVideo || !currentUser) {
        showToast("Please sign in to like videos", true);
        return;
    }

    try {
        const res = await apiRequest(`/likes/toggle/v/${currentPlayingVideo._id}`, "POST");
        showToast(res.message);
        const countSpan = document.getElementById("like-count");
        let currentLikes = parseInt(countSpan.textContent) || 0;
        countSpan.textContent = res.data?.isLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1);
    } catch (err) {
        showToast(err.message, true);
    }
}

// Dashboard View Load
async function loadDashboard() {
    if (!currentUser) {
        showToast("Please sign in to view Creator Studio", true);
        return;
    }

    try {
        const [statsRes, videosRes] = await Promise.all([
            apiRequest("/dashboard/stats"),
            apiRequest("/dashboard/videos")
        ]);

        const stats = statsRes.data || {};
        document.getElementById("stat-total-views").textContent = stats.totalViews || 0;
        document.getElementById("stat-total-subscribers").textContent = stats.totalSubscribers || 0;
        document.getElementById("stat-total-videos").textContent = stats.totalVideos || 0;
        document.getElementById("stat-total-likes").textContent = stats.totalLikes || 0;

        const videos = videosRes.data?.docs || videosRes.data || [];
        const tbody = document.getElementById("dash-videos-tbody");

        if (videos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No uploaded videos found.</td></tr>`;
            return;
        }

        tbody.innerHTML = videos.map(v => `
            <tr>
                <td><span class="badge" style="background:${v.isPublished ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)'}; color:${v.isPublished ? '#10b981' : '#f43f5e'}">${v.isPublished ? 'Published' : 'Draft'}</span></td>
                <td><strong>${v.title}</strong></td>
                <td>${v.views || 0}</td>
                <td>${v.likesCount || 0}</td>
                <td>${new Date(v.createdAt).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="togglePublish('${v._id}')">Toggle Status</button>
                    <button class="btn btn-secondary btn-sm" style="color:var(--accent-coral)" onclick="deleteVideo('${v._id}')">Delete</button>
                </td>
            </tr>
        `).join("");
    } catch (err) {
        showToast("Failed to load dashboard: " + err.message, true);
    }
}

// Global functions for inline table onclicks
window.togglePublish = async function(videoId) {
    try {
        await apiRequest(`/videos/toggle/publish/${videoId}`, "PATCH");
        showToast("Publish status updated!");
        loadDashboard();
    } catch (err) { showToast(err.message, true); }
};

window.deleteVideo = async function(videoId) {
    if (!confirm("Are you sure you want to delete this video?")) return;
    try {
        await apiRequest(`/videos/${videoId}`, "DELETE");
        showToast("Video deleted successfully");
        loadDashboard();
    } catch (err) { showToast(err.message, true); }
};

// Setup Event Listeners
function setupEventListeners() {
    // Navigation Tabs
    document.querySelectorAll(".sidebar-item").forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            document.querySelectorAll(".sidebar-item").forEach(i => i.classList.remove("active"));
            document.querySelectorAll(".content-view").forEach(v => v.classList.remove("active"));

            item.classList.add("active");
            const tabName = item.getAttribute("data-tab");
            document.getElementById(`view-${tabName}`).classList.add("active");

            if (tabName === "dashboard") loadDashboard();
            if (tabName === "feed") loadFeed();
            if (tabName === "history") loadHistory();
            if (tabName === "liked") loadLikedVideos();
            if (tabName === "tweets") loadTweets();
        });
    });

    // Search
    document.getElementById("btn-search").addEventListener("click", () => {
        const query = document.getElementById("search-input").value.trim();
        loadFeed(query);
    });

    // User Dropdown
    userAvatarTrigger.addEventListener("click", () => userDropdown.classList.toggle("show"));
    document.addEventListener("click", (e) => {
        if (!userProfileMenu.contains(e.target)) userDropdown.classList.remove("show");
    });

    // Logout
    document.getElementById("btn-logout").addEventListener("click", async () => {
        try { await apiRequest("/users/logout", "POST"); } catch(e){}
        localStorage.removeItem("accessToken");
        currentUser = null;
        updateAuthUI(null);
        showToast("Logged out successfully");
    });

    // Open Auth Modals
    document.getElementById("btn-open-login").addEventListener("click", () => modalLogin.classList.add("show"));
    document.getElementById("btn-open-register").addEventListener("click", () => modalRegister.classList.add("show"));

    document.getElementById("btn-open-upload").addEventListener("click", () => modalUpload.classList.add("show"));
    document.getElementById("btn-open-upload-dash")?.addEventListener("click", () => modalUpload.classList.add("show"));

    // Close Modals
    document.getElementById("btn-close-login").addEventListener("click", () => modalLogin.classList.remove("show"));
    document.getElementById("btn-close-register").addEventListener("click", () => modalRegister.classList.remove("show"));
    document.getElementById("btn-close-upload").addEventListener("click", () => modalUpload.classList.remove("show"));
    document.getElementById("btn-cancel-upload").addEventListener("click", () => modalUpload.classList.remove("show"));
    document.getElementById("btn-close-player").addEventListener("click", () => {
        modalPlayer.classList.remove("show");
        document.getElementById("main-video-element").pause();
    });

    // Forms
    document.getElementById("form-login").addEventListener("submit", async (e) => {
        e.preventDefault();
        const username = document.getElementById("login-username").value.trim();
        const password = document.getElementById("login-password").value;

        try {
            const res = await apiRequest("/users/login", "POST", { username, password });
            localStorage.setItem("accessToken", res.data.accessToken);
            currentUser = res.data.user;
            updateAuthUI(currentUser);
            modalLogin.classList.remove("show");
            showToast("Welcome back, " + currentUser.fullname + "!");
        } catch (err) {
            showToast(err.message, true);
        }
    });

    document.getElementById("form-register").addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append("fullname", document.getElementById("reg-fullname").value);
        formData.append("username", document.getElementById("reg-username").value);
        formData.append("email", document.getElementById("reg-email").value);
        formData.append("password", document.getElementById("reg-password").value);
        formData.append("avatar", document.getElementById("reg-avatar").files[0]);

        try {
            await apiRequest("/users/register", "POST", formData, true);
            showToast("Account created! Please sign in.");
            modalRegister.classList.remove("show");
            modalLogin.classList.add("show");
        } catch (err) {
            showToast(err.message, true);
        }
    });

    document.getElementById("form-upload").addEventListener("submit", async (e) => {
        e.preventDefault();
        const btn = document.getElementById("btn-submit-upload");
        btn.disabled = true;
        btn.textContent = "Uploading to Cloudinary...";

        const formData = new FormData();
        formData.append("title", document.getElementById("upload-title").value);
        formData.append("description", document.getElementById("upload-description").value);
        formData.append("videoFile", document.getElementById("upload-videofile").files[0]);
        formData.append("thumbnail", document.getElementById("upload-thumbnail").files[0]);

        try {
            await apiRequest("/videos", "POST", formData, true);
            showToast("Video published successfully!");
            modalUpload.classList.remove("show");
            loadFeed();
        } catch (err) {
            showToast(err.message, true);
        } finally {
            btn.disabled = false;
            btn.innerHTML = `<i class="ri-upload-cloud-2-line"></i> Publish Video`;
        }
    });

    // Video Player Interactions
    document.getElementById("btn-submit-comment").addEventListener("click", handleCommentSubmit);
    document.getElementById("btn-toggle-like").addEventListener("click", handleLikeToggle);
}

async function loadHistory() {
    const grid = document.getElementById("history-grid");
    grid.innerHTML = "<p>Loading watch history...</p>";
    try {
        const res = await apiRequest("/users/history");
        const videos = res.data || [];
        grid.innerHTML = videos.length ? videos.map(v => createVideoCardHTML(v)).join("") : "<p>No watch history available.</p>";
        attachVideoCardEvents();
    } catch (e) { grid.innerHTML = "<p>Please sign in to view watch history.</p>"; }
}

async function loadLikedVideos() {
    const grid = document.getElementById("liked-grid");
    grid.innerHTML = "<p>Loading liked videos...</p>";
    try {
        const res = await apiRequest("/likes/videos");
        const likes = res.data?.docs || res.data || [];
        const videos = likes.map(l => l.video).filter(Boolean);
        grid.innerHTML = videos.length ? videos.map(v => createVideoCardHTML(v)).join("") : "<p>No liked videos yet.</p>";
        attachVideoCardEvents();
    } catch (e) { grid.innerHTML = "<p>Please sign in to view liked videos.</p>"; }
}

async function loadTweets() {
    const list = document.getElementById("tweets-list");
    list.innerHTML = "<p>Loading posts...</p>";
    try {
        if (!currentUser) {
            list.innerHTML = "<p>Sign in to view community posts.</p>";
            return;
        }
        const res = await apiRequest(`/tweets/user/${currentUser._id}`);
        const tweets = res.data || [];
        list.innerHTML = tweets.length ? tweets.map(t => `
            <div style="background:var(--glass-card); border:1px solid var(--glass-border); padding:16px; border-radius:12px; margin-bottom:12px;">
                <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
                    <img src="${t.owner?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}" style="width:34px; height:34px; border-radius:50%;">
                    <strong>${t.owner?.fullname || t.owner?.username || 'Creator'}</strong>
                    <span style="font-size:0.75rem; color:var(--text-muted);">${new Date(t.createdAt).toLocaleDateString()}</span>
                </div>
                <p style="color:var(--text-primary); font-size:0.95rem;">${t.content}</p>
            </div>
        `).join("") : "<p>No community posts yet.</p>";
    } catch(e) { list.innerHTML = "<p>Unable to load posts.</p>"; }
}

// Initialize application on DOM load
document.addEventListener("DOMContentLoaded", initApp);
