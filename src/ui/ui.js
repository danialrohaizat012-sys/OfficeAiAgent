// Antara muka 2D: tab pejabat, roster agent, panel detail dan gelembung teks.

const $ = id => document.getElementById(id);

export function createUI({ offices, agents, reduceMotion, onSelect, onFilter, onClose, onDecisionDone }) {
  const roster = $("roster"), bubbles = $("bubbles"), tabs = $("tabs"), sheet = $("sheet"), dock = $("dock");
  let filter = "all";

  // Tab: "Semua" + satu tab bagi setiap pejabat
  const tabDefs = [["all", "Semua"], ...Object.entries(offices).map(([k, o]) => [k, o.short])];
  for (const [f, label] of tabDefs) {
    const b = document.createElement("button");
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
    b.querySelector(".s").textContent = a.tasks[a.step];
    b.onclick = () => onSelect(a.id, true);
    roster.appendChild(b); a.chip = b;

    const bb = document.createElement("div"); bb.className = "bubble";
    bb.innerHTML = `<b></b><span></span>`;
    bb.querySelector("b").textContent = a.name;
    bb.querySelector("span").textContent = a.tasks[a.step];
    bubbles.appendChild(bb); a.bubble = bb;
  }

  let selected = null;

  function openSheet(a, fromChip) {
    selected = a;
    agents.forEach(x => x.chip.classList.toggle("on", x === a));
    $("sAv").textContent = a.name[0]; $("sAv").style.background = a.color;
    $("sName").textContent = a.name;
    $("sRole").textContent = a.role;
    $("sNow").textContent = a.tasks[a.step];
    const ul = $("sTasks"); ul.innerHTML = ""; ul.style.setProperty("--acc", a.color);
    a.tasks.forEach(t => { const li = document.createElement("li"); li.textContent = t; ul.appendChild(li); });
    $("sOffice").textContent = "Pejabat: " + offices[a.office].short;
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
    a.chip.querySelector(".s").textContent = a.tasks[a.step];
    a.bubble.querySelector("span").textContent = a.tasks[a.step];
    if (selected === a) $("sNow").textContent = a.tasks[a.step];
  }

  const visible = a => filter === "all" || a.office === filter;

  let toastT = 0;
  function toast(msg) {
    const el = $("toast"); el.textContent = msg; el.classList.add("show");
    clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove("show"), 3200);
  }

  return {
    openSheet, closeSheet, refresh, visible, toast,
    get filter() { return filter; },
    get selected() { return selected; },
  };
}
