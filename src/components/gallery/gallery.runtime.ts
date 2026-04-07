declare const document: any;
declare const window: any;
declare const HTMLElement: any;
declare const HTMLButtonElement: any;
declare const HTMLImageElement: any;
declare const KeyboardEvent: any;

const setupGalleryLightboxesSource = /* JavaScript */ `
const setupGalleryLightboxes = () => {
  const galleries = document.querySelectorAll(".c-gallery[data-js='gallery']");

  galleries.forEach((gallery) => {
    if (!(gallery instanceof HTMLElement)) {
      return;
    }

    const dialog = gallery.querySelector(".c-gallery__dialog");
    const dialogImage = gallery.querySelector(".c-gallery__dialog-image");
    const dialogCaption = gallery.querySelector(".c-gallery__dialog-caption");
    const closeButton = gallery.querySelector(".c-gallery__dialog-close");
    const triggers = gallery.querySelectorAll(".c-gallery__trigger");

    if (
      !(dialog instanceof HTMLElement) ||
      !(dialogImage instanceof HTMLImageElement) ||
      !(dialogCaption instanceof HTMLElement) ||
      !(closeButton instanceof HTMLButtonElement)
    ) {
      return;
    }

    const closeDialog = () => {
      dialog.hidden = true;
      dialogImage.removeAttribute("src");
      dialogImage.removeAttribute("alt");
      dialogCaption.textContent = "";
      gallery.dataset.galleryOpen = "false";
    };

    const openDialog = ({ fullSrc, alt, caption }) => {
      dialogImage.src = fullSrc;
      dialogImage.alt = alt;
      dialogCaption.textContent = caption || "";
      dialog.hidden = false;
      gallery.dataset.galleryOpen = "true";
    };

    triggers.forEach((trigger) => {
      if (!(trigger instanceof HTMLButtonElement)) {
        return;
      }

      trigger.addEventListener("click", () => {
        const fullSrc = trigger.dataset.galleryFullSrc;
        const alt = trigger.dataset.galleryAlt || "";

        if (!fullSrc) {
          return;
        }

        openDialog({
          fullSrc,
          alt,
          caption: trigger.dataset.galleryCaption || "",
        });
      });
    });

    closeButton.addEventListener("click", closeDialog);

    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) {
        closeDialog();
      }
    });

    window.addEventListener("keydown", (event) => {
      if (!(event instanceof KeyboardEvent) || event.key !== "Escape") {
        return;
      }

      if (gallery.dataset.galleryOpen === "true") {
        closeDialog();
      }
    });

    closeDialog();
  });
};
`.trim();

const bootstrapGalleryLightboxesSource = /* JavaScript */ `
(() => {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupGalleryLightboxes, { once: true });
    return;
  }

  setupGalleryLightboxes();
})();
`.trim();

export const galleryRuntimeScript = [
  setupGalleryLightboxesSource,
  bootstrapGalleryLightboxesSource,
].join("\n\n");
