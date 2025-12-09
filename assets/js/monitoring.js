// =============================
// MONITORING - FIREBASE INTEGRATED (COMPLETE FIX)
// =============================
(function () {
  "use strict";

  let currentPageMonitoring = 1;
  const itemsPerPageMonitoring = 10;
  let monitoringData = [];
  let filteredData = [];
  let currentTab = "masuk";
  let unsubscribeMasuk = null;
  let unsubscribeKeluar = null;
  let unsubscribeNotaDinas = null;
  let selectedDate = null;
  let currentMonth = new Date().getMonth();
  let currentYear = new Date().getFullYear();

  // =============================
  // INITIALIZATION
  // =============================
  window.initializePage = function () {
    console.log("📊 Monitoring Page Initialized (COMPLETE VERSION)");

    // Wait for auth to be ready
    const initInterval = setInterval(() => {
      if (typeof checkUserRole === "function" && window.db) {
        clearInterval(initInterval);

        checkUserRole(["admin"])
          .then((userData) => {
            console.log("✅ User authenticated:", userData);

            // Setup real-time listeners
            setupRealtimeMonitoring();

            // Setup filters & calendar
            setupMonitoringFilters();
            setupCalendar();
          })
          .catch((error) => {
            console.error("❌ Access denied:", error);
          });
      }
    }, 100);
  };

  // =============================
  // REAL-TIME MONITORING SETUP
  // =============================
  function setupRealtimeMonitoring() {
    console.log("🔄 Setting up real-time monitoring...");

    if (unsubscribeMasuk) unsubscribeMasuk();
    unsubscribeMasuk = db
      .collection("surat_masuk")
      .where("isDeleted", "==", false)
      .onSnapshot((snapshot) => {
        console.log("📨 Surat Masuk snapshot:", snapshot.size);
        loadMonitoringData();
      });

    if (unsubscribeKeluar) unsubscribeKeluar();
    unsubscribeKeluar = db
      .collection("surat_keluar")
      .where("isDeleted", "==", false)
      .onSnapshot((snapshot) => {
        console.log("📤 Surat Keluar snapshot:", snapshot.size);
        loadMonitoringData();
      });

    if (unsubscribeNotaDinas) unsubscribeNotaDinas();
    unsubscribeNotaDinas = db
      .collection("nota_dinas")
      .where("isDeleted", "==", false)
      .onSnapshot((snapshot) => {
        console.log("📝 Nota Dinas snapshot:", snapshot.size);
        loadMonitoringData();
      });
  }

  // =============================
  // LOAD DATA FROM FIREBASE
  // =============================
  window.loadMonitoringData = function () {
    const tableBody = document.getElementById("monitoringTableBody");
    if (!tableBody) {
      console.error("❌ Table body not found!");
      return;
    }

    console.log("🔄 Loading monitoring data...");
    tableBody.innerHTML =
      '<tr><td colspan="7" style="text-align: center; padding: 20px;">Loading...</td></tr>';

    Promise.all([
      db.collection("surat_masuk").where("isDeleted", "==", false).get(),
      db.collection("surat_keluar").where("isDeleted", "==", false).get(),
      db.collection("nota_dinas").where("isDeleted", "==", false).get(),
    ])
      .then((results) => {
        monitoringData = [];

        // Process Surat Masuk
        results[0].forEach((doc) => {
          const data = doc.data();
          monitoringData.push({
            id: doc.id,
            type: "masuk",
            ...data,
            _createdAt: data.createdAt ? data.createdAt.toDate() : new Date(0),
          });
        });

        // Process Surat Keluar
        results[1].forEach((doc) => {
          const data = doc.data();
          monitoringData.push({
            id: doc.id,
            type: "keluar",
            ...data,
            _createdAt: data.createdAt ? data.createdAt.toDate() : new Date(0),
          });
        });

        // Process Nota Dinas
        results[2].forEach((doc) => {
          const data = doc.data();
          monitoringData.push({
            id: doc.id,
            type: "nota-dinas",
            ...data,
            _createdAt: data.createdAt ? data.createdAt.toDate() : new Date(0),
          });
        });

        console.log("📊 Total monitoring data loaded:", monitoringData.length);

        // Sort by createdAt descending
        monitoringData.sort((a, b) => b._createdAt - a._createdAt);

        // Apply filters
        applyFilters();
      })
      .catch((error) => {
        console.error("❌ Error loading monitoring data:", error);
        tableBody.innerHTML = `
          <tr>
            <td colspan="7" style="text-align: center; padding: 40px; color: #dc2626;">
              Error: ${error.message}
            </td>
          </tr>
        `;
      });
  };

  // =============================
  // RENDER TABLE
  // =============================
  function renderMonitoringTable(data) {
    const tbody = document.getElementById("monitoringTableBody");
    if (!tbody) {
      console.error("❌ Table body not found!");
      return;
    }

    console.log("🔄 Rendering monitoring table with", data.length, "items...");

    const startIndex = (currentPageMonitoring - 1) * itemsPerPageMonitoring;
    const endIndex = startIndex + itemsPerPageMonitoring;
    const paginatedData = data.slice(startIndex, endIndex);

    tbody.innerHTML = "";

    if (paginatedData.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #999;">Tidak ada data monitoring.</td></tr>';
      updatePaginationInfoMonitoring(0);
      console.log("⚠️ No data to display");
      return;
    }

    paginatedData.forEach((surat) => {
      const row = document.createElement("tr");

      const statusClass = getStatusClass(surat.status || "Pending");
      const statusText = surat.status || "Pending";

      const dari = surat.dari || surat.namaPengirim || "-";
      const noSurat = surat.noSurat || surat.noNaskah || "-";
      const tanggalSurat = formatDate(surat.tanggalSurat || surat.createdAt);
      const kepada = surat.kepada || surat.tujuan || "-";
      const perihal = surat.perihal || "-";

      row.innerHTML = `
        <td style="text-align: left; padding: 12px 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <i class="bi bi-person-circle" style="font-size: 24px; color: #666;"></i>
            <span style="font-size: 13px; color: #333;">${dari}</span>
          </div>
        </td>
        <td style="text-align: left; font-size: 13px; color: #333;">${noSurat}</td>
        <td style="text-align: left; font-size: 13px; color: #666;">${tanggalSurat}</td>
        <td style="text-align: left; font-size: 13px; color: #333;">${kepada}</td>
        <td style="text-align: left; font-size: 13px; color: #333;">${perihal}</td>
        <td style="text-align: center;">
          <span class="status-badge badge-${statusClass}">${statusText}</span>
        </td>
        <td style="text-align: center;">
          <div style="display: flex; gap: 8px; justify-content: center; align-items: center;">
            <button class="action-btn view-btn" onclick="viewDetail(${surat.id}, '${surat.type}')" title="Lihat Detail">
              <i class="bi bi-eye"></i>
            </button>
            <button class="action-btn delete-btn" onclick="deleteSuratFromMonitoring(${surat.id}, '${surat.type}')" title="Hapus">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(row);
    });

    updatePaginationInfoMonitoring(data.length);
    console.log("✅ Table rendered with", paginatedData.length, "rows");
  }

  // =============================
  // HELPER FUNCTIONS
  // =============================
  function getStatusClass(status) {
    const statusMap = {
      Pending: "pending",
      Proses: "proses",
      Selesai: "selesai",
      "Siap Kirim": "siap-kirim",
      Diterima: "diterima",
      Ditolak: "ditolak",
      Dihapus: "dihapus",
      "Menunggu Persetujuan Kapus": "pending",
      "Terkirim ke Kapus": "proses",
      "Disetujui Kapus": "selesai",
    };
    return statusMap[status] || "pending";
  }

  function formatDate(dateStr) {
    if (!dateStr) return "-";

    let date;
    if (dateStr instanceof Date) {
      date = dateStr;
    } else if (typeof dateStr === "string") {
      date = new Date(dateStr);
    } else if (dateStr.toDate) {
      date = dateStr.toDate();
    } else {
      return "-";
    }

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // =============================
  // GLOBAL FUNCTIONS
  // =============================
  window.viewDetail = function (id, type) {
    if (type === "masuk") {
      window.location.href = `surat-masuk.html#detail-${id}`;
    } else if (type === "keluar") {
      window.location.href = `surat-keluar.html#detail-${id}`;
    } else if (type === "nota-dinas") {
      window.location.href = `nota-dinas.html#detail-${id}`;
    }
  };

  window.deleteSuratFromMonitoring = function (id, type) {
    window.loadSwal(() => {
      Swal.fire({
        title: "Hapus Surat?",
        text: "Surat akan dipindahkan ke halaman Surat Dihapus",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Ya, Hapus!",
        cancelButtonText: "Batal",
      }).then((result) => {
        if (result.isConfirmed) {
          const collection =
            type === "masuk"
              ? "surat_masuk"
              : type === "keluar"
              ? "surat_keluar"
              : "nota_dinas";

          db.collection(collection)
            .doc(id)
            .update({
              isDeleted: true,
              deletedAt: firebase.firestore.FieldValue.serverTimestamp(),
            })
            .then(() => {
              Swal.fire({
                title: "Terhapus!",
                text: "Surat telah dipindahkan ke Surat Dihapus",
                icon: "success",
                timer: 2000,
                showConfirmButton: false,
              });
            })
            .catch((error) => {
              console.error("❌ Error deleting:", error);
              Swal.fire({
                title: "Error!",
                text: "Gagal menghapus surat: " + error.message,
                icon: "error",
              });
            });
        }
      });
    });
  };

  // =============================
  // PAGINATION
  // =============================
  function updatePaginationInfoMonitoring(totalItems) {
    const startIndex = (currentPageMonitoring - 1) * itemsPerPageMonitoring + 1;
    const endIndex = Math.min(
      currentPageMonitoring * itemsPerPageMonitoring,
      totalItems
    );
    const infoElement = document.getElementById("monitoringPaginationInfo");
    if (infoElement) {
      infoElement.textContent = `Showing ${
        totalItems === 0 ? 0 : startIndex
      }-${endIndex} of ${totalItems}`;
    }

    const prevBtn = document.getElementById("prevBtnMonitoring");
    const nextBtn = document.getElementById("nextBtnMonitoring");
    const maxPage = Math.ceil(totalItems / itemsPerPageMonitoring);

    if (prevBtn) prevBtn.disabled = currentPageMonitoring === 1;
    if (nextBtn)
      nextBtn.disabled = currentPageMonitoring >= maxPage || totalItems === 0;
  }

  window.previousPageMonitoring = function () {
    if (currentPageMonitoring > 1) {
      currentPageMonitoring--;
      renderMonitoringTable(filteredData);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  window.nextPageMonitoring = function () {
    const maxPage = Math.ceil(filteredData.length / itemsPerPageMonitoring);
    if (currentPageMonitoring < maxPage) {
      currentPageMonitoring++;
      renderMonitoringTable(filteredData);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // =============================
  // FILTERS
  // =============================
  function setupMonitoringFilters() {
    const searchInput = document.getElementById("searchPerihal");
    const statusFilter = document.getElementById("statusFilter");
    const resetBtn = document.getElementById("resetBtn");

    // Tab filters
    const tabBtns = document.querySelectorAll(".tabs-container .tab-btn");
    tabBtns.forEach((btn) => {
      btn.addEventListener("click", function () {
        tabBtns.forEach((b) => b.classList.remove("active"));
        this.classList.add("active");

        currentTab = this.getAttribute("data-tab");
        console.log("Switched to tab:", currentTab);
        applyFilters();
      });
    });

    if (searchInput) {
      searchInput.addEventListener("input", applyFilters);
    }

    if (statusFilter) {
      statusFilter.addEventListener("change", applyFilters);
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        if (statusFilter) statusFilter.selectedIndex = 0;
        if (searchInput) searchInput.value = "";

        selectedDate = null;
        updateDateButtonText();

        tabBtns.forEach((b) => b.classList.remove("active"));
        tabBtns[0]?.classList.add("active");
        currentTab = "masuk";

        currentPageMonitoring = 1;
        applyFilters();
      });
    }
  }

  function applyFilters() {
    const searchInput = document.getElementById("searchPerihal");
    const statusFilter = document.getElementById("statusFilter");

    let filtered = [...monitoringData];

    // Filter by tab
    if (currentTab) {
      filtered = filtered.filter((s) => s.type === currentTab);
    }

    // Filter by search
    if (searchInput?.value) {
      const searchTerm = searchInput.value.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          (s.perihal && s.perihal.toLowerCase().includes(searchTerm)) ||
          (s.noSurat && s.noSurat.toLowerCase().includes(searchTerm)) ||
          (s.noNaskah && s.noNaskah.toLowerCase().includes(searchTerm))
      );
    }

    // Filter by status
    if (statusFilter?.value) {
      filtered = filtered.filter(
        (s) => s.status?.toLowerCase() === statusFilter.value.toLowerCase()
      );
    }

    // Filter by date
    if (selectedDate) {
      filtered = filtered.filter((s) => {
        const suratDate = s.tanggalSurat
          ? new Date(s.tanggalSurat)
          : s._createdAt;
        return suratDate.toDateString() === selectedDate.toDateString();
      });
    }

    console.log("🔍 After filters:", filtered.length, "items");

    currentPageMonitoring = 1;
    filteredData = filtered;
    renderMonitoringTable(filtered);
  }

  // =============================
  // CALENDAR
  // =============================
  function setupCalendar() {
    const datePickerBtn = document.getElementById("datePickerBtn");
    const calendarModal = document.getElementById("calendarModal");
    const applyDateBtn = document.getElementById("applyDate");
    const prevMonthBtn = document.getElementById("prevMonth");
    const nextMonthBtn = document.getElementById("nextMonth");

    if (!datePickerBtn || !calendarModal) return;

    datePickerBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      calendarModal.classList.toggle("active");
      renderCalendar();
    });

    if (applyDateBtn) {
      applyDateBtn.addEventListener("click", () => {
        calendarModal.classList.remove("active");
        updateDateButtonText();
        applyFilters();
      });
    }

    if (prevMonthBtn) {
      prevMonthBtn.addEventListener("click", () => {
        currentMonth--;
        if (currentMonth < 0) {
          currentMonth = 11;
          currentYear--;
        }
        renderCalendar();
      });
    }

    if (nextMonthBtn) {
      nextMonthBtn.addEventListener("click", () => {
        currentMonth++;
        if (currentMonth > 11) {
          currentMonth = 0;
          currentYear++;
        }
        renderCalendar();
      });
    }

    document.addEventListener("click", (e) => {
      if (
        !calendarModal.contains(e.target) &&
        !datePickerBtn.contains(e.target)
      ) {
        calendarModal.classList.remove("active");
      }
    });
  }

  function renderCalendar() {
    const calendarDays = document.getElementById("calendarDays");
    const calendarMonth = document.getElementById("calendarMonth");

    if (!calendarDays || !calendarMonth) return;

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    calendarMonth.textContent = `${monthNames[currentMonth]} ${currentYear}`;

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    calendarDays.innerHTML = "";

    for (let i = 0; i < firstDay; i++) {
      const emptyDay = document.createElement("button");
      emptyDay.className = "calendar-day empty";
      calendarDays.appendChild(emptyDay);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayBtn = document.createElement("button");
      dayBtn.className = "calendar-day";
      dayBtn.textContent = day;

      const date = new Date(currentYear, currentMonth, day);
      const today = new Date();

      if (date.toDateString() === today.toDateString()) {
        dayBtn.classList.add("today");
      }

      if (selectedDate && date.toDateString() === selectedDate.toDateString()) {
        dayBtn.classList.add("selected");
      }

      dayBtn.addEventListener("click", () => {
        selectedDate = date;
        renderCalendar();
      });

      calendarDays.appendChild(dayBtn);
    }
  }

  function updateDateButtonText() {
    const dateText = document.getElementById("selectedDateText");
    if (dateText) {
      if (selectedDate) {
        const day = String(selectedDate.getDate()).padStart(2, "0");
        const months = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "Mei",
          "Jun",
          "Jul",
          "Agu",
          "Sep",
          "Okt",
          "Nov",
          "Des",
        ];
        const month = months[selectedDate.getMonth()];
        const year = selectedDate.getFullYear();
        dateText.textContent = `${day} ${month} ${year}`;
      } else {
        dateText.textContent = "Tanggal";
      }
    }
  }

  // =============================
  // CLEANUP
  // =============================
  window.addEventListener("beforeunload", () => {
    if (unsubscribeMasuk) unsubscribeMasuk();
    if (unsubscribeKeluar) unsubscribeKeluar();
    if (unsubscribeNotaDinas) unsubscribeNotaDinas();
  });
})();

console.log("✅ Monitoring.js - Complete Fix Loaded"); // =============================
// MONITORING - FIREBASE INTEGRATED (COMPLETE FIX)
// =============================
(function () {
  "use strict";

  let currentPageMonitoring = 1;
  const itemsPerPageMonitoring = 10;
  let monitoringData = [];
  let filteredData = [];
  let currentTab = "masuk";
  let unsubscribeMasuk = null;
  let unsubscribeKeluar = null;
  let unsubscribeNotaDinas = null;
  let selectedDate = null;
  let currentMonth = new Date().getMonth();
  let currentYear = new Date().getFullYear();

  // =============================
  // INITIALIZATION
  // =============================
  window.initializePage = function () {
    console.log("📊 Monitoring Page Initialized (COMPLETE VERSION)");

    // Wait for auth to be ready
    const initInterval = setInterval(() => {
      if (typeof checkUserRole === "function" && window.db) {
        clearInterval(initInterval);

        checkUserRole(["admin"])
          .then((userData) => {
            console.log("✅ User authenticated:", userData);

            // Setup real-time listeners
            setupRealtimeMonitoring();

            // Setup filters & calendar
            setupMonitoringFilters();
            setupCalendar();
          })
          .catch((error) => {
            console.error("❌ Access denied:", error);
          });
      }
    }, 100);
  };

  // =============================
  // REAL-TIME MONITORING SETUP
  // =============================
  function setupRealtimeMonitoring() {
    console.log("🔄 Setting up real-time monitoring...");

    if (unsubscribeMasuk) unsubscribeMasuk();
    unsubscribeMasuk = db
      .collection("surat_masuk")
      .where("isDeleted", "==", false)
      .onSnapshot((snapshot) => {
        console.log("📨 Surat Masuk snapshot:", snapshot.size);
        loadMonitoringData();
      });

    if (unsubscribeKeluar) unsubscribeKeluar();
    unsubscribeKeluar = db
      .collection("surat_keluar")
      .where("isDeleted", "==", false)
      .onSnapshot((snapshot) => {
        console.log("📤 Surat Keluar snapshot:", snapshot.size);
        loadMonitoringData();
      });

    if (unsubscribeNotaDinas) unsubscribeNotaDinas();
    unsubscribeNotaDinas = db
      .collection("nota_dinas")
      .where("isDeleted", "==", false)
      .onSnapshot((snapshot) => {
        console.log("📝 Nota Dinas snapshot:", snapshot.size);
        loadMonitoringData();
      });
  }

  // =============================
  // LOAD DATA FROM FIREBASE
  // =============================
  window.loadMonitoringData = function () {
    const tableBody = document.getElementById("monitoringTableBody");
    if (!tableBody) {
      console.error("❌ Table body not found!");
      return;
    }

    console.log("🔄 Loading monitoring data...");
    tableBody.innerHTML =
      '<tr><td colspan="7" style="text-align: center; padding: 20px;">Loading...</td></tr>';

    Promise.all([
      db.collection("surat_masuk").where("isDeleted", "==", false).get(),
      db.collection("surat_keluar").where("isDeleted", "==", false).get(),
      db.collection("nota_dinas").where("isDeleted", "==", false).get(),
    ])
      .then((results) => {
        monitoringData = [];

        // Process Surat Masuk
        results[0].forEach((doc) => {
          const data = doc.data();
          monitoringData.push({
            id: doc.id,
            type: "masuk",
            ...data,
            _createdAt: data.createdAt ? data.createdAt.toDate() : new Date(0),
          });
        });

        // Process Surat Keluar
        results[1].forEach((doc) => {
          const data = doc.data();
          monitoringData.push({
            id: doc.id,
            type: "keluar",
            ...data,
            _createdAt: data.createdAt ? data.createdAt.toDate() : new Date(0),
          });
        });

        // Process Nota Dinas
        results[2].forEach((doc) => {
          const data = doc.data();
          monitoringData.push({
            id: doc.id,
            type: "nota-dinas",
            ...data,
            _createdAt: data.createdAt ? data.createdAt.toDate() : new Date(0),
          });
        });

        console.log("📊 Total monitoring data loaded:", monitoringData.length);

        // Sort by createdAt descending
        monitoringData.sort((a, b) => b._createdAt - a._createdAt);

        // Apply filters
        applyFilters();
      })
      .catch((error) => {
        console.error("❌ Error loading monitoring data:", error);
        tableBody.innerHTML = `
          <tr>
            <td colspan="7" style="text-align: center; padding: 40px; color: #dc2626;">
              Error: ${error.message}
            </td>
          </tr>
        `;
      });
  };

  // =============================
  // RENDER TABLE
  // =============================
  function renderMonitoringTable(data) {
    const tbody = document.getElementById("monitoringTableBody");
    if (!tbody) {
      console.error("❌ Table body not found!");
      return;
    }

    console.log("🔄 Rendering monitoring table with", data.length, "items...");

    const startIndex = (currentPageMonitoring - 1) * itemsPerPageMonitoring;
    const endIndex = startIndex + itemsPerPageMonitoring;
    const paginatedData = data.slice(startIndex, endIndex);

    tbody.innerHTML = "";

    if (paginatedData.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #999;">Tidak ada data monitoring.</td></tr>';
      updatePaginationInfoMonitoring(0);
      console.log("⚠️ No data to display");
      return;
    }

    paginatedData.forEach((surat) => {
      const row = document.createElement("tr");

      const statusClass = getStatusClass(surat.status || "Pending");
      const statusText = surat.status || "Pending";

      const dari = surat.dari || surat.namaPengirim || "-";
      const noSurat = surat.noSurat || surat.noNaskah || "-";
      const tanggalSurat = formatDate(surat.tanggalSurat || surat.createdAt);
      const kepada = surat.kepada || surat.tujuan || "-";
      const perihal = surat.perihal || "-";

      row.innerHTML = `
        <td style="text-align: left; padding: 12px 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <i class="bi bi-person-circle" style="font-size: 24px; color: #666;"></i>
            <span style="font-size: 13px; color: #333;">${dari}</span>
          </div>
        </td>
        <td style="text-align: left; font-size: 13px; color: #333;">${noSurat}</td>
        <td style="text-align: left; font-size: 13px; color: #666;">${tanggalSurat}</td>
        <td style="text-align: left; font-size: 13px; color: #333;">${kepada}</td>
        <td style="text-align: left; font-size: 13px; color: #333;">${perihal}</td>
        <td style="text-align: center;">
          <span class="status-badge badge-${statusClass}">${statusText}</span>
        </td>
        <td style="text-align: center;">
          <div style="display: flex; gap: 8px; justify-content: center; align-items: center;">
            <button class="action-btn view-btn" onclick="viewDetail(${surat.id}, '${surat.type}')" title="Lihat Detail">
              <i class="bi bi-eye"></i>
            </button>
            <button class="action-btn delete-btn" onclick="deleteSuratFromMonitoring(${surat.id}, '${surat.type}')" title="Hapus">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(row);
    });

    updatePaginationInfoMonitoring(data.length);
    console.log("✅ Table rendered with", paginatedData.length, "rows");
  }

  // =============================
  // HELPER FUNCTIONS
  // =============================
  function getStatusClass(status) {
    const statusMap = {
      Pending: "pending",
      Proses: "proses",
      Selesai: "selesai",
      "Siap Kirim": "siap-kirim",
      Diterima: "diterima",
      Ditolak: "ditolak",
      Dihapus: "dihapus",
      "Menunggu Persetujuan Kapus": "pending",
      "Terkirim ke Kapus": "proses",
      "Disetujui Kapus": "selesai",
    };
    return statusMap[status] || "pending";
  }

  function formatDate(dateStr) {
    if (!dateStr) return "-";

    let date;
    if (dateStr instanceof Date) {
      date = dateStr;
    } else if (typeof dateStr === "string") {
      date = new Date(dateStr);
    } else if (dateStr.toDate) {
      date = dateStr.toDate();
    } else {
      return "-";
    }

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // =============================
  // GLOBAL FUNCTIONS
  // =============================
  window.viewDetail = function (id, type) {
    if (type === "masuk") {
      window.location.href = `surat-masuk.html#detail-${id}`;
    } else if (type === "keluar") {
      window.location.href = `surat-keluar.html#detail-${id}`;
    } else if (type === "nota-dinas") {
      window.location.href = `nota-dinas.html#detail-${id}`;
    }
  };

  window.deleteSuratFromMonitoring = function (id, type) {
    window.loadSwal(() => {
      Swal.fire({
        title: "Hapus Surat?",
        text: "Surat akan dipindahkan ke halaman Surat Dihapus",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Ya, Hapus!",
        cancelButtonText: "Batal",
      }).then((result) => {
        if (result.isConfirmed) {
          const collection =
            type === "masuk"
              ? "surat_masuk"
              : type === "keluar"
              ? "surat_keluar"
              : "nota_dinas";

          db.collection(collection)
            .doc(id)
            .update({
              isDeleted: true,
              deletedAt: firebase.firestore.FieldValue.serverTimestamp(),
            })
            .then(() => {
              Swal.fire({
                title: "Terhapus!",
                text: "Surat telah dipindahkan ke Surat Dihapus",
                icon: "success",
                timer: 2000,
                showConfirmButton: false,
              });
            })
            .catch((error) => {
              console.error("❌ Error deleting:", error);
              Swal.fire({
                title: "Error!",
                text: "Gagal menghapus surat: " + error.message,
                icon: "error",
              });
            });
        }
      });
    });
  };

  // =============================
  // PAGINATION
  // =============================
  function updatePaginationInfoMonitoring(totalItems) {
    const startIndex = (currentPageMonitoring - 1) * itemsPerPageMonitoring + 1;
    const endIndex = Math.min(
      currentPageMonitoring * itemsPerPageMonitoring,
      totalItems
    );
    const infoElement = document.getElementById("monitoringPaginationInfo");
    if (infoElement) {
      infoElement.textContent = `Showing ${
        totalItems === 0 ? 0 : startIndex
      }-${endIndex} of ${totalItems}`;
    }

    const prevBtn = document.getElementById("prevBtnMonitoring");
    const nextBtn = document.getElementById("nextBtnMonitoring");
    const maxPage = Math.ceil(totalItems / itemsPerPageMonitoring);

    if (prevBtn) prevBtn.disabled = currentPageMonitoring === 1;
    if (nextBtn)
      nextBtn.disabled = currentPageMonitoring >= maxPage || totalItems === 0;
  }

  window.previousPageMonitoring = function () {
    if (currentPageMonitoring > 1) {
      currentPageMonitoring--;
      renderMonitoringTable(filteredData);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  window.nextPageMonitoring = function () {
    const maxPage = Math.ceil(filteredData.length / itemsPerPageMonitoring);
    if (currentPageMonitoring < maxPage) {
      currentPageMonitoring++;
      renderMonitoringTable(filteredData);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // =============================
  // FILTERS
  // =============================
  function setupMonitoringFilters() {
    const searchInput = document.getElementById("searchPerihal");
    const statusFilter = document.getElementById("statusFilter");
    const resetBtn = document.getElementById("resetBtn");

    // Tab filters
    const tabBtns = document.querySelectorAll(".tabs-container .tab-btn");
    tabBtns.forEach((btn) => {
      btn.addEventListener("click", function () {
        tabBtns.forEach((b) => b.classList.remove("active"));
        this.classList.add("active");

        currentTab = this.getAttribute("data-tab");
        console.log("Switched to tab:", currentTab);
        applyFilters();
      });
    });

    if (searchInput) {
      searchInput.addEventListener("input", applyFilters);
    }

    if (statusFilter) {
      statusFilter.addEventListener("change", applyFilters);
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        if (statusFilter) statusFilter.selectedIndex = 0;
        if (searchInput) searchInput.value = "";

        selectedDate = null;
        updateDateButtonText();

        tabBtns.forEach((b) => b.classList.remove("active"));
        tabBtns[0]?.classList.add("active");
        currentTab = "masuk";

        currentPageMonitoring = 1;
        applyFilters();
      });
    }
  }

  function applyFilters() {
    const searchInput = document.getElementById("searchPerihal");
    const statusFilter = document.getElementById("statusFilter");

    let filtered = [...monitoringData];

    // Filter by tab
    if (currentTab) {
      filtered = filtered.filter((s) => s.type === currentTab);
    }

    // Filter by search
    if (searchInput?.value) {
      const searchTerm = searchInput.value.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          (s.perihal && s.perihal.toLowerCase().includes(searchTerm)) ||
          (s.noSurat && s.noSurat.toLowerCase().includes(searchTerm)) ||
          (s.noNaskah && s.noNaskah.toLowerCase().includes(searchTerm))
      );
    }

    // Filter by status
    if (statusFilter?.value) {
      filtered = filtered.filter(
        (s) => s.status?.toLowerCase() === statusFilter.value.toLowerCase()
      );
    }

    // Filter by date
    if (selectedDate) {
      filtered = filtered.filter((s) => {
        const suratDate = s.tanggalSurat
          ? new Date(s.tanggalSurat)
          : s._createdAt;
        return suratDate.toDateString() === selectedDate.toDateString();
      });
    }

    console.log("🔍 After filters:", filtered.length, "items");

    currentPageMonitoring = 1;
    filteredData = filtered;
    renderMonitoringTable(filtered);
  }

  // =============================
  // CALENDAR
  // =============================
  function setupCalendar() {
    const datePickerBtn = document.getElementById("datePickerBtn");
    const calendarModal = document.getElementById("calendarModal");
    const applyDateBtn = document.getElementById("applyDate");
    const prevMonthBtn = document.getElementById("prevMonth");
    const nextMonthBtn = document.getElementById("nextMonth");

    if (!datePickerBtn || !calendarModal) return;

    datePickerBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      calendarModal.classList.toggle("active");
      renderCalendar();
    });

    if (applyDateBtn) {
      applyDateBtn.addEventListener("click", () => {
        calendarModal.classList.remove("active");
        updateDateButtonText();
        applyFilters();
      });
    }

    if (prevMonthBtn) {
      prevMonthBtn.addEventListener("click", () => {
        currentMonth--;
        if (currentMonth < 0) {
          currentMonth = 11;
          currentYear--;
        }
        renderCalendar();
      });
    }

    if (nextMonthBtn) {
      nextMonthBtn.addEventListener("click", () => {
        currentMonth++;
        if (currentMonth > 11) {
          currentMonth = 0;
          currentYear++;
        }
        renderCalendar();
      });
    }

    document.addEventListener("click", (e) => {
      if (
        !calendarModal.contains(e.target) &&
        !datePickerBtn.contains(e.target)
      ) {
        calendarModal.classList.remove("active");
      }
    });
  }

  function renderCalendar() {
    const calendarDays = document.getElementById("calendarDays");
    const calendarMonth = document.getElementById("calendarMonth");

    if (!calendarDays || !calendarMonth) return;

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    calendarMonth.textContent = `${monthNames[currentMonth]} ${currentYear}`;

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    calendarDays.innerHTML = "";

    for (let i = 0; i < firstDay; i++) {
      const emptyDay = document.createElement("button");
      emptyDay.className = "calendar-day empty";
      calendarDays.appendChild(emptyDay);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayBtn = document.createElement("button");
      dayBtn.className = "calendar-day";
      dayBtn.textContent = day;

      const date = new Date(currentYear, currentMonth, day);
      const today = new Date();

      if (date.toDateString() === today.toDateString()) {
        dayBtn.classList.add("today");
      }

      if (selectedDate && date.toDateString() === selectedDate.toDateString()) {
        dayBtn.classList.add("selected");
      }

      dayBtn.addEventListener("click", () => {
        selectedDate = date;
        renderCalendar();
      });

      calendarDays.appendChild(dayBtn);
    }
  }

  function updateDateButtonText() {
    const dateText = document.getElementById("selectedDateText");
    if (dateText) {
      if (selectedDate) {
        const day = String(selectedDate.getDate()).padStart(2, "0");
        const months = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "Mei",
          "Jun",
          "Jul",
          "Agu",
          "Sep",
          "Okt",
          "Nov",
          "Des",
        ];
        const month = months[selectedDate.getMonth()];
        const year = selectedDate.getFullYear();
        dateText.textContent = `${day} ${month} ${year}`;
      } else {
        dateText.textContent = "Tanggal";
      }
    }
  }

  // =============================
  // CLEANUP
  // =============================
  window.addEventListener("beforeunload", () => {
    if (unsubscribeMasuk) unsubscribeMasuk();
    if (unsubscribeKeluar) unsubscribeKeluar();
    if (unsubscribeNotaDinas) unsubscribeNotaDinas();
  });
})();

console.log("✅ Monitoring.js - Complete Fix Loaded");
