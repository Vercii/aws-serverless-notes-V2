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
  const redirectUri = "http://serverless-notes-V2-frontend.s3-website-us-east-1.amazonaws.com/callback.html";
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

async function fetchNotes() {
  const token = getToken(); 

  const res = await fetch(`${API_URL}/notes`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const notes = await res.json();

  notesList.innerHTML = "";

  notes.forEach((note) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${note.title}</strong>
      <p>${note.content}</p>
      <small>${note.timestamp}</small>
    `;
    notesList.appendChild(li);
  });
}

updateUI();
