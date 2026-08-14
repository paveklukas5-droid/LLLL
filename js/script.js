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

// Contact form -> Netlify Forms (AJAX), with a mailto fallback if the
// request itself fails (e.g. running outside Netlify, offline, etc.)
const contactForm = document.getElementById("contactForm");
const formStatus = document.getElementById("formStatus");

function encodeFormData(form) {
  return new URLSearchParams(new FormData(form)).toString();
}

function mailtoFallback(form) {
  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const company = form.company.value.trim();
  const message = form.message.value.trim();

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
}

if (contactForm) {
  contactForm.addEventListener("submit", (e) => {
    e.preventDefault();

    if (formStatus) {
      formStatus.textContent = "Odesílám…";
      formStatus.style.color = "";
    }

    fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: encodeFormData(contactForm),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Netlify form submit failed: ${res.status}`);
        if (formStatus) {
          formStatus.textContent = "Díky! Poptávku jsme přijali a ozveme se vám co nejdřív.";
        }
        contactForm.reset();
      })
      .catch(() => {
        // Not deployed on Netlify (or the request failed) — fall back to
        // opening the user's e-mail client with a prefilled message.
        if (formStatus) {
          formStatus.textContent = "Otevírá se váš e-mailový klient s předvyplněnou zprávou…";
        }
        mailtoFallback(contactForm);
      });
  });
}
