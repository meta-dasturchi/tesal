/* RASMLAR VA NARXLAR
   Har bir avtomobilning image va price qiymatini shu yerda o'zgartiring.
   Saytdagi "URL orqali o'zgartirish" paneli ham shu ma'lumotni yangilaydi
   va brauzer xotirasida saqlaydi.
   3D model: DEFAULT_MODEL_URL ni o'z .glb havolangizga almashtiring.
*/
const DEFAULT_MODEL_URL =
  "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/ToyCar/glTF-Binary/ToyCar.glb";

const ALT_MODEL_URL =
  "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/CarConcept/glTF-Binary/CarConcept.glb";

const img = (file, height) =>
  `https://digitalassets.tesla.com/tesla-contents/image/upload/h_${height},w_2800,c_fit,f_auto,q_auto:best/${file}`;

const DEFAULT_CARS = [
  {
    id: "model-3",
    name: "Model 3",
    tag: "Sedan",
    price: 36990,
    range: "363 mil",
    accel: "5.8 s",
    drive: "Orqa g'ildirak",
    status: "Buyurtma ochiq",
    image: img("Homepage-Model-3-Desktop-US", 1600)
  },
  {
    id: "model-y",
    name: "Model Y",
    tag: "SUV",
    price: 39990,
    range: "321 mil",
    accel: "5.4 s",
    drive: "Orqa g'ildirak",
    status: "Buyurtma ochiq",
    image: img("Homepage-Model-Y-Desktop-US", 1600)
  },
  {
    id: "model-3-performance",
    name: "Model 3 Performance",
    tag: "Sedan",
    price: 54990,
    range: "303 mil",
    accel: "2.9 s",
    drive: "To'liq g'ildirak",
    status: "Buyurtma ochiq",
    image: img("Model-3-Performance-Hero-Desktop", 1600)
  },
  {
    id: "model-s",
    name: "Model S",
    tag: "Sedan",
    price: 109990,
    range: "402 mil",
    accel: "3.1 s",
    drive: "To'liq g'ildirak",
    status: "Ishlab chiqarish yakunlangan",
    image: img("Homepage-Model-S-Desktop-LHD", 1800)
  },
  {
    id: "model-x",
    name: "Model X",
    tag: "SUV",
    price: 114990,
    range: "335 mil",
    accel: "3.8 s",
    drive: "To'liq g'ildirak",
    status: "Ishlab chiqarish yakunlangan",
    image: img("Homepage-Model-X-Desktop-LHD", 1800)
  },
  {
    id: "cybertruck",
    name: "Cybertruck Cyberbeast",
    tag: "Pikap",
    price: 109990,
    range: "320 mil",
    accel: "2.6 s",
    drive: "Uch motor",
    status: "Buyurtma ochiq",
    image: img("Homepage-Cybertruck-Desktop", 1800)
  },
  {
    id: "cybercab",
    name: "Cybercab",
    tag: "Robotaksi",
    price: null,
    range: "E'lon qilinadi",
    accel: "Avtonom",
    drive: "Elektr",
    status: "Narx e'lon qilinmagan",
    image: img("Cybercab-Hero-Desktop", 1600)
  },
  {
    id: "roadster",
    name: "Roadster",
    tag: "Sport",
    price: 200000,
    range: "620 mil (maqsad)",
    accel: "1.9 s (maqsad)",
    drive: "To'liq g'ildirak",
    status: "Oldindan e'lon qilingan",
    image: img("Roadster-Social", 1400)
  }
];

const PAINTS = [
  { id: "white", name: "Oq", add: 0 },
  { id: "grey", name: "Stealth Grey", add: 2000 },
  { id: "black", name: "Qora", add: 1500 },
  { id: "red", name: "Qizil", add: 2000 },
  { id: "blue", name: "Ko'k", add: 1500 }
];

const WHEELS = [
  { id: "18", name: '18"', add: 0 },
  { id: "19", name: '19"', add: 1500 },
  { id: "20", name: '20"', add: 2500 }
];

const CONFIG_KEY = "tesla-site-config-v1";
const MESSAGES_KEY = "tesla-site-messages-v1";

const $ = (id) => document.getElementById(id);

let cars = [];
let slide = 0;
let timer = null;
let editorLock = false;

function loadConfig() {
  try {
    return JSON.parse(localStorage.getItem(CONFIG_KEY)) || {};
  } catch {
    return {};
  }
}

function saveConfig(partial) {
  const next = { ...loadConfig(), ...partial };
  localStorage.setItem(CONFIG_KEY, JSON.stringify(next));
}

function money(value) {
  if (value === null || value === undefined || value === "") return "E'lon qilinmagan";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(Number(value));
}

function readCars() {
  const saved = loadConfig().cars || {};
  cars = DEFAULT_CARS.map((car) => {
    const extra = saved[car.id] || {};
    return {
      ...car,
      image: extra.image || car.image,
      price: extra.price === undefined ? car.price : extra.price,
      modelUrl: extra.modelUrl || ""
    };
  });
}

function placeholder(name) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='700'><rect fill='%23111111' width='100%' height='100%'/><text x='50%' y='50%' fill='white' font-size='42' text-anchor='middle' font-family='Arial'>${name}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function toast(text) {
  const node = $("toast");
  node.textContent = text;
  node.classList.add("is-on");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => node.classList.remove("is-on"), 2400);
}

function fillSelect(select, items, getValue, getLabel) {
  const current = select.value;
  select.innerHTML = "";
  items.forEach((item) => {
    const option = document.createElement("option");
    option.value = getValue(item);
    option.textContent = getLabel(item);
    select.appendChild(option);
  });
  if ([...select.options].some((option) => option.value === current)) {
    select.value = current;
  }
}

function renderModels() {
  const grid = $("modelGrid");
  grid.innerHTML = "";
  cars.forEach((car, index) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "model-card";
    card.innerHTML = `
      <img alt="${car.name}" src="${car.image}" />
      <div>
        <strong>${car.name}</strong>
        <span>${money(car.price)} · ${car.tag}</span>
      </div>`;
    card.querySelector("img").addEventListener("error", (event) => {
      event.currentTarget.src = placeholder(car.name);
    });
    card.addEventListener("click", () => {
      goTo(index);
      document.getElementById("karusel").scrollIntoView();
    });
    grid.appendChild(card);
  });
}

function renderSlide() {
  const car = cars[slide];
  const image = $("slideImage");
  image.classList.add("is-fading");
  window.setTimeout(() => {
    image.src = car.image;
    image.alt = car.name;
    image.classList.remove("is-fading");
  }, 180);
  $("slideTag").textContent = car.tag;
  $("slideName").textContent = car.name;
  $("slidePrice").textContent = money(car.price);
  $("slideStatus").textContent = car.status;
  $("slideSpecs").innerHTML = [car.range, `0–60: ${car.accel}`, car.drive]
    .map((item) => `<li>${item}</li>`)
    .join("");
  [...$("dots").children].forEach((dot, index) => {
    dot.classList.toggle("is-active", index === slide);
    dot.setAttribute("aria-selected", index === slide ? "true" : "false");
  });
  if (!editorLock) syncEditor();
}

function renderDots() {
  const dots = $("dots");
  dots.innerHTML = "";
  cars.forEach((car, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.setAttribute("role", "tab");
    dot.setAttribute("aria-label", car.name);
    dot.addEventListener("click", () => goTo(index));
    dots.appendChild(dot);
  });
}

function goTo(index) {
  slide = (index + cars.length) % cars.length;
  renderSlide();
  restartAuto();
}

function restartAuto() {
  clearInterval(timer);
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  timer = setInterval(() => goTo(slide + 1), 4500);
}

function syncEditor() {
  const car = cars[slide];
  if (!car) return;
  $("editCar").value = car.id;
  $("editImage").value = car.image;
  $("editPrice").value = car.price === null || car.price === undefined ? "" : car.price;
  $("editModel").value = car.modelUrl || "";
}

function renderChoices() {
  const label = (car) => `${car.name} — ${money(car.price)}`;
  fillSelect($("editCar"), cars, (car) => car.id, label);
  $("editCar").value = cars[slide].id;
  fillSelect($("orderCar"), cars, (car) => car.id, label);
  fillSelect($("contactCar"), cars, (car) => car.id, (car) => car.name);
  fillSelect($("orderPaint"), PAINTS, (item) => item.id, (item) => `${item.name} (+${money(item.add)})`);
  fillSelect($("orderWheel"), WHEELS, (item) => item.id, (item) => `${item.name} (+${money(item.add)})`);
  updateOrder();
  syncEditor();
}

function selectedCar(id) {
  return cars.find((car) => car.id === id) || cars[0];
}

function updateOrder() {
  const car = selectedCar($("orderCar").value);
  const paint = PAINTS.find((item) => item.id === $("orderPaint").value) || PAINTS[0];
  const wheel = WHEELS.find((item) => item.id === $("orderWheel").value) || WHEELS[0];
  const total = car.price === null ? null : Number(car.price) + paint.add + wheel.add;
  $("orderTotal").textContent = money(total);
  $("orderSummary").textContent = `${car.name}, ${paint.name}, ${wheel.name}. ${car.status}.`;
}

function readMessages() {
  try {
    return JSON.parse(localStorage.getItem(MESSAGES_KEY)) || [];
  } catch {
    return [];
  }
}

function writeMessages(list) {
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(list));
  renderInbox();
}

function renderInbox() {
  const list = $("inboxList");
  const items = readMessages();
  if (!items.length) {
    list.innerHTML = "<li class='inbox-item'>Hali xabar yo‘q.</li>";
    return;
  }
  list.innerHTML = "";
  items.forEach((item) => {
    const li = document.createElement("li");
    li.className = "inbox-item";
    li.innerHTML = `
      <strong>${item.kind === "order" ? "Buyurtma" : "Xabar"} · ${item.name}</strong>
      <p>${item.text}</p>
      <small>${item.email} · ${item.phone}<br />${item.when}</small>`;
    list.appendChild(li);
  });
}

function storeMessage(entry) {
  const items = readMessages();
  items.unshift({
    ...entry,
    when: new Date().toLocaleString("uz-UZ")
  });
  writeMessages(items.slice(0, 12));
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validPhone(value) {
  return (value.match(/\d/g) || []).length >= 7;
}

function setError(id, text) {
  $(id).textContent = text;
}

function clearContactErrors() {
  ["errName", "errEmail", "errPhone", "errMessage"].forEach((id) => setError(id, ""));
}

function applyModel(url, title) {
  const viewer = $("carViewer");
  $("viewerStatus").textContent = "3D model yuklanmoqda…";
  $("viewerStatus").hidden = false;
  viewer.setAttribute("src", url);
  $("studioTitle").textContent = title || "3D model";
  $("modelUrl").value = url;
}

function openStudio(car) {
  const url = car.modelUrl || loadConfig().modelUrl || DEFAULT_MODEL_URL;
  applyModel(url, car.name);
  document.getElementById("studiya").scrollIntoView();
}

function bindNav() {
  const header = $("header");
  const toggle = $("menuToggle");
  const nav = $("siteNav");
  const onScroll = () => header.classList.toggle("is-solid", window.scrollY > 12);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });

  const links = [...document.querySelectorAll(".nav-link")];
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((link) => {
          link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`);
        });
      });
    },
    { rootMargin: "-45% 0px -45% 0px", threshold: 0.01 }
  );
  links.forEach((link) => {
    const section = document.querySelector(link.getAttribute("href"));
    if (section) observer.observe(section);
  });
}

function bindCarousel() {
  $("prevSlide").addEventListener("click", () => goTo(slide - 1));
  $("nextSlide").addEventListener("click", () => goTo(slide + 1));
  $("slideStudio").addEventListener("click", () => openStudio(cars[slide]));
  $("slideOrder").addEventListener("click", () => {
    $("orderCar").value = cars[slide].id;
    $("contactCar").value = cars[slide].id;
    updateOrder();
  });

  const node = $("carousel");
  node.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") goTo(slide + 1);
    if (event.key === "ArrowLeft") goTo(slide - 1);
  });
  node.addEventListener("mouseenter", () => clearInterval(timer));
  node.addEventListener("mouseleave", restartAuto);
  node.addEventListener("focusin", () => clearInterval(timer));
  node.addEventListener("focusout", restartAuto);
  $("editor").addEventListener("focusin", () => clearInterval(timer));
  $("editor").addEventListener("focusout", (event) => {
    if (!$("editor").contains(event.relatedTarget)) restartAuto();
  });

  let startX = null;
  node.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button, a")) return;
    startX = event.clientX;
  });
  node.addEventListener("pointerup", (event) => {
    if (startX === null) return;
    const delta = event.clientX - startX;
    if (Math.abs(delta) > 50) goTo(slide + (delta < 0 ? 1 : -1));
    startX = null;
  });

  $("slideImage").addEventListener("error", () => {
    $("slideImage").src = placeholder(cars[slide].name);
  });
}

function bindEditor() {
  $("editCar").addEventListener("change", () => {
    editorLock = true;
    const index = cars.findIndex((car) => car.id === $("editCar").value);
    goTo(index);
    editorLock = false;
    syncEditor();
  });

  $("editor").addEventListener("submit", (event) => {
    event.preventDefault();
    const id = $("editCar").value;
    const image = $("editImage").value.trim();
    const priceRaw = $("editPrice").value.trim();
    const modelUrl = $("editModel").value.trim();
    if (!/^https?:\/\//i.test(image)) {
      $("editorNote").textContent = "Rasm URL http yoki https bilan boshlanishi kerak.";
      return;
    }
    if (modelUrl && !/^https?:\/\//i.test(modelUrl)) {
      $("editorNote").textContent = "3D URL http yoki https bilan boshlanishi kerak.";
      return;
    }
    const price = priceRaw === "" ? null : Number(priceRaw);
    if (price !== null && (!Number.isFinite(price) || price < 0)) {
      $("editorNote").textContent = "Narx musbat son bo‘lsin yoki bo‘sh qolsin.";
      return;
    }
    const saved = loadConfig().cars || {};
    saved[id] = { image, price, modelUrl };
    saveConfig({ cars: saved });
    const index = cars.findIndex((car) => car.id === id);
    readCars();
    renderModels();
    renderChoices();
    goTo(index);
    $("editorNote").textContent = "Saqlandi. Karusel, katalog va buyurtma yangilandi.";
    toast("Rasm va narx yangilandi");
  });

  $("resetConfig").addEventListener("click", () => {
    localStorage.removeItem(CONFIG_KEY);
    readCars();
    renderModels();
    renderDots();
    renderChoices();
    goTo(0);
    applyModel(DEFAULT_MODEL_URL, "Namunaviy model");
    $("editorNote").textContent = "Asl rasmlar, narxlar va 3D model qaytarildi.";
    toast("Asl sozlama qaytdi");
  });
}

function bindStudio() {
  const viewer = $("carViewer");
  const savedUrl = loadConfig().modelUrl;
  if (savedUrl) applyModel(savedUrl, "Saqlangan model");

  const hideStatus = () => {
    $("viewerStatus").textContent = "Aylantirishga tayyor";
    setTimeout(() => {
      $("viewerStatus").hidden = true;
    }, 1200);
  };
  viewer.addEventListener("load", hideStatus);
  viewer.addEventListener("error", () => {
    $("viewerStatus").hidden = false;
    $("viewerStatus").textContent = "Model ochilmadi. .glb havolasini tekshiring.";
  });

  $("toggleSpin").addEventListener("click", () => {
    const spinning = viewer.hasAttribute("auto-rotate");
    if (spinning) viewer.removeAttribute("auto-rotate");
    else viewer.setAttribute("auto-rotate", "");
    $("toggleSpin").textContent = spinning ? "Aylanishni yoqish" : "Aylanishni to‘xtatish";
  });

  $("resetCam").addEventListener("click", () => {
    viewer.cameraOrbit = "30deg 70deg 105%";
    viewer.fieldOfView = "auto";
    toast("Kamera tiklandi");
  });

  $("modelForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const url = $("modelUrl").value.trim();
    if (!/^https?:\/\//i.test(url) || !/\.glb(\?|#|$)/i.test(url)) {
      $("modelNote").textContent = "Havola https bilan boshlanib, .glb faylga olib borsin.";
      return;
    }
    saveConfig({ modelUrl: url });
    applyModel(url, "Yuklangan model");
    $("modelNote").textContent = "Model yuklanmoqda. Sichqoncha bilan har tomonga aylantiring.";
  });

  $("modelUrl").value = savedUrl || DEFAULT_MODEL_URL;
  $("modelUrl").placeholder = ALT_MODEL_URL;
}

function bindTabs() {
  const tabs = [...document.querySelectorAll(".tab")];
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((item) => {
        const on = item === tab;
        item.classList.toggle("is-active", on);
        item.setAttribute("aria-selected", on ? "true" : "false");
        const panel = document.getElementById(`panel-${item.dataset.tab}`);
        panel.classList.toggle("is-active", on);
        panel.hidden = !on;
      });
    });
  });
}

function bindOrder() {
  ["orderCar", "orderPaint", "orderWheel"].forEach((id) => {
    $(id).addEventListener("change", updateOrder);
  });
  $("orderForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const name = $("orderName").value.trim();
    const email = $("orderEmail").value.trim();
    const phone = $("orderPhone").value.trim();
    if (name.length < 2 || !validEmail(email) || !validPhone(phone)) {
      $("orderNote").textContent = "Ism, email va kamida 7 raqamli telefonni to‘ldiring.";
      return;
    }
    const car = selectedCar($("orderCar").value);
    storeMessage({
      kind: "order",
      name,
      email,
      phone,
      text: `${$("orderSummary").textContent} Jami: ${$("orderTotal").textContent}.`
    });
    $("orderNote").textContent = `${car.name} buyurtmasi saqlandi. Aloqa bo‘limidagi ro‘yxatda turibdi.`;
    $("orderForm").reset();
    renderChoices();
    toast("Buyurtma saqlandi");
    document.getElementById("aloqa").scrollIntoView();
  });
}

function bindContact() {
  $("contactForm").addEventListener("submit", (event) => {
    event.preventDefault();
    clearContactErrors();
    const name = $("contactName").value.trim();
    const email = $("contactEmail").value.trim();
    const phone = $("contactPhone").value.trim();
    const message = $("contactMessage").value.trim();
    let ok = true;
    if (name.length < 2) {
      setError("errName", "Ism kamida 2 harf bo‘lsin.");
      ok = false;
    }
    if (!validEmail(email)) {
      setError("errEmail", "Email noto‘g‘ri.");
      ok = false;
    }
    if (!validPhone(phone)) {
      setError("errPhone", "Telefonda kamida 7 ta raqam bo‘lsin.");
      ok = false;
    }
    if (message.length < 10) {
      setError("errMessage", "Xabar kamida 10 ta belgi bo‘lsin.");
      ok = false;
    }
    if (!ok) {
      $("contactNote").textContent = "Maydonlarni to‘g‘rilang.";
      return;
    }
    const car = selectedCar($("contactCar").value);
    storeMessage({
      kind: "contact",
      name,
      email,
      phone,
      text: `${car.name}: ${message}`
    });
    $("contactForm").reset();
    renderChoices();
    $("contactNote").textContent = "Xabar qabul qilindi.";
    toast("Xabar yuborildi");
  });

  $("clearInbox").addEventListener("click", () => {
    writeMessages([]);
    toast("Ro‘yxat tozalandi");
  });
}

function init() {
  readCars();
  bindNav();
  renderDots();
  renderModels();
  renderChoices();
  renderSlide();
  restartAuto();
  bindCarousel();
  bindEditor();
  bindStudio();
  bindTabs();
  bindOrder();
  bindContact();
  renderInbox();
}

init();
