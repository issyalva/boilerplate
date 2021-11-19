import { debounce } from "../helpers";

/**
 * Filters and sorting component
 */
class FilterAndSortForm extends HTMLElement {
  constructor() {
    super();
    this.resetActiveFilter = this.resetActiveFilter.bind(this);

    this.debouncedOnSubmit = debounce((event) => {
      this.onSubmitHandler(event);
    }, 500);

    this.querySelector("form").addEventListener(
      "input",
      this.debouncedOnSubmit.bind(this)
    );
  }
  static setListeners() {
    const onHistoryChange = (event) => {
      const searchParams = event.state
        ? event.state.searchParams
        : FilterAndSortForm.searchParamsInitial;
      if (searchParams === FilterAndSortForm.searchParamsPrev) return;
      FilterAndSortForm.renderPage(searchParams, null, false);
    };
    window.addEventListener("popstate", onHistoryChange);
  }

  static updateURLHash(searchParams) {
    history.pushState(
      { searchParams },
      "",
      `${window.location.pathname}${searchParams && "?".concat(searchParams)}`
    );
  }

  static renderProductGridContainer(html) {
    document.getElementById("ProductsList").innerHTML = new DOMParser()
      .parseFromString(html, "text/html")
      .getElementById("ProductsList").innerHTML;
  }

  static renderProductCount(html) {
    const count = new DOMParser()
      .parseFromString(html, "text/html")
      .querySelector("#ProductsList [data-products-list]")
      .dataset.productsCount;
    const container = document.getElementById("products-count");
    container.innerHTML = count;
  }

  static renderFilters(html, event) {
    const parsedHTML = new DOMParser().parseFromString(html, "text/html");

    const filtersDetailsElements = parsedHTML.querySelectorAll(
      "#FiltersForm .js-filter"
    );
    filtersDetailsElements.forEach((element) => {
      document.querySelector(
        `.js-filter[data-index="${element.dataset.index}"]`
      ).innerHTML = element.innerHTML;
    });
  }

  static renderSectionFromFetch(url, event) {
    fetch(url)
      .then((response) => response.text())
      .then((responseText) => {
        const html = responseText;
        FilterAndSortForm.renderProductGridContainer(html);
        FilterAndSortForm.data = [...FilterAndSortForm.data, { html, url }];
        FilterAndSortForm.renderFilters(html, event);
        FilterAndSortForm.renderProductCount(html);
      });
  }

  static renderSectionFromCache(filterDataUrl, event) {
    const html = FilterAndSortForm.data.find(filterDataUrl).html;
    FilterAndSortForm.renderFilters(html, event);
    FilterAndSortForm.renderProductGridContainer(html);
    FilterAndSortForm.renderProductCount(html);
  }

  static renderProductCount(html) {
    const count = new DOMParser()
      .parseFromString(html, "text/html")
      .getElementById("ProductsCount").innerHTML;
    const container = document.getElementById("ProductsCount");
    container.innerHTML = count;
  }

  static renderPage(searchParams, event, updateURLHash = true) {
    FilterAndSortForm.searchParamsPrev = searchParams;
    const section = document.getElementById("ProductsList").dataset.id;
    document
      .getElementById("ProductsList")
      .querySelector("[data-products-list]")
      .classList.add("loading");
    const url = `${window.location.pathname}?section_id=${section}&${searchParams}`;
    const filterDataUrl = (element) => element.url === url;

    FilterAndSortForm.data.some(filterDataUrl)
      ? FilterAndSortForm.renderSectionFromCache(filterDataUrl, event)
      : FilterAndSortForm.renderSectionFromFetch(url, event);

    if (updateURLHash) FilterAndSortForm.updateURLHash(searchParams);
  }

  onSubmitHandler(event) {
    event.preventDefault();
    const formData = new FormData(event.target.closest("form"));
    const searchParams = new URLSearchParams(formData).toString();
    FilterAndSortForm.renderPage(searchParams, event);
  }

  resetActiveFilter(event) {
    event.preventDefault();
    FilterAndSortForm.renderPage(
      new URL(event.currentTarget.href).searchParams.toString()
    );
  }
}

FilterAndSortForm.data = [];
FilterAndSortForm.searchParamsInitial = window.location.search.slice(1);
FilterAndSortForm.searchParamsPrev = window.location.search.slice(1);
customElements.define("filter-and-sort-form", FilterAndSortForm);
FilterAndSortForm.setListeners();


/**
 * Clear filters component
 */
class ClearFilters extends HTMLElement {
  constructor() {
    super();
    this.querySelector("a").addEventListener("click", (event) => {
      event.preventDefault();
      const form =
        this.closest("filter-and-sort-form") ||
        document.querySelector("filter-and-sort-form");
      form.resetActiveFilter(event);
    });
  }
}
customElements.define("filter-reset", ClearFilters);

/**
 * Filters toggler
 */
const filterToggler = document.querySelector("[data-filters-toggler]");
filterToggler.addEventListener(
  "click",
  function () {
    const filterSlider = document.querySelector("[data-filters]");
    if (filterSlider) {
      if (window.innerWidth <= 768) {
        filterSlider.classList.toggle("open");
        document.body.classList.toggle("filters-mobile-open");
      } else {
        filterSlider.classList.toggle("close");
      }
    }
  },
  false
);


/**
 * Mobile aside filters
 */
function mobileFiltersAside() {
  if (window.innerWidth <= 768) {
    const closeElements = document.querySelectorAll(
      "[data-mobile-filter-close]"
    );
    if (closeElements && closeElements.length) {
      closeElements.forEach((item) => {
        item.addEventListener(
          "click",
          function (item) {
            document.querySelector("[data-filters]").classList.remove("open");
            document.body.classList.remove("filters-mobile-open");
          },
          false
        );
      });
    }
  }
}

/**
 * Sort dropdown imitator
 */
const sortImitator = document.getElementById("SortBy-imitator");
const sortOrigin = document.getElementById("SortBy");

sortImitator.addEventListener(
  "change",
  function (item) {
    sortOrigin.value = item.target.value;
    sortOrigin.closest("form").dispatchEvent(new Event("input"));
  },
  false
);

/**
 * Sidebar top calculator
 */
function calculateAsideTop() {
  const header = document.getElementById("shopify-section-header");
  if (
    header.classList.contains("sticky-header") &&
    document.querySelector("[data-filters]")
  ) {
    document.querySelector("[data-filters]").style.top =
      header.offsetHeight + "px";
  }
}

/**
 * Add all load events here
 */
window.addEventListener("DOMContentLoaded", function () {
  calculateAsideTop();
  mobileFiltersAside();
});

/**
 * Add all resize events here
 */
window.addEventListener("resize", function () {
  calculateAsideTop();
  mobileFiltersAside();
});
