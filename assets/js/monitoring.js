// ========================================
// MONITORING REAL-TIME - FIREBASE INTEGRATED
// Version: 3.0 COMPLETE REWRITE
// Support: Admin & Kapus Roles
// ========================================
(function () {
  "use strict";

  console.log("🚀 Initializing Monitoring Real-Time v3.0...");

  // ========================================
  // STATE MANAGEMENT
  // ========================================
  const MonitoringState = {
    // User
    currentUser: null,
    userRole: null,
    userEmail: null,
    
    // Data Collections
    suratMasuk: [],
    suratKeluar: [],
    notaDinas: [],
    allData: [],
    filteredData: [],
    
    // Filters
    currentTab: "masuk",
    searchQuery: "",
    statusFilter: "",
    dateFilter: null,
    
    // Pagination
    currentPage: 1,
    itemsPerPage: 10,
    
    // Real-time Listeners
    unsubscribers: [],
    
    // Calendar
    selectedDate: null,
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
    
    // UI State
    isLoading: false,
    lastUpdate: null,
  };

  // ========================================
  // ROLE-BASED ACCESS CONTROL
  // ========================================
  const RoleManager = {
    /**
     * Check if user has permission to view surat
     */
    canViewSurat(surat, userRole, userEmail) {
      if (userRole === "admin") {
        return true; // Admin sees everything
      }
      
      if (userRole === "kapus") {
        // Kapus sees:
        // 1. Surat addressed to them (kepada/tujuan contains "kapus")
        // 2. Surat with specific statuses
        
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
          status.includes("selesai");
        
        return isAddressedToKapus || isRelevantStatus;
      }
      
      return false;
    },
    
    /**
     * Get status badge info based on status
     */
    getStatusInfo(status) {
      const statusLower = (status || "pending").toLowerCase();
      
      const statusMap = {
        // PROSES (BLUE)
        "pending": { bg: "#DBEAFE", text: "#1E40AF", icon: "clock" },
        "proses": { bg: "#DBEAFE", text: "#1E40AF", icon: "arrow-repeat" },
        "terkirim ke kapus": { bg: "#DBEAFE", text: "#1E40AF", icon: "send" },
        
        // MENUNGGU APPROVAL (YELLOW)
        "menunggu persetujuan kapus": { bg: "#FEF3C7", text: "#D97706", icon: "hourglass-split" },
        "menunggu ttd": { bg: "#FEF3C7", text: "#D97706", icon: "pen" },
        
        // SELESAI (GREEN)
        "selesai": { bg: "#D1FAE5", text: "#059669", icon: "check-circle" },
        "disetujui kapus": { bg: "#D1FAE5", text: "#059669", icon: "check-circle-fill" },
        "siap kirim": { bg: "#D1FAE5", text: "#059669", icon: "send-check" },
        "diterima": { bg: "#D1FAE5", text: "#059669", icon: "check2-all" },
        
        // DITOLAK (RED)
        "ditolak": { bg: "#FEE2E2", text: "#DC2626", icon: "x-circle" },
        "ditolak kapus": { bg: "#FEE2E2", text: "#DC2626", icon: "x-circle-fill" },
        "revisi": { bg: "#FEE2E2", text: "#DC2626", icon: "arrow-clockwise" },
      };
      
      return statusMap[statusLower] || { bg: "#F3F4F6", text: "#6B7280", icon: "question-circle" };
    }
  };

  // ========================================
  // FIREBASE REAL-TIME LISTENERS
  // ========================================
  const FirebaseMonitoring = {
    /**
     * Setup all real-time listeners
     */
    setupListeners() {
      console.log("🔌 Setting up Firebase real-time listeners...");
      
      // Clear existing listeners
      this.cleanupListeners();
      
      // Setup listeners for each collection
      this.listenToSuratMasuk();
      this.listenToSuratKeluar();
      this.listenToNotaDinas();
    },
    
    /**
     * Listen to Surat Masuk changes
     */
    listenToSuratMasuk() {
      const unsubscribe = db
        .collection("surat_masuk")
        .where("isDeleted", "==", false)
        .onSnapshot(
          (snapshot) => {
            console.log("📨 Surat Masuk snapshot:", snapshot.size);
            
            const data = [];
            snapshot.forEach(doc => {
              const docData = doc.data();
              data.push({
                id: doc.id,
                firestoreId: doc.id,
                type: "masuk",
                ...docData,
                _createdAt: docData.createdAt?.toDate?.() || new Date(),
              });
            });
            
            // Filter based on role
            MonitoringState.suratMasuk = data.filter(surat => 
              RoleManager.canViewSurat(surat, MonitoringState.userRole, MonitoringState.userEmail)
            );
            
            console.log(`✅ Surat Masuk: ${data.length} total, ${MonitoringState.suratMasuk.length} visible to ${MonitoringState.userRole}`);
            
            // Check for new documents (notifications)
            snapshot.docChanges().forEach(change => {
              if (change.type === "added" && MonitoringState.lastUpdate) {
                const surat = change.doc.data();
                if (RoleManager.canViewSurat({ ...surat, type: "masuk" }, MonitoringState.userRole, MonitoringState.userEmail)) {
                  NotificationManager.show("Surat Masuk Baru", surat.perihal || "Tanpa Judul", "info");
                }
              }
              
              if (change.type === "modified") {
                const surat = change.doc.data();
                if (RoleManager.canViewSurat({ ...surat, type: "masuk" }, MonitoringState.userRole, MonitoringState.userEmail)) {
                  NotificationManager.show("Status Diperbarui", `${surat.perihal} - ${surat.status}`, "success");
                }
              }
            });
            
            this.updateCombinedData();
          },
          (error) => {
            console.error("❌ Surat Masuk listener error:", error);
            UIManager.showError("Error loading Surat Masuk");
          }
        );
      
      MonitoringState.unsubscribers.push(unsubscribe);
    },
    
    /**
     * Listen to Surat Keluar changes
     */
    listenToSuratKeluar() {
      const unsubscribe = db
        .collection("surat_keluar")
        .where("isDeleted", "==", false)
        .onSnapshot(
          (snapshot) => {
            console.log("📤 Surat Keluar snapshot:", snapshot.size);
            
            const data = [];
            snapshot.forEach(doc => {
              const docData = doc.data();
              data.push({
                id: doc.id,
                firestoreId: doc.id,
                type: "keluar",
                ...docData,
                _createdAt: docData.createdAt?.toDate?.() || new Date(),
              });
            });
            
            // Filter based on role
            MonitoringState.suratKeluar = data.filter(surat => 
              RoleManager.canViewSurat(surat, MonitoringState.userRole, MonitoringState.userEmail)
            );
            
            console.log(`✅ Surat Keluar: ${data.length} total, ${MonitoringState.suratKeluar.length} visible to ${MonitoringState.userRole}`);
            
            // Check for new documents (notifications)
            snapshot.docChanges().forEach(change => {
              if (change.type === "added" && MonitoringState.lastUpdate) {
                const surat = change.doc.data();
                if (RoleManager.canViewSurat({ ...surat, type: "keluar" }, MonitoringState.userRole, MonitoringState.userEmail)) {
                  NotificationManager.show("Surat Keluar Baru", surat.perihal || "Tanpa Judul", "info");
                }
              }
              
              if (change.type === "modified") {
                const surat = change.doc.data();
                if (RoleManager.canViewSurat({ ...surat, type: "keluar" }, MonitoringState.userRole, MonitoringState.userEmail)) {
                  NotificationManager.show("Status Diperbarui", `${surat.perihal} - ${surat.status}`, "success");
                }
              }
            });
            
            this.updateCombinedData();
          },
          (error) => {
            console.error("❌ Surat Keluar listener error:", error);
            UIManager.showError("Error loading Surat Keluar");
          }
        );
      
      MonitoringState.unsubscribers.push(unsubscribe);
    },
    
    /**
     * Listen to Nota Dinas changes
     */
    listenToNotaDinas() {
      const unsubscribe = db
        .collection("nota_dinas")
        .where("isDeleted", "==", false)
        .onSnapshot(
          (snapshot) => {
            console.log("📝 Nota Dinas snapshot:", snapshot.size);
            
            const data = [];
            snapshot.forEach(doc => {
              const docData = doc.data();
              data.push({
                id: doc.id,
                firestoreId: doc.id,
                type: "nota-dinas",
                ...docData,
                _createdAt: docData.createdAt?.toDate?.() || new Date(),
              });
            });
            
            // Filter based on role
            MonitoringState.notaDinas = data.filter(nota => 
              RoleManager.canViewSurat(nota, MonitoringState.userRole, MonitoringState.userEmail)
            );
            
            console.log(`✅ Nota Dinas: ${data.length} total, ${MonitoringState.notaDinas.length} visible to ${MonitoringState.userRole}`);
            
            // Check for new documents (notifications)
            snapshot.docChanges().forEach(change => {
              if (change.type === "added" && MonitoringState.lastUpdate) {
                const nota = change.doc.data();
                if (RoleManager.canViewSurat({ ...nota, type: "nota-dinas" }, MonitoringState.userRole, MonitoringState.userEmail)) {
                  NotificationManager.show("Nota Dinas Baru", nota.perihal || "Tanpa Judul", "info");
                }
              }
              
              if (change.type === "modified") {
                const nota = change.doc.data();
                if (RoleManager.canViewSurat({ ...nota, type: "nota-dinas" }, MonitoringState.userRole, MonitoringState.userEmail)) {
                  NotificationManager.show("Status Diperbarui", `${nota.perihal} - ${nota.status}`, "success");
                }
              }
            });
            
            this.updateCombinedData();
          },
          (error) => {
            console.error("❌ Nota Dinas listener error:", error);
            UIManager.showError("Error loading Nota Dinas");
          }
        );
      
      MonitoringState.unsubscribers.push(unsubscribe);
    },
    
    /**
     * Combine and update all data
     */
    updateCombinedData() {
      // Combine all data
      MonitoringState.allData = [
        ...MonitoringState.suratMasuk,
        ...MonitoringState.suratKeluar,
        ...MonitoringState.notaDinas,
      ];
      
      // Sort by creation date (newest first)
      MonitoringState.allData.sort((a, b) => b._createdAt - a._createdAt);
      
      console.log("📊 Combined data:", MonitoringState.allData.length);
      
      // Update status filter options based on available data
      UIManager.updateStatusFilterOptions();
      
      // Apply filters and render
      FilterManager.applyFilters();
      
      // Mark initial load complete
      if (!MonitoringState.lastUpdate) {
        MonitoringState.lastUpdate = new Date();
        console.log("✅ Initial data load complete at", MonitoringState.lastUpdate);
      }
    },
    
    /**
     * Cleanup all listeners
     */
    cleanupListeners() {
      MonitoringState.unsubscribers.forEach(unsub => unsub());
      MonitoringState.unsubscribers = [];
    }
  };

  // ========================================
  // FILTER MANAGER
  // ========================================
  const FilterManager = {
    /**
     * Apply all active filters
     */
    applyFilters() {
      console.log("🔍 ==================== APPLYING FILTERS ====================");
      console.log("📊 Active Filters:", {
        tab: MonitoringState.currentTab,
        search: MonitoringState.searchQuery,
        status: MonitoringState.statusFilter,
        date: MonitoringState.dateFilter ? MonitoringState.dateFilter.toLocaleDateString() : "none"
      });
      
      let filtered = [...MonitoringState.allData];
      console.log("📦 Starting with", filtered.length, "items");
      
      // Filter by tab (type)
      if (MonitoringState.currentTab !== "all") {
        filtered = filtered.filter(item => item.type === MonitoringState.currentTab);
        console.log("📑 After tab filter (" + MonitoringState.currentTab + "):", filtered.length, "items");
      }
      
      // Filter by search query
      if (MonitoringState.searchQuery && MonitoringState.searchQuery.trim() !== "") {
        const query = MonitoringState.searchQuery.toLowerCase().trim();
        const beforeLength = filtered.length;
        
        filtered = filtered.filter(item => 
          (item.perihal && item.perihal.toLowerCase().includes(query)) ||
          (item.noSurat && item.noSurat.toLowerCase().includes(query)) ||
          (item.noNaskah && item.noNaskah.toLowerCase().includes(query)) ||
          (item.dari && item.dari.toLowerCase().includes(query)) ||
          (item.namaPengirim && item.namaPengirim.toLowerCase().includes(query)) ||
          (item.kepada && item.kepada.toLowerCase().includes(query))
        );
        
        console.log("🔎 After search filter ('" + query + "'):", filtered.length, "items (removed", beforeLength - filtered.length, ")");
      }
      
      // Filter by status
      if (MonitoringState.statusFilter && MonitoringState.statusFilter.trim() !== "") {
        const statusQuery = MonitoringState.statusFilter.toLowerCase().trim();
        const beforeLength = filtered.length;
        
        console.log("📊 Filtering by status:", statusQuery);
        console.log("📊 Sample of statuses in data:", filtered.slice(0, 5).map(item => ({
          perihal: item.perihal,
          status: item.status,
          statusLower: (item.status || "").toLowerCase()
        })));
        
        filtered = filtered.filter(item => {
          const itemStatus = (item.status || "pending").toLowerCase().trim();
          const matches = itemStatus === statusQuery;
          
          if (matches) {
            console.log("✅ Status match:", item.perihal, "- status:", item.status);
          }
          
          return matches;
        });
        
        console.log("📊 After status filter ('" + statusQuery + "'):", filtered.length, "items (removed", beforeLength - filtered.length, ")");
        
        if (filtered.length === 0 && beforeLength > 0) {
          console.warn("⚠️ No items match status filter. Available statuses:", 
            [...new Set(MonitoringState.allData.map(i => i.status || "pending"))]);
        }
      }
      
      // Filter by date
      if (MonitoringState.dateFilter) {
        const beforeLength = filtered.length;
        const filterDateStr = MonitoringState.dateFilter.toLocaleDateString();
        
        console.log("📅 Filtering by date:", filterDateStr);
        
        filtered = filtered.filter(item => {
          // Try multiple date fields
          let itemDate = null;
          let dateSource = "";
          
          if (item.tanggalSurat) {
            itemDate = this.parseDate(item.tanggalSurat);
            dateSource = "tanggalSurat";
          } else if (item.tanggalDiterima) {
            itemDate = this.parseDate(item.tanggalDiterima);
            dateSource = "tanggalDiterima";
          } else if (item.tanggalTerima) {
            itemDate = this.parseDate(item.tanggalTerima);
            dateSource = "tanggalTerima";
          } else if (item._createdAt) {
            itemDate = item._createdAt;
            dateSource = "_createdAt";
          }
          
          if (!itemDate) {
            console.warn("⚠️ No valid date found for:", item.perihal);
            return false;
          }
          
          const matches = this.isSameDate(itemDate, MonitoringState.dateFilter);
          
          if (matches) {
            console.log("✅ Date match:", {
              perihal: item.perihal,
              dateSource: dateSource,
              itemDate: itemDate.toLocaleDateString(),
              filterDate: filterDateStr
            });
          }
          
          return matches;
        });
        
        console.log("📅 After date filter (" + filterDateStr + "):", filtered.length, "items (removed", beforeLength - filtered.length, ")");
        
        if (filtered.length === 0 && beforeLength > 0) {
          console.warn("⚠️ No items match date filter. Sample dates:", 
            MonitoringState.allData.slice(0, 3).map(i => ({
              perihal: i.perihal,
              tanggalSurat: i.tanggalSurat,
              tanggalDiterima: i.tanggalDiterima
            })));
        }
      }
      
      console.log(`✅ ==================== FILTER COMPLETE: ${filtered.length} items ====================`);
      
      MonitoringState.filteredData = filtered;
      MonitoringState.currentPage = 1; // Reset to first page
      
      TableRenderer.render();
    },
    
    /**
     * Parse date from various formats
     */
    parseDate(dateInput) {
      if (!dateInput) return null;
      
      try {
        // If already a Date object
        if (dateInput instanceof Date) {
          return isNaN(dateInput.getTime()) ? null : dateInput;
        }
        
        // If Firebase Timestamp
        if (dateInput.toDate && typeof dateInput.toDate === 'function') {
          return dateInput.toDate();
        }
        
        // If string (ISO format or other)
        if (typeof dateInput === 'string') {
          const parsed = new Date(dateInput);
          return isNaN(parsed.getTime()) ? null : parsed;
        }
        
        return null;
      } catch (e) {
        console.warn("⚠️ Error parsing date:", dateInput, e);
        return null;
      }
    },
    
    /**
     * Reset all filters
     */
    resetFilters() {
      console.log("🔄 ==================== RESETTING FILTERS ====================");
      
      MonitoringState.searchQuery = "";
      MonitoringState.statusFilter = "";
      MonitoringState.dateFilter = null;
      MonitoringState.selectedDate = null;
      MonitoringState.currentPage = 1;
      
      // Reset UI
      const searchInput = document.getElementById("searchPerihal");
      const statusFilter = document.getElementById("statusFilter");
      const dateText = document.getElementById("selectedDateText");
      
      if (searchInput) {
        searchInput.value = "";
        console.log("✅ Search input cleared");
      }
      
      if (statusFilter) {
        statusFilter.selectedIndex = 0;
        console.log("✅ Status filter reset to:", statusFilter.value);
      }
      
      if (dateText) {
        dateText.textContent = "Tanggal";
        console.log("✅ Date text reset");
      }
      
      // Reset active tab to first tab
      const tabBtns = document.querySelectorAll(".tab-btn");
      tabBtns.forEach((btn, index) => {
        if (index === 0) {
          btn.classList.add("active");
          MonitoringState.currentTab = btn.getAttribute("data-tab");
        } else {
          btn.classList.remove("active");
        }
      });
      
      console.log("✅ Reset complete, tab:", MonitoringState.currentTab);
      console.log("🔄 Applying filters after reset...");
      
      this.applyFilters();
    },
    
    /**
     * Check if two dates are the same day
     */
    isSameDate(date1, date2) {
      if (!date1 || !date2) return false;
      
      try {
        return (
          date1.getDate() === date2.getDate() &&
          date1.getMonth() === date2.getMonth() &&
          date1.getFullYear() === date2.getFullYear()
        );
      } catch (e) {
        console.warn("⚠️ Error comparing dates:", e);
        return false;
      }
    }
  };

  // ========================================
  // TABLE RENDERER
  // ========================================
  const TableRenderer = {
    /**
     * Render the monitoring table
     */
    render() {
      const tbody = document.getElementById("monitoringTableBody");
      if (!tbody) {
        console.error("❌ Table body not found!");
        return;
      }
      
      const data = MonitoringState.filteredData;
      
      // Calculate pagination
      const startIndex = (MonitoringState.currentPage - 1) * MonitoringState.itemsPerPage;
      const endIndex = startIndex + MonitoringState.itemsPerPage;
      const pageData = data.slice(startIndex, endIndex);
      
      console.log(`📄 Rendering page ${MonitoringState.currentPage}: ${pageData.length} items`);
      
      // Empty state
      if (pageData.length === 0) {
        tbody.innerHTML = this.renderEmptyState();
        this.updatePagination(0);
        return;
      }
      
      // Render rows
      tbody.innerHTML = pageData.map(item => this.renderRow(item)).join("");
      
      // Update pagination
      this.updatePagination(data.length);
    },
    
    /**
     * Render empty state
     */
    renderEmptyState() {
      const tabText = MonitoringState.currentTab === "masuk" ? "surat masuk" :
                      MonitoringState.currentTab === "keluar" ? "surat keluar" :
                      MonitoringState.currentTab === "nota-dinas" ? "nota dinas" : "data";
      
      return `
        <tr>
          <td colspan="7" style="text-align: center; padding: 60px 20px;">
            <i class="bi bi-inbox" style="font-size: 64px; color: #d1d5db; margin-bottom: 16px;"></i>
            <div style="font-size: 18px; font-weight: 600; color: #374151; margin-bottom: 8px;">
              Tidak ada ${tabText}
            </div>
            <div style="font-size: 14px; color: #6b7280;">
              ${MonitoringState.searchQuery ? "Coba gunakan kata kunci yang berbeda" : "Belum ada data untuk ditampilkan"}
            </div>
          </td>
        </tr>
      `;
    },
    
    /**
     * Render a single row
     */
    renderRow(item) {
      const dari = item.dari || item.namaPengirim || "-";
      const noSurat = item.noSurat || item.noNaskah || "-";
      const tanggalSurat = this.formatDate(item.tanggalSurat || item._createdAt);
      const kepada = item.kepada || item.tujuan || item.ditujukanKepada || "-";
      const perihal = item.perihal || "-";
      const status = item.status || "Pending";
      
      const statusInfo = RoleManager.getStatusInfo(status);
      
      // Type icon
      const typeIcon = item.type === "masuk" ? "envelope-fill" :
                       item.type === "keluar" ? "send-fill" : "file-earmark-text-fill";
      
      const typeLabel = item.type === "masuk" ? "Masuk" :
                        item.type === "keluar" ? "Keluar" : "Nota Dinas";
      
      // Action buttons based on role
      const actionButtons = MonitoringState.userRole === "admin" ? `
        <button class="action-btn view-btn" onclick="MonitoringActions.viewDetail('${item.firestoreId}', '${item.type}')" title="Lihat Detail">
          <i class="bi bi-eye"></i>
        </button>
        <button class="action-btn delete-btn" onclick="MonitoringActions.deleteSurat('${item.firestoreId}', '${item.type}')" title="Hapus">
          <i class="bi bi-trash"></i>
        </button>
      ` : `
        <button class="action-btn view-btn" onclick="MonitoringActions.viewDetail('${item.firestoreId}', '${item.type}')" title="Lihat Detail">
          <i class="bi bi-eye"></i>
        </button>
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
    
    /**
     * Format date
     */
    formatDate(dateInput) {
      if (!dateInput) return "-";
      
      try {
        const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
        
        if (isNaN(date.getTime())) return "-";
        
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        
        return `${day}/${month}/${year}`;
      } catch (e) {
        return "-";
      }
    },
    
    /**
     * Update pagination UI
     */
    updatePagination(totalItems) {
      const startIndex = totalItems > 0 ? (MonitoringState.currentPage - 1) * MonitoringState.itemsPerPage + 1 : 0;
      const endIndex = Math.min(MonitoringState.currentPage * MonitoringState.itemsPerPage, totalItems);
      
      const infoElement = document.getElementById("monitoringPaginationInfo");
      if (infoElement) {
        infoElement.textContent = `Showing ${startIndex}-${endIndex} of ${totalItems}`;
      }
      
      const maxPage = Math.ceil(totalItems / MonitoringState.itemsPerPage);
      const prevBtn = document.getElementById("prevBtnMonitoring");
      const nextBtn = document.getElementById("nextBtnMonitoring");
      
      if (prevBtn) prevBtn.disabled = MonitoringState.currentPage === 1;
      if (nextBtn) nextBtn.disabled = MonitoringState.currentPage >= maxPage || totalItems === 0;
    }
  };

  // ========================================
  // NOTIFICATION MANAGER
  // ========================================
  const NotificationManager = {
    /**
     * Show toast notification
     */
    show(title, message, type = "info") {
      if (!window.Swal) return;
      
      const iconMap = {
        info: "info",
        success: "success",
        warning: "warning",
        error: "error"
      };
      
      Swal.fire({
        icon: iconMap[type] || "info",
        title: title,
        text: message,
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3500,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.addEventListener('mouseenter', Swal.stopTimer);
          toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
      });
    }
  };

  // ========================================
  // UI MANAGER
  // ========================================
  const UIManager = {
    /**
     * Show loading state
     */
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
    
    /**
     * Show error state
     */
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
              <div style="font-size: 14px; color: #6b7280;">
                Silakan refresh halaman atau hubungi administrator
              </div>
            </td>
          </tr>
        `;
      }
    },
    
    /**
     * Show role indicator - DISABLED (no display)
     */
    showRoleIndicator() {
      // Role indicator display is disabled
      console.log("👤 User role:", MonitoringState.userRole, "(indicator hidden)");
    },
    
    /**
     * Update status filter options dynamically based on available data
     */
    updateStatusFilterOptions() {
      const statusFilter = document.getElementById("statusFilter");
      if (!statusFilter) return;
      
      // Get unique statuses from data
      const uniqueStatuses = [...new Set(
        MonitoringState.allData
          .map(item => item.status)
          .filter(status => status && status.trim() !== "")
      )].sort();
      
      console.log("📊 Unique statuses found:", uniqueStatuses);
      
      // Store current selection
      const currentValue = statusFilter.value;
      
      // Clear and rebuild options
      statusFilter.innerHTML = '<option value="">Semua Status</option>';
      
      uniqueStatuses.forEach(status => {
        const option = document.createElement("option");
        option.value = status.toLowerCase();
        option.textContent = status;
        statusFilter.appendChild(option);
      });
      
      // Restore selection if still exists
      if (currentValue) {
        statusFilter.value = currentValue;
      }
      
      console.log("✅ Status filter updated with", uniqueStatuses.length, "options");
    }
  };

  // ========================================
  // MONITORING ACTIONS
  // ========================================
  window.MonitoringActions = {
    /**
     * View detail of surat
     */
    viewDetail(id, type) {
      console.log("👁️ Viewing detail:", id, type);
      
      const urlMap = {
        "masuk": "surat-masuk.html",
        "keluar": "surat-keluar.html",
        "nota-dinas": "nota-dinas.html"
      };
      
      if (urlMap[type]) {
        window.location.href = `${urlMap[type]}#detail-${id}`;
      }
    },
    
    /**
     * Delete surat (Admin only)
     */
    async deleteSurat(id, type) {
      if (MonitoringState.userRole !== "admin") {
        NotificationManager.show("Akses Ditolak", "Hanya Admin yang dapat menghapus surat", "error");
        return;
      }
      
      if (!window.Swal) {
        if (!confirm("Yakin ingin menghapus surat ini?")) return;
        await this.performDelete(id, type);
        return;
      }
      
      const collectionMap = {
        "masuk": "surat_masuk",
        "keluar": "surat_keluar",
        "nota-dinas": "nota_dinas"
      };
      
      const typeLabel = type === "masuk" ? "Surat Masuk" :
                        type === "keluar" ? "Surat Keluar" : "Nota Dinas";
      
      Swal.fire({
        title: `Hapus ${typeLabel}?`,
        html: `
          <p>Surat akan dipindahkan ke <strong>Surat Dihapus</strong></p>
          <p style="color: #6b7280; font-size: 14px; margin-top: 12px;">
            Data masih dapat dipulihkan dari halaman Surat Dihapus
          </p>
        `,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#dc2626",
        cancelButtonColor: "#6b7280",
        confirmButtonText: '<i class="bi bi-trash"></i> Ya, Hapus!',
        cancelButtonText: "Batal",
        reverseButtons: true
      }).then(async (result) => {
        if (result.isConfirmed) {
          await this.performDelete(id, type);
        }
      });
    },
    
    /**
     * Perform delete operation
     */
    async performDelete(id, type) {
      const collectionMap = {
        "masuk": "surat_masuk",
        "keluar": "surat_keluar",
        "nota-dinas": "nota_dinas"
      };
      
      const collection = collectionMap[type];
      if (!collection) {
        NotificationManager.show("Error", "Tipe surat tidak valid", "error");
        return;
      }
      
      try {
        // Show loading
        if (window.Swal) {
          Swal.fire({
            title: 'Menghapus...',
            text: 'Mohon tunggu',
            allowOutsideClick: false,
            showConfirmButton: false,
            willOpen: () => Swal.showLoading()
          });
        }
        
        // Soft delete
        await db.collection(collection).doc(id).update({
          isDeleted: true,
          deletedAt: firebase.firestore.FieldValue.serverTimestamp(),
          deletedBy: MonitoringState.currentUser?.nama || MonitoringState.userEmail,
          deletedByUid: MonitoringState.currentUser?.uid,
        });
        
        console.log("✅ Surat deleted:", id);
        
        // Show success
        if (window.Swal) {
          Swal.fire({
            icon: "success",
            title: "Berhasil Dihapus!",
            text: "Surat telah dipindahkan ke Surat Dihapus",
            timer: 2000,
            showConfirmButton: false,
          });
        } else {
          NotificationManager.show("Berhasil", "Surat berhasil dihapus", "success");
        }
        
      } catch (error) {
        console.error("❌ Error deleting:", error);
        
        if (window.Swal) {
          Swal.fire({
            icon: "error",
            title: "Gagal Menghapus",
            text: "Terjadi kesalahan: " + error.message,
            confirmButtonColor: "#dc2626"
          });
        } else {
          NotificationManager.show("Error", "Gagal menghapus: " + error.message, "error");
        }
      }
    }
  };

  // ========================================
  // CALENDAR MANAGER
  // ========================================
  const CalendarManager = {
    /**
     * Initialize calendar
     */
    init() {
      const datePickerBtn = document.getElementById("datePickerBtn");
      const calendarModal = document.getElementById("calendarModal");
      const applyBtn = document.getElementById("applyDate");
      const prevBtn = document.getElementById("prevMonth");
      const nextBtn = document.getElementById("nextMonth");
      
      if (!datePickerBtn || !calendarModal) {
        console.warn("⚠️ Calendar elements not found");
        return;
      }
      
      console.log("📅 Initializing calendar...");
      
      // Set initial month/year to current date
      const today = new Date();
      MonitoringState.currentMonth = today.getMonth();
      MonitoringState.currentYear = today.getFullYear();
      
      // Open/close calendar
      datePickerBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const isActive = calendarModal.classList.contains("active");
        console.log("📅 Calendar toggle:", !isActive);
        
        if (isActive) {
          calendarModal.classList.remove("active");
        } else {
          // Reset to current month when opening
          const now = new Date();
          MonitoringState.currentMonth = now.getMonth();
          MonitoringState.currentYear = now.getFullYear();
          
          calendarModal.classList.add("active");
          this.render();
        }
      });
      
      // Apply date filter
      if (applyBtn) {
        // Remove old listeners
        const newApplyBtn = applyBtn.cloneNode(true);
        applyBtn.parentNode.replaceChild(newApplyBtn, applyBtn);
        
        newApplyBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          console.log("📅 Apply button clicked, selected date:", MonitoringState.selectedDate);
          
          if (MonitoringState.selectedDate) {
            const dateText = document.getElementById("selectedDateText");
            if (dateText) {
              const formattedDate = this.formatDate(MonitoringState.selectedDate);
              dateText.textContent = formattedDate;
              console.log("✅ Date text updated to:", formattedDate);
            }
            
            // Set the date filter
            MonitoringState.dateFilter = new Date(MonitoringState.selectedDate);
            console.log("✅ Date filter set to:", MonitoringState.dateFilter.toLocaleDateString());
            
            // Close modal
            calendarModal.classList.remove("active");
            
            // Apply filters
            setTimeout(() => {
              FilterManager.applyFilters();
            }, 100);
            
          } else {
            console.warn("⚠️ No date selected");
            alert("Silakan pilih tanggal terlebih dahulu");
          }
        });
      }
      
      // Previous month
      if (prevBtn) {
        // Remove old listeners
        const newPrevBtn = prevBtn.cloneNode(true);
        prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
        
        newPrevBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          MonitoringState.currentMonth--;
          if (MonitoringState.currentMonth < 0) {
            MonitoringState.currentMonth = 11;
            MonitoringState.currentYear--;
          }
          console.log("◀️ Previous month:", MonitoringState.currentMonth, MonitoringState.currentYear);
          this.render();
        });
      }
      
      // Next month
      if (nextBtn) {
        // Remove old listeners
        const newNextBtn = nextBtn.cloneNode(true);
        nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
        
        newNextBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          MonitoringState.currentMonth++;
          if (MonitoringState.currentMonth > 11) {
            MonitoringState.currentMonth = 0;
            MonitoringState.currentYear++;
          }
          console.log("▶️ Next month:", MonitoringState.currentMonth, MonitoringState.currentYear);
          this.render();
        });
      }
      
      // Close on outside click
      document.addEventListener("click", (e) => {
        if (!calendarModal.contains(e.target) && 
            e.target !== datePickerBtn &&
            !datePickerBtn.contains(e.target)) {
          if (calendarModal.classList.contains("active")) {
            console.log("📅 Closing calendar (outside click)");
            calendarModal.classList.remove("active");
          }
        }
      });
      
      // Prevent modal from closing when clicking inside
      calendarModal.addEventListener("click", (e) => {
        e.stopPropagation();
      });
      
      console.log("✅ Calendar initialized");
    },
    
    /**
     * Render calendar
     */
    render() {
      const calendarDays = document.getElementById("calendarDays");
      const calendarMonth = document.getElementById("calendarMonth");
      
      if (!calendarDays || !calendarMonth) {
        console.warn("⚠️ Calendar DOM elements not found");
        return;
      }
      
      const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      
      calendarMonth.textContent = `${monthNames[MonitoringState.currentMonth]} ${MonitoringState.currentYear}`;
      
      const firstDay = new Date(MonitoringState.currentYear, MonitoringState.currentMonth, 1).getDay();
      const daysInMonth = new Date(MonitoringState.currentYear, MonitoringState.currentMonth + 1, 0).getDate();
      const today = new Date();
      
      calendarDays.innerHTML = "";
      
      console.log("📅 Rendering calendar:", monthNames[MonitoringState.currentMonth], MonitoringState.currentYear);
      console.log("📅 First day of week:", firstDay, "Days in month:", daysInMonth);
      
      // Empty days at start (Sunday = 0)
      for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement("button");
        emptyDay.className = "calendar-day empty";
        emptyDay.disabled = true;
        emptyDay.innerHTML = "&nbsp;";
        calendarDays.appendChild(emptyDay);
      }
      
      // Days
      for (let day = 1; day <= daysInMonth; day++) {
        const dayBtn = document.createElement("button");
        dayBtn.className = "calendar-day";
        dayBtn.textContent = day;
        dayBtn.type = "button";
        
        const date = new Date(MonitoringState.currentYear, MonitoringState.currentMonth, day);
        
        // Mark today
        if (
          date.getDate() === today.getDate() &&
          date.getMonth() === today.getMonth() &&
          date.getFullYear() === today.getFullYear()
        ) {
          dayBtn.classList.add("today");
        }
        
        // Mark selected
        if (
          MonitoringState.selectedDate &&
          date.getDate() === MonitoringState.selectedDate.getDate() &&
          date.getMonth() === MonitoringState.selectedDate.getMonth() &&
          date.getFullYear() === MonitoringState.selectedDate.getFullYear()
        ) {
          dayBtn.classList.add("selected");
        }
        
        // Click handler
        dayBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          // Remove previous selection
          document.querySelectorAll(".calendar-day.selected").forEach(el => {
            el.classList.remove("selected");
          });
          
          // Add new selection
          dayBtn.classList.add("selected");
          
          MonitoringState.selectedDate = new Date(date);
          console.log("📅 Date selected:", MonitoringState.selectedDate.toLocaleDateString());
        });
        
        calendarDays.appendChild(dayBtn);
      }
      
      console.log("✅ Calendar rendered with", daysInMonth, "days");
    },
    
    /**
     * Format date for display
     */
    formatDate(date) {
      const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
      const day = String(date.getDate()).padStart(2, "0");
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    }
  };

  // ========================================
  // EVENT LISTENERS SETUP
  // ========================================
  const EventListeners = {
    /**
     * Setup all event listeners
     */
    init() {
      console.log("🔧 Setting up event listeners...");
      
      // Tab switching
      const tabBtns = document.querySelectorAll(".tab-btn");
      tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
          tabBtns.forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
          
          MonitoringState.currentTab = btn.getAttribute("data-tab");
          console.log("📑 Switched to tab:", MonitoringState.currentTab);
          
          FilterManager.applyFilters();
        });
      });
      
      // Search input
      const searchInput = document.getElementById("searchPerihal");
      if (searchInput) {
        searchInput.addEventListener("input", this.debounce((e) => {
          MonitoringState.searchQuery = e.target.value.trim();
          console.log("🔎 Search query:", MonitoringState.searchQuery);
          FilterManager.applyFilters();
        }, 300));
      }
      
      // Status filter
      const statusFilter = document.getElementById("statusFilter");
      if (statusFilter) {
        statusFilter.addEventListener("change", (e) => {
          MonitoringState.statusFilter = e.target.value.trim();
          console.log("📊 Status filter:", MonitoringState.statusFilter);
          
          // Log available statuses for debugging
          const statuses = [...new Set(MonitoringState.allData.map(item => item.status || "pending"))];
          console.log("📋 Available statuses in data:", statuses);
          
          FilterManager.applyFilters();
        });
      }
      
      // Reset button
      const resetBtn = document.getElementById("resetBtn");
      if (resetBtn) {
        resetBtn.addEventListener("click", () => {
          console.log("🔄 Reset button clicked");
          FilterManager.resetFilters();
        });
      }
      
      // Pagination
      window.previousPageMonitoring = () => {
        if (MonitoringState.currentPage > 1) {
          MonitoringState.currentPage--;
          console.log("◀️ Previous page:", MonitoringState.currentPage);
          TableRenderer.render();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      };
      
      window.nextPageMonitoring = () => {
        const maxPage = Math.ceil(MonitoringState.filteredData.length / MonitoringState.itemsPerPage);
        if (MonitoringState.currentPage < maxPage) {
          MonitoringState.currentPage++;
          console.log("▶️ Next page:", MonitoringState.currentPage);
          TableRenderer.render();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      };
      
      console.log("✅ Event listeners initialized");
    },
    
    /**
     * Debounce helper
     */
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
    }
  };

  // ========================================
  // INITIALIZATION
  // ========================================
  window.initializePage = async function () {
    console.log("🚀 Starting Monitoring Page Initialization...");
    
    try {
      // Show loading
      UIManager.showLoading();
      
      // Wait for auth
      const user = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("Auth timeout")), 10000);
        
        firebase.auth().onAuthStateChanged(async (user) => {
          clearTimeout(timeout);
          
          if (!user) {
            console.error("❌ No user logged in!");
            window.location.href = "login.html";
            return;
          }
          
          console.log("✅ User authenticated:", user.email);
          
          // Get user data from Firestore
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
              role: userData.role || "user"
            };
            
            MonitoringState.userRole = userData.role;
            MonitoringState.userEmail = user.email;
            
            console.log("👤 User data loaded:", MonitoringState.currentUser);
            
            // Check if user has permission
            if (MonitoringState.userRole !== "admin" && MonitoringState.userRole !== "kapus") {
              console.error("❌ Insufficient permissions");
              
              if (window.Swal) {
                Swal.fire({
                  icon: "error",
                  title: "Akses Ditolak",
                  text: "Anda tidak memiliki izin untuk mengakses halaman ini",
                  confirmButtonColor: "#dc2626"
                }).then(() => {
                  window.location.href = "dashboard.html";
                });
              } else {
                alert("Akses ditolak!");
                window.location.href = "dashboard.html";
              }
              return;
            }
            
            resolve(user);
            
          } catch (error) {
            console.error("❌ Error getting user data:", error);
            reject(error);
          }
        });
      });
      
      // Show role indicator
      UIManager.showRoleIndicator();
      
      // Setup components
      console.log("🔧 Setting up components...");
      
      EventListeners.init();
      CalendarManager.init();
      FirebaseMonitoring.setupListeners();
      
      console.log("✅ Monitoring Page Initialized Successfully!");
      
    } catch (error) {
      console.error("❌ Initialization error:", error);
      UIManager.showError("Gagal memuat halaman monitoring: " + error.message);
    }
  };

  // ========================================
  // CLEANUP
  // ========================================
  window.addEventListener("beforeunload", () => {
    console.log("🧹 Cleaning up listeners...");
    FirebaseMonitoring.cleanupListeners();
  });

  // ========================================
  // AUTO-INIT ON LOAD
  // ========================================
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", window.initializePage);
  } else {
    window.initializePage();
  }

  // ========================================
  // INJECT CSS FOR ANIMATIONS
  // ========================================
  const style = document.createElement('style');
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
  `;
  document.head.appendChild(style);

  console.log("✅ Monitoring Real-Time v3.0 - Loaded Successfully!");

})();