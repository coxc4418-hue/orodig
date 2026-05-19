async function run() {
  console.log("Sending test login request to http://localhost:8080/api/auth/login...");
  try {
    const res = await fetch("http://localhost:8080/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "user_accionista",
        password: "OroDig2026!"
      })
    });
    console.log("Response status:", res.status);
    const data = await res.json();
    console.log("Response data:", data);
  } catch (err) {
    console.error("Network or parsing error:", err);
  }
}
run();
