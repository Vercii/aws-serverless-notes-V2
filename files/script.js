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

// UI
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

// LOGIN
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

// NAV
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

// EVENTS
loginBtn.addEventListener("click", handleLogin);
landingLoginBtn.addEventListener("click", handleLogin);

logoutBtn.addEventListener("click", () => {
  sessionStorage.removeItem("id_token");
  currentFolderID = null;
  updateUI();
});

// CREATE FOLDER
addFolderForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const token = getToken();
  const name = document.getElementById("folderName").value;

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
});

// FETCH FOLDERS (WITH ACTIONS)
async function fetchFolders() {
  const token = getToken();

  const res = await fetch(`${API_URL}/folders`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();
  const folders = Array.isArray(data) ? data : [];

  foldersList.innerHTML = "";

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

// NOTES
addNoteForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!currentFolderID) {
    alert("Select a folder first.");
    return;
  }

  const token = getToken();

  const title = noteTitle.value;
  const content = noteContent.value;

  await fetch(`${API_URL}/notes`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title, content, folderID: currentFolderID }),
  });

  addNoteForm.reset();
  fetchNotes();
});

// FETCH NOTES
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

    card.innerHTML = `
      <h3>${note.title}</h3>
      <p>${note.content}</p>
      <small>${new Date(note.timestamp).toLocaleString()}</small>
      <button class="delete-btn">Delete</button>
    `;

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

updateUI();