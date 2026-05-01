window.onload = async () => {
  if (window.location.hostname === "localhost") {
    document.body.innerHTML = "<h3>DEV MODE: Callback skipped</h3>";
    return;
  }

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
      document.body.innerHTML = "<h3 style='color:red'>Token exchange failed</h3>";
      return;
    }

    sessionStorage.setItem("id_token", data.id_token);
    window.location.href = "/index.html";

  } catch (err) {
    document.body.innerHTML = "<h3 style='color:red'>Error during login</h3>";
  }
};