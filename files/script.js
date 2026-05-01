const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const notesSection = document.getElementById("notesSection");
const landingSection = document.getElementById("landingSection");
const notesList = document.getElementById("notesList");
const addNoteForm = document.getElementById("addNoteForm");
const landingLoginBtn = document.getElementById("landingLoginBtn");

const foldersSection = document.getElementById("foldersSection");
const foldersList = document.getElementById("foldersList");
const addFolderForm = document.getElementById("addFolderForm");

const backBtn = document.getElementById("backBtn");

// MODAL
const noteModal = document.getElementById("noteModal");
const modalTitle = document.getElementById("modalTitle");
const modalContent = document.getElementById("modalContent");
const saveNoteBtn = document.getElementById("saveNoteBtn");
const closeModalBtn = document.getElementById("closeModalBtn");

// DARK MODE
const themeToggle = document.getElementById("themeToggle");

let activeNoteID = null;
let currentFolderID = null;

const API_URL = "https://fjwdttb11f.execute-api.us-east-1.amazonaws.com";

// 🔥 DEV MODE
const DEV_MODE = window.location.hostname === "localhost";

// 🔥 MOCK DATABASE
let devFolders = [
  { folderID: "1", name: "Dev Folder 1" },
  { folderID: "2", name: "Dev Folder 2" }
];

let devNotes = {
  "1": [
    { noteID: "1", title: "Local Note A", content: "This is a dev note" }
  ],
  "2": [
    { noteID: "2", title: "Local Note B", content: "Works offline!" }
  ]
};

function getToken() {
  if (DEV_MODE) return "dev-token";
  return sessionStorage.getItem("id_token");
}

// =========================
// DARK MODE
// =========================
themeToggle.onclick = () => {
  const isDark = document.body.classList.toggle("dark");
  themeToggle.textContent = isDark ? "☀" : "☾";
  localStorage.setItem("theme", isDark ? "dark" : "light");
};

if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
  themeToggle.textContent = "☀";
}

// =========================
// UI
// =========================
function updateUI() {
  const token = getToken();

  if (token) {
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";

    landingSection.style.display = "none";
    foldersSection.style.display = "block";
    notesSection.style.display = "none";

    fetchFolders();
  } else {
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";

    foldersSection.style.display = "none";
    notesSection.style.display = "none";
    landingSection.style.display = "flex";
  }
}

// =========================
// LOGIN
// =========================
function handleLogin() {
  if (DEV_MODE) {
    alert("DEV MODE: Login bypassed");
    updateUI();
    return;
  }

  const clientId = "2ue45ahob50gej2u7vh4hdab7o";
  const redirectUri = "https://main.d3i1c30pbgufzf.amplifyapp.com/files/callback.html";
  const domain = "https://us-east-1rq8auujwo.auth.us-east-1.amazoncognito.com";

  const url =
    `${domain}/login?response_type=code&client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=openid+email+profile`;

  window.location.href = url;
}

// =========================
// NAV
// =========================
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

// =========================
// EVENTS
// =========================
loginBtn.onclick = handleLogin;
landingLoginBtn.onclick = handleLogin;

logoutBtn.onclick = () => {
  sessionStorage.removeItem("id_token");
  currentFolderID = null;
  updateUI();
};

// =========================
// CREATE FOLDER
// =========================
addFolderForm.onsubmit = async (e) => {
  e.preventDefault();

  let name = document.getElementById("folderName").value.trim();

  if (DEV_MODE) {
    devFolders.push({
      folderID: Date.now().toString(),
      name
    });

    addFolderForm.reset();
    fetchFolders();
    return;
  }

  const token = getToken();

  await fetch(`${API_URL}/folders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name }),
  });

  addFolderForm.reset();
  fetchFolders();
};

// =========================
// FETCH FOLDERS
// =========================
async function fetchFolders() {
  if (DEV_MODE) {
    foldersList.innerHTML = "";

    devFolders.forEach((folder) => {
      const card = document.createElement("div");
      card.className = "note-card";

      card.innerHTML = `
        <h3>${folder.name}</h3>
        <div class="folder-actions">
          <button class="primary-btn open-btn">Open</button>
          <button class="secondary-btn rename-btn">Rename</button>
          <button class="delete-btn">Delete</button>
        </div>
      `;

      card.querySelector(".open-btn").onclick = () =>
        openFolder(folder.folderID);

      card.querySelector(".rename-btn").onclick = () => {
        const newName = prompt("Rename folder:", folder.name);
        if (!newName) return;

        folder.name = newName;
        fetchFolders();
      };

      card.querySelector(".delete-btn").onclick = () => {
        devFolders = devFolders.filter(f => f.folderID !== folder.folderID);
        delete devNotes[folder.folderID];
        fetchFolders();
      };

      foldersList.appendChild(card);
    });

    return;
  }

  const token = getToken();
  const res = await fetch(`${API_URL}/folders`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const folders = await res.json();
  foldersList.innerHTML = "";

  folders.forEach((folder) => {
    const card = document.createElement("div");
    card.className = "note-card";

    card.innerHTML = `
      <h3>${folder.name}</h3>
      <div class="folder-actions">
        <button class="primary-btn open-btn">Open</button>
        <button class="secondary-btn rename-btn">Rename</button>
        <button class="delete-btn">Delete</button>
      </div>
    `;

    card.querySelector(".open-btn").onclick = () =>
      openFolder(folder.folderID);

    card.querySelector(".rename-btn").onclick = async () => {
      const newName = prompt("Rename folder:", folder.name);
      if (!newName) return;

      await fetch(`${API_URL}/folders/${folder.folderID}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newName }),
      });

      fetchFolders();
    };

    card.querySelector(".delete-btn").onclick = async () => {
      if (!confirm("Delete this folder and all its notes?")) return;

      await fetch(`${API_URL}/folders/${folder.folderID}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      fetchFolders();
    };

    foldersList.appendChild(card);
  });
}

// =========================
// CREATE NOTE
// =========================
addNoteForm.onsubmit = async (e) => {
  e.preventDefault();

  if (DEV_MODE) {
    if (!devNotes[currentFolderID]) {
      devNotes[currentFolderID] = [];
    }

    devNotes[currentFolderID].push({
      noteID: Date.now().toString(),
      title: noteTitle.value,
      content: noteContent.value
    });

    addNoteForm.reset();
    fetchNotes();
    return;
  }

  const token = getToken();

  await fetch(`${API_URL}/notes`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: noteTitle.value,
      content: noteContent.value,
      folderID: currentFolderID,
    }),
  });

  addNoteForm.reset();
  fetchNotes();
};

// =========================
// FETCH NOTES
// =========================
async function fetchNotes() {
  if (DEV_MODE) {
    const notes = devNotes[currentFolderID] || [];
    notesList.innerHTML = "";

    notes.forEach((note) => {
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

      card.querySelector(".delete-btn").onclick = () => {
        devNotes[currentFolderID] =
          devNotes[currentFolderID].filter(n => n.noteID !== note.noteID);
        fetchNotes();
      };

      notesList.appendChild(card);
    });

    return;
  }

  const token = getToken();

  const res = await fetch(
    `${API_URL}/notes?folderID=${currentFolderID}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  const notes = await res.json();
  notesList.innerHTML = "";

  notes.forEach((note) => {
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
      await fetch(`${API_URL}/notes/${note.noteID}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      fetchNotes();
    };

    notesList.appendChild(card);
  });
}

// =========================
// MODAL
// =========================
function openNoteModal(note) {
  activeNoteID = note.noteID;

  modalTitle.value = note.title;
  modalContent.value = note.content;

  noteModal.style.display = "flex";
}

closeModalBtn.onclick = () => {
  noteModal.style.display = "none";
};

saveNoteBtn.onclick = async () => {
  if (DEV_MODE) {
    const notes = devNotes[currentFolderID];

    const note = notes.find(n => n.noteID === activeNoteID);
    note.title = modalTitle.value;
    note.content = modalContent.value;

    noteModal.style.display = "none";
    fetchNotes();
    return;
  }

  const token = getToken();

  await fetch(`${API_URL}/notes/${activeNoteID}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: modalTitle.value,
      content: modalContent.value,
    }),
  });

  noteModal.style.display = "none";
  fetchNotes();
};

// 🔥 AUTO LOGIN IN DEV
if (DEV_MODE) {
  sessionStorage.setItem("id_token", "dev-token");
}

updateUI();