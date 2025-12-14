// ========================================
// ARSIP - FIREBASE INTEGRATED (FIXED)
// Mengumpulkan semua surat yang sudah disetujui Kapus
// ========================================
(function () {
  "use strict";

  console.log("📚 Arsip Script Loading...");

  let currentPageArsip = 1;
  const itemsPerPageArsip = 10;
  let currentUserData = null;
  let unsubscribeArsip = null;
  let allArsipData = [];

  // ========================================
  // HELPER - GET SIFAT BADGE COLOR
  // ========================================
  function getSifatBadgeStyle(sifat) {
    const sifatLower = (sifat || "umum").toLowerCase();
    
    if (sifatLower.includes("sangat rahasia") || sifatLower.includes("sangat urgent")) {
      return {
        bg: "#fee2e2",
        text: "#991b1b",
        label: "Sangat Rahasia"
      };
    } else if (sifatLower.includes("rahasia") || sifatLower.includes("urgent")) {
      return {
        bg: "#fed7aa",
        text: "#9a3412",
        label: "Rahasia"
      };
    } else {
      return {
        bg: "#dbeafe",
        text: "#1e40af",
        label: "Umum"
      };
    }
  }

  // ========================================
  // INITIALIZATION
  // ========================================
  window.initializeArsipPage = function () {
    console.log("✅ Arsip Page Initialized");

    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        console.log("✅ User authenticated:", user.email);

        currentUserData = {
          uid: user.uid,
          email: user.email,
          nama: user.displayName || user.email,
        };

        setupRealtimeListeners();
        setupArsipFilters();
        setupPagination();
        setupViewToggle();
      } else {
        console.error("❌ No user logged in!");
        window.location.href = "login.html";
      }
    });
  };

  // ========================================
  // REAL-TIME LISTENERS - GABUNGAN 3 KOLEKSI
  // ========================================
  function setupRealtimeListeners() {
    console.log("🔌 Setting up real-time listeners for arsip...");

    // Listen to all 3 collections
    const unsubscribeMasuk = db.collection("surat_masuk").onSnapshot(() => {
      console.log("📥 Surat Masuk updated");
      fetchAndRenderArsip();
    });

    const unsubscribeKeluar = db.collection("surat_keluar").onSnapshot(() => {
      console.log("📤 Surat Keluar updated");
      fetchAndRenderArsip();
    });

    const unsubscribeNota = db.collection("nota_dinas").onSnapshot(() => {
      console.log("📝 Nota Dinas updated");
      fetchAndRenderArsip();
    });

    // Cleanup function
    unsubscribeArsip = () => {
      unsubscribeMasuk();
      unsubscribeKeluar();
      unsubscribeNota();
    };

    console.log("✅ Real-time listeners setup completed");
  }

  // ========================================
  // FETCH ARSIP DATA - FILTER YANG DISETUJUI
  // ========================================
  async function fetchArsipData() {
    try {
      console.log("🔍 Fetching arsip data from Firebase...");

      const arsipData = [];

      // 1. FETCH SURAT MASUK (yang sudah selesai/disetujui)
      const masukSnapshot = await db.collection("surat_masuk").get();
      masukSnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Filter: Tidak dihapus DAN sudah disetujui/selesai
        if (
          data.isDeleted !== true &&
          (data.status === "Selesai" || 
           data.status === "Disetujui Kapus" ||
           data.status === "Terkirim ke Kapus")
        ) {
          arsipData.push({
            id: doc.id,
            ...data,
            jenisArsip: "Surat Masuk",
            type: "surat_masuk",
            _createdAt: data.createdAt?.toDate
              ? data.createdAt.toDate()
              : new Date(data.createdAt || Date.now()),
          });
        }
      });

      console.log("📥 Surat Masuk yang diarsipkan:", arsipData.filter(d => d.type === "surat_masuk").length);

      // 2. FETCH SURAT KELUAR (yang sudah disetujui Kapus)
      const keluarSnapshot = await db.collection("surat_keluar").get();
      keluarSnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Filter: Tidak dihapus DAN sudah disetujui
        if (
          data.isDeleted !== true &&
          (data.status === "Selesai" || 
           data.status === "Disetujui Kapus")
        ) {
          arsipData.push({
            id: doc.id,
            ...data,
            jenisArsip: "Surat Keluar",
            type: "surat_keluar",
            _createdAt: data.createdAt?.toDate
              ? data.createdAt.toDate()
              : new Date(data.createdAt || Date.now()),
          });
        }
      });

      console.log("📤 Surat Keluar yang diarsipkan:", arsipData.filter(d => d.type === "surat_keluar").length);

      // 3. FETCH NOTA DINAS (yang sudah disetujui Kapus)
      const notaSnapshot = await db.collection("nota_dinas").get();
      notaSnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Filter: Tidak dihapus DAN sudah disetujui
        if (
          data.isDeleted !== true &&
          (data.status === "Selesai" || 
           data.status === "Disetujui Kapus" ||
           data.status === "Proses" && data.ditujukanKepada && 
           !data.ditujukanKepada.toLowerCase().includes("kapus"))
        ) {
          arsipData.push({
            id: doc.id,
            ...data,
            jenisArsip: "Nota Dinas",
            type: "nota_dinas",
            _createdAt: data.createdAt?.toDate
              ? data.createdAt.toDate()
              : new Date(data.createdAt || Date.now()),
          });
        }
      });

      console.log("📝 Nota Dinas yang diarsipkan:", arsipData.filter(d => d.type === "nota_dinas").length);

      // Sort by date (newest first)
      arsipData.sort((a, b) => b._createdAt - a._createdAt);

      console.log("📊 Total arsip data:", arsipData.length);
      return arsipData;

    } catch (error) {
      console.error("❌ Error fetching arsip data:", error);
      return [];
    }
  }

  // ========================================
  // APPLY FILTERS
  // ========================================
  function applyFilters(data) {
    const searchInput = document.getElementById("arsipSearch")?.value.toLowerCase() || "";
    const jenisFilter = document.getElementById("jenisArsipFilter")?.value || "";

    const filtered = data.filter((item) => {
      // Filter by search
      const matchesSearch = !searchInput ||
        (item.perihal && item.perihal.toLowerCase().includes(searchInput)) ||
        (item.noSurat && item.noSurat.toLowerCase().includes(searchInput)) ||
        (item.noNaskah && item.noNaskah.toLowerCase().includes(searchInput)) ||
        (item.dari && item.dari.toLowerCase().includes(searchInput));

      // Filter by jenis arsip (berdasarkan type collection)
      let matchesJenis = true;
      if (jenisFilter) {
        matchesJenis = item.type === jenisFilter;
      }

      return matchesSearch && matchesJenis;
    });

    console.log("📊 Filtered arsip:", filtered.length, "items");
    return filtered;
  }

  // ========================================
  // FETCH AND RENDER
  // ========================================
  async function fetchAndRenderArsip() {
    const rawData = await fetchArsipData();
    allArsipData = applyFilters(rawData);
    renderArsipTable();
  }

  // ========================================
  // RENDER TABLE
  // ========================================
  function renderArsipTable() {
    const tbody = document.getElementById("arsipTableBody");
    if (!tbody) {
      console.error("❌ Table body not found!");
      return;
    }

    console.log("🔄 Rendering arsip table...");

    // Pagination
    const startIndex = (currentPageArsip - 1) * itemsPerPageArsip;
    const paginatedData = allArsipData.slice(
      startIndex,
      startIndex + itemsPerPageArsip
    );

    if (paginatedData.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 60px 20px; color: #9ca3af;">
            <i class="bi bi-archive" style="font-size: 48px; display: block; margin-bottom: 16px; opacity: 0.5;"></i>
            <div style="font-size: 16px; font-weight: 500;">Belum ada arsip</div>
            <div style="font-size: 14px; margin-top: 8px;">Arsip akan muncul setelah surat disetujui oleh Kapus</div>
          </td>
        </tr>
      `;
      updatePaginationInfo(0);
      return;
    }

    tbody.innerHTML = paginatedData
      .map((item, index) => {
        const rowNumber = startIndex + index + 1;
        const noSurat = item.noSurat || item.noNaskah || "-";
        const judul = item.perihal || "-";
        const perihal = item.deskripsi || item.catatan || item.perihal || "-";
        const sifat = item.sifatSurat || item.sifatNaskah || item.sifat || "Umum";

        // Badge color based on type
        let badgeColor = "#f0f0f0";
        let badgeTextColor = "#666";
        
        if (item.type === "surat_masuk") {
          badgeColor = "#dbeafe";
          badgeTextColor = "#1e40af";
        } else if (item.type === "surat_keluar") {
          badgeColor = "#d1fae5";
          badgeTextColor = "#065f46";
        } else if (item.type === "nota_dinas") {
          badgeColor = "#fef3c7";
          badgeTextColor = "#92400e";
        }

        // Get sifat badge style
        const sifatStyle = getSifatBadgeStyle(sifat);

        return `
          <tr>
            <td class="nomor-naskah">${Utils.escapeHtml(noSurat)}</td>
            <td class="jenis-judul">
              <div class="jenis-title">${Utils.escapeHtml(judul)}</div>
              <div style="display: inline-block; margin-top: 6px; padding: 4px 10px; background: ${badgeColor}; color: ${badgeTextColor}; border-radius: 4px; font-size: 11px; font-weight: 600;">
                ${Utils.escapeHtml(item.jenisArsip)}
              </div>
            </td>
            <td class="bidang-text">${Utils.escapeHtml(perihal)}</td>
            <td>
              <span class="tanggal-badge" style="background: ${sifatStyle.bg}; color: ${sifatStyle.text}; border: 1px solid ${sifatStyle.text}33;">
                ${Utils.escapeHtml(sifatStyle.label)}
              </span>
            </td>
            <td>
              <div class="action-buttons">
                <button class="action-btn" onclick="previewArsip('${item.id}', '${item.type}')" title="Preview">
                  <i class="bi bi-eye"></i>
                </button>
                <button class="action-btn" onclick="downloadArsip('${item.id}', '${item.type}')" title="Download">
                  <i class="bi bi-download"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      })
      .join("");

    updatePaginationInfo(allArsipData.length);
    console.log("✅ Arsip table rendered!");
  }

  // ========================================
  // PREVIEW ARSIP
  // ========================================
  window.previewArsip = async function (id, type) {
    console.log("👁️ Preview arsip:", id, type);

    try {
      const doc = await db.collection(type).doc(id).get();

      if (!doc.exists) {
        Notification.error("Arsip tidak ditemukan!");
        return;
      }

      const data = { id: doc.id, ...doc.data() };

      // Redirect to appropriate detail page
      if (type === "surat_masuk") {
        window.location.href = `surat-masuk.html?preview=${id}`;
      } else if (type === "surat_keluar") {
        window.location.href = `surat-keluar.html?preview=${id}`;
      } else if (type === "nota_dinas") {
        window.location.href = `nota-dinas.html?preview=${id}`;
      }
    } catch (error) {
      console.error("❌ Error previewing arsip:", error);
      Notification.error("Gagal menampilkan preview");
    }
  };

  // ========================================
  // DOWNLOAD ARSIP
  // ========================================
  window.downloadArsip = function (id, type) {
    console.log("📥 Download arsip:", id, type);
    Notification.info("Fitur download akan segera tersedia");
  };

  // ========================================
  // FILTERS
  // ========================================
  function setupArsipFilters() {
    const searchInput = document.getElementById("arsipSearch");
    const jenisFilter = document.getElementById("jenisArsipFilter");

    searchInput?.addEventListener("input", () => {
      currentPageArsip = 1;
      fetchAndRenderArsip();
    });

    jenisFilter?.addEventListener("change", () => {
      currentPageArsip = 1;
      fetchAndRenderArsip();
    });
  }

  // ========================================
  // PAGINATION
  // ========================================
  function setupPagination() {
    const prevBtn = document.querySelector(".pagination-btn:first-child");
    const nextBtn = document.querySelector(".pagination-btn:last-child");

    prevBtn?.addEventListener("click", () => {
      if (currentPageArsip > 1) {
        currentPageArsip--;
        renderArsipTable();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });

    nextBtn?.addEventListener("click", () => {
      const maxPage = Math.ceil(allArsipData.length / itemsPerPageArsip);
      if (currentPageArsip < maxPage) {
        currentPageArsip++;
        renderArsipTable();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  }

  function updatePaginationInfo(totalItems) {
    const startIndex = totalItems > 0 ? (currentPageArsip - 1) * itemsPerPageArsip + 1 : 0;
    const endIndex = Math.min(currentPageArsip * itemsPerPageArsip, totalItems);

    const infoElement = document.querySelector(".showing-info");
    if (infoElement) {
      infoElement.textContent = `Showing ${startIndex}-${endIndex} of ${totalItems}`;
    }

    const prevBtn = document.querySelector(".pagination-btn:first-child");
    const nextBtn = document.querySelector(".pagination-btn:last-child");
    const maxPage = Math.ceil(totalItems / itemsPerPageArsip);

    if (prevBtn) prevBtn.disabled = currentPageArsip === 1;
    if (nextBtn) nextBtn.disabled = currentPageArsip >= maxPage || totalItems === 0;
  }

  // ========================================
  // VIEW TOGGLE (List/Grid)
  // ========================================
  function setupViewToggle() {
    const viewBtns = document.querySelectorAll(".view-btn");

    viewBtns.forEach((btn, index) => {
      btn.addEventListener("click", () => {
        viewBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        // Toggle view
        if (index === 0) {
          // List view
          document.querySelector(".arsip-table")?.classList.remove("grid-view");
          console.log("📋 Switched to list view");
        } else {
          // Grid view
          document.querySelector(".arsip-table")?.classList.add("grid-view");
          console.log("🎛️ Switched to grid view");
          Notification.info("Grid view akan segera tersedia");
        }
      });
    });
  }

  // ========================================
  // CLEANUP
  // ========================================
  window.addEventListener("beforeunload", () => {
    if (unsubscribeArsip) {
      console.log("🧹 Cleaning up arsip listeners");
      unsubscribeArsip();
    }
  });

  // ========================================
  // AUTO INIT
  // ========================================
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", window.initializeArsipPage);
  } else {
    window.initializeArsipPage();
  }

  console.log("✅ Arsip Script Loaded - Firebase Integrated");
})();