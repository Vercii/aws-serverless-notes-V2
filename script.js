const foldersList = document.getElementById("foldersList");
const notesList = document.getElementById("notesList");
const addFolderForm = document.getElementById("addFolderForm");
const addNoteForm = document.getElementById("addNoteForm");
const currentFolderNameEl = document.getElementById("currentFolderName");
const logoutBtn = document.getElementById("logoutBtn");

let currentFolderID = null;

const API_URL = "https://fjwdttb11f.execute-api.us-east-1.amazonaws.com";

function getToken() {
  return sessionStorage.getItem("id_token");
}

// =========================
// LOGOUT
// =========================
logoutBtn.addEventListener("click", () => {
  sessionStorage.removeItem("id_token");
  location.reload();
});

// =========================
// CREATE FOLDER
// =========================
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

// =========================
// FETCH FOLDERS
// =========================
async function fetchFolders() {
  const token = getToken();

  foldersList.innerHTML = "Loading...";

  const res = await fetch(`${API_URL}/folders`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const folders = await res.json();

  if (!Array.isArray(folders)) return;

  foldersList.innerHTML = "";

  folders.forEach((folder) => {
    const div = document.createElement("div");
    div.className = "folder-item";

    div.innerHTML = `
      <span class="folder-name">${folder.name}</span>
      <div class="folder-actions">
        <button class="rename-btn">✏️</button>
        <button class="delete-btn">🗑️</button>
      </div>
    `;

    // OPEN
    div.querySelector(".folder-name").onclick = () => {
      openFolder(folder.folderID, folder.name);
    };

    // RENAME
    div.querySelector(".rename-btn").onclick = async () => {
      const newName = prompt("New folder name:", folder.name);
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

    // DELETE
    div.querySelector(".delete-btn").onclick = async () => {
      const confirmDelete = confirm("Delete this folder and all notes?");
      if (!confirmDelete) return;

      await fetch(`${API_URL}/folders/${folder.folderID}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (currentFolderID === folder.folderID) {
        currentFolderID = null;
        currentFolderNameEl.textContent = "Select a folder";
        notesList.innerHTML = "";
      }

      fetchFolders();
    };

    foldersList.appendChild(div);
  });
}

// =========================
// OPEN FOLDER
// =========================
function openFolder(folderID, folderName) {
  currentFolderID = folderID;
  currentFolderNameEl.textContent = `📁 ${folderName}`;
  fetchNotes();
}

// =========================
// ADD NOTE
// =========================
addNoteForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!currentFolderID) {
    alert("Select a folder first.");
    return;
  }

  const token = getToken();

  const title = document.getElementById("noteTitle").value;
  const content = document.getElementById("noteContent").value;

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

// =========================
// FETCH NOTES
// =========================
async function fetchNotes() {
  const token = getToken();

  notesList.innerHTML = "Loading...";

  const res = await fetch(
    `${API_URL}/notes?folderID=${currentFolderID}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  const notes = await res.json();

  if (!Array.isArray(notes) || notes.length === 0) {
    notesList.innerHTML = "<p>No notes yet.</p>";
    return;
  }

  notesList.innerHTML = "";

  notes.forEach((note) => {
    const div = document.createElement("div");
    div.className = "note-card";

    div.innerHTML = `
      <h3>${note.title}</h3>
      <p>${note.content}</p>
      <button class="delete-btn">Delete</button>
    `;

    div.querySelector(".delete-btn").onclick = () => {
      deleteNote(note.noteID);
    };

    notesList.appendChild(div);
  });
}

// =========================
// DELETE NOTE
// =========================
async function deleteNote(noteID) {
  const token = getToken();

  await fetch(`${API_URL}/notes/${noteID}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  fetchNotes();
}

// INIT
fetchFolders();