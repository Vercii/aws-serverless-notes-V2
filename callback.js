window.onload = async () => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");

  if (!code) {
    document.body.innerHTML = "<h3 style='color:red'>No code found in URL</h3>";
    return;
  }

  try {
    const clientId = "2ue45ahob50gej2u7vh4hdab7o";
    const redirectUri = "https://serverless-notes-V2-frontend.s3-website-us-east-1.amazonaws.com/callback.html";

    const body = new URLSearchParams();
    body.append("grant_type", "authorization_code");
    body.append("client_id", clientId);
    body.append("code", code);
    body.append("redirect_uri", redirectUri);

    const res = await fetch("https://us-east-1rq8auujwo.auth.us-east-1.amazoncognito.com/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    const data = await res.json();

    if (!data.id_token) {
      console.error(data);
      document.body.innerHTML = "<h3 style='color:red'>Token exchange failed</h3>";
      return;
    }

    // ✅ Store token
    sessionStorage.setItem("id_token", data.id_token);

    // ✅ Redirect back
    window.location.href = "index.html";

  } catch (err) {
    console.error(err);
    document.body.innerHTML = "<h3 style='color:red'>Error during login</h3>";
  }
};
