// 1. Where we store the data after fetching it from JSON
let projectsData = [];
let currentFilteredProjects = [];

// 2. Categories 
const allCategories = [
  "DESIGN",
  "IDENTITY",
  "MOTION",
  "WEB",
  "WRITING",
  "SOUND",
];
let activeFilters = []; // Keeps track of what is currently clicked
let showArchive = false; // Whether the ARCHIVE filter is active

// 3. Grab HTML elements to put stuff into
const filterContainer = document.getElementById("filter-container");
const projectListContainer = document.getElementById("project-list");
const projectImagesContainer = document.getElementById("project-images");
const projectInfoContainer = document.getElementById("project-info");

// ==========================================
// CORE FUNCTIONS
// ==========================================

// A. Start the Website
async function init() {
  // Go get the JSON file
  const response = await fetch("projects.json");
  projectsData = await response.json();

  // Build the filter buttons on the screen
  renderFilters();

  // Run the filter check (shows all projects by default)
  applyFilters();
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

// D. Decide Which Projects to Show
function applyFilters() {
  // D1. First, separate projects by archive status
  let pool;
  if (showArchive) {
    pool = projectsData.filter((project) => project.archived === true);
  } else {
    pool = projectsData.filter((project) => !project.archived);
  }

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

// Boot up the site when the file loads
init();
