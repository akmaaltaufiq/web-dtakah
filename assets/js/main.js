// ========================================
// MAIN.JS - COMPLETE WITH ROLE-BASED SIDEBAR
// ========================================

document.addEventListener("DOMContentLoaded", () => {
  const loadingScreen = document.getElementById("loadingScreen");

  // =============================
  // LOADING SCREEN
  // =============================
  window.showLoading = () => loadingScreen?.classList.add("show");
  window.hideLoading = () => loadingScreen?.classList.remove("show");

  // =============================
  // LOAD SWEETALERT2 DINAMIS
  // =============================
  window.loadSwal = function (callback) {
    if (window.Swal) {
      console.log("✅ SweetAlert2 already loaded");
      return callback();
    }
    console.log("🔄 Loading SweetAlert2...");
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/sweetalert2@11";
    script.onload = () => {
      console.log("✅ SweetAlert2 loaded successfully");
      callback();
    };
    script.onerror = () => {
      console.error("❌ Failed to load SweetAlert2");
      callback();
    };
    document.head.appendChild(script);
  };

  // =============================
  // GLOBAL UTILS
  // =============================
  window.Utils = {
    formatDate: (dateString) => {
      if (!dateString) return "-";
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;

      return date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    },

    formatDateShort: (dateString) => {
      if (!dateString) return "-";
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;

      return date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    },

    getSifatBadge: (sifat) => {
      const badges = {
        Umum: "badge-umum",
        Penting: "badge-penting",
        Rahasia: "badge-rahasia",
        "Sangat Rahasia": "badge-sangat-rahasia",
        Konfidensial: "badge-konfidensial",
      };
      return badges[sifat] || "badge-umum";
    },

    getStatusBadge: (status) => {
      return status ? status.toLowerCase() : "pending";
    },

    getStatusClass: (status) => {
      const statusMap = {
        Selesai: "selesai",
        Proses: "proses",
        Ditolak: "ditolak",
        Ditunda: "ditunda",
        Terkirim: "selesai",
        Pending: "ditunda",
      };
      return statusMap[status] || "ditunda";
    },

    getMonthName: (monthIndex) => {
      const months = [
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
      return months[monthIndex] || "";
    },

    truncateText: (text, maxLength = 100) => {
      if (!text) return "";
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength) + "...";
    },

    escapeHtml: (text) => {
      if (!text) return "";
      const map = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      };
      return String(text).replace(/[&<>"']/g, (m) => map[m]);
    },
  };

  // =============================
  // NOTIFICATION SYSTEM
  // =============================
  window.Notification = {
    success: (message) => {
      if (window.Swal) {
        Swal.fire({
          icon: "success",
          title: "Berhasil!",
          text: message,
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: "top-end",
        });
      } else {
        alert(`✅ ${message}`);
      }
    },

    error: (message) => {
      if (window.Swal) {
        Swal.fire({
          icon: "error",
          title: "Error!",
          text: message,
          confirmButtonText: "OK",
          confirmButtonColor: "#8b0000",
        });
      } else {
        alert(`❌ ${message}`);
      }
    },

    warning: (message) => {
      if (window.Swal) {
        Swal.fire({
          icon: "warning",
          title: "Perhatian!",
          text: message,
          confirmButtonText: "OK",
          confirmButtonColor: "#f59e0b",
        });
      } else {
        alert(`⚠️ ${message}`);
      }
    },

    info: (message) => {
      if (window.Swal) {
        Swal.fire({
          icon: "info",
          title: "Informasi",
          text: message,
          confirmButtonText: "OK",
          confirmButtonColor: "#3b82f6",
        });
      } else {
        alert(`ℹ️ ${message}`);
      }
    },

    confirm: (message, onConfirm, onCancel) => {
      if (window.Swal) {
        Swal.fire({
          title: "Konfirmasi",
          text: message,
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Ya",
          cancelButtonText: "Batal",
          confirmButtonColor: "#8b0000",
          cancelButtonColor: "#6c757d",
          reverseButtons: true,
        }).then((result) => {
          if (result.isConfirmed && onConfirm) {
            onConfirm();
          } else if (result.isDismissed && onCancel) {
            onCancel();
          }
        });
      } else {
        if (confirm(`⚠️ ${message}`)) {
          if (onConfirm) onConfirm();
        } else {
          if (onCancel) onCancel();
        }
      }
    },
  };

  // =============================
  // SIDEBAR TOGGLE FUNCTIONALITY
  // =============================
  window.toggleSidebar = function () {
    console.log("🔄 Toggling sidebar...");

    const sidebar = document.querySelector(".navigation-sidebar");
    const mainContent = document.querySelector(".main-content");
    const overlay = document.querySelector(".sidebar-overlay");

    if (!sidebar || !mainContent) {
      console.warn("⚠️ Sidebar or main content not found");
      return;
    }

    // Detect mobile or desktop
    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
      // Mobile behavior: overlay sidebar
      sidebar.classList.toggle("active");

      if (overlay) {
        overlay.classList.toggle("active");
      } else {
        // Create overlay if doesn't exist
        const newOverlay = document.createElement("div");
        newOverlay.className = "sidebar-overlay active";
        newOverlay.addEventListener("click", toggleSidebar);
        document.body.appendChild(newOverlay);
      }
    } else {
      // Desktop behavior: push content
      sidebar.classList.toggle("hidden");
      mainContent.classList.toggle("expanded");

      // Save state to localStorage (desktop only)
      const isHidden = sidebar.classList.contains("hidden");
      localStorage.setItem("sidebarHidden", isHidden);
      console.log(`💾 Sidebar state saved: ${isHidden ? "hidden" : "visible"}`);
    }

    console.log(`📱 Sidebar toggled successfully`);
  };

  window.initSidebarToggle = function () {
    console.log("🔧 Initializing sidebar toggle...");

    const sidebar = document.querySelector(".navigation-sidebar");
    const mainContent = document.querySelector(".main-content");
    const isMobile = window.innerWidth <= 768;

    // Create overlay for mobile if needed
    if (isMobile && !document.querySelector(".sidebar-overlay")) {
      const overlay = document.createElement("div");
      overlay.className = "sidebar-overlay";
      overlay.addEventListener("click", toggleSidebar);
      document.body.appendChild(overlay);
      console.log("✅ Mobile overlay created");
    }

    // Restore sidebar state from localStorage (desktop only)
    if (!isMobile) {
      const wasHidden = localStorage.getItem("sidebarHidden") === "true";

      if (wasHidden && sidebar && mainContent) {
        sidebar.classList.add("hidden");
        mainContent.classList.add("expanded");
        console.log("✅ Sidebar state restored: hidden");
      } else {
        console.log("✅ Sidebar state restored: visible");
      }
    }

    // Attach click handler to toggle button
    const toggleBtn = document.getElementById("sidebarToggleBtn");
    if (toggleBtn) {
      // Remove existing listeners by cloning
      const newToggleBtn = toggleBtn.cloneNode(true);
      toggleBtn.parentNode.replaceChild(newToggleBtn, toggleBtn);

      // Add new listener
      newToggleBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleSidebar();
      });
      console.log("✅ Sidebar toggle button attached");
    } else {
      console.warn("⚠️ Sidebar toggle button (#sidebarToggleBtn) not found");
    }

    console.log("✅ Sidebar toggle initialized");
  };

  // Handle Window Resize
  window.addEventListener("resize", () => {
    const sidebar = document.querySelector(".navigation-sidebar");
    const mainContent = document.querySelector(".main-content");
    const overlay = document.querySelector(".sidebar-overlay");
    const isMobile = window.innerWidth <= 768;

    if (!isMobile) {
      // Desktop mode
      console.log("🖥️ Switched to desktop mode");

      // Remove mobile overlay
      if (overlay) {
        overlay.remove();
      }

      // Remove mobile classes
      sidebar?.classList.remove("active");

      // Restore saved state for desktop
      const wasHidden = localStorage.getItem("sidebarHidden") === "true";
      if (wasHidden) {
        sidebar?.classList.add("hidden");
        mainContent?.classList.add("expanded");
      } else {
        sidebar?.classList.remove("hidden");
        mainContent?.classList.remove("expanded");
      }
    } else {
      // Mobile mode
      console.log("📱 Switched to mobile mode");

      // Ensure overlay exists
      if (!document.querySelector(".sidebar-overlay")) {
        const newOverlay = document.createElement("div");
        newOverlay.className = "sidebar-overlay";
        newOverlay.addEventListener("click", toggleSidebar);
        document.body.appendChild(newOverlay);
      }

      // Reset desktop classes
      sidebar?.classList.remove("hidden");
      mainContent?.classList.remove("expanded");
    }
  });

  // =============================
  // HEADER & NOTIFICATION LOGIC
  // =============================
  window.createNotifItem = (data) => {
    const icon =
      data.type === "masuk"
        ? "bi-send-check-fill"
        : "bi-file-earmark-check-fill";
    const isReadClass = data.isRead ? "read" : "unread";
    return `
      <a href="#" class="notif-item ${isReadClass}" 
         data-surat-id="${data.suratId}" 
         data-type="${data.type}" 
         onclick="handleNotifClick(event)">
        <i class="bi ${icon}"></i>
        <div>
          <div class="notif-title">${Utils.escapeHtml(data.title)}</div>
          <div class="notif-time">${Utils.escapeHtml(
            data.time || "Beberapa Waktu Lalu"
          )}</div>
        </div>
      </a>
    `;
  };

  window.loadNotifications = function () {
    const list = document.getElementById("notifList");
    const countBadge = document.getElementById("notificationCount");
    const unreadCountEl = document.getElementById("notifUnreadCount");
    if (!list) return;

    const notifications = KemhanDatabase.getNotifications();
    const unreadNotifs = notifications.filter((n) => !n.isRead);

    if (countBadge) {
      countBadge.textContent =
        unreadNotifs.length > 99
          ? "99+"
          : unreadNotifs.length > 0
          ? unreadNotifs.length
          : "";
      countBadge.style.display = unreadNotifs.length > 0 ? "flex" : "none";
    }

    if (unreadCountEl) {
      unreadCountEl.textContent = unreadNotifs.length;
    }

    if (notifications.length === 0) {
      list.innerHTML =
        '<p style="text-align: center; color: #999; padding: 20px;">Tidak ada notifikasi.</p>';
      return;
    }

    list.innerHTML = notifications.map(createNotifItem).join("");
  };

  window.toggleNotificationDropdown = function () {
    const dropdown = document.getElementById("notificationDropdown");
    if (dropdown) {
      dropdown.classList.toggle("active");
    }
  };

  window.markAllAsRead = function () {
    KemhanDatabase.markAllNotificationsAsRead();
    loadNotifications();
  };

  window.handleNotifClick = function (event) {
    event.preventDefault();
    const item = event.currentTarget;
    const suratId = item.dataset.suratId;
    const type = item.dataset.type;

    KemhanDatabase.markNotificationAsRead(suratId, type);
    loadNotifications();
    toggleNotificationDropdown();

    if (type === "masuk") {
      window.location.href = `surat-masuk.html#detail-${suratId}`;
    } else if (type === "keluar") {
      window.location.href = `surat-keluar.html`;
    } else if (type === "nota-dinas") {
      window.location.href = `nota-dinas.html`;
    }
  };

  window.attachHeaderEvents = function () {
    console.log("🔧 Attaching header events...");

    // Notification button
    const notifBtn = document.getElementById("notificationBtn");
    const notifDropdown = document.getElementById("notificationDropdown");

    if (notifBtn && notifDropdown) {
      const newNotifBtn = notifBtn.cloneNode(true);
      notifBtn.parentNode.replaceChild(newNotifBtn, notifBtn);

      newNotifBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const langDropdown = document.getElementById("languageDropdown");
        if (langDropdown) {
          langDropdown.classList.remove("active");
        }

        notifDropdown.classList.toggle("active");
        console.log("🔔 Notification dropdown toggled");
      });
      console.log("✅ Notification button attached");
    }

    // User profile button
    const userProfileBtn = document.getElementById("userProfileBtn");
    if (userProfileBtn) {
      userProfileBtn.addEventListener("click", () => {
        window.location.href = "pengaturan.html";
      });
      console.log("✅ User profile button attached");
    }

    // Language selector
    const langSelector = document.getElementById("languageSelector");
    const langDropdown = document.getElementById("languageDropdown");

    if (langSelector && langDropdown) {
      const newLangSelector = langSelector.cloneNode(true);
      langSelector.parentNode.replaceChild(newLangSelector, langSelector);

      newLangSelector.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const notifDropdown = document.getElementById("notificationDropdown");
        if (notifDropdown) {
          notifDropdown.classList.remove("active");
        }

        langDropdown.classList.toggle("active");
        console.log("🌐 Language dropdown toggled");
      });

      const langItems = langDropdown.querySelectorAll(".lang-item");
      langItems.forEach((item) => {
        item.addEventListener("click", (e) => {
          e.preventDefault();

          langItems.forEach((i) => i.classList.remove("active"));
          item.classList.add("active");

          const flag = item.querySelector("img").src;
          const text = item.querySelector("span").textContent;

          const selectorFlag = newLangSelector.querySelector("img");
          const selectorText = newLangSelector.querySelector("span");

          if (selectorFlag) selectorFlag.src = flag;
          if (selectorText) selectorText.textContent = text;

          langDropdown.classList.remove("active");

          console.log("🌐 Language changed to:", text);
        });
      });

      console.log("✅ Language selector attached");
    }

    // Mark all read button
    const markAllReadBtn = document.getElementById("markAllRead");
    if (markAllReadBtn) {
      markAllReadBtn.addEventListener("click", (e) => {
        e.preventDefault();
        markAllAsRead();
      });
    }

    // Close dropdowns on outside click
    document.addEventListener("click", (e) => {
      const notifDropdown = document.getElementById("notificationDropdown");
      const notifBtn = document.getElementById("notificationBtn");
      const langDropdown = document.getElementById("languageDropdown");
      const langSelector = document.getElementById("languageSelector");

      if (
        notifDropdown &&
        !notifDropdown.contains(e.target) &&
        notifBtn &&
        !notifBtn.contains(e.target)
      ) {
        notifDropdown.classList.remove("active");
      }

      if (
        langDropdown &&
        !langDropdown.contains(e.target) &&
        langSelector &&
        !langSelector.contains(e.target)
      ) {
        langDropdown.classList.remove("active");
      }
    });

    loadNotifications();

    console.log("✅ Header events attached");
  };

  // =============================
  // SIDEBAR & MENU HIGHLIGHTING
  // =============================
  window.highlightActiveMenu = function () {
    console.log("🎯 Highlighting active menu...");
    let currentPage = window.location.pathname.split("/").pop() || "index.html";

    if (currentPage === "" || currentPage === "/") {
      currentPage = "index.html";
    }

    console.log("📄 Current page:", currentPage);

    document.querySelectorAll(".menu-item").forEach((item) => {
      item.classList.remove("active");
    });
    document.querySelectorAll(".submenu-item").forEach((item) => {
      item.classList.remove("active");
    });
    document.querySelectorAll(".menu-dropdown").forEach((dropdown) => {
      dropdown.classList.remove("active");
    });

    let isSubmenuActive = false;

    const submenuLinks = document.querySelectorAll(".submenu-link");
    submenuLinks.forEach((link) => {
      const href = link.getAttribute("href");

      if (href === currentPage) {
        console.log("✅ Found active submenu:", href);

        const submenuItem = link.closest(".submenu-item");
        if (submenuItem) {
          submenuItem.classList.add("active");
        }

        const parentDropdown = link.closest(".menu-dropdown");
        if (parentDropdown) {
          parentDropdown.classList.add("active", "open");
          isSubmenuActive = true;
        }
      }
    });

    if (!isSubmenuActive) {
      const menuLinks = document.querySelectorAll(
        ".menu-item:not(.menu-dropdown) > .menu-link"
      );

      menuLinks.forEach((link) => {
        const href = link.getAttribute("href");

        if (
          href === currentPage ||
          (currentPage === "index.html" && href === "index.html") ||
          (currentPage === "" && href === "index.html")
        ) {
          console.log("✅ Found active menu:", href);

          const menuItem = link.closest(".menu-item");
          if (menuItem) {
            menuItem.classList.add("active");
          }
        }
      });
    }

    console.log("✅ Active menu highlighting complete");
  };

  window.attachSidebarEvents = function () {
    console.log("🔧 Attaching sidebar events...");

    // Dropdown toggle
    const dropdownToggles = document.querySelectorAll(".menu-dropdown-toggle");

    dropdownToggles.forEach((toggle) => {
      toggle.addEventListener("click", function (e) {
        e.preventDefault();
        const menuItem = this.closest(".menu-dropdown");

        document.querySelectorAll(".menu-dropdown").forEach((item) => {
          if (item !== menuItem && !item.classList.contains("active")) {
            item.classList.remove("open");
          }
        });

        menuItem.classList.toggle("open");
      });
    });

    // Logout Handler
    let logoutLink =
      document.getElementById("logoutLink") ||
      document.getElementById("logoutBtn") ||
      document.querySelector('a[href="#"][id*="logout"]') ||
      document.querySelector(".menu-link:has(.bi-box-arrow-right)");

    if (logoutLink) {
      console.log("✅ Logout button found");

      const newLogoutLink = logoutLink.cloneNode(true);
      logoutLink.parentNode.replaceChild(newLogoutLink, logoutLink);

      newLogoutLink.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        console.log("🚪 Logout clicked");

        window.loadSwal(() => {
          Swal.fire({
            title: "Yakin ingin logout?",
            text: "Anda akan keluar dari sesi saat ini.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Ya, logout",
            cancelButtonText: "Batal",
            reverseButtons: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
          }).then((result) => {
            if (result.isConfirmed) {
              console.log("✅ User confirmed logout");

              sessionStorage.clear();
              localStorage.clear();

              if (window.auth) {
                auth
                  .signOut()
                  .then(() => {
                    console.log("✅ Firebase logged out");

                    Swal.fire({
                      title: "Logout berhasil",
                      text: "Anda akan diarahkan ke halaman login.",
                      icon: "success",
                      showConfirmButton: false,
                      timer: 1000,
                    });

                    setTimeout(() => {
                      window.location.replace("login.html?logout=true");
                    }, 1200);
                  })
                  .catch((err) => {
                    console.error("Logout error:", err);
                    window.location.replace("login.html?logout=true");
                  });
              } else {
                window.location.replace("login.html?logout=true");
              }
            }
          });
        });
      });
    } else {
      console.warn("⚠️ Logout button NOT found");
    }

    console.log("✅ Sidebar events attached");
  };

  // =============================
  // ✅ ROLE-BASED SIDEBAR LOADING
  // =============================
  window.getUserRole = function () {
    // Check current page to determine role
    const currentPage = window.location.pathname;

    if (currentPage.includes("kapus")) {
      return "kapus";
    }

    // Default to admin
    return "admin";
  };

  window.loadIncludes = async function () {
    console.log("🔄 Loading includes...");

    // ✅ Detect user role
    const userRole = getUserRole();
    console.log("👤 Detected role:", userRole);

    // ✅ Load appropriate sidebar based on role
    const sidebarFile =
      userRole === "kapus"
        ? "assets/includes/sidebar-kapus.html"
        : "assets/includes/sidebar-admin.html";

    try {
      const sidebarResponse = await fetch(sidebarFile);
      const sidebarHtml = await sidebarResponse.text();
      const sidebarPlaceholder = document.getElementById("sidebar-placeholder");

      if (sidebarPlaceholder) {
        sidebarPlaceholder.innerHTML = sidebarHtml;
        console.log(`✅ Sidebar loaded: ${sidebarFile}`);

        setTimeout(() => {
          window.attachSidebarEvents();
          window.highlightActiveMenu();
        }, 100);
      }
    } catch (err) {
      console.error("❌ Error loading sidebar:", err);
    }

    // Load header (same for all roles)
    try {
      const headerResponse = await fetch("assets/includes/header.html");
      const headerHtml = await headerResponse.text();
      const headerPlaceholder = document.getElementById("header-placeholder");

      if (headerPlaceholder) {
        headerPlaceholder.innerHTML = headerHtml;
        attachHeaderEvents();
        console.log("✅ Header loaded");

        // ✅ Initialize sidebar toggle after header loaded
        setTimeout(() => {
          initSidebarToggle();
        }, 100);
      }
    } catch (err) {
      console.error("❌ Error loading header:", err);
    }

    // Load footer (same for all roles)
    try {
      const footerResponse = await fetch("assets/includes/footer.html");
      const footerHtml = await footerResponse.text();
      const footerPlaceholder = document.getElementById("footer-placeholder");

      if (footerPlaceholder) {
        footerPlaceholder.innerHTML = footerHtml;
        console.log("✅ Footer loaded");
      }
    } catch (err) {
      console.error("❌ Error loading footer:", err);
    }

    // Trigger page-specific initialization
    if (window.initializePage) {
      setTimeout(() => {
        window.initializePage();
      }, 150);
    }

    if (window.initializeSuratKeluarPage) {
      setTimeout(() => {
        window.initializeSuratKeluarPage();
      }, 150);
    }

    if (window.initializeSuratMasukPage) {
      setTimeout(() => {
        window.initializeSuratMasukPage();
      }, 150);
    }

    if (window.initializeNotaDinasPage) {
      setTimeout(() => {
        window.initializeNotaDinasPage();
      }, 150);
    }
  };

  // =============================
  // FILE UPLOAD HANDLER
  // =============================
  window.handleFileUpload = function (event) {
    console.log("=== FILE UPLOAD STARTED ===");
    const file = event.target.files[0];
    console.log("File object:", file);

    const uploadArea = document.getElementById("uploadArea");
    const uploadContent = document.getElementById("uploadContent");
    const fileInfoDisplay = document.getElementById("fileInfoDisplay");

    if (!file) {
      console.log("No file selected, resetting...");
      if (uploadArea) uploadArea.classList.remove("has-file");
      if (uploadContent) uploadContent.style.display = "flex";
      if (fileInfoDisplay) {
        fileInfoDisplay.style.display = "none";
        fileInfoDisplay.innerHTML = "";
      }
      window.uploadedFile = null;
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];

    if (!allowedTypes.includes(file.type)) {
      alert(
        "❌ Format file tidak didukung!\n\nGunakan: PDF, DOC, DOCX, JPG, atau PNG"
      );
      event.target.value = "";
      return;
    }

    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("❌ Ukuran file terlalu besar!\n\nMaksimal: 50MB");
      event.target.value = "";
      return;
    }

    window.uploadedFile = file;

    let iconClass = "bi-file-earmark-text-fill";
    let iconColor = "#6b7280";

    if (file.type === "application/pdf") {
      iconClass = "bi-file-earmark-pdf-fill";
      iconColor = "#dc2626";
    } else if (file.type.includes("word") || file.type.includes("document")) {
      iconClass = "bi-file-earmark-word-fill";
      iconColor = "#2563eb";
    } else if (file.type.includes("image")) {
      iconClass = "bi-file-earmark-image-fill";
      iconColor = "#10b981";
    }

    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    const safeName = file.name
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

    const fileCardHTML = `
      <div class="file-display-card">
        <div class="file-display-icon" style="background-color: ${iconColor}20;">
          <i class="bi ${iconClass}" style="color: ${iconColor}; font-size: 28px;"></i>
        </div>
        <div class="file-display-info">
          <div class="file-display-label">FILE NASKAH</div>
          <div class="file-display-name" title="${safeName}">${safeName}</div>
          <div class="file-display-size">${fileSizeMB} MB</div>
        </div>
        <button type="button" class="file-remove-btn" onclick="window.removeUploadedFile(event)" title="Hapus file">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>
    `;

    if (uploadContent) {
      uploadContent.style.display = "none";
    }

    if (fileInfoDisplay) {
      fileInfoDisplay.innerHTML = fileCardHTML;
      fileInfoDisplay.style.display = "block";
    }

    if (uploadArea) {
      uploadArea.classList.add("has-file");
    }

    console.log("=== FILE UPLOAD COMPLETED ===");
  };

  window.removeUploadedFile = function (event) {
    event.stopPropagation();
    console.log("=== REMOVING FILE ===");

    const fileInput = document.getElementById("fileInput");
    const uploadArea = document.getElementById("uploadArea");
    const uploadContent = document.getElementById("uploadContent");
    const fileInfoDisplay = document.getElementById("fileInfoDisplay");

    if (fileInput) {
      fileInput.value = "";
    }

    if (fileInfoDisplay) {
      fileInfoDisplay.innerHTML = "";
      fileInfoDisplay.style.display = "none";
    }

    if (uploadContent) {
      uploadContent.style.display = "flex";
    }

    if (uploadArea) {
      uploadArea.classList.remove("has-file");
    }

    window.uploadedFile = null;
    console.log("=== FILE REMOVED ===");
  };

  // =============================
  // START INITIALIZATION
  // =============================
  loadIncludes();
  console.log("✅ Main.js initialization complete");
});
