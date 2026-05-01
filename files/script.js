const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const notesSection = document.getElementById("notesSection");
const landingSection = document.getElementById("landingSection");
const notesList = document.getElementById("notesList");
const landingLoginBtn = document.getElementById("landingLoginBtn");

const foldersSection = document.getElementById("foldersSection");
const foldersList = document.getElementById("foldersList");

const backBtn = document.getElementById("backBtn");

// TOP BAR
const topBar = document.getElementById("topBar");
const searchInput = document.getElementById("searchInput");
const addBtn = document.getElementById("addBtn");

// MODAL
const noteModal = document.getElementById("noteModal");
const modalTitle = document.getElementById("modalTitle");
const modalContent = document.getElementById("modalContent");
const saveNoteBtn = document.getElementById("saveNoteBtn");
const closeModalBtn = document.getElementById("closeModalBtn");
const modalHeader = document.getElementById("modalHeader");

// DARK MODE
const themeToggle = document.getElementById("themeToggle");

let activeNoteID = null;
let currentFolderID = null;
let modalMode = "edit";

const API_URL = "https://fjwdttb11f.execute-api.us-east-1.amazonaws.com";

// DEV MODE
const DEV_MODE = window.location.hostname === "localhost";

// MOCK DATA
let devFolders = [
  { folderID: "1", name: "Dev Folder 1" },
  { folderID: "2", name: "Dev Folder 2" }
];

let devNotes = {
  "1": [{ noteID: "1", title: "Local Note A", content: "This is a dev note" }],
  "2": [{ noteID: "2", title: "Local Note B", content: "Works offline!" }]
};

function getToken() {
  if (DEV_MODE) return "dev-token";
  return sessionStorage.getItem("id_token");
}

// DARK MODE
themeToggle.onclick = () => {
  const isDark = document.body.classList.toggle("dark");
  themeToggle.textContent = isDark ? "☀" : "☾";
  localStorage.setItem("theme", isDark ? "dark" : "light");
};

if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
  themeToggle.textContent = "☀";
}

// UI
function updateUI() {
  const token = getToken();

  if (token) {
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";

    landingSection.style.display = "none";
    foldersSection.style.display = "block";
    notesSection.style.display = "none";
    topBar.style.display = "flex";

    fetchFolders();
  } else {
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";

    foldersSection.style.display = "none";
    notesSection.style.display = "none";
    landingSection.style.display = "flex";
    topBar.style.display = "none";
  }
}

// LOGIN
function handleLogin() {
  if (DEV_MODE) {
    alert("DEV MODE");
    updateUI();
    return;
  }

  const clientId = "2ue45ahob50gej2u7vh4hdab7o";
  const redirectUri = "https://main.d3i1c30pbgufzf.amplifyapp.com/files/callback.html";
  const domain = "https://us-east-1rq8auujwo.auth.us-east-1.amazoncognito.com";

  window.location.href =
    `${domain}/login?response_type=code&client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=openid+email+profile`;
}

// NAV
function openFolder(folderID) {
  currentFolderID = folderID;
  foldersSection.style.display = "none";
  notesSection.style.display = "block";
  fetchNotes();
}

backBtn.onclick = () => {
  currentFolderID = null;
  notesSection.style.display = "none";
  foldersSection.style.display = "block";
};

// EVENTS
loginBtn.onclick = handleLogin;
landingLoginBtn.onclick = handleLogin;

logoutBtn.onclick = () => {
  sessionStorage.removeItem("id_token");
  currentFolderID = null;
  updateUI();
};

// ADD BUTTON
addBtn.onclick = () => {
  if (currentFolderID) {
    modalMode = "create-note";
    modalHeader.textContent = "Create Note";
  } else {
    modalMode = "create-folder";
    modalHeader.textContent = "Create Folder";
  }

  modalTitle.value = "";
  modalContent.value = "";
  noteModal.style.display = "flex";
};

// FETCH FOLDERS
async function fetchFolders() {
  foldersList.innerHTML = "";
  const folders = DEV_MODE ? devFolders : await (await fetch(`${API_URL}/folders`, { headers: { Authorization: `Bearer ${getToken()}` }})).json();

  folders.forEach(folder => {
    const card = document.createElement("div");
    card.className = "note-card";

    card.innerHTML = `
      <h3>${folder.name}</h3>
      <div class="folder-actions">
        <button class="primary-btn open-btn">Open</button>
        <button class="delete-btn">Delete</button>
      </div>
    `;

    card.querySelector(".open-btn").onclick = () => openFolder(folder.folderID);

    card.querySelector(".delete-btn").onclick = async () => {
      if (DEV_MODE) {
        devFolders = devFolders.filter(f => f.folderID !== folder.folderID);
        delete devNotes[folder.folderID];
      } else {
        await fetch(`${API_URL}/folders/${folder.folderID}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${getToken()}` }
        });
      }
      fetchFolders();
    };

    foldersList.appendChild(card);
  });
}

// FETCH NOTES
async function fetchNotes() {
  notesList.innerHTML = "";
  const notes = DEV_MODE
    ? devNotes[currentFolderID] || []
    : await (await fetch(`${API_URL}/notes?folderID=${currentFolderID}`, { headers: { Authorization: `Bearer ${getToken()}` }})).json();

  notes.forEach(note => {
    const card = document.createElement("div");
    card.className = "note-card";

    card.innerHTML = `
      <h3>${note.title}</h3>
      <div class="note-actions">
        <button class="primary-btn open-btn">Open</button>
        <button class="delete-btn">Delete</button>
      </div>
    `;

    card.querySelector(".open-btn").onclick = () => openNoteModal(note);

    card.querySelector(".delete-btn").onclick = async () => {
      if (DEV_MODE) {
        devNotes[currentFolderID] = devNotes[currentFolderID].filter(n => n.noteID !== note.noteID);
      } else {
        await fetch(`${API_URL}/notes/${note.noteID}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${getToken()}` }
        });
      }
      fetchNotes();
    };

    notesList.appendChild(card);
  });
}

// MODAL
function openNoteModal(note) {
  modalMode = "edit";
  modalHeader.textContent = "Edit Note";

  activeNoteID = note.noteID;
  modalTitle.value = note.title;
  modalContent.value = note.content;

  noteModal.style.display = "flex";
}

closeModalBtn.onclick = () => noteModal.style.display = "none";

saveNoteBtn.onclick = async () => {
  const token = getToken();

  if (modalMode === "create-folder") {
    if (DEV_MODE) {
      devFolders.push({ folderID: Date.now().toString(), name: modalTitle.value });
    } else {
      await fetch(`${API_URL}/folders`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name: modalTitle.value })
      });
    }
    fetchFolders();
  }

  if (modalMode === "create-note") {
    if (DEV_MODE) {
      if (!devNotes[currentFolderID]) devNotes[currentFolderID] = [];
      devNotes[currentFolderID].push({
        noteID: Date.now().toString(),
        title: modalTitle.value,
        content: modalContent.value
      });
    } else {
      await fetch(`${API_URL}/notes`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          title: modalTitle.value,
          content: modalContent.value,
          folderID: currentFolderID
        })
      });
    }
    fetchNotes();
  }

  if (modalMode === "edit") {
    if (DEV_MODE) {
      const note = devNotes[currentFolderID].find(n => n.noteID === activeNoteID);
      note.title = modalTitle.value;
      note.content = modalContent.value;
    } else {
      await fetch(`${API_URL}/notes/${activeNoteID}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          title: modalTitle.value,
          content: modalContent.value
        })
      });
    }
    fetchNotes();
  }

  noteModal.style.display = "none";
};

// SEARCH
searchInput.oninput = () => {
  const value = searchInput.value.toLowerCase();
  document.querySelectorAll(".note-card").forEach(card => {
    card.style.display = card.innerText.toLowerCase().includes(value) ? "flex" : "none";
  });
};

// DEV AUTO LOGIN
if (DEV_MODE) {
  sessionStorage.setItem("id_token", "dev-token");
}

updateUI();