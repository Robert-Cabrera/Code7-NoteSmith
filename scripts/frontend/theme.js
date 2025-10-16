/*
  theme.js
  
  Handles theme toggling (light/dark mode) and logo updates.
  Manages persistent theme preference using localStorage.
*/

export function initTheme() {
  const toggleButton = document.getElementById('theme-toggle');
  const body = document.body;
  const currentTheme = localStorage.getItem('theme');
  
  // Determine if we are on index.html or not (helpful for relative paths)    
  const isIndex = window.location.pathname.endsWith('index.html');

  if (!toggleButton) return;

  const logoElement = document.querySelector('.logo');

  function updateButtonIcon(theme) {
    /*
      Updates the theme toggle button's icon and aria-label based on the current theme.
      (the aria-label is for screen readers and accessibility)

      - If the theme is 'dark-theme', sets the button to indicate switching to light mode.
      - If the theme is 'light-theme', sets the button to indicate switching to dark mode.
    */
    if (theme === 'dark-theme') {
      toggleButton.setAttribute('aria-label', 'Switch to light theme');
      toggleButton.textContent = 'Light Mode';
    } else {
      toggleButton.setAttribute('aria-label', 'Switch to dark theme');
      toggleButton.textContent = 'Dark Mode';
    }
  }

  function updateLogo(theme) {
    /*
      Updates the logo image source based on the current theme and page context.
      - If on index.html, uses './assets/' path.
      - If on other pages, uses '../assets/' path.
      - Uses 'NoteSmith_logo_dark.png' for dark theme and 'NoteSmith_logo.png' for light theme.
    */
    if (logoElement) {
      let basePath = isIndex ? './assets/' : '../assets/';

      if (theme === 'dark-theme') {
        logoElement.src = basePath + 'NoteSmith_logo_dark.png';
      } else {
        logoElement.src = basePath + 'NoteSmith_logo.png';
      }
    }
  }

  // Theme initialization logic
  if (currentTheme) {
    body.classList.add(currentTheme);
    updateButtonIcon(currentTheme);
    updateLogo(currentTheme);
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    body.classList.add('dark-theme');
    updateButtonIcon('dark-theme');
    updateLogo('dark-theme');
  } else {
    updateButtonIcon('light-theme');
    updateLogo('light-theme');
  }

  // Theme toggle event listener
  toggleButton.addEventListener('click', () => {
    const isDark = body.classList.contains('dark-theme');

    if (isDark) {
      body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light-theme');
      updateButtonIcon('light-theme');
      updateLogo('light-theme');
    } else {
      body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark-theme');
      updateButtonIcon('dark-theme');
      updateLogo('dark-theme');
    }
  });
}
