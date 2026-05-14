const header = document.querySelector("[data-header]");
const revealItems = document.querySelectorAll(".reveal");

const setHeaderState = () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 12);
};

setHeaderState();
window.addEventListener("scroll", setHeaderState, { passive: true });

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16 }
);

revealItems.forEach((item, index) => {
  item.style.transitionDelay = `${Math.min(index * 45, 180)}ms`;
  observer.observe(item);
});

document.querySelector(".contact-form")?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const form = event.currentTarget;
  const button = form.querySelector("button[type='submit']");
  const buttonText = button?.querySelector("span");
  const status = form.querySelector(".form-status");
  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());

  if (status) {
    status.textContent = "";
    status.className = "form-status";
  }

  button?.setAttribute("disabled", "true");
  if (buttonText) {
    buttonText.textContent = "Sending...";
  }

  try {
    const response = await fetch("/api/send-estimate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.error || "Please try again.");
    }

    form.reset();
    if (status) {
      status.textContent = "Thanks. Your estimate request has been sent.";
      status.classList.add("is-success");
    }
  } catch (error) {
    if (status) {
      status.textContent =
        error.message || "Something went wrong. Please call us directly.";
      status.classList.add("is-error");
    }
  } finally {
    button?.removeAttribute("disabled");
    if (buttonText) {
      buttonText.textContent = "Request estimate";
    }
  }
});
