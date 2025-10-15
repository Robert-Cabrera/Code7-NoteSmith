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
  - Crash course generation using Gemini API with structured output.
  - PDF summarization with token count check using Gemini API with structured output.

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
    } ``

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

    static async getValidJsonResponse(prompt) {
      /*
        Gets a valid JSON response from the Gemini API using structured output.
        Uses the CrashCoursePrompt.json schema for guaranteed valid responses.
        The schema is loaded and applied on the server side.
      */

      let response, data;
      
      try {
        response = await fetch('/api/crash-course', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt })
        });
      } catch (networkError) {
        throw new Error('Network error while generating crash course');
      }

      if (!response.ok) {
        throw new Error('Failed to generate crash course');
      }

      try {
        data = await response.json();
      } catch (parseError) {
        throw new Error('Failed to parse crash course response');
      }

      // Extract the actual JSON from Gemini response structure
      if (checkForResponse(data)) {
        const jsonText = data.candidates[0].content.parts[0].text;
        
        let parsedData;
        try {
          // When using structured output, the text is already valid JSON
          parsedData = JSON.parse(jsonText);
        } catch (parseError) {
          console.error('Failed to parse JSON response:', jsonText);
          throw new Error('Failed to parse API response as JSON');
        }

        // Log the parsed data for debugging
        console.log('Parsed crash course data:', parsedData);

        if (!CrashCourse.validateSchema(parsedData)) {
          console.error('Schema validation failed for:', parsedData);
          throw new Error('Response does not match expected schema');
        }

        return parsedData;
      }

      throw new Error('Invalid response format from API');
    }

    static createPrompt(topic) {
      return `
      Generate a comprehensive crash course on: ${topic}

      Guidelines:
      - Provide a concise summary (≤50 words) that captures the essence of the topic.
      - Include an overview (≤80 words) explaining what will be covered.
      - Create multiple main topics, each with a description (≤60 words).
      - For each main topic, include exactly 3 subtopics:
        * Each subtopic title should be ≤10 words
        * Each subtopic details should be ≤70 words
      - End with a conclusion (≤40 words) that ties everything together.
      
      Make the content educational, clear, and easy to understand for someone learning this topic for the first time.
    `;
    }

  }

  // Summary specific functions and classes:
  class Summary {

    static async getPDFTokenCount(file) {
      const formData = new FormData();
      formData.append('pdf', file);

      const response = await fetch('/api/pdf-token-count', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to get token count');
      }

      const data = await response.json();
      return data;
    }

    static createPrompt(totalPages) {
      
      // Determine if we do page-by-page or grouped summaries
      
      if (totalPages <= 20) {
        // Page-by-page summary for 20 or fewer pages
        return `
      Analyze the attached PDF, which has a total of ${totalPages} pages.

      1. **Global Analysis:** Provide the 'document_title', 'executive_summary', and 3 'key_findings'.
      2. **Page-by-Page Analysis:** For the 'section_summaries' array, provide a summary for EACH individual page.
         * For page 1, use page_range "1"
         * For page 2, use page_range "2"
         * Continue for all ${totalPages} pages
         * For each page, provide **EXACTLY 3 distinct, concise bullet points** summarizing that specific page's content.
         * If a page is a title page, table of contents, or mostly empty, still include it but note this in the summary points.
      
      Return the output STRICTLY in the provided JSON schema format.
      Be thorough, accurate, and concise in your summaries.
    `;
      } else {
        // Grouped summary for more than 20 pages
        let groupSize;
        if (totalPages <= 40) {
          groupSize = 5;
        } else if (totalPages <= 75) {
          groupSize = 10;
        } else if (totalPages <= 150) {
          groupSize = 20;
        } else if (totalPages <= 300) {
          groupSize = 25;
        } else {
          groupSize = 50;
        }

        return `
      Analyze the attached PDF, which has a total of ${totalPages} pages.

      1. **Global Analysis:** Provide the 'document_title', 'executive_summary', and 3 'key_findings'.
      2. **Section Analysis:** For the 'section_summaries' array, group the content into chunks of ${groupSize} pages each.
         * The first summary must cover pages 1 to ${groupSize} (use page_range "1-${groupSize}").
         * The next summary must cover pages ${groupSize + 1} to ${groupSize * 2} (use page_range "${groupSize + 1}-${groupSize * 2}"), and so on, until the end of the document.
         * For each resulting section, provide **EXACTLY 3 distinct, concise bullet points** summarizing the entire chunk.
      
      Return the output STRICTLY in the provided JSON schema format.
      Be thorough, accurate, and concise in your summaries.
    `;
      }
    }

    static async summarizePDF(file, prompt, totalPages) {
      /*
        Sends PDF file and prompt to the backend for summarization.
        Returns the structured JSON response from Gemini API.
        The schema is defined on the server side.
      */
      const formData = new FormData();
      formData.append('pdf', file);
      formData.append('prompt', prompt);

      const response = await fetch('/api/summarize-pdf', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to summarize PDF');
      }

      const data = await response.json();

      // Extract the actual JSON from Gemini response structure
      if (checkForResponse(data)) {
        const jsonText = data.candidates[0].content.parts[0].text;
        
        let parsedData;
        try {
          // When using structured output, the text is already valid JSON
          parsedData = JSON.parse(jsonText);
        } catch (parseError) {
          console.error('Failed to parse JSON response:', jsonText);
          throw new Error('Failed to parse API response as JSON');
        }

        // Log the parsed data for debugging
        console.log('Parsed summary data:', parsedData);

        if (!Summary.validateSchema(parsedData)) {
          console.error('Schema validation failed for:', parsedData);
          console.error('Validation details:');
          console.error('- Has document_title:', typeof parsedData.document_title === 'string');
          console.error('- Has executive_summary:', typeof parsedData.executive_summary === 'string');
          console.error('- Has key_findings:', Array.isArray(parsedData.key_findings));
          console.error('- key_findings length:', parsedData.key_findings?.length);
          console.error('- Has section_summaries:', Array.isArray(parsedData.section_summaries));
          console.error('- section_summaries length:', parsedData.section_summaries?.length);
          
          throw new Error('Response does not match expected schema');
        }

        return parsedData;
      }

      throw new Error('Invalid response format from API');
    }
    
    static validateSchema(obj) {
      /*
        Validates the structure of the JSON object against the expected summary schema.
        Returns true if the object matches the schema, otherwise false.
        Note: We check for minimum requirements but allow some flexibility in array lengths.
      */
      if (
        typeof obj !== "object" ||
        typeof obj.document_title !== "string" ||
        typeof obj.executive_summary !== "string" ||
        !Array.isArray(obj.key_findings) ||
        obj.key_findings.length < 1 ||  // At least 1 finding (ideally 3)
        !Array.isArray(obj.section_summaries) ||
        obj.section_summaries.length < 1  // At least 1 section
      ) return false;

      for (const finding of obj.key_findings) {
        if (typeof finding !== "string") return false;
      }

      for (const section of obj.section_summaries) {
        if (
          typeof section !== "object" ||
          typeof section.page_range !== "string" ||
          !Array.isArray(section.summary_points) ||
          section.summary_points.length < 1  // At least 1 point (ideally 3)
        ) return false;

        for (const point of section.summary_points) {
          if (typeof point !== "string") return false;
        }
      }
      return true;
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
  let sizeLimitElem = document.getElementById("size-limit");

  const FILE_SIZE_LIMIT_MB = 30;  // 30MB limit
  const TOKEN_LIMIT = 20000;      // 20,000 token limit

  if (summaryContainer) {
    if (isLoggedIn) {
      summaryUI.style.display = "block";
      summaryLocked.style.display = "none";
      sizeLimitElem = document.getElementById("size-limit");
      sizeLimitElem.textContent = `Maximum file size: ${FILE_SIZE_LIMIT_MB}MB`;

    } else {
      summaryLocked.style.display = "block";
      summaryUI.style.display = "none";
    }
  }  


  // Get PDF upload elements
  const pdfInput = document.getElementById("pdfUpload");
  const uploadBox = document.querySelector(".upload-box");

  // Variable to store the current PDF's page count
  let currentPdfPageCount = 0;

  if (pdfInput && uploadBox) {

    // Create a container for the PDF info display (hidden initially)
    const pdfInfoContainer = document.createElement("div");
    pdfInfoContainer.id = "pdf-info-container";
    pdfInfoContainer.style.display = "none";

    // We will display information on the upload box
    pdfInfoContainer.className = "upload-box";
    uploadBox.parentNode.insertBefore(pdfInfoContainer, uploadBox.nextSibling);

    // Handle PDF selection  - encompassing all logic
    pdfInput.addEventListener("change", async (e) => {

      // Retrieve the selected file
      const file = e.target.files[0];

      if (!file) {
        // Reset to upload state
        currentPdfPageCount = 0;
        uploadBox.style.display = "flex";
        pdfInfoContainer.style.display = "none";
        pdfInfoContainer.innerHTML = "";
        summaryOutput.style.display = "none";
        summaryOutput.innerHTML = "";
        return;
      }

      // PDF size limit
      const maxSizeBytes = FILE_SIZE_LIMIT_MB * 1024 * 1024; // 30MB in bytes

      // Show file is too big - error message
      if (file.size > maxSizeBytes) {
        uploadBox.style.display = "none";
        pdfInfoContainer.style.display = "flex";
        pdfInfoContainer.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;gap:1rem;justify-content:center;width:100%;padding:1.5rem;">
          <div style="font-size:3rem;color:#dc3545;">Error!</div>
          <div style="text-align:center;">
            <div style="font-weight:600;color:#dc3545;font-size:1.2rem;">File is too big</div>
            <div style="color:var(--clr_text_muted);margin-top:0.5rem;">
              Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB. Maximum allowed size is ${FILE_SIZE_LIMIT_MB}MB.
            </div>
          </div>
          <button id="removePdfBtn" style="padding:0.6rem 1.2rem;background:#dc3545;color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600;transition:all 0.3s ease;box-shadow:0 2px 4px rgba(0,0,0,0.1);">Choose Another File</button>
        </div>
      `;

        const removeBtn = document.getElementById("removePdfBtn");
        if (removeBtn) {
          removeBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            pdfInput.value = "";
            uploadBox.style.display = "flex";
            pdfInfoContainer.style.display = "none";
            pdfInfoContainer.innerHTML = "";
          });
        }
        return;
      }

      // Retrieve page count using PDF.js
      let pageCount = 0;
      if (typeof pdfjsLib !== 'undefined') {

        // Set the worker source for PDF.js
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        pageCount = pdf.numPages;
        currentPdfPageCount = pageCount; // Store for later use

        const pageCountElem = document.getElementById("pdf-page-count");
      } else {
        throw new Error('PDF.js not loaded');
      }

      // Retrieve token count from Gemini-API server
      const data = await Summary.getPDFTokenCount(file);
      console.log('Token count data:', data);

      // Show file is too dense - error message
      if (data.totalTokens > TOKEN_LIMIT) {
        uploadBox.style.display = "none";
        pdfInfoContainer.style.display = "flex";
        pdfInfoContainer.innerHTML = `
          <div style="display:flex;flex-direction:column;align-items:center;gap:1rem;justify-content:center;width:100%;padding:1.5rem;">
            <div style="font-size:3rem;color:#dc3545;">Error!</div>
            <div style="text-align:center;">
              <div style="font-weight:600;color:#dc3545;font-size:1.2rem;">File is too dense!</div>
              <div style="color:var(--clr_text_muted);margin-top:0.5rem;">
                Your PDF is too dense!<br>
                Try separating it into parts or please upload a smaller document.
              </div>
            </div>
            <button id="removePdfBtn" style="padding:0.6rem 1.2rem;background:#dc3545;color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600;transition:all 0.3s ease;box-shadow:0 2px 4px rgba(0,0,0,0.1);">Choose Another File</button>
          </div>
        `;

        const removeBtn = document.getElementById("removePdfBtn");
        if (removeBtn) {
          removeBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            pdfInput.value = "";
            uploadBox.style.display = "flex";
            pdfInfoContainer.style.display = "none";
            pdfInfoContainer.innerHTML = "";
          });
        }
        return; // Stop execution here - don't continue to show "File is valid"
      }

      // If everything is good: hide upload box, show PDF info
      uploadBox.style.display = "none";
      pdfInfoContainer.style.display = "flex";
      pdfInfoContainer.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;gap:1rem;justify-content:center;width:100%;padding:1.5rem;">
        <lottie-player src="../assets/pdf.json" background="transparent" speed="1" style="width:80px;height:80px;" loop autoplay></lottie-player>
        <div style="text-align:center;">
          <div style="font-weight:600;color:var(--clr_primary);">File: ${file.name}</div>
          <div id="pdf-page-count" style="color:var(--clr_text_muted);font-size:1rem;">Detecting page count...</div>
          <div id="pdf-token-count" style="color:var(--clr_text_muted);font-size:0.9rem;margin-top:0.5rem;">Validating file...</div>
        </div>
        <button id="removePdfBtn" style="padding:0.6rem 1.2rem;background:#dc3545;color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600;transition:all 0.3s ease;box-shadow:0 2px 4px rgba(0,0,0,0.1);">Remove PDF</button>
      </div>
    `;

      // Update page count display and handle token count display
      const pageCountElem = document.getElementById("pdf-page-count");

      if (pageCountElem && pageCount !== 0) {
        pageCountElem.textContent = `Pages: ${pageCount}`;
      } else if (pageCountElem) {
        pageCountElem.textContent = `Pages: Unknown`;
      }

      const tokenCountElem = document.getElementById("pdf-token-count");
      if (tokenCountElem) {
        tokenCountElem.textContent = `File is valid!`;
        tokenCountElem.style.color = "green";
        tokenCountElem.style.fontWeight = "bold";
      }

      // Add remove button functionality
      const removeBtn = document.getElementById("removePdfBtn");
      if (removeBtn) {
        removeBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          // Clear the file input
          pdfInput.value = "";
          // Reset UI
          uploadBox.style.display = "flex";
          pdfInfoContainer.style.display = "none";
          pdfInfoContainer.innerHTML = "";
          summaryOutput.style.display = "none";
          summaryOutput.innerHTML = "";
        });

        // Add hover effect
        removeBtn.addEventListener("mouseenter", () => {
          removeBtn.style.background = "#c82333";
          removeBtn.style.transform = "scale(1.05)";
        });
        removeBtn.addEventListener("mouseleave", () => {
          removeBtn.style.background = "#dc3545";
          removeBtn.style.transform = "scale(1)";
        });
      }
    });
  }

  // Summarize button logic
  if (summarizeBtn) {
    summarizeBtn.addEventListener("click", async () => {
      const pdf = document.getElementById("pdfUpload").files[0];
      if (!pdf) {
        summaryOutput.style.display = "block";
        summaryOutput.innerHTML = "<p style='text-align:center;'>Please upload a PDF first.</p>";
        return;
      }

      // Show loading animation
      summaryOutput.style.display = "block";
      summaryOutput.innerHTML = `
      <div id='summary-loading' style='display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:220px;'>
        <lottie-player id='summary-lottie' src="../assets/loading_light.json" background="transparent" speed="1" style="width:120px;height:120px;margin-bottom:1rem;" loop autoplay></lottie-player>
        <span style='color:var(--clr_text_muted);font-size:1.1rem;'>Analyzing PDF and generating summary...</span>
      </div>
    `;

      // Update loading animation based on theme
      const theme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
      const lottie = summaryOutput.querySelector('#summary-lottie');
      if (lottie) {
        lottie.setAttribute('src', theme === 'dark' ? '../assets/loading_dark.json' : '../assets/loading_light.json');
      }

      try {
        // Get the page count (default to 1 if not available)
        const totalPages = currentPdfPageCount || 1;
        
        // Generate summary using Summary class
        const prompt = Summary.createPrompt(totalPages);
        const data = await Summary.summarizePDF(pdf, prompt, totalPages);

        if (!data) throw new Error('No valid response from API.');

        summaryOutput.innerHTML = renderSummary(data);
        
        // Attach download button event listener
        const downloadBtn = document.getElementById("downloadSummaryBtn");
        if (downloadBtn) {
          downloadBtn.addEventListener("click", () => {
            downloadSummaryAsTxt(data);
          });
          
          // Add hover effect
          downloadBtn.addEventListener("mouseenter", () => {
            downloadBtn.style.transform = "scale(1.05)";
            downloadBtn.style.boxShadow = "0 4px 12px rgba(0,0,0,0.25)";
          });
          downloadBtn.addEventListener("mouseleave", () => {
            downloadBtn.style.transform = "scale(1)";
            downloadBtn.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
          });
        }
      } catch (err) {
        summaryOutput.innerHTML = `<p style='color:var(--clr_error);text-align:center;'>Error: ${err.message || 'Failed to generate summary.'}</p>`;
      }
    });
  }

  // Helper to render summary JSON to HTML
  function renderSummary(data) {

    // Check for errors
    if (!data || typeof data !== 'object') return '<p>Invalid summary data.</p>';

    let html = `<div style="max-width:100%; width:98vw; margin:0 auto;">`;

    // Document Title
    html += `<h3 style="text-align:center;font-size:2rem;color:var(--clr_primary);margin-bottom:1.5rem;">
    ${data.document_title}
    </h3>`;

    // Executive Summary
    html += `<div style="margin-bottom:2rem;padding:1.5rem;background:var(--clr_card_bg);border-left:4px solid var(--clr_primary);border-radius:8px;">`;
    html += `<div style="font-size:1.3rem;font-weight:650;color:var(--clr_primary);margin-bottom:0.8rem;">Executive Summary</div>`;
    html += `<p style="font-size:1.05rem;color:var(--clr_text);line-height:1.6;">${data.executive_summary}</p>`;
    html += `</div>`;

    // Key Findings
    if (Array.isArray(data.key_findings) && data.key_findings.length > 0) {
      html += `<div style="margin-bottom:2rem;padding:1.5rem;background:var(--clr_card_bg);border-left:4px solid var(--clr_accent);border-radius:8px;">`;
      html += `<div style="font-size:1.3rem;font-weight:650;color:var(--clr_accent);margin-bottom:0.8rem;">Key Findings</div>`;
      html += `<ul style="margin-left:1.2rem;list-style:none;padding:0;">`;
      data.key_findings.forEach((finding, index) => {
        html += `<li style="margin-bottom:0.6rem;padding-left:1.5rem;position:relative;">
        <span style="position:absolute;left:0;color:var(--clr_accent);font-weight:bold;">${index + 1}.</span>
        <span style="color:var(--clr_text);font-size:1.05rem;">${finding}</span>
      </li>`;
      });
      html += `</ul></div>`;
    }

    // Section Summaries (can be page-by-page or grouped)
    if (Array.isArray(data.section_summaries) && data.section_summaries.length > 0) {
      html += `<div style="margin-bottom:1.5rem;">`;
      
      // Determine if this is page-by-page or grouped based on the first entry
      const isPageByPage = data.section_summaries.length > 0 && 
                           !data.section_summaries[0].page_range.includes('-');
      
      const headerText = isPageByPage ? "Page-by-Page Summary" : "Content Summary by Section";
      html += `<h4 style="font-size:1.5rem;font-weight:650;color:var(--clr_primary);margin-bottom:1rem;">${headerText}</h4>`;

      data.section_summaries.forEach(section => {
        // Render all sections
        if (Array.isArray(section.summary_points)) {
          html += `<div class="page-summary-card">`;
          
          // Display "Page X" for single pages or "Pages X-Y" for ranges
          const label = section.page_range.includes('-') ? `Pages ${section.page_range}` : `Page ${section.page_range}`;
          html += `<div style="font-size:1.1rem;font-weight:600;color:var(--clr_primary);margin-bottom:0.6rem;">${label}</div>`;
          
          html += `<ul style="margin-left:1.2rem;list-style:disc;">`;
          section.summary_points.forEach(point => {
            html += `<li style="margin-bottom:0.4rem;color:var(--clr_text);">${point}</li>`;
          });
          html += `</ul></div>`;
        }
      });
      html += `</div>`;
    }

    // Add download button
    html += `<div style="text-align:center;margin-top:2rem;margin-bottom:1rem;">`;
    html += `<button id="downloadSummaryBtn" style="padding:0.8rem 2rem;background:var(--clr_contrasting_accent);color:var(--clr_body_bg);border:none;border-radius:8px;cursor:pointer;font-weight:600;font-size:1rem;font-family:inherit;transition:all 0.3s ease;box-shadow:0 2px 8px rgba(0,0,0,0.15);">
       Download Summary
    </button>`;
    html += `</div>`;

    html += `</div>`;
    return html;
  }

  // Add button to download summary as TXT
  function downloadSummaryAsTxt(data) {
    if (!data || typeof data !== 'object') return;
    
    let txtContent = '';
    
    // Document Title
    txtContent += `${data.document_title}\n`;
    txtContent += '='.repeat(data.document_title.length) + '\n\n';
    
    // Executive Summary
    txtContent += 'EXECUTIVE SUMMARY\n';
    txtContent += '-'.repeat(50) + '\n';
    txtContent += `${data.executive_summary}\n\n`;
    
    // Key Findings
    if (Array.isArray(data.key_findings) && data.key_findings.length > 0) {
      txtContent += 'KEY FINDINGS\n';
      txtContent += '-'.repeat(50) + '\n';
      data.key_findings.forEach((finding, index) => {
        txtContent += `${index + 1}. ${finding}\n`;
      });
      txtContent += '\n';
    }
    
    // Section Summaries
    if (Array.isArray(data.section_summaries) && data.section_summaries.length > 0) {
      // Determine if this is page-by-page or grouped
      const isPageByPage = data.section_summaries.length > 0 && 
                           !data.section_summaries[0].page_range.includes('-');
      
      const headerText = isPageByPage ? 'PAGE-BY-PAGE SUMMARY' : 'CONTENT SUMMARY BY SECTION';
      txtContent += headerText + '\n';
      txtContent += '-'.repeat(50) + '\n\n';
      
      data.section_summaries.forEach(section => {
        if (Array.isArray(section.summary_points)) {
          // Use "PAGE X" for single pages or "PAGES X-Y" for ranges
          const label = section.page_range.includes('-') ? `PAGES ${section.page_range}` : `PAGE ${section.page_range}`;
          txtContent += `${label}\n`;
          section.summary_points.forEach(point => {
            txtContent += `  • ${point}\n`;
          });
          txtContent += '\n';
        }
      });
    }
    
    // Create and trigger download
    const blob = new Blob([txtContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `summary.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

const userNameElement= 0;
const logoutBtn = 0;

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