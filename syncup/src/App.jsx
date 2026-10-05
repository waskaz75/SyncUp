import { useEffect, useState } from "react";

import "./index.css";

const LOGIN_KEY = "syncup_logged_in";
const SESSION_KEY = "syncup_session_id";
const USERNAME_KEY = "syncup_username";

function App() {
  const [screen, setScreen] = useState("auth");
  const [mode, setMode] = useState("login");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  const [registerForm, setRegisterForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [twoFactorCode, setTwoFactorCode] = useState("");

  useEffect(() => {
    const isLoggedIn = localStorage.getItem(LOGIN_KEY) === "true";

    if (isLoggedIn) {
      setScreen("home");
    }
  }, []);

  function updateLoginField(event) {
    setLoginForm({
      ...loginForm,
      [event.target.name]: event.target.value,
    });
  }

  function updateRegisterField(event) {
    setRegisterForm({
      ...registerForm,
      [event.target.name]: event.target.value,
    });
  }

  function showLogin() {
    setMode("login");
    setError("");
    setNotice("");
  }

  function showRegister() {
    setMode("register");
    setError("");
    setNotice("");
  }

  // ============================================================
  // LOGIN
  // Connected to Spring Boot.
  // ============================================================

  async function handleLogin(event) {
    event.preventDefault();

    setError("");
    setNotice("");

    if (!loginForm.email || !loginForm.password) {
      setError("Please complete all fields.");
      return;
    }

    try {
      const params = new URLSearchParams({
        email: loginForm.email,
        password: loginForm.password,
      });

      const response = await fetch(
        `http://localhost:8080/api/auth/login?${params.toString()}`,
        {
          method: "POST",
        }
      );

      const message = await response.text();

      if (message.startsWith("Login successful. Session ID: ")) {
        const sessionPrefix = "Login successful. Session ID: ";
        const usernameMarker = ". Username: ";

        const sessionStart = sessionPrefix.length;
        const usernamePosition = message.indexOf(usernameMarker);

        if (usernamePosition === -1) {
          setError("Login response was not in the expected format.");
          return;
        }

        const sessionId = message.substring(
          sessionStart,
          usernamePosition
        );

        const username = message.substring(
          usernamePosition + usernameMarker.length
        );

        // Save information returned by the backend.
        localStorage.setItem(SESSION_KEY, sessionId);
        localStorage.setItem(USERNAME_KEY, username);

        setPendingEmail(loginForm.email);

        // Continue to the existing demo 2FA screen.
        setScreen("two-factor");
      } else {
        setError(message);
      }
    } catch (error) {
      console.error("Login request failed:", error);

      setError("Could not connect to the Sync Up server.");
    }
  }

  // ============================================================
  // REGISTRATION
  // Connected to Spring Boot.
  // ============================================================

  async function handleRegistration(event) {
    event.preventDefault();

    setError("");
    setNotice("");

    const {
      username,
      email,
      password,
      confirmPassword,
    } = registerForm;

    if (!username || !email || !password || !confirmPassword) {
      setError("All fields are required.");
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const params = new URLSearchParams({
        username,
        email,
        password,
      });

      const response = await fetch(
        `http://localhost:8080/api/auth/register?${params.toString()}`,
        {
          method: "POST",
        }
      );

      const message = await response.text();

      if (message !== "User registered successfully") {
        setError(message);
        return;
      }

      setLoginForm({
        email,
        password: "",
      });

      setRegisterForm({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
      });

      setMode("login");

      setNotice(
        "Your account was created. Sign in to continue to 2-factor authentication."
      );
    } catch (error) {
      console.error("Registration request failed:", error);

      setError("Could not connect to the Sync Up server.");
    }
  }

  // ============================================================
  // TWO-FACTOR AUTHENTICATION
  // Still demo behavior.
  // ============================================================

  function handleTwoFactorSubmit(event) {
    event.preventDefault();

    setError("");

    if (!twoFactorCode) {
      setError("Enter the 6-digit verification code.");
      return;
    }

    if (!/^\d{6}$/.test(twoFactorCode)) {
      setError("The verification code must contain exactly 6 digits.");
      return;
    }

    // For now, any 6-digit number is accepted.
    localStorage.setItem(LOGIN_KEY, "true");

    setScreen("home");
  }

  // ============================================================
  // LOGOUT
  // Connected to Spring Boot.
  // ============================================================

  async function handleLogout() {
    setError("");

    const sessionId = localStorage.getItem(SESSION_KEY);

    if (!sessionId) {
      setError("No active session was found.");
      return;
    }

    try {
      const params = new URLSearchParams({
        sessionId,
      });

      const response = await fetch(
        `http://localhost:8080/api/auth/logout?${params.toString()}`,
        {
          method: "POST",
        }
      );

      const message = await response.text();

      if (message === "Logout successful") {
        // Remove all local login/session information.
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(LOGIN_KEY);
        localStorage.removeItem(USERNAME_KEY);

        setScreen("auth");
        setMode("login");
        setTwoFactorCode("");

        setLoginForm({
          email: "",
          password: "",
        });

        setNotice("You have been signed out.");
      } else {
        setError(message);
      }
    } catch (error) {
      console.error("Logout request failed:", error);

      setError("Could not connect to the Sync Up server.");
    }
  }

  // ============================================================
  // HOME SCREEN
  // ============================================================

  if (screen === "home") {
    return <HomePage onLogout={handleLogout} />;
  }

  // ============================================================
  // TWO-FACTOR SCREEN
  // ============================================================

  if (screen === "two-factor") {
    return (
      <TwoFactorPage
        email={pendingEmail}
        code={twoFactorCode}
        setCode={setTwoFactorCode}
        error={error}
        onSubmit={handleTwoFactorSubmit}
        onBack={() => {
          setScreen("auth");
          setError("");
        }}
      />
    );
  }

  // ============================================================
  // LOGIN / REGISTRATION SCREEN
  // ============================================================

  return (
    <main className="auth-layout">
      <section className="brand-panel">
        <div className="brand-mark">S</div>

        <p className="eyebrow">SYNC UP SYSTEM</p>

        <h1>
          Stay connected with the people and work that matter.
        </h1>

        <p className="brand-description">
          Securely access your Sync Up account and keep everything
          organized in one calm, collaborative space.
        </p>

        <div className="brand-stat-row">
          <div>
            <strong>2FA</strong>
            <span>Protected access</span>
          </div>

          <div>
            <strong>24/7</strong>
            <span>Connected workspace</span>
          </div>
        </div>
      </section>

      <section className="form-panel">
        <div className="form-card">
          <div className="mobile-brand">
            <div className="brand-mark small">S</div>
            <span>Sync Up</span>
          </div>

          <div className="form-heading">
            <p className="eyebrow">WELCOME!</p>

            <h2>
              {mode === "login"
                ? "Sign in to Sync Up"
                : "Create your account"}
            </h2>

            <p>
              {mode === "login"
                ? "Enter your details to continue."
                : "Set up your account to get started."}
            </p>
          </div>

          <div className="mode-switcher">
            <button
              className={mode === "login" ? "active" : ""}
              onClick={showLogin}
              type="button"
            >
              Sign in
            </button>

            <button
              className={mode === "register" ? "active" : ""}
              onClick={showRegister}
              type="button"
            >
              Sign up
            </button>
          </div>

          {error && (
            <div className="message error">
              {error}
            </div>
          )}

          {notice && (
            <div className="message success">
              {notice}
            </div>
          )}

          {mode === "login" ? (
            <form onSubmit={handleLogin}>
              <label htmlFor="login-email">
                Email address
              </label>

              <input
                id="login-email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={loginForm.email}
                onChange={updateLoginField}
                autoComplete="email"
              />

              <div className="label-row">
                <label htmlFor="login-password">
                  Password
                </label>
              </div>

              <input
                id="login-password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={loginForm.password}
                onChange={updateLoginField}
                autoComplete="current-password"
              />

              <button
                className="primary-button"
                type="submit"
              >
                Continue to verification
                <span>→</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegistration}>
              <label htmlFor="register-username">
                Username
              </label>

              <input
                id="register-username"
                name="username"
                type="text"
                placeholder="Your name"
                value={registerForm.username}
                onChange={updateRegisterField}
                autoComplete="name"
              />

              <label htmlFor="register-email">
                Email address
              </label>

              <input
                id="register-email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={registerForm.email}
                onChange={updateRegisterField}
                autoComplete="email"
              />

              <label htmlFor="register-password">
                Password
              </label>

              <input
                id="register-password"
                name="password"
                type="password"
                placeholder="At least 8 characters"
                value={registerForm.password}
                onChange={updateRegisterField}
                autoComplete="new-password"
              />

              <label htmlFor="register-confirm-password">
                Confirm password
              </label>

              <input
                id="register-confirm-password"
                name="confirmPassword"
                type="password"
                placeholder="Repeat your password"
                value={registerForm.confirmPassword}
                onChange={updateRegisterField}
                autoComplete="new-password"
              />

              <button
                className="primary-button"
                type="submit"
              >
                Create account
                <span>→</span>
              </button>
            </form>
          )}

          <p className="security-note">
            <span>✦</span>
            Your account is protected with two-factor authentication.
          </p>
        </div>
      </section>
    </main>
  );
}

// ============================================================
// TWO-FACTOR PAGE
// ============================================================

function TwoFactorPage({
  email,
  code,
  setCode,
  error,
  onSubmit,
  onBack,
}) {
  return (
    <main className="centered-layout">
      <section className="verification-card">
        <div className="verification-icon">
          ✦
        </div>

        <p className="eyebrow">
          SECURITY CHECK
        </p>

        <h1>
          Verify your identity
        </h1>

        <p className="verification-description">
          Enter the 6-digit code sent to{" "}
          <strong>{email}</strong>.
        </p>

        {error && (
          <div className="message error">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit}>
          <label htmlFor="two-factor-code">
            Verification code
          </label>

          <input
            id="two-factor-code"
            className="code-input"
            type="text"
            inputMode="numeric"
            maxLength="6"
            placeholder="000000"
            value={code}
            onChange={(event) =>
              setCode(
                event.target.value.replace(/\D/g, "")
              )
            }
          />

          <button
            className="primary-button"
            type="submit"
          >
            Verify and continue
            <span>→</span>
          </button>
        </form>

        <button
          type="button"
          className="back-button"
          onClick={onBack}
        >
          ← Back to sign in
        </button>

        <p className="demo-hint">
          Demo: enter any 6-digit code, such as{" "}
          <strong>123456</strong>.
        </p>
      </section>
    </main>
  );
}

// ============================================================
// HOME PAGE
// ============================================================

function HomePage({ onLogout }) {
  const username =
    localStorage.getItem(USERNAME_KEY) || "there";

  return (
    <main className="home-layout">
      <nav className="top-nav">
        <div className="nav-logo">
          <div className="brand-mark small">
            S
          </div>

          <span>
            Sync Up
          </span>
        </div>

        <button
          className="logout-button"
          onClick={onLogout}
        >
          Sign out
        </button>
      </nav>

      <section className="home-content">
        <div className="home-hero">
          <p className="eyebrow">
            YOUR WORKSPACE
          </p>

          <h1>
            Welcome, {username}.
          </h1>

          <p>
            Your account has been verified successfully.
            You are now signed in to Sync Up.
          </p>
        </div>

        <div className="dashboard-grid">
          <article className="dashboard-card gradient-card">
            <span className="card-icon">
              ✦
            </span>

            <h2>
              Account verified
            </h2>

            <p>
              Your login and 2-factor authentication
              were completed.
            </p>
          </article>

          <article className="dashboard-card">
            <span className="card-icon purple-icon">
              ◌
            </span>

            <h2>
              Stay organized
            </h2>

            <p>
              Manage your profile, projects, and team
              connections.
            </p>
          </article>

          <article className="dashboard-card">
            <span className="card-icon pink-icon">
              ♡
            </span>

            <h2>
              Work together
            </h2>

            <p>
              Sync your work with the people who help
              you move forward.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}

export default App;