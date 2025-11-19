document.addEventListener("DOMContentLoaded", () => {
  const loadingScreen = document.getElementById("loadingScreen");

  // =============================
  // LOADING SCREEN
  // =============================
  window.showLoading = () => loadingScreen?.classList.add("show");
  window.hideLoading = () => loadingScreen?.classList.remove("show");

  // =============================
  // LOAD SWEETALERT2 SECARA DINAMIS
  // =============================
  function loadSwal(callback) {
    if (window.Swal) return callback();
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/sweetalert2@11";
    script.onload = callback;
    document.head.appendChild(script);
  }

  // =============================
  // LOAD SIDEBAR DINAMIS
  // =============================
  fetch("assets/includes/sidebar.html")
    .then((res) => res.text())
    .then((html) => {
      document.getElementById("sidebar-placeholder").innerHTML = html;

      attachSidebarEvents();
      highlightActiveMenu();
      loadSwal(attachLogoutEvent); // pastikan Swal siap sebelum logout dipasang
    });

  // =============================
  // SIDEBAR EVENTS (notif & tutup)
  // =============================
  function attachSidebarEvents() {
    const notifBtn = document.querySelector(".notification");
    const sidebar = document.getElementById("notificationSidebar");
    const closeBtn = document.getElementById("closeSidebarBtn");
    if (!notifBtn || !sidebar || !closeBtn) return;

    notifBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      sidebar.classList.toggle("active");
    });

    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      sidebar.classList.remove("active");
    });

    document.addEventListener("click", (e) => {
      const logoutLink = document.getElementById("logoutLink");
      if (
        !sidebar.contains(e.target) &&
        !notifBtn.contains(e.target) &&
        !(logoutLink && logoutLink.contains(e.target)) &&
        !e.target.closest(".menu-link")
      ) {
        sidebar.classList.remove("active");
      }
    });
  }

  // =============================
  // HIGHLIGHT ACTIVE MENU
  // =============================
  function highlightActiveMenu() {
    const links = document.querySelectorAll(".sidebar-menu .menu-link");
    const currentPage =
      window.location.pathname.split("/").pop() || "index.html";

    links.forEach((link) => {
      // Abaikan logout
      if (link.id === "logoutLink") return;

      const href = link.getAttribute("href");
      if (
        href === currentPage ||
        (href === "#" && currentPage === "index.html")
      ) {
        link.parentElement.classList.add("active");
        const span = link.querySelector("span");
        if (span) span.classList.add("active");
      } else {
        link.parentElement.classList.remove("active");
        const span = link.querySelector("span");
        if (span) span.classList.remove("active");
      }
    });
  }

  // =============================
  // SURAT MASUK - COMPLETE SYSTEM
  // =============================

  // =============================
  // GLOBAL VARIABLES
  // =============================
  const STORAGE_KEY = "suratMasukData";
  let currentStep = 1;
  let uploadedFile = null;
  let currentPage = 1;
  const itemsPerPage = 6;

  // =============================
  // INITIALIZATION
  // =============================
  window.addEventListener("DOMContentLoaded", function () {
    console.log("Application initialized");
    initializeData();
    renderTable();
    setupEventListeners();
  });

  // Setup all event listeners
  function setupEventListeners() {
    // File upload
    const fileInput = document.getElementById("fileInput");
    if (fileInput) {
      fileInput.addEventListener("change", handleFileUpload);
    }

    // Search
    const tableSearch = document.getElementById("tableSearch");
    if (tableSearch) {
      tableSearch.addEventListener("input", handleSearch);
    }

    // Form submit
    const suratForm = document.getElementById("suratForm");
    if (suratForm) {
      suratForm.addEventListener("submit", handleSubmit);
    }
  }

  // Initialize dummy data
  function initializeData() {
    if (!localStorage.getItem(STORAGE_KEY)) {
      const dummyData = [
        {
          id: 1,
          tanggalDiterima: "04 Agustus 2025",
          tanggalSurat: "01/08/2025",
          noSurat: "001/2025",
          perihal: "Pengajuan Magang Mahasiswa Prodi Sistem Informasi",
          dari: "UPN Veteran Jakarta",
          kepada: "Kepala Bidang Banglola Sisfohan",
          jenisSurat: "Surat Masuk",
          sifatSurat: "Umum",
          file: "Pengajuan_MagangMahasiswa_UPNVJ.pdf",
        },
        {
          id: 2,
          tanggalDiterima: "10 Agustus 2025",
          tanggalSurat: "08/08/2025",
          noSurat: "002/2025",
          perihal: "Pengajuan Magang Mahasiswa Prodi Informatika",
          dari: "Universitas Pertahanan",
          kepada: "Kepala Bidang Infra TIK",
          jenisSurat: "Surat Masuk",
          sifatSurat: "Umum",
          file: "Pengajuan_MagangMahasiswa_UNHAN.pdf",
        },
        {
          id: 3,
          tanggalDiterima: "04 Agustus 2025",
          tanggalSurat: "02/08/2025",
          noSurat: "007/2025",
          perihal: "Undangan Seminar Nasional",
          dari: "UPN Veteran Jakarta",
          kepada: "Kasubbag TU",
          jenisSurat: "Surat Masuk",
          sifatSurat: "Penting",
          file: "Undangan_Seminar_Nasional.pdf",
        },
        {
          id: 4,
          tanggalDiterima: "10 Agustus 2025",
          tanggalSurat: "07/08/2025",
          noSurat: "008/2025",
          perihal: "Permintaan Data Penelitian",
          dari: "Universitas Pertahanan",
          kepada: "Kabid MSI",
          jenisSurat: "Surat Masuk",
          sifatSurat: "Umum",
          file: "Permintaan_Data_Penelitian.pdf",
        },
        {
          id: 5,
          tanggalDiterima: "25 Agustus 2025",
          tanggalSurat: "23/08/2025",
          noSurat: "009/2025",
          perihal: "Permohonan Izin Kegiatan",
          dari: "Institut Teknologi Bandung",
          kepada: "Kepala Bidang Banglola Sisfohan",
          jenisSurat: "Surat Masuk",
          sifatSurat: "Umum",
          file: "Permohonan_Izin_Kegiatan.pdf",
        },
        {
          id: 6,
          tanggalDiterima: "30 Agustus 2025",
          tanggalSurat: "28/08/2025",
          noSurat: "010/2025",
          perihal: "Laporan Kegiatan Bulan Agustus",
          dari: "Kasubbag TU",
          kepada: "Kepala Pusat",
          jenisSurat: "Surat Masuk",
          sifatSurat: "Umum",
          file: "Laporan_Kegiatan_Agustus.pdf",
        },
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dummyData));
      console.log("Dummy data initialized");
    }
  }

  // =============================
  // FILE UPLOAD HANDLER
  // =============================
  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      alert("Format file tidak didukung. Gunakan PDF, DOC, atau DOCX");
      e.target.value = "";
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      alert("Ukuran file maksimal 5MB");
      e.target.value = "";
      return;
    }

    uploadedFile = file;

    const uploadArea = document.getElementById("uploadArea");
    const fileInfoDisplay = document.getElementById("fileInfoDisplay");

    uploadArea.classList.add("has-file");
    fileInfoDisplay.innerHTML = `
    <div class="file-info">
      <i class="bi bi-file-earmark-pdf-fill"></i>
      <div>
        <div class="file-name">${file.name}</div>
        <div class="preview-label">${(file.size / 1024).toFixed(2)} KB</div>
      </div>
    </div>
  `;

    console.log("File uploaded:", file.name);
  }

  // =============================
  // STEP NAVIGATION
  // =============================
  function nextStep() {
    if (currentStep === 1) {
      if (!validateStep1()) return;
      currentStep = 2;
    } else if (currentStep === 2) {
      if (!validateStep2()) return;
      loadPreview();
      currentStep = 3;
    }
    updateStepDisplay();
  }

  function prevStep() {
    if (currentStep > 1) {
      currentStep--;
      updateStepDisplay();
    }
  }

  // =============================
  // STEP VALIDATION
  // =============================
  function validateStep1() {
    const required = [
      "namaPengirim",
      "jabatanPengirim",
      "jenisSurat",
      "sifatSurat",
      "noSurat",
      "perihal",
      "tanggalSurat",
      "tanggalDiterima",
    ];

    for (let id of required) {
      const el = document.getElementById(id);
      if (!el || !el.value.trim()) {
        alert("Mohon lengkapi semua field yang bertanda *");
        if (el) el.focus();
        return false;
      }
    }

    if (!uploadedFile) {
      alert("Mohon upload file terlebih dahulu");
      return false;
    }

    return true;
  }

  function validateStep2() {
    const kepada = document.getElementById("kepada");
    if (!kepada || !kepada.value.trim()) {
      alert("Mohon isi tujuan surat");
      if (kepada) kepada.focus();
      return false;
    }
    return true;
  }

  // =============================
  // STEP DISPLAY UPDATE
  // =============================
  function updateStepDisplay() {
    // Hide all steps
    document.querySelectorAll(".step-content").forEach((el) => {
      el.classList.remove("active");
    });

    // Show current step
    const currentContent = document.getElementById(`step${currentStep}Content`);
    if (currentContent) {
      currentContent.classList.add("active");
    }

    // Update step indicators
    for (let i = 1; i <= 3; i++) {
      const stepNum = document.getElementById(`step${i}Number`);
      if (stepNum) {
        if (i < currentStep) {
          stepNum.className = "step-number completed";
        } else if (i === currentStep) {
          stepNum.className = "step-number active";
        } else {
          stepNum.className = "step-number inactive";
        }
      }
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // =============================
  // PREVIEW LOADING
  // =============================
  function loadPreview() {
    const fields = {
      previewNamaPengirim: "namaPengirim",
      previewJabatan: "jabatanPengirim",
      previewJenis: "jenisSurat",
      previewSifat: "sifatSurat",
      previewNoSurat: "noSurat",
      previewPerihal: "perihal",
      previewKepada: "kepada",
    };

    // Load text fields
    for (let previewId in fields) {
      const inputId = fields[previewId];
      const inputEl = document.getElementById(inputId);
      const previewEl = document.getElementById(previewId);

      if (inputEl && previewEl) {
        previewEl.textContent = inputEl.value || "-";
      }
    }

    // Load dates
    const tanggalSurat = document.getElementById("tanggalSurat");
    const tanggalDiterima = document.getElementById("tanggalDiterima");

    if (tanggalSurat) {
      document.getElementById("previewTanggalSurat").textContent =
        formatDateDisplay(tanggalSurat.value);
    }

    if (tanggalDiterima) {
      document.getElementById("previewTanggalDiterima").textContent =
        formatDateDisplay(tanggalDiterima.value);
    }

    // Load file
    document.getElementById("previewFile").textContent = uploadedFile
      ? uploadedFile.name
      : "-";
  }

  // =============================
  // FORM SUBMIT
  // =============================
  function handleSubmit(e) {
    e.preventDefault();

    const data = getSuratData();
    const newSurat = {
      id: getNextId(),
      tanggalDiterima: formatDateDisplay(
        document.getElementById("tanggalDiterima").value
      ),
      tanggalSurat: formatDateShort(
        document.getElementById("tanggalSurat").value
      ),
      noSurat: document.getElementById("noSurat").value,
      perihal: document.getElementById("perihal").value,
      dari: document.getElementById("namaPengirim").value,
      kepada: document.getElementById("kepada").value,
      jenisSurat: document.getElementById("jenisSurat").value,
      sifatSurat: document.getElementById("sifatSurat").value,
      file: uploadedFile ? uploadedFile.name : "dokumen.pdf",
    };

    data.push(newSurat);
    saveSuratData(data);

    console.log("Surat saved:", newSurat);

    // Show success
    document.querySelectorAll(".step-content").forEach((el) => {
      el.classList.remove("active");
    });

    const successContent = document.getElementById("successContent");
    if (successContent) {
      successContent.classList.add("active");
    }

    // Reset after 2 seconds
    setTimeout(() => {
      closeForm();
    }, 2000);
  }

  // =============================
  // VIEW MANAGEMENT
  // =============================
  function showTambahForm() {
    const listView = document.getElementById("listViewContainer");
    const formView = document.getElementById("formViewContainer");

    if (listView) listView.classList.add("hidden");
    if (formView) formView.classList.add("active");

    // Reset form
    currentStep = 1;
    uploadedFile = null;

    const form = document.getElementById("suratForm");
    if (form) form.reset();

    const uploadArea = document.getElementById("uploadArea");
    if (uploadArea) uploadArea.classList.remove("has-file");

    const fileInfoDisplay = document.getElementById("fileInfoDisplay");
    if (fileInfoDisplay) fileInfoDisplay.innerHTML = "";

    updateStepDisplay();
  }

  function closeForm() {
    const formView = document.getElementById("formViewContainer");
    const listView = document.getElementById("listViewContainer");

    if (formView) formView.classList.remove("active");
    if (listView) listView.classList.remove("hidden");

    renderTable();
  }

  // =============================
  // DATA OPERATIONS
  // =============================
  function getSuratData() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  function saveSuratData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function getNextId() {
    const data = getSuratData();
    return data.length > 0 ? Math.max(...data.map((item) => item.id)) + 1 : 1;
  }

  // =============================
  // TABLE RENDERING
  // =============================
  function renderTable() {
    const data = getSuratData();
    const tbody = document.getElementById("tableBody");

    if (!tbody) {
      console.error("Table body not found");
      return;
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = data.slice(startIndex, endIndex);

    tbody.innerHTML = "";

    if (paginatedData.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #999;">Tidak ada data</td></tr>';
      return;
    }

    paginatedData.forEach((surat, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
      <td style="text-align: center; font-weight: 600; width: 50px;">${
        startIndex + index + 1
      }</td>
      <td style="width: 130px;">${surat.tanggalDiterima}</td>
      <td style="width: 110px;">${surat.noSurat}</td>
      <td style="min-width: 200px;">${surat.perihal}</td>
      <td style="width: 150px;">${surat.dari}</td>
      <td style="min-width: 180px;">${surat.kepada}</td>
      <td style="width: 150px; text-align: center;">
        <div class="action-buttons">
          <div class="btn-action-group">
            <button class="btn-action" title="Lihat" onclick="lihatSurat(${
              surat.id
            })">
              <i class="bi bi-eye"></i>
            </button>
            <div class="btn-action-separator"></div>
            <button class="btn-action" title="Disposisi" onclick="disposisiSurat(${
              surat.id
            })">
              <i class="bi bi-send"></i>
            </button>
          </div>
          <button class="btn-delete" title="Hapus" onclick="hapusSurat(${
            surat.id
          })">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </td>
    `;
      tbody.appendChild(row);
    });

    updatePaginationInfo(data.length);
  }

  function updatePaginationInfo(totalItems) {
    const startIndex = (currentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

    const infoElement = document.getElementById("paginationInfo");
    if (infoElement) {
      infoElement.textContent = `Showing ${startIndex}-${endIndex} of ${totalItems}`;
    }

    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");

    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = endIndex >= totalItems;
  }

  // =============================
  // BUTTON ACTIONS
  // =============================
  function lihatSurat(id) {
    const surat = getSuratData().find((item) => item.id === id);
    if (surat) {
      alert(
        `Detail Surat:\n\nNo: ${surat.noSurat}\nPerihal: ${surat.perihal}\nDari: ${surat.dari}\nKepada: ${surat.kepada}`
      );
    }
  }

  function disposisiSurat(id) {
    alert("Fitur disposisi akan segera tersedia untuk surat ID: " + id);
  }

  function hapusSurat(id) {
    if (!confirm("Apakah Anda yakin ingin menghapus surat ini?")) return;

    const data = getSuratData();
    const filtered = data.filter((item) => item.id !== id);
    saveSuratData(filtered);

    alert("Surat berhasil dihapus!");
    renderTable();
  }

  // =============================
  // PAGINATION
  // =============================
  function previousPage() {
    if (currentPage > 1) {
      currentPage--;
      renderTable();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function nextPage() {
    const data = getSuratData();
    const maxPage = Math.ceil(data.length / itemsPerPage);

    if (currentPage < maxPage) {
      currentPage++;
      renderTable();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  // =============================
  // SEARCH
  // =============================
  function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    const rows = document.querySelectorAll("#tableBody tr");

    rows.forEach((row) => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(searchTerm) ? "" : "none";
    });
  }

  // =============================
  // UTILITY FUNCTIONS
  // =============================
  function formatDateDisplay(dateStr) {
    if (!dateStr) return "-";

    const date = new Date(dateStr);
    const months = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];

    const day = date.getDate().toString().padStart(2, "0");
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${day} ${month} ${year}`;
  }

  function formatDateShort(dateStr) {
    if (!dateStr) return "-";

    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  }

  // =============================
  // EXPOSE GLOBAL FUNCTIONS
  // =============================
  window.showTambahForm = showTambahForm;
  window.closeForm = closeForm;
  window.nextStep = nextStep;
  window.prevStep = prevStep;
  window.lihatSurat = lihatSurat;
  window.disposisiSurat = disposisiSurat;
  window.hapusSurat = hapusSurat;
  window.previousPage = previousPage;
  window.nextPage = nextPage;

  console.log("All functions loaded successfully");

  // =============================
  // SURAT KELUAR
  // =============================
  // Calendar functionality
  let currentDate = new Date();
  let selectedDate = null;

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

  function generateCalendar(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const calendarDays = document.getElementById("calendarDays");
    calendarDays.innerHTML = "";

    // Update header
    document.getElementById(
      "calendarMonth"
    ).textContent = `${monthNames[month]} ${year}`;

    // Add empty cells for days before the first day
    for (let i = 0; i < startingDayOfWeek; i++) {
      const emptyDay = document.createElement("button");
      emptyDay.className = "calendar-day empty";
      calendarDays.appendChild(emptyDay);
    }

    // Add days
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const dayButton = document.createElement("button");
      dayButton.className = "calendar-day";
      dayButton.textContent = day;

      // Check if today
      if (
        year === today.getFullYear() &&
        month === today.getMonth() &&
        day === today.getDate()
      ) {
        dayButton.classList.add("today");
      }

      // Check if selected
      if (
        selectedDate &&
        selectedDate.getFullYear() === year &&
        selectedDate.getMonth() === month &&
        selectedDate.getDate() === day
      ) {
        dayButton.classList.add("selected");
      }

      dayButton.addEventListener("click", function () {
        // Remove previous selection
        document.querySelectorAll(".calendar-day").forEach((d) => {
          d.classList.remove("selected");
        });

        // Add selection to clicked day
        this.classList.add("selected");
        selectedDate = new Date(year, month, day);
      });

      calendarDays.appendChild(dayButton);
    }
  }

  // Open calendar modal
  document
    .getElementById("datePickerBtn")
    .addEventListener("click", function () {
      document.getElementById("calendarModal").classList.add("active");
      generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
    });

  // Close modal when clicking outside
  document
    .getElementById("calendarModal")
    .addEventListener("click", function (e) {
      if (e.target === this) {
        this.classList.remove("active");
      }
    });

  // Previous month
  document.getElementById("prevMonth").addEventListener("click", function () {
    currentDate.setMonth(currentDate.getMonth() - 1);
    generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
  });

  // Next month
  document.getElementById("nextMonth").addEventListener("click", function () {
    currentDate.setMonth(currentDate.getMonth() + 1);
    generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
  });

  // Apply date
  document.getElementById("applyDate").addEventListener("click", function () {
    if (selectedDate) {
      const day = String(selectedDate.getDate()).padStart(2, "0");
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const year = selectedDate.getFullYear();
      const formatted = `${day}/${month}/${year}`;

      document.getElementById("selectedDateText").textContent = formatted;
      document.getElementById("calendarModal").classList.remove("active");
    } else {
      alert("Silakan pilih tanggal terlebih dahulu!");
    }
  });
  // Search functionality
  const searchInput = document.querySelector(".search-box input");
  searchInput.addEventListener("input", function (e) {
    const searchTerm = e.target.value.toLowerCase();
    const rows = document.querySelectorAll(".table-surat tbody tr");

    rows.forEach((row) => {
      const perihal = row.cells[1].textContent.toLowerCase();
      const deskripsi = row.cells[2].textContent.toLowerCase();

      if (perihal.includes(searchTerm) || deskripsi.includes(searchTerm)) {
        row.style.display = "";
      } else {
        row.style.display = "none";
      }
    });
  });

  // Reset filter
  document.querySelector(".btn-reset").addEventListener("click", function () {
    searchInput.value = "";
    document.querySelectorAll(".select-input").forEach((select) => {
      select.selectedIndex = 0;
    });
    document.querySelectorAll(".table-surat tbody tr").forEach((row) => {
      row.style.display = "";
    });
  });

  // Action buttons
  document.querySelectorAll(".action-icons i").forEach((icon) => {
    icon.addEventListener("click", function () {
      const row = this.closest("tr");
      const perihal = row.cells[1].textContent;

      if (this.classList.contains("bi-eye")) {
        alert("Melihat: " + perihal);
      } else if (this.classList.contains("bi-pencil")) {
        alert("Mengedit: " + perihal);
      } else if (this.classList.contains("bi-trash")) {
        if (confirm("Hapus surat: " + perihal + "?")) {
          alert("Surat berhasil dihapus");
        }
      }
    });
  });

  // Tambah Baru button
  document.querySelector(".btn-primary").addEventListener("click", function () {
    alert("Form Tambah Surat Baru");
  });

  // =============================
  // NOTA DINAS
  // =============================
  // Fungsi untuk menampilkan halaman disposisi
  function showDisposisi(button) {
    console.log("Tombol Disposisi diklik!");

    // Ambil data dari baris tabel
    const row = button.closest("tr");
    const cells = row.cells;

    const tanggal = cells[1].textContent.trim();
    const noSurat = cells[2].textContent.trim();
    const perihal = cells[3].textContent.trim();
    const dari = cells[4].textContent.trim();
    const kepada = cells[5].textContent.trim();

    console.log("Data:", { tanggal, noSurat, perihal, dari, kepada });

    // Isi data ke halaman disposisi
    document.getElementById("detailTanggal").textContent = tanggal;
    document.getElementById("detailNoSurat").textContent = noSurat;
    document.getElementById("detailPerihal").textContent = perihal;
    document.getElementById("detailDari").textContent = dari;
    document.getElementById("detailKepada").textContent = kepada;
    document.getElementById("previewTitle").textContent = perihal;

    // Toggle View
    const tableView = document.getElementById("tableView");
    const disposisiView = document.getElementById("disposisiView");

    console.log("Ganti tampilan...");

    // Sembunyikan tabel, tampilkan disposisi
    tableView.classList.add("hidden");
    disposisiView.classList.add("active");

    console.log("Disposisi view aktif!");
    console.log("Table classes:", tableView.className);
    console.log("Disposisi classes:", disposisiView.className);

    // Scroll ke atas
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Fungsi kembali ke tabel
  function backToTable() {
    console.log("Tombol Back diklik!");

    const tableView = document.getElementById("tableView");
    const disposisiView = document.getElementById("disposisiView");

    // Tampilkan tabel, sembunyikan disposisi
    disposisiView.classList.remove("active");
    tableView.classList.remove("hidden");

    console.log("Table view aktif!");

    // Scroll ke atas
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Fungsi kirim disposisi
  function kirimDisposisi() {
    console.log("📤 Kirim disposisi");

    // Ambil checkbox yang dicentang
    const selectedOptions = [];
    document
      .querySelectorAll(".disposisi-checkbox input:checked")
      .forEach((cb) => {
        selectedOptions.push(cb.nextElementSibling.textContent);
      });

    const keterangan = document.getElementById("keteranganDisposisi").value;
    const kepada = document.getElementById("kepadaDisposisi").value;

    // Validasi
    if (selectedOptions.length === 0) {
      alert("Pilih minimal satu tindak lanjut!");
      return;
    }

    if (!kepada) {
      alert("Pilih penerima disposisi!");
      return;
    }

    console.log("Data disposisi:", { selectedOptions, keterangan, kepada });

    alert("Disposisi berhasil dikirim!");

    // Reset form
    document
      .querySelectorAll(".disposisi-checkbox input")
      .forEach((cb) => (cb.checked = false));
    document.getElementById("keteranganDisposisi").value = "";
    document.getElementById("kepadaDisposisi").value = "";

    // Kembali ke table
    backToTable();
  }

  // Debug: Cek saat halaman load
  window.addEventListener("DOMContentLoaded", function () {
    console.log("Halaman loaded!");
    console.log("tableView:", document.getElementById("tableView"));
    console.log("disposisiView:", document.getElementById("disposisiView"));
    console.log(
      "Jumlah tombol disposisi:",
      document.querySelectorAll(".btn-disposisi").length
    );
  });

  // =============================
  //  MONITORING SURAT
  // =============================
  // Tab switching
  const tabBtns = document.querySelectorAll(".tab-btn");
  tabBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      tabBtns.forEach((b) => b.classList.remove("active"));
      this.classList.add("active");

      const tab = this.getAttribute("data-tab");
      console.log("Switched to tab:", tab);
      // Here you can load different data based on tab
    });
  });

  // Reset filter
  document.getElementById("resetBtn").addEventListener("click", function () {
    document.getElementById("dateFilter").selectedIndex = 0;
    document.getElementById("sifatFilter").selectedIndex = 0;
    document.getElementById("searchPerihal").value = "";

    // Show all rows
    const rows = document.querySelectorAll("#tableBody tr");
    rows.forEach((row) => (row.style.display = ""));
  });

  // Search filter
  document
    .getElementById("searchPerihal")
    .addEventListener("input", function (e) {
      const searchTerm = e.target.value.toLowerCase();
      const rows = document.querySelectorAll("#tableBody tr");

      rows.forEach((row) => {
        const perihal = row.cells[4].textContent.toLowerCase();
        if (perihal.includes(searchTerm)) {
          row.style.display = "";
        } else {
          row.style.display = "none";
        }
      });
    });

  // Date filter change
  document.getElementById("dateFilter").addEventListener("change", function () {
    console.log("Date filter changed:", this.value);
    // Implement date filtering logic here
  });

  // Sifat filter change
  document
    .getElementById("sifatFilter")
    .addEventListener("change", function () {
      console.log("Sifat filter changed:", this.value);
      // Implement sifat filtering logic here
    });

  // Delete confirmation
  document.querySelectorAll(".action-icon.delete").forEach((btn) => {
    btn.addEventListener("click", function () {
      if (confirm("Apakah Anda yakin ingin menghapus data monitoring ini?")) {
        this.closest("tr").style.display = "none";
      }
    });
  });

  // View action
  document.querySelectorAll(".action-icon.view").forEach((btn) => {
    btn.addEventListener("click", function () {
      alert("Fitur detail monitoring akan segera ditambahkan");
    });
  });

  // =============================
  //  AGENDA SURAT MASUK
  // =============================
  // Delete confirmation
  document.querySelectorAll(".action-icon.delete").forEach((btn) => {
    btn.addEventListener("click", function () {
      if (confirm("Apakah Anda yakin ingin menghapus agenda ini?")) {
        this.closest("tr").style.display = "none";
      }
    });
  });

  // View action
  document.querySelectorAll(".action-icon.view").forEach((btn) => {
    btn.addEventListener("click", function () {
      alert("Fitur detail agenda akan segera ditambahkan");
    });
  });

  // Edit action
  document.querySelectorAll(".action-icon.edit").forEach((btn) => {
    btn.addEventListener("click", function () {
      alert("Fitur edit agenda akan segera ditambahkan");
    });
  });

  // Search button
  document.querySelector(".btn-search").addEventListener("click", function () {
    const searchValue = document.getElementById("searchSurat").value;
    if (searchValue) {
      alert("Mencari: " + searchValue);
    }
  });

  // Print button
  document.querySelector(".btn-print").addEventListener("click", function () {
    window.print();
  });

  // Date inputs (placeholder for datepicker integration)
  document.getElementById("startDate").addEventListener("click", function () {
    this.type = "date";
  });

  document.getElementById("endDate").addEventListener("click", function () {
    this.type = "date";
  });

  // =============================
  // FAVORIT
  // =============================
  // View button click
  document.querySelectorAll(".action-btn.view").forEach((btn) => {
    btn.addEventListener("click", function () {
      const card = this.closest(".favorit-card");
      const fromName = card.querySelector(".from-name").textContent;
      const perihal = card.querySelector(".perihal-text").textContent;
      alert(`Detail Surat:\n\nDari: ${fromName}\nPerihal: ${perihal}`);
    });
  });

  // Delete button click
  document.querySelectorAll(".action-btn.delete").forEach((btn) => {
    btn.addEventListener("click", function () {
      const card = this.closest(".favorit-card");
      const fromName = card.querySelector(".from-name").textContent;

      if (
        confirm(
          `Apakah Anda yakin ingin menghapus surat dari "${fromName}" dari favorit?`
        )
      ) {
        card.style.opacity = "0";
        card.style.transform = "translateX(-100%)";
        setTimeout(() => {
          card.remove();
        }, 300);
      }
    });
  });

  // Star icon click to unfavorite
  document.querySelectorAll(".star-icon").forEach((icon) => {
    icon.addEventListener("click", function () {
      const card = this.closest(".favorit-card");

      if (confirm("Hapus dari favorit?")) {
        card.style.opacity = "0";
        card.style.transform = "scale(0.8)";
        setTimeout(() => {
          card.remove();
        }, 300);
      }
    });
  });

  // =============================
  // DAFTAR-TAKAH
  // =============================
  // Year filter
  document.getElementById("yearFilter").addEventListener("change", function () {
    const selectedYear = this.value;
    const cards = document.querySelectorAll(".takah-card");

    cards.forEach((card) => {
      if (!selectedYear || card.getAttribute("data-year") === selectedYear) {
        card.style.display = "";
      } else {
        card.style.display = "none";
      }
    });
  });

  // Search functionality
  function performSearch() {
    const searchTerm = searchInput.value.toLowerCase();
    const cards = document.querySelectorAll(".takah-card");

    cards.forEach((card) => {
      const title = card.querySelector(".card-title").textContent.toLowerCase();
      const description = card
        .querySelector(".card-description")
        .textContent.toLowerCase();

      if (title.includes(searchTerm) || description.includes(searchTerm)) {
        card.style.display = "";
      } else {
        card.style.display = "none";
      }
    });
  }

  // Print functionality
  document.querySelector(".btn-print").addEventListener("click", function () {
    window.print();
  });

  // Card click to view details
  document.querySelectorAll(".takah-card").forEach((card) => {
    card.addEventListener("click", function () {
      const number = this.querySelector(".card-number").textContent;
      const title = this.querySelector(".card-title").textContent;
      const description = this.querySelector(".card-description").textContent;

      alert(
        `Detail Takah:\n\nNomor: ${number}\nJudul: ${title}\nDeskripsi: ${description}`
      );
    });
  });

  // =============================
  // KONTAK EVENT
  // =============================
  // Select contact
  function selectContact(element, name, status) {
    // Remove active from all
    document.querySelectorAll(".contact-item").forEach((item) => {
      item.classList.remove("active");
    });

    // Add active to clicked
    element.classList.add("active");

    // Update chat header
    document.getElementById("chatUserName").textContent = name;
    document.getElementById("chatUserStatus").textContent = status;

    // Scroll to bottom
    const chatMessages = document.getElementById("chatMessages");
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Send message
  function sendMessage() {
    const input = document.getElementById("messageInput");
    const message = input.value.trim();

    if (message) {
      const chatMessages = document.getElementById("chatMessages");
      const messageGroup = chatMessages.querySelector(".message-group");

      const newMessage = document.createElement("div");
      newMessage.className = "message sent";
      newMessage.innerHTML = `
                    <div class="message-content">
                        <div class="message-bubble">${message}</div>
                        <div class="message-time">
                            ${new Date().toLocaleTimeString("id-ID", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            <i class="bi bi-check-all"></i>
                        </div>
                    </div>
                `;

      messageGroup.appendChild(newMessage);
      input.value = "";

      // Scroll to bottom
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }

  // Send on Enter key
  document
    .getElementById("messageInput")
    .addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        sendMessage();
      }
    });

  // Search contacts
  document
    .getElementById("contactSearch")
    .addEventListener("input", function (e) {
      const searchTerm = e.target.value.toLowerCase();
      const contacts = document.querySelectorAll(".contact-item");

      contacts.forEach((contact) => {
        const name = contact
          .querySelector(".contact-name")
          .textContent.toLowerCase();
        const preview = contact
          .querySelector(".contact-preview")
          .textContent.toLowerCase();

        if (name.includes(searchTerm) || preview.includes(searchTerm)) {
          contact.style.display = "flex";
        } else {
          contact.style.display = "none";
        }
      });
    });
  // =============================
  // PENGATURAN
  // =============================
  function enableEdit() {
    const inputs = document.querySelectorAll(".form-input");
    const button = document.querySelector(".edit-button");

    if (button.textContent === "Edit Akun") {
      inputs.forEach((input) => {
        input.disabled = false;
        input.style.background = "white";
      });
      button.textContent = "Simpan Perubahan";
      button.style.background = "#28a745";
    } else {
      inputs.forEach((input) => {
        input.disabled = true;
        input.style.background = "#f8f9fa";
      });
      button.textContent = "Edit Akun";
      button.style.background = "#8b0000";
      alert("Perubahan berhasil disimpan!");
    }
  }

  // Handle photo upload
  document
    .getElementById("photoInput")
    .addEventListener("change", function (e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (event) {
          const photoCircle = document.querySelector(".photo-circle");
          photoCircle.innerHTML = `<img src="${event.target.result}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
        };
        reader.readAsDataURL(file);
      }
    });

  // =============================
  // LOGOUT EVENT
  // =============================
  function attachLogoutEvent() {
    const logoutLink = document.getElementById("logoutLink");
    if (!logoutLink) return;

    logoutLink.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      Swal.fire({
        title: "Yakin ingin logout?",
        text: "Anda akan keluar dari sesi saat ini.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Ya, logout",
        cancelButtonText: "Batal",
        reverseButtons: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
      }).then((result) => {
        if (result.isConfirmed) {
          localStorage.clear();
          sessionStorage.clear();
          Swal.fire({
            title: "Logout berhasil",
            text: "Anda akan diarahkan ke halaman login.",
            icon: "success",
            showConfirmButton: false,
            timer: 1500,
          });
          setTimeout(() => (window.location.href = "login.html"), 1600);
        }
      });
    });
  }
});
