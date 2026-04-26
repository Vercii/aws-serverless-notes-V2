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

let currentFolderID = null;

const API_URL = "https://fjwdttb11f.execute-api.us-east-1.amazonaws.com";

function getToken() {
  return sessionStorage.getItem("id_token");
}

// =========================
// UI STATE
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
// NAVIGATION
// =========================
function openFolder(folderID) {
  currentFolderID = folderID;

  foldersSection.style.display = "none";
  notesSection.style.display = "block";

  notesList.innerHTML = "";
  fetchNotes();
}

backBtn.addEventListener("click", () => {
  currentFolderID = null;
  notesSection.style.display = "none";
  foldersSection.style.display = "block";
});

// =========================
// EVENTS
// =========================
loginBtn.addEventListener("click", handleLogin);
landingLoginBtn.addEventListener("click", handleLogin);

logoutBtn.addEventListener("click", () => {
  sessionStorage.removeItem("id_token");
  currentFolderID = null;
  updateUI();
});

// =========================
// CREATE FOLDER
// =========================
addFolderForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const token = getToken();
  const name = document.getElementById("folderName").value;

  const res = await fetch(`${API_URL}/folders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name }),
  });

  if (!res.ok) {
    alert("Failed to create folder");
    return;
  }

  addFolderForm.reset();
  fetchFolders();
});

// =========================
// FETCH FOLDERS (WITH RENAME + DELETE RESTORED)
// =========================
async function fetchFolders() {
  const token = getToken();

  const res = await fetch(`${API_URL}/folders`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();
  const folders = Array.isArray(data) ? data : [];

  foldersList.innerHTML = "";

  if (folders.length === 0) {
    foldersList.innerHTML = "<p>No folders yet. Create one above.</p>";
    return;
  }

  folders.forEach((folder) => {
    const card = document.createElement("div");
    card.className = "note-card";

    card.innerHTML = `
      <h3>${folder.name}</h3>
      <div class="folder-actions">
        <button class="open-btn">Open</button>
        <button class="rename-btn">Rename</button>
        <button class="delete-btn">Delete</button>
      </div>
    `;

    // OPEN
    card.querySelector(".open-btn").addEventListener("click", () => {
      openFolder(folder.folderID);
    });

    // RENAME
    card.querySelector(".rename-btn").addEventListener("click", async () => {
      const newName = prompt("Rename folder:", folder.name);
      if (!newName) return;

      const token = getToken();

      const res = await fetch(`${API_URL}/folders/${folder.folderID}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newName }),
      });

      if (!res.ok) {
        alert("Failed to rename folder");
        return;
      }

      fetchFolders();
    });

    // DELETE
    card.querySelector(".delete-btn").addEventListener("click", async () => {
      const confirmDelete = confirm(
        "Delete this folder and all its notes?"
      );
      if (!confirmDelete) return;

      const token = getToken();

      const res = await fetch(`${API_URL}/folders/${folder.folderID}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        alert("Failed to delete folder");
        return;
      }

      if (currentFolderID === folder.folderID) {
        currentFolderID = null;
        notesSection.style.display = "none";
        foldersSection.style.display = "block";
      }

      fetchFolders();
    });

    foldersList.appendChild(card);
  });
}

// =========================
// CREATE NOTE
// =========================
addNoteForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!currentFolderID) {
    alert("Please select a folder first.");
    return;
  }

  const token = getToken();

  const title = document.getElementById("noteTitle").value;
  const content = document.getElementById("noteContent").value;

  const res = await fetch(`${API_URL}/notes`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title,
      content,
      folderID: currentFolderID,
    }),
  });

  if (!res.ok) {
    alert("Failed to create note");
    return;
  }

  addNoteForm.reset();
  fetchNotes();
});

// =========================
// FETCH NOTES
// =========================
async function fetchNotes() {
  const token = getToken();

  if (!currentFolderID) return;

  const res = await fetch(
    `${API_URL}/notes?folderID=${currentFolderID}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  const data = await res.json();
  const notes = Array.isArray(data) ? data : [];

  notesList.innerHTML = "";

  if (notes.length === 0) {
    notesList.innerHTML = "<p>No notes yet.</p>";
    return;
  }

  notes.forEach((note) => {
    const card = document.createElement("div");
    card.className = "note-card";

    card.innerHTML = `
      <h3>${note.title}</h3>
      <p>${note.content}</p>
      <small>${new Date(note.timestamp).toLocaleString()}</small>
      <button class="delete-btn">Delete</button>
    `;

    card.querySelector(".delete-btn").addEventListener("click", async () => {
      const token = getToken();

      await fetch(`${API_URL}/notes/${note.noteID}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      fetchNotes();
    });

    notesList.appendChild(card);
  });
}

updateUI();