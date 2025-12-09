// ========================================
// SURAT DIHAPUS - FIREBASE INTEGRATED
// ========================================
(function () {
  "use strict";

  let currentPageDeleted = 1;
  const itemsPerPageDeleted = 6;
  let currentUserData = null;
  let unsubscribeDeleted = null;

  // ========================================
  // INITIALIZATION
  // ========================================
  window.initializePage = function () {
    console.log("🗑️ Surat Dihapus Page Initialized (Firebase)");

    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        console.log("✅ User authenticated:", user.email);

        currentUserData = {
          uid: user.uid,
          email: user.email,
          nama: user.displayName || user.email,
        };

        setupRealtimeListener();
        setupFilterEvents();
      } else {
        console.error("❌ No user logged in!");
        window.location.href = "login.html";
      }
    });
  };

  // ========================================
  // REAL-TIME LISTENER - ONLY isDeleted: true
  // ========================================
  function setupRealtimeListener() {
    console.log("🔄 Setting up real-time listener for deleted surat...");

    if (unsubscribeDeleted) {
      unsubscribeDeleted();
    }

    // Listen to surat_keluar with isDeleted = true
    unsubscribeDeleted = db.collection("surat_keluar")
      .where("isDeleted", "==", true)
      .onSnapshot(
        (snapshot) => {
          console.log("📥 Deleted surat update:", snapshot.size, "documents");
          renderDeletedCards();
        },
        (error) => {
          console.error("❌ Real-time listener error:", error);
          renderDeletedCards();
        }
      );
  }

  // ========================================
  // GET DELETED DATA FROM FIREBASE - ALL TYPES
  // ========================================
  async function getDeletedSuratData() {
    try {
      console.log("🔍 Fetching deleted surat from Firebase...");

      let data = [];

      // Get deleted Surat Keluar
      const keluarSnapshot = await db.collection("surat_keluar")
        .where("isDeleted", "==", true)
        .get();

      keluarSnapshot.forEach((doc) => {
        const docData = doc.data();
        data.push({
          id: doc.id,
          ...docData,
          type: "keluar",
          typeName: "Surat Keluar",
          _deletedAt: docData.deletedAt?.toDate ? 
            docData.deletedAt.toDate() : 
            new Date(docData.deletedAt || Date.now())
        });
      });

      // Get deleted Surat Masuk
      const masukSnapshot = await db.collection("surat_masuk")
        .where("isDeleted", "==", true)
        .get();

      masukSnapshot.forEach((doc) => {
        const docData = doc.data();
        data.push({
          id: doc.id,
          ...docData,
          type: "masuk",
          typeName: "Surat Masuk",
          _deletedAt: docData.deletedAt?.toDate ? 
            docData.deletedAt.toDate() : 
            new Date(docData.deletedAt || Date.now())
        });
      });

      // Get deleted Nota Dinas
      const notaDinasSnapshot = await db.collection("nota_dinas")
        .where("isDeleted", "==", true)
        .get();

      notaDinasSnapshot.forEach((doc) => {
        const docData = doc.data();
        data.push({
          id: doc.id,
          ...docData,
          type: "nota_dinas",
          typeName: "Nota Dinas",
          _deletedAt: docData.deletedAt?.toDate ? 
            docData.deletedAt.toDate() : 
            new Date(docData.deletedAt || Date.now())
        });
      });

      console.log("📥 Found", data.length, "deleted documents total");
      console.log("   - Surat Keluar:", keluarSnapshot.size);
      console.log("   - Surat Masuk:", masukSnapshot.size);
      console.log("   - Nota Dinas:", notaDinasSnapshot.size);

      // Apply filters
      const searchText = document.getElementById("tableSearchDeleted")?.value.toLowerCase() || "";
      const filterDate = document.getElementById("dateFilterDeleted")?.value || "";
      const filterSifat = document.getElementById("sifatFilterDeleted")?.value || "";

      const filteredData = data.filter(surat => {
        const matchesSearch = !searchText || 
          (surat.perihal && surat.perihal.toLowerCase().includes(searchText)) ||
          (surat.noNaskah && surat.noNaskah.toLowerCase().includes(searchText)) ||
          (surat.noSurat && surat.noSurat.toLowerCase().includes(searchText));

        // Filter by deleted date
        const deletedDate = surat._deletedAt ? 
          surat._deletedAt.toISOString().split('T')[0] : "";
        const matchesDate = !filterDate || deletedDate === filterDate;

        const matchesSifat = !filterSifat || surat.sifatSurat === filterSifat;

        return matchesSearch && matchesDate && matchesSifat;
      });

      // Sort by deleted date (newest first)
      filteredData.sort((a, b) => b._deletedAt - a._deletedAt);

      console.log("📊 Filtered data:", filteredData.length, "documents");
      return filteredData;

    } catch (error) {
      console.error("❌ Error fetching deleted data:", error);
      return [];
    }
  }

  // ========================================
  // RENDER DELETED CARDS
  // ========================================
  async function renderDeletedCards() {
    const data = await getDeletedSuratData();
    const cardGrid = document.getElementById("deletedCardGrid");

    if (!cardGrid) {
      console.error("❌ Card grid not found!");
      return;
    }

    console.log("🔄 Rendering", data.length, "cards");

    // Pagination
    const startIndex = (currentPageDeleted - 1) * itemsPerPageDeleted;
    const paginatedData = data.slice(startIndex, startIndex + itemsPerPageDeleted);

    if (paginatedData.length === 0) {
      cardGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
          <i class="bi bi-trash" style="font-size: 64px; color: #ccc; margin-bottom: 20px;"></i>
          <p style="font-size: 18px; color: #666; margin: 0;">Tidak ada surat yang dihapus</p>
          <p style="font-size: 14px; color: #999; margin-top: 8px;">Surat yang dihapus akan muncul di sini</p>
        </div>
      `;
      updatePaginationInfo(0);
      return;
    }

    cardGrid.innerHTML = paginatedData.map((surat) => {
      const badgeClass = Utils.getSifatBadge(surat.sifatSurat);
      const deletedDate = surat._deletedAt ? 
        Utils.formatDate(surat._deletedAt.toISOString()) : "-";
      const deletedBy = surat.deletedBy || "Unknown";

      const dariLabel = "Dari";
      const dariValue = surat.dari || surat.namaPengirim || "-";

      const kepadaLabel = "Kepada";
      const kepadaValue = surat.kepada || surat.tujuan || "-";

      return `
        <div class="deleted-card">
          <div class="card-header-deleted">
            <div style="display: flex; flex-direction: column; gap: 5px;">
              <h5 class="card-title-deleted">${Utils.escapeHtml(surat.perihal || 'Tanpa Judul')}</h5>
              <span style="font-size: 11px; color: #666; font-weight: 500;">${surat.typeName}</span>
            </div>
            <span class="badge-deleted ${badgeClass}">${Utils.escapeHtml(surat.sifatSurat || surat.sifat || surat.sifatNaskah || 'Umum')}</span>
          </div>
          <div class="card-body-deleted">
            <div class="card-info-row">
              <i class="bi bi-person-badge"></i>
              <span>${kepadaLabel}: ${Utils.escapeHtml(kepadaValue)}</span>
            </div>
            <div class="card-info-row">
              <i class="bi bi-send-check"></i>
              <span>${dariLabel}: ${Utils.escapeHtml(dariValue)}</span>
            </div>
            <div class="card-info-row">
              <i class="bi bi-envelope"></i>
              <span>Nomor Surat: ${Utils.escapeHtml(surat.noSurat || surat.noNaskah || '-')}</span>
            </div>
            <div class="card-info-row">
              <i class="bi bi-calendar-x"></i>
              <span>Dihapus: ${deletedDate}</span>
            </div>
            <div class="card-info-row">
              <i class="bi bi-person-x"></i>
              <span>Oleh: ${Utils.escapeHtml(deletedBy)}</span>
            </div>
          </div>
          <div class="card-actions-deleted">
            <button class="btn-pulihkan" onclick="window.restoreSurat('${surat.id}', '${surat.type}')" title="Pulihkan surat">
              <i class="bi bi-arrow-clockwise"></i>
              Pulihkan
            </button>
            <button class="btn-hapus-permanen" onclick="window.permanentDeleteSurat('${surat.id}', '${surat.type}', '${Utils.escapeHtml(surat.perihal || 'surat ini')}')" title="Hapus permanen">
              <i class="bi bi-trash-fill"></i>
              Hapus Permanen
            </button>
          </div>
        </div>
      `;
    }).join('');

    updatePaginationInfo(data.length);
    console.log("✅ Cards rendered successfully!");
  }

  // ========================================
  // PAGINATION
  // ========================================
  function updatePaginationInfo(totalItems) {
    const startIndex = (currentPageDeleted - 1) * itemsPerPageDeleted + 1;
    const endIndex = Math.min(currentPageDeleted * itemsPerPageDeleted, totalItems);

    const infoElement = document.getElementById("deletedPaginationInfo");
    if (infoElement) {
      infoElement.textContent = `Showing ${Math.max(0, startIndex)}-${endIndex} of ${totalItems}`;
    }

    const maxPage = Math.ceil(totalItems / itemsPerPageDeleted);
    const prevBtn = document.getElementById("prevBtnDeleted");
    const nextBtn = document.getElementById("nextBtnDeleted");

    if (prevBtn) prevBtn.disabled = currentPageDeleted === 1;
    if (nextBtn) nextBtn.disabled = currentPageDeleted >= maxPage || totalItems === 0;
  }

  window.previousPageDeleted = function () {
    if (currentPageDeleted > 1) {
      currentPageDeleted--;
      renderDeletedCards();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  window.nextPageDeleted = function () {
    const maxPage = Math.ceil(itemsPerPageDeleted);
    if (currentPageDeleted < maxPage) {
      currentPageDeleted++;
      renderDeletedCards();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // ========================================
  // FILTER EVENTS
  // ========================================
  function setupFilterEvents() {
    const searchInput = document.getElementById("tableSearchDeleted");
    const dateFilter = document.getElementById("dateFilterDeleted");
    const sifatFilter = document.getElementById("sifatFilterDeleted");
    const resetBtn = document.getElementById("resetBtnDeleted");

    if (searchInput) {
      searchInput.addEventListener("input", () => {
        currentPageDeleted = 1;
        renderDeletedCards();
      });
    }

    if (dateFilter) {
      dateFilter.addEventListener("change", () => {
        currentPageDeleted = 1;
        renderDeletedCards();
      });
    }

    if (sifatFilter) {
      sifatFilter.addEventListener("change", () => {
        currentPageDeleted = 1;
        renderDeletedCards();
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        if (searchInput) searchInput.value = "";
        if (dateFilter) dateFilter.value = "";
        if (sifatFilter) sifatFilter.value = "";
        currentPageDeleted = 1;
        renderDeletedCards();
      });
    }

    // Populate date filter options
    populateDateFilter();
  }

  async function populateDateFilter() {
    const dateFilter = document.getElementById("dateFilterDeleted");
    if (!dateFilter) return;

    try {
      const snapshot = await db.collection("surat_keluar")
        .where("isDeleted", "==", true)
        .get();

      const dates = new Set();
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.deletedAt) {
          const date = data.deletedAt.toDate ? 
            data.deletedAt.toDate() : 
            new Date(data.deletedAt);
          dates.add(date.toISOString().split('T')[0]);
        }
      });

      const sortedDates = Array.from(dates).sort((a, b) => new Date(b) - new Date(a));

      dateFilter.innerHTML = '<option value="">Tanggal Hapus: Semua</option>';
      sortedDates.forEach(date => {
        const option = document.createElement("option");
        option.value = date;
        option.textContent = Utils.formatDate(date);
        dateFilter.appendChild(option);
      });

    } catch (error) {
      console.error("❌ Error populating date filter:", error);
    }
  }

  // ========================================
  // RESTORE SURAT - SUPPORT ALL TYPES
  // ========================================
  window.restoreSurat = async function (id, type) {
    try {
      console.log("🔄 Attempting to restore:", type, id);

      const collectionName = type === "masuk" ? "surat_masuk" : 
                            type === "nota_dinas" ? "nota_dinas" : 
                            "surat_keluar";

      const doc = await db.collection(collectionName).doc(id).get();

      if (!doc.exists) {
        Notification.error("Surat tidak ditemukan.");
        return;
      }

      const surat = { id: doc.id, ...doc.data() };

      window.loadSwal(() => {
        Swal.fire({
          title: "Pulihkan Surat?",
          html: `<p>Yakin ingin memulihkan:<br><strong>"${surat.perihal || 'Tanpa Judul'}"</strong>?<br><br>Surat akan kembali ke <strong>${surat.typeName || (type === 'masuk' ? 'Surat Masuk' : type === 'nota_dinas' ? 'Nota Dinas' : 'Surat Keluar')}</strong>.</p>`,
          icon: "question",
          showCancelButton: true,
          confirmButtonText: "Ya, Pulihkan",
          cancelButtonText: "Batal",
          confirmButtonColor: "#28a745",
          cancelButtonColor: "#6c757d",
          reverseButtons: true,
        }).then(async (result) => {
          if (result.isConfirmed) {
            try {
              Swal.fire({
                title: 'Memulihkan...',
                text: 'Mohon tunggu',
                allowOutsideClick: false,
                showConfirmButton: false,
                willOpen: () => {
                  Swal.showLoading();
                }
              });

              await db.collection(collectionName).doc(id).update({
                isDeleted: false,
                deletedAt: firebase.firestore.FieldValue.delete(),
                deletedBy: firebase.firestore.FieldValue.delete(),
                deletedByUid: firebase.firestore.FieldValue.delete(),
                restoredAt: firebase.firestore.FieldValue.serverTimestamp(),
                restoredBy: currentUserData?.nama || currentUserData?.email || "Unknown",
                restoredByUid: currentUserData?.uid || null,
              });

              console.log("✅ Surat restored successfully");

              Swal.fire({
                icon: "success",
                title: "Berhasil Dipulihkan!",
                html: `<p>Surat "<strong>${surat.perihal || 'Tanpa Judul'}</strong>" berhasil dipulihkan!</p>`,
                timer: 3000,
                showConfirmButton: true,
                confirmButtonText: "OK",
                confirmButtonColor: "#28a745"
              });

            } catch (error) {
              console.error("❌ Error restoring:", error);

              Swal.fire({
                icon: "error",
                title: "Gagal Memulihkan",
                text: "Terjadi kesalahan: " + error.message,
                confirmButtonColor: "#dc3545"
              });
            }
          }
        });
      });

    } catch (error) {
      console.error("❌ Error in restoreSurat:", error);
      Notification.error("Gagal memulihkan surat: " + error.message);
    }
  };

  // ========================================
  // PERMANENT DELETE - SUPPORT ALL TYPES
  // ========================================
  window.permanentDeleteSurat = async function (id, type, perihal) {
    try {
      console.log("🗑️ Attempting permanent delete:", type, id);

      const collectionName = type === "masuk" ? "surat_masuk" : 
                            type === "nota_dinas" ? "nota_dinas" : 
                            "surat_keluar";

      const doc = await db.collection(collectionName).doc(id).get();

      if (!doc.exists) {
        Notification.error("Surat tidak ditemukan.");
        return;
      }

      window.loadSwal(() => {
        Swal.fire({
          title: "Hapus Permanen?",
          html: `
            <div style="text-align: center;">
              <i class="bi bi-exclamation-triangle" style="font-size: 64px; color: #dc3545; margin-bottom: 20px;"></i>
              <p style="font-size: 16px; margin-bottom: 10px;">Yakin ingin <strong>menghapus permanen</strong>:</p>
              <p style="font-size: 18px; font-weight: bold; color: #dc3545; margin-bottom: 20px;">"${perihal}"</p>
              <p style="font-size: 14px; color: #666;">⚠️ <strong>AKSI INI TIDAK BISA DIBATALKAN!</strong></p>
              <p style="font-size: 14px; color: #666;">Data akan terhapus selamanya dari database.</p>
            </div>
          `,
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Ya, Hapus Permanen",
          cancelButtonText: "Batal",
          confirmButtonColor: "#dc3545",
          cancelButtonColor: "#6c757d",
          reverseButtons: true,
        }).then(async (result) => {
          if (result.isConfirmed) {
            try {
              Swal.fire({
                title: 'Menghapus Permanen...',
                text: 'Mohon tunggu',
                allowOutsideClick: false,
                showConfirmButton: false,
                willOpen: () => {
                  Swal.showLoading();
                }
              });

              // PERMANENT DELETE from Firestore
              await db.collection(collectionName).doc(id).delete();

              console.log("✅ Document permanently deleted");

              Swal.fire({
                icon: "success",
                title: "Terhapus Permanen!",
                html: `<p>Surat "<strong>${perihal}</strong>" telah dihapus permanen dari database.</p>`,
                timer: 3000,
                showConfirmButton: true,
                confirmButtonText: "OK",
                confirmButtonColor: "#28a745"
              });

            } catch (error) {
              console.error("❌ Error permanent delete:", error);

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
      console.error("❌ Error in permanentDeleteSurat:", error);
      Notification.error("Gagal menghapus permanen: " + error.message);
    }
  };

  // ========================================
  // CLEANUP
  // ========================================
  window.addEventListener("beforeunload", () => {
    if (unsubscribeDeleted) {
      console.log("🧹 Cleaning up real-time listener");
      unsubscribeDeleted();
    }
  });

})();

console.log("✅ Surat Dihapus JS - Firebase Integrated");