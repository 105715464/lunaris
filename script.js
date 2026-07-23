const RULES = [
  ["Eighteen or older", "You must be 18+ with a valid government photo ID at your appointment. No exceptions, no guardian sign-offs."],
  ["Deposits hold your slot", "Consultations are free. Any booked session requires a deposit — your slot isn't confirmed until it's paid."],
  ["Arrive sober", "No alcohol or recreational drugs in the 24 hours before your session. We will reschedule you and your deposit will be forfeited."],
  ["Eat and hydrate first", "Come in rested and fed. Low blood sugar is the most common reason sessions get cut short."],
  ["One guest, if there's room", "You may bring one guest, space permitting. Kids and pets stay home."],
  ["Fifteen-minute grace period", "Arrive more than 15 minutes late and we may need to release your slot and deposit to the next client."],
  ["48-hour reschedule window", "Need to move your date? Give us 48 hours' notice and your deposit carries over. Less notice forfeits it."],
  ["Aftercare is on you", "Follow the aftercare instructions exactly. We're not responsible for reactions caused by not following them."],
  ["Lock your design early", "Final designs are set 72 hours before your session. Late changes may require a new booking."],
  ["Balance due at the chair", "The remaining balance after your deposit is due in full at the end of the session — cash, card, or tap."]
];

const PACKAGES = [
  {id:"small", name:"Small", range:"$150 – $300", hours:"1 – 2 hrs", deposit:50, recommended:false,
   items:["Palm-sized or smaller","Single session","Simple linework or shading"]},
  {id:"medium", name:"Medium", range:"$300 – $600", hours:"2 – 4 hrs", deposit:100, recommended:true,
   items:["Forearm, calf, or half-sleeve section","Usually one session","Color or detailed blackwork"]},
  {id:"large", name:"Large / day rate", range:"$900 / day", hours:"4+ hrs", deposit:200, recommended:false,
   items:["Full sleeve, back piece, multi-session","Booked as day-rate blocks","Custom design consult included"]}
];

function renderRules(){
  const c = document.getElementById("rules-container");
  c.innerHTML = RULES.map((r,i)=>`
    <div class="rule-row">
      <div class="rule-num">${String(i+1).padStart(2,"0")}</div>
      <div><h3>${r[0]}</h3><p>${r[1]}</p></div>
    </div>`).join("");
}

function renderPricing(){
  const g = document.getElementById("price-grid");
  g.innerHTML = PACKAGES.map(p=>`
    <div class="price-card ${p.recommended?'rec':''}">
      ${p.recommended?'<span class="badge">Most booked</span>':''}
      <h3>${p.name}</h3>
      <div class="range mono">${p.range}</div>
      <p class="hours">${p.hours}</p>
      <ul>${p.items.map(i=>`<li>${i}</li>`).join("")}</ul>
      <div class="deposit-tag">Deposit to book: $${p.deposit}</div>
    </div>`).join("");
}

function renderSizeOptions(){
  const c = document.getElementById("size-options");
  c.innerHTML = PACKAGES.map(p=>`
    <button type="button" class="size-opt" data-id="${p.id}">
      <strong>${p.name}</strong>
      <span>Deposit $${p.deposit}</span>
    </button>`).join("");
  c.querySelectorAll(".size-opt").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      c.querySelectorAll(".size-opt").forEach(b=>b.classList.remove("selected"));
      btn.classList.add("selected");
      state.packageId = btn.dataset.id;
      updateTicket();
      validateForm();
    });
  });
}

const state = { packageId: null };

function getSelectedPackage(){
  return PACKAGES.find(p=>p.id===state.packageId) || null;
}

function updateTicket(){
  const pkg = getSelectedPackage();
  const name = document.getElementById("f-name").value.trim();
  const artist = document.getElementById("f-artist").value;
  const date = document.getElementById("f-date").value;
  const time = document.getElementById("f-time").value;

  document.getElementById("t-name").textContent = name || "Your booking";
  document.getElementById("t-artist").textContent = artist || "No preference";
  document.getElementById("t-size").textContent = pkg ? pkg.name : "—";
  document.getElementById("t-date").textContent = date ? formatDate(date) : "—";
  document.getElementById("t-time").textContent = time ? formatTime(time) : "—";
  document.getElementById("t-deposit").textContent = pkg ? `$${pkg.deposit}` : "$0";
}

function formatDate(iso){
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"});
}
function formatTime(t){
  const [h,m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = ((h+11)%12)+1;
  return `${h12}:${String(m).padStart(2,"0")} ${period}`;
}

function validateForm(){
  const required = ["f-name","f-email","f-phone","f-artist","f-date","f-time"];
  const filled = required.every(id => document.getElementById(id).value.trim() !== "");
  document.getElementById("submit-btn").disabled = !(filled && state.packageId);
}

["f-name","f-email","f-phone","f-artist","f-date","f-time","f-desc"].forEach(id=>{
  document.getElementById(id).addEventListener("input", ()=>{ updateTicket(); validateForm(); });
  document.getElementById(id).addEventListener("change", ()=>{ updateTicket(); validateForm(); });
});

function genCode(){
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "WI-";
  for(let i=0;i<6;i++) s += chars[Math.floor(Math.random()*chars.length)];
  return s;
}

const STORAGE_KEY = "wraithiron_bookings";

function getBookingsStore(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  }catch(e){ return {}; }
}
function saveBookingsStore(store){
  try{
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    return true;
  }catch(e){
    console.error("localStorage write failed", e);
    return false;
  }
}

function loadBookings(){
  const store = getBookingsStore();
  const bookings = Object.values(store);
  bookings.sort((a,b)=> new Date(a.date+"T"+a.time) - new Date(b.date+"T"+b.time));
  renderBookingsList(bookings);
}

function statusTag(status){
  if(status === "paid") return '<span class="paid-tag">paid</span>';
  if(status === "pending_verification") return '<span class="pending-tag">pending</span>';
  return "";
}

function renderBookingsList(bookings){
  const el = document.getElementById("my-bookings-list");
  if(bookings.length===0){
    el.innerHTML = '<p class="empty-state">No bookings yet — reserve a slot above and it\'ll show up here.</p>';
    return;
  }
  el.innerHTML = bookings.map(b=>`
    <div class="booking-item" data-code="${b.code}">
      <div class="info">
        <strong>${b.size} session &middot; ${formatDate(b.date)} at ${formatTime(b.time)}</strong>
        ${b.artist} &middot; deposit $${b.deposit} &middot; <span class="code">${b.code}</span>${statusTag(b.status)}
      </div>
      <button class="cancel-link" data-code="${b.code}">Cancel</button>
    </div>`).join("");
  el.querySelectorAll(".cancel-link").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const store = getBookingsStore();
      delete store[btn.dataset.code];
      saveBookingsStore(store);
      loadBookings();
    });
  });
}

function removeVietnameseTones(str){
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
}

// ĐIỀN THÔNG TIN NGÂN HÀNG THẬT CỦA BẠN VÀO ĐÂY.
// Mã ngân hàng (bankCode) lấy tại danh sách: https://api.vietqr.io/v2/banks
// Ví dụ: vietcombank, techcombank, mbbank, tpbank, acb, bidv, vietinbank, agribank...
const BANK_CONFIG = {
  bankCode: "tpbank",
  accountNo: "13029847666",
  accountName: "VU LE VY THAO"
};

function buildVietQrUrl(amountVND, note){
  const encodedNote = encodeURIComponent(note);
  const encodedName = encodeURIComponent(BANK_CONFIG.accountName);
  return `https://img.vietqr.io/image/${BANK_CONFIG.bankCode}-${BANK_CONFIG.accountNo}-compact2.png?amount=${amountVND}&addInfo=${encodedNote}&accountName=${encodedName}`;
}

function updateMomoPanel(code, depositUSD){
  const depositVND = depositUSD * 25000;
  const amountText = depositVND.toLocaleString("vi-VN") + " đ";
  document.getElementById("momo-amount").textContent = amountText;
  document.getElementById("momo-amount-2").textContent = amountText;
  const note = removeVietnameseTones(`${code} dat coc lich hen`);
  document.getElementById("momo-note").textContent = note;
  document.getElementById("momo-qr-img").src = buildVietQrUrl(depositVND, note);
  document.getElementById("momo-panel").classList.add("show");
  document.getElementById("momo-confirm-btn").disabled = false;
  document.getElementById("momo-confirm-btn").textContent = "Tôi đã chuyển khoản";
  document.getElementById("momo-status").classList.remove("show");
}

document.getElementById("momo-copy-btn").addEventListener("click", ()=>{
  const note = document.getElementById("momo-note").textContent;
  navigator.clipboard.writeText(note).then(()=>{
    const btn = document.getElementById("momo-copy-btn");
    const original = btn.textContent;
    btn.textContent = "Copied";
    setTimeout(()=>{ btn.textContent = original; }, 1500);
  }).catch(()=>{});
});

let currentBookingCode = null;

document.getElementById("momo-confirm-btn").addEventListener("click", ()=>{
  if(!currentBookingCode) return;
  const store = getBookingsStore();
  if(store[currentBookingCode]){
    store[currentBookingCode].status = "pending_verification";
    saveBookingsStore(store);
    loadBookings();
  }
  document.getElementById("momo-confirm-btn").disabled = true;
  document.getElementById("momo-confirm-btn").textContent = "Đã ghi nhận";
  document.getElementById("momo-status").classList.add("show");
  document.getElementById("ticket-seal").style.display = "block";
  document.getElementById("ticket-seal").textContent = "PENDING VERIFICATION";
});

document.getElementById("booking-form").addEventListener("submit", (e)=>{
  e.preventDefault();
  const pkg = getSelectedPackage();
  if(!pkg) return;
  const code = genCode();
  const booking = {
    code,
    name: document.getElementById("f-name").value.trim(),
    email: document.getElementById("f-email").value.trim(),
    phone: document.getElementById("f-phone").value.trim(),
    artist: document.getElementById("f-artist").value || "No preference",
    size: pkg.name,
    deposit: pkg.deposit,
    date: document.getElementById("f-date").value,
    time: document.getElementById("f-time").value,
    desc: document.getElementById("f-desc").value.trim(),
    status: "awaiting_deposit"
  };
  const submitBtn = document.getElementById("submit-btn");
  submitBtn.disabled = true;
  submitBtn.textContent = "Securing...";

  const store = getBookingsStore();
  store[code] = booking;
  const ok = saveBookingsStore(store);

  if(ok){
    currentBookingCode = code;
    document.getElementById("t-code").textContent = code;
    document.getElementById("ticket-seal").style.display = "none";
    submitBtn.textContent = "Slot reserved";
    loadBookings();
    updateMomoPanel(code, pkg.deposit);
    document.getElementById("booking-form").reset();
    document.querySelectorAll(".size-opt").forEach(b=>b.classList.remove("selected"));
    state.packageId = null;
    setTimeout(()=>{
      submitBtn.textContent = "Secure my slot";
      updateTicket();
      validateForm();
    }, 1800);
  }else{
    submitBtn.textContent = "Try again";
    submitBtn.disabled = false;
  }
});

document.querySelectorAll(".tab-btn").forEach(btn=>{
  btn.addEventListener("click", ()=> goToPage(btn.dataset.page));
});
document.querySelectorAll("[data-goto]").forEach(btn=>{
  btn.addEventListener("click", ()=> goToPage(btn.dataset.goto));
});

function goToPage(page){
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
  document.getElementById("page-"+page).classList.add("active");
  document.querySelectorAll(".tab-btn").forEach(b=>b.classList.toggle("active", b.dataset.page===page));
  window.scrollTo({top:0, behavior:"smooth"});
}

renderRules();
renderPricing();
renderSizeOptions();
loadBookings();
const today = new Date();
document.getElementById("f-date").min = today.toISOString().split("T")[0];