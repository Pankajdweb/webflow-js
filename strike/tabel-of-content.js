document.addEventListener("DOMContentLoaded", () => {
  const contentWrapper = document.querySelector("[content-wrapper]");
  const navContainer = document.querySelector("[content-navigation]");

  if (!contentWrapper || !navContainer) return;

  const headings = [...contentWrapper.querySelectorAll("h2")];
  if (!headings.length) return;

  const tocLinks = [];
  navContainer.classList.add("toc-list");

  headings.forEach((heading, index) => {
    const text = heading.textContent.trim();
    let id = text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
    if (document.getElementById(id) && document.getElementById(id) !== heading) id = `${id}-${index}`;
    heading.id = id;

    const link = Object.assign(document.createElement("a"), {
      href: `#${id}`,
      textContent: text,
      className: "toc-link",
    });

    const li = Object.assign(document.createElement("li"), { className: "toc-item" });
    li.appendChild(link);
    navContainer.appendChild(li);
    tocLinks.push({ id, link });
  });

  const observer = new IntersectionObserver((entries) => {
    const hit = entries.find((e) => e.isIntersecting);
    if (!hit) return;
    tocLinks.forEach(({ link }) => link.classList.remove("active"));
    tocLinks.find(({ id }) => id === hit.target.id)?.link.classList.add("active");
  }, { rootMargin: "0px 0px -60% 0px", threshold: 0 });

  headings.forEach((h) => observer.observe(h));
});
