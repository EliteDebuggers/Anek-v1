import './style.css'

window.openLoginModal = function () {
  const modal = document.getElementById('login-modal');
  if (modal) modal.classList.remove('hidden');
};

window.closeLoginModal = function () {
  const modal = document.getElementById('login-modal');
  if (modal) modal.classList.add('hidden');
};

const API_BASE = 'http://localhost:5000/api/v1';
window.API_BASE = API_BASE;

window.apiFetch = async function (endpoint, options = {}) {
  const token = localStorage.getItem('anek_access_token');
  
  const headers = { ...options.headers };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const fetchOptions = {
    ...options,
    headers,
  };

  try {
    let response = await fetch(`${API_BASE}${endpoint}`, fetchOptions);

    if (response.status === 401 && token) {
      console.log('Access token expired, attempting to refresh...');
      const refreshResponse = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: localStorage.getItem('anek_refresh_token') }),
      });

      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        localStorage.setItem('anek_access_token', refreshData.accessToken);
        
        headers['Authorization'] = `Bearer ${refreshData.accessToken}`;
        response = await fetch(`${API_BASE}${endpoint}`, fetchOptions);
      } else {
        console.log('Session expired, logging out...');
        localStorage.removeItem('anek_access_token');
        localStorage.removeItem('anek_current_user');
        window.location.href = '/index.html';
        return null;
      }
    }

    return response;
  } catch (error) {
    console.error('API Fetch Error:', error);
    throw error;
  }
};

window.handleLoginSubmit = async function (event) {
  event.preventDefault();

  const nameInput = document.getElementById('input-name');
  const usernameInput = document.getElementById('input-username');
  const errorMsg = document.getElementById('login-error-msg');

  const name = nameInput.value.trim();
  const username = usernameInput.value.trim().toLowerCase();

  if (!name || !username) return;

  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, username }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      if (errorMsg) {
        errorMsg.innerText = data.message || 'Username already taken or invalid.';
        errorMsg.classList.remove('hidden');
      }
      return;
    }

    if (errorMsg) errorMsg.classList.add('hidden');

    localStorage.setItem('anek_current_user', JSON.stringify({ name: data.user.name, username: data.user.username }));
    localStorage.setItem('anek_access_token', data.accessToken);

    const redirectUrl = sessionStorage.getItem('anek_login_redirect') || '/local_impact.html';
    sessionStorage.removeItem('anek_login_redirect');
    window.location.href = redirectUrl;
  } catch (error) {
    console.error('Login error:', error);
    if (errorMsg) {
      errorMsg.innerText = 'Unable to connect to the server.';
      errorMsg.classList.remove('hidden');
    }
  }
};

let allIssues = [];

window.handleRecentReportClick = function (title) {
  const token = localStorage.getItem('anek_access_token');
  if (!token) {
    sessionStorage.setItem('anek_login_redirect', `/local_impact.html?highlight=${encodeURIComponent(title)}`);
    window.openLoginModal();
  } else {
    window.location.href = `/local_impact.html?highlight=${encodeURIComponent(title)}`;
  }
};

window.handleShowMoreRecentReports = function () {
  renderIssues(true);
};

window.handleSeeAllClick = function () {
  sessionStorage.setItem('anek_login_redirect', '/local_impact.html');
  window.openLoginModal();
};

function renderIssues(showAll = false) {
  const feedContainer = document.getElementById('local-pulse-feed');
  if (!feedContainer) return;

  if (allIssues.length === 0) {
    feedContainer.innerHTML = `
      <div class="p-md text-center font-mono text-xs text-on-surface-variant select-none w-full border-r-2 border-primary">
        No reports registered yet. Be the first to report a problem!
      </div>
    `;
    return;
  }

  // If showAll is false, render 2 issues. If showAll is true, render up to 4 issues.
  const limitCount = showAll ? 4 : 2;
  const issuesToRender = allIssues.slice(0, limitCount);

  let html = issuesToRender.map(issue => {
    // Map backend categories/status to homepage styles
    let type = 'PROPOSAL';
    let color = 'purple';
    let action = 'VIEW DETAILS';

    if (issue.category === 'Roads') {
      type = 'HAZARD';
      color = 'red';
      action = 'VERIFY STATUS';
    } else if (issue.category === 'Garbage') {
      type = 'COMMUNITY';
      color = 'blue';
      action = 'JOIN EFFORT';
    } else if (issue.category === 'Animals') {
      type = 'ANIMAL';
      color = 'yellow';
      action = 'HELP ANIMAL';
    } else if (issue.category === 'Water') {
      type = 'WATER';
      color = 'blue';
      action = 'VIEW DETAILS';
    }

    if (issue.status === 'Completed') {
      type = 'RESOLVED';
      color = 'green';
      action = '+50 GCP Awarded';
    }

    // Use Tailwind color fallback mappings
    let badgeClass = '';
    if (color === 'red') badgeClass = 'bg-red-100 text-red-800 border-red-800';
    else if (color === 'blue') badgeClass = 'bg-blue-100 text-blue-800 border-blue-800';
    else if (color === 'green') badgeClass = 'bg-green-100 text-green-800 border-green-800';
    else if (color === 'yellow') badgeClass = 'bg-yellow-100 text-yellow-800 border-yellow-800';
    else badgeClass = 'bg-purple-100 text-purple-800 border-purple-800';

    return `
      <div onclick="handleRecentReportClick('${issue.title}')" class="bg-white/90 backdrop-blur-sm border-b-2 border-r-2 border-primary p-md space-y-sm hover:bg-white transition-colors cursor-pointer w-full h-full flex flex-col justify-between min-h-[250px]">
          <div class="space-y-sm">
              <div class="flex justify-between items-center">
                  <span class="font-mono text-[10px] border px-2 py-0.5 font-bold ${badgeClass}">${type}</span>
                  <span class="font-mono text-[10px] text-on-surface-variant">${issue.time}</span>
              </div>
              <h4 class="font-cabin text-2xl text-primary leading-tight">${issue.title}</h4>
              <p class="font-sans text-sm text-on-surface-variant line-clamp-3">${issue.description}</p>
          </div>
          <div class="flex justify-between items-center border-t border-dashed border-outline-variant pt-xs mt-auto">
              <span class="font-mono text-[10px] text-primary">By: @${issue.author}</span>
              <button class="font-mono text-[10px] bg-primary text-white border border-primary px-2 py-1 hover:bg-white hover:text-primary transition-all font-bold">${action}</button>
          </div>
      </div>
    `;
  });

  // Append control button card
  if (!showAll) {
    html.push(`
      <div onclick="handleShowMoreRecentReports()" class="bg-white/90 backdrop-blur-sm border-b-2 border-r-2 border-primary p-md flex flex-col items-center justify-center text-center hover:bg-primary-container/40 transition-colors cursor-pointer w-full h-full min-h-[250px] select-none group">
          <span class="material-symbols-outlined text-4xl text-primary mb-sm transition-transform group-hover:scale-110">add_circle</span>
          <span class="font-mono text-xs font-bold text-primary uppercase tracking-wider group-hover:underline">Show More</span>
      </div>
    `);
  } else {
    html.push(`
      <div onclick="handleSeeAllClick()" class="bg-white/90 backdrop-blur-sm border-b-2 border-r-2 border-primary p-md flex flex-col items-center justify-center text-center hover:bg-primary-container/40 transition-colors cursor-pointer w-full h-full min-h-[250px] select-none group">
          <span class="material-symbols-outlined text-4xl text-primary mb-sm transition-transform group-hover:scale-110">visibility</span>
          <span class="font-mono text-xs font-bold text-primary uppercase tracking-wider group-hover:underline">See All</span>
      </div>
    `);
  }

  feedContainer.innerHTML = html.join('');
}

window.addEventListener('DOMContentLoaded', async () => {
  const feedContainer = document.getElementById('local-pulse-feed');
  if (feedContainer) {
    try {
      const response = await fetch('http://localhost:5000/api/v1/issues?limit=5&sort=-createdAt');
      if (response.ok) {
        const data = await response.json();
        allIssues = data.issues || [];
        renderIssues(false);
      }
    } catch (err) {
      console.error('Error fetching home recent reports:', err);
    }
  }
});
import './components.js';

window.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('header');
    if (header) {
        header.classList.add('transition-transform', 'duration-300');
        let lastScrollY = window.scrollY;
        
        window.addEventListener('scroll', () => {
            const sidebar = document.querySelector('aside#sidebar');
            if (window.scrollY > lastScrollY && window.scrollY > 64) {
                // Scrolling down, hide header
                header.classList.add('-translate-y-full');
                if (sidebar) {
                    sidebar.style.top = '0px';
                    sidebar.style.height = '100vh';
                }
            } else {
                // Scrolling up, show header
                header.classList.remove('-translate-y-full');
                if (sidebar) {
                    sidebar.style.top = '';
                    sidebar.style.height = '';
                }
            }
            lastScrollY = window.scrollY;
        });
    }
});
