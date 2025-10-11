/*
  script.js
  
  Main client-side script for NoteSmith web application.
  Handles navigation bar logic, theme toggling (light/dark), login/logout simulation,
  and page-specific UI state (e.g., showing/hiding content based on authentication).
  Also manages placeholder logic for crash course and summary features.
  
  Features (so far)
  - Dynamic navbar links and account button based on login state.
  - Theme switching with persistent user preference.
  - Page-specific UI for home, crash course, practice test, and summary pages based on login state.
  - Simulated login/logout using localStorage.

*/

document.addEventListener("DOMContentLoaded", () => {
  
  // ============================================ NAVBAR ELEMENTS =================================================================
  const homeLink = document.querySelector(".nav-left a");                             // HOME
  const crashCourseLink = document.querySelector(".nav-center a:nth-child(1)");       // CRASH COURSE
  const practiceTestLink = document.querySelector(".nav-center a:nth-child(2)");      // PRACTICE TEST
  const summaryLink = document.querySelector(".nav-center a:nth-child(3)");           // SUMMARY
  const loginBtn = document.getElementById("loginBtn");                               // LOGIN / ACCOUNT
  const toggleButton = document.getElementById('theme-toggle');
  const body = document.body;
  const userNameElement = document.getElementById("userName");                        // For the dashboard greeting
  const logoutBtn = document.getElementById("logoutBtn"); 
  const userName = "John Doe";                                                        // will get replaced with whatever the user is
  let isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  
  // Determine if we are on index.html or not (helpful for relative paths)    
  const isIndex = window.location.pathname.endsWith('index.html');

  // ============================================ ALWAYS if logged in =============================================================
  if (isLoggedIn && loginBtn) {
    loginBtn.innerHTML = `
      <img src="../assets/avatar_placeholder.png" alt="User" class="avatar"> Account Settings
    `;
    loginBtn.classList.remove("login");
    loginBtn.classList.add("account");
    loginBtn.href = "#"; // adjust later
  }

  // ============================================ ALWAYS if logged in =============================================================


  // ============================================ THEME SETTINGS ==================================================================
  
  const currentTheme = localStorage.getItem('theme');
  
  // Select the toggle button and change text content and aria-label
  if (toggleButton) {
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
    }``

    // Update logo based on theme and page
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

    // Theme changing logic
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

  // ==================================================== GEMINI API ===================================================================

  // General functions:
async function generateContent(prompt) {
    const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
    });
    if (!response.ok) throw new Error('Failed to contact Gemini API');
    return await response.json();
}

const checkForResponse = async (data) => {
    /*
        Checks if the API response contains valid content.
        Returns true if valid content is found, otherwise false.

        Parsing method:
        - Ensure 'data' is defined and has a 'candidates' array.
        - Check if the first candidate exists and has a 'content' object.
        - Verify that 'content' has a 'parts' array.
        - Ensure the first part exists and contains a 'text' property.
    */
    if (
        data &&
        data.candidates &&
        data.candidates[0] &&
        data.candidates[0].content &&
        data.candidates[0].content.parts &&
        data.candidates[0].content.parts[0] &&
        data.candidates[0].content.parts[0].text
    ) {
        return true;
    }
    return false;
}

  // CrashCourse specific functions and classes:
class CrashCourse {
  static validateSchema(obj) {
    /*
      Validates the structure of the JSON object against the expected schema.
      Returns true if the object matches the schema, otherwise false.
    */

    if (
      typeof obj !== "object" ||
      typeof obj.topic !== "string" ||
      typeof obj.summary !== "string" ||
      typeof obj.overview !== "string" ||
      !Array.isArray(obj.main_topics) ||
      typeof obj.conclusion !== "string"
    ) return false;

    for (const topic of obj.main_topics) {
      if (
        typeof topic !== "object" ||
        typeof topic.title !== "string" ||
        typeof topic.description !== "string" ||
        !Array.isArray(topic.subtopics) ||
        topic.subtopics.length !== 3
      ) return false;

      for (const sub of topic.subtopics) {
        if (
          typeof sub !== "object" ||
          typeof sub.title !== "string" ||
          typeof sub.details !== "string"
        ) return false;
      }
    }
    return true;
  }

  static async getValidJsonResponse(prompt, maxRetries = 3) {
    /*
      Attempts to get a valid JSON response from the Gemini API based on the provided prompt.
      Retries up to 'maxRetries' times if the response is invalid or does not match the schema.
      Logs the valid JSON response or an error message if all attempts fail.
      
      Important note: Remove the markdown code block markers (```json ... ```) from the response 
      before parsing.
    */

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const data = await generateContent(prompt);
        if (!checkForResponse(data)) {
          console.log(`Attempt ${attempt}: No valid response found. Retrying...`);
          continue;
        }

        let text = data.candidates[0].content.parts[0].text;
        // Remove Markdown code block markers if present
        text = text.replace(/^```(?:json)?\s*([\s\S]*?)\s*```$/i, '$1').trim();

        let json;
        try {
          json = JSON.parse(text);
        } catch {
          console.log(`Attempt ${attempt}: Response is not valid JSON. Retrying...`);
          console.log("Received text:", text);
          continue;
        }

        if (CrashCourse.validateSchema(json)) {
          console.log(JSON.stringify(json, null, 2));
          return json;
        } else {
          console.log(`Attempt ${attempt}: JSON does not match schema. Retrying...`);
        }

      } catch (err) {
        console.error(`Attempt ${attempt}: Error -`, err);
      }
    }
    console.log("Failed to get valid JSON response after maximum retries.");
    return null;
  }

  static createPrompt(topic) {
    return `
      Generate a structured crash course on: ${topic}
      Each main topic must have exactly 3 subtopics.
      Follow word limits strictly.
      Output must be valid JSON only.

      Schema:
      {
        "topic": "string",
        "summary": "string, ≤50 words",
        "overview": "string, ≤80 words",
        "main_topics": [
        {
          "title": "string",
          "description": "string, ≤60 words",
          "subtopics": [
          {
            "title": "string, ≤10 words",
            "details": "string, ≤70 words"
          },
          {
            "title": "string, ≤10 words",
            "details": "string, ≤70 words"
          },
          {
            "title": "string, ≤10 words",
            "details": "string, ≤70 words"
          }
          ]
        }
        ],
        "conclusion": "string, ≤40 words"
      }
    `;
  }

}
  // =================================================================================================================================== 

  // ============================================ THEME SETTINGS ==================================================================

  // ============================================ PAGE SPECIFIC SETTINGS ==========================================================

  // ====================================================== HOME ==================================================================

  const currentPagePath = window.location.pathname;

if (homeLink) {
  // Always use absolute paths from project root for Node.js static server
  if (isLoggedIn) {
    homeLink.href = "/pages/dashboard.html";
  } else {
    homeLink.href = "/index.html";
  }
}

// Update nav-center links to use absolute paths
if (crashCourseLink) crashCourseLink.href = "/pages/crash_course.html";
if (practiceTestLink) practiceTestLink.href = "/pages/practice_tests.html";
if (summaryLink) summaryLink.href = "/pages/summary.html";


// ============================================ CRASH COURSE =====================================================================
const crashCourseContainer = document.querySelector(".crash-course-container");
const lockedMessage = document.getElementById("locked-message");
const crashForm = document.getElementById("crash-course-form");

if (crashCourseContainer) {
  if (isLoggedIn) {
    crashForm.style.display = "block";
    lockedMessage.style.display = "none";
  } else {
    lockedMessage.style.display = "block";
    crashForm.style.display = "none";
  }
}

const generateBtn = document.getElementById("generateBtn");
if (generateBtn) {
  generateBtn.addEventListener("click", async () => {
    const topic = document.getElementById("topicInput").value.trim();
    const output = document.getElementById("output");

    if (!topic) {
      output.style.display = "block";
      output.innerHTML = "<p>Please enter a topic.</p>";
      return;
    }

    output.style.display = "block";
    output.innerHTML = `<div id='crash-loading' style='display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:220px;'>
      <lottie-player id='crash-lottie' src="../assets/loading_light.json" background="transparent" speed="1" style="width:120px;height:120px;margin-bottom:1rem;" loop autoplay></lottie-player>
      <span style='color:var(--clr_text_muted);font-size:1.1rem;'>Generating crash course...</span>
    </div>`;

    const theme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
    const lottie = output.querySelector('#crash-lottie');
    if (lottie) {
      lottie.setAttribute('src', theme === 'dark' ? '../assets/loading_dark.json' : '../assets/loading_light.json');
    }

    try {
      // Use CrashCourse class methods
      const prompt = CrashCourse.createPrompt(topic);
      const data = await CrashCourse.getValidJsonResponse(prompt);
      if (!data) throw new Error('No valid response from Gemini.');

      output.innerHTML = renderCrashCourse(data);
    } catch (err) {
      output.innerHTML = `<p style='color:var(--clr_error);text-align:center;'>Error: ${err.message || 'Failed to generate crash course.'}</p>`;
    }
  });
}

// Helper to render crash course JSON to HTML
function renderCrashCourse(data) {
  
  // Check for errors
  if (!data || typeof data !== 'object') return '<p>Invalid crash course data.</p>';
  
  // Define the structure and style of the response (should be in styles.css but inline for now)
  
  let html = `<div style="max-width:100%; width:98vw; margin:0 auto;">`;
  (function ensureCrashShineStyle() {
    const styleId = 'crash-shine-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .crash-shine {
          position: relative;
          display: inline-block;
          color: var(--clr_primary);
          background: linear-gradient(
            90deg,
            var(--clr_primary),
            var(--clr_contrasting_accent),
            var(--clr_primary)
          );
          background-size: 200% auto;
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: crashShine 4.2s linear infinite;
        }
        @keyframes crashShine {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `;
      document.head.appendChild(style);
    }
  })();

  html += `<h3 style="text-align:center;font-size:2rem;color:var(--clr_primary);margin-bottom:0.7rem;">
    Crash Course on <span class="crash-shine">${data.topic}</span>
    </h3>`;

  html += `<p style='font-size:1.1rem;color:var(--clr_text);margin-bottom:1.5rem;text-align:center;'>${data.summary || ''}</p>`;
  html += `<div style='margin-bottom:1.5rem;'><span style="font-weight:650;color:var(--clr_accent);">Overview: </span>${data.overview || ''}</div>`;
  
  // Check if there's main topics
  if (Array.isArray(data.main_topics)) {
    data.main_topics.forEach(topic => {
      html += `<div style="margin-bottom:2rem;">`;
      html += `<div style="font-size:1.15rem;font-weight:600;color:var(--clr_primary);margin-bottom:0.3rem;">${topic.title}</div>`;
      html += `<div style="margin-bottom:0.5rem;color:var(--clr_text);">${topic.description}</div>`;
      
      // Check for subtopics
      if (Array.isArray(topic.subtopics)) {
        html += `<ul style="margin-left:1.2rem;margin-bottom:0.2rem;">`;
        topic.subtopics.forEach(sub => {
          html += `<li style="margin-bottom:0.4rem;">
            <span style="font-weight:650;color:var(--clr_accent);">${sub.title}:</span> <span style="color:var(--clr_text);">${sub.details}</span>
          </li>`;
        });
        html += `</ul>`;
      }
      html += `</div>`;
    });
  }
  html += `<div style='margin-top:2rem;font-size:1.08rem;'><span style="font-weight:600;color:var(--clr_primary);">Conclusion:</span> ${data.conclusion || ''}</div>`;
  html += `</div>`;
  return html;
}


  // ============================================================ PRACTICE TEST ========================================================
  
  if (practiceTestLink) {
    if (isLoggedIn) {
      // logic for PRACTICE TEST when logged in
    } else {
      // logic for PRACTICE TEST when not logged in
    }
  }


// ================================================================= SUMMARY ============================================================

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

// Upon choosing a file change the UI:
const pdfInput = document.getElementById("pdfUpload");
if (pdfInput) {
  pdfInput.addEventListener("change", () => {
    const file = pdfInput.files[0];
    const fileInfo = document.getElementById("fileInfo");
    if (file) {
      fileInfo.textContent = `Selected file: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
    } else {
      fileInfo.textContent = "No file selected.";
    }
  });
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

  // =========================================================== LOGIN ================================================================
  if (loginBtn) {
    loginBtn.addEventListener("click", (e) => {
      e.preventDefault();

      if (isLoggedIn) {
        // Simulate logout
        localStorage.removeItem("isLoggedIn");
        isLoggedIn = false;
        location.reload();
        window.location.href = "../index.html";
      } else {
        // Simulate login
        localStorage.setItem("isLoggedIn", "true");
        isLoggedIn = true;
        location.reload();
        
        if (isIndex) {
          window.location.href = "./pages/dashboard.html";
        } else {

          // For now stay in the page
          return;
          
          // Go to the dashboard
          // window.location.href = "./pages/dashboard.html";0
        }
      }

      // Refresh to re-run state checks
    });
  }
});

if (userNameElement && logoutBtn) {
    
    userNameElement.textContent = `Welcome, ${userName}!`;

    // Logout button handler for the dashboard nav bar
    logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        
        // 1. Simulate logout
        localStorage.removeItem("isLoggedIn");
        isLoggedIn = false;
        
        // 2. Redirect to the public homepage (index.html)
        window.location.href = "./index.html"; 
    });
}
  // ============================================ PAGE SPECIFIC SETTINGS ==========================================================