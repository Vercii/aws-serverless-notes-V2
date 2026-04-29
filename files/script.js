const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const landingSection = document.getElementById("landingSection");
const notesSection = document.getElementById("notesSection");
const foldersSection = document.getElementById("foldersSection");

const foldersList = document.getElementById("foldersList");
const notesList = document.getElementById("notesList");

const addFolderForm = document.getElementById("addFolderForm");
const addNoteForm = document.getElementById("addNoteForm");

const backBtn = document.getElementById("backBtn");
const landingLoginBtn = document.getElementById("landingLoginBtn");

// MODAL
const noteModal = document.getElementById("noteModal");
const modalTitle = document.getElementById("modalTitle");
const modalContent = document.getElementById("modalContent");
const saveNoteBtn = document.getElementById("saveNoteBtn");
const closeModalBtn = document.getElementById("closeModalBtn");

// THEME
const themeToggle = document.getElementById("themeToggle");

let currentFolderID = null;
let activeNoteID = null;

const API_URL = "https://fjwdttb11f.execute-api.us-east-1.amazonaws.com";

function getToken() {
  return sessionStorage.getItem("id_token");
}

/* ================= UI ================= */
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
    landingSection.style.display = "flex";
    foldersSection.style.display = "none";
    notesSection.style.display = "none";
  }
}

/* ================= LOGIN ================= */
function handleLogin() {
  const clientId = "2ue45ahob50gej2u7vh4hdab7o";
  const redirectUri = "https://main.d3i1c30pbgufzf.amplifyapp.com/files/callback.html";
  const domain = "https://us-east-1rq8auujwo.auth.us-east-1.amazoncognito.com";

  window.location.href =
    `${domain}/login?response_type=code&client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=openid+email+profile`;
}

/* ================= NAV ================= */
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

/* ================= EVENTS ================= */
loginBtn.onclick = handleLogin;
landingLoginBtn.onclick = handleLogin;

logoutBtn.onclick = () => {
  sessionStorage.removeItem("id_token");
  updateUI();
};

/* ================= THEME ================= */
themeToggle.onclick = () => {
  const isDark = document.body.classList.toggle("dark");
  themeToggle.textContent = isDark ? "☀️" : "🌙";
  localStorage.setItem("theme", isDark ? "dark" : "light");
};

if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
  themeToggle.textContent = "☀️";
}

/* ================= FOLDERS ================= */
addFolderForm.onsubmit = async (e) => {
  e.preventDefault();

  const token = getToken();
  const name = folderName.value.trim();

  if (!name || name.length > 20) return alert("Invalid folder name");

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

async function fetchFolders() {
  const token = getToken();

  const res = await fetch(`${API_URL}/folders`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const folders = await res.json();
  foldersList.innerHTML = "";

  folders.forEach((folder) => {
    const card = document.createElement("div");
    card.className = "note-card folder-card";

    card.innerHTML = `
      <div>
        <h3>${folder.name}</h3>
        <div class="folder-actions">
          <button class="open-btn">Open</button>
          <button class="rename-btn">Rename</button>
          <button class="delete-btn">Delete</button>
        </div>
      </div>
    `;

    card.querySelector(".open-btn").onclick = () => openFolder(folder.folderID);

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
      if (!confirm("Delete folder?")) return;

      await fetch(`${API_URL}/folders/${folder.folderID}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      fetchFolders();
    };

    foldersList.appendChild(card);
  });
}

/* ================= NOTES ================= */
addNoteForm.onsubmit = async (e) => {
  e.preventDefault();

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

async function fetchNotes() {
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

    card.innerHTML = `<h3>${note.title}</h3>`;

    card.onclick = () => openNoteModal(note);

    notesList.appendChild(card);
  });
}

/* ================= MODAL ================= */
function openNoteModal(note) {
  activeNoteID = note.noteID;
  modalTitle.value = note.title;
  modalContent.value = note.content;
  noteModal.style.display = "flex";
}

closeModalBtn.onclick = () => noteModal.style.display = "none";

saveNoteBtn.onclick = async () => {
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

updateUI();