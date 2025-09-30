document.addEventListener("DOMContentLoaded", () => {
  // ===== NAVBAR ELEMENTS =====
  const homeLink = document.querySelector(".nav-left a");       // HOME
  const crashCourseLink = document.querySelector(".nav-center a:nth-child(1)"); // CRASH COURSE
  const practiceTestLink = document.querySelector(".nav-center a:nth-child(2)"); // PRACTICE TEST
  const summaryLink = document.querySelector(".nav-center a:nth-child(3)"); // SUMMARY
  const loginBtn = document.getElementById("loginBtn");          // LOGIN / ACCOUNT

  // ===== LOGIN STATE =====
  let isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

  // --- ALWAYS if logged in ---
  if (isLoggedIn && loginBtn) {
    loginBtn.innerHTML = `
      <img src="../assets/avatar_placeholder.png" alt="User" class="avatar"> Account Settings
    `;
    loginBtn.classList.remove("login");
    loginBtn.classList.add("account");
    loginBtn.href = "#"; // adjust later
  }

  // ===== PAGE-SPECIFIC HOOKS =====

  // --- HOME ---
  if (homeLink) {
    if (isLoggedIn) {
      // logic for HOME when logged in
    } else {
      // logic for HOME when not logged in
    }
  }

  // --- CRASH COURSE ---
  if (crashCourseLink) {
    if (isLoggedIn) {
      // logic for CRASH COURSE when logged in
    } else {
      // logic for CRASH COURSE when not logged in
    }
  }

  // --- PRACTICE TEST ---
  if (practiceTestLink) {
    if (isLoggedIn) {
      // logic for PRACTICE TEST when logged in
    } else {
      // logic for PRACTICE TEST when not logged in
    }
  }

  // --- SUMMARY ---
  if (summaryLink) {
    if (isLoggedIn) {
      // logic for SUMMARY when logged in
    } else {
      // logic for SUMMARY when not logged in
    }
  }

  // --- LOGIN / ACCOUNT TOGGLE (dummy simulation) ---
  if (loginBtn) {
    loginBtn.addEventListener("click", (e) => {
      e.preventDefault();

      if (isLoggedIn) {
        // Simulate logout
        localStorage.removeItem("isLoggedIn");
        isLoggedIn = false;
      } else {
        // Simulate login
        localStorage.setItem("isLoggedIn", "true");
        isLoggedIn = true;
      }

      // Refresh to re-run state checks
      location.reload();
    });
  }
});
