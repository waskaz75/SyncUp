import { HOME_ROUTES } from "./homePageUtils";
import ProfileMenu from "./ProfileMenu";

function NavBar({
  activePath,
  onNavigate,
  onLogout,
}) {
  return (
    <header className="home-nav-shell">
      <strong className="home-brand-name">SyncUp</strong>

      <div className="home-nav-right">
        <nav aria-label="Primary">
          <ul className="home-nav-list">
            {HOME_ROUTES.map((route) => {
              const isActive = activePath === route.path;

              return (
                <li key={route.path}>
                  <a
                    href={route.path}
                    aria-current={isActive ? "page" : undefined}
                    className={`home-nav-link ${
                      isActive ? "active" : ""
                    }`}
                    onClick={(event) => {
                      event.preventDefault();
                      onNavigate(route.path);
                    }}
                  >
                    {route.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <ProfileMenu onLogout={onLogout} />
      </div>
    </header>
  );
}

export default NavBar;