// Antara muka 2D: tab pejabat, roster agent, panel detail dan gelembung teks.

const $ = id => document.getElementById(id);

// Teks "sedang buat": mod Hidup guna status dari server, mod contoh guna senarai tugas
export function nowText(a) {
  if (a.live !== undefined) return a.live ? (a.live.sedang || "—") : "Belum hantar status";
  return a.tasks[a.step];
}

export function timeAgo(iso) {
  if (!iso) return "";
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "baru sahaja";
  if (s < 3600) return `${Math.floor(s / 60)} min lalu`;
  if (s < 86400) return `${Math.floor(s / 3600)} jam lalu`;
  return `${Math.floor(s / 86400)} hari lalu`;
}

export function createUI({ offices, agents, reduceMotion, onSelect, onFilter, onClose, onDecisionDone }) {
  const roster = $("roster"), bubbles = $("bubbles"), tabs = $("tabs"), sheet = $("sheet"), dock = $("dock");
  let filter = "all";

  // Tab: "Semua" + satu tab bagi setiap pejabat
  const tabDefs = [["all", "Semua"], ...Object.entries(offices).map(([k, o]) => [k, o.short])];
  const tabButtons = {};
  for (const [f, label] of tabDefs) {
    const b = document.createElement("button"); tabButtons[f] = b;
    b.dataset.f = f; b.textContent = label; b.setAttribute("aria-pressed", f === "all");
    b.onclick = () => {
      filter = f;
      tabs.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", x === b));
      agents.forEach(a => { a.chip.hidden = !visible(a); });
      closeSheet();
      onFilter(filter);
    };
    tabs.appendChild(b);
  }

  // Roster + gelembung untuk setiap agent
  for (const a of agents) {
    const b = document.createElement("button");
    b.className = "agent" + (a.busy ? " busy" : ""); b.dataset.id = a.id; b.dataset.o = a.office;
    b.style.setProperty("--sel", a.color);
    b.innerHTML = `<span class="av"></span><span class="t"><span class="n"></span><span class="s"></span></span>`;
    const av = b.querySelector(".av"); av.style.background = a.color; av.textContent = a.name[0];
    b.querySelector(".n").textContent = a.name;
    b.querySelector(".s").textContent = nowText(a);
    b.onclick = () => onSelect(a.id, true);
    roster.appendChild(b); a.chip = b;

    const bb = document.createElement("div"); bb.className = "bubble";
    bb.innerHTML = `<b></b><span></span>`;
    bb.querySelector("b").textContent = a.name;
    bb.querySelector("span").textContent = nowText(a);
    bubbles.appendChild(bb); a.bubble = bb;

    // tanda nama kecil di atas kepala
    const tag = document.createElement("div"); tag.className = "tag";
    tag.innerHTML = `<i></i><span></span>`;
    tag.querySelector("i").style.background = a.color;
    tag.querySelector("span").textContent = a.name;
    bubbles.appendChild(tag); a.tag = tag;
  }

  let selected = null;

  function openSheet(a, fromChip) {
    selected = a;
    agents.forEach(x => x.chip.classList.toggle("on", x === a));
    $("sAv").textContent = a.name[0]; $("sAv").style.background = a.color;
    $("sName").textContent = a.name;
    $("sRole").textContent = a.role;
    $("sNow").textContent = nowText(a);
    $("sTasksWrap").hidden = a.live !== undefined;
    const ul = $("sTasks"); ul.innerHTML = ""; ul.style.setProperty("--acc", a.color);
    a.tasks.forEach(t => { const li = document.createElement("li"); li.textContent = t; ul.appendChild(li); });
    $("sOffice").textContent = "Pejabat: " + offices[a.office].short + (a.live ? ` · dikemas kini ${timeAgo(a.live.dikemaskini)}` : "");
    showDecision(a);
    sheet.classList.add("open"); dock.style.visibility = "hidden";
    if (fromChip) a.chip.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", inline: "center", block: "nearest" });
  }

  function closeSheet() {
    sheet.classList.remove("open"); dock.style.visibility = ""; selected = null;
    agents.forEach(x => x.chip.classList.remove("on"));
  }

  $("sClose").onclick = () => { closeSheet(); onClose(filter); };

  function showDecision(a) {
    $("sDecide").hidden = !a.decision;
    $("sDecideText").textContent = a.decision || "";
  }
  $("sDecideDone").onclick = () => {
    if (!selected) return;
    const a = selected; a.decision = null; refresh(a);
    if (onDecisionDone) onDecisionDone(a);
  };

  // Kemas kini paparan bila status agent berubah
  function refresh(a) {
    a.chip.classList.toggle("busy", a.busy);
    a.chip.classList.toggle("decide", !!a.decision);
    if (selected === a) showDecision(a);
    a.chip.classList.toggle("offline", a.live === null);
    a.chip.querySelector(".s").textContent = nowText(a);
    a.bubble.querySelector("span").textContent = nowText(a);
    if (selected === a) { $("sNow").textContent = nowText(a); $("sTasksWrap").hidden = a.live !== undefined; }
  }

  const visible = a => filter === "all" || a.office === filter;

  let toastT = 0;
  function toast(msg) {
    const el = $("toast"); el.textContent = msg; el.classList.add("show");
    clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove("show"), 3200);
  }

  return {
    openSheet, closeSheet, refresh, visible, toast,
    setFilter: f => { if (tabButtons[f]) tabButtons[f].click(); },
    get filter() { return filter; },
    get selected() { return selected; },
  };
}
