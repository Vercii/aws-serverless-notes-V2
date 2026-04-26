window.onload = async () => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");

  if (!code) {
    document.body.innerHTML = "<h3 style='color:red'>No code found in URL</h3>";
    return;
  }

  try {
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

    sessionStorage.setItem("id_token", data.id_token);

    // IMPORTANT FIX: go back to ROOT index
    window.location.href = "/index.html";

  } catch (err) {
    console.error(err);
    document.body.innerHTML = "<h3 style='color:red'>Error during login</h3>";
  }
};