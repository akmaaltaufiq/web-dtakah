// =============================
// SURAT MASUK - PAGE SPECIFIC
// =============================
(function () {
  "use strict";

  // Local variables untuk halaman ini saja
  let currentStep = 1;
  let currentPage = 1;
  const itemsPerPage = 6;
  let currentDetailId = null;

  // =============================
  // INITIALIZATION
  // =============================
  window.initializePage = function () {
    console.log("Surat Masuk Page Initialized");

    // Check hash untuk detail view
    const urlHash = window.location.hash;
    if (urlHash.startsWith("#detail-")) {
      const parts = urlHash.split("-");
      const suratId = parseInt(parts[1]);
      setTimeout(() => lihatSurat(suratId), 100);
    } else {
      renderTable();
    }

    setupEventListeners();
  };

  // =============================
  // EVENT LISTENERS
  // =============================
  function setupEventListeners() {
    const fileInput = document.getElementById("fileInput");
    if (fileInput) {
      fileInput.addEventListener("change", window.handleFileUpload);
    }

    const tableSearch = document.getElementById("tableSearch");
    if (tableSearch) {
      tableSearch.addEventListener("input", handleSearch);
    }

    const suratForm = document.getElementById("suratForm");
    if (suratForm) {
      suratForm.addEventListener("submit", handleSubmit);
    }
  }

  // =============================
  // STEP NAVIGATION
  // =============================
  window.nextStep = function () {
    if (currentStep === 1) {
      if (!validateStep1()) return;
      currentStep = 2;
    } else if (currentStep === 2) {
      if (!validateStep2()) return;
      loadPreview();
      currentStep = 3;
    }
    updateStepDisplay();
  };

  window.prevStep = function () {
    if (currentStep > 1) {
      currentStep--;
      updateStepDisplay();
    }
  };

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
        Notification.error("Mohon lengkapi semua field yang bertanda *");
        if (el) el.focus();
        return false;
      }
    }

    if (!window.uploadedFile) {
      Notification.error("Mohon upload file terlebih dahulu");
      return false;
    }

    return true;
  }

  function validateStep2() {
    const checkboxes = document.querySelectorAll('input[name="kepada"]:checked');
    if (checkboxes.length === 0) {
      Notification.error("Mohon pilih minimal 1 tujuan penerima");
      return false;
    }
    return true;
  }

  function updateStepDisplay() {
    document.querySelectorAll(".step-content").forEach((el) => {
      el.classList.remove("active");
    });

    const currentContent = document.getElementById(`step${currentStep}Content`);
    if (currentContent) {
      currentContent.classList.add("active");
    }

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

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function loadPreview() {
    const fields = {
      previewNamaPengirim: "namaPengirim",
      previewJabatan: "jabatanPengirim",
      previewJenis: "jenisSurat",
      previewSifat: "sifatSurat",
      previewNoSurat: "noSurat",
      previewPerihal: "perihal",
    };

    for (let previewId in fields) {
      const inputId = fields[previewId];
      const inputEl = document.getElementById(inputId);
      const previewEl = document.getElementById(previewId);

      if (inputEl && previewEl) {
        previewEl.textContent = inputEl.value || "-";
      }
    }

    // Handle Kepada (multiple checkboxes)
    const kepadaCheckboxes = document.querySelectorAll('input[name="kepada"]:checked');
    const kepadaValues = Array.from(kepadaCheckboxes).map(cb => cb.value);
    const previewKepada = document.getElementById("previewKepada");
    if (previewKepada) {
      previewKepada.textContent = kepadaValues.length > 0 ? kepadaValues.join(", ") : "-";
    }

    const tanggalSurat = document.getElementById("tanggalSurat");
    const tanggalDiterima = document.getElementById("tanggalDiterima");

    if (tanggalSurat) {
      document.getElementById("previewTanggalSurat").textContent =
        Utils.formatDate(tanggalSurat.value);
    }

    if (tanggalDiterima) {
      document.getElementById("previewTanggalDiterima").textContent =
        Utils.formatDate(tanggalDiterima.value);
    }

    document.getElementById("previewFile").textContent = window.uploadedFile
      ? window.uploadedFile.name
      : "-";
  }

  // =============================
  // FORM SUBMIT
  // =============================
  function handleSubmit(e) {
    e.preventDefault();

    // Get selected "Kepada" values
    const kepadaCheckboxes = document.querySelectorAll('input[name="kepada"]:checked');
    const kepadaValues = Array.from(kepadaCheckboxes).map(cb => cb.value);

    const newSurat = {
      tanggalDiterima: document.getElementById("tanggalDiterima").value,
      tanggalSurat: document.getElementById("tanggalSurat").value,
      noSurat: document.getElementById("noSurat").value,
      perihal: document.getElementById("perihal").value,
      dari: document.getElementById("namaPengirim").value,
      kepada: kepadaValues.join(", "), // Join multiple recipients
      jenisSurat: document.getElementById("jenisSurat").value,
      sifatSurat: document.getElementById("sifatSurat").value,
      file: window.uploadedFile ? window.uploadedFile.name : "dokumen.pdf",
      status: "Pending",
      namaPengirim: document.getElementById("namaPengirim").value,
      jabatanPengirim: document.getElementById("jabatanPengirim").value,
      catatan: document.getElementById("catatan").value,
      disposisi: [],
    };

    const savedSurat = KemhanDatabase.addSuratMasuk(newSurat);

    Notification.success(
      `Surat Masuk (${savedSurat.noSurat}) Berhasil Disimpan!`
    );

    document.querySelectorAll(".step-content").forEach((el) => {
      el.classList.remove("active");
    });

    const successContent = document.getElementById("successContent");
    if (successContent) {
      successContent.classList.add("active");
    }

    setTimeout(() => {
      closeForm();
    }, 2000);
  }

  // =============================
  // VIEW MANAGEMENT
  // =============================
  window.showTambahForm = function () {
    const listView = document.getElementById("listViewContainer");
    const formView = document.getElementById("formViewContainer");
    const detailView = document.getElementById("detailPreviewView");
    const disposisiView = document.getElementById("disposisiView");

    if (listView) listView.classList.add("hidden");
    if (formView) formView.classList.add("active");
    if (detailView) detailView.classList.remove("active");
    if (disposisiView) disposisiView.classList.remove("active");

    currentStep = 1;
    window.uploadedFile = null;

    const form = document.getElementById("suratForm");
    if (form) form.reset();

    const uploadArea = document.getElementById("uploadArea");
    if (uploadArea) uploadArea.classList.remove("has-file");

    const fileInfoDisplay = document.getElementById("fileInfoDisplay");
    if (fileInfoDisplay) fileInfoDisplay.innerHTML = "";

    const fileInput = document.getElementById("fileInput");
    if (fileInput) fileInput.value = "";

    // Uncheck all kepada checkboxes
    document.querySelectorAll('input[name="kepada"]').forEach(cb => {
      cb.checked = false;
    });

    updateStepDisplay();
  };

  window.closeForm = function () {
    const formView = document.getElementById("formViewContainer");
    const listView = document.getElementById("listViewContainer");

    if (formView) formView.classList.remove("active");
    if (listView) listView.classList.remove("hidden");

    // Reset form dan file upload
    const form = document.getElementById("suratForm");
    if (form) form.reset();

    const uploadArea = document.getElementById("uploadArea");
    if (uploadArea) uploadArea.classList.remove("has-file");

    const fileInfoDisplay = document.getElementById("fileInfoDisplay");
    if (fileInfoDisplay) fileInfoDisplay.innerHTML = "";

    const fileInput = document.getElementById("fileInput");
    if (fileInput) fileInput.value = "";

    window.uploadedFile = null;

    // Uncheck all kepada checkboxes
    document.querySelectorAll('input[name="kepada"]').forEach(cb => {
      cb.checked = false;
    });

    renderTable();
  };

  window.showListView = function () {
    const listView = document.getElementById("listViewContainer");
    const formView = document.getElementById("formViewContainer");
    const detailView = document.getElementById("detailPreviewView");
    const disposisiView = document.getElementById("disposisiView");

    if (listView) listView.classList.remove("hidden");
    if (formView) formView.classList.remove("active");
    if (detailView) detailView.classList.remove("active");
    if (disposisiView) disposisiView.classList.remove("active");

    renderTable();
  };

  // =============================
  // TABLE RENDERING
  // =============================
  function renderTable() {
    const data = KemhanDatabase.getSuratMasuk(false);
    const tbody = document.getElementById("tableBody");

    if (!tbody) return;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = data.slice(startIndex, endIndex);

    tbody.innerHTML = "";

    if (paginatedData.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #999;">Tidak ada surat masuk baru (pending).</td></tr>';
      return;
    }

    paginatedData.forEach((surat, index) => {
      const row = document.createElement("tr");
      const tanggalDiterimaFormatted = Utils.formatDate(surat.tanggalDiterima);

      row.innerHTML = `
        <td style="text-align: center; font-weight: 600; width: 50px;">${
          startIndex + index + 1
        }</td>
        <td style="width: 130px;">${tanggalDiterimaFormatted}</td>
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
      infoElement.textContent = `Showing ${Math.max(
        0,
        startIndex
      )}-${endIndex} of ${totalItems}`;
    }

    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");

    const maxPage = Math.ceil(totalItems / itemsPerPage);

    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = currentPage >= maxPage;
  }

  // =============================
  // DETAIL VIEW
  // =============================
  window.lihatSurat = function (id) {
    console.log("lihatSurat called with id:", id);

    const surat = KemhanDatabase.getSuratMasukById(id);
    if (!surat) {
      Notification.error("Surat tidak ditemukan");
      return;
    }

    console.log("Found surat:", surat);
    currentDetailId = id;

    const listView = document.getElementById("listViewContainer");
    const formView = document.getElementById("formViewContainer");
    const disposisiViewEl = document.getElementById("disposisiView");
    const detailView = document.getElementById("detailPreviewView");

    if (listView) listView.classList.add("hidden");
    if (formView) formView.classList.remove("active");
    if (disposisiViewEl) disposisiViewEl.classList.remove("active");

    if (detailView) {
      detailView.classList.add("active");
      console.log("Detail view activated");
    } else {
      console.error("detailPreviewView element not found!");
      return;
    }

    // Populate detail fields
    const documentTitle = document.getElementById("documentTitle");
    const detailNoSurat = document.getElementById("detailNoSurat");
    const detailAsalSurat = document.getElementById("detailAsalSurat");
    const detailTanggalSurat = document.getElementById("detailTanggalSurat");
    const detailTanggalDiterima = document.getElementById(
      "detailTanggalDiterima"
    );
    const detailJenisSurat = document.getElementById("detailJenisSurat");
    const detailSifatSurat = document.getElementById("detailSifatSurat");
    const detailPerihal = document.getElementById("detailPerihal");
    const detailFileName = document.getElementById("detailFileName");
    const detailStatus = document.getElementById("detailStatus");
    const detailProgressBar = document.getElementById("detailProgressBar");
    const detailProgressText = document.getElementById("detailProgressText");

    if (documentTitle) documentTitle.textContent = surat.perihal;
    if (detailNoSurat) detailNoSurat.textContent = surat.noSurat;
    if (detailAsalSurat) detailAsalSurat.textContent = surat.dari;
    if (detailTanggalSurat)
      detailTanggalSurat.textContent = Utils.formatDateShort(
        surat.tanggalSurat
      );
    if (detailTanggalDiterima)
      detailTanggalDiterima.textContent = Utils.formatDateShort(
        surat.tanggalDiterima
      );
    if (detailJenisSurat) detailJenisSurat.textContent = surat.jenisSurat;

    if (detailSifatSurat) {
      detailSifatSurat.textContent = surat.sifatSurat;
      detailSifatSurat.className = `badge-detail ${Utils.getSifatBadge(
        surat.sifatSurat
      )}`;
    }

    if (detailPerihal) detailPerihal.textContent = surat.perihal;
    if (detailFileName) detailFileName.textContent = surat.file;
    if (detailStatus) {
      detailStatus.textContent = surat.status || "Pending";
      detailStatus.className = `status-detail-badge ${surat.status.toLowerCase()}`;
    }

    const progress = calculateProgressDisposisi(surat.disposisi);

    if (detailProgressBar) detailProgressBar.style.width = progress + "%";
    if (detailProgressText) detailProgressText.textContent = progress + "%";

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  function calculateProgressDisposisi(disposisiList) {
    if (!disposisiList || disposisiList.length === 0) return 0;
    const selesai = disposisiList.filter((d) => d.status === "Selesai").length;
    return Math.round((selesai / disposisiList.length) * 100);
  }

  // =============================
  // DISPOSISI VIEW
  // =============================
  window.disposisiSurat = function (id) {
    console.log("disposisiSurat called with id:", id);
    const surat = KemhanDatabase.getSuratMasukById(id);
    if (!surat) {
      Notification.error("Surat tidak ditemukan");
      return;
    }

    console.log("Found surat for disposisi:", surat);
    currentDetailId = id;

    const listView = document.getElementById("listViewContainer");
    const formView = document.getElementById("formViewContainer");
    const detailView = document.getElementById("detailPreviewView");
    const disposisiView = document.getElementById("disposisiView");

    if (listView) listView.classList.add("hidden");
    if (formView) formView.classList.remove("active");
    if (detailView) detailView.classList.remove("active");

    if (disposisiView) {
      disposisiView.classList.add("active");
      console.log("Disposisi view activated");
    } else {
      console.error("disposisiView element not found!");
      return;
    }

    document
      .querySelectorAll('.disposisi-checkbox input[type="checkbox"]')
      .forEach((cb) => {
        cb.checked = false;
      });
    document.getElementById("disposisiKeterangan").value = "";

    // Reset semua checkbox kepada
    document
      .querySelectorAll('.disposisi-form-group .disposisi-checkbox input[type="checkbox"]')
      .forEach((cb) => {
        cb.checked = false;
      });

    loadRiwayatDisposisi(surat.disposisi || []);

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  function loadRiwayatDisposisi(disposisiList) {
    const container = document.getElementById("riwayatDisposisiList");
    if (!container) {
      console.error("riwayatDisposisiList not found");
      return;
    }
    if (!disposisiList || disposisiList.length === 0) {
      container.innerHTML =
        '<p style="text-align: center; color: #999; padding: 40px;">Belum ada riwayat disposisi</p>';

      document.getElementById("statPending").textContent = "0";
      document.getElementById("statProses").textContent = "0";
      document.getElementById("statSelesai").textContent = "0";
      return;
    }

    const pending = disposisiList.filter((d) => d.status === "Pending").length;
    const proses = disposisiList.filter((d) => d.status === "Proses").length;
    const selesai = disposisiList.filter((d) => d.status === "Selesai").length;

    document.getElementById("statPending").textContent = pending;
    document.getElementById("statProses").textContent = proses;
    document.getElementById("statSelesai").textContent = selesai;

    container.innerHTML = "";

    const sortedList = [...disposisiList].sort(
      (a, b) =>
        new Date(b.createdAt || b.dibuat) - new Date(a.createdAt || a.dibuat)
    );

    sortedList.forEach((disp) => {
      const item = document.createElement("div");
      item.className = `riwayat-item ${disp.status.toLowerCase()}`;

      const dibuatDate = disp.createdAt
        ? Utils.formatDateShort(disp.createdAt)
        : disp.dibuat || "-";

      item.innerHTML = `
        <div class="riwayat-item-header">
          <div class="riwayat-item-title">
            <i class="bi bi-check-circle"></i>
            <div class="riwayat-item-title-text">${disp.judul}</div>
          </div>
          <span class="riwayat-item-badge ${disp.status.toLowerCase()}">${
        disp.status
      }</span>
        </div>
        <div class="riwayat-item-meta">
          <div class="riwayat-meta-row">
            <i class="bi bi-person"></i>
            <span>Kepada: ${disp.kepada}</span>
          </div>
          <div class="riwayat-meta-row">
            <i class="bi bi-person-check"></i>
            <span>Oleh: ${disp.oleh}</span>
          </div>
          <div class="riwayat-meta-row">
            <i class="bi bi-calendar3"></i>
            <span>Dibuat: ${dibuatDate}</span>
          </div>
          <div class="riwayat-meta-row">
            <i class="bi bi-clock"></i>
            <span>Deadline: ${disp.deadline || "-"}</span>
          </div>
        </div>
        <div class="riwayat-item-note">
          <strong>Catatan:</strong> ${disp.catatan}
        </div>
      `;
      container.appendChild(item);
    });
  }

  // =============================
  // SUBMIT DISPOSISI - UPDATED WITH SUCCESS POPUP
  // =============================
  window.submitDisposisi = function () {
    const tindakLanjutCheckboxes = document.querySelectorAll(
      '.disposisi-checkbox-grid input[type="checkbox"]:checked'
    );
    const selected = Array.from(tindakLanjutCheckboxes).map(
      (cb) => cb.nextElementSibling.textContent.trim().split(". ")[1]
    );
    const keterangan = document.getElementById("disposisiKeterangan").value;
    
    // Get kepada checkboxes from the second grid
    const kepadaCheckboxes = document.querySelectorAll(
      '.disposisi-form-group .disposisi-checkbox-grid input[type="checkbox"]:checked'
    );
    const kepadaValues = Array.from(kepadaCheckboxes).map(
      (cb) => cb.nextElementSibling.textContent.trim().split(". ")[1]
    );

    if (selected.length === 0) {
      Notification.error("Mohon pilih minimal 1 tindak lanjut");
      return;
    }

    if (kepadaValues.length === 0) {
      Notification.error("Mohon pilih minimal 1 tujuan disposisi");
      return;
    }

    const surat = KemhanDatabase.getSuratMasukById(currentDetailId);

    if (surat) {
      const newDisposisi = {
        judul: selected.join(", "),
        status: "Proses",
        kepada: kepadaValues.join(", "),
        oleh: "Admin TU",
        dibuat: new Date().toISOString(),
        deadline: Utils.formatDateShort(
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0]
        ),
        catatan: keterangan || "Tidak ada catatan",
      };

      // Tambahkan disposisi ke database
      KemhanDatabase.addDisposisi(currentDetailId, newDisposisi);

      // Tampilkan popup sukses dengan navigasi
      showDisposisiSuccessPopup(surat);

      // Reset form
      document
        .querySelectorAll('.disposisi-checkbox input[type="checkbox"]')
        .forEach((cb) => {
          cb.checked = false;
        });
      document.getElementById("disposisiKeterangan").value = "";
    }
  };

  // =============================
  // SUCCESS POPUP FUNCTION
  // =============================
  function showDisposisiSuccessPopup(surat) {
    // Load SweetAlert2 jika belum dimuat
    window.loadSwal(() => {
      Swal.fire({
        title: "Surat Masuk Berhasil di Disposisi",
        html: `
          <div style="text-align: center; padding: 20px 0;">
            <div style="width: 120px; height: 120px; background: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 30px;">
              <i class="bi bi-check-lg" style="font-size: 64px; color: white;"></i>
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Monitoring Surat',
        cancelButtonText: 'Kembali',
        confirmButtonColor: '#8b0000',
        cancelButtonColor: '#6c757d',
        customClass: {
          popup: 'disposisi-success-popup',
          confirmButton: 'btn-monitoring-surat',
          cancelButton: 'btn-kembali'
        },
        allowOutsideClick: false,
        width: '500px'
      }).then((result) => {
        if (result.isConfirmed) {
          // Redirect ke monitoring
          window.location.href = 'monitoring.html';
        } else {
          // Kembali ke list view
          showListView();
          renderTable();
          
          // Reload monitoring & notifications jika fungsi tersedia
          if (window.loadMonitoringData) window.loadMonitoringData();
          if (window.loadNotifications) window.loadNotifications();
        }
      });
    });
  }

  // =============================
  // BUTTON ACTIONS
  // =============================
  window.hapusSurat = function (id) {
    loadSwal(() => {
      Notification.confirm(
        "Apakah Anda yakin ingin menghapus surat ini? Surat akan dipindahkan ke Surat Dihapus.",
        () => {
          const deleted = KemhanDatabase.deleteSurat(id, "masuk");
          if (deleted) {
            Notification.success(
              `Surat ${deleted.noSurat} berhasil dipindahkan ke Surat Dihapus!`
            );

            showListView();
            renderTable();

            if (window.loadMonitoringData) window.loadMonitoringData();
            if (window.loadNotifications) window.loadNotifications();
          } else {
            Notification.error("Gagal menghapus surat!");
          }
        }
      );
    });
  };

  // =============================
  // PAGINATION
  // =============================
  window.previousPage = function () {
    if (currentPage > 1) {
      currentPage--;
      renderTable();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  window.nextPage = function () {
    const data = KemhanDatabase.getSuratMasuk(false);
    const maxPage = Math.ceil(data.length / itemsPerPage);
    if (currentPage < maxPage) {
      currentPage++;
      renderTable();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

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
  // DEVELOPMENT FUNCTION
  // =============================
  window.bulkRestoreInbox = function () {
    loadSwal(() => {
      Swal.fire({
        title: "Reset Surat Masuk?",
        text: "Semua surat masuk (Proses/Selesai/Dihapus) akan direset statusnya menjadi 'Pending' dan kembali muncul di Inbox. Lanjutkan?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Ya, Reset Semua",
        cancelButtonText: "Batal",
        confirmButtonColor: "#8b0000",
      }).then((result) => {
        if (result.isConfirmed) {
          KemhanDatabase.restoreAllSuratMasukToInbox();
          Notification.success(
            "Semua surat masuk berhasil direset ke status Pending!"
          );

          renderTable();
          if (window.loadDeletedData) window.loadDeletedData();
          if (window.loadMonitoringData) window.loadMonitoringData();
          showListView();
        }
      });
    });
  };
})();