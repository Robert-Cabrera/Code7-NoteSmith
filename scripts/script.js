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
const crashCourseContainer = document.querySelector(".crash-course-container");
const lockedMessage = document.getElementById("locked-message");
const crashForm = document.getElementById("crash-course-form");

if (crashCourseContainer) {
  if (isLoggedIn) {
    crashForm.style.display = "block";     // show form
    lockedMessage.style.display = "none";
  } else {
    lockedMessage.style.display = "block"; // show locked message
    crashForm.style.display = "none";
  }
}

// --- Place holder ---
const generateBtn = document.getElementById("generateBtn");
if (generateBtn) {
  generateBtn.addEventListener("click", () => {
    const topic = document.getElementById("topicInput").value.trim();
    const output = document.getElementById("output");

    if (!topic) {
      output.style.display = "block";       // show box
      output.innerHTML = "<p>Please enter a topic.</p>";
      return;
    }

    // Show output box and inject content
    output.style.display = "block";
    output.innerHTML = `
      <h3>Crash Course on ${topic}</h3>
      <ul>
        <li><b>What it is:</b> Quick definition.</li>
        <li><b>Why it matters:</b> Plain-language reason.</li>
        <li><b>3 key points:</b> Basics explained.</li>
        <li><b>Example:</b> Simple illustration.</li>
        <li><b>Next steps:</b> Resources to learn more.</li>
      </ul>
    `;
  });
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
const summaryContainer = document.querySelector(".summary-container");
const summaryLocked = document.getElementById("summary-locked");
const summaryUI = document.getElementById("summary-ui");
const summarizeBtn = document.getElementById("summarizeBtn");
const summaryOutput = document.getElementById("summary-output");

if (summaryContainer) {
  if (isLoggedIn) {
    summaryUI.style.display = "block";
    summaryLocked.style.display = "none";
  } else {
    summaryLocked.style.display = "block";
    summaryUI.style.display = "none";
  }
}

// Summarize button logic
if (summarizeBtn) {
  summarizeBtn.addEventListener("click", () => {
    const pdf = document.getElementById("pdfUpload").files[0];
    if (!pdf) {
      summaryOutput.style.display = "block";
      summaryOutput.innerHTML = "<p style='text-align:center;'>Please upload a PDF first.</p>";
      return;
    }

    // AI summary (fake for now)
    summaryOutput.style.display = "block";
    summaryOutput.innerHTML = `
      <h3>Summary of "${pdf.name}"</h3>
      <ul>
        <li><b>Overview:</b> This is a placeholder summary generated for the uploaded PDF.</li>
        <li><b>Key Points:</b> The AI would normally extract main ideas from each section.</li>
        <li><b>Length:</b> About 3–5 bullet points per page.</li>
        <li><b>Next Steps:</b> Replace with actual AI backend call.</li>
      </ul>
    `;
  });
}

  // --- LOGIN / ACCOUNT TOGGLE ---
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
