// =============================
// NOTA DINAS - COMPLETE FIXED VERSION
// Full Real-Time Integration with Kapus Dashboard
// =============================
(function () {
  "use strict";

  console.log("🔄 Nota Dinas Script Loading...");

  // Local variables
  let currentPageNotaDinas = 1;
  const itemsPerPageNotaDinas = 10;
  let notaDinasData = [];
  let filteredData = [];
  let selectedDate = null;
  let currentMonth = new Date().getMonth();
  let currentYear = new Date().getFullYear();
  let currentNotaDinasId = null;
  let currentStep = 1;
  let isEditMode = false;
  let currentUserData = null;

  // Global Nota Dinas Form Data State
  let notaDinasFormState = {
    uploadedFile: null,
    fileName: null,
  };

  // =============================
  // INITIALIZATION
  // =============================
  window.initializePage = function () {
    console.log("✅ Nota Dinas Page Initialized");

    if (typeof KemhanDatabase === "undefined") {
      console.error("❌ KemhanDatabase tidak tersedia!");
      setTimeout(window.initializePage, 100);
      return;
    }

    // Get current user data
    getCurrentUserData();

    loadNotaDinasData();
    setupNotaDinasFilters();
    setupCalendar();
    setupPagination();
    setupFormNavigation();
    setupBackButtons();
    setupPopupOutsideClick();
    setupRealtimeListeners();

    resetNotaDinasForm();
    
    showTableView();
  };

  // =============================
  // GET CURRENT USER DATA
  // =============================
  function getCurrentUserData() {
    try {
      if (firebase.auth().currentUser) {
        currentUserData = {
          nama: firebase.auth().currentUser.displayName || firebase.auth().currentUser.email,
          email: firebase.auth().currentUser.email,
          uid: firebase.auth().currentUser.uid,
          role: "admin"
        };
        console.log("👤 Current User:", currentUserData);
      } else {
        currentUserData = {
          nama: "Admin",
          role: "admin",
          jabatan: "Administrator"
        };
      }
    } catch (error) {
      console.error("Error getting user data:", error);
      currentUserData = {
        nama: "Admin",
        role: "admin",
        jabatan: "Administrator"
      };
    }
  }

  // =============================
  // REAL-TIME LISTENERS
  // =============================
  function setupRealtimeListeners() {
    console.log("🔌 Setting up real-time listeners...");

    // Listen for new nota dinas
    KemhanDatabase.on('nota_dinas:created', function(notaDinas) {
      console.log("📨 New Nota Dinas detected:", notaDinas);
      loadNotaDinasData();
      
      // Show toast notification
      if (window.Swal) {
        Swal.fire({
          icon: "success",
          title: "Nota Dinas Baru Ditambahkan!",
          text: `${notaDinas.perihal}`,
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
        });
      }
    });

    // Listen for nota dinas updates
    KemhanDatabase.on('nota_dinas:modified', function(notaDinas) {
      console.log("📝 Nota Dinas updated:", notaDinas);
      loadNotaDinasData();
    });

    // Listen for nota dinas deletions
    KemhanDatabase.on('nota_dinas:deleted', function(notaDinas) {
      console.log("🗑️ Nota Dinas deleted:", notaDinas);
      loadNotaDinasData();
    });

    // Listen for nota dinas approval
    KemhanDatabase.on('nota_dinas:approved', function(notaDinas) {
      console.log("✅ Nota Dinas approved:", notaDinas);
      loadNotaDinasData();
      
      if (window.Swal) {
        Swal.fire({
          icon: "success",
          title: "Nota Dinas Disetujui!",
          text: `${notaDinas.perihal}`,
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
        });
      }
    });

    console.log("✅ Real-time listeners setup completed");
  }

  // =============================
  // LOAD DATA FROM DATABASE
  // =============================
  async function loadNotaDinasData() {
    console.log("🔄 Loading Nota Dinas Data...");

    try {
      notaDinasData = await KemhanDatabase.getNotaDinas();

      console.log("📄 Total Nota Dinas:", notaDinasData.length);
      console.log("📊 Sample data:", notaDinasData.slice(0, 2));

      if (notaDinasData.length === 0) {
        console.log("⚠️ Data kosong");
      }

      filteredData = [...notaDinasData];
      renderNotaDinasTable(filteredData);
    } catch (error) {
      console.error("❌ Error loading data:", error);
      const tbody = document.getElementById("notaDinasTableBody");
      if (tbody) {
        tbody.innerHTML =
          '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #dc2626;">Error memuat data. Silakan refresh halaman.</td></tr>';
      }
    }
  }

  // =============================
  // RENDER TABLE
  // =============================
  function renderNotaDinasTable(data) {
    const tbody = document.getElementById("notaDinasTableBody");
    if (!tbody) {
      return;
    }

    const startIndex = (currentPageNotaDinas - 1) * itemsPerPageNotaDinas;
    const endIndex = startIndex + itemsPerPageNotaDinas;
    const paginatedData = data.slice(startIndex, endIndex);

    tbody.innerHTML = "";

    if (paginatedData.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #9ca3af;">Tidak ada nota dinas yang ditemukan</td></tr>';
      updatePaginationInfo(0);
      return;
    }

    paginatedData.forEach((item, index) => {
      const row = document.createElement("tr");
      const rowNumber = startIndex + index + 1;

      const tanggalTerima = item.tanggalTerima || item.tanggalDiterima || item.createdAt;

      let formattedDate = "-";
      if (tanggalTerima) {
        try {
          const date = new Date(tanggalTerima);
          if (!isNaN(date.getTime())) {
            formattedDate = date.toLocaleDateString("id-ID", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            });
          } else {
            formattedDate = tanggalTerima;
          }
        } catch (e) {
          formattedDate = tanggalTerima;
        }
      }

      const noSurat = item.noSurat || item.noNaskah || "-";
      const perihal = item.perihal || "-";
      const dari = item.dari || item.pengirim || item.namaPengirim || "-";
      const kepada = item.kepada || item.tujuan || item.ditujukanKepada || "-";

      row.innerHTML = `
           <td style="text-align: center;">${rowNumber}</td>
           <td>${formattedDate}</td>
           <td>${noSurat}</td>
           <td>${perihal}</td>
           <td>${dari}</td>
           <td>${kepada}</td>
           <td>
             <div class="action-buttons">
               <button class="btn-action btn-preview" onclick="showPreviewNotaDinas('${item.id}')" title="Preview">
                 <i class="bi bi-eye-fill"></i>
               </button>
               <button class="btn-action btn-edit" onclick="editNotaDinas('${item.id}')" title="Edit">
                 <i class="bi bi-pencil-fill"></i>
               </button>
               <button class="btn-action btn-delete" onclick="hapusNotaDinas('${item.id}')" title="Hapus">
                 <i class="bi bi-trash-fill"></i>
               </button>
             </div>
           </td>
         `;

      tbody.appendChild(row);
    });

    updatePaginationInfo(data.length);
  }

  // =============================
  // SHOW PREVIEW
  // =============================
  window.showPreviewNotaDinas = async function (id) {
    console.log("👁️ Show Preview for Nota Dinas ID:", id);

    currentNotaDinasId = id;

    const notaDinas = await KemhanDatabase.getNotaDinasById(id);

    if (!notaDinas) {
      if (window.Swal) {
        Swal.fire({
          icon: "error",
          title: "Error!",
          text: "Data nota dinas tidak ditemukan!",
          confirmButtonColor: "#7f1d1d",
        });
      } else {
        alert("Data nota dinas tidak ditemukan!");
      }
      return;
    }

    const formatDate = (dateStr) => {
      if (!dateStr) return "-";
      try {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          });
        }
      } catch (e) {
        console.warn("Error formatting date:", e);
      }
      return dateStr;
    };

    const setTextContent = (id, value) => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = value || "-";
      }
    };

    setTextContent("previewTitleMain", notaDinas.perihal || "Nota Dinas");
    setTextContent("previewTanggalTerima", formatDate(notaDinas.tanggalTerima || notaDinas.createdAt));
    setTextContent("previewNoSurat", notaDinas.noSurat || notaDinas.noNaskah || "-");
    setTextContent("previewTanggalSurat", formatDate(notaDinas.tanggalSurat));
    setTextContent("previewDari", notaDinas.dari || notaDinas.pengirim || notaDinas.namaPengirim || "-");
    setTextContent("previewKepada", notaDinas.kepada || notaDinas.tujuan || notaDinas.ditujukanKepada || "-");
    setTextContent("previewPerihalDetail", notaDinas.perihal || "-");
    setTextContent("previewLampiran", notaDinas.lampiran || notaDinas.file || notaDinas.fileName || "-");
    setTextContent("previewSifat", notaDinas.sifat || notaDinas.sifatNaskah || "Umum");
    setTextContent("previewJenisNaskah", notaDinas.jenisNaskah || "Nota Dinas");
    setTextContent("previewCatatanDetail", notaDinas.catatan || "-");
    setTextContent("previewDientry", notaDinas.diEntryOleh || notaDinas.namaPengirim || currentUserData.nama);

    // Set file name in preview
    const fileNameEl = document.getElementById("previewFileName");
    if (fileNameEl) {
      fileNameEl.textContent = notaDinas.fileName || notaDinas.file || "Tidak ada file";
    }

    const statusBadge = document.getElementById("previewStatusBadge");
    if (statusBadge) {
      const status = notaDinas.status || "Proses";
      let badgeClass = "badge-proses";
      if (status === "Selesai") badgeClass = "badge-selesai";
      else if (status === "Pending" || status === "Menunggu Persetujuan Kapus") badgeClass = "badge-pending";
      else if (status === "Revisi" || status === "Perlu Revisi") badgeClass = "badge-revisi";
      
      statusBadge.innerHTML = `<span class="${badgeClass}">${status}</span>`;
    }

    const progressFill = document.querySelector("#previewProgressBar .progress-fill");
    const progressText = document.getElementById("previewProgressText");
    let progress = 50;
    
    if (notaDinas.status === "Selesai") progress = 100;
    else if (notaDinas.status === "Menunggu Persetujuan Kapus") progress = 75;
    else if (notaDinas.status === "Proses") progress = 50;
    
    if (progressFill) progressFill.style.width = progress + "%";
    if (progressText) progressText.textContent = progress + "%";

    showPreviewView();

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // =============================
  // EDIT NOTA DINAS
  // =============================
  window.editNotaDinas = async function (id) {
    console.log("✏️ Edit Nota Dinas ID:", id);

    const notaDinas = await KemhanDatabase.getNotaDinasById(id);

    if (!notaDinas) {
      if (window.Swal) {
        Swal.fire({
          icon: "error",
          title: "Error!",
          text: "Data nota dinas tidak ditemukan!",
          confirmButtonColor: "#7f1d1d",
        });
      } else {
        alert("Data nota dinas tidak ditemukan!");
      }
      return;
    }

    isEditMode = true;
    currentNotaDinasId = id;

    const formTitle = document.getElementById("formMainTitle");
    if (formTitle) {
      formTitle.textContent = "Edit Nota Dinas";
    }

    document.getElementById("namaPengirim").value = notaDinas.namaPengirim || notaDinas.dari || "";
    document.getElementById("jabatanPengirim").value = notaDinas.jabatanPengirim || "";
    document.getElementById("jenisNaskah").value = notaDinas.jenisNaskah || "Nota Dinas";
    document.getElementById("sifatNaskah").value = notaDinas.sifatNaskah || notaDinas.sifat || "";
    document.getElementById("nomorNaskah").value = notaDinas.noNaskah || notaDinas.noSurat || "";
    document.getElementById("perihal").value = notaDinas.perihal || "";
    document.getElementById("tanggalSurat").value = notaDinas.tanggalSurat || notaDinas.tanggalNaskah || "";
    document.getElementById("catatan").value = notaDinas.catatan || "";
    document.getElementById("ditujukanKepada").value = notaDinas.tujuan || notaDinas.kepada || notaDinas.ditujukanKepada || "";
    document.getElementById("tenggatWaktu").value = notaDinas.tenggatWaktu || "";
    document.getElementById("catatanTujuan").value = notaDinas.catatanTujuan || "";

    // Handle existing file
    if (notaDinas.fileName || notaDinas.file) {
      notaDinasFormState.fileName = notaDinas.fileName || notaDinas.file;
      notaDinasFormState.uploadedFile = notaDinas.uploadedFile || null;
      
      const fileInfoDisplay = document.getElementById("fileInfoDisplay");
      const uploadContent = document.getElementById("uploadContent");
      
      if (fileInfoDisplay && uploadContent) {
        uploadContent.style.display = "none";
        fileInfoDisplay.innerHTML = `
          <div class="file-item">
            <i class="bi bi-file-earmark-pdf"></i>
            <span class="file-name">${notaDinasFormState.fileName}</span>
            <button class="file-remove" onclick="removeFile()" type="button">
              <i class="bi bi-x"></i>
            </button>
          </div>
        `;
        fileInfoDisplay.style.display = "block";
      }
    }

    showFormView();

    goToStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // =============================
  // HAPUS NOTA DINAS
  // =============================
  window.hapusNotaDinas = async function (id) {
    const confirmDelete = async () => {
      try {
        const deleted = await KemhanDatabase.deleteNotaDinas(id);

        if (deleted) {
          if (window.Swal) {
            Swal.fire({
              icon: "success",
              title: "Berhasil!",
              text: "Nota dinas berhasil dihapus!",
              confirmButtonColor: "#7f1d1d",
              timer: 2000,
            }).then(() => {
              loadNotaDinasData();
            });
          } else {
            alert("Nota dinas berhasil dihapus!");
            loadNotaDinasData();
          }
        } else {
          if (window.Swal) {
            Swal.fire({
              icon: "error",
              title: "Gagal!",
              text: "Gagal menghapus nota dinas!",
              confirmButtonColor: "#7f1d1d",
            });
          } else {
            alert("Gagal menghapus nota dinas!");
          }
        }
      } catch (error) {
        console.error("Error deleting:", error);
        if (window.Swal) {
          Swal.fire({
            icon: "error",
            title: "Error!",
            text: "Terjadi kesalahan saat menghapus!",
            confirmButtonColor: "#7f1d1d",
          });
        }
      }
    };

    if (window.Swal) {
      Swal.fire({
        title: "Hapus Nota Dinas?",
        text: "Nota dinas akan dipindahkan ke daftar dihapus.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#dc2626",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Ya, Hapus!",
        cancelButtonText: "Batal",
      }).then((result) => {
        if (result.isConfirmed) {
          confirmDelete();
        }
      });
    } else {
      if (confirm("Hapus nota dinas ini?")) {
        confirmDelete();
      }
    }
  };

  window.hapusSuratFromPreview = function () {
    if (currentNotaDinasId) {
      hapusNotaDinas(currentNotaDinasId);
      
      setTimeout(() => {
        window.backToTableView();
      }, 2000);
    }
  };

  // =============================
  // BACK TO TABLE VIEW
  // =============================
  window.backToTableView = function () {
    console.log("🔙 Executing backToTableView...");

    showTableView();

    resetNotaDinasForm();
    loadNotaDinasData();

    window.scrollTo({ top: 0, behavior: "smooth" });

    console.log("✅ Back to table view completed");
  };

  // =============================
  // VIEW MANAGEMENT
  // =============================
  function hideAllViews() {
    console.log("🔒 Hiding all views...");
    
    const tableView = document.getElementById("tableView");
    const formView = document.getElementById("formView");
    const previewView = document.getElementById("previewView");
    const successPopup = document.getElementById("successPopup");

    if (tableView) {
      tableView.classList.remove("active");
      tableView.style.display = "none";
    }
    if (formView) {
      formView.classList.remove("active");
      formView.style.display = "none";
    }
    if (previewView) {
      previewView.classList.remove("active");
      previewView.style.display = "none";
    }
    if (successPopup) {
      successPopup.classList.remove("active");
      successPopup.style.display = "none";
    }
  }

  function showTableView() {
    console.log("📋 Showing table view...");
    hideAllViews();
    
    const tableView = document.getElementById("tableView");
    if (tableView) {
      tableView.style.display = "block";
      tableView.classList.add("active");
    }
  }

  function showFormView() {
    console.log("📝 Showing form view...");
    hideAllViews();
    
    const formView = document.getElementById("formView");
    if (formView) {
      formView.style.display = "block";
      formView.classList.add("active");
    }
  }

  function showPreviewView() {
    console.log("👁️ Showing preview view...");
    hideAllViews();
    
    const previewView = document.getElementById("previewView");
    if (previewView) {
      previewView.style.display = "block";
      previewView.classList.add("active");
    }
  }

  // =============================
  // SETUP BACK BUTTONS
  // =============================
  function setupBackButtons() {
    console.log("🔧 Setting up back buttons...");

    const backBtnForm = document.getElementById("backToTableViewForm");
    if (backBtnForm) {
      const newBackBtnForm = backBtnForm.cloneNode(true);
      backBtnForm.parentNode.replaceChild(newBackBtnForm, backBtnForm);
      
      newBackBtnForm.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        window.backToTableView();
      });
    }

    const backToTableFromPreview = document.getElementById("backToTableFromPreview");
    if (backToTableFromPreview) {
      const newBackBtn = backToTableFromPreview.cloneNode(true);
      backToTableFromPreview.parentNode.replaceChild(newBackBtn, backToTableFromPreview);
      
      newBackBtn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        window.backToTableView();
      });
    }
  }

  // =============================
  // PAGINATION
  // =============================
  function setupPagination() {
    const prevBtn = document.getElementById("prevPageBtn");
    const nextBtn = document.getElementById("nextPageBtn");

    if (prevBtn) {
      prevBtn.addEventListener("click", function () {
        if (currentPageNotaDinas > 1) {
          currentPageNotaDinas--;
          renderNotaDinasTable(filteredData);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        const maxPage = Math.ceil(filteredData.length / itemsPerPageNotaDinas);
        if (currentPageNotaDinas < maxPage) {
          currentPageNotaDinas++;
          renderNotaDinasTable(filteredData);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      });
    }
  }

  function updatePaginationInfo(totalItems) {
    const startIndex =
      totalItems > 0
        ? (currentPageNotaDinas - 1) * itemsPerPageNotaDinas + 1
        : 0;
    const endIndex = Math.min(
      currentPageNotaDinas * itemsPerPageNotaDinas,
      totalItems
    );

    const infoElement = document.getElementById("paginationInfo");
    if (infoElement) {
      infoElement.textContent = `Showing ${startIndex}-${endIndex} of ${totalItems}`;
    }

    const prevBtn = document.getElementById("prevPageBtn");
    const nextBtn = document.getElementById("nextPageBtn");
    const maxPage = Math.ceil(totalItems / itemsPerPageNotaDinas);

    if (prevBtn) prevBtn.disabled = currentPageNotaDinas === 1;
    if (nextBtn)
      nextBtn.disabled = currentPageNotaDinas >= maxPage || totalItems === 0;
  }

  // =============================
  // FILTERS
  // =============================
  function setupNotaDinasFilters() {
    const searchInput = document.getElementById("searchPerihal");
    const sifatFilter = document.getElementById("sifatFilter");
    const resetBtn = document.getElementById("resetBtn");

    searchInput?.addEventListener("input", function (e) {
      applyFilters();
    });

    sifatFilter?.addEventListener("change", function () {
      applyFilters();
    });

    resetBtn?.addEventListener("click", function () {
      if (sifatFilter) sifatFilter.selectedIndex = 0;
      if (searchInput) searchInput.value = "";
      selectedDate = null;

      const dateText = document.getElementById("selectedDateText");
      if (dateText) {
        dateText.textContent = "Semua Tanggal";
      }

      currentPageNotaDinas = 1;
      filteredData = [...notaDinasData];
      renderNotaDinasTable(filteredData);
    });
  }

  function applyFilters() {
    const searchTerm =
      document.getElementById("searchPerihal")?.value.toLowerCase() || "";
    const sifatValue = document.getElementById("sifatFilter")?.value || "";

    filteredData = notaDinasData.filter((item) => {
      const matchSearch =
        !searchTerm ||
        (item.perihal && item.perihal.toLowerCase().includes(searchTerm)) ||
        (item.noSurat && item.noSurat.toLowerCase().includes(searchTerm)) ||
        (item.noNaskah && item.noNaskah.toLowerCase().includes(searchTerm)) ||
        (item.dari && item.dari.toLowerCase().includes(searchTerm)) ||
        (item.kepada && item.kepada.toLowerCase().includes(searchTerm));

      const matchSifat =
        !sifatValue ||
        (item.sifat || item.sifatNaskah || "umum").toLowerCase() ===
          sifatValue.toLowerCase();

      const matchDate =
        !selectedDate ||
        (() => {
          const itemDate = new Date(
            item.tanggalTerima || item.tanggalDiterima || item.createdAt
          );
          return (
            itemDate.getDate() === selectedDate.getDate() &&
            itemDate.getMonth() === selectedDate.getMonth() &&
            itemDate.getFullYear() === selectedDate.getFullYear()
          );
        })();

      return matchSearch && matchSifat && matchDate;
    });

    currentPageNotaDinas = 1;
    renderNotaDinasTable(filteredData);
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

    datePickerBtn?.addEventListener("click", function (e) {
      e.stopPropagation();
      calendarModal?.classList.add("active");
      renderCalendar();
    });

    calendarModal?.addEventListener("click", function (e) {
      if (e.target === calendarModal) {
        calendarModal.classList.remove("active");
      }
    });

    prevMonthBtn?.addEventListener("click", function () {
      currentMonth--;
      if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
      }
      renderCalendar();
    });

    nextMonthBtn?.addEventListener("click", function () {
      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
      renderCalendar();
    });

    applyDateBtn?.addEventListener("click", function () {
      if (selectedDate) {
        const dateText = selectedDate.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
        const dateTextEl = document.getElementById("selectedDateText");
        if (dateTextEl) {
          dateTextEl.textContent = dateText;
        }
        applyFilters();
      }
      calendarModal?.classList.remove("active");
    });
  }

  function renderCalendar() {
    const calendarDays = document.getElementById("calendarDays");
    const calendarMonth = document.getElementById("calendarMonth");

    if (!calendarDays || !calendarMonth) return;

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];

    calendarMonth.textContent = `${monthNames[currentMonth]} ${currentYear}`;

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const today = new Date();

    calendarDays.innerHTML = "";

    for (let i = 0; i < firstDay; i++) {
      const emptyDay = document.createElement("button");
      emptyDay.className = "calendar-day empty";
      emptyDay.disabled = true;
      calendarDays.appendChild(emptyDay);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayButton = document.createElement("button");
      dayButton.className = "calendar-day";
      dayButton.textContent = day;

      const date = new Date(currentYear, currentMonth, day);

      if (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      ) {
        dayButton.classList.add("today");
      }

      if (
        selectedDate &&
        date.getDate() === selectedDate.getDate() &&
        date.getMonth() === selectedDate.getMonth() &&
        date.getFullYear() === selectedDate.getFullYear()
      ) {
        dayButton.classList.add("selected");
      }

      dayButton.addEventListener("click", function () {
        selectedDate = new Date(currentYear, currentMonth, day);
        renderCalendar();
      });

      calendarDays.appendChild(dayButton);
    }
  }

  // =============================
  // TAMBAH BARU
  // =============================
  window.tambahSurat = function () {
    isEditMode = false;
    currentNotaDinasId = null;

    const formTitle = document.getElementById("formMainTitle");
    if (formTitle) {
      formTitle.textContent = "Susun Nota Dinas";
    }

    showFormView();

    resetNotaDinasForm();
    goToStep(1);

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // =============================
  // FORM NAVIGATION
  // =============================
  function setupFormNavigation() {
    // Called during initializePage
  }

  function goToStep(step) {
    currentStep = step;
    const steps = document.querySelectorAll(".progress-steps .step");
    const stepContents = document.querySelectorAll(".step-content");

    steps.forEach((s) => s.classList.remove("active"));
    stepContents.forEach((c) => c.classList.remove("active"));

    const activeStep = document.querySelector(
      `.progress-steps [data-step="${step}"]`
    );
    const activeContent = document.getElementById(`step${step}Content`);

    if (activeStep) activeStep.classList.add("active");
    if (activeContent) activeContent.classList.add("active");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  window.goToStep1 = function () {
    goToStep(1);
  };

  window.goToStep2 = function () {
    if (!validateStep1()) return;
    saveStep1Data();
    goToStep(2);
  };

  window.goToStep3 = function () {
    if (!validateStep2()) return;
    saveStep2Data();
    updatePreview();
    goToStep(3);
  };

  function validateStep1() {
    const fields = [
      "namaPengirim",
      "jabatanPengirim",
      "jenisNaskah",
      "sifatNaskah",
      "nomorNaskah",
      "perihal",
      "tanggalSurat",
    ];
    for (const field of fields) {
      const input = document.getElementById(field);
      if (input && !input.value.trim()) {
        if (window.Swal) {
          Swal.fire({
            icon: "error",
            title: "Form Belum Lengkap!",
            text: `Mohon lengkapi kolom ${
              document.querySelector(`label[for="${field}"]`)?.textContent || field
            }!`,
            confirmButtonColor: "#7f1d1d",
          });
        } else {
          alert(`Mohon lengkapi kolom ${
            document.querySelector(`label[for="${field}"]`)?.textContent || field
          }!`);
        }
        input.focus();
        return false;
      }
    }

    const fileInput = document.getElementById("fileInput");
    if (!isEditMode && !fileInput.files[0] && !notaDinasFormState.fileName) {
      if (window.Swal) {
        Swal.fire({
          icon: "error",
          title: "File Belum Dipilih!",
          text: "Mohon upload file naskah!",
          confirmButtonColor: "#7f1d1d",
        });
      } else {
        alert("Mohon upload file naskah!");
      }
      return false;
    }

    return true;
  }

  function validateStep2() {
    const ditujukanKepada = document.getElementById("ditujukanKepada").value;

    if (!ditujukanKepada) {
      if (window.Swal) {
        Swal.fire({
          icon: "error",
          title: "Form Belum Lengkap!",
          text: "Mohon pilih tujuan nota dinas!",
          confirmButtonColor: "#7f1d1d",
        });
      } else {
        alert("Mohon pilih tujuan nota dinas!");
      }
      document.getElementById("ditujukanKepada").focus();
      return false;
    }

    return true;
  }

  function saveStep1Data() {
    notaDinasFormState.namaPengirim = document.getElementById("namaPengirim").value;
    notaDinasFormState.jabatanPengirim = document.getElementById("jabatanPengirim").value;
    notaDinasFormState.jenisNaskah = document.getElementById("jenisNaskah").value;
    notaDinasFormState.sifatNaskah = document.getElementById("sifatNaskah").value;
    notaDinasFormState.nomorNaskah = document.getElementById("nomorNaskah").value;
    notaDinasFormState.perihal = document.getElementById("perihal").value;
    notaDinasFormState.tanggalSurat = document.getElementById("tanggalSurat").value;
    notaDinasFormState.catatan = document.getElementById("catatan").value;
    
    const fileInput = document.getElementById("fileInput");
    if (fileInput.files[0]) {
      notaDinasFormState.uploadedFile = fileInput.files[0];
      notaDinasFormState.fileName = fileInput.files[0].name;
    }
  }

  function saveStep2Data() {
    notaDinasFormState.ditujukanKepada = document.getElementById("ditujukanKepada").value;
    notaDinasFormState.tenggatWaktu = document.getElementById("tenggatWaktu").value;
    notaDinasFormState.catatanTujuan = document.getElementById("catatanTujuan").value;
  }

  function updatePreview() {
    const formatDate = (dateStr) => {
      if (!dateStr) return "-";
      try {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          });
        }
      } catch (e) {
        return dateStr;
      }
      return dateStr;
    };

    // Update preview with form data
    document.getElementById("previewNamaPengirim").textContent = notaDinasFormState.namaPengirim || "-";
    document.getElementById("previewJabatanPengirim").textContent = notaDinasFormState.jabatanPengirim || "-";
    document.getElementById("previewJenisNaskahForm").textContent = notaDinasFormState.jenisNaskah || "-";
    
    const sifatBadge = document.getElementById("previewSifatNaskah");
    if (sifatBadge) {
      let badgeClass = "badge-umum";
      const sifat = notaDinasFormState.sifatNaskah || "Umum";
      if (sifat === "Rahasia") badgeClass = "badge-rahasia";
      else if (sifat === "Sangat Rahasia") badgeClass = "badge-sangat-rahasia";
      else if (sifat === "Penting") badgeClass = "badge-penting";
      
      sifatBadge.className = `badge-sifat ${badgeClass}`;
      sifatBadge.textContent = sifat;
    }
    
    document.getElementById("previewNomorNaskah").textContent = notaDinasFormState.nomorNaskah || "-";
    document.getElementById("previewPerihal").textContent = notaDinasFormState.perihal || "-";
    document.getElementById("previewTanggalSuratForm").textContent = formatDate(notaDinasFormState.tanggalSurat);
    document.getElementById("previewCatatan").textContent = notaDinasFormState.catatan || "-";
    
    const fileNameEl = document.getElementById("previewFileNameForm");
    if (fileNameEl) {
      fileNameEl.textContent = notaDinasFormState.fileName || "Tidak ada file";
    }
    
    document.getElementById("previewTujuan").textContent = notaDinasFormState.ditujukanKepada || "-";
    document.getElementById("previewTenggatWaktu").textContent = formatDate(notaDinasFormState.tenggatWaktu);
    document.getElementById("previewCatatanTujuan").textContent = notaDinasFormState.catatanTujuan || "-";
  }

  // =============================
  // FILE UPLOAD HANDLER
  // =============================
  window.handleFileUpload = function (event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      if (window.Swal) {
        Swal.fire({
          icon: "error",
          title: "File Terlalu Besar!",
          text: "Ukuran file maksimal 50MB",
          confirmButtonColor: "#7f1d1d",
        });
      } else {
        alert("Ukuran file maksimal 50MB");
      }
      event.target.value = "";
      return;
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/jpg",
      "image/png"
    ];

    if (!allowedTypes.includes(file.type)) {
      if (window.Swal) {
        Swal.fire({
          icon: "error",
          title: "Tipe File Tidak Didukung!",
          text: "Hanya file PDF, DOC, DOCX, JPG, PNG yang diperbolehkan",
          confirmButtonColor: "#7f1d1d",
        });
      } else {
        alert("Hanya file PDF, DOC, DOCX, JPG, PNG yang diperbolehkan");
      }
      event.target.value = "";
      return;
    }

    notaDinasFormState.uploadedFile = file;
    notaDinasFormState.fileName = file.name;

    displayFileInfo(file);
  };

  function displayFileInfo(file) {
    const fileInfoDisplay = document.getElementById("fileInfoDisplay");
    const uploadContent = document.getElementById("uploadContent");

    if (!fileInfoDisplay || !uploadContent) return;

    const fileSize = (file.size / 1024).toFixed(2);
    const fileSizeText = fileSize > 1024 ? `${(fileSize / 1024).toFixed(2)} MB` : `${fileSize} KB`;

    uploadContent.style.display = "none";

    fileInfoDisplay.innerHTML = `
      <div class="file-item">
        <i class="bi bi-file-earmark-pdf"></i>
        <div class="file-details">
          <span class="file-name">${file.name}</span>
          <span class="file-size">${fileSizeText}</span>
        </div>
        <button class="file-remove" onclick="removeFile()" type="button">
          <i class="bi bi-x"></i>
        </button>
      </div>
    `;

    fileInfoDisplay.style.display = "block";
  }

  window.removeFile = function () {
    const fileInput = document.getElementById("fileInput");
    const fileInfoDisplay = document.getElementById("fileInfoDisplay");
    const uploadContent = document.getElementById("uploadContent");

    if (fileInput) fileInput.value = "";
    if (fileInfoDisplay) {
      fileInfoDisplay.innerHTML = "";
      fileInfoDisplay.style.display = "none";
    }
    if (uploadContent) {
      uploadContent.style.display = "flex";
    }

    notaDinasFormState.uploadedFile = null;
    notaDinasFormState.fileName = null;
  };

  // =============================
  // SUBMIT NOTA DINAS
  // =============================
  window.confirmSubmitNotaDinas = function () {
    if (window.Swal) {
      Swal.fire({
        title: "Konfirmasi Pengiriman",
        text: "Apakah Anda yakin ingin mengirim nota dinas ini ke Kapus untuk persetujuan?",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#7f1d1d",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Ya, Kirim!",
        cancelButtonText: "Batal",
      }).then((result) => {
        if (result.isConfirmed) {
          submitNotaDinas();
        }
      });
    } else {
      if (confirm("Apakah Anda yakin ingin mengirim nota dinas ini?")) {
        submitNotaDinas();
      }
    }
  };

  async function submitNotaDinas() {
    console.log("📤 Submitting Nota Dinas...");

    const notaDinasData = {
      namaPengirim: notaDinasFormState.namaPengirim,
      jabatanPengirim: notaDinasFormState.jabatanPengirim,
      jenisNaskah: notaDinasFormState.jenisNaskah,
      sifatNaskah: notaDinasFormState.sifatNaskah,
      sifat: notaDinasFormState.sifatNaskah,
      noNaskah: notaDinasFormState.nomorNaskah,
      noSurat: notaDinasFormState.nomorNaskah,
      perihal: notaDinasFormState.perihal,
      tanggalSurat: notaDinasFormState.tanggalSurat,
      tanggalNaskah: notaDinasFormState.tanggalSurat,
      catatan: notaDinasFormState.catatan,
      fileName: notaDinasFormState.fileName,
      uploadedFile: notaDinasFormState.uploadedFile,
      
      // Tujuan
      ditujukanKepada: notaDinasFormState.ditujukanKepada,
      kepada: notaDinasFormState.ditujukanKepada,
      tujuan: notaDinasFormState.ditujukanKepada,
      tenggatWaktu: notaDinasFormState.tenggatWaktu,
      catatanTujuan: notaDinasFormState.catatanTujuan,
      
      // Metadata
      dari: notaDinasFormState.namaPengirim,
      pengirim: notaDinasFormState.namaPengirim,
      diEntryOleh: currentUserData.nama,
      tanggalTerima: new Date().toISOString(),
      tanggalDiterima: new Date().toISOString(),
      
      // Status - PENTING: Set to Menunggu Persetujuan Kapus
      status: "Menunggu Persetujuan Kapus",
    };

    try {
      let result;
      if (isEditMode && currentNotaDinasId) {
        result = await KemhanDatabase.updateNotaDinas(currentNotaDinasId, notaDinasData);
        console.log("📝 Nota Dinas Updated:", result);
      } else {
        result = await KemhanDatabase.addNotaDinas(notaDinasData);
        console.log("✅ Nota Dinas Created with ID:", result);
      }

      if (result) {
        showSuccessPopup();
        
        setTimeout(() => {
          closeSuccessPopupAndBack();
        }, 2000);
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      console.error("Error submitting:", error);
      if (window.Swal) {
        Swal.fire({
          icon: "error",
          title: "Gagal!",
          text: "Gagal menyimpan nota dinas!",
          confirmButtonColor: "#7f1d1d",
        });
      } else {
        alert("Gagal menyimpan nota dinas!");
      }
    }
  }

  // =============================
  // SUCCESS POPUP
  // =============================
  function showSuccessPopup() {
    hideAllViews();
    const successPopup = document.getElementById("successPopup");
    if (successPopup) {
      successPopup.style.display = "flex";
      successPopup.classList.add("active");
    }
  }

  window.closeSuccessPopupAndBack = function () {
    const successPopup = document.getElementById("successPopup");
    if (successPopup) {
      successPopup.classList.remove("active");
      successPopup.style.display = "none";
    }
    
    window.backToTableView();
  };

  function setupPopupOutsideClick() {
    const successPopup = document.getElementById("successPopup");
    if (successPopup) {
      successPopup.addEventListener("click", function (e) {
        if (e.target === successPopup) {
          closeSuccessPopupAndBack();
        }
      });
    }
  }

  // =============================
  // RESET FORM
  // =============================
  function resetNotaDinasForm() {
    console.log("🔄 Resetting Nota Dinas Form...");

    isEditMode = false;
    currentNotaDinasId = null;
    currentStep = 1;

    notaDinasFormState = {
      uploadedFile: null,
      fileName: null,
    };

    const formInputs = [
      "namaPengirim",
      "jabatanPengirim",
      "jenisNaskah",
      "sifatNaskah",
      "nomorNaskah",
      "perihal",
      "tanggalSurat",
      "catatan",
      "ditujukanKepada",
      "tenggatWaktu",
      "catatanTujuan",
    ];

    formInputs.forEach((inputId) => {
      const input = document.getElementById(inputId);
      if (input) {
        if (input.tagName === "SELECT") {
          input.selectedIndex = 0;
        } else {
          input.value = "";
        }
      }
    });

    // Reset file input
    const fileInput = document.getElementById("fileInput");
    if (fileInput) fileInput.value = "";

    const fileInfoDisplay = document.getElementById("fileInfoDisplay");
    const uploadContent = document.getElementById("uploadContent");

    if (fileInfoDisplay) {
      fileInfoDisplay.innerHTML = "";
      fileInfoDisplay.style.display = "none";
    }

    if (uploadContent) {
      uploadContent.style.display = "flex";
    }

    const formTitle = document.getElementById("formMainTitle");
    if (formTitle) {
      formTitle.textContent = "Susun Nota Dinas";
    }

    goToStep(1);

    console.log("✅ Form reset completed");
  }

  // =============================
  // PDF & PRINT FUNCTIONS
  // =============================
  window.downloadPDF = function () {
    if (window.Swal) {
      Swal.fire({
        icon: "info",
        title: "Download PDF",
        text: "Fitur download PDF akan segera tersedia",
        confirmButtonColor: "#7f1d1d",
      });
    } else {
      alert("Fitur download PDF akan segera tersedia");
    }
  };

  window.printSurat = function () {
    window.print();
  };

  // =============================
  // AUTO INIT
  // =============================
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", window.initializePage);
  } else {
    window.initializePage();
  }

  console.log("✅ Nota Dinas Script Loaded");

})();