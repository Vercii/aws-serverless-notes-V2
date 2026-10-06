const landingSection = document.getElementById("landingSection");
const dashboardSection = document.getElementById("dashboardSection");
const foldersSection = document.getElementById("foldersSection");
const notesSection = document.getElementById("notesSection");

const foldersList = document.getElementById("foldersList");
const notesList = document.getElementById("notesList");

const landingLoginBtn = document.getElementById("landingLoginBtn");
const logoutBtn = document.getElementById("logoutBtn");

const allNotesNav = document.getElementById("allNotesNav");
const foldersNav = document.getElementById("foldersNav");

const addBtn = document.getElementById("addBtn");
const emptyAddBtn = document.getElementById("emptyAddBtn");
const searchInput = document.getElementById("searchInput");
const viewToggleBtn = document.getElementById("viewToggleBtn");

const noteModal = document.getElementById("noteModal");
const modalTitle = document.getElementById("modalTitle");
const modalContent = document.getElementById("modalContent");
const modalHeader = document.getElementById("modalHeader");
const saveNoteBtn = document.getElementById("saveNoteBtn");
const closeModalBtn = document.getElementById("closeModalBtn");
const cancelModalBtn = document.getElementById("cancelModalBtn");
const contentField = document.getElementById("contentField");

const totalNotesStat = document.getElementById("totalNotesStat");
const totalFoldersStat = document.getElementById("totalFoldersStat");
const currentFolderStat = document.getElementById("currentFolderStat");
const currentFolderDetail = document.getElementById("currentFolderDetail");
const contentTitle = document.getElementById("contentTitle");
const contentCount = document.getElementById("contentCount");
const pageTitle = document.getElementById("pageTitle");
const pageSubtitle = document.getElementById("pageSubtitle");
const emptyState = document.getElementById("emptyState");
const emptyTitle = document.getElementById("emptyTitle");
const emptyText = document.getElementById("emptyText");

const API_URL = "https://fjwdttb11f.execute-api.us-east-1.amazonaws.com";

let activeNoteID = null;
let currentFolderID = null;
let currentFolderName = null;
let modalMode = "create-note";
let allNotesCache = [];
let currentView = "folders";
let compactView = false;

function getToken() {
  return sessionStorage.getItem("id_token");
}

function escapeHTML(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showLanding() {
  dashboardSection.style.display = "none";
  landingSection.style.display = "flex";
}

function showDashboard() {
  landingSection.style.display = "none";
  dashboardSection.style.display = "block";
}

function updateUI() {
  const token = getToken();

  if (token) {
    showDashboard();
    renderDashboard();
  } else {
    showLanding();
  }
}

function handleLogin() {
  const clientId = "2ue45ahob50gej2u7vh4hdab7o";
  const redirectUri =
    "https://main.d3i1c30pbgufzf.amplifyapp.com/files/callback.html";
  const domain =
    "https://us-east-1rq8auujwo.auth.us-east-1.amazoncognito.com";

  window.location.href =
    `${domain}/login?response_type=code&client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=openid+email+profile`;
}

landingLoginBtn.onclick = handleLogin;

logoutBtn.onclick = () => {
  sessionStorage.removeItem("id_token");
  currentFolderID = null;
  currentFolderName = null;
  allNotesCache = [];
  currentView = "folders";
  searchInput.value = "";
  updateUI();
};

async function fetchFolders() {
  const res = await fetch(`${API_URL}/folders`, {
    headers: {
      Authorization: `Bearer ${getToken()}`
    }
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch folders (${res.status})`);
  }

  return res.json();
}

async function fetchNotes(folderID) {
  if (!folderID) {
    return [];
  }

  const res = await fetch(
    `${API_URL}/notes?folderID=${encodeURIComponent(folderID)}`,
    {
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch notes (${res.status})`);
  }

  return res.json();
}

async function fetchAllNotes(folders) {
  const results = await Promise.all(
    folders.map(async folder => {
      const notes = await fetchNotes(folder.folderID);

      return notes.map(note => ({
        ...note,
        folderID: folder.folderID,
        folderName: folder.name
      }));
    })
  );

  return results.flat();
}

async function renderDashboard() {
  try {
    const folders = await fetchFolders();

    totalFoldersStat.textContent = folders.length;

    if (currentView === "notes") {
      if (currentFolderID) {
        const notes = await fetchNotes(currentFolderID);

        allNotesCache = notes.map(note => ({
          ...note,
          folderID: currentFolderID,
          folderName: currentFolderName || "Folder"
        }));

        totalNotesStat.textContent = allNotesCache.length;
        renderNotes(allNotesCache);
      } else {
        allNotesCache = await fetchAllNotes(folders);
        totalNotesStat.textContent = allNotesCache.length;
        renderNotes(allNotesCache);
      }

      return;
    }

    allNotesCache = await fetchAllNotes(folders);
    totalNotesStat.textContent = allNotesCache.length;

    await renderFolders(folders);
  } catch (error) {
    console.error(error);
    showErrorState("Unable to load your workspace. Please try again.");
  }
}

async function renderFolders(folders) {
  currentView = "folders";

  foldersSection.style.display = "block";
  notesSection.style.display = "none";

  allNotesNav.classList.remove("active");
  foldersNav.classList.add("active");

  contentTitle.textContent = "Your folders";
  contentCount.textContent =
    `${folders.length} ${folders.length === 1 ? "folder" : "folders"}`;

  currentFolderStat.textContent = "All notes";
  currentFolderDetail.textContent = "Everything at a glance";

  foldersList.innerHTML = "";

  if (!folders.length) {
    foldersList.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-icon">▱</div>
        <h3>No folders yet</h3>
        <p>Create a folder to start organizing your notes.</p>
        <button class="primary-btn" id="createFolderEmptyBtn">Create a folder</button>
      </div>
    `;

    document.getElementById("createFolderEmptyBtn").onclick =
      openCreateFolder;

    return;
  }

  let folderCounts = [];

  try {
    folderCounts = await Promise.all(
      folders.map(async folder => {
        try {
          const notes = await fetchNotes(folder.folderID);
          return {
            folderID: folder.folderID,
            count: notes.length
          };
        } catch {
          return {
            folderID: folder.folderID,
            count: null
          };
        }
      })
    );
  } catch {
    folderCounts = [];
  }

  folders.forEach(folder => {
    const countData = folderCounts.find(
      item => item.folderID === folder.folderID
    );

    const noteCount = countData?.count;
    const noteLabel =
      noteCount === null || noteCount === undefined
        ? "Notes"
        : `${noteCount} ${noteCount === 1 ? "note" : "notes"}`;

    const card = document.createElement("article");
    card.className = "folder-card";

    card.innerHTML = `
      <div class="folder-top">
        <div class="folder-icon">▱</div>
        <button class="folder-menu" title="Open folder options" aria-label="Folder options">•••</button>
      </div>

      <h3>${escapeHTML(folder.name)}</h3>
      <div class="folder-meta">${noteLabel}</div>

      <button
        class="folder-open"
        aria-label="Open ${escapeHTML(folder.name)}"
      ></button>

      <button class="folder-delete">Delete</button>
    `;

    card.querySelector(".folder-open").onclick = () =>
      openFolder(folder.folderID, folder.name);

    card.querySelector(".folder-delete").onclick = async event => {
      event.stopPropagation();
      await deleteFolder(folder.folderID);
    };

    foldersList.appendChild(card);
  });
}

function renderNotes(notes) {
  currentView = "notes";

  foldersSection.style.display = "none";
  notesSection.style.display = "block";

  allNotesNav.classList.add("active");
  foldersNav.classList.remove("active");

  contentTitle.textContent = currentFolderID
    ? currentFolderName || "Folder"
    : "All notes";

  currentFolderStat.textContent = currentFolderID
    ? currentFolderName || "Folder"
    : "All notes";

  currentFolderDetail.textContent = currentFolderID
    ? "Notes in this folder"
    : "Everything at a glance";

  contentCount.textContent =
    `${notes.length} ${notes.length === 1 ? "note" : "notes"}`;

  notesList.className = compactView
    ? "notes-grid compact"
    : "notes-grid";

  notesList.innerHTML = "";

  if (!notes.length) {
    emptyState.style.display = "block";
    emptyTitle.textContent = currentFolderID
      ? "This folder is empty"
      : "No notes found";
    emptyText.textContent = currentFolderID
      ? "Create a note and it will appear here."
      : "There are no notes in your workspace yet.";
    return;
  }

  emptyState.style.display = "none";

  notes.forEach(note => {
    const card = document.createElement("article");
    card.className = "note-card";

    card.innerHTML = `
      <div class="note-card-top">
        <span class="eyebrow">NOTE</span>
        <span class="note-date">${escapeHTML(note.updatedAt || "Recently")}</span>
      </div>

      <h3>${escapeHTML(note.title)}</h3>

      <div class="note-preview">
        ${escapeHTML(note.content)}
      </div>

      <div class="note-footer">
        <span class="note-folder">
          ${escapeHTML(note.folderName || currentFolderName || "")}
        </span>

        <div class="note-actions">
          <button class="open-note">Open</button>
          <button class="delete-note">Delete</button>
        </div>
      </div>
    `;

    card.querySelector(".open-note").onclick = () =>
      openNoteModal(note);

    card.querySelector(".delete-note").onclick = () =>
      deleteNote(note.noteID, note.folderID);

    notesList.appendChild(card);
  });
}

async function openFolder(folderID, folderName) {
  currentFolderID = folderID;
  currentFolderName = folderName || "Folder";
  currentView = "notes";
  searchInput.value = "";

  pageTitle.textContent = currentFolderName;
  pageSubtitle.textContent = "Everything saved inside this folder.";

  try {
    const notes = await fetchNotes(folderID);

    allNotesCache = notes.map(note => ({
      ...note,
      folderID,
      folderName: currentFolderName
    }));

    renderNotes(allNotesCache);
  } catch (error) {
    console.error(error);
    showErrorState("Unable to load this folder.");
  }
}

allNotesNav.onclick = async () => {
  currentFolderID = null;
  currentFolderName = null;
  currentView = "notes";
  searchInput.value = "";

  pageTitle.textContent = "Good evening, Renzo.";
  pageSubtitle.textContent =
    "Capture ideas, organize thoughts, and keep everything in one place.";

  try {
    const folders = await fetchFolders();
    allNotesCache = await fetchAllNotes(folders);
    totalNotesStat.textContent = allNotesCache.length;
    renderNotes(allNotesCache);
  } catch (error) {
    console.error(error);
    showErrorState("Unable to load your notes.");
  }
};

foldersNav.onclick = async () => {
  currentFolderID = null;
  currentFolderName = null;
  currentView = "folders";
  searchInput.value = "";

  pageTitle.textContent = "Good evening, Renzo.";
  pageSubtitle.textContent =
    "Capture ideas, organize thoughts, and keep everything in one place.";

  try {
    const folders = await fetchFolders();
    allNotesCache = await fetchAllNotes(folders);
    totalNotesStat.textContent = allNotesCache.length;
    await renderFolders(folders);
  } catch (error) {
    console.error(error);
    showErrorState("Unable to load your folders.");
  }
};

function openCreateFolder() {
  modalMode = "create-folder";
  modalHeader.textContent = "Create Folder";
  modalTitle.placeholder = "e.g. Work, Personal, Projects...";
  modalTitle.value = "";
  modalContent.value = "";
  contentField.style.display = "none";
  openModal();
}

function openCreateNote() {
  if (!currentFolderID) {
    alert("Please open a folder before creating a note.");
    return;
  }

  modalMode = "create-note";
  modalHeader.textContent = "Create Note";
  modalTitle.placeholder = "Give your note a title...";
  modalTitle.value = "";
  modalContent.value = "";
  contentField.style.display = "block";
  openModal();
}

addBtn.onclick = () => {
  if (currentFolderID) {
    openCreateNote();
  } else {
    openCreateFolder();
  }
};

emptyAddBtn.onclick = openCreateNote;

function openNoteModal(note) {
  modalMode = "edit";
  activeNoteID = note.noteID;

  modalHeader.textContent = "Edit Note";
  modalTitle.placeholder = "Give your note a title...";
  modalTitle.value = note.title || "";
  modalContent.value = note.content || "";

  contentField.style.display = "block";
  openModal();
}

function openModal() {
  noteModal.style.display = "flex";
  noteModal.setAttribute("aria-hidden", "false");

  setTimeout(() => {
    modalTitle.focus();
  }, 50);
}

function closeModal() {
  noteModal.style.display = "none";
  noteModal.setAttribute("aria-hidden", "true");
}

closeModalBtn.onclick = closeModal;
cancelModalBtn.onclick = closeModal;

noteModal.querySelector(".modal-backdrop").onclick = closeModal;

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeModal();
  }
});

async function saveData() {
  const title = modalTitle.value.trim();
  const content = modalContent.value.trim();

  if (!title) {
    modalTitle.focus();
    return;
  }

  const token = getToken();

  try {
    saveNoteBtn.disabled = true;

    if (modalMode === "create-folder") {
      const res = await fetch(`${API_URL}/folders`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: title
        })
      });

      if (!res.ok) {
        throw new Error(`Failed to create folder (${res.status})`);
      }

      closeModal();
      currentFolderID = null;
      currentFolderName = null;
      currentView = "folders";
      await renderDashboard();
      return;
    }

    if (modalMode === "create-note") {
      if (!currentFolderID) {
        alert("Please open a folder before creating a note.");
        return;
      }

      const res = await fetch(`${API_URL}/notes`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title,
          content,
          folderID: currentFolderID
        })
      });

      if (!res.ok) {
        throw new Error(`Failed to create note (${res.status})`);
      }

      closeModal();
      await renderDashboard();
      return;
    }

    if (modalMode === "edit") {
      const res = await fetch(`${API_URL}/notes/${activeNoteID}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title,
          content
        })
      });

      if (!res.ok) {
        throw new Error(`Failed to update note (${res.status})`);
      }

      closeModal();
      await renderDashboard();
    }
  } catch (error) {
    console.error(error);
    alert("Something went wrong. Please try again.");
  } finally {
    saveNoteBtn.disabled = false;
  }
}

saveNoteBtn.onclick = saveData;

async function deleteFolder(folderID) {
  if (!confirm("Delete this folder and its notes?")) {
    return;
  }

  try {
    const res = await fetch(`${API_URL}/folders/${folderID}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to delete folder (${res.status})`);
    }

    currentFolderID = null;
    currentFolderName = null;
    currentView = "folders";

    await renderDashboard();
  } catch (error) {
    console.error(error);
    alert("Unable to delete the folder.");
  }
}

async function deleteNote(noteID, folderID) {
  if (!confirm("Delete this note?")) {
    return;
  }

  try {
    const res = await fetch(`${API_URL}/notes/${noteID}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to delete note (${res.status})`);
    }

    if (folderID) {
      currentFolderID = folderID;

      const folder = await findFolder(folderID);
      currentFolderName = folder?.name || currentFolderName;
      currentView = "notes";
    }

    await renderDashboard();
  } catch (error) {
    console.error(error);
    alert("Unable to delete the note.");
  }
}

async function findFolder(folderID) {
  try {
    const folders = await fetchFolders();
    return folders.find(folder => folder.folderID === folderID);
  } catch {
    return null;
  }
}

searchInput.oninput = () => {
  const value = searchInput.value.trim().toLowerCase();

  if (currentView === "folders") {
    document.querySelectorAll(".folder-card").forEach(card => {
      card.style.display =
        card.innerText.toLowerCase().includes(value)
          ? ""
          : "none";
    });

    return;
  }

  const filtered = allNotesCache.filter(note =>
    `${note.title || ""} ${note.content || ""} ${note.folderName || ""}`
      .toLowerCase()
      .includes(value)
  );

  renderNotes(filtered);
};

viewToggleBtn.onclick = () => {
  compactView = !compactView;

  notesList.classList.toggle("compact", compactView);
  viewToggleBtn.textContent = compactView ? "▦" : "▤";
};

function showErrorState(message) {
  foldersSection.style.display = "none";
  notesSection.style.display = "block";

  notesList.innerHTML = `
    <div class="empty-state" style="grid-column:1/-1">
      <div class="empty-icon">!</div>
      <h3>Something went wrong</h3>
      <p>${escapeHTML(message)}</p>
      <button class="primary-btn" id="retryBtn">Try again</button>
    </div>
  `;

  document.getElementById("retryBtn").onclick = renderDashboard;
}

updateUI();
