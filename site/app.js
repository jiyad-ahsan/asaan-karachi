// Shared helpers for the directory site

// --- Theme (dark mode) ---
// (initial theme is set by an inline script in <head> to avoid a flash of the wrong theme)
function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
  updateThemeButton();
}

function updateThemeButton() {
  const btn = document.get