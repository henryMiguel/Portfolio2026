// 1. Where we store the data after fetching it from JSON
let projectsData = [];
let currentFilteredProjects = [];

// 2. Categories (WRITING excluded — it has its own nav view)
const allCategories = [
  "DESIGN",
  "IDENTITY",
  "MOTION",
  "WEB",
  "SOUND",
];
let activeFilters = []; // Keeps track of what is currently clicked
let showArchive = false; // Whether the ARCHIVE filter is active
let currentView = "projects"; // 'projects' or 'writing'

// 3. Grab HTML elements to put stuff into
const filterContainer = document.getElementById("filter-container");
const projectListContainer = document.getElementById("project-list");
const projectImagesContainer = document.getElementById("project-images");
const projectInfoContainer = document.getElementById("project-info");
const portfolioContainer = document.getElementById("portfolio-container");
const writingContainer = document.getElementById("writing-container");
const aboutContainer = document.getElementById("about-container");

// ==========================================
// CORE FUNCTIONS
// ==========================================

// A. Start the Website
async function init() {
  // Go get the JSON file
  const response = await fetch("projects.json");
  projectsData = await response.json();

  // Set up nav view switching (PROJECTS / WRITING)
  setupNavLinks();

  // Build the filter buttons on the screen
  renderFilters();

  // Run the filter check (shows all projects by default)
  applyFilters();
}

// A2. Set up PROJECTS / WRITING nav switching
function setupNavLinks() {
  const navLinks = document.querySelectorAll(".main-nav a[data-view]");
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const view = link.dataset.view;
      if (view === currentView) return; // Already on this view

      currentView = view;

      // Update active state on nav links
      document.querySelectorAll(".main-nav a").forEach((a) => a.classList.remove("active"));
      link.classList.add("active");

      // Hide all views
      portfolioContainer.style.display = "none";
      filterContainer.style.display = "none";
      writingContainer.style.display = "none";
      aboutContainer.style.display = "none";

      if (currentView === "writing") {
        writingContainer.style.display = "";
        renderWritingList();
      } else if (currentView === "about") {
        aboutContainer.style.display = "";
      } else {
        // Projects view
        portfolioContainer.style.display = "";
        filterContainer.style.display = "";

        // Reset filters
        activeFilters = [];
        showArchive = false;
        document.querySelectorAll(".filter-btn").forEach((btn) => btn.classList.remove("active"));
        document.getElementById("filter-all-btn").classList.add("active");
        applyFilters();
      }

      window.scrollTo(0, 0);
    });
  });
}

// B. Create Filter Buttons
function renderFilters() {
  // B1. "ALL" button 
  const allBtn = document.createElement("button");
  allBtn.classList.add("filter-btn", "active"); // Add the active class by default
  allBtn.textContent = "ALL";
  allBtn.id = "filter-all-btn"; // Give it an ID so we can talk to it later

  // What happens when you click "ALL"
  allBtn.addEventListener("click", () => {
    // Empty out our active filters array and turn off archive
    activeFilters = [];
    showArchive = false;

    // Remove the active highlight from EVERY button
    document
      .querySelectorAll(".filter-btn")
      .forEach((btn) => btn.classList.remove("active"));
    // ...and put it back only on the "ALL" button
    allBtn.classList.add("active");

    // Redraw the projects
    applyFilters();
  });

  filterContainer.appendChild(allBtn);

  // B2. Create the ARCHIVE button (right after ALL)
  const archiveBtn = document.createElement("button");
  archiveBtn.classList.add("filter-btn", "filter-btn-archive");
  archiveBtn.textContent = "ARCHIVE";
  archiveBtn.id = "filter-archive-btn";

  archiveBtn.addEventListener("click", () => {
    const allBtn = document.getElementById("filter-all-btn");

    showArchive = !showArchive;
    archiveBtn.classList.toggle("active", showArchive);

    if (showArchive) {
      // Turn off ALL button when archive is active
      allBtn.classList.remove("active");
    } else if (activeFilters.length === 0) {
      // If no category filters active either, re-activate ALL
      allBtn.classList.add("active");
    }

    applyFilters();
  });

  filterContainer.appendChild(archiveBtn);

  // B3. Create the rest of the category buttons
  allCategories.forEach((cat) => {
    const btn = document.createElement("button");
    btn.classList.add("filter-btn");
    btn.textContent = cat;

    // When clicked, run the toggle logic
    btn.addEventListener("click", () => {
      toggleFilter(cat, btn);
    });

    filterContainer.appendChild(btn);
  });
}

// C. Turn Filters On and Off
function toggleFilter(category, btnElement) {
  const allBtn = document.getElementById("filter-all-btn");

  // 1. If the filter is already active, remove it. Otherwise, add it.
  if (activeFilters.includes(category)) {
    activeFilters = activeFilters.filter((f) => f !== category);
    btnElement.classList.remove("active");
  } else {
    activeFilters.push(category);
    btnElement.classList.add("active");
  }

  // 2. Smart logic for the "ALL" button state
  if (activeFilters.length === 0 && !showArchive) {
    // If they unclicked everything and archive is off, turn "ALL" back on
    allBtn.classList.add("active");
  } else {
    // If specific categories are clicked, make sure "ALL" is turned off
    allBtn.classList.remove("active");
  }

  // After changing the buttons, recalculate the list
  applyFilters();
}

// D. Decide Which Projects to Show (excludes WRITING-only projects)
function applyFilters() {
  // D1. First, separate projects by archive status and exclude writing-only projects
  let pool;
  if (showArchive) {
    pool = projectsData.filter((project) => project.archived === true);
  } else {
    pool = projectsData.filter((project) => !project.archived);
  }

  // Exclude projects that are ONLY in the WRITING category
  pool = pool.filter((project) => {
    const isWritingOnly = project.categories.length === 1 && project.categories[0] === "WRITING";
    return !isWritingOnly;
  });

  // D2. Then apply category filters on top
  if (activeFilters.length === 0) {
    // No filters active (the "ALL" state): Show everything in this pool, sorted by year
    currentFilteredProjects = [...pool].sort((a, b) => b.year - a.year);
  } else {
    // Filters active: Only keep projects that match at least one filter
    currentFilteredProjects = pool.filter((project) =>
      activeFilters.some((filter) => project.categories.includes(filter)),
    );
    currentFilteredProjects.sort((a, b) => b.year - a.year);
  }

  // Draw the new list on the left side
  renderProjectList();

  // Automatically load the first project in the new list
  if (currentFilteredProjects.length > 0) {
    loadProject(0);
  } else {
    projectImagesContainer.innerHTML = "";
    projectInfoContainer.innerHTML = "No projects found.";
  }
}

// E. Draw the Left Sidebar List
function renderProjectList() {
  projectListContainer.innerHTML = "";

  currentFilteredProjects.forEach((proj, index) => {
    const div = document.createElement("div");
    div.classList.add("project-item");
    div.textContent = proj.title;

    div.addEventListener("click", () => {
      loadProject(index);
    });

    projectListContainer.appendChild(div);
  });
}

// F. Put Project Content on the Screen
function loadProject(index) {
  const project = currentFilteredProjects[index];

  document.querySelectorAll(".project-item").forEach((item, i) => {
    item.classList.toggle("active", i === index);
  });

  // Check if the project wants a grid layout
  if (project.layout === "grid") {
    projectImagesContainer.classList.add("grid-layout");
  } else {
    projectImagesContainer.classList.remove("grid-layout");
  }

  projectImagesContainer.innerHTML = project.images
    .map((mediaSrc) => {
      // Vimeo embed
      if (mediaSrc.startsWith("vimeo:")) {
        const vimeoId = mediaSrc.replace("vimeo:", "");
        const separator = vimeoId.includes("?") ? "&" : "?";
        return `<div class="video-embed"><iframe src="https://player.vimeo.com/video/${vimeoId}${separator}title=0&byline=0&portrait=0&transparent=0&autoplay=1&muted=1" frameborder="0" allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen title="${project.title}"></iframe></div>`;
      }
      // YouTube embed
      if (mediaSrc.startsWith("youtube:")) {
        const youtubeId = mediaSrc.replace("youtube:", "");
        return `<div class="video-embed"><iframe src="https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen title="${project.title}"></iframe></div>`;
      }
      // Regular image
      return `<img src="${mediaSrc}" alt="${project.title}">`;
    })
    .join("");

  window.scrollTo(0, 0);

  // Check if the project has a link
  let linkHTML = "";
  if (project.link) {
    linkHTML = `<a href="${project.link}" target="_blank" class="project-link">Visit the site &#8599;</a>`;
  }

  // Check if the project has a team listed
  let teamHTML = "";
  if (project.team) {
    teamHTML = `
            <div class="project-team">
                <h4>TEAM</h4>
                <p>${project.team}</p>
            </div>
        `;
  }

  const categoriesHTML = project.categories
    .map((c) => `<span class="cat-tag">${c}</span>`)
    .join("");
  projectInfoContainer.innerHTML = `
        <div class="project-year">${project.displayYear || project.year}</div>
        <div class="project-title">${project.title}</div>
        <div class="project-categories">${categoriesHTML}</div>
        <div class="project-desc">${project.description}</div>
        ${linkHTML}
        ${teamHTML}
    `;
}

// G. Render the Writing List View
function renderWritingList() {
  const writingMain = document.getElementById("writing-main");

  // Get all writing projects (those with WRITING in their categories)
  const writingProjects = projectsData
    .filter((project) => project.categories.includes("WRITING"))
    .sort((a, b) => b.year - a.year);

  if (writingProjects.length === 0) {
    writingMain.innerHTML = `<p class="writing-empty">No writing projects yet.</p>`;
    return;
  }

  // Group by writingType, in this display order
  const sectionOrder = ["Article", "Conference Paper", "Blog Post"];
  const grouped = {};

  writingProjects.forEach((project) => {
    const type = project.writingType || "Other";
    if (!grouped[type]) grouped[type] = [];
    grouped[type].push(project);
  });

  // Build HTML section by section
  let html = "";
  sectionOrder.forEach((type) => {
    if (!grouped[type] || grouped[type].length === 0) return;

    const heading = type + "s";
    html += `<h3 class="writing-section-heading">${heading}</h3>`;

    html += grouped[type]
      .map((project) => {
        const linkHTML = project.link
          ? `<a href="${project.link}" target="_blank" class="writing-link">Read &#8599;</a>`
          : "";

        return `
          <article class="writing-entry">
            <div class="writing-entry-header">
              <h2 class="writing-entry-title">${project.title}</h2>
              <span class="writing-entry-year">${project.displayYear || project.year}</span>
            </div>
            <p class="writing-entry-desc">${project.description}</p>
            ${linkHTML}
          </article>
        `;
      })
      .join("");
  });

  writingMain.innerHTML = html;
}

// Boot up the site when the file loads
init();
