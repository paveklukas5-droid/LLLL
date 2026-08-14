// Mobile nav toggle
const navToggle = document.getElementById("navToggle");
const siteHeader = document.getElementById("siteHeader");

if (navToggle && siteHeader) {
  navToggle.addEventListener("click", () => {
    const isOpen = siteHeader.classList.toggle("nav-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
    navToggle.textContent = isOpen ? "✕" : "☰";
  });

  document.querySelectorAll(".nav-links a").forEach((link) => {
    link.addEventListener("click", () => {
      siteHeader.classList.remove("nav-open");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.textContent = "☰";
    });
  });
}

// Reveal-on-scroll animations
const revealEls = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window && revealEls.length) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
  );

  revealEls.forEach((el) => observer.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add("is-visible"));
}

// Contact form -> mailto handoff
const contactForm = document.getElementById("contactForm");
const formStatus = document.getElementById("formStatus");

if (contactForm) {
  contactForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = contactForm.name.value.trim();
    const email = contactForm.email.value.trim();
    const company = contactForm.company.value.trim();
    const message = contactForm.message.value.trim();

    const subject = encodeURIComponent(`Poptávka z webu — ${name}`);
    const bodyLines = [
      `Jméno: ${name}`,
      `E-mail: ${email}`,
      company ? `Firma: ${company}` : null,
      "",
      message,
    ].filter(Boolean);
    const body = encodeURIComponent(bodyLines.join("\n"));

    window.location.href = `mailto:contact.sonity@gmail.com?subject=${subject}&body=${body}`;

    if (formStatus) {
      formStatus.textContent = "Otevírá se váš e-mailový klient s předvyplněnou zprávou…";
    }
  });
}
