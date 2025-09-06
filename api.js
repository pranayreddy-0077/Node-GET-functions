const https = require("https");

/* ---------- 1) CALLBACKS ---------- */
function getWithCallback(url, cb) {
  const req = https.get(url, (res) => {
    if (res.statusCode < 200 || res.statusCode >= 300) {
      res.resume();
      return cb(new Error(`HTTP ${res.statusCode}`));
    }
    let raw = "";
    res.setEncoding("utf8");
    res.on("data", (chunk) => (raw += chunk));
    res.on("end", () => {
      try {
        const data = JSON.parse(raw);
        cb(null, data);
      } catch (e) {
        cb(new Error("Invalid JSON"));
      }
    });
  });
  req.on("error", (e) => cb(e));
  req.setTimeout(8000, () => req.destroy(new Error("Request timeout")));
}

/* ---------- 2) PROMISES ---------- */
function getWithPromise(url) {
  return new Promise((resolve, reject) => {
    getWithCallback(url, (err, data) => (err ? reject(err) : resolve(data)));
  });
}

/* ---------- 3) ASYNC / AWAIT ---------- */
async function getWithAsync(url) {
  if (typeof fetch === "function") {
    const res = await fetch(url, { headers: { "User-Agent": "node" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }
  return await getWithPromise(url);
}

/* ---------- CLI DEMO ---------- */
async function main() {
  const url =
    process.argv[2] || "https://jsonplaceholder.typicode.com/todos/1";

  console.log("URL:", url);

  // callbacks
  await new Promise((resolve) => {
    getWithCallback(url, (err, data) => {
      if (err) console.error("callbacks error:", err.message);
      else console.log("callbacks result:", data);
      resolve();
    });
  });

  // promises
  await getWithPromise(url)
    .then((data) => console.log("promises result:", data))
    .catch((e) => console.error("promises error:", e.message));

  // async/await
  try {
    const data = await getWithAsync(url);
    console.log("async/await result:", data);
  } catch (e) {
    console.error("async/await error:", e.message);
  }
}

if (require.main === module) {
  main();
}

module.exports = { getWithCallback, getWithPromise, getWithAsync };
