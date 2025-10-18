/*
  navbar.js
  
  Handles navigation bar initialization and link setup.
*/

import { isUserLoggedIn } from './auth.js';

export function initNavbar() {
  // Navigation elements
  const homeLink = document.querySelector(".nav-left a");
  
  // If user is logged in, make logo redirect to dashboard instead of index
  if (homeLink && isUserLoggedIn()) {
    // Determine if we're on index.html or in pages folder
    const isIndex = window.location.pathname.endsWith('index.html') || window.location.pathname === '/';
    
    if (isIndex) {
      homeLink.href = "./pages/dashboard.html";
    } else {
      homeLink.href = "./dashboard.html";
    }
  }
}
