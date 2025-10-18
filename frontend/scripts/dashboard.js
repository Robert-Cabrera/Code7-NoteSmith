/*
  dashboard.js
  
  Handles dashboard page functionality including user greeting and history display.
  
  Structure:
  1. Constants and Global State
  2. Initialization Functions
  3. Data Fetching Functions
  4. Main Load Functions
  5. Helper Functions
  6. Template/Rendering Functions
  7. Event Handlers
*/

import { getUserData } from './auth.js';

// ============================================================================
// CONSTANTS AND GLOBAL STATE
// ============================================================================

const ITEMS_PER_PAGE = 4;
const WAITING_RANGE_MS = 800;

// Store user data globally for pagination
let currentUserData = null;

// ============================================================================
// INITIALIZATION FUNCTIONS
// ============================================================================

export function initDashboard(isLoggedIn) {
  const dashboardContainer = document.querySelector(".dashboard-container");
  
  // If not on dashboard page, exit early
  if (!dashboardContainer) {
    return;
  }

  if (isLoggedIn) {
    const userData = getUserData();
    const dashboardHeader = document.querySelector('.dashboard-header h2');
    
    if (dashboardHeader && userData) {
      // Update the header to show the user's name
      dashboardHeader.textContent = `Welcome back, ${userData.username}!`;
    }

    // Load user data initially
    initializeUserData(userData);
  }
}

async function initializeUserData(userData) {
  if (!userData || !userData.id) return;

  try {
    // Fetch user data from backend to get crash courses and summaries
    const response = await fetch(`/api/user/${userData.id}`);
    if (!response.ok) {
      console.error('Failed to fetch user history');
      return;
    }

    currentUserData = await response.json();
    
    // Update stats with actual data from backend
    updateStats();
    
    // Load first batch of summaries
    await loadMoreSummaries(0);
    
    // Load first batch of crash courses
    await loadMoreCrashCourses(0);

  } catch (err) {
    console.error('Error loading user history:', err);
  }
}

// ============================================================================
// DATA FETCHING FUNCTIONS
// ============================================================================

// SIMULATED DELAY FOR FETCHING SUMMARIES
async function fetchSummariesBatch(startIndex, limit) {
  
  // Simulate network delay (500ms - 1000ms)
  await new Promise(resolve => setTimeout(resolve, WAITING_RANGE_MS + Math.random() * WAITING_RANGE_MS));
  
  const allSummaries = currentUserData?.summaries || [];

  // Slicing the summary using startIndex and limit
  return {
    items: allSummaries.slice(startIndex, startIndex + limit),
    hasMore: startIndex + limit < allSummaries.length,
    total: allSummaries.length
  };
}

// SIMULATED DELAY FOR FETCHING CRASH COURSES
async function fetchCrashCoursesBatch(startIndex, limit) {
  
  // Simulate network delay (500ms - 1000ms)
  await new Promise(resolve => setTimeout(resolve, WAITING_RANGE_MS + Math.random() * WAITING_RANGE_MS));
  
  const allCourses = currentUserData?.crashCourses || [];
  return {
    items: allCourses.slice(startIndex, startIndex + limit),
    hasMore: startIndex + limit < allCourses.length,
    total: allCourses.length
  };
}

// ============================================================================
// MAIN LOAD FUNCTIONS
// ============================================================================

async function loadMoreSummaries(startIndex) {
  const container = document.querySelector('.summaries-list-container');
  const loadMoreBtn = document.getElementById('loadMoreSummaries');
  
  if (!container) return;

  const isFirstLoad = startIndex === 0;

  // Prepare UI for loading
  if (isFirstLoad) {
    container.innerHTML = '';
  } else if (loadMoreBtn) {
    loadMoreBtn.style.display = 'none';
  }

  showLoadingAnimation(container, 'summaries');

  try {
    const { items, hasMore, total } = await fetchSummariesBatch(startIndex, ITEMS_PER_PAGE);
    removeLoadingAnimation(container, 'summaries');

    // Handle empty state
    if (total === 0 && isFirstLoad) {
      showEmptyState(container, loadMoreBtn, 'summaries');
      return;
    }

    // Get or create history list
    const historyList = getOrCreateHistoryList(container);

    // Append new items
    items.forEach(summary => {
      historyList.appendChild(createSummaryItem(summary));
    });

    // Check if content overflows and enable scrolling if needed
    if (historyList.scrollWidth > historyList.clientWidth) {
      historyList.style.overflowX = 'auto';
    }

    // Update load more button
    updateLoadMoreButton(container, loadMoreBtn, hasMore, () => loadMoreSummaries(startIndex + ITEMS_PER_PAGE));

    // Enable scrolling when all items are loaded
    if (!hasMore) {
      historyList.style.overflowX = 'auto';
    }
  } catch (err) {
    console.error('Error loading summaries:', err);
    removeLoadingAnimation(container, 'summaries');
  }
}

async function loadMoreCrashCourses(startIndex) {
  const container = document.querySelector('.crash-courses-list-container');
  const loadMoreBtn = document.getElementById('loadMoreCrashCourses');
  
  if (!container) return;

  const isFirstLoad = startIndex === 0;

  // Prepare UI for loading
  if (isFirstLoad) {
    container.innerHTML = '';
  } else if (loadMoreBtn) {
    loadMoreBtn.style.display = 'none';
  }

  showLoadingAnimation(container, 'crash-courses');

  try {
    const { items, hasMore, total } = await fetchCrashCoursesBatch(startIndex, ITEMS_PER_PAGE);
    removeLoadingAnimation(container, 'crash-courses');

    // Handle empty state
    if (total === 0 && isFirstLoad) {
      showEmptyState(container, loadMoreBtn, 'crash-courses');
      return;
    }

    // Get or create history list
    const historyList = getOrCreateHistoryList(container);

    // Append new items
    items.forEach(course => {
      historyList.appendChild(createCrashCourseItem(course));
    });

    // Check if content overflows and enable scrolling if needed
    if (historyList.scrollWidth > historyList.clientWidth) {
      historyList.style.overflowX = 'auto';
    }

    // Update load more button
    updateLoadMoreButton(container, loadMoreBtn, hasMore, () => loadMoreCrashCourses(startIndex + ITEMS_PER_PAGE));

    // Enable scrolling when all items are loaded
    if (!hasMore) {
      historyList.style.overflowX = 'auto';
    }
  } catch (err) {
    console.error('Error loading crash courses:', err);
    removeLoadingAnimation(container, 'crash-courses');
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function updateStats() {
  const statsSection = document.querySelector('.dashboard-stats');
  if (statsSection && currentUserData) {
    statsSection.style.display = 'flex';
    const totalSummaries = currentUserData.summaries?.length || 0;
    const totalCrashCourses = currentUserData.crashCourses?.length || 0;
    document.getElementById('statSummaries').textContent = totalSummaries;
    document.getElementById('statCrashCourses').textContent = totalCrashCourses;
  }
}

function getOrCreateHistoryList(container) {
  let historyList = container.querySelector('.history-list');
  if (!historyList) {
    historyList = document.createElement('div');
    historyList.className = 'history-list';
    container.appendChild(historyList);
  }
  return historyList;
}

function updateLoadMoreButton(container, loadMoreBtn, hasMore, onClickHandler) {
  if (!loadMoreBtn) return;

  // Remove any existing load-more-btn elements
  const existingBtn = container.querySelector('.load-more-btn');
  if (existingBtn) existingBtn.remove();

  if (hasMore) {
    loadMoreBtn.style.display = 'flex';
    loadMoreBtn.onclick = onClickHandler;
    container.appendChild(loadMoreBtn);
  } else {
    loadMoreBtn.style.display = 'none';
  }
}

// ============================================================================
// TEMPLATE/RENDERING FUNCTIONS
// ============================================================================

function showLoadingAnimation(container, type) {
  const template = document.getElementById('loading-template');
  if (!template) {
    console.error('Loading template not found');
    return;
  }
  
  const loadingOverlay = template.content.cloneNode(true).querySelector('.loading-overlay');
  loadingOverlay.id = `loading-${type}`;
  container.appendChild(loadingOverlay);
}

function removeLoadingAnimation(container, type) {
  const loadingElement = document.getElementById(`loading-${type}`);
  if (loadingElement) {
    loadingElement.remove();
  }
}

function showEmptyState(container, loadMoreBtn, type) {
  const template = document.getElementById('empty-state-template');
  if (!template) {
    console.error('Empty state template not found');
    return;
  }
  
  const emptyState = template.content.cloneNode(true);
  const line1 = emptyState.querySelector('[data-line1]');
  const line2 = emptyState.querySelector('[data-line2]');
  
  if (type === 'summaries') {
    line1.textContent = 'No summaries generated yet.';
    line2.textContent = 'Create your first summary to see it here!';
  } else {
    line1.textContent = 'No crash courses generated yet.';
    line2.textContent = 'Create your first crash course to see it here!';
  }
  
  container.appendChild(emptyState);
  if (loadMoreBtn) loadMoreBtn.style.display = 'none';
}

function createSummaryItem(summary) {
  const template = document.getElementById('history-item-template');
  if (!template) {
    console.error('History item template not found');
    return document.createElement('div');
  }
  
  const item = template.content.cloneNode(true).querySelector('.history-item');
  
  const date = new Date(summary.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  // Try to get preview from different possible fields
  let preview = 'No preview available';
  if (summary.summary) {
    preview = summary.summary;
  } else if (summary.overview) {
    preview = summary.overview;
  } else if (summary.content) {
    preview = typeof summary.content === 'string' ? summary.content : JSON.stringify(summary.content).substring(0, 150);
  }

  // Limit preview length
  if (preview.length > 200) {
    preview = preview.substring(0, 200) + '...';
  }

  // Populate template
  item.querySelector('[data-title]').textContent = summary.fileName || 'PDF Summary';
  item.querySelector('[data-date]').textContent = date;
  item.querySelector('[data-preview]').textContent = preview;

  // Add click handler to view full summary
  item.addEventListener('click', () => {
    viewSummary(summary);
  });

  return item;
}

function createCrashCourseItem(course) {
  const template = document.getElementById('history-item-template');
  if (!template) {
    console.error('History item template not found');
    return document.createElement('div');
  }
  
  const item = template.content.cloneNode(true).querySelector('.history-item');
  
  const date = new Date(course.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const preview = course.summary || course.overview || 'No preview available';

  // Populate template
  item.querySelector('[data-title]').textContent = course.topic || 'Crash Course';
  item.querySelector('[data-date]').textContent = date;
  item.querySelector('[data-preview]').textContent = preview;

  // Add click handler to view full crash course
  item.addEventListener('click', () => {
    viewCrashCourse(course);
  });

  return item;
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

function viewSummary(summary) {
  // TODO: Implement summary viewing functionality
  console.log('View summary:', summary);
  // Could redirect to summary page with loaded data, or show in modal
}

function viewCrashCourse(course) {
  // TODO: Implement crash course viewing functionality
  console.log('View crash course:', course);
  // Could redirect to crash course page with loaded data, or show in modal
}

