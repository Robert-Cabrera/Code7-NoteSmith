/*
  practiceTest.js
  
  Handles practice test page logic (placeholder for now).
*/

export function initPracticeTest(isLoggedIn) {
  const practiceTestContainer = document.querySelector(".practice-test-container");
  
  // If not on practice test page, exit early
  if (!practiceTestContainer) {
    return;
  }

  const testLocked = document.getElementById("test-locked");
  const testForm = document.getElementById("test-form");

  if (isLoggedIn) {
    if (testForm) testForm.style.display = "block";
    if (testLocked) testLocked.style.display = "none";
  } else {
    if (testLocked) testLocked.style.display = "block";
    if (testForm) testForm.style.display = "none";
  }
}
