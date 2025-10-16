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

      // console.log('Parsed crash course data:', parsedData); // Removed - clutters output

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
  if (!data || typeof data !== 'object') {
    console.error('Invalid crash course data:', data);
    return;
  }

  // Populate the HTML elements
  const topicTitle = document.getElementById('crash-topic-title');
  const summary = document.getElementById('crash-summary');
  const overview = document.getElementById('crash-overview');
  const mainTopics = document.getElementById('crash-main-topics');
  const conclusion = document.getElementById('crash-conclusion');

  // Check if all elements exist
  if (!topicTitle || !summary || !overview || !mainTopics || !conclusion) {
    console.error('One or more crash course output elements not found in DOM');
    return;
  }

  // Set topic with shine effect
  topicTitle.innerHTML = `<span class="crash-shine">${data.topic}</span>`;
  
  // Set summary
  summary.textContent = data.summary || '';
  
  // Set overview
  overview.innerHTML = `<strong>Overview:</strong> ${data.overview || ''}`;

  // Clear and populate main topics
  mainTopics.innerHTML = '';
  if (Array.isArray(data.main_topics)) {
    data.main_topics.forEach(topic => {
      const topicDiv = document.createElement('div');
      topicDiv.className = 'crash-topic';
      
      const titleDiv = document.createElement('div');
      titleDiv.className = 'crash-topic-title';
      titleDiv.textContent = topic.title;
      
      const descDiv = document.createElement('div');
      descDiv.className = 'crash-topic-desc';
      descDiv.textContent = topic.description;
      
      topicDiv.appendChild(titleDiv);
      topicDiv.appendChild(descDiv);

      if (Array.isArray(topic.subtopics)) {
        const subtopicsList = document.createElement('ul');
        subtopicsList.className = 'crash-subtopics';
        
        topic.subtopics.forEach(sub => {
          const li = document.createElement('li');
          li.className = 'crash-subtopic';
          li.innerHTML = `<span class="crash-subtopic-title">${sub.title}:</span> <span class="crash-subtopic-details">${sub.details}</span>`;
          subtopicsList.appendChild(li);
        });
        
        topicDiv.appendChild(subtopicsList);
      }
      
      mainTopics.appendChild(topicDiv);
    });
  }

  // Set conclusion
  conclusion.innerHTML = `<strong>Conclusion:</strong> ${data.conclusion || ''}`;
}

export function initCrashCourse(isLoggedIn) {
  const crashCourseContainer = document.querySelector(".crash-course-container");
  
  // If not on crash course page, exit early
  if (!crashCourseContainer) {
    return;
  }

  const lockedMessage = document.getElementById("locked-message");
  const crashForm = document.getElementById("crash-course-form");

  if (isLoggedIn) {
    if (crashForm) crashForm.style.display = "block";
    if (lockedMessage) lockedMessage.style.display = "none";
  } else {
    if (lockedMessage) lockedMessage.style.display = "block";
    if (crashForm) crashForm.style.display = "none";
  }

  const generateBtn = document.getElementById("generateBtn");
  if (generateBtn) {
    generateBtn.addEventListener("click", async () => {
      const topicInput = document.getElementById("topicInput");
      const output = document.getElementById("output");
      const loading = document.getElementById("crash-loading");

      // Check if required elements exist
      if (!topicInput || !output || !loading) {
        console.error('Required crash course elements not found in DOM');
        return;
      }

      const topic = topicInput.value.trim();

      if (!topic) {
        // Show error in the output container without destroying the structure
        const topicTitle = document.getElementById('crash-topic-title');
        if (topicTitle) {
          topicTitle.textContent = "Please enter a topic";
          topicTitle.classList.add('error-message');
          console.log('Added error-message class, classList:', topicTitle.classList);
          console.log('Computed style color:', window.getComputedStyle(topicTitle).color);
        }
        // Clear other fields
        document.getElementById('crash-summary').textContent = '';
        document.getElementById('crash-overview').textContent = '';
        document.getElementById('crash-main-topics').innerHTML = '';
        document.getElementById('crash-conclusion').textContent = '';
        output.style.display = "block";
        loading.style.display = "none";
        return;
      }

      // Remove error class if it was previously set
      const topicTitle = document.getElementById('crash-topic-title');
      if (topicTitle) {
        topicTitle.classList.remove('error-message');
      }

      // Hide output
      output.style.display = "none";

      // Set the correct loading animation based on theme BEFORE showing it
      const theme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
      const lottie = loading.querySelector('#crash-lottie');
      if (lottie) {
        const newSrc = theme === 'dark' ? '../assets/loading_dark.json' : '../assets/loading_light.json';
        lottie.setAttribute('src', newSrc);
        lottie.load(newSrc); // Force reload the animation
      }
      
      // Now show loading
      loading.style.display = "flex";

      try {
        const prompt = CrashCourse.createPrompt(topic);
        const data = await CrashCourse.getValidJsonResponse(prompt);
        if (!data) throw new Error('No valid response from Gemini.');

        // Hide loading, show output
        loading.style.display = "none";
        output.style.display = "block";
        
        // Populate the HTML structure
        renderCrashCourse(data);
      } catch (err) {
        loading.style.display = "none";
        output.style.display = "block";
        // Display error without destroying structure
        const topicTitle = document.getElementById('crash-topic-title');
        if (topicTitle) {
          topicTitle.textContent = `Error: ${err.message || 'Failed to generate crash course.'}`;
          topicTitle.classList.add('error-message');
        }
        // Clear other fields
        document.getElementById('crash-summary').textContent = '';
        document.getElementById('crash-overview').textContent = '';
        document.getElementById('crash-main-topics').innerHTML = '';
        document.getElementById('crash-conclusion').textContent = '';
      }
    });
  }
}
