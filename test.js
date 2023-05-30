(async function main() {
  for (let i = 0; i < 500; i++) {
    const res = await fetch("http://localhost:58080", {
      method: "GET",
      headers: { accept: "application/json" },
    });
    if (!res.ok) {
      throw new Error("Unexpected not OK response");
    }
  }
})();
