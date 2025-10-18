/*
  script.js - Main Entry Point
  
  Modular client-side script for NoteSmith web application.
  Imports and initializes all feature modules.
*/

import { initTheme } from './theme.js';
import { initAuth, isUserLoggedIn } from './auth.js';
import { initNavbar } from './navbar.js';
import { initCrashCourse } from './crashCourse.js';
import { initSummary } from './summary.js';
import { initPracticeTest } from './practiceTest.js';
import { initDashboard } from './dashboard.js';

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
