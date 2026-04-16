export const contactFormRuntimeScript = String.raw`
const setupDemoContactForms = () => {
  const forms = document.querySelectorAll(".c-contact-form__form[data-js='contact-form'][data-contact-form-mode='demo']");

  forms.forEach((form) => {
    const showDemoAlert = (event) => {
      event.preventDefault();
      window.alert(form.getAttribute("data-contact-form-demo-message") || "This is a demo contact form. No message was sent.");
    };
    const submitButton = form.querySelector("button[type='submit']");

    form.addEventListener("submit", showDemoAlert);
    submitButton?.addEventListener("click", showDemoAlert);
  });
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupDemoContactForms, { once: true });
} else {
  setupDemoContactForms();
}
`;
