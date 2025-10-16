/*
  auth.js
  
  Handles authentication logic including login/logout and user session management.
  Manages persistent authentication state using localStorage.
*/

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function isUserLoggedIn() {
  return localStorage.getItem("isLoggedIn") === "true";
}

export function getUserData() {
  const userData = localStorage.getItem("userData");
  return userData ? JSON.parse(userData) : null;
}

function handleLogout(e) {
  e.preventDefault();
  
  // Clear localStorage
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("userData");
  
  // Determine if we are on index.html or not
  const isIndex = window.location.pathname.endsWith('index.html') || window.location.pathname === '/';
  
  // Redirect to home page
  if (isIndex) {
    window.location.href = "./index.html";
  } else {
    window.location.href = "../index.html";
  }
}

function updateNavbar(loginBtn, userName) {
  loginBtn.innerHTML = `
    <img src="../assets/avatar_placeholder.png" alt="User" class="avatar"> ${userName}
  `;
  loginBtn.classList.remove("login");
  loginBtn.classList.add("account");
  loginBtn.href = "account_settings.html";

  // Add logout button next to Account Settings
  const navRight = document.querySelector('.nav-right');
  if (navRight && !document.getElementById('logoutBtn')) {
    const logoutBtn = document.createElement('button');
    logoutBtn.id = 'logoutBtn';
    logoutBtn.className = 'logout-btn';
    logoutBtn.innerHTML = '<span class="material-symbols-outlined">logout</span>';
    logoutBtn.title = 'Logout';

    logoutBtn.addEventListener('click', handleLogout);

    navRight.appendChild(logoutBtn);
  }
}

// ============================================================================
// MAIN FUNCTION TO INITIALIZE AUTH LOGIC
// ============================================================================

export function initAuth() {

  // Elements
  const loginBtn = document.getElementById("loginBtn");
  let isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

  // Determine if we are on index.html or not
  const isIndex = window.location.pathname.endsWith('index.html') || window.location.pathname === '/';
  const isLoginPage = window.location.pathname.includes('login-signup.html');

  // Update UI if logged in
  if (isLoggedIn && loginBtn) {

    const userData = getUserData();
    const userName = userData && userData.username ? userData.username : "User";

    updateNavbar(loginBtn, userName);
  }

  // Redirects to login-signup page if not logged in
  if (loginBtn) {
    loginBtn.addEventListener("click", (e) => {
      if (isLoggedIn) {
        return;
      } else {

        // Redirect to login page
        e.preventDefault();
        if (isIndex) {
          window.location.href = "./pages/login-signup.html";
        } else {
          window.location.href = "login-signup.html";
        }
      }
    });
  }

  // Handle login/sign-up

  /* Behavior for now:
      * Auto logs in as test user Alice (user_001) on login button click
      * Redirects to dashboard on success
  */

  if (isLoginPage) {
    const signUpBtn = document.querySelector('.SignUpBtn');
    const signUpBtnPage = document.querySelector('.SignUpBtn');
    const loginBtnPage = document.querySelector('.LoginBtn');

    // Login button: auto-login as Alice
    // TODO: Form to enter credentials and check against users.json/ backend
    if (loginBtnPage) {
      loginBtnPage.addEventListener('click', async () => {
      try {
        const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'Alice',
          password: 'password123'
        })
        });

        const data = await response.json();

        if (data.success) {
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userData", JSON.stringify(data.user));
        window.location.href = "dashboard.html";
        } else {
        console.error('Login failed:', data.error);
        }
      } catch (err) {
        console.error('Error during login:', err);
      }
      });
    }

    // Sign up button
    if (signUpBtn) {
     
      // TODO: Change to actual sign-up logic
      signUpBtnPage.addEventListener('click', async () => {
        alert('Sign-up is not implemented yet. Please use the Login button to log in as Alice.');
      });
    }
  }
}
