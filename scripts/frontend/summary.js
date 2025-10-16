/*
  summary.js
  
  Handles PDF summary generation logic, file validation, and UI rendering.
  Uses the Summary class for structured output from Gemini API.
*/

import { getUserData } from './auth.js';

const FILE_SIZE_LIMIT_MB = 30;
const TOKEN_LIMIT = 220000;

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
    if (totalPages <= 20) {
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
      let groupSize;
      if (totalPages <= 40) groupSize = 5;
      else if (totalPages <= 75) groupSize = 10;
      else if (totalPages <= 150) groupSize = 20;
      else if (totalPages <= 300) groupSize = 25;
      else groupSize = 50;

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
    // Get user data to include userId
    const userData = getUserData();
    
    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('prompt', prompt);
    if (userData?.id) {
      formData.append('userId', userData.id);
    }

    const response = await fetch('/api/summarize-pdf', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to summarize PDF');
    }

    const data = await response.json();

    if (checkForResponse(data)) {
      const jsonText = data.candidates[0].content.parts[0].text;
      
      let parsedData;
      try {
        parsedData = JSON.parse(jsonText);
      } catch (parseError) {
        console.error('Failed to parse JSON response:', jsonText);
        throw new Error('Failed to parse API response as JSON');
      }

      console.log('Parsed summary data:', parsedData);

      if (!Summary.validateSchema(parsedData)) {
        console.error('Schema validation failed for:', parsedData);
        throw new Error('Response does not match expected schema');
      }

      return parsedData;
    }

    throw new Error('Invalid response format from API');
  }
  
  static validateSchema(obj) {
    if (
      typeof obj !== "object" ||
      typeof obj.document_title !== "string" ||
      typeof obj.executive_summary !== "string" ||
      !Array.isArray(obj.key_findings) ||
      obj.key_findings.length < 1 ||
      !Array.isArray(obj.section_summaries) ||
      obj.section_summaries.length < 1
    ) return false;

    for (const finding of obj.key_findings) {
      if (typeof finding !== "string") return false;
    }

    for (const section of obj.section_summaries) {
      if (
        typeof section !== "object" ||
        typeof section.page_range !== "string" ||
        !Array.isArray(section.summary_points) ||
        section.summary_points.length < 1
      ) return false;

      for (const point of section.summary_points) {
        if (typeof point !== "string") return false;
      }
    }
    return true;
  }
}

// Helper functions for rendering
function renderSummary(data) {
  if (!data || typeof data !== 'object') return '<p>Invalid summary data.</p>';

  let html = `<div style="max-width:100%; width:98vw; margin:0 auto;">`;

  html += `<h3 style="text-align:center;font-size:2rem;color:var(--clr_primary);margin-bottom:1.5rem;">
    ${data.document_title}
  </h3>`;

  html += `<div style="margin-bottom:2rem;padding:1.5rem;background:var(--clr_card_bg);border-left:4px solid var(--clr_primary);border-radius:8px;">`;
  html += `<div style="font-size:1.3rem;font-weight:650;color:var(--clr_primary);margin-bottom:0.8rem;">Executive Summary</div>`;
  html += `<p style="font-size:1.05rem;color:var(--clr_text);line-height:1.6;">${data.executive_summary}</p>`;
  html += `</div>`;

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

  if (Array.isArray(data.section_summaries) && data.section_summaries.length > 0) {
    html += `<div style="margin-bottom:1.5rem;">`;
    
    const isPageByPage = data.section_summaries.length > 0 && 
                         !data.section_summaries[0].page_range.includes('-');
    
    const headerText = isPageByPage ? "Page-by-Page Summary" : "Content Summary by Section";
    html += `<h4 style="font-size:1.5rem;font-weight:650;color:var(--clr_primary);margin-bottom:1rem;">${headerText}</h4>`;

    data.section_summaries.forEach(section => {
      if (Array.isArray(section.summary_points)) {
        html += `<div class="page-summary-card">`;
        
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

  html += `<div style="text-align:center;margin-top:2rem;margin-bottom:1rem;">`;
  html += `<button id="downloadSummaryBtn" style="padding:0.8rem 2rem;background:var(--clr_contrasting_accent);color:var(--clr_body_bg);border:none;border-radius:8px;cursor:pointer;font-weight:600;font-size:1rem;font-family:inherit;transition:all 0.3s ease;box-shadow:0 2px 8px rgba(0,0,0,0.15);">
     Download Summary
  </button>`;
  html += `</div>`;

  html += `</div>`;
  return html;
}

function downloadSummaryAsTxt(data) {
  if (!data || typeof data !== 'object') return;
  
  let txtContent = '';
  
  txtContent += `${data.document_title}\n`;
  txtContent += '='.repeat(data.document_title.length) + '\n\n';
  
  txtContent += 'EXECUTIVE SUMMARY\n';
  txtContent += '-'.repeat(50) + '\n';
  txtContent += `${data.executive_summary}\n\n`;
  
  if (Array.isArray(data.key_findings) && data.key_findings.length > 0) {
    txtContent += 'KEY FINDINGS\n';
    txtContent += '-'.repeat(50) + '\n';
    data.key_findings.forEach((finding, index) => {
      txtContent += `${index + 1}. ${finding}\n`;
    });
    txtContent += '\n';
  }
  
  if (Array.isArray(data.section_summaries) && data.section_summaries.length > 0) {
    const isPageByPage = data.section_summaries.length > 0 && 
                         !data.section_summaries[0].page_range.includes('-');
    
    const headerText = isPageByPage ? 'PAGE-BY-PAGE SUMMARY' : 'CONTENT SUMMARY BY SECTION';
    txtContent += headerText + '\n';
    txtContent += '-'.repeat(50) + '\n\n';
    
    data.section_summaries.forEach(section => {
      if (Array.isArray(section.summary_points)) {
        const label = section.page_range.includes('-') ? `PAGES ${section.page_range}` : `PAGE ${section.page_range}`;
        txtContent += `${label}\n`;
        section.summary_points.forEach(point => {
          txtContent += `  • ${point}\n`;
        });
        txtContent += '\n';
      }
    });
  }
  
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

export function initSummary(isLoggedIn) {
  const summaryContainer = document.querySelector(".summary-container");
  const summaryLocked = document.getElementById("summary-locked");
  const summaryUI = document.getElementById("summary-ui");
  const summarizeBtn = document.getElementById("summarizeBtn");
  const summaryOutput = document.getElementById("summary-output");

  if (summaryContainer) {
    if (isLoggedIn) {
      summaryUI.style.display = "block";
      summaryLocked.style.display = "none";
      const sizeLimitElem = document.getElementById("size-limit");
      if (sizeLimitElem) {
        sizeLimitElem.textContent = `Maximum file size: ${FILE_SIZE_LIMIT_MB}MB`;
      }
    } else {
      summaryLocked.style.display = "block";
      summaryUI.style.display = "none";
    }
  }

  const pdfInput = document.getElementById("pdfUpload");
  const uploadBox = document.querySelector(".upload-box");
  let currentPdfPageCount = 0;

  if (pdfInput && uploadBox) {
    const pdfInfoContainer = document.createElement("div");
    pdfInfoContainer.id = "pdf-info-container";
    pdfInfoContainer.style.display = "none";
    pdfInfoContainer.className = "upload-box";
    uploadBox.parentNode.insertBefore(pdfInfoContainer, uploadBox.nextSibling);

    pdfInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];

      if (!file) {
        currentPdfPageCount = 0;
        uploadBox.style.display = "flex";
        pdfInfoContainer.style.display = "none";
        pdfInfoContainer.innerHTML = "";
        summaryOutput.style.display = "none";
        summaryOutput.innerHTML = "";
        return;
      }

      const maxSizeBytes = FILE_SIZE_LIMIT_MB * 1024 * 1024;

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
            <button id="removePdfBtn" style="padding:0.6rem 1.2rem;background:#dc3545;color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600;">Choose Another File</button>
          </div>
        `;

        document.getElementById("removePdfBtn")?.addEventListener("click", () => {
          pdfInput.value = "";
          uploadBox.style.display = "flex";
          pdfInfoContainer.style.display = "none";
          pdfInfoContainer.innerHTML = "";
        });
        return;
      }

      let pageCount = 0;
      if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        pageCount = pdf.numPages;
        currentPdfPageCount = pageCount;
      }

      const data = await Summary.getPDFTokenCount(file);

      if (data.totalTokens > TOKEN_LIMIT) {
        uploadBox.style.display = "none";
        pdfInfoContainer.style.display = "flex";
        pdfInfoContainer.innerHTML = `
          <div style="display:flex;flex-direction:column;align-items:center;gap:1rem;justify-content:center;width:100%;padding:1.5rem;">
            <div style="font-size:3rem;color:#dc3545;">Error!</div>
            <div style="text-align:center;">
              <div style="font-weight:600;color:#dc3545;font-size:1.2rem;">File is too dense!</div>
              <div style="color:var(--clr_text_muted);margin-top:0.5rem;">
                Your PDF is too dense! Try separating it into parts.
              </div>
            </div>
            <button id="removePdfBtn" style="padding:0.6rem 1.2rem;background:#dc3545;color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600;">Choose Another File</button>
          </div>
        `;

        document.getElementById("removePdfBtn")?.addEventListener("click", () => {
          pdfInput.value = "";
          uploadBox.style.display = "flex";
          pdfInfoContainer.style.display = "none";
          pdfInfoContainer.innerHTML = "";
        });
        return;
      }

      uploadBox.style.display = "none";
      pdfInfoContainer.style.display = "flex";
      pdfInfoContainer.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;gap:1rem;justify-content:center;width:100%;padding:1.5rem;">
          <lottie-player src="../assets/pdf.json" background="transparent" speed="1" style="width:80px;height:80px;" loop autoplay></lottie-player>
          <div style="text-align:center;">
            <div style="font-weight:600;color:var(--clr_primary);">File: ${file.name}</div>
            <div id="pdf-page-count" style="color:var(--clr_text_muted);">Pages: ${pageCount}</div>
            <div id="pdf-token-count" style="color:green;font-weight:bold;margin-top:0.5rem;">File is valid!</div>
          </div>
          <button id="removePdfBtn" style="padding:0.6rem 1.2rem;background:#dc3545;color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600;">Remove PDF</button>
        </div>
      `;

      document.getElementById("removePdfBtn")?.addEventListener("click", () => {
        pdfInput.value = "";
        uploadBox.style.display = "flex";
        pdfInfoContainer.style.display = "none";
        pdfInfoContainer.innerHTML = "";
        summaryOutput.style.display = "none";
        summaryOutput.innerHTML = "";
      });
    });
  }

  if (summarizeBtn) {
    summarizeBtn.addEventListener("click", async () => {
      const pdf = document.getElementById("pdfUpload").files[0];
      if (!pdf) {
        summaryOutput.style.display = "block";
        summaryOutput.innerHTML = "<p style='text-align:center;'>Please upload a PDF first.</p>";
        return;
      }

      summaryOutput.style.display = "block";
      summaryOutput.innerHTML = `
        <div id='summary-loading' style='display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:220px;'>
          <lottie-player id='summary-lottie' src="../assets/loading_light.json" background="transparent" speed="1" style="width:120px;height:120px;margin-bottom:1rem;" loop autoplay></lottie-player>
          <span style='color:var(--clr_text_muted);font-size:1.1rem;'>Analyzing PDF and generating summary...</span>
        </div>
      `;

      const theme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
      const lottie = summaryOutput.querySelector('#summary-lottie');
      if (lottie) {
        lottie.setAttribute('src', theme === 'dark' ? '../assets/loading_dark.json' : '../assets/loading_light.json');
      }

      try {
        const totalPages = currentPdfPageCount || 1;
        const prompt = Summary.createPrompt(totalPages);
        const data = await Summary.summarizePDF(pdf, prompt, totalPages);

        if (!data) throw new Error('No valid response from API.');

        summaryOutput.innerHTML = renderSummary(data);
        
        const downloadBtn = document.getElementById("downloadSummaryBtn");
        if (downloadBtn) {
          downloadBtn.addEventListener("click", () => {
            downloadSummaryAsTxt(data);
          });
        }
      } catch (err) {
        summaryOutput.innerHTML = `<p style='color:var(--clr_error);text-align:center;'>Error: ${err.message || 'Failed to generate summary.'}</p>`;
      }
    });
  }
}
