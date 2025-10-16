/*
  auth.js
  
  Handles authentication logic including login/logout and user session management.
  Manages persistent authentication state using localStorage.
*/

export function initAuth() {
  const loginBtn = document.getElementById("loginBtn");
  let isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  
  // Determine if we are on index.html or not
  const isIndex = window.location.pathname.endsWith('index.html');

  // Update login button UI if logged in
  if (isLoggedIn && loginBtn) {
    loginBtn.innerHTML = `
      <img src="../assets/avatar_placeholder.png" alt="User" class="avatar"> Account Settings
    `;
    loginBtn.classList.remove("login");
    loginBtn.classList.add("account");
    loginBtn.href = "#"; // adjust later
  }

  // Login/logout button click handler
  if (loginBtn) {
    loginBtn.addEventListener("click", (e) => {
      e.preventDefault();

      if (isLoggedIn) {
        // Simulate logout
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("userData");
        isLoggedIn = false;
        location.reload();
        window.location.href = "../index.html";
      } else {
        // Redirect to login page
        localStorage.setItem("isLoggedIn", "true");
        isLoggedIn = true;
        
        if (isIndex) {
          window.location.href = "./pages/login-signup.html";
        } else {
          // Stay on current page for now
          return;
        }
      }
    });
  }
}

export function isUserLoggedIn() {
  return localStorage.getItem("isLoggedIn") === "true";
}

export function getUserData() {
  const userData = localStorage.getItem("userData");
  return userData ? JSON.parse(userData) : null;
}
