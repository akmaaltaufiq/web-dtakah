// ========================================
// SURAT KELUAR - FIREBASE INTEGRATED (COMBINED WITH STATUS HANDLER)
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
  let isEditMode = false;
  let currentUserData = null;
  let unsubscribeSuratKeluar = null;

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  // ========================================
  // STATUS HANDLER FUNCTIONS
  // ========================================
  
  /**
   * Fungsi untuk mendapatkan class CSS berdasarkan status
   */
  function getStatusClass(status) {
    if (!status) return 'pending';
    
    const statusLower = status.toLowerCase();
    
    // Status Selesai / Disetujui
    if (statusLower.includes('selesai') || 
        statusLower.includes('disetujui') || 
        statusLower === 'approved') {
      return 'selesai';
    }
    
    // Status Menunggu Persetujuan
    if (statusLower.includes('menunggu') || 
        statusLower.includes('pending') ||
        statusLower.includes('persetujuan kapus')) {
      return 'menunggu';
    }
    
    // Status Proses
    if (statusLower.includes('proses') || 
        statusLower.includes('process')) {
      return 'proses';
    }
    
    // Status Ditolak
    if (statusLower.includes('ditolak') || 
        statusLower.includes('rejected')) {
      return 'ditolak';
    }
    
    // Status Ditunda
    if (statusLower.includes('ditunda') || 
        statusLower.includes('postponed')) {
      return 'ditunda';
    }
    
    return 'pending';
  }

  /**
   * Fungsi untuk mendapatkan text status yang akan ditampilkan
   */
  function getStatusText(status) {
    if (!status) return 'Pending';
    
    const statusLower = status.toLowerCase();
    
    if (statusLower.includes('menunggu') && statusLower.includes('kapus')) {
      return 'Menunggu Persetujuan Kapus';
    }
    
    if (statusLower.includes('disetujui') && statusLower.includes('kapus')) {
      return 'Disetujui Kapus';
    }
    
    // Capitalize first letter
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  /**
   * Fungsi untuk update status surat di Firestore
   */
  async function updateStatusSurat(suratId, newStatus) {
    try {
      await db.collection("surat_keluar").doc(suratId).update({
        status: newStatus,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      
      console.log(`✅ Status updated to: ${newStatus}`);
      
      // Refresh table
      renderTableKeluar();
      
      // Show notification
      if (window.Notification) {
        window.Notification.success(`Status berhasil diubah menjadi: ${newStatus}`);
      }
      
      return true;
    } catch (error) {
      console.error("❌ Error updating status:", error);
      
      if (window.Notification) {
        window.Notification.error("Gagal mengubah status surat");
      }
      
      return false;
    }
  }

  /**
   * Fungsi untuk approve surat (Kapus)
   */
  window.approveSurat = async function(suratId) {
    if (!window.Swal) {
      if (confirm('Setujui surat ini?')) {
        return await updateStatusSurat(suratId, 'Selesai');
      }
      return false;
    }
    
    const result = await Swal.fire({
      title: 'Setujui Surat?',
      text: 'Surat akan disetujui dan statusnya berubah menjadi Selesai',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Setujui',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#059669',
      cancelButtonColor: '#6c757d',
      reverseButtons: true,
    });
    
    if (result.isConfirmed) {
      const success = await updateStatusSurat(suratId, 'Selesai');
      
      if (success) {
        await Swal.fire({
          icon: 'success',
          title: 'Berhasil!',
          text: 'Surat telah disetujui',
          timer: 2000,
          showConfirmButton: false,
        });
      }
      
      return success;
    }
    
    return false;
  };

  /**
   * Fungsi untuk reject surat (Kapus)
   */
  window.rejectSurat = async function(suratId) {
    if (!window.Swal) {
      const reason = prompt('Alasan penolakan:');
      if (reason) {
        return await updateStatusSurat(suratId, 'Ditolak');
      }
      return false;
    }
    
    const { value: reason } = await Swal.fire({
      title: 'Tolak Surat?',
      input: 'textarea',
      inputLabel: 'Alasan Penolakan',
      inputPlaceholder: 'Masukkan alasan penolakan...',
      showCancelButton: true,
      confirmButtonText: 'Ya, Tolak',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6c757d',
      reverseButtons: true,
      inputValidator: (value) => {
        if (!value) {
          return 'Alasan penolakan harus diisi!';
        }
      }
    });
    
    if (reason) {
      try {
        await db.collection("surat_keluar").doc(suratId).update({
          status: 'Ditolak',
          rejectionReason: reason,
          rejectedAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
        
        console.log(`✅ Surat rejected with reason: ${reason}`);
        
        renderTableKeluar();
        
        await Swal.fire({
          icon: 'success',
          title: 'Surat Ditolak',
          text: 'Surat telah ditolak',
          timer: 2000,
          showConfirmButton: false,
        });
        
        return true;
      } catch (error) {
        console.error("❌ Error rejecting surat:", error);
        
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Gagal menolak surat',
        });
        
        return false;
      }
    }
    
    return false;
  };

  // ========================================
  // INITIALIZATION
  // ========================================
  window.initializeSuratKeluarPage = function () {
    console.log("🚀 Surat Keluar Page Initialized (WITH STATUS HANDLER)");

    // Get current user from Firebase Auth
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        console.log("✅ User authenticated:", user.email);

        currentUserData = {
          uid: user.uid,
          email: user.email,
          nama: user.displayName || user.email,
        };

        console.log("👤 Current user data:", currentUserData);

        // Setup all components
        setupRealtimeListener();
        initializeCalendarEvents();
        initializeSifatFilter();
        attachGlobalKeluarEvents();
        
        // Setup file upload after DOM is ready
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

    // Listen to ALL documents (filtering done client-side)
    unsubscribeSuratKeluar = db.collection("surat_keluar").onSnapshot(
      (snapshot) => {
        console.log("📥 Real-time snapshot received:", snapshot.size, "documents");

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

        // Re-render table on any change
        renderTableKeluar();
      },
      (error) => {
        console.error("❌ Real-time listener error:", error);
        renderTableKeluar();
      }
    );
  }

  // ========================================
  // TABLE RENDERING
  // ========================================
  async function getSuratKeluarData() {
    try {
      console.log("🔍 Fetching surat keluar data...");
      
      const snapshot = await db.collection("surat_keluar").get();
      console.log("📥 Firestore returned:", snapshot.size, "documents");

      let data = [];
      snapshot.forEach(doc => {
        const docData = doc.data();
        
        // CLIENT-SIDE FILTER: Skip deleted documents
        if (docData.isDeleted === true) {
          return;
        }

        data.push({
          id: doc.id,
          ...docData,
          // Convert Firestore Timestamp for sorting
          _createdAt: docData.createdAt?.toDate ? 
            docData.createdAt.toDate() : 
            new Date(docData.createdAt || Date.now())
        });
      });

      console.log("📊 Data after filtering deleted:", data.length, "documents");

      // Get filter values
      const filterText = document.getElementById("searchPerihal")?.value.toLowerCase() || "";
      const filterDate = document.getElementById("selectedDateText")?.dataset.dateValue || "";
      const filterSifat = document.getElementById("selectedSifatText")?.dataset.sifatValue || "";

      // Apply filters client-side
      const filteredData = data.filter(surat => {
        const matchesText = !filterText || 
          (surat.perihal && surat.perihal.toLowerCase().includes(filterText)) ||
          (surat.noNaskah && surat.noNaskah.toLowerCase().includes(filterText)) ||
          (surat.noSurat && surat.noSurat.toLowerCase().includes(filterText)) ||
          (surat.deskripsi && surat.deskripsi.toLowerCase().includes(filterText));

        const matchesDate = !filterDate || 
          (surat.tanggalSurat && surat.tanggalSurat.includes(filterDate));

        const matchesSifat = !filterSifat || surat.sifatSurat === filterSifat;

        return matchesText && matchesDate && matchesSifat;
      });

      console.log("📊 Data after filters:", filteredData.length, "documents");

      // Sort by createdAt (newest first)
      filteredData.sort((a, b) => b._createdAt - a._createdAt);

      return filteredData;
    } catch (error) {
      console.error("❌ Error fetching data:", error);
      return [];
    }
  }

  async function renderTableKeluar() {
    const data = await getSuratKeluarData();
    const tbody = document.getElementById("tableBody");
    
    if (!tbody) {
      console.error("❌ Table body not found!");
      return;
    }

    console.log("🔄 Rendering table with", data.length, "items");

    // Pagination
    const startIndex = (currentPageKeluar - 1) * itemsPerPageKeluar;
    const paginatedData = data.slice(startIndex, startIndex + itemsPerPageKeluar);

    console.log("📄 Page", currentPageKeluar, "showing", paginatedData.length, "items");

    if (paginatedData.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; color: #999;">Tidak ada data surat keluar</td></tr>';
      updatePaginationInfoKeluar(0);
      return;
    }

    tbody.innerHTML = paginatedData.map((surat, index) => {
      // Use new status handler
      const statusClass = getStatusClass(surat.status);
      const statusText = getStatusText(surat.status);
      const dari = surat.dari || surat.namaPengirim || "-";
      
      return `
        <tr>
          <td style="text-align: center;">${startIndex + index + 1}</td>
          <td>${Utils.escapeHtml(surat.perihal || '-')}</td>
          <td>${Utils.escapeHtml(dari)}</td>
          <td>${Utils.escapeHtml(surat.deskripsi || surat.catatan || surat.perihal || '-')}</td>
          <td>${Utils.escapeHtml(surat.sifatSurat || '-')}</td>
          <td style="text-align: center;">${Utils.escapeHtml(surat.noNaskah || surat.noSurat || '-')}</td>
          <td style="text-align: center;"><span class="status ${statusClass}">${Utils.escapeHtml(statusText)}</span></td>
          <td class="action-icons">
            <i class="bi bi-eye" title="Preview" onclick="window.previewSuratKeluar('${surat.id}')"></i>
            <i class="bi bi-pencil-square" title="Edit" onclick="window.editSuratKeluar('${surat.id}')"></i>
            <i class="bi bi-trash" title="Hapus" onclick="window.hapusSuratKeluar('${surat.id}')"></i>
          </td>
        </tr>
      `;
    }).join('');

    updatePaginationInfoKeluar(data.length);
    console.log("✅ Table rendered successfully!");
  }

  function updatePaginationInfoKeluar(totalItems) {
    const startIndex = (currentPageKeluar - 1) * itemsPerPageKeluar + 1;
    const endIndex = Math.min(currentPageKeluar * itemsPerPageKeluar, totalItems);
    
    const infoElement = document.getElementById("paginationInfo");
    if (infoElement) {
      infoElement.textContent = `Showing ${Math.max(0, startIndex)}-${endIndex} of ${totalItems}`;
    }

    const maxPage = Math.ceil(totalItems / itemsPerPageKeluar);
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");
    
    if (prevBtn) prevBtn.disabled = currentPageKeluar === 1;
    if (nextBtn) nextBtn.disabled = currentPageKeluar >= maxPage || totalItems === 0;
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
      nextBtn.addEventListener("click", async () => {
        const totalItems = (await getSuratKeluarData()).length;
        const maxPage = Math.ceil(totalItems / itemsPerPageKeluar);
        if (currentPageKeluar < maxPage) {
          currentPageKeluar++;
          renderTableKeluar();
        }
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
  // VIEW MANAGEMENT
  // ========================================
  window.showTambahForm = function () {
    toggleView("form");
    currentSuratKeluarId = null;
    isEditMode = false;
    
    document.getElementById("formTitle").textContent = "Form Registrasi Surat Keluar";
    document.getElementById("submitBtnText").textContent = "Kirim Surat";
    
    resetForm();
    currentStep = 1;
    updateFormStepDisplay();
    
    setTimeout(() => setupFileUploadHandler(), 200);
  };

  window.backToTable = () => toggleView("table");

  function toggleView(view) {
    ["table", "form", "preview"].forEach(v => {
      const el = document.getElementById(`${v}View`);
      if (el) el.style.display = v === view ? "block" : "none";
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    const form = document.getElementById("suratKeluarForm");
    if (form) form.reset();
    
    document.querySelectorAll('input[name="kepada"]').forEach(cb => cb.checked = false);
    resetFileUpload();
  }

  function resetFileUpload() {
    const uploadArea = document.getElementById("uploadArea");
    const uploadContent = document.getElementById("uploadContent");
    const fileInfoDisplay = document.getElementById("fileInfoDisplay");
    
    if (uploadArea) uploadArea.classList.remove("has-file");
    if (uploadContent) uploadContent.style.display = "flex";
    if (fileInfoDisplay) {
      fileInfoDisplay.innerHTML = "";
      fileInfoDisplay.style.display = "none";
    }
    
    const fileInput = document.getElementById("fileInput");
    if (fileInput) fileInput.value = "";
    
    window.uploadedFile = null;
  }

  // ========================================
  // FILE UPLOAD HANDLER
  // ========================================
  function setupFileUploadHandler() {
    const fileInput = document.getElementById("fileInput");
    const uploadArea = document.getElementById("uploadArea");
    const fileInfoDisplay = document.getElementById("fileInfoDisplay");

    if (!fileInput) {
      console.warn("⚠️ File input not found");
      return;
    }

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

      console.log("📎 File selected:", file.name, file.type, file.size);

      const validTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "image/jpeg",
        "image/jpg",
        "image/png",
      ];

      if (!validTypes.includes(file.type)) {
        Notification.error("Tipe file tidak didukung! Gunakan PDF, Word, atau gambar.");
        newFileInput.value = "";
        return;
      }

      if (file.size > 50 * 1024 * 1024) {
        Notification.error("File terlalu besar! Maksimal 50MB");
        newFileInput.value = "";
        return;
      }

      window.uploadedFile = file;

      if (uploadArea) uploadArea.classList.add("has-file");

      if (fileInfoDisplay) {
        const fileSize = (file.size / 1024).toFixed(2);
        let iconClass = "bi-file-earmark-text-fill";
        let iconColor = "#6b7280";

        if (file.type.includes("pdf")) {
          iconClass = "bi-file-earmark-pdf-fill";
          iconColor = "#dc2626";
        } else if (file.type.includes("word")) {
          iconClass = "bi-file-earmark-word-fill";
          iconColor = "#2563eb";
        } else if (file.type.includes("image")) {
          iconClass = "bi-file-earmark-image-fill";
          iconColor = "#10b981";
        }

        fileInfoDisplay.innerHTML = `
          <div class="file-display-card">
            <div class="file-display-icon" style="background-color: ${iconColor}20;">
              <i class="bi ${iconClass}" style="color: ${iconColor}; font-size: 28px;"></i>
            </div>
            <div class="file-display-info">
              <div class="file-display-label">FILE TERUPLOAD</div>
              <div class="file-display-name">${file.name}</div>
              <div class="file-display-size">${fileSize} KB</div>
            </div>
            <button type="button" class="file-remove-btn" onclick="window.removeUploadedFile(event)">
              <i class="bi bi-x-circle"></i>
            </button>
          </div>
        `;
        fileInfoDisplay.style.display = "block";
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
    const uploadContent = document.getElementById("uploadContent");

    if (fileInput) fileInput.value = "";
    if (uploadArea) uploadArea.classList.remove("has-file");
    if (uploadContent) uploadContent.style.display = "flex";
    if (fileInfoDisplay) {
      fileInfoDisplay.innerHTML = "";
      fileInfoDisplay.style.display = "none";
    }

    window.uploadedFile = null;
    Notification.info("File dihapus");
  };

  // ========================================
  // FORM STEPS
  // ========================================
  window.nextStep = function () {
    if (currentStep === 1 && validateSuratKeluarStep1()) {
      currentStep = 2;
      updateFormStepDisplay();
    } else if (currentStep === 2 && validateSuratKeluarStep2()) {
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
    document.querySelectorAll("#formView .step-content").forEach(el => 
      el.classList.remove("active")
    );
    
    const currentStepEl = document.getElementById(`step${currentStep}Content`);
    if (currentStepEl) currentStepEl.classList.add("active");

    for (let i = 1; i <= 3; i++) {
      const stepNum = document.getElementById(`step${i}Number`);
      if (stepNum) {
        stepNum.className = i <= currentStep ? "step-number active" : "step-number inactive";
      }
    }
  }

  function validateSuratKeluarStep1() {
    const required = [
      "jenisSurat", "sifatSurat", "noSurat", 
      "perihal", "tanggalNaskah", "tanggalDiterima"
    ];

    for (let id of required) {
      const el = document.getElementById(id);
      if (!el || !el.value.trim()) {
        Notification.error("Mohon lengkapi semua field di Step 1.");
        if (el) el.focus();
        return false;
      }
    }

    if (!window.uploadedFile && !isEditMode) {
      Notification.error("Mohon unggah file naskah.");
      return false;
    }

    return true;
  }

  function validateSuratKeluarStep2() {
    const namaPengirim = document.getElementById("namaPengirim");
    const jabatanPengirim = document.getElementById("jabatanPengirim");

    if (!namaPengirim?.value.trim()) {
      Notification.error("Mohon isi Nama Pengirim.");
      namaPengirim?.focus();
      return false;
    }

    if (!jabatanPengirim?.value.trim()) {
      Notification.error("Mohon isi Jabatan Pengirim.");
      jabatanPengirim?.focus();
      return false;
    }

    const checkedBoxes = document.querySelectorAll('input[name="kepada"]:checked');
    if (checkedBoxes.length === 0) {
      Notification.error("Mohon pilih minimal 1 tujuan surat.");
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
    document.getElementById("previewFile").textContent = window.uploadedFile ? 
      window.uploadedFile.name : (isEditMode ? "File existing" : "-");
    document.getElementById("previewNamaPengirim").textContent = 
      document.getElementById("namaPengirim").value || "-";
    document.getElementById("previewJabatanPengirim").textContent = 
      document.getElementById("jabatanPengirim").value || "-";

    const checkedBoxes = document.querySelectorAll('input[name="kepada"]:checked');
    const kepadaValues = Array.from(checkedBoxes).map(cb => cb.value);
    document.getElementById("previewDitujukanKepada").textContent = 
      kepadaValues.length > 0 ? kepadaValues.join(", ") : "-";
  }

  // ========================================
  // SUBMIT FORM
  // ========================================
  window.submitFinalForm = async function () {
    console.log("💾 Submitting form...");
    console.log("👤 Current user:", currentUserData);

    if (!currentUserData || !currentUserData.uid) {
      console.error("❌ User data not available!");
      
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

    const checkedBoxes = document.querySelectorAll('input[name="kepada"]:checked');
    const kepadaValues = Array.from(checkedBoxes).map(cb => cb.value);
    const kepadaString = kepadaValues.join(", ");

    // Determine status based on recipients - ENHANCED LOGIC
    let status = "Selesai";
    if (kepadaString.toLowerCase().includes("kepala pusat") || 
        kepadaString.toLowerCase().includes("kapus")) {
      status = "Menunggu Persetujuan Kapus";
    }

    const suratData = {
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
      dari: document.getElementById("namaPengirim").value,
      status: status,
      deskripsi: document.getElementById("catatan").value || 
                 document.getElementById("perihal").value,
      file: window.uploadedFile ? window.uploadedFile.name : "dokumen.pdf",
      isDeleted: false,
      isFavorite: false,
      disposisi: [],
      createdBy: currentUserData.nama || currentUserData.email,
      createdByUid: currentUserData.uid,
    };

    try {
      if (window.showLoading) window.showLoading();

      if (isEditMode && currentSuratKeluarId) {
        console.log("📝 Updating existing surat:", currentSuratKeluarId);
        
        await db.collection("surat_keluar").doc(currentSuratKeluarId).update({
          ...suratData,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });

        if (window.hideLoading) window.hideLoading();

        window.loadSwal(() => {
          Swal.fire({
            icon: "success",
            title: "Berhasil Diupdate!",
            html: `<p>Surat Keluar "<strong>${suratData.perihal}</strong>" berhasil diupdate!</p>`,
            confirmButtonText: "OK",
            confirmButtonColor: "#8b0000",
            timer: 3000,
            timerProgressBar: true,
          }).then(() => backToTable());
        });
      } else {
        console.log("➕ Adding new surat");
        
        await db.collection("surat_keluar").add({
          ...suratData,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });

        if (window.hideLoading) window.hideLoading();

        window.loadSwal(() => {
          Swal.fire({
            icon: "success",
            title: "Berhasil Ditambahkan!",
            html: `<p>Surat Keluar "<strong>${suratData.perihal}</strong>" berhasil ditambahkan!<br><small>Status: <strong>${status}</strong></small></p>`,
            confirmButtonText: "OK",
            confirmButtonColor: "#8b0000",
            timer: 3000,
            timerProgressBar: true,
          }).then(() => backToTable());
        });
      }
    } catch (error) {
      console.error("❌ Error saving surat:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);

      if (window.hideLoading) window.hideLoading();

      let errorMsg = "Gagal menyimpan surat: " + error.message;

      if (error.code === "permission-denied") {
        errorMsg = "Permission denied! Periksa Firestore rules.";
      } else if (error.code === "unauthenticated") {
        errorMsg = "Not authenticated! Please login again.";
        setTimeout(() => window.location.href = "login.html", 2000);
      }

      Notification.error(errorMsg);
    }
  };

  // ========================================
  // CRUD ACTIONS
  // ========================================
  window.previewSuratKeluar = async function (id) {
    try {
      console.log("👁️ Previewing surat:", id);
      const doc = await db.collection("surat_keluar").doc(id).get();
      
      if (!doc.exists) {
        Notification.error("Surat tidak ditemukan.");
        return;
      }

      const surat = { id: doc.id, ...doc.data() };
      currentPreviewSuratId = id;
      showPreviewView(surat);
    } catch (error) {
      console.error("❌ Error previewing surat:", error);
      Notification.error("Gagal menampilkan preview.");
    }
  };

  function showPreviewView(surat) {
    toggleView("preview");

    document.getElementById("previewDocTitle").textContent = surat.perihal || "-";
    document.getElementById("previewFileName").textContent = surat.file || "-";
    document.getElementById("detailTanggalTerima").textContent = 
      Utils.formatDate(surat.tanggalDiterima) || "-";
    document.getElementById("detailNoSurat").textContent = 
      surat.noSurat || surat.noNaskah || "-";
    document.getElementById("detailTanggalSurat").textContent = 
      Utils.formatDate(surat.tanggalSurat) || "-";
    document.getElementById("detailDari").textContent = 
      surat.dari || surat.namaPengirim || "-";
    document.getElementById("detailKepada").textContent = 
      surat.kepada || surat.tujuan || "-";
    document.getElementById("detailPerihal").textContent = surat.perihal || "-";
    document.getElementById("detailLampiran").textContent = surat.file || "-";
    document.getElementById("detailSifat").textContent = surat.sifatSurat || "-";
    document.getElementById("detailJenisNaskah").textContent = surat.jenisSurat || "-";
    document.getElementById("detailCatatan").textContent = 
      surat.catatan || surat.deskripsi || "-";

    // Use new status handler
    const statusClass = getStatusClass(surat.status);
    const statusText = getStatusText(surat.status);
    document.getElementById("detailStatus").innerHTML = 
      `<span class="status ${statusClass}">${statusText}</span>`;

    const createdAt = surat.createdAt?.toDate ? 
      surat.createdAt.toDate().toISOString() : surat.createdAt;
    const updatedAt = surat.updatedAt?.toDate ? 
      surat.updatedAt.toDate().toISOString() : surat.updatedAt;
    
    document.getElementById("detailCreatedAt").textContent = 
      Utils.formatDate(createdAt) || "-";
    document.getElementById("detailUpdatedAt").textContent = 
      Utils.formatDate(updatedAt) || "-";
  }

  window.editSuratKeluar = async function (id) {
    try {
      console.log("✏️ Editing surat:", id);
      const doc = await db.collection("surat_keluar").doc(id).get();
      
      if (!doc.exists) {
        Notification.error("Surat tidak ditemukan.");
        return;
      }

      const surat = { id: doc.id, ...doc.data() };
      isEditMode = true;
      currentSuratKeluarId = id;

      toggleView("form");
      document.getElementById("formTitle").textContent = "Edit Surat Keluar";
      document.getElementById("submitBtnText").textContent = "Update Surat";

      document.getElementById("jenisSurat").value = surat.jenisSurat || "";
      document.getElementById("sifatSurat").value = surat.sifatSurat || "";
      document.getElementById("noSurat").value = surat.noNaskah || surat.noSurat || "";
      document.getElementById("perihal").value = surat.perihal || "";
      document.getElementById("tanggalNaskah").value = surat.tanggalSurat || "";
      document.getElementById("tanggalDiterima").value = surat.tanggalDiterima || "";
      document.getElementById("catatan").value = surat.catatan || "";
      document.getElementById("namaPengirim").value = surat.namaPengirim || surat.dari || "";
      document.getElementById("jabatanPengirim").value = surat.jabatanPengirim || "";

      const kepadaArray = surat.kepada ? surat.kepada.split(", ") : [];
      document.querySelectorAll('input[name="kepada"]').forEach(cb => {
        cb.checked = kepadaArray.includes(cb.value);
      });

      if (surat.file) {
        displayExistingFile(surat.file);
      }

      currentStep = 1;
      updateFormStepDisplay();
      
      setTimeout(() => setupFileUploadHandler(), 200);
    } catch (error) {
      console.error("❌ Error editing surat:", error);
      Notification.error("Gagal memuat data surat.");
    }
  };

  function displayExistingFile(filename) {
    const uploadArea = document.getElementById("uploadArea");
    const uploadContent = document.getElementById("uploadContent");
    const fileInfoDisplay = document.getElementById("fileInfoDisplay");
    
    if (!uploadArea || !fileInfoDisplay) return;

    uploadArea.classList.add("has-file");
    if (uploadContent) uploadContent.style.display = "none";

    let iconClass = "bi-file-earmark-text-fill";
    let iconColor = "#6b7280";

    if (filename.toLowerCase().endsWith('.pdf')) {
      iconClass = "bi-file-earmark-pdf-fill";
      iconColor = "#dc2626";
    } else if (filename.toLowerCase().match(/\.(doc|docx)$/)) {
      iconClass = "bi-file-earmark-word-fill";
      iconColor = "#2563eb";
    } else if (filename.toLowerCase().match(/\.(jpg|jpeg|png)$/)) {
      iconClass = "bi-file-earmark-image-fill";
      iconColor = "#10b981";
    }

    fileInfoDisplay.innerHTML = `
      <div class="file-display-card">
        <div class="file-display-icon" style="background-color: ${iconColor}20;">
          <i class="bi ${iconClass}" style="color: ${iconColor}; font-size: 28px;"></i>
        </div>
        <div class="file-display-info">
          <div class="file-display-label">FILE EXISTING</div>
          <div class="file-display-name">${filename}</div>
          <div class="file-display-size">File sudah ada</div>
        </div>
      </div>
    `;
    fileInfoDisplay.style.display = "block";
  }

  window.hapusSuratKeluar = async function (id) {
    try {
      console.log("🗑️ Deleting surat:", id);
      const doc = await db.collection("surat_keluar").doc(id).get();
      
      if (!doc.exists) {
        Notification.error("Surat tidak ditemukan.");
        return;
      }

      const surat = { id: doc.id, ...doc.data() };

      window.loadSwal(() => {
        Swal.fire({
          title: "Hapus Surat Keluar?",
          html: `<p>Yakin menghapus:<br><strong>${surat.perihal}</strong>?</p>`,
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Ya, Hapus",
          cancelButtonText: "Batal",
          confirmButtonColor: "#dc3545",
          reverseButtons: true,
        }).then(async (result) => {
          if (result.isConfirmed) {
            await db.collection("surat_keluar").doc(id).update({
              isDeleted: true,
              deletedAt: firebase.firestore.FieldValue.serverTimestamp(),
              deletedBy: currentUserData?.nama || currentUserData?.email || "Unknown",
            });

            Swal.fire({
              icon: "success",
              title: "Berhasil Dihapus!",
              timer: 2500,
              showConfirmButton: false,
            });

            const previewView = document.getElementById("previewView");
            if (previewView && previewView.style.display !== "none") {
              backToTable();
            }
            currentPreviewSuratId = null;
          }
        });
      });
    } catch (error) {
      console.error("❌ Error deleting surat:", error);
      Notification.error("Gagal menghapus surat.");
    }
  };

  window.hapusFromPreview = () => {
    if (currentPreviewSuratId) {
      window.hapusSuratKeluar(currentPreviewSuratId);
    }
  };

  window.downloadDocument = () => {
    Notification.info("Fitur download segera tersedia.");
  };

  window.printDocument = () => {
    window.print();
  };

  // ========================================
  // CALENDAR FILTER
  // ========================================
  function initializeCalendarEvents() {
    const datePickerBtn = document.getElementById("datePickerBtn");
    const calendarModal = document.getElementById("calendarModal");
    
    if (!datePickerBtn || !calendarModal) return;

    datePickerBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const rect = datePickerBtn.getBoundingClientRect();
      calendarModal.style.top = `${rect.bottom + 8}px`;
      calendarModal.style.left = `${rect.left}px`;
      calendarModal.classList.add("active");
      generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
    });

    document.getElementById("prevMonth")?.addEventListener("click", () => {
      currentDate.setMonth(currentDate.getMonth() - 1);
      generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
    });

    document.getElementById("nextMonth")?.addEventListener("click", () => {
      currentDate.setMonth(currentDate.getMonth() + 1);
      generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
    });

    document.getElementById("applyDate")?.addEventListener("click", () => {
      if (selectedDate) {
        const dateISO = selectedDate.toISOString().split("T")[0];
        document.getElementById("selectedDateText").textContent = 
          Utils.formatDate(dateISO);
        document.getElementById("selectedDateText").dataset.dateValue = dateISO;
        calendarModal.classList.remove("active");
        currentPageKeluar = 1;
        renderTableKeluar();
      }
    });

    document.addEventListener("click", (e) => {
      if (!calendarModal.contains(e.target) && e.target !== datePickerBtn) {
        calendarModal.classList.remove("active");
      }
    });
  }

  function generateCalendar(year, month) {
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    const calendarDays = document.getElementById("calendarDays");
    
    if (!calendarDays) return;

    calendarDays.innerHTML = "";
    document.getElementById("calendarMonth").textContent = 
      `${monthNames[month]} ${year}`;

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
        document.querySelectorAll(".calendar-day").forEach(d => 
          d.classList.remove("selected")
        );
        this.classList.add("selected");
        selectedDate = new Date(year, month, day);
      });

      calendarDays.appendChild(dayButton);
    }
  }

  // ========================================
  // SIFAT FILTER
  // ========================================
  function initializeSifatFilter() {
    const sifatBtn = document.getElementById("sifatFilterBtn");
    const sifatModal = document.getElementById("sifatModal");
    const selectedSifatText = document.getElementById("selectedSifatText");
    
    if (!sifatBtn || !sifatModal) return;

    sifatBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const rect = sifatBtn.getBoundingClientRect();
      sifatModal.style.top = `${rect.bottom + 8}px`;
      sifatModal.style.left = `${rect.left}px`;
      sifatModal.classList.toggle("active");
    });

    document.querySelectorAll("#sifatModal .sifat-option").forEach(opt => {
      opt.addEventListener("click", function (e) {
        e.stopPropagation();
        document.querySelectorAll("#sifatModal .sifat-option").forEach(b => 
          b.classList.remove("selected")
        );
        this.classList.add("selected");
      });
    });

    document.getElementById("applySifat")?.addEventListener("click", function () {
      const selectedOption = document.querySelector("#sifatModal .sifat-option.selected");
      if (selectedOption) {
        const value = selectedOption.dataset.value;
        selectedSifatText.textContent = value === "" ? "Sifat" : value;
        selectedSifatText.dataset.sifatValue = value;
        sifatModal.classList.remove("active");
        currentPageKeluar = 1;
        renderTableKeluar();
      }
    });

    document.addEventListener("click", (e) => {
      if (!sifatBtn.contains(e.target) && !sifatModal.contains(e.target)) {
        sifatModal.classList.remove("active");
      }
    });
  }

  // ========================================
  // CLEANUP
  // ========================================
  window.addEventListener("beforeunload", () => {
    if (unsubscribeSuratKeluar) {
      console.log("🧹 Cleaning up real-time listener");
      unsubscribeSuratKeluar();
    }
  });

  // ========================================
  // EXPORT STATUS FUNCTIONS TO GLOBAL
  // ========================================
  window.getStatusClass = getStatusClass;
  window.getStatusText = getStatusText;
  window.updateStatusSurat = updateStatusSurat;

})();

console.log("✅ Surat Keluar JS - Integrated with Status Handler");