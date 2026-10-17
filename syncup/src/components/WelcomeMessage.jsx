import { useUser } from "./homePageUtils";

function WelcomeMessage() {
  const user = useUser();

  return (
    <section className="welcome-message" aria-live="polite">
      <h1>Welcome, {user}!</h1>
    </section>
  );
}

export default WelcomeMessage;
