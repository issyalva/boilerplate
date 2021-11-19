export function findAncestor(el, sel) {
  while (
    (el = el.parentElement) &&
    !(el.matches || el.matchesSelector).call(el, sel)
  );
  return el;
}

export const isInViewport = (elem) => {
  const bounding = elem && elem.getBoundingClientRect();
  return bounding && bounding.top < window.innerHeight && bounding.bottom >= 0;
};

export function serializeForm(form) {
  var obj = {};
  var formData = new FormData(form);

  for (var key of formData.keys()) {
    obj[key] = formData.get(key);
  }
  return obj;
}

export function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

export function parseTag(url) {
  const regex = /[^\/]+$/;
  return url.match(regex)[0];
}

export function getCollectionUrl(url) {
  const regex = /\/\S+\//;
  return url.match(regex)[0];
}
