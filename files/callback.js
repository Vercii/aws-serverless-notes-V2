// callback.js
window.onload = async () => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");

  if (!code) {
    document.body.innerHTML = "<h3 style='color:red'>No code found in URL</h3>";
    return;
  }

  try {
    // Send code to backend Lambda for secure token exchange
    const res = await fetch("https://fjwdttb11f.execute-api.us-east-1.amazonaws.com/exchange-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    const data = await res.json();

    if (!data.id_token) {
      console.error(data);
      document.body.innerHTML = "<h3 style='color:red'>Token exchange failed</h3>";
      return;
    }

    // Store the token in sessionStorage
    sessionStorage.setItem("id_token", data.id_token);

    // Redirect back to main page
    window.location.href = "index.html";

  } catch (err) {
    console.error(err);
    document.body.innerHTML = "<h3 style='color:red'>Error during login</h3>";
  }
};