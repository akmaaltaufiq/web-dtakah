// ========================================
// ARSIP - FIREBASE INTEGRATED (FIXED WITH DISPOSISI)
// Mengumpulkan semua surat yang sudah diproses (disetujui/disposisi)
// ========================================
(function () {
  "use strict";

  console.log("📚 Arsip Script Loading v2.0...");

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

    if (
      sifatLower.includes("sangat rahasia") ||
      sifatLower.includes("sangat urgent")
    ) {
      return {
        bg: "#fee2e2",
        text: "#991b1b",
        label: "Sangat Rahasia",
      };
    } else if (
      sifatLower.includes("rahasia") ||
      sifatLower.includes("urgent")
    ) {
      return {
        bg: "#fed7aa",
        text: "#9a3412",
        label: "Rahasia",
      };
    } else {
      return {
        bg: "#dbeafe",
        text: "#1e40af",
        label: "Umum",
      };
    }
  }

  // ========================================
  // HELPER - GET STATUS BADGE
  // ========================================
  function getStatusBadge(status) {
    const statusLower = (status || "").toLowerCase();

    if (
      statusLower.includes("sudah didisposisi") ||
      statusLower.includes("selesai")
    ) {
      return {
        bg: "#d1fae5",
        text: "#065f46",
        icon: "check-circle-fill",
        label: status,
      };
    } else if (statusLower.includes("disetujui")) {
      return {
        bg: "#dbeafe",
        text: "#1e40af",
        icon: "check-circle",
        label: status,
      };
    } else {
      return {
        bg: "#fef3c7",
        text: "#92400e",
        icon: "clock",
        label: status,
      };
    }
  }

  // ========================================
  // INITIALIZATION
  // ========================================
  window.initializeArsipPage = function () {
    console.log("✅ Arsip Page Initialized v2.0");

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

    unsubscribeArsip = () => {
      unsubscribeMasuk();
      unsubscribeKeluar();
      unsubscribeNota();
    };

    console.log("✅ Real-time listeners setup completed");
  }

  // ========================================
  // FETCH ARSIP DATA - INCLUDE DISPOSISI
  // ========================================
  async function fetchArsipData() {
    try {
      console.log(
        "🔍 Fetching arsip data from Firebase (including disposisi)..."
      );

      const arsipData = [];

      // ========================================
      // 1. FETCH SURAT MASUK
      // ========================================
      const masukSnapshot = await db.collection("surat_masuk").get();
      masukSnapshot.forEach((doc) => {
        const data = doc.data();

        // Filter: Tidak dihapus DAN (sudah selesai/disetujui/disposisi)
        const isArchivable =
          data.isDeleted !== true &&
          (data.status === "Selesai" ||
            data.status === "Disetujui Kapus" ||
            data.status === "Selesai - Sudah Didisposisi" || // ✅ TAMBAHAN INI
            data.status === "Terkirim ke Kapus" ||
            (data.disposisi && data.disposisi.length > 0)); // ✅ JIKA ADA DISPOSISI

        if (isArchivable) {
          // Get disposisi info if exists
          const disposisiCount = data.disposisi ? data.disposisi.length : 0;
          const lastDisposisi =
            disposisiCount > 0 ? data.disposisi[disposisiCount - 1] : null;

          arsipData.push({
            id: doc.id,
            ...data,
            jenisArsip: "Surat Masuk",
            type: "surat_masuk",
            disposisiCount: disposisiCount,
            lastDisposisi: lastDisposisi,
            _createdAt: data.createdAt?.toDate
              ? data.createdAt.toDate()
              : new Date(data.createdAt || Date.now()),
          });
        }
      });

      console.log(
        "📥 Surat Masuk yang diarsipkan:",
        arsipData.filter((d) => d.type === "surat_masuk").length,
        "items (including",
        arsipData.filter(
          (d) => d.type === "surat_masuk" && d.disposisiCount > 0
        ).length,
        "with disposisi)"
      );

      // ========================================
      // 2. FETCH SURAT KELUAR
      // ========================================
      const keluarSnapshot = await db.collection("surat_keluar").get();
      keluarSnapshot.forEach((doc) => {
        const data = doc.data();

        if (
          data.isDeleted !== true &&
          (data.status === "Selesai" ||
            data.status === "Disetujui Kapus" ||
            data.status === "Siap Kirim")
        ) {
          arsipData.push({
            id: doc.id,
            ...data,
            jenisArsip: "Surat Keluar",
            type: "surat_keluar",
            disposisiCount: 0,
            _createdAt: data.createdAt?.toDate
              ? data.createdAt.toDate()
              : new Date(data.createdAt || Date.now()),
          });
        }
      });

      console.log(
        "📤 Surat Keluar yang diarsipkan:",
        arsipData.filter((d) => d.type === "surat_keluar").length
      );

      // ========================================
      // 3. FETCH NOTA DINAS
      // ========================================
      const notaSnapshot = await db.collection("nota_dinas").get();
      notaSnapshot.forEach((doc) => {
        const data = doc.data();

        if (
          data.isDeleted !== true &&
          (data.status === "Selesai" ||
            data.status === "Disetujui Kapus" ||
            data.status === "Disetujui" ||
            (data.status === "Proses" &&
              data.ditujukanKepada &&
              !data.ditujukanKepada.toLowerCase().includes("kapus")))
        ) {
          arsipData.push({
            id: doc.id,
            ...data,
            jenisArsip: "Nota Dinas",
            type: "nota_dinas",
            disposisiCount: 0,
            _createdAt: data.createdAt?.toDate
              ? data.createdAt.toDate()
              : new Date(data.createdAt || Date.now()),
          });
        }
      });

      console.log(
        "📝 Nota Dinas yang diarsipkan:",
        arsipData.filter((d) => d.type === "nota_dinas").length
      );

      // Sort by date (newest first)
      arsipData.sort((a, b) => b._createdAt - a._createdAt);

      console.log("📊 Total arsip data:", arsipData.length);
      console.log("📋 Breakdown:");
      console.log(
        "  - Surat Masuk:",
        arsipData.filter((d) => d.type === "surat_masuk").length
      );
      console.log(
        "  - Surat Keluar:",
        arsipData.filter((d) => d.type === "surat_keluar").length
      );
      console.log(
        "  - Nota Dinas:",
        arsipData.filter((d) => d.type === "nota_dinas").length
      );
      console.log(
        "  - With Disposisi:",
        arsipData.filter((d) => d.disposisiCount > 0).length
      );

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
    const searchInput =
      document.getElementById("arsipSearch")?.value.toLowerCase() || "";
    const jenisFilter =
      document.getElementById("jenisArsipFilter")?.value || "";
    const statusFilter =
      document.getElementById("statusArsipFilter")?.value || "";

    const filtered = data.filter((item) => {
      // Filter by search
      const matchesSearch =
        !searchInput ||
        (item.perihal && item.perihal.toLowerCase().includes(searchInput)) ||
        (item.noSurat && item.noSurat.toLowerCase().includes(searchInput)) ||
        (item.noNaskah && item.noNaskah.toLowerCase().includes(searchInput)) ||
        (item.dari && item.dari.toLowerCase().includes(searchInput));

      // Filter by jenis arsip
      let matchesJenis = true;
      if (jenisFilter) {
        matchesJenis = item.type === jenisFilter;
      }

      // Filter by status (disposisi or not)
      let matchesStatus = true;
      if (statusFilter === "disposisi") {
        matchesStatus = item.disposisiCount > 0;
      } else if (statusFilter === "disetujui") {
        matchesStatus =
          item.status && item.status.toLowerCase().includes("disetujui");
      }

      return matchesSearch && matchesJenis && matchesStatus;
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

    // Emit event for stats update
    window.dispatchEvent(
      new CustomEvent("arsipDataUpdated", {
        detail: rawData,
      })
    );
  }

  // ========================================
  // RENDER TABLE - ENHANCED WITH DISPOSISI INFO
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
          <td colspan="6" style="text-align: center; padding: 60px 20px; color: #9ca3af;">
            <i class="bi bi-archive" style="font-size: 48px; display: block; margin-bottom: 16px; opacity: 0.5;"></i>
            <div style="font-size: 16px; font-weight: 500;">Belum ada arsip</div>
            <div style="font-size: 14px; margin-top: 8px;">Arsip akan muncul setelah surat diproses (disetujui/disposisi)</div>
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
        const sifat =
          item.sifatSurat || item.sifatNaskah || item.sifat || "Umum";

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

        // Get status badge
        const statusBadge = getStatusBadge(item.status);

        // Disposisi badge (if exists)
        let disposisiBadge = "";
        if (item.disposisiCount > 0) {
          disposisiBadge = `
            <div style="display: inline-block; margin-left: 8px; padding: 4px 10px; background: #d1fae5; color: #065f46; border-radius: 12px; font-size: 11px; font-weight: 600;">
              <i class="bi bi-clipboard-check"></i> ${item.disposisiCount} Disposisi
            </div>
          `;
        }

        return `
          <tr>
            <td class="nomor-naskah">${Utils.escapeHtml(noSurat)}</td>
            <td class="jenis-judul">
              <div class="jenis-title">${Utils.escapeHtml(judul)}</div>
              <div style="margin-top: 6px;">
                <span style="display: inline-block; padding: 4px 10px; background: ${badgeColor}; color: ${badgeTextColor}; border-radius: 4px; font-size: 11px; font-weight: 600;">
                  ${Utils.escapeHtml(item.jenisArsip)}
                </span>
                ${disposisiBadge}
              </div>
            </td>
            <td class="bidang-text">${Utils.escapeHtml(perihal)}</td>
            <td>
              <span class="tanggal-badge" style="background: ${
                sifatStyle.bg
              }; color: ${sifatStyle.text}; border: 1px solid ${
          sifatStyle.text
        }33;">
                ${Utils.escapeHtml(sifatStyle.label)}
              </span>
            </td>
            <td>
              <span style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; background: ${
                statusBadge.bg
              }; color: ${
          statusBadge.text
        }; border-radius: 12px; font-size: 12px; font-weight: 600;">
                <i class="bi bi-${statusBadge.icon}"></i>
                ${Utils.escapeHtml(statusBadge.label)}
              </span>
            </td>
            <td>
              <div class="action-buttons">
                <button class="action-btn" onclick="previewArsip('${
                  item.id
                }', '${item.type}')" title="Preview">
                  <i class="bi bi-eye"></i>
                </button>
                ${
                  item.disposisiCount > 0
                    ? `
                  <button class="action-btn" onclick="viewDisposisiDetail('${item.id}')" title="Lihat Disposisi" style="background: #d1fae5; color: #065f46;">
                    <i class="bi bi-clipboard-check"></i>
                  </button>
                `
                    : ""
                }
                <button class="action-btn" onclick="downloadArsip('${
                  item.id
                }', '${item.type}')" title="Download">
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
  // VIEW DISPOSISI DETAIL
  // ========================================
  window.viewDisposisiDetail = async function (id) {
    console.log("📋 Viewing disposisi detail for:", id);

    try {
      const doc = await db.collection("surat_masuk").doc(id).get();

      if (!doc.exists) {
        Swal.fire("Error", "Surat tidak ditemukan", "error");
        return;
      }

      const surat = doc.data();
      const disposisi = surat.disposisi || [];

      if (disposisi.length === 0) {
        Swal.fire("Info", "Tidak ada disposisi untuk surat ini", "info");
        return;
      }

      const disposisiHTML = disposisi
        .map((disp, idx) => {
          const tanggalDisp = disp.tanggal
            ? new Date(disp.tanggal).toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "-";

          return `
          <div style="background: white; padding: 16px; border-radius: 8px; margin-bottom: 12px; border-left: 4px solid #10b981; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
              <div style="flex: 1;">
                <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px; font-size: 15px;">
                  <i class="bi bi-arrow-right-circle"></i> ${
                    disp.judul || "Disposisi"
                  }
                </div>
                <div style="font-size: 13px; color: #6b7280; margin-bottom: 8px;">
                  <i class="bi bi-person-badge"></i> ${disp.dari} • ${
            disp.jabatanDari || "Kepala Pusat"
          }
                </div>
              </div>
              <span style="background: #d1fae5; color: #065f46; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">
                <i class="bi bi-check-circle"></i> ${disp.status || "Proses"}
              </span>
            </div>
            
            <div style="background: #f9fafb; padding: 12px; border-radius: 6px; margin-bottom: 8px;">
              <div style="font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 4px; text-transform: uppercase;">
                <i class="bi bi-people"></i> Ditujukan Kepada:
              </div>
              <div style="color: #1f2937; font-size: 14px; font-weight: 500;">
                ${disp.kepada}
              </div>
            </div>
            
            ${
              disp.instruksi
                ? `
              <div style="margin-bottom: 8px; padding: 10px; background: #fffbeb; border-left: 3px solid #f59e0b; border-radius: 4px;">
                <strong style="font-size: 12px; color: #92400e; text-transform: uppercase;">
                  <i class="bi bi-chat-left-text"></i> Instruksi:
                </strong>
                <div style="color: #78350f; font-size: 14px; margin-top: 4px;">
                  ${disp.instruksi}
                </div>
              </div>
            `
                : ""
            }
            
            <div style="display: flex; gap: 16px; margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af;">
              <span><i class="bi bi-calendar-event"></i> ${tanggalDisp}</span>
              <span><i class="bi bi-flag-fill"></i> Prioritas: ${
                disp.prioritas || "Normal"
              }</span>
            </div>
          </div>
        `;
        })
        .join("");

      Swal.fire({
        title: `<i class="bi bi-clipboard-check"></i> Riwayat Disposisi (${disposisi.length})`,
        html: `
          <div style="text-align: left; padding: 0 20px; max-height: 500px; overflow-y: auto;">
            <div style="background: #eff6ff; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
              <div style="font-weight: 600; color: #1e40af; margin-bottom: 4px;">
                ${surat.perihal || "Tanpa Perihal"}
              </div>
              <div style="font-size: 13px; color: #3b82f6;">
                <i class="bi bi-hash"></i> ${surat.noSurat || "-"}
              </div>
            </div>
            
            ${disposisiHTML}
          </div>
        `,
        width: "700px",
        confirmButtonText: "Tutup",
        confirmButtonColor: "#6b7280",
        customClass: {
          htmlContainer: "monitoring-detail-content",
        },
      });
    } catch (error) {
      console.error("❌ Error viewing disposisi:", error);
      Swal.fire("Error", "Gagal memuat detail disposisi", "error");
    }
  };

  // ========================================
  // PREVIEW ARSIP
  // ========================================
  window.previewArsip = async function (id, type) {
    console.log("👁️ Preview arsip:", id, type);

    try {
      const doc = await db.collection(type).doc(id).get();

      if (!doc.exists) {
        Swal.fire("Error", "Arsip tidak ditemukan", "error");
        return;
      }

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
      Swal.fire("Error", "Gagal menampilkan preview", "error");
    }
  };

  // ========================================
  // DOWNLOAD ARSIP
  // ========================================
  window.downloadArsip = function (id, type) {
    console.log("📥 Download arsip:", id, type);
    Swal.fire({
      icon: "info",
      title: "Coming Soon",
      text: "Fitur download akan segera tersedia",
      timer: 2000,
    });
  };

  // ========================================
  // FILTERS
  // ========================================
  function setupArsipFilters() {
    const searchInput = document.getElementById("arsipSearch");
    const jenisFilter = document.getElementById("jenisArsipFilter");
    const statusFilter = document.getElementById("statusArsipFilter");

    searchInput?.addEventListener("input", () => {
      currentPageArsip = 1;
      fetchAndRenderArsip();
    });

    jenisFilter?.addEventListener("change", () => {
      currentPageArsip = 1;
      fetchAndRenderArsip();
    });

    statusFilter?.addEventListener("change", () => {
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
    const startIndex =
      totalItems > 0 ? (currentPageArsip - 1) * itemsPerPageArsip + 1 : 0;
    const endIndex = Math.min(currentPageArsip * itemsPerPageArsip, totalItems);

    const infoElement = document.querySelector(".showing-info");
    if (infoElement) {
      infoElement.textContent = `Showing ${startIndex}-${endIndex} of ${totalItems}`;
    }

    const prevBtn = document.querySelector(".pagination-btn:first-child");
    const nextBtn = document.querySelector(".pagination-btn:last-child");
    const maxPage = Math.ceil(totalItems / itemsPerPageArsip);

    if (prevBtn) prevBtn.disabled = currentPageArsip === 1;
    if (nextBtn)
      nextBtn.disabled = currentPageArsip >= maxPage || totalItems === 0;
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

        if (index === 0) {
          document.querySelector(".arsip-table")?.classList.remove("grid-view");
          console.log("📋 Switched to list view");
        } else {
          document.querySelector(".arsip-table")?.classList.add("grid-view");
          console.log("🎛️ Switched to grid view");
          Swal.fire({
            icon: "info",
            title: "Coming Soon",
            text: "Grid view akan segera tersedia",
            timer: 2000,
          });
        }
      });
    });
  }

  // ========================================
  // UTILS
  // ========================================
  const Utils = {
    escapeHtml(text) {
      const map = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      };
      return String(text || "").replace(/[&<>"']/g, (m) => map[m]);
    },
  };

  // Make Utils global if not already
  if (!window.Utils) {
    window.Utils = Utils;
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

  console.log(
    "✅ Arsip Script Loaded v2.0 - Firebase Integrated with Disposisi Support"
  );
})();
