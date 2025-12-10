// =============================
// MONITORING - FIREBASE REAL-TIME INTEGRATED
// Version: 2.0
// Last Updated: December 2025
// =============================
(function () {
  "use strict";

  // State Management
  let currentPageMonitoring = 1;
  const itemsPerPageMonitoring = 10;
  let monitoringData = [];
  let filteredData = [];
  let currentTab = "masuk";
  let unsubscribeMasuk = null;
  let unsubscribeKeluar = null;
  let unsubscribeNotaDinas = null;
  let selectedDate = null;
  let currentMonth = new Date().getMonth();
  let currentYear = new Date().getFullYear();
  let currentUserData = null;
  let userRole = null;

  // =============================
  // INITIALIZATION
  // =============================
  window.initializePage = function () {
    console.log("📊 Monitoring Page Initialized (REAL-TIME VERSION)");

    // Wait for auth to be ready
    const initInterval = setInterval(() => {
      if (typeof checkUserRole === "function" && window.db) {
        clearInterval(initInterval);

        checkUserRole(["admin", "kapus"])
          .then((userData) => {
            console.log("✅ User authenticated:", userData);
            currentUserData = userData;
            userRole = userData.role;

            console.log("👤 User Role:", userRole);

            // Show role indicator
            showRoleIndicator();

            // Setup real-time listeners
            setupRealtimeMonitoring();

            // Setup filters & calendar
            setupMonitoringFilters();
            setupCalendar();
          })
          .catch((error) => {
            console.error("❌ Access denied:", error);
            window.location.href = "login.html";
          });
      }
    }, 100);
  };

  // =============================
  // ROLE INDICATOR
  // =============================
  function showRoleIndicator() {
    const indicator = document.getElementById("realtimeIndicator");
    if (indicator) {
      if (userRole === "admin") {
        indicator.innerHTML = '<span>🔴 Live Monitoring (Admin)</span>';
      } else if (userRole === "kapus") {
        indicator.innerHTML = '<span>🟢 Live Monitoring (Kapus)</span>';
      }
    }
  }

  // =============================
  // REAL-TIME MONITORING SETUP
  // =============================
  function setupRealtimeMonitoring() {
    console.log("🔄 Setting up real-time monitoring...");
    console.log("🔐 User role:", userRole);

    // Cleanup previous listeners
    if (unsubscribeMasuk) unsubscribeMasuk();
    if (unsubscribeKeluar) unsubscribeKeluar();
    if (unsubscribeNotaDinas) unsubscribeNotaDinas();

    // SURAT MASUK LISTENER
    unsubscribeMasuk = db
      .collection("surat_masuk")
      .where("isDeleted", "==", false)
      .onSnapshot(
        (snapshot) => {
          console.log("📨 Surat Masuk snapshot:", snapshot.size);
          
          snapshot.docChanges().forEach((change) => {
            const data = change.doc.data();
            
            if (change.type === "added" && isRelevantForRole(data)) {
              console.log("➕ New Surat Masuk:", change.doc.id);
              showRealtimeNotification(
                "Surat Masuk Baru", 
                data.perihal || "Tanpa Judul",
                "info"
              );
            }
            
            if (change.type === "modified" && isRelevantForRole(data)) {
              console.log("✏️ Surat Masuk Updated:", change.doc.id);
              if (data.status) {
                showRealtimeNotification(
                  "Status Diperbarui", 
                  `${data.perihal} - ${data.status}`,
                  "success"
                );
              }
            }
          });

          loadMonitoringData();
        },
        (error) => {
          console.error("❌ Surat Masuk listener error:", error);
          showError("Error loading Surat Masuk");
        }
      );

    // SURAT KELUAR LISTENER
    unsubscribeKeluar = db
      .collection("surat_keluar")
      .where("isDeleted", "==", false)
      .onSnapshot(
        (snapshot) => {
          console.log("📤 Surat Keluar snapshot:", snapshot.size);
          
          snapshot.docChanges().forEach((change) => {
            const data = change.doc.data();
            
            if (change.type === "added" && isRelevantForRole(data)) {
              console.log("➕ New Surat Keluar:", change.doc.id);
              showRealtimeNotification(
                "Surat Keluar Baru", 
                data.perihal || "Tanpa Judul",
                "info"
              );
            }
            
            if (change.type === "modified" && isRelevantForRole(data)) {
              console.log("✏️ Surat Keluar Updated:", change.doc.id);
              if (data.status) {
                showRealtimeNotification(
                  "Status Diperbarui", 
                  `${data.perihal} - ${data.status}`,
                  "success"
                );
              }
            }
          });

          loadMonitoringData();
        },
        (error) => {
          console.error("❌ Surat Keluar listener error:", error);
          showError("Error loading Surat Keluar");
        }
      );

    // NOTA DINAS LISTENER
    unsubscribeNotaDinas = db
      .collection("nota_dinas")
      .where("isDeleted", "==", false)
      .onSnapshot(
        (snapshot) => {
          console.log("📝 Nota Dinas snapshot:", snapshot.size);
          
          snapshot.docChanges().forEach((change) => {
            const data = change.doc.data();
            
            if (change.type === "added" && isRelevantForRole(data)) {
              console.log("➕ New Nota Dinas:", change.doc.id);
              showRealtimeNotification(
                "Nota Dinas Baru", 
                data.perihal || "Tanpa Judul",
                "info"
              );
            }
            
            if (change.type === "modified" && isRelevantForRole(data)) {
              console.log("✏️ Nota Dinas Updated:", change.doc.id);
              if (data.status) {
                showRealtimeNotification(
                  "Status Diperbarui", 
                  `${data.perihal} - ${data.status}`,
                  "success"
                );
              }
            }
          });

          loadMonitoringData();
        },
        (error) => {
          console.error("❌ Nota Dinas listener error:", error);
          showError("Error loading Nota Dinas");
        }
      );

    console.log("✅ Real-time monitoring setup complete");
  }

  // =============================
  // CHECK IF DATA RELEVANT FOR ROLE
  // =============================
  function isRelevantForRole(data) {
    if (userRole === "admin") {
      return true; // Admin sees everything
    }
    
    if (userRole === "kapus") {
      const status = data.status || "";
      // Kapus only sees processed/approved items
      return (
        status.includes("Disetujui") ||
        status.includes("Selesai") ||
        status.includes("Ditolak") ||
        status === "Proses"
      );
    }
    
    return false;
  }

  // =============================
  // REAL-TIME NOTIFICATION
  // =============================
  function showRealtimeNotification(title, message, type = "info") {
    if (!window.Swal) {
      console.warn("SweetAlert2 not loaded");
      return;
    }

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

  // =============================
  // ERROR DISPLAY
  // =============================
  function showError(message) {
    const tableBody = document.getElementById("monitoringTableBody");
    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 40px; color: #dc2626;">
            <i class="bi bi-exclamation-triangle" style="font-size: 48px; margin-bottom: 16px;"></i>
            <div style="font-size: 16px; font-weight: 600;">${message}</div>
            <div style="font-size: 14px; color: #6b7280; margin-top: 8px;">
              Silakan refresh halaman atau hubungi administrator
            </div>
          </td>
        </tr>
      `;
    }
  }

  // =============================
  // LOAD DATA FROM FIREBASE
  // =============================
  window.loadMonitoringData = function () {
    const tableBody = document.getElementById("monitoringTableBody");
    if (!tableBody) {
      console.error("❌ Table body not found!");
      return;
    }

    console.log("🔄 Loading monitoring data...");
    tableBody.innerHTML = `
      <tr class="loading-row">
        <td colspan="7" style="text-align: center; padding: 20px;">
          <i class="bi bi-arrow-repeat" style="font-size: 24px; animation: spin 1s linear infinite;"></i>
          <div style="margin-top: 8px;">Loading data...</div>
        </td>
      </tr>
    `;

    Promise.all([
      db.collection("surat_masuk").where("isDeleted", "==", false).get(),
      db.collection("surat_keluar").where("isDeleted", "==", false).get(),
      db.collection("nota_dinas").where("isDeleted", "==", false).get(),
    ])
      .then((results) => {
        monitoringData = [];

        // Process Surat Masuk
        results[0].forEach((doc) => {
          const data = doc.data();
          monitoringData.push({
            id: doc.id,
            type: "masuk",
            ...data,
            _createdAt: data.createdAt ? data.createdAt.toDate() : new Date(0),
          });
        });

        // Process Surat Keluar
        results[1].forEach((doc) => {
          const data = doc.data();
          monitoringData.push({
            id: doc.id,
            type: "keluar",
            ...data,
            _createdAt: data.createdAt ? data.createdAt.toDate() : new Date(0),
          });
        });

        // Process Nota Dinas
        results[2].forEach((doc) => {
          const data = doc.data();
          monitoringData.push({
            id: doc.id,
            type: "nota-dinas",
            ...data,
            _createdAt: data.createdAt ? data.createdAt.toDate() : new Date(0),
          });
        });

        console.log("📊 Total monitoring data loaded:", monitoringData.length);
        console.log("🔐 Filtering for role:", userRole);

        // ROLE-BASED FILTERING
        if (userRole === "kapus") {
          const originalLength = monitoringData.length;
          monitoringData = monitoringData.filter((surat) => {
            const status = surat.status || "";
            return (
              status.includes("Disetujui") ||
              status.includes("Selesai") ||
              status.includes("Ditolak") ||
              status === "Proses"
            );
          });
          console.log(`👔 Kapus filter: ${originalLength} → ${monitoringData.length} items`);
        } else {
          console.log("👨‍💼 Admin: showing all", monitoringData.length, "items");
        }

        // Sort by createdAt descending
        monitoringData.sort((a, b) => b._createdAt - a._createdAt);

        // Apply filters
        applyFilters();
      })
      .catch((error) => {
        console.error("❌ Error loading monitoring data:", error);
        showError(`Error: ${error.message}`);
      });
  };

  // =============================
  // RENDER TABLE
  // =============================
  function renderMonitoringTable(data) {
    const tbody = document.getElementById("monitoringTableBody");
    if (!tbody) {
      console.error("❌ Table body not found!");
      return;
    }

    console.log("🔄 Rendering monitoring table with", data.length, "items...");

    const startIndex = (currentPageMonitoring - 1) * itemsPerPageMonitoring;
    const endIndex = startIndex + itemsPerPageMonitoring;
    const paginatedData = data.slice(startIndex, endIndex);

    tbody.innerHTML = "";

    if (paginatedData.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 40px; color: #9ca3af;">
            <i class="bi bi-inbox" style="font-size: 48px; margin-bottom: 16px;"></i>
            <div style="font-size: 16px; font-weight: 600;">Tidak ada data monitoring</div>
            <div style="font-size: 14px; margin-top: 8px;">
              ${currentTab === "masuk" ? "Belum ada surat masuk" : 
                currentTab === "keluar" ? "Belum ada surat keluar" : 
                "Belum ada nota dinas"}
            </div>
          </td>
        </tr>
      `;
      updatePaginationInfoMonitoring(0);
      console.log("⚠️ No data to display");
      return;
    }

    paginatedData.forEach((surat, index) => {
      const row = document.createElement("tr");

      const statusInfo = getStatusInfo(surat.status || "Pending");
      const statusText = surat.status || "Pending";

      const dari = surat.dari || surat.namaPengirim || "-";
      const noSurat = surat.noSurat || surat.noNaskah || "-";
      const tanggalSurat = formatDate(surat.tanggalSurat || surat.createdAt);
      const kepada = surat.kepada || surat.tujuan || "-";
      const perihal = surat.perihal || "-";

      // Type icon
      const typeIcon = 
        surat.type === "masuk" ? "bi-envelope-fill" :
        surat.type === "keluar" ? "bi-send-fill" :
        "bi-file-earmark-text-fill";

      row.innerHTML = `
        <td style="text-align: left; padding: 12px 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <i class="bi bi-person-circle" style="font-size: 24px; color: #666;"></i>
            <div>
              <span style="font-size: 13px; color: #333; font-weight: 500;">${dari}</span>
              <div style="font-size: 11px; color: #9ca3af; margin-top: 2px;">
                <i class="bi ${typeIcon}" style="font-size: 10px;"></i>
                ${surat.type === "masuk" ? "Masuk" : surat.type === "keluar" ? "Keluar" : "Nota Dinas"}
              </div>
            </div>
          </div>
        </td>
        <td style="text-align: left; font-size: 13px; color: #333; font-weight: 500;">${noSurat}</td>
        <td style="text-align: left; font-size: 13px; color: #666;">
          <i class="bi bi-calendar3" style="font-size: 11px; margin-right: 4px;"></i>
          ${tanggalSurat}
        </td>
        <td style="text-align: left; font-size: 13px; color: #333;">${kepada}</td>
        <td style="text-align: left; font-size: 13px; color: #333;">
          <div style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${perihal}">
            ${perihal}
          </div>
        </td>
        <td style="text-align: center;">
          <span class="status-badge" style="
            background-color: ${statusInfo.bgColor}; 
            color: ${statusInfo.textColor};
            padding: 6px 14px;
            border-radius: 16px;
            font-size: 12px;
            font-weight: 600;
            display: inline-block;
            white-space: nowrap;
          ">${statusText}</span>
        </td>
        <td style="text-align: center;">
          <div style="display: flex; gap: 8px; justify-content: center; align-items: center;">
            <button class="action-btn view-btn" onclick="viewDetail('${surat.id}', '${surat.type}')" title="Lihat Detail">
              <i class="bi bi-eye"></i>
            </button>
            ${userRole === "admin" ? `
            <button class="action-btn delete-btn" onclick="deleteSuratFromMonitoring('${surat.id}', '${surat.type}')" title="Hapus">
              <i class="bi bi-trash"></i>
            </button>
            ` : ''}
          </div>
        </td>
      `;
      tbody.appendChild(row);
    });

    updatePaginationInfoMonitoring(data.length);
    console.log("✅ Table rendered with", paginatedData.length, "rows");
  }

  // =============================
  // HELPER FUNCTIONS - STATUS INFO
  // =============================
  function getStatusInfo(status) {
    const statusMap = {
      // PROSES (BIRU) - Status awal/dalam proses
      "Pending": { bgColor: "#DBEAFE", textColor: "#1E40AF", category: "proses" },
      "Proses": { bgColor: "#DBEAFE", textColor: "#1E40AF", category: "proses" },
      "Terkirim ke Kapus": { bgColor: "#DBEAFE", textColor: "#1E40AF", category: "proses" },
      
      // SEDANG DITINJAU (KUNING) - Menunggu approval
      "Menunggu Persetujuan Kapus": { bgColor: "#FEF3C7", textColor: "#D97706", category: "ditinjau" },
      "Menunggu TTD": { bgColor: "#FEF3C7", textColor: "#D97706", category: "ditinjau" },
      
      // SELESAI/DISETUJUI (HIJAU) - Completed
      "Selesai": { bgColor: "#D1FAE5", textColor: "#059669", category: "selesai" },
      "Disetujui Kapus": { bgColor: "#D1FAE5", textColor: "#059669", category: "selesai" },
      "Siap Kirim": { bgColor: "#D1FAE5", textColor: "#059669", category: "selesai" },
      "Diterima": { bgColor: "#D1FAE5", textColor: "#059669", category: "selesai" },
      
      // DITOLAK/ERROR (MERAH) - Rejected
      "Ditolak": { bgColor: "#FEE2E2", textColor: "#DC2626", category: "ditolak" },
      "Ditolak Kapus": { bgColor: "#FEE2E2", textColor: "#DC2626", category: "ditolak" },
      "Dihapus": { bgColor: "#F3F4F6", textColor: "#6B7280", category: "ditolak" },
    };

    return statusMap[status] || { bgColor: "#F3F4F6", textColor: "#6B7280", category: "unknown" };
  }

  function formatDate(dateStr) {
    if (!dateStr) return "-";

    let date;
    if (dateStr instanceof Date) {
      date = dateStr;
    } else if (typeof dateStr === "string") {
      date = new Date(dateStr);
    } else if (dateStr.toDate) {
      date = dateStr.toDate();
    } else {
      return "-";
    }

    if (isNaN(date.getTime())) {
      return "-";
    }

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // =============================
  // GLOBAL FUNCTIONS
  // =============================
  window.viewDetail = function (id, type) {
    console.log("👁️ Viewing detail:", id, type);
    
    if (type === "masuk") {
      window.location.href = `surat-masuk.html#detail-${id}`;
    } else if (type === "keluar") {
      window.location.href = `surat-keluar.html#detail-${id}`;
    } else if (type === "nota-dinas") {
      window.location.href = `nota-dinas.html#detail-${id}`;
    }
  };

  window.deleteSuratFromMonitoring = function (id, type) {
    // Only admin can delete
    if (userRole !== "admin") {
      if (window.Swal) {
        Swal.fire({
          icon: "error",
          title: "Akses Ditolak",
          text: "Hanya Admin yang dapat menghapus surat",
          confirmButtonColor: "#dc2626"
        });
      }
      return;
    }

    if (!window.Swal) {
      if (!confirm("Yakin ingin menghapus surat ini?")) return;
      performDelete(id, type);
      return;
    }

    Swal.fire({
      title: "Hapus Surat?",
      html: `
        <p>Surat akan dipindahkan ke halaman <strong>Surat Dihapus</strong></p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 12px;">
          Tipe: ${type === "masuk" ? "Surat Masuk" : type === "keluar" ? "Surat Keluar" : "Nota Dinas"}
        </p>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: '<i class="bi bi-trash"></i> Ya, Hapus!',
      cancelButtonText: "Batal",
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        performDelete(id, type);
      }
    });
  };

  function performDelete(id, type) {
    const collection =
      type === "masuk"
        ? "surat_masuk"
        : type === "keluar"
        ? "surat_keluar"
        : "nota_dinas";

    // Show loading
    if (window.Swal) {
      Swal.fire({
        title: 'Menghapus...',
        text: 'Mohon tunggu',
        allowOutsideClick: false,
        showConfirmButton: false,
        willOpen: () => {
          Swal.showLoading();
        }
      });
    }

    db.collection(collection)
      .doc(id)
      .update({
        isDeleted: true,
        deletedAt: firebase.firestore.FieldValue.serverTimestamp(),
        deletedBy: currentUserData?.nama || currentUserData?.email || "Admin",
      })
      .then(() => {
        if (window.Swal) {
          Swal.fire({
            icon: "success",
            title: "Berhasil Dihapus!",
            text: "Surat telah dipindahkan ke Surat Dihapus",
            timer: 2000,
            showConfirmButton: false,
          });
        }
        console.log("✅ Surat deleted:", id);
      })
      .catch((error) => {
        console.error("❌ Error deleting:", error);
        if (window.Swal) {
          Swal.fire({
            icon: "error",
            title: "Gagal Menghapus",
            text: "Terjadi kesalahan: " + error.message,
            confirmButtonColor: "#dc2626"
          });
        }
      });
  }

  // =============================
  // PAGINATION
  // =============================
  function updatePaginationInfoMonitoring(totalItems) {
    const startIndex = (currentPageMonitoring - 1) * itemsPerPageMonitoring + 1;
    const endIndex = Math.min(
      currentPageMonitoring * itemsPerPageMonitoring,
      totalItems
    );
    const infoElement = document.getElementById("monitoringPaginationInfo");
    if (infoElement) {
      infoElement.textContent = `Showing ${
        totalItems === 0 ? 0 : startIndex
      }-${endIndex} of ${totalItems}`;
    }

    const prevBtn = document.getElementById("prevBtnMonitoring");
    const nextBtn = document.getElementById("nextBtnMonitoring");
    const maxPage = Math.ceil(totalItems / itemsPerPageMonitoring);

    if (prevBtn) prevBtn.disabled = currentPageMonitoring === 1;
    if (nextBtn)
      nextBtn.disabled = currentPageMonitoring >= maxPage || totalItems === 0;
  }

  window.previousPageMonitoring = function () {
    if (currentPageMonitoring > 1) {
      currentPageMonitoring--;
      renderMonitoringTable(filteredData);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  window.nextPageMonitoring = function () {
    const maxPage = Math.ceil(filteredData.length / itemsPerPageMonitoring);
    if (currentPageMonitoring < maxPage) {
      currentPageMonitoring++;
      renderMonitoringTable(filteredData);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // =============================
  // FILTERS
  // =============================
  function setupMonitoringFilters() {
    const searchInput = document.getElementById("searchPerihal");
    const statusFilter = document.getElementById("statusFilter");
    const resetBtn = document.getElementById("resetBtn");

    // Tab filters
    const tabBtns = document.querySelectorAll(".tabs-container .tab-btn");
    tabBtns.forEach((btn) => {
      btn.addEventListener("click", function () {
        tabBtns.forEach((b) => b.classList.remove("active"));
        this.classList.add("active");

        currentTab = this.getAttribute("data-tab");
        console.log("📑 Switched to tab:", currentTab);
        applyFilters();
      });
    });

    if (searchInput) {
      searchInput.addEventListener("input", debounce(applyFilters, 300));
    }

    if (statusFilter) {
      statusFilter.addEventListener("change", applyFilters);
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        if (statusFilter) statusFilter.selectedIndex = 0;
        if (searchInput) searchInput.value = "";

        selectedDate = null;
        updateDateButtonText();

        tabBtns.forEach((b) => b.classList.remove("active"));
        tabBtns[0]?.classList.add("active");
        currentTab = "masuk";

        currentPageMonitoring = 1;
        applyFilters();
      });
    }
  }

  function applyFilters() {
    const searchInput = document.getElementById("searchPerihal");
    const statusFilter = document.getElementById("statusFilter");

    let filtered = [...monitoringData];

    // Filter by tab
    if (currentTab) {
      filtered = filtered.filter((s) => s.type === currentTab);
    }

    // Filter by search
    if (searchInput?.value) {
      const searchTerm = searchInput.value.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          (s.perihal && s.perihal.toLowerCase().includes(searchTerm)) ||
          (s.noSurat && s.noSurat.toLowerCase().includes(searchTerm)) ||
          (s.noNaskah && s.noNaskah.toLowerCase().includes(searchTerm)) ||
          (s.dari && s.dari.toLowerCase().includes(searchTerm)) ||
          (s.namaPengirim && s.namaPengirim.toLowerCase().includes(searchTerm))
      );
    }

    // Filter by status
    if (statusFilter?.value) {
      filtered = filtered.filter(
        (s) => s.status?.toLowerCase() === statusFilter.value.toLowerCase()
      );
    }

    // Filter by date
    if (selectedDate) {
      filtered = filtered.filter((s) => {
        const suratDate = s.tanggalSurat
          ? new Date(s.tanggalSurat)
          : s._createdAt;
        return suratDate.toDateString() === selectedDate.toDateString();
      });
    }

    console.log("🔍 After filters:", filtered.length, "items");

    currentPageMonitoring = 1;
    filteredData = filtered;
    renderMonitoringTable(filtered);
  }

  // Debounce helper
  function debounce(func, wait) {
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

  // =============================
  // CALENDAR
  // =============================
  function setupCalendar() {
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
        calendarModal.classList.remove("active");
        updateDateButtonText();
        applyFilters();
      });
    }

    if (prevMonthBtn) {
      prevMonthBtn.addEventListener("click", () => {
        currentMonth--;
        if (currentMonth < 0) {
          currentMonth = 11;
          currentYear--;
        }
        renderCalendar();
      });
    }

    if (nextMonthBtn) {
      nextMonthBtn.addEventListener("click", () => {
        currentMonth++;
        if (currentMonth > 11) {
          currentMonth = 0;
          currentYear++;
        }
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

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];

    calendarMonth.textContent = `${monthNames[currentMonth]} ${currentYear}`;

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

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

      const date = new Date(currentYear, currentMonth, day);
      const today = new Date();

      if (date.toDateString() === today.toDateString()) {
        dayBtn.classList.add("today");
      }

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

  function updateDateButtonText() {
    const dateText = document.getElementById("selectedDateText");
    if (dateText) {
      if (selectedDate) {
        const day = String(selectedDate.getDate()).padStart(2, "0");
        const months = [
          "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
          "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
        ];
        const month = months[selectedDate.getMonth()];
        const year = selectedDate.getFullYear();
        dateText.textContent = `${day} ${month} ${year}`;
      } else {
        dateText.textContent = "Tanggal";
      }
    }
  }

  // =============================
  // CLEANUP
  // =============================
  window.addEventListener("beforeunload", () => {
    console.log("🧹 Cleaning up listeners...");
    if (unsubscribeMasuk) unsubscribeMasuk();
    if (unsubscribeKeluar) unsubscribeKeluar();
    if (unsubscribeNotaDinas) unsubscribeNotaDinas();
  });

  // =============================
  // CSS INJECTION FOR ANIMATIONS
  // =============================
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);

})();

console.log("✅ Monitoring.js - Real-Time Firebase Loaded (v2.0)");