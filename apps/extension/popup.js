const appUrl = "http://localhost:3000";
const queryInput = document.querySelector("#query");
const results = document.querySelector("#results");

function escapeHtml(value) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ],
  );
}

function render(concepts, query) {
  if (!concepts.length) {
    results.innerHTML = '<p class="message">No concepts found.</p>';
    return;
  }
  results.innerHTML = concepts
    .map((concept) => {
      const entries = new Map();
      concept.entries.forEach((entry) =>
        entries.set(entry.language, [
          ...(entries.get(entry.language) || []),
          entry.text,
        ]),
      );
      const link = `${appUrl}/concepts?concept_id=${encodeURIComponent(concept.id)}&languages=en,de,fr,ja`;
      const languageEntries = [...entries]
        .map(
          ([language, words]) =>
            `<div class="entry"><span class="language">${escapeHtml(language)}</span><span class="words">${words.map(escapeHtml).join(", ")}</span></div>`,
        )
        .join("");
      return `<article class="concept"><div class="concept-heading"><span>Concept ${concept.id}</span></div>${languageEntries}<button class="open-button" type="button" data-url="${link}">Open in new tab</button></article>`;
    })
    .join("");
  results
    .querySelectorAll(".open-button")
    .forEach((button) =>
      button.addEventListener("click", () =>
        chrome.tabs.create({ url: button.dataset.url }),
      ),
    );
}

async function search() {
  const query = queryInput.value.trim();
  if (!query) {
    results.innerHTML = "";
    return;
  }
  results.innerHTML = '<p class="message">Searching...</p>';
  try {
    const languageResponse = await fetch(`${appUrl}/api/languages`);
    if (!languageResponse.ok) throw new Error("Languages unavailable");
    const languagePayload = await languageResponse.json();
    const languageCodes = (languagePayload.languages || [])
      .map((language) => language.iso_code)
      .join(",");
    const response = await fetch(
      `${appUrl}/api/dictionary/search?q=${encodeURIComponent(query)}&languages=${encodeURIComponent(languageCodes)}&limit=8`,
    );
    if (!response.ok) throw new Error("Search failed");
    const payload = await response.json();
    render(payload.concepts || [], query);
  } catch {
    results.innerHTML =
      '<p class="message">Start Paradict at localhost:3000 to search.</p>';
  }
}
chrome.tabs.query({ active: true, currentWindow: true }).then(async ([tab]) => {
  if (!tab?.id) return;
  try {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.getSelection()?.toString() || "",
    });
    if (result) queryInput.value = result.trim();
  } catch {
    // Some browser pages do not allow scripts from extensions.
  }
  if (queryInput.value) search();
});

document.querySelector("#search-form").addEventListener("submit", (event) => {
  event.preventDefault();
  search();
});
queryInput.addEventListener("input", search);
