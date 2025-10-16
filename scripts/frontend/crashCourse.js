/*
  crashCourse.js
  
  Handles crash course generation logic, API communication, and UI rendering.
  Uses the CrashCourse class for structured output from Gemini API.
*/

import { getUserData } from './auth.js';

// General helper to check for valid response
const checkForResponse = (data) => {
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
};

class CrashCourse {
  static validateSchema(obj) {
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
    // Get user data to include userId
    const userData = getUserData();
    
    let response, data;

    try {
      response = await fetch('/api/crash-course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt,
          userId: userData?.id
        })
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

    if (checkForResponse(data)) {
      const jsonText = data.candidates[0].content.parts[0].text;
      
      let parsedData;
      try {
        parsedData = JSON.parse(jsonText);
      } catch (parseError) {
        console.error('Failed to parse JSON response:', jsonText);
        throw new Error('Failed to parse API response as JSON');
      }

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

// Helper to render crash course JSON to HTML
function renderCrashCourse(data) {
  if (!data || typeof data !== 'object') return '<p>Invalid crash course data.</p>';

  let html = `<div style="max-width:100%; width:98vw; margin:0 auto;">`;
  
  // Ensure shine animation style exists
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

  if (Array.isArray(data.main_topics)) {
    data.main_topics.forEach(topic => {
      html += `<div style="margin-bottom:2rem;">`;
      html += `<div style="font-size:1.15rem;font-weight:600;color:var(--clr_primary);margin-bottom:0.3rem;">${topic.title}</div>`;
      html += `<div style="margin-bottom:0.5rem;color:var(--clr_text);">${topic.description}</div>`;

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

export function initCrashCourse(isLoggedIn) {
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
        const prompt = CrashCourse.createPrompt(topic);
        const data = await CrashCourse.getValidJsonResponse(prompt);
        if (!data) throw new Error('No valid response from Gemini.');

        output.innerHTML = renderCrashCourse(data);
      } catch (err) {
        output.innerHTML = `<p style='color:var(--clr_error);text-align:center;'>Error: ${err.message || 'Failed to generate crash course.'}</p>`;
      }
    });
  }
}
