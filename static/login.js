(() => {
  const loginForm = document.getElementById("login-form");
  const statusEl = document.getElementById("login-status");
  const brandLogo = document.querySelector(".brand-logo");
  const resetModal = document.getElementById("reset-modal");
  const resetForm = document.getElementById("reset-form");
  const resetStatus = document.getElementById("reset-status");
  const resetClose = document.getElementById("reset-modal-close");
  const resetCancel = document.getElementById("reset-modal-cancel");

  const setStatus = (message, variant = "muted") => {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.classList.toggle("error", variant === "error");
    statusEl.classList.toggle("muted", variant !== "error");
  };

  async function parseResponse(response) {
    const text = await response.text();
    let json = null;
    if (text) {
      try {
        json = JSON.parse(text);
      } catch (_err) {
        json = null;
      }
    }
    return { response, json, text };
  }

  async function safeFetch(url, options = {}) {
    const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
    const response = await fetch(url, { ...options, headers });
    const parsed = await parseResponse(response);
    if (!parsed.response.ok) {
      const message =
        (parsed.json && (parsed.json.message || parsed.json.error)) ||
        parsed.text ||
        parsed.response.statusText ||
        "Request failed";
      throw new Error(message);
    }
    return parsed.json || {};
  }

  const extractCredentials = () => {
    if (!loginForm) return null;
    const data = Object.fromEntries(new FormData(loginForm).entries());
    const identifier = (data.identifier || "").trim();
    const password = data.password || "";
    const totp_code = (data.totp_code || "").trim();
    if (!identifier || !password) {
      setStatus("Username/email and password are required.", "error");
      return null;
    }
    return { identifier, password, totp_code };
  };

  loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const credentials = extractCredentials();
    if (!credentials) return;
    try {
      setStatus("Signing in...");
      const result = await safeFetch("/api/auth/start", {
        method: "POST",
        body: JSON.stringify(credentials),
      });
      window.location.href = result.redirect || "/app";
    } catch (err) {
      setStatus(err.message, "error");
    }
  });

  const openResetModal = (event) => {
    event?.preventDefault();
    resetStatus.textContent = "";
    resetModal?.classList.remove("hidden");
  };

  const closeResetModal = () => {
    resetModal?.classList.add("hidden");
  };

  brandLogo?.addEventListener("click", openResetModal);
  resetClose?.addEventListener("click", closeResetModal);
  resetCancel?.addEventListener("click", closeResetModal);
  resetModal?.addEventListener("click", (event) => {
    if (event.target === resetModal) closeResetModal();
  });

  resetForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(resetForm).entries());
    if (!data.pin) return;
    try {
      resetStatus.textContent = "Verifying pin...";
      const response = await safeFetch("/api/reset-pin", {
        method: "POST",
        body: JSON.stringify({ pin: data.pin }),
      });
      resetStatus.textContent = "Pin accepted. Redirecting...";
      window.location.href = response.redirect || "/account";
    } catch (err) {
      resetStatus.textContent = err.message;
    }
  });
})();
