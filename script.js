// Dữ liệu khởi tạo
let events = JSON.parse(localStorage.getItem("events")) || [];
let categories = JSON.parse(localStorage.getItem("categories")) || [
  { id: "default", name: "Personal" }
];
let activeCategories = new Set(categories.map(c => c.id));
let editingEventIndex = null;

// Lưu dữ liệu
function saveEvents() {
  localStorage.setItem("events", JSON.stringify(events));
}

function saveCategories() {
  localStorage.setItem("categories", JSON.stringify(categories));
}

// Gán màu cho category
function getColorForCategory(id) {
  const index = [...categories].findIndex(c => c.id === id);
  const palette = ["#6750a4", "#00796b", "#c2185b", "#f57c00", "#388e3c", "#0288d1"];
  return palette[index % palette.length];
}

// Hiển thị danh sách category trong form
function renderCategoryOptions() {
  const select = document.getElementById("categorySelect");
  select.innerHTML = "";
  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat.id;
    option.textContent = cat.name;
    select.appendChild(option);
  });
}

// Hiển thị các nút lọc category
function renderCategoryFilters() {
  const container = document.getElementById("categoryFilters");
  container.innerHTML = "";
  categories.forEach(cat => {
    const btn = document.createElement("button");
    btn.className = "filter-button";
    btn.textContent = cat.name;
    btn.style.backgroundColor = activeCategories.has(cat.id)
      ? getColorForCategory(cat.id)
      : "#e7e0ec";
    btn.style.color = activeCategories.has(cat.id) ? "#fff" : "#000";
    btn.onclick = () => {
      if (activeCategories.has(cat.id)) {
        activeCategories.delete(cat.id);
      } else {
        activeCategories.add(cat.id);
      }
      renderEvents();
      renderCategoryFilters();
    };
    container.appendChild(btn);
  });
}

// Tạo lịch theo năm
function generateCalendar(year) {
  const calendar = document.getElementById("calendar");
  calendar.innerHTML = "";

  // Tìm ngày Thứ Hai đầu tiên của năm (hoặc tuần chứa 1/1)
  let start = new Date(year, 0, 1);
  const day = start.getDay(); // 0 = CN, 1 = T2, ..., 6 = T7
  const diff = (day === 0) ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);

  // Ngày cuối cùng cần hiển thị: Chủ Nhật cuối cùng của năm
  let end = new Date(year, 11, 31);
  const endDay = end.getDay();
  const endDiff = (endDay === 0) ? 0 : 7 - endDay;
  end.setDate(end.getDate() + endDiff);

  let current = new Date(start);
  let week = 1;

  while (current <= end) {
    // Cột đầu tiên: nhãn tuần
    const weekLabel = document.createElement("div");
    weekLabel.className = "week-label";
    weekLabel.textContent = `W${week++}`;
    calendar.appendChild(weekLabel);

    // 7 ngày trong tuần
    for (let i = 0; i < 7; i++) {
      const cell = document.createElement("div");
      cell.className = "day";
      const dateStr = current.toISOString().split("T")[0];
      cell.dataset.date = dateStr;
      cell.textContent = `${current.getDate()}/${current.getMonth() + 1}`;
      const today = new Date();
      const isToday = current.toDateString() === today.toDateString();
      if (isToday) cell.classList.add("today");

      if (current.getDay() === 0 || current.getDay() === 6) {
        cell.classList.add("weekend");
      }

      if (current.getDate() === 1) {
        cell.classList.add("first-of-month");
      }

      cell.onclick = () => openEventForm(dateStr);
      calendar.appendChild(cell);
      current.setDate(current.getDate() + 1);
    }
  }

  renderEvents();
}

function renderEvents() {
  // Xoá các event cũ
  document.querySelectorAll(".day").forEach(dayCell => {
    dayCell.querySelectorAll(".event").forEach(e => e.remove());
  });

  events.forEach((e, i) => {
    if (!activeCategories.has(e.category)) return;

    const startDate = new Date(e.start);
    const endDate = new Date(e.end);

    const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

    const oneDayMs = 24 * 60 * 60 * 1000;

    if (start.getTime() === end.getTime()) {
      const dateStr = start.toISOString().split("T")[0];
      const dayCell = document.querySelector(`.day[data-date='${dateStr}']`);
      if (dayCell) {
        const div = document.createElement("div");
        div.className = "event event-single";
        div.style.backgroundColor = getColorForCategory(e.category);
        div.textContent = e.desc;
        div.onclick = (ev) => {
          ev.stopPropagation();
          openEventForm(dateStr, i);
        };
        dayCell.appendChild(div);
      }
      return;
    }

    for (let t = start.getTime(); t <= end.getTime(); t += oneDayMs) {
      const cur = new Date(t);
      const dateStr = cur.toISOString().split("T")[0];
      const dayCell = document.querySelector(`.day[data-date='${dateStr}']`);
      if (!dayCell) continue;

      const isStart = t === start.getTime();
      const isEnd = t === end.getTime();
      const className =
        isStart ? "event-start" :
        isEnd   ? "event-end"   :
                  "event-middle";

      const div = document.createElement("div");
      div.className = `event ${className}`;
      div.style.backgroundColor = getColorForCategory(e.category);
      div.textContent = e.desc;
      div.title = e.desc;
      div.onclick = (ev) => {
        ev.stopPropagation();
        openEventForm(dateStr, i);
      };

      dayCell.appendChild(div);
    }
  });
}

// Mở form tạo/sửa sự kiện
function openEventForm(dateStr, index = null) {
  const modal = document.getElementById("eventForm");
  modal.style.display = "block";

  const startInput = document.getElementById("startTime");
  const endInput = document.getElementById("endTime");
  const descInput = document.getElementById("description");
  const catSelect = document.getElementById("categorySelect");

  if (index !== null) {
    const e = events[index];
    startInput.value = e.start;
    endInput.value = e.end;
    descInput.value = e.desc;
    catSelect.value = e.category;
    editingEventIndex = index;
    document.getElementById("formTitle").textContent = "Edit Event";
    document.getElementById("saveEvent").style.display = "none";
    document.getElementById("updateEvent").style.display = "inline-block";
    document.getElementById("deleteEvent").style.display = "inline-block";
  } else {
    startInput.value = dateStr + "T09:00";
    endInput.value = dateStr + "T10:00";
    descInput.value = "";
    catSelect.value = categories[0]?.id || "default";
    editingEventIndex = null;
    document.getElementById("formTitle").textContent = "Add Event";
    document.getElementById("saveEvent").style.display = "inline-block";
    document.getElementById("updateEvent").style.display = "none";
    document.getElementById("deleteEvent").style.display = "none";
  }
}

function closeEventForm() {
  document.getElementById("eventForm").style.display = "none";
}

// Xử lý các nút trong form
document.getElementById("saveEvent").onclick = () => {
  const e = {
    start: document.getElementById("startTime").value,
    end: document.getElementById("endTime").value,
    desc: document.getElementById("description").value,
    category: document.getElementById("categorySelect").value
  };
  events.push(e);
  saveEvents();
  renderEvents();
  closeEventForm();
};

document.getElementById("updateEvent").onclick = () => {
  if (editingEventIndex === null) return;
  events[editingEventIndex] = {
    start: document.getElementById("startTime").value,
    end: document.getElementById("endTime").value,
    desc: document.getElementById("description").value,
    category: document.getElementById("categorySelect").value
  };
  saveEvents();
  renderEvents();
  closeEventForm();
};

document.getElementById("deleteEvent").onclick = () => {
  if (editingEventIndex === null) return;
  events.splice(editingEventIndex, 1);
  saveEvents();
  renderEvents();
  closeEventForm();
};

document.getElementById("closeForm").onclick = closeEventForm;

// Thêm category mới
document.getElementById("addCategoryBtn").onclick = () => {
  const name = prompt("New category name:");
  if (!name) return;
  const id = name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();
  categories.push({ id, name });
  saveCategories();
  renderCategoryOptions();
  renderCategoryFilters();
  document.getElementById("categorySelect").value = id;
};

// Đổi tên category đang chọn
document.getElementById("editCategoryBtn").onclick = () => {
  const select = document.getElementById("categorySelect");
  const selectedId = select.value;
  const cat = categories.find(c => c.id === selectedId);
  if (!cat) return;

  const newName = prompt("New category name:", cat.name);
  if (!newName || newName.trim() === "") return;

  cat.name = newName.trim();
  saveCategories();
  renderCategoryOptions();
  renderCategoryFilters();
  renderEvents();
  select.value = selectedId;
};

// Điều hướng năm
document.getElementById("loadYear").onclick = () => {
  const year = parseInt(document.getElementById("yearInput").value);
  if (!isNaN(year)) generateCalendar(year);
};

document.getElementById("goToday").onclick = () => {
  const today = new Date();
  document.getElementById("yearInput").value = today.getFullYear();
  generateCalendar(today.getFullYear());
};

// Export dữ liệu
document.getElementById("exportJson").onclick = () => {
  const data = {
    events,
    categories
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "calendar-data.json";
  a.click();
  URL.revokeObjectURL(url);
};

// Import dữ liệu
document.getElementById("importJsonBtn").onclick = () => {
  document.getElementById("importJson").click();
};

document.getElementById("importJson").onchange = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target.result);
      if (data.events) events = data.events;
      if (data.categories) categories = data.categories;
      saveEvents();
      saveCategories();
      renderCategoryOptions();
      renderCategoryFilters();
      generateCalendar(parseInt(document.getElementById("yearInput").value));
    } catch (err) {
      alert("Tệp không hợp lệ.");
    }
  };
  reader.readAsText(file);
};

document.getElementById("goToday").onclick = () => {
  const today = new Date();
  currentYear = today.getFullYear();
  generateCalendar(currentYear);

  // Cuộn đến ngày hôm nay
  const todayStr = today.toISOString().split("T")[0];
  const todayCell = document.querySelector(`.day[data-date="${todayStr}"]`);
  if (todayCell) {
    todayCell.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
  }
};

// Khởi tạo ban đầu
const now = new Date();
document.getElementById("yearInput").value = now.getFullYear();
renderCategoryOptions();
renderCategoryFilters();
generateCalendar(parseInt(document.getElementById("yearInput").value));
