import { getCurrentSession, signOutCurrentUser } from "./auth-helpers.js";
import { appPath, landingPath, profilePath } from "./route-paths.js";

const nav = document.querySelector(".site-nav");

bootstrap();

async function bootstrap() {
  try {
    const session = await getCurrentSession();
    if (!session?.user || !nav) {
      return;
    }

    nav.innerHTML = `
      <a class="nav-link is-active" href="${landingPath()}">Главная</a>
      <a class="nav-link" href="${appPath()}">Приложение</a>
      <a class="nav-link" href="${profilePath()}">Профиль</a>
      <button class="login-button" id="landingLogoutButton" type="button">Выйти</button>
    `;

    document.getElementById("landingLogoutButton")?.addEventListener("click", async () => {
      await signOutCurrentUser().catch(() => null);
      window.location.replace(landingPath());
    });
  } catch {
    // leave public version visible
  }
}
