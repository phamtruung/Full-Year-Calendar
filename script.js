let events = [];
let activeCategories = new Set(["work", "study", "personal"]);
const categoryColors = {};
const colorPalette = ["#2196f3", "#4caf50", "#ff9800", "#9c27b0", "#e91e63", "#795548"];
let colorIndex = 0;

function getColorForCategory(cat) {
  if (!categoryColors[cat]) {
    categoryColors[cat] = colorPalette[colorIndex % colorPalette.length];
    colorIndex++;
  }
  return categoryColors[cat];
}

function generateCalendar(year) {
  const calendar = document.getElementById("calendar");
  calendar.innerHTML = "";
  const startDate = new Date(year, 0, 1);
  let currentDate = new Date(startDate);

  // Điều chỉnh để bắt đầu từ thứ Hai
  while (currentDate.getDay() !== 1) {
    currentDate.setDate(currentDate.getDate() - 1);
  }

  for (let week = 1; week <= 53; week++) {
    const weekLabel = document.createElement("div");
    weekLabel.className = "week-label";
    weekLabel.textContent = "W " + week;
    calendar.appendChild(weekLabel);

    for (let day = 1; day <= 7; day++) {
      const dayCell = document.createElement("div");
      dayCell.className = "day";

      const dateStr = currentDate.toISOString().split("T")[0];
      dayCell.textContent = currentDate.getDate() + "/" + (currentDate.getMonth() + 1);
      dayCell.dataset.date = dateStr;

      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        dayCell.classList.add("weekend");
      }

      if (currentDate.getDate() === 1) {
        dayCell.classList.add("first-of-month");
      }

      const today = new Date();
      if (currentDate.toDateString() === today.toDateString()) {
        dayCell.classList.add("today");
      }

      dayCell.addEventListener("click", () => openEventForm(dateStr));
      calendar.appendChild(dayCell);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Dừng nếu đã vượt quá năm cần hiển thị
    if (currentDate.getFullYear() > year || (currentDate.getFullYear() === year && currentDate.getMonth() === 11 && currentDate.getDate() > 31)) {
      break;
    }
  }
}

function openEventForm(date, eventIndex = null) {
  const form = document.getElementById("eventForm");
  form.style.display = "block";
  document.getElementById("formTitle").textContent = eventIndex === null ? "New Event" : "Update Event";

  const startInput = document.getElementById("startTime");
  const endInput = document.getElementById("endTime");
  const catInput = document.getElementById("categoryInput");
  const descInput = document.getElementById("description");

  if (eventIndex === null) {
    startInput.value = date + "T09:00";
    endInput.value = date + "T10:00";
    catInput.value = "";
    descInput.value = "";

    document.getElementById("saveEvent").style.display = "inline-block";
    document.getElementById("updateEvent").style.display = "none";
    document.getElementById("deleteEvent").style.display = "none";

    document.getElementById("saveEvent").onclick = () => saveEvent();
  } else {
    const e = events[eventIndex];
    startInput.value = e.start;
    endInput.value = e.end;
    catInput.value = e.category;
    descInput.value = e.desc;

    document.getElementById("saveEvent").style.display = "none";
    document.getElementById("updateEvent").style.display = "inline-block";
    document.getElementById("deleteEvent").style.display = "inline-block";

    document.getElementById("updateEvent").onclick = () => updateEvent(eventIndex);
    document.getElementById("deleteEvent").onclick = () => deleteEvent(eventIndex);
  }

  document.getElementById("closeForm").onclick = () => form.style.display = "none";
}

function saveEvent() {
  const start = document.getElementById("startTime").value;
  const end = document.getElementById("endTime").value;
  const category = document.getElementById("categoryInput").value.trim();
  const desc = document.getElementById("description").value;

  if (!category) return;

  events.push({ start, end, category, desc });
  activeCategories.add(category);
  saveToLocalStorage();
  renderEvents();
  document.getElementById("eventForm").style.display = "none";
}

function updateEvent(index) {
  const start = document.getElementById("startTime").value;
  const end = document.getElementById("endTime").value;
  const category = document.getElementById("categoryInput").value.trim();
  const desc = document.getElementById("description").value;

  if (!category) return;

  events[index] = { start, end, category, desc };
  activeCategories.add(category);
  saveToLocalStorage();
  renderEvents();
  document.getElementById("eventForm").style.display = "none";
}

function deleteEvent(index) {
  events.splice(index, 1);
  saveToLocalStorage();
  renderEvents();
  document.getElementById("eventForm").style.display = "none";
}
function renderEvents() {
  document.querySelectorAll(".day").forEach(dayCell => {
    dayCell.querySelectorAll(".event").forEach(e => e.remove());
  });

  events.forEach((e, i) => {
    if (!activeCategories.has(e.category)) return;

    const startDate = new Date(e.start);
    const endDate = new Date(e.end);
    let current = new Date(startDate);

    while (current <= endDate) {
      const dateStr = current.toISOString().split("T")[0];
      const dayCell = document.querySelector(`.day[data-date='${dateStr}']`);
      if (dayCell) {
        const div = document.createElement("div");
        div.className = "event";
        div.style.backgroundColor = getColorForCategory(e.category);
        div.innerHTML = dateStr === startDate.toISOString().split("T")[0]
          ? `${e.desc}`
          : `${e.desc}`;
        div.onclick = (ev) => {
          ev.stopPropagation();
          openEventForm(dateStr, i);
        };
        dayCell.appendChild(div);
      }
      current.setDate(current.getDate() + 1);
    }
  });

  updateCategoryFilters();
}


function updateCategoryFilters() {
  const container = document.getElementById("categoryFilters");
  if (!container) return;
  container.innerHTML = "";

  const allCategories = [...new Set(events.map(e => e.category))];

  allCategories.forEach(cat => {
    const btn = document.createElement("button");
    btn.className = "filter-button";
    btn.textContent = cat;
    btn.style.backgroundColor = activeCategories.has(cat) ? getColorForCategory(cat) : "#fff";
    btn.style.color = activeCategories.has(cat) ? "#fff" : "#000";
    btn.style.borderColor = getColorForCategory(cat);

    btn.onclick = () => {
      if (activeCategories.has(cat)) {
        activeCategories.delete(cat);
      } else {
        activeCategories.add(cat);
      }
      renderEvents();
    };

    container.appendChild(btn);
  });
}

// Lưu và tải từ localStorage
function saveToLocalStorage() {
  localStorage.setItem("weeklyCalendarEvents", JSON.stringify(events));
}

function loadFromLocalStorage() {
  const data = localStorage.getItem("weeklyCalendarEvents");
  if (data) {
    events = JSON.parse(data);
  }
}

// Nút tải năm
document.getElementById("loadYear").onclick = () => {
  const year = parseInt(document.getElementById("yearInput").value);
  if (!isNaN(year)) {
    document.getElementById("calendar").innerHTML = "";
    generateCalendar(year);
    renderEvents();
  }
};

// Nút hôm nay
document.getElementById("goToday").onclick = () => {
  const today = new Date().toISOString().split("T")[0];
  const todayCell = document.querySelector(`.day[data-date='${today}']`);
  if (todayCell) {
    todayCell.scrollIntoView({ behavior: "smooth", block: "center" });
    todayCell.classList.add("today");
  } else {
    alert("Ngày hôm nay không nằm trong năm hiện tại.");
  }
};

// Xuất JSON
document.getElementById("exportJson").onclick = () => {
  const dataStr = JSON.stringify(events, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "lich-tuan.json";
  a.click();

  URL.revokeObjectURL(url);
};

// Nhập JSON
document.getElementById("importJsonBtn").onclick = () => {
  document.getElementById("importJson").click();
};

document.getElementById("importJson").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const imported = JSON.parse(event.target.result);
      if (Array.isArray(imported)) {
        events = imported;
        saveToLocalStorage();
        renderEvents();
        alert("Đã nhập dữ liệu thành công!");
      } else {
        alert("File không hợp lệ.");
      }
    } catch (err) {
      alert("Lỗi khi đọc file JSON.");
    }
  };
  reader.readAsText(file);
});


// Khởi tạo ban đầu
const defaultYear = parseInt(document.getElementById("yearInput").value);
generateCalendar(defaultYear);
loadFromLocalStorage();
renderEvents();
