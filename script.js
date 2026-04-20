const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const notesSection = document.getElementById("notesSection");
const notesList = document.getElementById("notesList");
const addNoteForm = document.getElementById("addNoteForm");

const API_URL = "https://fjwdttb11f.execute-api.us-east-1.amazonaws.com";

function getToken() {
  return sessionStorage.getItem("id_token");
}

function updateUI() {
  const token = getToken();

  if (token) {
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
    notesSection.style.display = "block";
    fetchNotes();
  } else {
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
    notesSection.style.display = "none";
  }
}

loginBtn.addEventListener("click", () => {
  const clientId = "2ue45ahob50gej2u7vh4hdab7o";
  const redirectUri = "https://main.d3i1c30pbgufzf.amplifyapp.com/callback.html";
  const domain = "https://us-east-1rq8auujwo.auth.us-east-1.amazoncognito.com";

  const url = `${domain}/login?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=openid+email+profile`;

  window.location.href = url;
});

logoutBtn.addEventListener("click", () => {
  sessionStorage.removeItem("id_token");
  updateUI();
});

addNoteForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const token = getToken();

  const title = document.getElementById("noteTitle").value;
  const content = document.getElementById("noteContent").value;

  await fetch(`${API_URL}/notes`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title, content }),
  });

  addNoteForm.reset();
  fetchNotes();
});

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

async function fetchNotes() {
  const token = getToken();

  const res = await fetch(`${API_URL}/notes`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  const notes = Array.isArray(data) ? data : [];

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

    card.querySelector(".delete-btn").addEventListener("click", () => {
      deleteNote(note.noteID);
    });

    notesList.appendChild(card);
  });
}

updateUI();