// =============================
// NOTA DINAS - PAGE SPECIFIC (FIXED)
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

  // Global Nota Dinas Form Data State
  let notaDinasFormState = {};

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

    loadNotaDinasData();
    setupNotaDinasFilters();
    setupCalendar();
    setupDisposisiView();
    setupPagination();
    setupFormNavigation();
    setupBackToTableView();
    setupPopupOutsideClick();

    resetNotaDinasForm();
  };

  // =============================
  // LOAD DATA FROM DATABASE
  // =============================
  function loadNotaDinasData() {
    console.log("🔄 Loading Nota Dinas Data...");

    try {
      notaDinasData = KemhanDatabase.getNotaDinas
        ? KemhanDatabase.getNotaDinas()
        : [];

      console.log("📄 Total Nota Dinas:", notaDinasData.length);

      if (notaDinasData.length === 0) {
        console.log("⚠️ Data kosong, mencoba inisialisasi data...");
        KemhanDatabase.initializeDummyData();
        notaDinasData = KemhanDatabase.getNotaDinas();
        console.log("📄 Setelah inisialisasi:", notaDinasData.length);
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

      const tanggalTerima =
        item.tanggalTerima || item.tanggalDiterima || item.createdAt;

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
      const dari = item.dari || item.pengirim || "-";
      const kepada = item.kepada || item.tujuan || "-";

      row.innerHTML = `
           <td style="text-align: center;">${rowNumber}</td>
           <td>${formattedDate}</td>
           <td>${noSurat}</td>
           <td>${perihal}</td>
           <td>${dari}</td>
           <td>${kepada}</td>
           <td>
             <div class="action-buttons">
               <button class="btn-disposisi" onclick="showDisposisiNotaDinas(${item.id})">
                 <i class="bi bi-send-fill"></i> Disposisi
               </button>
               <button class="btn-delete" onclick="hapusNotaDinas(${item.id})">
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
  // BACK TO TABLE VIEW - FIXED
  // =============================
  window.backToTableView = function () {
    console.log("🔙 Executing backToTableView...");

    const tableView = document.getElementById("tableView");
    const formView = document.getElementById("formView");
    const disposisiView = document.getElementById("disposisiView");
    const successPopup = document.getElementById("successPopup");

    // Sembunyikan semua view lainnya
    if (formView) {
      formView.classList.remove("active");
      console.log("✅ Form view hidden");
    }
    if (disposisiView) {
      disposisiView.classList.remove("active");
      console.log("✅ Disposisi view hidden");
    }
    if (successPopup) {
      successPopup.classList.remove("active");
      console.log("✅ Success popup hidden");
    }

    // Tampilkan table view
    if (tableView) {
      tableView.classList.remove("hidden");
      console.log("✅ Table view shown");
    }

    // Reset form dan disposisi
    resetNotaDinasForm();
    resetDisposisiForm();

    // Reload data terbaru
    loadNotaDinasData();

    // Scroll ke atas
    window.scrollTo({ top: 0, behavior: "smooth" });

    console.log("✅ Back to table view completed");
  };

  function setupBackToTableView() {
    console.log("🔧 Setting up back to table view buttons...");

    // Tombol Back di Form Tambah Baru
    const backBtnForm = document.getElementById("backToTableViewForm");
    if (backBtnForm) {
      console.log("✅ Found backToTableViewForm button");
      
      // Clone node untuk menghapus semua event listener lama
      const newBackBtnForm = backBtnForm.cloneNode(true);
      backBtnForm.parentNode.replaceChild(newBackBtnForm, backBtnForm);
      
      // Tambah event listener baru
      newBackBtnForm.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        console.log("🔙 Back button form clicked");
        window.backToTableView();
      });
    } else {
      console.warn("⚠️ Tombol backToTableViewForm tidak ditemukan");
    }

    // Setup tombol back di disposisi view
    const backToTable = document.getElementById("backToTable");
    if (backToTable) {
      console.log("✅ Found backToTable button");
      
      // Clone node untuk menghapus semua event listener lama
      const newBackToTable = backToTable.cloneNode(true);
      backToTable.parentNode.replaceChild(newBackToTable, backToTable);
      
      // Tambah event listener baru
      newBackToTable.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        console.log("🔙 Back button disposisi clicked");
        window.backToTableView();
      });
    } else {
      console.warn("⚠️ Tombol backToTable tidak ditemukan");
    }

    console.log("✅ Back to table view buttons setup completed");
  }

  // =============================
  // SHOW DISPOSISI VIEW
  // =============================
  window.showDisposisiNotaDinas = function (id) {
    console.log("📋 Show Disposisi for Nota Dinas ID:", id);

    currentNotaDinasId = id;

    const notaDinas = KemhanDatabase.getNotaDinasById
      ? KemhanDatabase.getNotaDinasById(id)
      : null;

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

    const tanggalTerima =
      notaDinas.tanggalTerima ||
      notaDinas.tanggalDiterima ||
      notaDinas.createdAt;
    const formattedTanggalTerima = formatDate(tanggalTerima);

    const tanggalSurat =
      notaDinas.tanggalSurat || notaDinas.tanggalNaskah || notaDinas.createdAt;
    const formattedTanggalSurat = formatDate(tanggalSurat);

    const setTextContent = (id, value) => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = value || "-";
      } else {
        console.warn(`Element ${id} not found`);
      }
    };

    setTextContent("detailTanggalTerima", formattedTanggalTerima);
    setTextContent(
      "detailNoSurat",
      notaDinas.noSurat || notaDinas.noNaskah || "-"
    );
    setTextContent("detailTanggalSurat", formattedTanggalSurat);
    setTextContent("detailDari", notaDinas.dari || notaDinas.pengirim || "-");
    setTextContent("detailKepada", notaDinas.kepada || notaDinas.tujuan || "-");
    setTextContent("detailPerihal", notaDinas.perihal || "-");
    setTextContent(
      "detailLampiran",
      notaDinas.lampiran || notaDinas.namaFile || notaDinas.file || "-"
    );
    setTextContent(
      "detailSifat",
      notaDinas.sifat || notaDinas.sifatNaskah || "Umum"
    );
    setTextContent(
      "detailJenisNaskah",
      notaDinas.jenisNaskah || notaDinas.jenisSurat || "Nota Dinas"
    );
    setTextContent("detailCatatan", notaDinas.catatan || "-");
    setTextContent(
      "detailDientry",
      notaDinas.diEntryOleh || notaDinas.namaPengirim || "Admin"
    );
    setTextContent("detailPreviewTitle", notaDinas.perihal || "Nota Dinas");

    // Reset form disposisi
    resetDisposisiForm();

    const tableView = document.getElementById("tableView");
    const disposisiView = document.getElementById("disposisiView");

    if (tableView) tableView.classList.add("hidden");
    if (disposisiView) disposisiView.classList.add("active");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // =============================
  // KIRIM DISPOSISI - FIXED
  // =============================
  function kirimDisposisi() {
    console.log("📤 Kirim disposisi for Nota Dinas ID:", currentNotaDinasId);

    if (!currentNotaDinasId) {
      if (window.Swal) {
        Swal.fire({
          icon: "error",
          title: "Error!",
          text: "Nota dinas tidak ditemukan!",
          confirmButtonColor: "#7f1d1d",
        });
      } else {
        alert("Nota dinas tidak ditemukan!");
      }
      return;
    }

    const selectedOptions = [];
    document
      .querySelectorAll(".disposisi-checkbox input:checked")
      .forEach((cb) => {
        selectedOptions.push(cb.nextElementSibling.textContent.trim());
      });

    const keterangan =
      document.getElementById("keteranganDisposisi")?.value || "";
    const kepada = document.getElementById("kepadaDisposisi")?.value || "";

    if (selectedOptions.length === 0) {
      if (window.Swal) {
        Swal.fire({
          icon: "warning",
          title: "Perhatian!",
          text: "Pilih minimal satu tindak lanjut!",
          confirmButtonColor: "#7f1d1d",
        });
      } else {
        alert("Pilih minimal satu tindak lanjut!");
      }
      return;
    }

    if (!kepada) {
      if (window.Swal) {
        Swal.fire({
          icon: "warning",
          title: "Perhatian!",
          text: "Pilih penerima disposisi!",
          confirmButtonColor: "#7f1d1d",
        });
      } else {
        alert("Pilih penerima disposisi!");
      }
      return;
    }

    const disposisiData = {
      tindakLanjut: selectedOptions,
      keterangan: keterangan,
      kepada: kepada,
      tanggalDisposisi: new Date().toISOString(),
      dari: "Admin",
    };

    const success = KemhanDatabase.addDisposisiToNotaDinas
      ? KemhanDatabase.addDisposisiToNotaDinas(
          currentNotaDinasId,
          disposisiData
        )
      : false;

    if (success) {
      if (window.Swal) {
        Swal.fire({
          icon: "success",
          title: "Berhasil!",
          text: "Disposisi berhasil dikirim!",
          confirmButtonColor: "#7f1d1d",
          timer: 2000,
        }).then(() => {
          window.backToTableView();
        });
      } else {
        alert("Disposisi berhasil dikirim!");
        window.backToTableView();
      }
    } else {
      if (window.Swal) {
        Swal.fire({
          icon: "error",
          title: "Gagal!",
          text: "Gagal mengirim disposisi!",
          confirmButtonColor: "#7f1d1d",
        });
      } else {
        alert("Gagal mengirim disposisi!");
      }
    }
  }

  // Expose kirimDisposisi ke global scope
  window.kirimDisposisi = kirimDisposisi;

  // =============================
  // SETUP DISPOSISI VIEW - FIXED
  // =============================
  function setupDisposisiView() {
    const kirimBtn = document.getElementById("kirimDisposisiBtn");
    if (kirimBtn) {
      // Clone untuk hapus event listener lama
      const newKirimBtn = kirimBtn.cloneNode(true);
      kirimBtn.parentNode.replaceChild(newKirimBtn, kirimBtn);
      
      newKirimBtn.addEventListener("click", function (e) {
        e.preventDefault();
        window.kirimDisposisi();
      });
      console.log("✅ Kirim Disposisi button setup");
    }
  }

  // =============================
  // DELETE NOTA DINAS & UTILS
  // =============================
  window.hapusNotaDinas = function (id) {
    const confirmDelete = () => {
      const deleted = KemhanDatabase.deleteSurat
        ? KemhanDatabase.deleteSurat(id, "nota-dinas")
        : false;

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
            if (window.loadNotifications) window.loadNotifications();
          });
        } else {
          alert("Nota dinas berhasil dihapus!");
          loadNotaDinasData();
          if (window.loadNotifications) window.loadNotifications();
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
    };

    if (window.Swal) {
      Swal.fire({
        title: "Hapus Nota Dinas?",
        text: "Nota dinas akan dipindahkan ke Surat Dihapus.",
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

  window.hapusSuratFromDetail = function () {
    if (currentNotaDinasId) {
      hapusNotaDinas(currentNotaDinasId);
    }
  };

  window.downloadPDF = function () {
    if (window.Swal) {
      Swal.fire({
        icon: "info",
        title: "Download PDF",
        text: "Fitur download akan segera tersedia",
        confirmButtonColor: "#7f1d1d",
      });
    } else {
      alert("Fitur download akan segera tersedia");
    }
  };

  window.printSurat = function () {
    if (window.Swal) {
      Swal.fire({
        icon: "info",
        title: "Print Surat",
        text: "Fitur print akan segera tersedia",
        confirmButtonColor: "#7f1d1d",
      });
    } else {
      alert("Fitur print akan segera tersedia");
    }
  };

  function resetDisposisiForm() {
    document.querySelectorAll(".disposisi-checkbox input").forEach((cb) => {
      cb.checked = false;
    });

    const keteranganInput = document.getElementById("keteranganDisposisi");
    const kepadaSelect = document.getElementById("kepadaDisposisi");

    if (keteranganInput) keteranganInput.value = "";
    if (kepadaSelect) kepadaSelect.selectedIndex = 0;
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
  // CALENDAR FUNCTIONS
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
  // TAMBAH BARU (Form Activation)
  // =============================
  window.tambahSurat = function () {
    const tableView = document.getElementById("tableView");
    const formView = document.getElementById("formView");

    if (tableView) tableView.classList.add("hidden");
    if (formView) formView.classList.add("active");

    resetNotaDinasForm();
    goToStep(1);

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // =============================
  // FORM STEP NAVIGATION
  // =============================
  function setupFormNavigation() {
    // Fungsi dipanggil saat initializePage
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
        alert(
          `Mohon lengkapi kolom ${
            document.querySelector(`label[for="${field}"]`)?.textContent ||
            field
          }!`
        );
        input.focus();
        return false;
      }
    }

    const fileInput = document.getElementById("fileInput");
    if (!fileInput.files[0]) {
      alert("Mohon unggah File Naskah (PDF/Gambar).");
      return false;
    }

    return true;
  }

  function validateStep2() {
    const fields = [
      "ditujukanKepada",
      "instruksi",
      "tenggatWaktu",
      "catatanTujuan",
    ];
    for (const field of fields) {
      const input = document.getElementById(field);
      if (input && !input.value.trim()) {
        alert(
          `Mohon lengkapi kolom ${
            document.querySelector(`label[for="${field}"]`)?.textContent ||
            field
          }!`
        );
        input.focus();
        return false;
      }
    }
    return true;
  }

  function saveStep1Data() {
    notaDinasFormState = {
      ...notaDinasFormState,
      namaPengirim: document.getElementById("namaPengirim").value,
      jabatanPengirim: document.getElementById("jabatanPengirim").value,
      jenisNaskah: document.getElementById("jenisNaskah").value,
      sifatNaskah: document.getElementById("sifatNaskah").value,
      nomorNaskah: document.getElementById("nomorNaskah").value,
      perihal: document.getElementById("perihal").value,
      tanggalSurat: document.getElementById("tanggalSurat").value,
      catatan: document.getElementById("catatan").value,
      file: window.uploadedFile ? window.uploadedFile.name : null,
    };
  }

  function saveStep2Data() {
    notaDinasFormState = {
      ...notaDinasFormState,
      ditujukanKepada: document.getElementById("ditujukanKepada").value,
      instruksi: document.getElementById("instruksi").value,
      tenggatWaktu: document.getElementById("tenggatWaktu").value,
      catatanTujuan: document.getElementById("catatanTujuan").value,
    };
  }

  function updatePreview() {
    const formatDate = (dateString) => {
      if (!dateString) return "-";
      const date = new Date(dateString);
      return date.toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
        day: "2-digit",
      });
    };

    document.getElementById("previewNamaPengirim").textContent =
      notaDinasFormState.namaPengirim || "-";
    document.getElementById("previewJabatanPengirim").textContent =
      notaDinasFormState.jabatanPengirim || "-";
    document.getElementById("previewJenisNaskah").textContent =
      notaDinasFormState.jenisNaskah || "-";
    document.getElementById("previewSifatNaskah").textContent =
      notaDinasFormState.sifatNaskah || "-";
    document.getElementById("previewNomorNaskah").textContent =
      notaDinasFormState.nomorNaskah || "-";
    document.getElementById("previewPerihal").textContent =
      notaDinasFormState.perihal || "-";
    document.getElementById("previewTanggalSurat").textContent =
      formatDate(notaDinasFormState.tanggalSurat) || "-";
    document.getElementById("previewCatatan").textContent =
      notaDinasFormState.catatan || "-";
    document.getElementById("previewTujuan").textContent =
      notaDinasFormState.ditujukanKepada || "-";
    document.getElementById("previewInstruksi").textContent =
      notaDinasFormState.instruksi || "-";
    document.getElementById("previewTenggatWaktu").textContent =
      formatDate(notaDinasFormState.tenggatWaktu) || "-";
    document.getElementById("previewCatatanTujuan").textContent =
      notaDinasFormState.catatanTujuan || "-";

    const popupNote = document.querySelector(".popup-note");
    if (popupNote)
      popupNote.textContent =
        notaDinasFormState.catatan || "Siapkan tempat dan undangan";
  }

  function resetNotaDinasForm() {
    notaDinasFormState = {};
    currentStep = 1;
    document.getElementById("namaPengirim").value = "";
    document.getElementById("jabatanPengirim").value = "";
    document.getElementById("jenisNaskah").selectedIndex = 0;
    document.getElementById("sifatNaskah").selectedIndex = 0;
    document.getElementById("nomorNaskah").value = "";
    document.getElementById("perihal").value = "";
    document.getElementById("tanggalSurat").value = "";
    document.getElementById("catatan").value = "";
    document.getElementById("ditujukanKepada").selectedIndex = 0;
    document.getElementById("instruksi").value = "";
    document.getElementById("tenggatWaktu").value = "";
    document.getElementById("catatanTujuan").value = "";

    const uploadArea = document.getElementById("uploadArea");
    const fileInput = document.getElementById("fileInput");
    if (uploadArea) uploadArea.classList.remove("has-file");
    if (fileInput) fileInput.value = "";
    window.uploadedFile = null;
  }

  // =============================
  // SUBMIT (Step 3)
  // =============================
  window.submitNotaDinas = function () {
    if (!validateStep1() || !validateStep2()) {
      alert("Data form belum lengkap!");
      return;
    }

    const notaDinasDataForDB = {
      noSurat: notaDinasFormState.nomorNaskah,
      tanggalSurat: notaDinasFormState.tanggalSurat,
      tanggalTerima: new Date().toISOString().substring(0, 10),
      perihal: notaDinasFormState.perihal,
      dari: notaDinasFormState.namaPengirim,
      kepada: notaDinasFormState.ditujukanKepada,
      sifat: notaDinasFormState.sifatNaskah,
      jenisNaskah: notaDinasFormState.jenisNaskah,
      lampiran: notaDinasFormState.file,
      catatan: notaDinasFormState.catatan,
      diEntryOleh: "Staff TU Puslapbinkunhan",
      namaPengirim: notaDinasFormState.namaPengirim,
      jabatanPengirim: notaDinasFormState.jabatanPengirim,
      tujuan: notaDinasFormState.ditujukanKepada,
      instruksi: notaDinasFormState.instruksi,
      tenggatWaktu: notaDinasFormState.tenggatWaktu,
      catatanTujuan: notaDinasFormState.catatanTujuan,
    };

    const newNotaDinas = KemhanDatabase.addNotaDinas(notaDinasDataForDB);

    if (newNotaDinas) {
      showSuccessPopup();
    } else {
      Notification.error("Gagal menambahkan Nota Dinas ke database.");
    }
  };

  // =============================
  // SUCCESS POPUP CONTROLS
  // =============================
  function setupPopupOutsideClick() {
    const successPopup = document.getElementById("successPopup");
    if (successPopup) {
      successPopup.addEventListener("click", function (e) {
        if (e.target === successPopup) {
          window.closeSuccessPopupAndBack();
        }
      });
    }
  }

  function showSuccessPopup() {
    document.getElementById("formView").classList.remove("active");
    document.getElementById("successPopup").classList.add("active");
  }

  window.closeSuccessPopupAndBack = function () {
    const successPopup = document.getElementById("successPopup");
    if (successPopup) successPopup.classList.remove("active");
    window.backToTableView();
  };

  // =============================
  // AUTO INIT ON PAGE LOAD
  // =============================
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", window.initializePage);
  } else {
    window.initializePage();
  }

  console.log("✅ Nota Dinas Script Loaded");
})();