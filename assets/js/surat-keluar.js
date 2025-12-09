// ========================================
// SURAT KELUAR - FIREBASE REAL-TIME (FULL FIXED)
// ========================================
(function () {
  "use strict";

  let currentStep = 1;
  let currentPageKeluar = 1;
  const itemsPerPageKeluar = 7;
  let currentSuratKeluarId = null;
  let currentDate = new Date();
  let selectedDate = null;
  let currentPreviewSuratId = null;
  let currentUserData = null;
  let unsubscribeSuratKeluar = null;

  const monthNames = [
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

  // ========================================
  // INITIALIZATION (FULL FIXED)
  // ========================================
  window.initializeSuratKeluarPage = function () {
    console.log("🚀 Surat Keluar Page Initialized (FULL FIXED)");

    // LANGSUNG ambil user dari Firebase Auth - JANGAN CEK ROLE DULU
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        console.log("✅ User authenticated:", user.email);

        // Set current user data
        currentUserData = {
          uid: user.uid,
          email: user.email,
          nama: user.displayName || user.email,
        };

        console.log("👤 Current user data:", currentUserData);

        // Setup real-time listener
        setupRealtimeListener();

        // Setup UI components
        initializeCalendarEvents();
        initializeSifatFilter();
        attachGlobalKeluarEvents();

        // Setup file upload
        setTimeout(() => setupFileUploadHandler(), 500);
      } else {
        console.error("❌ No user logged in!");
        window.location.href = "login.html";
      }
    });
  };

  // ========================================
  // REAL-TIME LISTENER
  // ========================================
  function setupRealtimeListener() {
    console.log("🔄 Setting up real-time listener for surat_keluar...");

    if (unsubscribeSuratKeluar) {
      console.log("⚠️ Unsubscribing previous listener");
      unsubscribeSuratKeluar();
    }

    // Listen to ALL documents (no where clause)
    unsubscribeSuratKeluar = db.collection("surat_keluar").onSnapshot(
      (snapshot) => {
        console.log(
          "📥 Real-time snapshot received:",
          snapshot.size,
          "documents"
        );

        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            console.log("➕ Document added:", change.doc.id);
          }
          if (change.type === "modified") {
            console.log("✏️ Document modified:", change.doc.id);
          }
          if (change.type === "removed") {
            console.log("➖ Document removed:", change.doc.id);
          }
        });

        // Re-render table every time there's a change
        renderTableKeluar();
      },
      (error) => {
        console.error("❌ Real-time listener error:", error);
        // Fallback to manual render
        renderTableKeluar();
      }
    );
  }

  // ========================================
  // TABLE RENDERING
  // ========================================
  function renderTableKeluar() {
    const tbody = document.getElementById("tableBody");
    if (!tbody) {
      console.error("❌ Table body not found!");
      return;
    }

    console.log("🔄 Rendering table...");
    tbody.innerHTML =
      '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #999;">Loading...</td></tr>';

    // Get filter values
    const searchInput = document.getElementById("searchPerihal");
    const filterText = searchInput ? searchInput.value.toLowerCase() : "";

    const dateTextEl = document.getElementById("selectedDateText");
    const filterDate =
      dateTextEl && dateTextEl.dataset.dateValue
        ? dateTextEl.dataset.dateValue
        : "";

    const sifatTextEl = document.getElementById("selectedSifatText");
    const filterSifat =
      sifatTextEl && sifatTextEl.dataset.sifatValue
        ? sifatTextEl.dataset.sifatValue
        : "";

    // Fetch data from Firestore (NO WHERE CLAUSE)
    db.collection("surat_keluar")
      .get()
      .then((querySnapshot) => {
        console.log(
          "📥 Firestore query returned:",
          querySnapshot.size,
          "documents"
        );

        const data = [];

        querySnapshot.forEach((doc) => {
          const docData = doc.data();

          // Skip deleted documents (CLIENT-SIDE FILTER)
          if (docData.isDeleted === true) {
            return;
          }

          data.push({
            id: doc.id,
            ...docData,
            // Convert Firestore Timestamp to Date for sorting
            _createdAt: docData.createdAt
              ? docData.createdAt.toDate
                ? docData.createdAt.toDate()
                : new Date(docData.createdAt)
              : new Date(),
          });
        });

        console.log(
          "📊 Data after filtering deleted:",
          data.length,
          "documents"
        );

        // Apply filters
        let filteredData = data.filter((surat) => {
          const matchesText =
            !filterText ||
            (surat.perihal &&
              surat.perihal.toLowerCase().includes(filterText)) ||
            (surat.noNaskah &&
              surat.noNaskah.toLowerCase().includes(filterText)) ||
            (surat.noSurat && surat.noSurat.toLowerCase().includes(filterText));

          const matchesDate =
            !filterDate ||
            (surat.tanggalSurat && surat.tanggalSurat.includes(filterDate));

          const matchesSifat = !filterSifat || surat.sifatSurat === filterSifat;

          return matchesText && matchesDate && matchesSifat;
        });

        console.log(
          "📊 Data after all filters:",
          filteredData.length,
          "documents"
        );

        // Sort by createdAt (newest first) - CLIENT SIDE
        filteredData.sort((a, b) => b._createdAt - a._createdAt);

        // Pagination
        const startIndex = (currentPageKeluar - 1) * itemsPerPageKeluar;
        const endIndex = startIndex + itemsPerPageKeluar;
        const paginatedData = filteredData.slice(startIndex, endIndex);

        console.log(
          "📄 Showing page",
          currentPageKeluar,
          ":",
          paginatedData.length,
          "items"
        );

        // Clear table
        tbody.innerHTML = "";

        if (paginatedData.length === 0) {
          tbody.innerHTML =
            '<tr><td colspan="7" style="text-align: center; padding: 30px; color: #999;">Tidak ada data surat keluar</td></tr>';
          updatePaginationInfoKeluar(0);
          return;
        }

        // Render rows
        paginatedData.forEach((surat, index) => {
          const row = document.createElement("tr");
          const statusClass = Utils.getStatusClass(surat.status);

          row.innerHTML = `
            <td style="text-align: center;">${startIndex + index + 1}</td>
            <td>${Utils.escapeHtml(surat.perihal || "-")}</td>
            <td>${Utils.escapeHtml(
              surat.deskripsi || surat.catatan || surat.perihal || "-"
            )}</td>
            <td>${Utils.escapeHtml(surat.sifatSurat || "-")}</td>
            <td style="text-align: center;">${Utils.escapeHtml(
              surat.noNaskah || surat.noSurat || "-"
            )}</td>
            <td style="text-align: center;">
              <span class="status ${statusClass}">${Utils.escapeHtml(
            surat.status || "Pending"
          )}</span>
            </td>
            <td class="action-icons">
              <i class="bi bi-eye" title="Lihat" onclick="window.lihatSuratKeluar('${
                surat.id
              }')"></i>
              <i class="bi bi-trash" title="Hapus" onclick="window.hapusSuratKeluar('${
                surat.id
              }')"></i>
            </td>
          `;
          tbody.appendChild(row);
        });

        updatePaginationInfoKeluar(filteredData.length);
        console.log("✅ Table rendered successfully!");
      })
      .catch((error) => {
        console.error("❌ Error fetching data:", error);
        tbody.innerHTML =
          '<tr><td colspan="7" style="text-align: center; padding: 30px; color: #dc2626;">Error: ' +
          error.message +
          "</td></tr>";
      });
  }

  function updatePaginationInfoKeluar(totalItems) {
    const startIndex = (currentPageKeluar - 1) * itemsPerPageKeluar + 1;
    const endIndex = Math.min(
      currentPageKeluar * itemsPerPageKeluar,
      totalItems
    );

    const infoElement = document.getElementById("paginationInfo");
    if (infoElement) {
      infoElement.textContent = `Showing ${Math.max(
        0,
        startIndex
      )}-${endIndex} of ${totalItems}`;
    }

    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");
    const maxPage = Math.ceil(totalItems / itemsPerPageKeluar);

    if (prevBtn) prevBtn.disabled = currentPageKeluar === 1;
    if (nextBtn)
      nextBtn.disabled = currentPageKeluar >= maxPage || totalItems === 0;
  }

  function attachGlobalKeluarEvents() {
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");
    const searchInput = document.getElementById("searchPerihal");
    const resetBtn = document.getElementById("resetBtn");

    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        if (currentPageKeluar > 1) {
          currentPageKeluar--;
          renderTableKeluar();
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        currentPageKeluar++;
        renderTableKeluar();
      });
    }

    if (searchInput) {
      searchInput.addEventListener("input", () => {
        currentPageKeluar = 1;
        renderTableKeluar();
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        if (searchInput) searchInput.value = "";

        const dateText = document.getElementById("selectedDateText");
        if (dateText) {
          dateText.textContent = "Tanggal";
          dateText.dataset.dateValue = "";
        }

        const sifatText = document.getElementById("selectedSifatText");
        if (sifatText) {
          sifatText.textContent = "Sifat";
          sifatText.dataset.sifatValue = "";
        }

        selectedDate = null;
        currentPageKeluar = 1;
        renderTableKeluar();
      });
    }
  }

  // ========================================
  // FILE UPLOAD
  // ========================================
  function setupFileUploadHandler() {
    const fileInput = document.getElementById("fileInput");
    const uploadArea = document.getElementById("uploadArea");
    const fileInfoDisplay = document.getElementById("fileInfoDisplay");

    if (!fileInput) return;

    const newFileInput = fileInput.cloneNode(true);
    fileInput.parentNode.replaceChild(newFileInput, fileInput);

    if (uploadArea) {
      uploadArea.onclick = function (e) {
        e.preventDefault();
        e.stopPropagation();
        newFileInput.click();
      };
    }

    newFileInput.addEventListener("change", function (e) {
      const file = e.target.files[0];
      if (!file) return;

      const validTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "image/jpeg",
        "image/jpg",
        "image/png",
      ];

      if (!validTypes.includes(file.type)) {
        Notification.error("Tipe file tidak didukung!");
        newFileInput.value = "";
        return;
      }

      if (file.size > 50 * 1024 * 1024) {
        Notification.error("File terlalu besar! Max 50MB");
        newFileInput.value = "";
        return;
      }

      window.uploadedFile = file;

      if (uploadArea) uploadArea.classList.add("has-file");

      if (fileInfoDisplay) {
        const fileSize = (file.size / 1024).toFixed(2);
        const fileIcon = file.type.includes("pdf")
          ? '<i class="bi bi-file-pdf-fill text-danger"></i>'
          : file.type.includes("word")
          ? '<i class="bi bi-file-word-fill text-primary"></i>'
          : '<i class="bi bi-file-image-fill text-success"></i>';

        fileInfoDisplay.innerHTML = `
          <div class="file-info-card">
            <div class="file-icon">${fileIcon}</div>
            <div class="file-details">
              <div class="file-name">${file.name}</div>
              <div class="file-size">${fileSize} KB</div>
            </div>
            <button type="button" class="file-remove-btn" onclick="window.removeUploadedFile(event)">
              <i class="bi bi-x-circle"></i>
            </button>
          </div>
        `;
      }

      Notification.success(`File "${file.name}" berhasil diunggah!`);
    });
  }

  window.removeUploadedFile = function (event) {
    event.preventDefault();
    event.stopPropagation();

    const fileInput = document.getElementById("fileInput");
    const uploadArea = document.getElementById("uploadArea");
    const fileInfoDisplay = document.getElementById("fileInfoDisplay");

    if (fileInput) fileInput.value = "";
    if (uploadArea) uploadArea.classList.remove("has-file");
    if (fileInfoDisplay) fileInfoDisplay.innerHTML = "";

    window.uploadedFile = null;
    Notification.info("File dihapus");
  };

  // ========================================
  // VIEW MANAGEMENT
  // ========================================
  window.showTambahForm = function () {
    document.getElementById("tableView").style.display = "none";
    document.getElementById("formView").style.display = "block";
    document.getElementById("previewView").style.display = "none";

    currentSuratKeluarId = null;
    document.getElementById("formTitle").textContent =
      "Form Registrasi Surat Keluar";

    const form = document.getElementById("suratKeluarForm");
    if (form) form.reset();

    document
      .querySelectorAll('input[name="kepada"]')
      .forEach((cb) => (cb.checked = false));

    const uploadArea = document.getElementById("uploadArea");
    if (uploadArea) {
      uploadArea.classList.remove("has-file");
      document.getElementById("fileInfoDisplay").innerHTML = "";
    }

    const fileInput = document.getElementById("fileInput");
    if (fileInput) fileInput.value = "";
    window.uploadedFile = null;

    currentStep = 1;
    updateFormStepDisplay();

    setTimeout(() => setupFileUploadHandler(), 200);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  window.backToTable = function () {
    document.getElementById("tableView").style.display = "block";
    document.getElementById("formView").style.display = "none";
    document.getElementById("previewView").style.display = "none";
  };

  // ========================================
  // FORM STEPS
  // ========================================
  window.nextStep = function () {
    if (currentStep === 1) {
      if (!validateSuratKeluarStep1()) return;
      currentStep = 2;
    } else if (currentStep === 2) {
      if (!validateSuratKeluarStep2()) return;
      updatePreview();
      currentStep = 3;
    }
    updateFormStepDisplay();
    window.scrollTo({ top: 0 });
  };

  window.prevStep = function () {
    if (currentStep > 1) {
      currentStep--;
      updateFormStepDisplay();
    }
  };

  function updateFormStepDisplay() {
    document
      .querySelectorAll("#formView .step-content")
      .forEach((el) => el.classList.remove("active"));
    document
      .getElementById(`step${currentStep}Content`)
      ?.classList.add("active");

    for (let i = 1; i <= 3; i++) {
      const stepNum = document.getElementById(`step${i}Number`);
      if (stepNum) {
        stepNum.className =
          i <= currentStep ? "step-number active" : "step-number inactive";
      }
    }
  }

  function validateSuratKeluarStep1() {
    const required = [
      "jenisSurat",
      "sifatSurat",
      "noSurat",
      "perihal",
      "tanggalNaskah",
      "tanggalDiterima",
    ];

    for (let id of required) {
      const el = document.getElementById(id);
      if (!el || !el.value.trim()) {
        Notification.error("Mohon lengkapi semua field Step 1");
        if (el) el.focus();
        return false;
      }
    }

    if (!window.uploadedFile) {
      Notification.error("Mohon unggah file naskah");
      return false;
    }

    return true;
  }

  function validateSuratKeluarStep2() {
    const namaPengirim = document.getElementById("namaPengirim");
    const jabatanPengirim = document.getElementById("jabatanPengirim");

    if (!namaPengirim?.value.trim()) {
      Notification.error("Mohon isi Nama Pengirim");
      namaPengirim?.focus();
      return false;
    }

    if (!jabatanPengirim?.value.trim()) {
      Notification.error("Mohon isi Jabatan Pengirim");
      jabatanPengirim?.focus();
      return false;
    }

    const checkedBoxes = document.querySelectorAll(
      'input[name="kepada"]:checked'
    );
    if (checkedBoxes.length === 0) {
      Notification.error("Mohon pilih minimal 1 tujuan");
      return false;
    }

    return true;
  }

  function updatePreview() {
    document.getElementById("previewJenisSurat").textContent =
      document.getElementById("jenisSurat").value || "-";
    document.getElementById("previewSifatSurat").textContent =
      document.getElementById("sifatSurat").value || "-";
    document.getElementById("previewNoSurat").textContent =
      document.getElementById("noSurat").value || "-";
    document.getElementById("previewPerihal").textContent =
      document.getElementById("perihal").value || "-";
    document.getElementById("previewTanggalNaskah").textContent =
      Utils.formatDate(document.getElementById("tanggalNaskah").value) || "-";
    document.getElementById("previewTanggalDiterima").textContent =
      Utils.formatDate(document.getElementById("tanggalDiterima").value) || "-";
    document.getElementById("previewCatatan").textContent =
      document.getElementById("catatan").value || "-";
    document.getElementById("previewFile").textContent = window.uploadedFile
      ? window.uploadedFile.name
      : "-";
    document.getElementById("previewNamaPengirim").textContent =
      document.getElementById("namaPengirim").value || "-";
    document.getElementById("previewJabatanPengirim").textContent =
      document.getElementById("jabatanPengirim").value || "-";

    const checkedBoxes = document.querySelectorAll(
      'input[name="kepada"]:checked'
    );
    const kepadaValues = Array.from(checkedBoxes).map((cb) => cb.value);
    document.getElementById("previewDitujukanKepada").textContent =
      kepadaValues.join(", ") || "-";
  }

  // ========================================
  // SUBMIT
  // ========================================
  window.submitFinalForm = function () {
    console.log("💾 Submitting form...");
    console.log("👤 Current user:", currentUserData);

    // VALIDASI: Pastikan user sudah login
    if (!currentUserData || !currentUserData.uid) {
      console.error("❌ User data not available!");

      // Coba ambil dari auth langsung
      const user = firebase.auth().currentUser;
      if (user) {
        console.log("✅ Got user from firebase.auth().currentUser");
        currentUserData = {
          uid: user.uid,
          email: user.email,
          nama: user.displayName || user.email,
        };
      } else {
        Notification.error("Session expired. Please login again.");
        window.location.href = "login.html";
        return;
      }
    }

    const checkedBoxes = document.querySelectorAll(
      'input[name="kepada"]:checked'
    );
    const kepadaString = Array.from(checkedBoxes)
      .map((cb) => cb.value)
      .join(", ");

    let status = "Selesai";
    if (
      kepadaString.toLowerCase().includes("kepala pusat") ||
      kepadaString.toLowerCase().includes("kapus")
    ) {
      status = "Menunggu Persetujuan Kapus";
    }

    if (window.showLoading) window.showLoading();

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
      kepada: kepadaString,
      tujuan: kepadaString,
      status: status,
      file: window.uploadedFile ? window.uploadedFile.name : "dokumen.pdf",
      deskripsi:
        document.getElementById("catatan").value ||
        document.getElementById("perihal").value,
      dari: document.getElementById("namaPengirim").value,
      createdBy: currentUserData.nama || currentUserData.email,
      createdByUid: currentUserData.uid,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      isDeleted: false,
      isFavorite: false,
      disposisi: [],
    };

    console.log("📤 Sending to Firebase:", newSurat);

    db.collection("surat_keluar")
      .add(newSurat)
      .then((docRef) => {
        console.log("✅ Surat saved with ID:", docRef.id);

        if (window.hideLoading) window.hideLoading();

        Notification.success(
          `Surat Keluar (${newSurat.noSurat}) Berhasil Disimpan!`
        );

        // Show success feedback
        if (typeof Swal !== "undefined") {
          Swal.fire({
            icon: "success",
            title: "Berhasil!",
            html: `<p>Surat "<strong>${newSurat.perihal}</strong>" berhasil ditambahkan!</p>`,
            timer: 2000,
            showConfirmButton: false,
          }).then(() => {
            backToTable();
          });
        } else {
          setTimeout(() => {
            backToTable();
          }, 1500);
        }
      })
      .catch((error) => {
        console.error("❌ Error saving surat:", error);
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);

        if (window.hideLoading) window.hideLoading();

        let errorMsg = "Gagal menyimpan surat: " + error.message;

        if (error.code === "permission-denied") {
          errorMsg = "Permission denied! Please check Firestore rules.";
        } else if (error.code === "unauthenticated") {
          errorMsg = "Not authenticated! Please login again.";
          setTimeout(() => {
            window.location.href = "login.html";
          }, 2000);
        }

        Notification.error(errorMsg);
      });
  };

  // ========================================
  // CRUD
  // ========================================
  window.lihatSuratKeluar = function (id) {
    db.collection("surat_keluar")
      .doc(id)
      .get()
      .then((doc) => {
        if (!doc.exists) {
          Notification.error("Surat tidak ditemukan");
          return;
        }
        showPreviewView({ id: doc.id, ...doc.data() });
      });
  };

  function showPreviewView(surat) {
    document.getElementById("tableView").style.display = "none";
    document.getElementById("formView").style.display = "none";
    document.getElementById("previewView").style.display = "block";

    document.getElementById("previewDocTitle").textContent =
      surat.perihal || "-";
    document.getElementById("detailTanggalTerima").textContent =
      Utils.formatDate(surat.tanggalDiterima) || "-";
    document.getElementById("detailNoSurat").textContent = surat.noSurat || "-";
    document.getElementById("detailTanggalSurat").textContent =
      Utils.formatDate(surat.tanggalSurat) || "-";
    document.getElementById("detailDari").textContent =
      surat.namaPengirim || "-";
    document.getElementById("detailKepada").textContent = surat.kepada || "-";
    document.getElementById("detailPerihal").textContent = surat.perihal || "-";
    document.getElementById("detailLampiran").textContent = surat.file || "-";
    document.getElementById("detailSifat").textContent =
      surat.sifatSurat || "-";
    document.getElementById("detailJenisNaskah").textContent =
      surat.jenisSurat || "-";
    document.getElementById("detailCatatan").textContent = surat.catatan || "-";
  }

  window.hapusSuratKeluar = function (id) {
    if (typeof Swal !== "undefined") {
      Swal.fire({
        title: "Hapus Surat?",
        text: "Apakah Anda yakin ingin menghapus surat ini?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Ya, Hapus!",
        cancelButtonText: "Batal",
      }).then((result) => {
        if (result.isConfirmed) {
          db.collection("surat_keluar")
            .doc(id)
            .update({
              isDeleted: true,
              deletedAt: firebase.firestore.FieldValue.serverTimestamp(),
              deletedBy: currentUserData.nama,
            })
            .then(() => {
              Notification.success("Surat berhasil dihapus!");
            })
            .catch((error) => {
              console.error("❌ Error deleting surat:", error);
              Notification.error("Gagal menghapus surat");
            });
        }
      });
    } else {
      if (confirm("Apakah Anda yakin ingin menghapus surat ini?")) {
        db.collection("surat_keluar")
          .doc(id)
          .update({
            isDeleted: true,
            deletedAt: firebase.firestore.FieldValue.serverTimestamp(),
            deletedBy: currentUserData.nama,
          })
          .then(() => {
            Notification.success("Surat berhasil dihapus!");
          })
          .catch((error) => {
            console.error("❌ Error deleting surat:", error);
            Notification.error("Gagal menghapus surat");
          });
      }
    }
  };

  // ========================================
  // FILTERS
  // ========================================
  function initializeSifatFilter() {
    const sifatBtn = document.getElementById("sifatFilterBtn");
    const sifatModal = document.getElementById("sifatModal");
    const applySifatBtn = document.getElementById("applySifat");

    if (!sifatBtn || !sifatModal) return;

    sifatBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      sifatModal.classList.toggle("active");
    });

    document.querySelectorAll(".sifat-option").forEach((option) => {
      option.addEventListener("click", function () {
        document
          .querySelectorAll(".sifat-option")
          .forEach((o) => o.classList.remove("selected"));
        this.classList.add("selected");
      });
    });

    if (applySifatBtn) {
      applySifatBtn.addEventListener("click", () => {
        const selected = document.querySelector(".sifat-option.selected");
        if (selected) {
          const value = selected.getAttribute("data-value");
          const text = selected.textContent;
          document.getElementById("selectedSifatText").textContent = text;
          document.getElementById("selectedSifatText").dataset.sifatValue =
            value;
          renderTableKeluar();
        }
        sifatModal.classList.remove("active");
      });
    }

    document.addEventListener("click", (e) => {
      if (!sifatModal.contains(e.target) && !sifatBtn.contains(e.target)) {
        sifatModal.classList.remove("active");
      }
    });
  }

  function initializeCalendarEvents() {
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
        if (selectedDate) {
          const formatted = selectedDate.toISOString().split("T")[0];
          document.getElementById("selectedDateText").textContent =
            Utils.formatDateShort(formatted);
          document.getElementById("selectedDateText").dataset.dateValue =
            formatted;
          renderTableKeluar();
        }
        calendarModal.classList.remove("active");
      });
    }

    if (prevMonthBtn) {
      prevMonthBtn.addEventListener("click", () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
      });
    }

    if (nextMonthBtn) {
      nextMonthBtn.addEventListener("click", () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
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

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    calendarMonth.textContent = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

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

      const date = new Date(year, month, day);
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

  // ========================================
  // CLEANUP
  // ========================================
  window.addEventListener("beforeunload", () => {
    if (unsubscribeSuratKeluar) {
      unsubscribeSuratKeluar();
    }
  });
})();

console.log("✅ Surat Keluar JS - Firebase Integrated (FULL FIXED)");
