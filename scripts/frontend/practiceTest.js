/*
  practiceTest.js
  
  Handles practice test page logic (placeholder for now).
*/

export function initPracticeTest(isLoggedIn) {
  const practiceTestContainer = document.querySelector(".practice-test-container");
  const testLocked = document.getElementById("test-locked");
  const testForm = document.getElementById("test-form");

  if (practiceTestContainer) {
    if (isLoggedIn) {
      testForm.style.display = "block";
      testLocked.style.display = "none";
    } else {
      testLocked.style.display = "block";
      testForm.style.display = "none";
    }
  }
}
