const Swiper = window.Swiper;

/**
 * Image gallery with Swiperjs
 */
class ProductImageGallery extends HTMLDivElement {
  constructor() {
    super();
    this.swiperSlidersPerView = 4;
    this.thumbnailsLength = document.querySelectorAll(
      "[data-thumbnail-images] [data-thumbnail-item]"
    )?.length;

    this.initThumbs();
    this.initMain();
  }

  connectedCallback() {
    // Temporary solution currently swiperjs thumbs not supported asked as feature request
    setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 500);
  }

  initMain() {
    this.swiperImages = new Swiper("[data-main-images]", {
      thumbs: {
        swiper: this.swiperThumbs,
      },
      observer: true,
      observeParents: true,
      slidesPerView: 1,
      spaceBetween: 0,
      loop: true,
      cssMode: true,
      resizeReInit: true,
      allowTouchMove: true,
      navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
      },
      pagination: {
        el: ".swiper-pagination",
        type: "bullets",
        clickable: true,
      },

      breakpoints: {
        990: {
          loop: false,
          slidesPerView: 1,
          spaceBetween: 0,
          cssMode: false,
          pagination: false,
          navigation: false,
          allowTouchMove: false,
        },
      },
      watchOverflow: true,
    });
  }

  initThumbs() {
    this.swiperThumbs = new Swiper("[data-thumbnail-images]", {
      spaceBetween: 8,
      observer: true,
      observeParents: true,
      slidesPerView: this.swiperSlidersPerView,
      preventClicks: false,
      preventClicksPropagation: false,
      allowTouchMove: false,
      watchOverflow: true,
      watchSlidesVisibility: true,
      watchSlidesProgress: true,
      direction: "vertical",
      loop:
        this.thumbnailsLength &&
        this.thumbnailsLength >= this.swiperSlidersPerView
          ? true
          : false,
      resizeReInit: true,
    });
  }
}
customElements.define("product-image-gallery", ProductImageGallery, {
  extends: "div",
});

/**
 * Image zoomer
 */
function initZoom() {
  function zoom(e) {
    const zoomer = e.currentTarget;

    const offsetX = e?.offsetX ? e.offsetX : e.touches[0].pageX;
    const offsetY = e?.offsetY ? e.offsetY : e.touches[0].pageX;

    const x = (offsetX / zoomer.offsetWidth) * 100;
    const y = (offsetY / zoomer.offsetHeight) * 100;
    zoomer.style.backgroundPosition = x + "% " + y + "%";
  }
  if (window.innerWidth > 768) {
    const zoomElems = document.getElementsByClassName("zoom");
    if (zoomElems && zoomElems.length) {
      [...zoomElems].forEach((item) => {
        item.addEventListener("mouseenter", function (e) {
          const img = item.dataset.zoomimg;
          if (img) {
            item.style.backgroundImage = `url(${img})`;
          }
        });
        item.addEventListener("mousemove", function (e) {
          zoom(e);
        });
      });
    }
  }
}

/**
 * Variant Selector Select (dropdown) component
 */
class VariantSelects extends HTMLElement {
  constructor() {
    super();
    this.addEventListener("change", this.onVariantChange);
    this.productForm = document.getElementById("product-form");
  }

  onVariantChange() {
    this.updateOptions();
    this.updateMasterId();
    this.toggleAddButton(true, "", false);
    this.removeErrorMessage();

    if (!this.currentVariant) {
      this.toggleAddButton(true, "", true);
      this.setUnavailable();
    } else {
      this.updateMedia();
      this.updateURL();
      this.updateVariantInput();
      this.renderProductInfo();
    }
  }

  updateOptions() {
    this.options = Array.from(
      this.querySelectorAll("select"),
      (select) => select.value
    );
  }

  updateMasterId() {
    this.currentVariant = this.getVariantData().find((variant) => {
      return !variant.options
        .map((option, index) => {
          return this.options[index] === option;
        })
        .includes(false);
    });
  }

  updateMedia() {
    if (!this.currentVariant) return;
    if (!this.currentVariant.featured_media) return;
    const newMedia = document.querySelector(
      `[data-media-id="${this.dataset.section}-${this.currentVariant.featured_media.id}"]`
    );

    if (!newMedia) return;
    const modalContent = document.querySelector(
      `#ProductModal-${this.dataset.section} .product-media-modal__content`
    );
    const newMediaModal = modalContent.querySelector(
      `[data-media-id="${this.currentVariant.featured_media.id}"]`
    );
    const parent = newMedia.parentElement;
    if (parent.firstChild == newMedia) return;
    modalContent.prepend(newMediaModal);
    parent.prepend(newMedia);
    this.stickyHeader =
      this.stickyHeader || document.querySelector("sticky-header");
    if (this.stickyHeader) {
      this.stickyHeader.dispatchEvent(new Event("preventHeaderReveal"));
    }
    window.setTimeout(() => {
      parent
        .querySelector("li.product__media-item")
        .scrollIntoView({ behavior: "smooth" });
    });
  }

  updateURL() {
    if (!this.currentVariant || this.dataset.updateUrl === "false") return;
    window.history.replaceState(
      {},
      "",
      `${this.dataset.url}?variant=${this.currentVariant.id}`
    );
  }

  updateVariantInput() {
    const input = this.productForm.querySelector('input[name="id"]');
    input.value = this.currentVariant.id;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  removeErrorMessage() {
    if (!this.productForm) return;
    this.productForm.querySelector("[data-ajax-cart-form-error]").innerHTML =
      "";
  }

  renderProductInfo() {
    fetch(
      `${this.dataset.url}?variant=${this.currentVariant.id}&section_id=${this.dataset.section}`
    )
      .then((response) => response.text())
      .then((responseText) => {
        const elem = `[data-price]`;
        const html = new DOMParser().parseFromString(responseText, "text/html");
        const destination = document.querySelector(elem);
        const source = html.querySelector(elem);

        if (source && destination) destination.innerHTML = source.innerHTML;

        const price = document.querySelector(elem);

        if (price) price.classList.remove("visibility-hidden");
        this.toggleAddButton(
          !this.currentVariant.available,
          window.variantStrings.soldOut
        );
      });
  }

  toggleAddButton(disable = true, text, modifyClass = true) {
    const productForm = this.productForm;
    if (!productForm) return;
    const addButton = productForm.querySelector('[name="add"]');

    if (!addButton) return;

    if (disable) {
      addButton.setAttribute("disabled", true);
      if (text) addButton.textContent = text;
    } else {
      addButton.removeAttribute("disabled");
      addButton.textContent = window.variantStrings.addToCart;
    }

    if (!modifyClass) return;
  }

  setUnavailable() {
    const addButton = document.querySelector('[name="add"]');
    const priceWrapper = document.querySelector(`[data-price]`);
    if (!addButton) return;
    addButton.textContent = window.variantStrings.unavailable;
    if (priceWrapper) priceWrapper.classList.add("visibility-hidden");
  }

  getVariantData() {
    this.variantData =
      this.variantData ||
      JSON.parse(this.querySelector('[type="application/json"]').textContent);
    return this.variantData;
  }
}
customElements.define("variant-selects", VariantSelects);

/**
 * Variant Selector Radio component
 */
class VariantRadios extends VariantSelects {
  constructor() {
    super();
  }

  updateOptions() {
    const fieldsets = Array.from(this.querySelectorAll("fieldset"));
    this.options = fieldsets.map((fieldset) => {
      return Array.from(fieldset.querySelectorAll("input")).find(
        (radio) => radio.checked
      ).value;
    });
  }
}
customElements.define("variant-radios", VariantRadios);

/**
 * Add all load events here
 */
window.addEventListener("DOMContentLoaded", function () {
  initZoom();
});

/**
 * Add all resize events here
 */
window.addEventListener("resize", function () {
  initZoom();
});
