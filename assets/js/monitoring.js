// ==========================================
// MONITORING REAL-TIME - COMPLETE FIXED VERSION
// File: assets/js/monitoring.js
// Support: Admin & Kapus with Disposisi Details
// ==========================================
(function () {
  "use strict";

  console.log("🚀 Initializing Monitoring Real-Time v4.0 - Complete...");

  // ========================================
  // STATE MANAGEMENT
  // ========================================
  const MonitoringState = {
    currentUser: null,
    userRole: null,
    userEmail: null,
    suratMasuk: [],
    suratKeluar: [],
    notaDinas: [],
    allData: [],
    filteredData: [],
    currentTab: "masuk",
    searchQuery: "",
    statusFilter: "",
    dateFilter: null,
    currentPage: 1,
    itemsPerPage: 10,
    unsubscribers: [],
    selectedDate: null,
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
    isLoading: false,
    lastUpdate: null,
  };

  // ========================================
  // ROLE-BASED ACCESS CONTROL
  // ========================================
  const RoleManager = {
    canViewSurat(surat, userRole, userEmail) {
      if (userRole === "admin") {
        return true;
      }

      if (userRole === "kapus") {
        const kepada = (surat.kepada || "").toLowerCase();
        const tujuan = (surat.tujuan || "").toLowerCase();
        const status = (surat.status || "").toLowerCase();

        const isAddressedToKapus =
          kepada.includes("kapus") ||
          kepada.includes("kepala pusat") ||
          tujuan.includes("kapus") ||
          tujuan.includes("kepala pusat");

        const isRelevantStatus =
          status.includes("menunggu persetujuan kapus") ||
          status.includes("disetujui kapus") ||
          status.includes("ditolak kapus") ||
          status.includes("proses") ||
          status.includes("selesai") ||
          status.includes("sudah didisposisi");

        return isAddressedToKapus || isRelevantStatus;
      }

      return false;
    },

    getStatusInfo(status) {
      const statusLower = (status || "pending").toLowerCase();

      const statusMap = {
        pending: { bg: "#DBEAFE", text: "#1E40AF", icon: "clock" },
        proses: { bg: "#DBEAFE", text: "#1E40AF", icon: "arrow-repeat" },
        "terkirim ke kapus": { bg: "#DBEAFE", text: "#1E40AF", icon: "send" },
        "menunggu persetujuan kapus": {
          bg: "#FEF3C7",
          text: "#D97706",
          icon: "hourglass-split",
        },
        "menunggu ttd": { bg: "#FEF3C7", text: "#D97706", icon: "pen" },
        selesai: { bg: "#D1FAE5", text: "#059669", icon: "check-circle" },
        "selesai - sudah didisposisi": {
          bg: "#D1FAE5",
          text: "#059669",
          icon: "check-circle-fill",
        },
        "disetujui kapus": {
          bg: "#D1FAE5",
          text: "#059669",
          icon: "check-circle-fill",
        },
        "siap kirim": { bg: "#D1FAE5", text: "#059669", icon: "send-check" },
        diterima: { bg: "#D1FAE5", text: "#059669", icon: "check2-all" },
        ditolak: { bg: "#FEE2E2", text: "#DC2626", icon: "x-circle" },
        "ditolak kapus": {
          bg: "#FEE2E2",
          text: "#DC2626",
          icon: "x-circle-fill",
        },
        revisi: { bg: "#FEE2E2", text: "#DC2626", icon: "arrow-clockwise" },
      };

      return (
        statusMap[statusLower] || {
          bg: "#F3F4F6",
          text: "#6B7280",
          icon: "question-circle",
        }
      );
    },
  };

  // ========================================
  // FIREBASE REAL-TIME LISTENERS
  // ========================================
  const FirebaseMonitoring = {
    setupListeners() {
      console.log("🔌 Setting up Firebase real-time listeners...");
      this.cleanupListeners();
      this.listenToSuratMasuk();
      this.listenToSuratKeluar();
      this.listenToNotaDinas();
    },

    listenToSuratMasuk() {
      const unsubscribe = db
        .collection("surat_masuk")
        .where("isDeleted", "==", false)
        .onSnapshot(
          (snapshot) => {
            console.log("📨 Surat Masuk snapshot:", snapshot.size);

            const data = [];
            snapshot.forEach((doc) => {
              const docData = doc.data();
              data.push({
                id: doc.id,
                firestoreId: doc.id,
                type: "masuk",
                ...docData,
                _createdAt: docData.createdAt?.toDate?.() || new Date(),
              });
            });

            MonitoringState.suratMasuk = data.filter((surat) =>
              RoleManager.canViewSurat(
                surat,
                MonitoringState.userRole,
                MonitoringState.userEmail
              )
            );

            console.log(
              `✅ Surat Masuk: ${data.length} total, ${MonitoringState.suratMasuk.length} visible to ${MonitoringState.userRole}`
            );

            this.updateCombinedData();
          },
          (error) => {
            console.error("❌ Surat Masuk listener error:", error);
            UIManager.showError("Error loading Surat Masuk");
          }
        );

      MonitoringState.unsubscribers.push(unsubscribe);
    },

    listenToSuratKeluar() {
      const unsubscribe = db
        .collection("surat_keluar")
        .where("isDeleted", "==", false)
        .onSnapshot(
          (snapshot) => {
            console.log("📤 Surat Keluar snapshot:", snapshot.size);

            const data = [];
            snapshot.forEach((doc) => {
              const docData = doc.data();
              data.push({
                id: doc.id,
                firestoreId: doc.id,
                type: "keluar",
                ...docData,
                _createdAt: docData.createdAt?.toDate?.() || new Date(),
              });
            });

            MonitoringState.suratKeluar = data.filter((surat) =>
              RoleManager.canViewSurat(
                surat,
                MonitoringState.userRole,
                MonitoringState.userEmail
              )
            );

            console.log(
              `✅ Surat Keluar: ${data.length} total, ${MonitoringState.suratKeluar.length} visible to ${MonitoringState.userRole}`
            );

            this.updateCombinedData();
          },
          (error) => {
            console.error("❌ Surat Keluar listener error:", error);
            UIManager.showError("Error loading Surat Keluar");
          }
        );

      MonitoringState.unsubscribers.push(unsubscribe);
    },

    listenToNotaDinas() {
      const unsubscribe = db
        .collection("nota_dinas")
        .where("isDeleted", "==", false)
        .onSnapshot(
          (snapshot) => {
            console.log("📝 Nota Dinas snapshot:", snapshot.size);

            const data = [];
            snapshot.forEach((doc) => {
              const docData = doc.data();
              data.push({
                id: doc.id,
                firestoreId: doc.id,
                type: "nota-dinas",
                ...docData,
                _createdAt: docData.createdAt?.toDate?.() || new Date(),
              });
            });

            MonitoringState.notaDinas = data.filter((nota) =>
              RoleManager.canViewSurat(
                nota,
                MonitoringState.userRole,
                MonitoringState.userEmail
              )
            );

            console.log(
              `✅ Nota Dinas: ${data.length} total, ${MonitoringState.notaDinas.length} visible to ${MonitoringState.userRole}`
            );

            this.updateCombinedData();
          },
          (error) => {
            console.error("❌ Nota Dinas listener error:", error);
            UIManager.showError("Error loading Nota Dinas");
          }
        );

      MonitoringState.unsubscribers.push(unsubscribe);
    },

    updateCombinedData() {
      MonitoringState.allData = [
        ...MonitoringState.suratMasuk,
        ...MonitoringState.suratKeluar,
        ...MonitoringState.notaDinas,
      ];

      MonitoringState.allData.sort((a, b) => b._createdAt - a._createdAt);

      console.log("📊 Combined data:", MonitoringState.allData.length);

      UIManager.updateStatusFilterOptions();
      FilterManager.applyFilters();

      if (!MonitoringState.lastUpdate) {
        MonitoringState.lastUpdate = new Date();
        console.log(
          "✅ Initial data load complete at",
          MonitoringState.lastUpdate
        );
      }
    },

    cleanupListeners() {
      MonitoringState.unsubscribers.forEach((unsub) => unsub());
      MonitoringState.unsubscribers = [];
    },
  };

  // ========================================
  // FILTER MANAGER
  // ========================================
  const FilterManager = {
    applyFilters() {
      console.log("🔍 Applying filters...");

      let filtered = [...MonitoringState.allData];

      if (MonitoringState.currentTab !== "all") {
        filtered = filtered.filter(
          (item) => item.type === MonitoringState.currentTab
        );
      }

      if (
        MonitoringState.searchQuery &&
        MonitoringState.searchQuery.trim() !== ""
      ) {
        const query = MonitoringState.searchQuery.toLowerCase().trim();

        filtered = filtered.filter(
          (item) =>
            (item.perihal && item.perihal.toLowerCase().includes(query)) ||
            (item.noSurat && item.noSurat.toLowerCase().includes(query)) ||
            (item.noNaskah && item.noNaskah.toLowerCase().includes(query)) ||
            (item.dari && item.dari.toLowerCase().includes(query)) ||
            (item.namaPengirim &&
              item.namaPengirim.toLowerCase().includes(query)) ||
            (item.kepada && item.kepada.toLowerCase().includes(query))
        );
      }

      if (
        MonitoringState.statusFilter &&
        MonitoringState.statusFilter.trim() !== ""
      ) {
        const statusQuery = MonitoringState.statusFilter.toLowerCase().trim();
        filtered = filtered.filter((item) => {
          const itemStatus = (item.status || "pending").toLowerCase().trim();
          return itemStatus === statusQuery;
        });
      }

      if (MonitoringState.dateFilter) {
        filtered = filtered.filter((item) => {
          let itemDate = null;

          if (item.tanggalSurat) {
            itemDate = this.parseDate(item.tanggalSurat);
          } else if (item.tanggalDiterima) {
            itemDate = this.parseDate(item.tanggalDiterima);
          } else if (item.tanggalTerima) {
            itemDate = this.parseDate(item.tanggalTerima);
          } else if (item._createdAt) {
            itemDate = item._createdAt;
          }

          if (!itemDate) return false;

          return this.isSameDate(itemDate, MonitoringState.dateFilter);
        });
      }

      console.log(`✅ Filter complete: ${filtered.length} items`);

      MonitoringState.filteredData = filtered;
      MonitoringState.currentPage = 1;

      TableRenderer.render();
    },

    parseDate(dateInput) {
      if (!dateInput) return null;

      try {
        if (dateInput instanceof Date) {
          return isNaN(dateInput.getTime()) ? null : dateInput;
        }

        if (dateInput.toDate && typeof dateInput.toDate === "function") {
          return dateInput.toDate();
        }

        if (typeof dateInput === "string") {
          const parsed = new Date(dateInput);
          return isNaN(parsed.getTime()) ? null : parsed;
        }

        return null;
      } catch (e) {
        console.warn("⚠️ Error parsing date:", dateInput, e);
        return null;
      }
    },

    resetFilters() {
      console.log("🔄 Resetting filters...");

      MonitoringState.searchQuery = "";
      MonitoringState.statusFilter = "";
      MonitoringState.dateFilter = null;
      MonitoringState.selectedDate = null;
      MonitoringState.currentPage = 1;

      const searchInput = document.getElementById("searchPerihal");
      const statusFilter = document.getElementById("statusFilter");
      const dateText = document.getElementById("selectedDateText");

      if (searchInput) searchInput.value = "";
      if (statusFilter) statusFilter.selectedIndex = 0;
      if (dateText) dateText.textContent = "Tanggal";

      this.applyFilters();
    },

    isSameDate(date1, date2) {
      if (!date1 || !date2) return false;

      try {
        return (
          date1.getDate() === date2.getDate() &&
          date1.getMonth() === date2.getMonth() &&
          date1.getFullYear() === date2.getFullYear()
        );
      } catch (e) {
        return false;
      }
    },
  };

  // ========================================
  // TABLE RENDERER
  // ========================================
  const TableRenderer = {
    render() {
      const tbody = document.getElementById("monitoringTableBody");
      if (!tbody) return;

      const data = MonitoringState.filteredData;
      const startIndex =
        (MonitoringState.currentPage - 1) * MonitoringState.itemsPerPage;
      const endIndex = startIndex + MonitoringState.itemsPerPage;
      const pageData = data.slice(startIndex, endIndex);

      if (pageData.length === 0) {
        tbody.innerHTML = this.renderEmptyState();
        this.updatePagination(0);
        return;
      }

      tbody.innerHTML = pageData.map((item) => this.renderRow(item)).join("");
      this.updatePagination(data.length);
    },

    renderEmptyState() {
      return `
        <tr>
          <td colspan="7" style="text-align: center; padding: 60px 20px;">
            <i class="bi bi-inbox" style="font-size: 64px; color: #d1d5db; margin-bottom: 16px;"></i>
            <div style="font-size: 18px; font-weight: 600; color: #374151; margin-bottom: 8px;">
              Tidak ada data
            </div>
            <div style="font-size: 14px; color: #6b7280;">
              ${
                MonitoringState.searchQuery
                  ? "Coba gunakan kata kunci yang berbeda"
                  : "Belum ada data untuk ditampilkan"
              }
            </div>
          </td>
        </tr>
      `;
    },

    renderRow(item) {
      const dari = item.dari || item.namaPengirim || "-";
      const noSurat = item.noSurat || item.noNaskah || "-";
      const tanggalSurat = this.formatDate(
        item.tanggalSurat || item._createdAt
      );
      const kepada = item.kepada || item.tujuan || item.ditujukanKepada || "-";
      const perihal = item.perihal || "-";
      const status = item.status || "Pending";

      const statusInfo = RoleManager.getStatusInfo(status);

      const typeIcon =
        item.type === "masuk"
          ? "envelope-fill"
          : item.type === "keluar"
          ? "send-fill"
          : "file-earmark-text-fill";

      const typeLabel =
        item.type === "masuk"
          ? "Masuk"
          : item.type === "keluar"
          ? "Keluar"
          : "Nota Dinas";

      const actionButtons = `
        <button class="action-btn view-btn" onclick="MonitoringActions.viewDetail('${
          item.firestoreId
        }', '${item.type}')" title="Lihat Detail">
          <i class="bi bi-eye"></i>
        </button>
        ${
          MonitoringState.userRole === "admin"
            ? `
        <button class="action-btn delete-btn" onclick="MonitoringActions.deleteSurat('${
          item.firestoreId
        }', '${item.type}', '${Utils.escapeHtml(
                item.perihal || "surat ini"
              )}')" title="Hapus">
          <i class="bi bi-trash"></i>
        </button>
        `
            : ""
        }
      `;

      return `
        <tr>
          <td style="padding: 16px 12px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 40px; height: 40px; border-radius: 50%; background: #f3f4f6; display: flex; align-items: center; justify-content: center;">
                <i class="bi bi-person-circle" style="font-size: 24px; color: #6b7280;"></i>
              </div>
              <div>
                <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">${dari}</div>
                <div style="font-size: 12px; color: #9ca3af; display: flex; align-items: center; gap: 4px;">
                  <i class="bi bi-${typeIcon}" style="font-size: 10px;"></i>
                  <span>${typeLabel}</span>
                </div>
              </div>
            </div>
          </td>
          <td style="padding: 16px 12px; font-weight: 500; color: #374151;">${noSurat}</td>
          <td style="padding: 16px 12px; color: #6b7280;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <i class="bi bi-calendar3" style="font-size: 12px;"></i>
              <span>${tanggalSurat}</span>
            </div>
          </td>
          <td style="padding: 16px 12px; color: #374151;">${kepada}</td>
          <td style="padding: 16px 12px; max-width: 300px;">
            <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${perihal}">
              ${perihal}
            </div>
          </td>
          <td style="padding: 16px 12px; text-align: center;">
            <span style="
              background: ${statusInfo.bg};
              color: ${statusInfo.text};
              padding: 6px 12px;
              border-radius: 12px;
              font-size: 12px;
              font-weight: 600;
              display: inline-flex;
              align-items: center;
              gap: 6px;
            ">
              <i class="bi bi-${statusInfo.icon}" style="font-size: 12px;"></i>
              ${status}
            </span>
          </td>
          <td style="padding: 16px 12px; text-align: center;">
            <div style="display: flex; gap: 8px; justify-content: center;">
              ${actionButtons}
            </div>
          </td>
        </tr>
      `;
    },

    formatDate(dateInput) {
      if (!dateInput) return "-";

      try {
        const date =
          dateInput instanceof Date ? dateInput : new Date(dateInput);
        if (isNaN(date.getTime())) return "-";

        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();

        return `${day}/${month}/${year}`;
      } catch (e) {
        return "-";
      }
    },

    updatePagination(totalItems) {
      const startIndex =
        totalItems > 0
          ? (MonitoringState.currentPage - 1) * MonitoringState.itemsPerPage + 1
          : 0;
      const endIndex = Math.min(
        MonitoringState.currentPage * MonitoringState.itemsPerPage,
        totalItems
      );

      const infoElement = document.getElementById("monitoringPaginationInfo");
      if (infoElement) {
        infoElement.textContent = `Showing ${startIndex}-${endIndex} of ${totalItems}`;
      }

      const maxPage = Math.ceil(totalItems / MonitoringState.itemsPerPage);
      const prevBtn = document.getElementById("prevBtnMonitoring");
      const nextBtn = document.getElementById("nextBtnMonitoring");

      if (prevBtn) prevBtn.disabled = MonitoringState.currentPage === 1;
      if (nextBtn)
        nextBtn.disabled =
          MonitoringState.currentPage >= maxPage || totalItems === 0;
    },
  };

  // ========================================
  // UTILITIES
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
      return text.replace(/[&<>"']/g, (m) => map[m]);
    },
  };

  // ========================================
  // UI MANAGER
  // ========================================
  const UIManager = {
    showLoading() {
      const tbody = document.getElementById("monitoringTableBody");
      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" style="text-align: center; padding: 40px;">
              <div style="display: inline-block; animation: spin 1s linear infinite;">
                <i class="bi bi-arrow-repeat" style="font-size: 32px; color: #6b7280;"></i>
              </div>
              <div style="margin-top: 16px; color: #6b7280; font-size: 14px;">
                Loading data...
              </div>
            </td>
          </tr>
        `;
      }
    },

    showError(message) {
      const tbody = document.getElementById("monitoringTableBody");
      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" style="text-align: center; padding: 40px;">
              <i class="bi bi-exclamation-triangle" style="font-size: 48px; color: #dc2626; margin-bottom: 16px;"></i>
              <div style="font-size: 16px; font-weight: 600; color: #dc2626; margin-bottom: 8px;">
                ${message}
              </div>
            </td>
          </tr>
        `;
      }
    },

    updateStatusFilterOptions() {
      const statusFilter = document.getElementById("statusFilter");
      if (!statusFilter) return;

      const uniqueStatuses = [
        ...new Set(
          MonitoringState.allData
            .map((item) => item.status)
            .filter((status) => status && status.trim() !== "")
        ),
      ].sort();

      const currentValue = statusFilter.value;
      statusFilter.innerHTML = '<option value="">Semua Status</option>';

      uniqueStatuses.forEach((status) => {
        const option = document.createElement("option");
        option.value = status.toLowerCase();
        option.textContent = status;
        statusFilter.appendChild(option);
      });

      if (currentValue) {
        statusFilter.value = currentValue;
      }
    },
  };

  // ========================================
  // MONITORING ACTIONS - WITH DISPOSISI DETAILS
  // ========================================
  window.MonitoringActions = {
    viewDetail(id, type) {
      console.log("👁️ Viewing detail:", id, type);

      if (type !== "masuk") {
        const urlMap = {
          keluar: "surat-keluar.html",
          "nota-dinas": "nota-dinas.html",
        };
        if (urlMap[type]) {
          window.location.href = `${urlMap[type]}#detail-${id}`;
        }
        return;
      }

      db.collection("surat_masuk")
        .doc(id)
        .get()
        .then((doc) => {
          if (!doc.exists) {
            Swal.fire("Error", "Surat tidak ditemukan", "error");
            return;
          }

          const surat = doc.data();
          const disposisi = surat.disposisi || [];

          let disposisiHTML = "";
          if (disposisi.length > 0) {
            disposisiHTML = `
              <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin-top: 20px;">
                <h4 style="font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
                  <i class="bi bi-clipboard-check"></i> Riwayat Disposisi (${
                    disposisi.length
                  })
                </h4>
                ${disposisi
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
                        <i class="bi bi-check-circle"></i> ${
                          disp.status || "Proses"
                        }
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
                  .join("")}
              </div>
            `;
          } else {
            disposisiHTML = `
              <div style="background: #fef3c7; padding: 16px; border-radius: 8px; margin-top: 20px; text-align: center;">
                <i class="bi bi-info-circle" style="font-size: 32px; color: #d97706; margin-bottom: 8px;"></i>
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  Belum ada disposisi untuk surat ini
                </p>
              </div>
            `;
          }

          Swal.fire({
            title: '<i class="bi bi-envelope-open"></i> Detail Surat Masuk',
            html: `
              <div style="text-align: left; padding: 0 20px; max-height: 600px; overflow-y: auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px; margin-bottom: 20px; color: white;">
                  <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 700;">
                    ${surat.perihal || "Tanpa Perihal"}
                  </h3>
                  <div style="opacity: 0.9; font-size: 13px;">
                    <i class="bi bi-hash"></i> ${surat.noSurat || "-"}
                  </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                  <div style="background: #f9fafb; padding: 12px; border-radius: 8px;">
                    <div style="font-size: 11px; font-weight: 600; color: #6b7280; margin-bottom: 4px; text-transform: uppercase;">
                      <i class="bi bi-building"></i> Dari
                    </div>
                    <div style="color: #1f2937; font-size: 14px; font-weight: 500;">
                      ${surat.dari || surat.namaPengirim || "-"}
                    </div>
                  </div>
                  
                  <div style="background: #f9fafb; padding: 12px; border-radius: 8px;">
                    <div style="font-size: 11px; font-weight: 600; color: #6b7280; margin-bottom: 4px; text-transform: uppercase;">
                      <i class="bi bi-calendar3"></i> Tanggal Surat
                    </div>
                    <div style="color: #1f2937; font-size: 14px; font-weight: 500;">
                      ${surat.tanggalSurat || "-"}
                    </div>
                  </div>
                </div>
                
                <div style="background: #f9fafb; padding: 12px; border-radius: 8px; margin-bottom: 16px;">
                  <div style="font-size: 11px; font-weight: 600; color: #6b7280; margin-bottom: 4px; text-transform: uppercase;">
                    <i class="bi bi-flag-fill"></i> Status
                  </div>
                  <div>
                    <span style="background: ${
                      RoleManager.getStatusInfo(surat.status).bg
                    }; color: ${
              RoleManager.getStatusInfo(surat.status).text
            }; padding: 6px 12px; border-radius: 12px; font-size: 13px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;">
                      <i class="bi bi-${
                        RoleManager.getStatusInfo(surat.status).icon
                      }"></i>
                      ${surat.status || "Pending"}
                    </span>
                  </div>
                </div>
                
                ${
                  surat.processedBy
                    ? `
                  <div style="background: #eff6ff; padding: 12px; border-radius: 8px; margin-bottom: 16px; border-left: 4px solid #2563eb;">
                    <div style="font-size: 11px; font-weight: 600; color: #1e40af; margin-bottom: 4px; text-transform: uppercase;">
                      <i class="bi bi-person-check"></i> Diproses Oleh
                    </div>
                    <div style="color: #1e40af; font-size: 14px; font-weight: 600;">
                      ${surat.processedBy}
                    </div>
                    ${
                      surat.processedByEmail
                        ? `
                      <div style="font-size: 12px; color: #3b82f6; margin-top: 2px;">
                        ${surat.processedByEmail}
                      </div>
                    `
                        : ""
                    }
                  </div>
                `
                    : ""
                }
                
                ${disposisiHTML}
              </div>
            `,
            width: "800px",
            showCloseButton: true,
            confirmButtonText: '<i class="bi bi-x-lg"></i> Tutup',
            confirmButtonColor: "#6b7280",
            showCancelButton: true,
            cancelButtonText:
              '<i class="bi bi-box-arrow-up-right"></i> Lihat Detail Lengkap',
            cancelButtonColor: "#2563eb",
            reverseButtons: true,
            customClass: {
              popup: "monitoring-detail-modal",
              htmlContainer: "monitoring-detail-content",
            },
          }).then((result) => {
            if (result.dismiss === Swal.DismissReason.cancel) {
              window.location.href = `surat-masuk.html#detail-${id}`;
            }
          });
        })
        .catch((error) => {
          console.error("❌ Error loading detail:", error);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Gagal memuat detail surat: " + error.message,
          });
        });
    },

    async deleteSurat(id, type, perihal = "surat ini") {
      if (MonitoringState.userRole !== "admin") {
        Swal.fire(
          "Akses Ditolak",
          "Hanya Admin yang dapat menghapus surat",
          "error"
        );
        return;
      }

      const collectionMap = {
        masuk: "surat_masuk",
        keluar: "surat_keluar",
        "nota-dinas": "nota_dinas",
      };

      const collection = collectionMap[type];
      if (!collection) {
        Swal.fire("Error", "Tipe surat tidak valid", "error");
        return;
      }

      const typeLabel =
        type === "masuk"
          ? "Surat Masuk"
          : type === "keluar"
          ? "Surat Keluar"
          : "Nota Dinas";

      Swal.fire({
        title: `Hapus ${typeLabel}?`,
        html: `
          <div style="text-align: left; padding: 0 20px;">
            <p style="margin-bottom: 16px;">Yakin ingin menghapus surat:</p>
            <div style="background: #fef2f2; padding: 12px; border-radius: 8px; border-left: 4px solid #dc2626; margin-bottom: 16px;">
              <strong style="color: #991b1b;">"${perihal}"</strong>
            </div>
            <div style="background: #fef9c3; padding: 12px; border-radius: 8px; margin-bottom: 8px;">
              <p style="margin: 0; font-size: 14px; color: #854d0e;">
                <i class="bi bi-info-circle"></i> 
                Surat akan dipindahkan ke <strong>Surat Dihapus</strong>
              </p>
            </div>
            <p style="font-size: 13px; color: #6b7280; margin: 0;">
              Data masih dapat dipulihkan dari menu Surat Dihapus
            </p>
          </div>
        `,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#dc2626",
        cancelButtonColor: "#6b7280",
        confirmButtonText: '<i class="bi bi-trash"></i> Ya, Hapus!',
        cancelButtonText: "Batal",
        reverseButtons: true,
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            Swal.fire({
              title: "Menghapus...",
              html: '<div style="padding: 20px;"><i class="bi bi-arrow-repeat" style="font-size: 48px; animation: spin 1s linear infinite;"></i></div>',
              allowOutsideClick: false,
              showConfirmButton: false,
            });

            await db
              .collection(collection)
              .doc(id)
              .update({
                isDeleted: true,
                deletedAt: firebase.firestore.FieldValue.serverTimestamp(),
                deletedBy: MonitoringState.currentUser?.nama || "Admin",
                deletedByUid: MonitoringState.currentUser?.uid || null,
              });

            Swal.fire({
              icon: "success",
              title: "Berhasil Dihapus!",
              html: `
                <div style="text-align: center; padding: 0 20px;">
                  <p style="margin-bottom: 16px;">Surat "<strong>${perihal}</strong>" telah dihapus</p>
                  <div style="background: #d1fae5; padding: 12px; border-radius: 8px;">
                    <p style="margin: 0; font-size: 14px; color: #065f46;">
                      <i class="bi bi-check-circle"></i> 
                      Tersimpan di <strong>Surat Dihapus</strong>
                    </p>
                  </div>
                </div>
              `,
              confirmButtonColor: "#059669",
              timer: 3000,
            });
          } catch (error) {
            console.error("❌ Error deleting:", error);
            Swal.fire("Error", "Gagal menghapus: " + error.message, "error");
          }
        }
      });
    },
  };

  // ========================================
  // CALENDAR MANAGER
  // ========================================
  const CalendarManager = {
    init() {
      const datePickerBtn = document.getElementById("datePickerBtn");
      const calendarModal = document.getElementById("calendarModal");
      const modalBackdrop = document.getElementById("modalBackdrop");
      const applyBtn = document.getElementById("applyDate");
      const prevBtn = document.getElementById("prevMonth");
      const nextBtn = document.getElementById("nextMonth");

      if (!datePickerBtn || !calendarModal) return;

      const today = new Date();
      MonitoringState.currentMonth = today.getMonth();
      MonitoringState.currentYear = today.getFullYear();

      datePickerBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const isActive = calendarModal.classList.contains("active");
        isActive ? this.closeCalendar() : this.openCalendar();
      });

      if (applyBtn) {
        applyBtn.addEventListener("click", (e) => {
          e.preventDefault();
          if (MonitoringState.selectedDate) {
            const dateText = document.getElementById("selectedDateText");
            if (dateText) {
              dateText.textContent = this.formatDate(
                MonitoringState.selectedDate
              );
            }
            MonitoringState.dateFilter = new Date(
              MonitoringState.selectedDate.getFullYear(),
              MonitoringState.selectedDate.getMonth(),
              MonitoringState.selectedDate.getDate()
            );
            this.closeCalendar();
            setTimeout(() => FilterManager.applyFilters(), 100);
          } else {
            alert("Silakan pilih tanggal terlebih dahulu");
          }
        });
      }

      if (prevBtn) {
        prevBtn.addEventListener("click", (e) => {
          e.preventDefault();
          MonitoringState.currentMonth--;
          if (MonitoringState.currentMonth < 0) {
            MonitoringState.currentMonth = 11;
            MonitoringState.currentYear--;
          }
          this.render();
        });
      }

      if (nextBtn) {
        nextBtn.addEventListener("click", (e) => {
          e.preventDefault();
          MonitoringState.currentMonth++;
          if (MonitoringState.currentMonth > 11) {
            MonitoringState.currentMonth = 0;
            MonitoringState.currentYear++;
          }
          this.render();
        });
      }

      if (modalBackdrop) {
        modalBackdrop.addEventListener("click", () => this.closeCalendar());
      }

      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && calendarModal.classList.contains("active")) {
          this.closeCalendar();
        }
      });
    },

    openCalendar() {
      const calendarModal = document.getElementById("calendarModal");
      const modalBackdrop = document.getElementById("modalBackdrop");
      const datePickerBtn = document.getElementById("datePickerBtn");

      if (!calendarModal || !datePickerBtn) return;

      const now = new Date();
      MonitoringState.currentMonth = now.getMonth();
      MonitoringState.currentYear = now.getFullYear();

      const btnRect = datePickerBtn.getBoundingClientRect();
      calendarModal.style.position = "fixed";
      calendarModal.style.top = btnRect.bottom + 8 + "px";
      calendarModal.style.left = btnRect.left + "px";

      calendarModal.classList.add("active");
      if (modalBackdrop) modalBackdrop.classList.add("active");

      this.render();
    },

    closeCalendar() {
      const calendarModal = document.getElementById("calendarModal");
      const modalBackdrop = document.getElementById("modalBackdrop");

      if (calendarModal) calendarModal.classList.remove("active");
      if (modalBackdrop) modalBackdrop.classList.remove("active");
    },

    render() {
      const calendarDays = document.getElementById("calendarDays");
      const calendarMonth = document.getElementById("calendarMonth");

      if (!calendarDays || !calendarMonth) return;

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

      calendarMonth.textContent = `${
        monthNames[MonitoringState.currentMonth]
      } ${MonitoringState.currentYear}`;

      const firstDay = new Date(
        MonitoringState.currentYear,
        MonitoringState.currentMonth,
        1
      ).getDay();
      const daysInMonth = new Date(
        MonitoringState.currentYear,
        MonitoringState.currentMonth + 1,
        0
      ).getDate();
      const today = new Date();

      calendarDays.innerHTML = "";

      for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement("button");
        emptyDay.className = "calendar-day empty";
        emptyDay.disabled = true;
        emptyDay.type = "button";
        emptyDay.innerHTML = "&nbsp;";
        calendarDays.appendChild(emptyDay);
      }

      for (let day = 1; day <= daysInMonth; day++) {
        const dayBtn = document.createElement("button");
        dayBtn.className = "calendar-day";
        dayBtn.textContent = day;
        dayBtn.type = "button";

        const date = new Date(
          MonitoringState.currentYear,
          MonitoringState.currentMonth,
          day
        );

        if (
          date.getDate() === today.getDate() &&
          date.getMonth() === today.getMonth() &&
          date.getFullYear() === today.getFullYear()
        ) {
          dayBtn.classList.add("today");
        }

        if (
          MonitoringState.selectedDate &&
          date.getDate() === MonitoringState.selectedDate.getDate() &&
          date.getMonth() === MonitoringState.selectedDate.getMonth() &&
          date.getFullYear() === MonitoringState.selectedDate.getFullYear()
        ) {
          dayBtn.classList.add("selected");
        }

        dayBtn.addEventListener("click", (e) => {
          e.preventDefault();
          document.querySelectorAll(".calendar-day.selected").forEach((el) => {
            el.classList.remove("selected");
          });
          dayBtn.classList.add("selected");
          MonitoringState.selectedDate = new Date(
            MonitoringState.currentYear,
            MonitoringState.currentMonth,
            day
          );
        });

        calendarDays.appendChild(dayBtn);
      }
    },

    formatDate(date) {
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "Mei",
        "Jun",
        "Jul",
        "Agu",
        "Sep",
        "Okt",
        "Nov",
        "Des",
      ];
      const day = String(date.getDate()).padStart(2, "0");
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    },
  };

  // ========================================
  // EVENT LISTENERS SETUP
  // ========================================
  const EventListeners = {
    init() {
      const tabBtns = document.querySelectorAll(".tab-btn");
      tabBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
          tabBtns.forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
          MonitoringState.currentTab = btn.getAttribute("data-tab");
          FilterManager.applyFilters();
        });
      });

      const searchInput = document.getElementById("searchPerihal");
      if (searchInput) {
        searchInput.addEventListener(
          "input",
          this.debounce((e) => {
            MonitoringState.searchQuery = e.target.value.trim();
            FilterManager.applyFilters();
          }, 300)
        );
      }

      const statusFilter = document.getElementById("statusFilter");
      if (statusFilter) {
        statusFilter.addEventListener("change", (e) => {
          MonitoringState.statusFilter = e.target.value.trim();
          FilterManager.applyFilters();
        });
      }

      const resetBtn = document.getElementById("resetBtn");
      if (resetBtn) {
        resetBtn.addEventListener("click", () => FilterManager.resetFilters());
      }

      window.previousPageMonitoring = () => {
        if (MonitoringState.currentPage > 1) {
          MonitoringState.currentPage--;
          TableRenderer.render();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      };

      window.nextPageMonitoring = () => {
        const maxPage = Math.ceil(
          MonitoringState.filteredData.length / MonitoringState.itemsPerPage
        );
        if (MonitoringState.currentPage < maxPage) {
          MonitoringState.currentPage++;
          TableRenderer.render();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      };
    },

    debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    },
  };

  // ========================================
  // INITIALIZATION
  // ========================================
  window.initializePage = async function () {
    console.log("🚀 Starting Monitoring Page Initialization v4.0...");

    try {
      UIManager.showLoading();

      const user = await new Promise((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(new Error("Auth timeout")),
          10000
        );

        firebase.auth().onAuthStateChanged(async (user) => {
          clearTimeout(timeout);

          if (!user) {
            console.error("❌ No user logged in!");
            window.location.href = "login.html";
            return;
          }

          console.log("✅ User authenticated:", user.email);

          try {
            const userDoc = await db.collection("users").doc(user.uid).get();

            if (!userDoc.exists) {
              console.error("❌ User document not found");
              window.location.href = "login.html";
              return;
            }

            const userData = userDoc.data();

            MonitoringState.currentUser = {
              uid: user.uid,
              email: user.email,
              nama: userData.nama || user.displayName || user.email,
              role: userData.role || "user",
            };

            MonitoringState.userRole = userData.role;
            MonitoringState.userEmail = user.email;

            console.log("👤 User data loaded:", MonitoringState.currentUser);

            if (
              MonitoringState.userRole !== "admin" &&
              MonitoringState.userRole !== "kapus"
            ) {
              console.error("❌ Insufficient permissions");

              Swal.fire({
                icon: "error",
                title: "Akses Ditolak",
                text: "Anda tidak memiliki izin untuk mengakses halaman ini",
                confirmButtonColor: "#dc2626",
              }).then(() => {
                window.location.href = "dashboard.html";
              });
              return;
            }

            resolve(user);
          } catch (error) {
            console.error("❌ Error getting user data:", error);
            reject(error);
          }
        });
      });

      console.log("🔧 Setting up components...");

      EventListeners.init();
      CalendarManager.init();
      FirebaseMonitoring.setupListeners();

      console.log("✅ Monitoring Page v4.0 Initialized Successfully!");
    } catch (error) {
      console.error("❌ Initialization error:", error);
      UIManager.showError("Gagal memuat halaman monitoring: " + error.message);
    }
  };

  window.addEventListener("beforeunload", () => {
    console.log("🧹 Cleaning up listeners...");
    FirebaseMonitoring.cleanupListeners();
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", window.initializePage);
  } else {
    window.initializePage();
  }

  const style = document.createElement("style");
  style.textContent = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    .action-btn {
      padding: 8px 12px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    
    .view-btn {
      background: #eff6ff;
      color: #1e40af;
    }
    
    .view-btn:hover {
      background: #dbeafe;
      transform: translateY(-1px);
    }
    
    .delete-btn {
      background: #fee2e2;
      color: #dc2626;
    }
    
    .delete-btn:hover {
      background: #fecaca;
      transform: translateY(-1px);
    }
    
    .action-btn:active {
      transform: translateY(0);
    }
    
    .monitoring-detail-content {
      max-height: 600px !important;
      overflow-y: auto !important;
    }
    
    .monitoring-detail-content::-webkit-scrollbar {
      width: 8px;
    }
    
    .monitoring-detail-content::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 10px;
    }
    
    .monitoring-detail-content::-webkit-scrollbar-thumb {
      background: #888;
      border-radius: 10px;
    }
    
    .monitoring-detail-content::-webkit-scrollbar-thumb:hover {
      background: #555;
    }
  `;
  document.head.appendChild(style);

  console.log(
    "✅ Monitoring Real-Time v4.0 - Complete with Disposisi Details!"
  );
})();
