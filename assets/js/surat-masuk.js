// =============================
// SURAT MASUK - FIREBASE INTEGRATED (NO DISPOSISI ICON)
// =============================
(function () {
  "use strict";

  let currentStep = 1;
  let currentPage = 1;
  const itemsPerPage = 6;
  let currentDetailId = null;
  let currentUserData = null;
  let unsubscribeSuratMasuk = null;

  // =============================
  // INITIALIZATION
  // =============================
  window.initializeSuratMasukPage = function () {
    console.log("📄 Surat Masuk Page Initialized (No Disposisi Icon)");

    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        console.log("✅ User authenticated:", user.email);

        currentUserData = {
          uid: user.uid,
          email: user.email,
          nama: user.displayName || user.email,
        };

        setupRealtimeListener();
        setupEventListeners();
      } else {
        console.error("❌ No user logged in!");
        window.location.href = "login.html";
      }
    });
  };

  // =============================
  // REAL-TIME LISTENER - FILTER isDeleted
  // =============================
  function setupRealtimeListener() {
    console.log("🔄 Setting up real-time listener...");

    if (unsubscribeSuratMasuk) {
      unsubscribeSuratMasuk();
    }

    // Listen only to non-deleted documents
    unsubscribeSuratMasuk = db
      .collection("surat_masuk")
      .onSnapshot(
        (snapshot) => {
          console.log("📨 Surat updated:", snapshot.size, "documents");
          renderTable();
        },
        (error) => {
          console.error("❌ Error listening:", error);
        }
      );
  }

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
      "namaPengirim", "jabatanPengirim", "jenisSurat", "sifatSurat",
      "noSurat", "perihal", "tanggalSurat", "tanggalDiterima",
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

    const kepadaCheckboxes = document.querySelectorAll('input[name="kepada"]:checked');
    const kepadaValues = Array.from(kepadaCheckboxes).map((cb) => cb.value);
    const previewKepada = document.getElementById("previewKepada");
    if (previewKepada) {
      previewKepada.textContent = kepadaValues.length > 0 ? kepadaValues.join(", ") : "-";
    }

    const tanggalSurat = document.getElementById("tanggalSurat");
    const tanggalDiterima = document.getElementById("tanggalDiterima");

    if (tanggalSurat) {
      document.getElementById("previewTanggalSurat").textContent = Utils.formatDate(tanggalSurat.value);
    }

    if (tanggalDiterima) {
      document.getElementById("previewTanggalDiterima").textContent = Utils.formatDate(tanggalDiterima.value);
    }

    document.getElementById("previewFile").textContent = window.uploadedFile ? window.uploadedFile.name : "-";
  }

  // =============================
  // FORM SUBMIT
  // =============================
  function handleSubmit(e) {
    e.preventDefault();

    if (!currentUserData || !currentUserData.uid) {
      const user = firebase.auth().currentUser;
      if (user) {
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

    const kepadaCheckboxes = document.querySelectorAll('input[name="kepada"]:checked');
    const kepadaValues = Array.from(kepadaCheckboxes).map((cb) => cb.value);

    if (window.showLoading) window.showLoading();

    const newSurat = {
      tanggalDiterima: document.getElementById("tanggalDiterima").value,
      tanggalSurat: document.getElementById("tanggalSurat").value,
      noSurat: document.getElementById("noSurat").value,
      perihal: document.getElementById("perihal").value,
      dari: document.getElementById("namaPengirim").value,
      kepada: kepadaValues.join(", "),
      jenisSurat: document.getElementById("jenisSurat").value,
      sifatSurat: document.getElementById("sifatSurat").value,
      file: window.uploadedFile ? window.uploadedFile.name : "dokumen.pdf",
      status: "Terkirim ke Kapus",
      namaPengirim: document.getElementById("namaPengirim").value,
      jabatanPengirim: document.getElementById("jabatanPengirim").value,
      catatan: document.getElementById("catatan").value || "",
      disposisi: [],
      createdBy: currentUserData.nama || currentUserData.email,
      createdByUid: currentUserData.uid,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      isDeleted: false,
      isFavorite: false,
    };

    db.collection("surat_masuk")
      .add(newSurat)
      .then((docRef) => {
        console.log("✅ Surat saved with ID:", docRef.id);

        if (window.hideLoading) window.hideLoading();

        Notification.success(`Surat Masuk (${newSurat.noSurat}) Berhasil Disimpan!`);

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
      })
      .catch((error) => {
        console.error("❌ Error saving surat:", error);

        if (window.hideLoading) window.hideLoading();

        let errorMsg = "Gagal menyimpan surat: " + error.message;

        if (error.code === "permission-denied") {
          errorMsg = "Permission denied! Periksa Firestore rules.";
        } else if (error.code === "unauthenticated") {
          errorMsg = "Not authenticated! Please login again.";
          setTimeout(() => window.location.href = "login.html", 2000);
        }

        Notification.error(errorMsg);
      });
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

    document.querySelectorAll('input[name="kepada"]').forEach((cb) => {
      cb.checked = false;
    });

    updateStepDisplay();
  };

  window.closeForm = function () {
    const formView = document.getElementById("formViewContainer");
    const listView = document.getElementById("listViewContainer");

    if (formView) formView.classList.remove("active");
    if (listView) listView.classList.remove("hidden");

    const form = document.getElementById("suratForm");
    if (form) form.reset();

    window.uploadedFile = null;
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
  // TABLE RENDERING - TANPA ICON DISPOSISI
  // =============================
  async function renderTable() {
    const tbody = document.getElementById("tableBody");
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #999;">Loading...</td></tr>';

    try {
      const snapshot = await db.collection("surat_masuk").get();
      
      const data = [];
      snapshot.forEach((doc) => {
        const docData = doc.data();
        
        // Skip deleted documents
        if (docData.isDeleted === true) {
          console.log("🗑️ Skipping deleted document:", doc.id);
          return;
        }

        data.push({
          id: doc.id,
          ...docData,
          _createdAt: docData.createdAt ? docData.createdAt.toDate() : new Date(),
        });
      });

      console.log("📨 Loaded", data.length, "non-deleted surat");

      if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #999;">Tidak ada surat masuk.</td></tr>';
        updatePaginationInfo(0);
        return;
      }

      data.sort((a, b) => b._createdAt - a._createdAt);

      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedData = data.slice(startIndex, endIndex);

      tbody.innerHTML = "";

      paginatedData.forEach((surat, index) => {
        const row = document.createElement("tr");
        const tanggalDiterimaFormatted = Utils.formatDate(surat.tanggalDiterima);

        // HANYA ICON PREVIEW DAN HAPUS
        row.innerHTML = `
          <td style="text-align: center; font-weight: 600; width: 50px;">${startIndex + index + 1}</td>
          <td style="width: 130px;">${tanggalDiterimaFormatted}</td>
          <td style="width: 110px;">${surat.noSurat}</td>
          <td style="min-width: 200px;">${surat.perihal}</td>
          <td style="width: 150px;">${surat.dari}</td>
          <td style="min-width: 180px;">${surat.kepada}</td>
          <td style="width: 120px; text-align: center;">
            <div class="action-buttons">
              <div class="btn-action-group">
                <button class="btn-action" title="Lihat" onclick="window.lihatSurat('${surat.id}')">
                  <i class="bi bi-eye"></i>
                </button>
              </div>
              <button class="btn-delete" title="Hapus" onclick="window.hapusSurat('${surat.id}')">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </td>
        `;
        tbody.appendChild(row);
      });

      updatePaginationInfo(data.length);

    } catch (error) {
      console.error("❌ Error fetching surat:", error);
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #dc2626;">Error loading data: ' + error.message + "</td></tr>";
    }
  }

  function updatePaginationInfo(totalItems) {
    const startIndex = (currentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

    const infoElement = document.getElementById("paginationInfo");
    if (infoElement) {
      infoElement.textContent = `Showing ${Math.max(0, startIndex)}-${endIndex} of ${totalItems}`;
    }

    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");
    const maxPage = Math.ceil(totalItems / itemsPerPage);

    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = currentPage >= maxPage || totalItems === 0;
  }

  // =============================
  // DELETE - SOFT DELETE WITH CONFIRMATION
  // =============================
  window.hapusSurat = async function (id) {
    try {
      console.log("🗑️ Attempting to delete surat masuk:", id);

      const doc = await db.collection("surat_masuk").doc(id).get();

      if (!doc.exists) {
        Notification.error("Surat tidak ditemukan.");
        return;
      }

      const surat = { id: doc.id, ...doc.data() };

      if (surat.isDeleted === true) {
        Notification.warning("Surat sudah dihapus sebelumnya.");
        return;
      }

      window.loadSwal(() => {
        Swal.fire({
          title: "Hapus Surat Masuk?",
          html: `<p>Yakin menghapus surat:<br><strong>"${surat.perihal || 'Tanpa Judul'}"</strong>?<br><br>Surat akan dipindahkan ke Surat Dihapus.</p>`,
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Ya, Hapus",
          cancelButtonText: "Batal",
          confirmButtonColor: "#dc3545",
          cancelButtonColor: "#6c757d",
          reverseButtons: true,
        }).then(async (result) => {
          if (result.isConfirmed) {
            try {
              Swal.fire({
                title: 'Menghapus...',
                text: 'Mohon tunggu',
                allowOutsideClick: false,
                showConfirmButton: false,
                willOpen: () => {
                  Swal.showLoading();
                }
              });

              await db.collection("surat_masuk").doc(id).update({
                isDeleted: true,
                deletedAt: firebase.firestore.FieldValue.serverTimestamp(),
                deletedBy: currentUserData?.nama || currentUserData?.email || "Unknown",
                deletedByUid: currentUserData?.uid || null,
              });

              console.log("✅ Surat marked as deleted");

              Swal.fire({
                icon: "success",
                title: "Berhasil Dihapus!",
                html: `<p>Surat "<strong>${surat.perihal || 'Tanpa Judul'}</strong>" telah dihapus.<br>Anda dapat melihatnya di <strong>Surat Dihapus</strong>.</p>`,
                timer: 3000,
                showConfirmButton: true,
                confirmButtonText: "OK",
                confirmButtonColor: "#28a745"
              });

              const detailView = document.getElementById("detailPreviewView");
              if (detailView && !detailView.classList.contains("hidden")) {
                setTimeout(() => showListView(), 500);
              }

            } catch (error) {
              console.error("❌ Error deleting:", error);

              Swal.fire({
                icon: "error",
                title: "Gagal Menghapus",
                text: "Terjadi kesalahan: " + error.message,
                confirmButtonColor: "#dc3545"
              });
            }
          }
        });
      });

    } catch (error) {
      console.error("❌ Error in hapusSurat:", error);
      Notification.error("Gagal menghapus surat: " + error.message);
    }
  };

  // =============================
  // DETAIL VIEW
  // =============================
  window.lihatSurat = async function (id) {
    console.log("👁️ Viewing surat:", id);

    currentDetailId = id;

    const listView = document.getElementById("listViewContainer");
    const formView = document.getElementById("formViewContainer");
    const disposisiViewEl = document.getElementById("disposisiView");
    const detailView = document.getElementById("detailPreviewView");

    if (listView) listView.classList.add("hidden");
    if (formView) formView.classList.remove("active");
    if (disposisiViewEl) disposisiViewEl.classList.remove("active");

    if (detailView) {
      detailView.classList.remove("hidden");
      detailView.classList.add("active");
    }

    try {
      const doc = await db.collection("surat_masuk").doc(id).get();

      if (!doc.exists) {
        Notification.error("Surat tidak ditemukan");
        showListView();
        return;
      }

      const surat = { id: doc.id, ...doc.data() };

      if (surat.isDeleted === true) {
        Notification.warning("Surat ini sudah dihapus.");
        showListView();
        return;
      }

      document.getElementById("documentTitle").textContent = surat.perihal;
      document.getElementById("detailNoSurat").textContent = surat.noSurat;
      document.getElementById("detailAsalSurat").textContent = surat.dari;
      document.getElementById("detailTanggalSurat").textContent = Utils.formatDateShort(surat.tanggalSurat);
      document.getElementById("detailTanggalDiterima").textContent = Utils.formatDateShort(surat.tanggalDiterima);
      document.getElementById("detailJenisSurat").textContent = surat.jenisSurat;

      const detailSifatSurat = document.getElementById("detailSifatSurat");
      if (detailSifatSurat) {
        detailSifatSurat.textContent = surat.sifatSurat;
        detailSifatSurat.className = `badge-detail ${Utils.getSifatBadge(surat.sifatSurat)}`;
      }

      document.getElementById("detailPerihal").textContent = surat.perihal;
      document.getElementById("detailFileName").textContent = surat.file;

      const detailStatus = document.getElementById("detailStatus");
      if (detailStatus) {
        detailStatus.textContent = surat.status || "Pending";
        detailStatus.className = `status-detail-badge ${(surat.status || 'pending').toLowerCase().replace(/ /g, "-")}`;
      }

      window.scrollTo({ top: 0, behavior: "smooth" });

    } catch (error) {
      console.error("❌ Error fetching surat:", error);
      Notification.error("Gagal mengambil data surat");
    }
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
    currentPage++;
    renderTable();
    window.scrollTo({ top: 0, behavior: "smooth" });
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

  // Cleanup
  window.addEventListener("beforeunload", () => {
    if (unsubscribeSuratMasuk) {
      unsubscribeSuratMasuk();
    }
  });

  // Alias for compatibility
  window.initializePage = window.initializeSuratMasukPage;

})();

console.log("✅ Surat Masuk JS - Without Disposisi Icon");