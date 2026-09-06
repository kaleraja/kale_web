
const USE_BACKEND_OTP = false;
const demoOtp = "3038";
const OTP_SESSION_KEY = "kale_docs_otp_verified";
let otpTimeLeft = 30;
let otpTimerHandle = null;

const otpGate = document.getElementById("otpGate");
const otpInputs = [...document.querySelectorAll("#otpInputs input")];
const otpError = document.getElementById("otpError");
const verifyOtpBtn = document.getElementById("verifyOtp");
const resendOtpBtn = document.getElementById("resendOtp");
const otpTimer = document.getElementById("otpTimer");

// function isOtpVerified() {
//   return sessionStorage.getItem(OTP_SESSION_KEY) === "1";
// }

const OTP_SESSION_KEY = "kale_docs_otp_verified";

function unlockDocs() {
  otpGate.classList.add("hidden");
  document.body.classList.remove("otp-locked");
  // sessionStorage.setItem(OTP_SESSION_KEY, "1");
}
function lockDocs() {
  sessionStorage.removeItem(OTP_SESSION_KEY);
  otpGate.classList.remove("hidden");
  clearOtpInputs();
  startOtpTimer();
  otpInputs[0]?.focus();
}
function clearOtpInputs() {
  otpInputs.forEach(input => { input.value = ""; input.classList.remove("filled"); });
  otpError.textContent = "";
}
function getOtpValue() {
  return otpInputs.map(i => i.value).join("");
}
function showOtpError(message) {
  otpError.textContent = message;
}
function startOtpTimer() {
  clearInterval(otpTimerHandle);
  otpTimeLeft = 30;
  resendOtpBtn.disabled = true;
  otpTimer.textContent = "Resend code in 00:30";
  otpTimerHandle = setInterval(() => {
    otpTimeLeft--;
    const seconds = String(otpTimeLeft).padStart(2,"0");
    otpTimer.textContent = otpTimeLeft > 0 ? `Resend code in 00:${seconds}` : "You can request a new code";
    resendOtpBtn.disabled = otpTimeLeft > 0;
    if (otpTimeLeft <= 0) clearInterval(otpTimerHandle);
  },1000);
}

otpInputs.forEach((input,index) => {
  input.addEventListener("input", () => {
    input.value = input.value.replace(/\D/g,"").slice(0,1);
    input.classList.toggle("filled", !!input.value);
    otpError.textContent = "";
    if (input.value && index < otpInputs.length-1) otpInputs[index+1].focus();
  });
  input.addEventListener("keydown", event => {
    if (event.key === "Backspace" && !input.value && index > 0) {
      otpInputs[index-1].focus();
    }
    if (event.key === "ArrowLeft" && index > 0) otpInputs[index-1].focus();
    if (event.key === "ArrowRight" && index < otpInputs.length-1) otpInputs[index+1].focus();
  });
  input.addEventListener("paste", event => {
    event.preventDefault();
    const pasted = (event.clipboardData.getData("text") || "").replace(/\D/g,"").slice(0,4);
    pasted.split("").forEach((digit,i) => {
      if (otpInputs[i]) { otpInputs[i].value=digit; otpInputs[i].classList.add("filled"); }
    });
    otpInputs[Math.min(pasted.length,4)-1]?.focus();
  });
});

async function verifyOtp() {
  const otp = getOtpValue();
  if (otp.length !== 4) {
    showOtpError("Please enter all 4 digits.");
    showToast("Enter the 4-digit verification code.");
    return;
  }

  verifyOtpBtn.disabled = true;
  verifyOtpBtn.style.opacity = ".7";

  try {
    if (USE_BACKEND_OTP) {
      const response = await fetch("/api/verify-otp", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({otp})
      });
      const result = await response.json();
      if (!response.ok || !result.verified) throw new Error("Invalid code");
    } else {
      await new Promise(resolve => setTimeout(resolve, 450));
      if (otp !== demoOtp) throw new Error("Invalid code");
    }

    unlockDocs();
  } catch {
    clearOtpInputs();
    showOtpError("Incorrect verification code. Please try again.");
    document.querySelector(".otp-card")?.classList.remove("otp-error-shake");
    void document.querySelector(".otp-card")?.offsetWidth;
    document.querySelector(".otp-card")?.classList.add("otp-error-shake");
    showToast("Verification failed — incorrect OTP.");
    otpInputs[0]?.focus();
  } finally {
    verifyOtpBtn.disabled = false;
    verifyOtpBtn.style.opacity = "1";
  }
}

verifyOtpBtn.addEventListener("click", verifyOtp);

document.getElementById("otpGate").addEventListener("keydown", event => {
  if (event.key === "Enter") {
    event.preventDefault();
    verifyOtp();
  }
});
resendOtpBtn.addEventListener("click", () => {
  clearOtpInputs();
  startOtpTimer();
  otpInputs[0]?.focus();
  showOtpError("");
  if (!USE_BACKEND_OTP) showToast("New demo OTP: 3038");
});

// if (isOtpVerified()) unlockDocs();
// else {
//   otpGate.classList.remove("hidden");
//   startOtpTimer();
//   setTimeout(() => otpInputs[0]?.focus(), 100);
// }

// Require OTP every time the page loads/reloads
otpGate.classList.remove("hidden");
startOtpTimer();

setTimeout(() => {
  otpInputs[0]?.focus();
}, 100);

document.getElementById("lockBtn")?.addEventListener("click", () => {
  lockDocs();
});




const documents = [
  {
    name: "Citizenship Certificate",
    image: "assets/images/documents/citizenship.jpg",
    category: "Personal",
    favorite: true
  },
  {
    name: "National Identity Card",
    image: "assets/images/documents/nid.jpg",
    category: "Personal",
    favorite: true
  },
  {
    name: "Permanent Account Number Card",
    image: "assets/images/documents/pan.jpg",
    category: "Personal",
    favorite: false
  },
  {
    name: "Driving License",
    image: "assets/images/documents/license.jpeg",
    category: "Personal",
    favorite: false
  }
  // ,
  
  // {
  //   name: "Tax Document",
  //   image: "assets/images/documents/tax-document.jpg",
  //   category: "Finance",
  //   favorite: false
  // },
  // {
  //   name: "Business Document",
  //   image: "assets/images/documents/business.jpg",
  //   category: "Work",
  //   favorite: false
  // }
];

const $ = s => document.querySelector(s);
const grid = $("#documentsGrid");
const empty = $("#emptyState");
const search = $("#searchInput");

let currentFilter = "All";
let filteredDocuments = [];
let viewerIndex = 0;
let zoom = 1;
let offsetX = 0;
let offsetY = 0;
let dragging = false;
let startX = 0;
let startY = 0;
let startOffsetX = 0;
let startOffsetY = 0;

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[char]));
}

function getFilteredDocuments() {
  const query = search.value.trim().toLowerCase();
  return documents.filter(doc => {
    const matchesFilter = currentFilter === "All" || doc.category === currentFilter;
    const matchesSearch =
      !query ||
      doc.name.toLowerCase().includes(query) ||
      doc.category.toLowerCase().includes(query);
    return matchesFilter && matchesSearch;
  });
}

function renderDocuments() {
  filteredDocuments = getFilteredDocuments();

  $("#resultCount").textContent =
    `${filteredDocuments.length} document${filteredDocuments.length === 1 ? "" : "s"}`;

  empty.hidden = filteredDocuments.length !== 0;

  grid.innerHTML = filteredDocuments.map((doc, index) => `
    <article class="document-card" data-index="${index}">
      <span class="card-number">${String(index + 1).padStart(2, "0")}</span>
      <img
        class="document-thumb"
        src="${doc.image}"
        alt="${escapeHTML(doc.name)}"
        loading="lazy"
        onerror="this.style.opacity='.12'"
      >
      <div class="document-info">
        <h3 class="document-title">${escapeHTML(doc.name)}</h3>
        <div class="document-meta">${escapeHTML(doc.category)} · Document Photo</div>
      </div>
      <span class="favorite ${doc.favorite ? "active" : ""}" data-favorite="${index}">
        ${doc.favorite ? "★" : "☆"}
      </span>
    </article>
  `).join("");

  grid.querySelectorAll(".document-card").forEach(card => {
    card.addEventListener("click", event => {
      if (event.target.closest("[data-favorite]")) return;
      openViewer(Number(card.dataset.index));
    });
  });

  grid.querySelectorAll("[data-favorite]").forEach(button => {
    button.addEventListener("click", event => {
      event.stopPropagation();
      const index = Number(button.dataset.favorite);
      filteredDocuments[index].favorite = !filteredDocuments[index].favorite;
      renderDocuments();
      showToast(filteredDocuments[index].favorite ? "Added to favorites ★" : "Removed from favorites");
    });
  });
}

function openViewer(index) {
  if (!filteredDocuments.length) return;
  viewerIndex = index;
  $("#viewer").classList.add("show");
  $("#viewer").setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  resetZoom();
  loadViewer();
}

function loadViewer() {
  const doc = filteredDocuments[viewerIndex];

  $("#viewerName").textContent = doc.name;
  $("#viewerCategory").textContent = `${doc.category} · Document Photo`;
  $("#viewerCounter").textContent = `${viewerIndex + 1} / ${filteredDocuments.length}`;
  $("#favoriteBtn").textContent = doc.favorite ? "★" : "☆";
  $("#favoriteBtn").style.color = doc.favorite ? "#ffc44e" : "";

  const image = $("#viewerImage");
  const loading = $("#viewerLoading");

  loading.style.display = "flex";
  image.style.opacity = "0";
  image.src = doc.image;
}

$("#viewerImage").addEventListener("load", () => {
  $("#viewerLoading").style.display = "none";
  $("#viewerImage").style.opacity = "1";
});

$("#viewerImage").addEventListener("error", () => {
  $("#viewerLoading").innerHTML = "Photo not found — check assets/images/documents/";
  $("#viewerLoading").style.display = "flex";
});

function closeViewer() {
  $("#viewer").classList.remove("show");
  $("#viewer").setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  $("#viewerImage").src = "";
}

function moveViewer(direction) {
  if (!filteredDocuments.length) return;
  viewerIndex =
    (viewerIndex + direction + filteredDocuments.length) %
    filteredDocuments.length;
  resetZoom();
  loadViewer();
}

function resetZoom() {
  zoom = 1;
  offsetX = 0;
  offsetY = 0;
  applyTransform();
}

function setZoom(value) {
  zoom = Math.max(.5, Math.min(4, value));

  if (zoom === 1) {
    offsetX = 0;
    offsetY = 0;
  }

  applyTransform();
}

function applyTransform() {
  $("#viewerImage").style.transform =
    `translate(${offsetX}px, ${offsetY}px) scale(${zoom})`;

  $("#zoomResetBtn").textContent = `${Math.round(zoom * 100)}%`;
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2400);
}

/* Search */
search.addEventListener("input", renderDocuments);

/* Category filters */
document.querySelectorAll(".filter").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach(b => b.classList.remove("active"));
    button.classList.add("active");
    currentFilter = button.dataset.filter;
    renderDocuments();
  });
});

/* Grid/list */
$("#gridView").addEventListener("click", () => {
  grid.classList.remove("list");
  $("#gridView").classList.add("active");
  $("#listView").classList.remove("active");
});

$("#listView").addEventListener("click", () => {
  grid.classList.add("list");
  $("#listView").classList.add("active");
  $("#gridView").classList.remove("active");
});

/* Viewer controls */
$("#viewerClose").addEventListener("click", closeViewer);
$("#prevBtn").addEventListener("click", () => moveViewer(-1));
$("#nextBtn").addEventListener("click", () => moveViewer(1));
$("#zoomInBtn").addEventListener("click", () => setZoom(zoom + .25));
$("#zoomOutBtn").addEventListener("click", () => setZoom(zoom - .25));
$("#zoomResetBtn").addEventListener("click", resetZoom);

$("#favoriteBtn").addEventListener("click", () => {
  const doc = filteredDocuments[viewerIndex];
  doc.favorite = !doc.favorite;
  $("#favoriteBtn").textContent = doc.favorite ? "★" : "☆";
  $("#favoriteBtn").style.color = doc.favorite ? "#ffc44e" : "";
  renderDocuments();
  showToast(doc.favorite ? "Added to favorites ★" : "Removed from favorites");
});

/* Close by clicking dark background */
$("#viewer").addEventListener("click", event => {
  if (event.target === $("#viewer")) closeViewer();
});

/* Keyboard controls */
document.addEventListener("keydown", event => {
  if (!$("#viewer").classList.contains("show")) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      search.focus();
    }
    return;
  }

  if (event.key === "Escape") closeViewer();
  else if (event.key === "ArrowLeft") moveViewer(-1);
  else if (event.key === "ArrowRight") moveViewer(1);
  else if (event.key === "+" || event.key === "=") setZoom(zoom + .25);
  else if (event.key === "-" || event.key === "_") setZoom(zoom - .25);
  else if (event.key === "0") resetZoom();
});

/* Mouse wheel zoom */
$("#viewerImage").addEventListener("wheel", event => {
  event.preventDefault();
  setZoom(zoom + (event.deltaY < 0 ? .15 : -.15));
}, { passive:false });

/* Drag image while zoomed */
$("#viewerImage").addEventListener("pointerdown", event => {
  if (zoom <= 1) return;

  dragging = true;
  $("#viewerImage").classList.add("dragging");
  startX = event.clientX;
  startY = event.clientY;
  startOffsetX = offsetX;
  startOffsetY = offsetY;
  $("#viewerImage").setPointerCapture(event.pointerId);
});

$("#viewerImage").addEventListener("pointermove", event => {
  if (!dragging) return;
  offsetX = startOffsetX + event.clientX - startX;
  offsetY = startOffsetY + event.clientY - startY;
  applyTransform();
});

function stopDragging() {
  dragging = false;
  $("#viewerImage").classList.remove("dragging");
}

$("#viewerImage").addEventListener("pointerup", stopDragging);
$("#viewerImage").addEventListener("pointercancel", stopDragging);

/* Theme button — subtle alternate background */
$("#themeBtn").addEventListener("click", () => {
  document.body.classList.toggle("soft-light");
  $("#themeBtn").textContent =
    document.body.classList.contains("soft-light") ? "☀" : "☾";
});

/* Initial render */
renderDocuments();
