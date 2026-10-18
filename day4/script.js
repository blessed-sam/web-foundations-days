const noteText = document.querySelector("#note-text");
const charCount = document.querySelector("#char-count");
const wordCount = document.querySelector("#word-count");
const clearBtn = document.querySelector("#clear-btn");
const themeToggle = document.querySelector("#theme-toggle");

function updateCounts() {
  const text = noteText.value;

  const characters = text.length;

  const trimmedText = text.trim();

  const words = trimmedText === "" ? 0 : trimmedText.split(/\s+/).length;

  charCount.textContent = `${characters} / 200 characters`;

  wordCount.textContent = `${words} words`;

  charCount.classList.remove("warning", "over");

  if (characters > 200) {
    charCount.classList.add("over");
  } else if (characters > 180) {
    charCount.classList.add("warning");
  }
}

noteText.addEventListener("input", function () {
  updateCounts();

  localStorage.setItem("draft", noteText.value);
});

const savedDraft = localStorage.getItem("draft");

if (savedDraft !== null) {
  noteText.value = savedDraft;
}

const savedTheme = localStorage.getItem("theme");

if (savedTheme === "dark") {
  document.body.classList.add("dark");
  themeToggle.textContent = "Light mode";
} else {
  document.body.classList.remove("dark");
  themeToggle.textContent = "Dark mode";
}

updateCounts();

function clearNote() {
  noteText.value = "";

  localStorage.removeItem("draft");

  updateCounts();
}

clearBtn.addEventListener("click", clearNote);

noteText.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    clearNote();
  }
});

themeToggle.addEventListener("click", function () {
  document.body.classList.toggle("dark");

  const isDark = document.body.classList.contains("dark");

  if (isDark) {
    themeToggle.textContent = "Light mode";
    localStorage.setItem("theme", "dark");
  } else {
    themeToggle.textContent = "Dark mode";
    localStorage.setItem("theme", "light");
  }
});
