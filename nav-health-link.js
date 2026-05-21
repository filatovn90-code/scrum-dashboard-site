(function () {
  const nav = document.querySelector(".site-nav");
  if (!nav) {
    return;
  }

  const links = [
    { href: "health.html", label: "Здоровье" },
    { href: "books.html", label: "Книги" },
    { href: "anime.html", label: "Аниме" }
  ];

  links.forEach(({ href, label }) => {
    if (nav.querySelector(`[href="${href}"]`)) {
      return;
    }

    const link = document.createElement("a");
    link.className = "nav-link";
    link.href = href;
    link.textContent = label;
    nav.appendChild(link);
  });
})();
