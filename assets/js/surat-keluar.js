// ========================================
// SURAT KELUAR - PAGE SPECIFIC SCRIPT (FIXED)
// ========================================
(function () {
  "use strict";

  // ========== STATE VARIABLES ==========
  let currentStep = 1;
  let currentPageKeluar = 1;
  const itemsPerPageKeluar = 7;
  let currentSuratKeluarId = null;
  let currentDate = new Date();
  let selectedDate = null;
  let currentPreviewSuratId = null;

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];

  // ========================================
  // INITIALIZATION
  // ========================================
  window.initializeSuratKeluarPage = function () {
    console.log("🚀 Surat Keluar Page Initialized");
    renderTableKeluar();
    initializeCalendarEvents();
    initializeSifatFilter();
    attachGlobalKeluarEvents();
    attachFileUploadEvent();
  };

  // ========================================
  // VIEW MANAGEMENT
  // ========================================
  window.showTambahForm = function () {
    document.getElementById("tableView").style.display = "none";
    document.getElementById("formView").style.display = "block";
    document.getElementById("previewView").style.display = "none";
    
    currentSuratKeluarId = null;
    document.getElementById("formTitle").textContent = "Form Registrasi Surat Keluar";
    
    // Reset form
    const form = document.getElementById("suratKeluarForm");
    if (form) form.reset();
    
    // Reset checkboxes
    document.querySelectorAll('input[name="kepada"]').forEach(cb => {
      cb.checked = false;
    });
    
    // Reset file upload
    const uploadArea = document.getElementById("uploadArea");
    if (uploadArea) {
      uploadArea.classList.remove("has-file");
      document.getElementById("fileInfoDisplay").innerHTML = "";
    }
    window.uploadedFile = null;
    
    // Reset to step 1
    currentStep = 1;
    updateFormStepDisplay();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  window.backToTable = function () {
    document.getElementById("tableView").style.display = "block";
    document.getElementById("formView").style.display = "none";
    document.getElementById("previewView").style.display = "none";
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ========================================
  // DATA & TABLE RENDERING
  // ========================================
  function getSuratKeluarData() {
    let data = KemhanDatabase.getSuratKeluar(false);

    // Apply filters
    const filterText = document.getElementById("searchPerihal")?.value.toLowerCase() || "";
    const filterDate = document.getElementById("selectedDateText")?.dataset.dateValue || "";
    const filterSifat = document.getElementById("selectedSifatText")?.dataset.sifatValue || "";

    return data.filter((surat) => {
      const matchesText = !filterText ||
        surat.perihal.toLowerCase().includes(filterText) ||
        (surat.deskripsi && surat.deskripsi.toLowerCase().includes(filterText));

      const matchesDate = !filterDate ||
        (surat.tanggalSurat && surat.tanggalSurat.includes(filterDate));

      const matchesSifat = !filterSifat || surat.sifatSurat === filterSifat;

      return matchesText && matchesDate && matchesSifat;
    });
  }

  function renderTableKeluar() {
    const data = getSuratKeluarData();
    const tbody = document.getElementById("tableBody");

    if (!tbody) return;

    const startIndex = (currentPageKeluar - 1) * itemsPerPageKeluar;
    const endIndex = startIndex + itemsPerPageKeluar;
    const paginatedData = data.slice(startIndex, endIndex);

    tbody.innerHTML = "";

    if (paginatedData.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #999;">Tidak ada surat keluar yang sesuai dengan filter.</td></tr>';
      updatePaginationInfoKeluar(0);
      return;
    }

    paginatedData.forEach((surat, index) => {
      const row = document.createElement("tr");
      const statusClass = Utils.getStatusClass(surat.status);
      const deskripsi = surat.deskripsi || surat.perihal;

      row.innerHTML = `
        <td style="text-align: center;">${startIndex + index + 1}</td>
        <td>${surat.perihal}</td>
        <td>${deskripsi}</td>
        <td>${surat.sifatSurat}</td>
        <td style="text-align: center;">${surat.noNaskah}</td>
        <td style="text-align: center;"><span class="status ${statusClass}">${surat.status}</span></td>
        <td class="action-icons">
          <i class="bi bi-eye" title="Lihat/Preview" onclick="window.lihatSuratKeluar(${surat.id})"></i>
          <i class="bi bi-trash" title="Hapus" onclick="window.hapusSuratKeluar(${surat.id})"></i>
        </td>
      `;
      tbody.appendChild(row);
    });

    updatePaginationInfoKeluar(data.length);
  }

  function updatePaginationInfoKeluar(totalItems) {
    const startIndex = (currentPageKeluar - 1) * itemsPerPageKeluar + 1;
    const endIndex = Math.min(currentPageKeluar * itemsPerPageKeluar, totalItems);

    const infoElement = document.getElementById("paginationInfo");
    if (infoElement) {
      infoElement.textContent = `Showing ${Math.max(0, startIndex)}-${endIndex} of ${totalItems}`;
    }

    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");
    const maxPage = Math.ceil(totalItems / itemsPerPageKeluar);

    if (prevBtn) prevBtn.disabled = currentPageKeluar === 1;
    if (nextBtn) nextBtn.disabled = currentPageKeluar >= maxPage;
  }

  function attachGlobalKeluarEvents() {
    // Pagination
    document.getElementById("prevBtn")?.addEventListener("click", () => {
      if (currentPageKeluar > 1) {
        currentPageKeluar--;
        renderTableKeluar();
      }
    });

    document.getElementById("nextBtn")?.addEventListener("click", () => {
      const totalItems = getSuratKeluarData().length;
      const maxPage = Math.ceil(totalItems / itemsPerPageKeluar);
      if (currentPageKeluar < maxPage) {
        currentPageKeluar++;
        renderTableKeluar();
      }
    });

    // Search filter
    document.getElementById("searchPerihal")?.addEventListener("input", () => {
      currentPageKeluar = 1;
      renderTableKeluar();
    });

    // Reset filter
    document.getElementById("resetBtn")?.addEventListener("click", () => {
      document.getElementById("searchPerihal").value = "";
      document.getElementById("selectedDateText").textContent = "Tanggal";
      document.getElementById("selectedDateText").dataset.dateValue = "";
      document.getElementById("selectedSifatText").textContent = "Sifat";
      document.getElementById("selectedSifatText").dataset.sifatValue = "";
      selectedDate = null;
      currentPageKeluar = 1;
      renderTableKeluar();
    });
  }

  // ========================================
  // FORM FUNCTIONS
  // ========================================
  window.nextStep = function () {
    if (currentStep === 1) {
      if (!validateSuratKeluarStep1()) return;
      currentStep = 2;
      updateFormStepDisplay();
    } else if (currentStep === 2) {
      if (!validateSuratKeluarStep2()) return;
      updatePreview();
      currentStep = 3;
      updateFormStepDisplay();
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  window.prevStep = function () {
    if (currentStep > 1) {
      currentStep--;
      updateFormStepDisplay();
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  function updateFormStepDisplay() {
    // Hide all step contents
    document.querySelectorAll("#formView .step-content").forEach((el) => {
      el.classList.remove("active");
    });
    
    // Show current step content
    document.getElementById(`step${currentStep}Content`)?.classList.add("active");

    // Update step numbers
    for (let i = 1; i <= 3; i++) {
      const stepNum = document.getElementById(`step${i}Number`);
      if (stepNum) {
        if (i <= currentStep) {
          stepNum.classList.add("active");
          stepNum.classList.remove("inactive");
        } else {
          stepNum.classList.remove("active");
          stepNum.classList.add("inactive");
        }
      }
    }
  }

  function validateSuratKeluarStep1() {
    const required = [
      "jenisSurat", "sifatSurat", "noSurat", 
      "perihal", "tanggalNaskah", "tanggalDiterima",
    ];
    
    for (let id of required) {
      const el = document.getElementById(id);
      if (!el || !el.value.trim()) {
        Notification.error("Mohon lengkapi semua field di Step 1: Detail Isi Naskah.");
        if (el) el.focus();
        return false;
      }
    }
    
    if (!window.uploadedFile && !currentSuratKeluarId) {
      Notification.error("Mohon unggah file naskah.");
      return false;
    }
    
    return true;
  }

  function validateSuratKeluarStep2() {
    const namaPengirim = document.getElementById("namaPengirim");
    const jabatanPengirim = document.getElementById("jabatanPengirim");
    
    if (!namaPengirim || !namaPengirim.value.trim()) {
      Notification.error("Mohon isi Nama Pengirim.");
      if (namaPengirim) namaPengirim.focus();
      return false;
    }
    
    if (!jabatanPengirim || !jabatanPengirim.value.trim()) {
      Notification.error("Mohon isi Jabatan Pengirim.");
      if (jabatanPengirim) jabatanPengirim.focus();
      return false;
    }
    
    // Check if at least one checkbox is selected
    const checkedBoxes = document.querySelectorAll('input[name="kepada"]:checked');
    if (checkedBoxes.length === 0) {
      Notification.error("Mohon pilih minimal 1 tujuan surat (Ditujukan Kepada).");
      return false;
    }
    
    return true;
  }

  function updatePreview() {
    // Detail Isi Naskah
    document.getElementById("previewJenisSurat").textContent = document.getElementById("jenisSurat").value || "-";
    document.getElementById("previewSifatSurat").textContent = document.getElementById("sifatSurat").value || "-";
    document.getElementById("previewNoSurat").textContent = document.getElementById("noSurat").value || "-";
    document.getElementById("previewPerihal").textContent = document.getElementById("perihal").value || "-";
    document.getElementById("previewTanggalNaskah").textContent = Utils.formatDate(document.getElementById("tanggalNaskah").value) || "-";
    document.getElementById("previewTanggalDiterima").textContent = Utils.formatDate(document.getElementById("tanggalDiterima").value) || "-";
    document.getElementById("previewCatatan").textContent = document.getElementById("catatan").value || "-";
    document.getElementById("previewFile").textContent = window.uploadedFile ? window.uploadedFile.name : "-";
    
    // Identitas Pengirim
    document.getElementById("previewNamaPengirim").textContent = document.getElementById("namaPengirim").value || "-";
    document.getElementById("previewJabatanPengirim").textContent = document.getElementById("jabatanPengirim").value || "-";
    
    // Ditujukan Kepada - Get all checked checkboxes
    const checkedBoxes = document.querySelectorAll('input[name="kepada"]:checked');
    const kepadaValues = Array.from(checkedBoxes).map(cb => cb.value);
    document.getElementById("previewDitujukanKepada").textContent = kepadaValues.length > 0 ? kepadaValues.join(", ") : "-";
  }

  window.submitFinalForm = function () {
    // Get checked kepada values
    const checkedBoxes = document.querySelectorAll('input[name="kepada"]:checked');
    const kepadaValues = Array.from(checkedBoxes).map(cb => cb.value);
    
    const newSurat = {
      namaPengirim: document.getElementById("namaPengirim").value,
      jabatanPengirim: document.getElementById("jabatanPengirim").value,
      jenisSurat: document.getElementById("jenisSurat").value,
      sifatSurat: document.getElementById("sifatSurat").value,
      noNaskah: document.getElementById("noSurat").value,
      noSurat: document.getElementById("noSurat").value,
      perihal: document.getElementById("perihal").value,
      tanggalSurat: document.getElementById("tanggalNaskah").value,
      tanggalDiterima: document.getElementById("tanggalDiterima").value,
      catatan: document.getElementById("catatan").value,
      kepada: kepadaValues.join(", "),
      status: "Selesai",
      file: window.uploadedFile ? window.uploadedFile.name : "dokumen.pdf",
      deskripsi: document.getElementById("catatan").value || document.getElementById("perihal").value,
    };

    // Save to database
    const savedSurat = KemhanDatabase.addSuratKeluar(newSurat);
    
    console.log("✅ Surat Keluar berhasil ditambahkan:", savedSurat);
    
    // Show success message
    window.loadSwal(() => {
      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        html: `<p>Surat Keluar "<strong>${newSurat.perihal}</strong>" berhasil ditambahkan!</p>`,
        confirmButtonText: "OK",
        confirmButtonColor: "#8b0000",
        timer: 3000,
        timerProgressBar: true,
      }).then(() => {
        // Back to table and refresh
        backToTable();
        renderTableKeluar();
      });
    });
  };

  // ========================================
  // CRUD ACTIONS
  // ========================================
  window.lihatSuratKeluar = function (id) {
    const data = getSuratKeluarData();
    const surat = data.find((s) => s.id === id);
    
    if (surat) {
      currentPreviewSuratId = id;
      showPreviewView(surat);
    } else {
      Notification.error("Surat tidak ditemukan untuk dilihat.");
    }
  };

  function showPreviewView(surat) {
    document.getElementById("tableView").style.display = "none";
    document.getElementById("formView").style.display = "none";
    document.getElementById("previewView").style.display = "block";

    // Fill preview data
    document.getElementById("previewDocTitle").textContent = surat.perihal || "-";
    document.getElementById("detailTanggalTerima").textContent = Utils.formatDate(surat.tanggalDiterima) || "-";
    document.getElementById("detailNoSurat").textContent = surat.noSurat || surat.noNaskah || "-";
    document.getElementById("detailTanggalSurat").textContent = Utils.formatDate(surat.tanggalSurat) || "-";
    document.getElementById("detailDari").textContent = surat.dari || surat.namaPengirim || "-";
    document.getElementById("detailKepada").textContent = surat.kepada || "-";
    document.getElementById("detailPerihal").textContent = surat.perihal || "-";
    document.getElementById("detailLampiran").textContent = surat.file || "-";
    document.getElementById("detailSifat").textContent = surat.sifatSurat || "-";
    document.getElementById("detailJenisNaskah").textContent = surat.jenisSurat || "-";
    document.getElementById("detailCatatan").textContent = surat.catatan || surat.deskripsi || "-";
    document.getElementById("detailDientryOleh").textContent = surat.jabatanPengirim || "-";

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  window.hapusFromPreview = function() {
    if (currentPreviewSuratId) {
      hapusSuratKeluar(currentPreviewSuratId);
    }
  };

  window.submitDisposisi = function () {
    const disposisiItems = [];
    const checkboxes = document.querySelectorAll('.checkbox-item input[type="checkbox"]:checked');
    checkboxes.forEach(cb => {
      const label = cb.parentElement.querySelector('span').textContent;
      disposisiItems.push(label);
    });

    const keterangan = document.getElementById("disposisiKeterangan").value;
    const kepada = document.getElementById("disposisiKepada").value;

    if (disposisiItems.length === 0 && !keterangan) {
      Notification.error("Pilih minimal satu tindakan disposisi atau isi keterangan");
      return;
    }

    if (!kepada) {
      Notification.error("Pilih tujuan disposisi");
      return;
    }

    Notification.success("Disposisi berhasil dikirim!");
    
    // Reset form
    document.querySelectorAll('.checkbox-item input[type="checkbox"]').forEach(cb => {
      cb.checked = false;
    });
    document.getElementById("disposisiKeterangan").value = "";
    document.getElementById("disposisiKepada").value = "";
  };

  window.hapusSuratKeluar = function (id) {
    window.loadSwal(() => {
      Notification.confirm(
        "Apakah Anda yakin ingin menghapus surat ini? Surat akan dipindahkan ke Surat Dihapus.",
        () => {
          const deleted = KemhanDatabase.deleteSurat(id, "keluar");
          if (deleted) {
            Notification.success(
              `Surat ${deleted.noNaskah || deleted.noSurat} berhasil dipindahkan ke Surat Dihapus!`
            );
            
            // If in preview view, go back to table
            const previewView = document.getElementById("previewView");
            if (previewView && previewView.style.display !== "none") {
              backToTable();
            }
            
            renderTableKeluar();
            currentPreviewSuratId = null;
            
            // Refresh other views if available
            if (window.loadMonitoringData) window.loadMonitoringData();
            if (window.loadDeletedData) window.loadDeletedData();
          } else {
            Notification.error("Gagal menghapus surat!");
          }
        }
      );
    });
  };

  // ========================================
  // FILTER: SIFAT
  // ========================================
  function initializeSifatFilter() {
    const sifatBtn = document.getElementById("sifatFilterBtn");
    const sifatModal = document.getElementById("sifatModal");
    const selectedSifatText = document.getElementById("selectedSifatText");

    document.addEventListener("click", (e) => {
      if (!sifatBtn?.contains(e.target) && !sifatModal?.contains(e.target)) {
        sifatModal?.classList.remove("active");
      }
    });

    sifatBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      const rect = sifatBtn.getBoundingClientRect();
      sifatModal.style.top = `${rect.bottom + 8}px`;
      sifatModal.style.left = `${rect.left}px`;
      sifatModal.classList.toggle("active");

      const currentValue = selectedSifatText.dataset.sifatValue || "";
      document.querySelectorAll("#sifatModal .sifat-option").forEach((opt) => {
        opt.classList.remove("selected");
        if (opt.dataset.value === currentValue) {
          opt.classList.add("selected");
        }
      });
    });

    document.querySelectorAll("#sifatModal .sifat-option").forEach((opt) => {
      opt.addEventListener("click", function (e) {
        e.stopPropagation();
        document.querySelectorAll("#sifatModal .sifat-option").forEach((b) => 
          b.classList.remove("selected")
        );
        this.classList.add("selected");
      });
    });

    document.getElementById("applySifat")?.addEventListener("click", function () {
      const selectedOption = document.querySelector("#sifatModal .sifat-option.selected");
      if (selectedOption) {
        const value = selectedOption.dataset.value;
        const text = value === "" ? "Sifat" : value;
        selectedSifatText.textContent = text;
        selectedSifatText.dataset.sifatValue = value;
        sifatModal.classList.remove("active");
        currentPageKeluar = 1;
        renderTableKeluar();
      } else {
        Notification.error("Pilih salah satu sifat!");
      }
    });
  }

  // ========================================
  // FILTER: CALENDAR
  // ========================================
  function generateCalendar(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

    const calendarDays = document.getElementById("calendarDays");
    if (!calendarDays) return;
    calendarDays.innerHTML = "";

    const calendarMonthEl = document.getElementById("calendarMonth");
    if (calendarMonthEl) calendarMonthEl.textContent = `${monthNames[month]} ${year}`;

    for (let i = 0; i < startingDayOfWeek; i++) {
      const emptyDay = document.createElement("button");
      emptyDay.className = "calendar-day empty";
      calendarDays.appendChild(emptyDay);
    }

    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const dayButton = document.createElement("button");
      dayButton.className = "calendar-day";
      dayButton.textContent = day;

      if (year === today.getFullYear() && 
          month === today.getMonth() && 
          day === today.getDate()) {
        dayButton.classList.add("today");
      }

      if (selectedDate && 
          selectedDate.getFullYear() === year && 
          selectedDate.getMonth() === month && 
          selectedDate.getDate() === day) {
        dayButton.classList.add("selected");
      }

      dayButton.addEventListener("click", function () {
        document.querySelectorAll(".calendar-day").forEach((d) => {
          d.classList.remove("selected");
        });
        this.classList.add("selected");
        selectedDate = new Date(year, month, day);
      });

      calendarDays.appendChild(dayButton);
    }
  }

  function initializeCalendarEvents() {
    const datePickerBtn = document.getElementById("datePickerBtn");
    const calendarModal = document.getElementById("calendarModal");
    const prevMonthBtn = document.getElementById("prevMonth");
    const nextMonthBtn = document.getElementById("nextMonth");
    const applyDateBtn = document.getElementById("applyDate");
    const selectedDateText = document.getElementById("selectedDateText");

    if (!datePickerBtn || !calendarModal || !prevMonthBtn || 
        !nextMonthBtn || !applyDateBtn || !selectedDateText) return;

    const initialDateValue = selectedDateText.dataset.dateValue;
    if (initialDateValue) {
      currentDate = new Date(initialDateValue);
      selectedDate = new Date(initialDateValue);
      selectedDateText.textContent = Utils.formatDate(initialDateValue);
    } else {
      selectedDateText.textContent = "Tanggal";
      selectedDate = null;
    }

    datePickerBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      const rect = datePickerBtn.getBoundingClientRect();
      calendarModal.style.top = `${rect.bottom + 8}px`;
      calendarModal.style.left = `${rect.left}px`;
      calendarModal.classList.add("active");

      generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
    });

    calendarModal.addEventListener("click", function (e) {
      if (e.target === this) {
        this.classList.remove("active");
      }
    });

    prevMonthBtn.addEventListener("click", function () {
      currentDate.setMonth(currentDate.getMonth() - 1);
      generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
    });

    nextMonthBtn.addEventListener("click", function () {
      currentDate.setMonth(currentDate.getMonth() + 1);
      generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
    });

    applyDateBtn.addEventListener("click", function () {
      if (selectedDate) {
        const dateISO = selectedDate.toISOString().split("T")[0];
        const formatted = Utils.formatDate(dateISO);

        selectedDateText.textContent = formatted;
        selectedDateText.dataset.dateValue = dateISO;
        calendarModal.classList.remove("active");
        currentPageKeluar = 1;
        renderTableKeluar();
      } else {
        Notification.error("Silakan pilih tanggal terlebih dahulu!");
      }
    });
  }

  // ========================================
  // FILE UPLOAD
  // ========================================
  function attachFileUploadEvent() {
    const fileInput = document.getElementById("fileInput");
    if (fileInput) {
      fileInput.addEventListener("change", window.handleFileUpload);
    }
  }
})();