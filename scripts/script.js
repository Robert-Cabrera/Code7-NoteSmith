/*
  script.js - Main Entry Point
  
  Modular client-side script for NoteSmith web application.
  Imports and initializes all feature modules.
*/

import { initTheme } from './frontend/theme.js';
import { initAuth, isUserLoggedIn } from './frontend/auth.js';
import { initNavbar } from './frontend/navbar.js';
import { initCrashCourse } from './frontend/crashCourse.js';
import { initSummary } from './frontend/summary.js';
import { initPracticeTest } from './frontend/practiceTest.js';
import { initDashboard } from './frontend/dashboard.js';

document.addEventListener("DOMContentLoaded", () => {
  // Initialize core functionality
  initTheme();
  initAuth();
  initNavbar();

  // Check login status
  const isLoggedIn = isUserLoggedIn();

  // Initialize page-specific features
  initDashboard(isLoggedIn);
  initCrashCourse(isLoggedIn);
  initSummary(isLoggedIn);
  initPracticeTest(isLoggedIn);
});
