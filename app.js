document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("search");
  const content = document.getElementById("content");
  const toggleThemeBtn = document.getElementById("toggleTheme");
  const modal = document.getElementById("modal");
  const modalContent = document.querySelector(".modal-content");

  let mediaData = { trending: [], recommended: [] };

  // ===== Theme Management =====
  function loadTheme() {
    const saved = localStorage.getItem("theme");
    if (saved) document.documentElement.setAttribute("data-theme", saved);
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme") || "dark";
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  }

  toggleThemeBtn.addEventListener("click", toggleTheme);
  loadTheme();

  // ===== Fetch JSON Data =====
  fetch("data.json")
    .then(res => res.json())
    .then(json => {
      const savedBookmarks = JSON.parse(localStorage.getItem("bookmarks") || "{}");
      mediaData = applyBookmarks(json, savedBookmarks);
      renderContent(mediaData);
    })
    .catch(error => {
      content.innerHTML = `<p>Error loading content. Please try again later.</p>`;
      console.error("Error fetching data.json:", error);
    });

  // ===== Bookmark Logic =====
  function applyBookmarks(data, bookmarks) {
    ["trending", "recommended"].forEach(section => {
      data[section] = data[section].map(item => ({
        ...item,
        isBookmarked: bookmarks[item.id] || false,
      }));
    });
    return data;
  }

  function toggleBookmark(id) {
    const all = [...mediaData.trending, ...mediaData.recommended];
    const target = all.find(item => item.id === id);
    target.isBookmarked = !target.isBookmarked;

    const updatedBookmarks = JSON.parse(localStorage.getItem("bookmarks") || "{}");
    updatedBookmarks[id] = target.isBookmarked;
    localStorage.setItem("bookmarks", JSON.stringify(updatedBookmarks));
    renderContent(mediaData);
  }

  // ===== Search Logic =====
  searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim().toLowerCase();
    const filtered = {
      trending: mediaData.trending.filter(item => filterMatch(item, query)),
      recommended: mediaData.recommended.filter(item => filterMatch(item, query))
    };
    renderContent(filtered);
  });

  function filterMatch(item, q) {
    return (
      item.title.toLowerCase().includes(q) ||
      item.genre.join(" ").toLowerCase().includes(q) ||
      item.director.toLowerCase().includes(q) ||
      item.cast.join(" ").toLowerCase().includes(q)
    );
  }

  // ===== Render UI =====
  function renderContent(data) {
    content.innerHTML = `
      <h2 class="section-title">Trending</h2>
      <div class="card-grid">
        ${data.trending.map(createCard).join("")}
      </div>
      <h2 class="section-title">Recommended</h2>
      <div class="card-grid">
        ${data.recommended.map(createCard).join("")}
      </div>
    `;
    attachEventListeners();
  }

  function createCard(item) {
    return `
      <div class="card" data-id="${item.id}">
        <img src="${item.image}" alt="${item.title}" />
        <div class="bookmark" title="Toggle Bookmark" data-id="${item.id}">
          ${item.isBookmarked ? "✅" : "🔖"}
        </div>
        <div class="card-info">
          <small>${item.year} • ${item.type} • ${item.rating}</small>
          <p>${item.title}</p>
        </div>
      </div>
    `;
  }

  // ===== Event Handlers =====
  function attachEventListeners() {
    document.querySelectorAll(".card").forEach(card => {
      card.addEventListener("click", e => {
        const id = card.dataset.id;
        if (e.target.classList.contains("bookmark")) return;
        const item = findItemById(id);
        showModal(item);
      });
    });

    document.querySelectorAll(".bookmark").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        toggleBookmark(btn.dataset.id);
      });
    });
  }

  function findItemById(id) {
    return (
      mediaData.trending.find(item => item.id === id) ||
      mediaData.recommended.find(item => item.id === id)
    );
  }

  // ===== Modal Handling =====
  function showModal(item) {
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");

    modalContent.innerHTML = `
      <h2>${item.title}</h2>
      <img src="${item.poster}" alt="${item.title} Poster" />
      <p><strong>Year:</strong> ${item.year}</p>
      <p><strong>Type:</strong> ${item.type}</p>
      <p><strong>Rating:</strong> ${item.rating}</p>
      <p><strong>Duration:</strong> ${item.duration || (item.episodes + " episodes")}</p>
      <p><strong>Genre:</strong> ${item.genre.join(", ")}</p>
      <p><strong>Director:</strong> ${item.director}</p>
      <p><strong>Cast:</strong> ${item.cast.join(", ")}</p>
      <p><strong>Language:</strong> ${item.language}</p>
      <p style="margin-top: 1rem;"><strong>Description:</strong><br>${item.description}</p>
      ${item.trailer ? `<a href="${item.trailer}" target="_blank" class="trailer-btn">🎬 Watch Trailer</a>` : ""}
      <button onclick="closeModal()" class="close-modal-btn">Close</button>
    `;
  }

  window.closeModal = () => {
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
  };

  window.addEventListener("keydown", e => {
    if (e.key === "Escape") closeModal();
  });
});
