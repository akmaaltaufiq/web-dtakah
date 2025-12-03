// ========================================
// LOGIN PAGE FUNCTIONS
// Tambahkan ke main.js yang sudah ada
// ========================================

// Valid credentials (sesuaikan dengan kebutuhan)
const validCredentials = {
  username: "magang",
  password: "123",
};

// ========================================
// INITIALIZE LOGIN PAGE
// ========================================
function initializeLoginPage() {
  console.log("🔐 Initializing login page...");

  // Check if we're on login page
  const loginForm = document.getElementById("loginForm");
  if (!loginForm) {
    console.log("ℹ️ Not on login page");
    return;
  }

  // Setup toggle password
  setupPasswordToggle();

  // Setup form submission
  setupLoginFormSubmit();

  // Setup keyboard shortcuts
  setupLoginKeyboardShortcuts();

  // Check auto-login
  checkAutoLogin();

  console.log("✅ Login page initialized");
}

// ========================================
// PASSWORD TOGGLE
// ========================================
function setupPasswordToggle() {
  const togglePassword = document.getElementById("togglePassword");
  const passwordInput = document.getElementById("password");

  if (!togglePassword || !passwordInput) return;

  togglePassword.addEventListener("click", function () {
    const type = passwordInput.type === "password" ? "text" : "password";
    passwordInput.type = type;

    const icon = this.querySelector("i");
    icon.classList.toggle("bi-eye-slash");
    icon.classList.toggle("bi-eye");
  });

  console.log("✅ Password toggle setup complete");
}

// ========================================
// LOGIN FORM SUBMISSION
// ========================================
function setupLoginFormSubmit() {
  const loginForm = document.getElementById("loginForm");
  if (!loginForm) return;

  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    handleLogin();
  });

  console.log("✅ Login form submission setup complete");
}

// ========================================
// HANDLE LOGIN
// ========================================
function handleLogin() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const remember = document.getElementById("remember").checked;

  // Validation
  if (!username || !password) {
    alert("Silakan isi username dan password");
    return;
  }

  // Show loading
  if (window.showLoading) {
    window.showLoading();
  }

  // Simulate server request
  setTimeout(() => {
    if (
      username === validCredentials.username &&
      password === validCredentials.password
    ) {
      // Login successful
      console.log("✅ Login successful:", {
        username,
        remember,
        timestamp: new Date().toISOString(),
      });

      const userData = {
        username,
        loginTime: new Date().toISOString(),
      };

      // Store login data
      const storage = remember ? localStorage : sessionStorage;
      storage.setItem("isLoggedIn", "true");
      storage.setItem("userData", JSON.stringify(userData));

      // Redirect to dashboard
      window.location.href = "index.html";
    } else {
      // Login failed
      if (window.hideLoading) {
        window.hideLoading();
      }

      alert(
        "Username atau password salah!\n\nGunakan:\nUsername: magang\nPassword: 123"
      );

      // Clear password and focus
      document.getElementById("password").value = "";
      document.getElementById("password").focus();
    }
  }, 1500); // 1.5 second delay for UX
}

// ========================================
// KEYBOARD SHORTCUTS
// ========================================
function setupLoginKeyboardShortcuts() {
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");

  if (!usernameInput || !passwordInput) return;

  // Username: Enter to move to password
  usernameInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      passwordInput.focus();
    }
  });

  // Password: Enter to submit
  passwordInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleLogin();
    }
  });

  console.log("✅ Keyboard shortcuts setup complete");
}

// ========================================
// CHECK AUTO LOGIN
// ========================================
function checkAutoLogin() {
  const isLoggedIn =
    localStorage.getItem("isLoggedIn") || sessionStorage.getItem("isLoggedIn");

  if (isLoggedIn === "true") {
    console.log("🔄 User already logged in, redirecting...");

    if (window.showLoading) {
      window.showLoading();
    }

    setTimeout(() => {
      window.location.href = "index.html";
    }, 500);
  }
}

// ========================================
// LOGOUT FUNCTION
// ========================================
function handleLogout() {
  console.log("🚪 Logging out...");

  // Clear all storage
  localStorage.clear();
  sessionStorage.clear();

  // Show notification if available
  if (window.Notification && window.Notification.success) {
    window.Notification.success("Logout berhasil!");
  }

  // Redirect to login
  setTimeout(() => {
    window.location.href = "login.html";
  }, 500);
}

// ========================================
// CHECK LOGIN STATUS (untuk halaman lain)
// ========================================
function checkLoginStatus() {
  const isLoggedIn =
    localStorage.getItem("isLoggedIn") || sessionStorage.getItem("isLoggedIn");

  if (isLoggedIn !== "true") {
    console.log("⚠️ User not logged in, redirecting to login...");
    window.location.href = "login.html";
    return false;
  }

  return true;
}

// ========================================
// GET USER DATA
// ========================================
function getUserData() {
  const userDataStr =
    localStorage.getItem("userData") || sessionStorage.getItem("userData");

  if (!userDataStr) return null;

  try {
    return JSON.parse(userDataStr);
  } catch (error) {
    console.error("❌ Error parsing user data:", error);
    return null;
  }
}

// ========================================
// INITIALIZE ON DOM LOADED
// ========================================
document.addEventListener("DOMContentLoaded", function () {
  // Check if we're on login page
  if (document.getElementById("loginForm")) {
    initializeLoginPage();
  }

  // For other pages, check login status (optional, uncomment if needed)
  // else {
  //   checkLoginStatus();
  // }
});

// ========================================
// EXPOSE FUNCTIONS GLOBALLY
// ========================================
window.handleLogin = handleLogin;
window.handleLogout = handleLogout;
window.checkLoginStatus = checkLoginStatus;
window.getUserData = getUserData;

// ========================================
// MAIN.JS - GLOBAL FUNCTIONS & UTILITIES
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
        "Umum": "badge-umum",
        "Penting": "badge-penting",
        "Rahasia": "badge-rahasia",
        "Sangat Rahasia": "badge-sangat-rahasia",
        "Konfidensial": "badge-konfidensial",
      };
      return badges[sifat] || "badge-umum";
    },

    getStatusBadge: (status) => {
      return status ? status.toLowerCase() : "pending";
    },

    getStatusClass: (status) => {
      const statusMap = {
        "Selesai": "selesai",
        "Proses": "proses",
        "Ditolak": "ditolak",
        "Ditunda": "ditunda",
        "Terkirim": "selesai",
        "Pending": "ditunda",
      };
      return statusMap[status] || "ditunda";
    },

    getMonthName: (monthIndex) => {
      const months = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember",
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
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      };
      return String(text).replace(/[&<>"']/g, (m) => map[m]);
    }
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
  // HEADER & NOTIFICATION LOGIC
  // =============================
  window.createNotifItem = (data) => {
    const icon = data.type === "masuk" 
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
          <div class="notif-time">${Utils.escapeHtml(data.time || "Beberapa Waktu Lalu")}</div>
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
      countBadge.textContent = unreadNotifs.length > 99 
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
      list.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">Tidak ada notifikasi.</p>';
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
    const notifBtn = document.getElementById("notificationBtn");
    if (notifBtn) {
      notifBtn.addEventListener("click", toggleNotificationDropdown);
    }

    const userProfileBtn = document.getElementById("userProfileBtn");
    if (userProfileBtn) {
      userProfileBtn.addEventListener("click", () => {
        window.location.href = "pengaturan.html";
      });
    }

    const langSelector = document.getElementById("languageSelector");
    const langDropdown = document.getElementById("languageDropdown");

    if (langSelector) {
      langSelector.addEventListener("click", (e) => {
        e.stopPropagation();
        if (langDropdown) langDropdown.classList.toggle("active");
      });
    }

    document.getElementById("markAllRead")?.addEventListener("click", markAllAsRead);

    // Close dropdowns on outside click
    document.addEventListener("click", (e) => {
      const notifDropdown = document.getElementById("notificationDropdown");
      const notifBtn = document.getElementById("notificationBtn");

      if (notifDropdown && 
          !notifDropdown.contains(e.target) && 
          notifBtn && 
          !notifBtn.contains(e.target)) {
        notifDropdown.classList.remove("active");
      }

      if (langDropdown && 
          !langDropdown.contains(e.target) && 
          langSelector && 
          !langSelector.contains(e.target)) {
        langDropdown.classList.remove("active");
      }
    });

    loadNotifications();
  };

  // =============================
  // SIDEBAR & MENU HIGHLIGHTING
  // =============================
  window.highlightActiveMenu = function () {
    console.log("🎯 Highlighting active menu...");

    let currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    if (currentPage === '' || currentPage === '/') {
      currentPage = 'index.html';
    }

    console.log("📄 Current page:", currentPage);

    // Clear all active classes
    document.querySelectorAll('.menu-item').forEach(item => {
      item.classList.remove('active');
    });
    document.querySelectorAll('.submenu-item').forEach(item => {
      item.classList.remove('active');
    });
    document.querySelectorAll('.menu-dropdown').forEach(dropdown => {
      dropdown.classList.remove('active');
    });

    let isSubmenuActive = false;

    // Check submenu first
    const submenuLinks = document.querySelectorAll('.submenu-link');
    submenuLinks.forEach(link => {
      const href = link.getAttribute('href');
      
      if (href === currentPage) {
        console.log("✅ Found active submenu:", href);
        
        const submenuItem = link.closest('.submenu-item');
        if (submenuItem) {
          submenuItem.classList.add('active');
        }
        
        const parentDropdown = link.closest('.menu-dropdown');
        if (parentDropdown) {
          parentDropdown.classList.add('active', 'open');
          isSubmenuActive = true;
        }
      }
    });

    // If not submenu, check main menu
    if (!isSubmenuActive) {
      const menuLinks = document.querySelectorAll('.menu-item:not(.menu-dropdown) > .menu-link');
      
      menuLinks.forEach(link => {
        const href = link.getAttribute('href');
        
        if (href === currentPage || 
            (currentPage === 'index.html' && href === 'index.html') ||
            (currentPage === '' && href === 'index.html')) {
          
          console.log("✅ Found active menu:", href);
          
          const menuItem = link.closest('.menu-item');
          if (menuItem) {
            menuItem.classList.add('active');
          }
        }
      });
    }

    console.log("✅ Active menu highlighting complete");
  };

  window.attachSidebarEvents = function () {
    console.log("🔧 Attaching sidebar events...");

    // Dropdown toggle
    const dropdownToggles = document.querySelectorAll('.menu-dropdown-toggle');
    
    dropdownToggles.forEach(toggle => {
      toggle.addEventListener('click', function(e) {
        e.preventDefault();
        const menuItem = this.closest('.menu-dropdown');
        
        // Close other dropdowns
        document.querySelectorAll('.menu-dropdown').forEach(item => {
          if (item !== menuItem && !item.classList.contains('active')) {
            item.classList.remove('open');
          }
        });
        
        // Toggle current dropdown
        menuItem.classList.toggle('open');
      });
    });

    // Logout handler
    let logoutLink = document.getElementById("logoutLink") || 
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
          window.showLogoutDialog();
        });
      });
    } else {
      console.warn("⚠️ Logout button NOT found");
    }
  };

  window.showLogoutDialog = function () {
    console.log("🔓 Showing logout dialog...");

    if (!window.Swal) {
      console.error("❌ SweetAlert2 not loaded!");
      if (confirm("Yakin ingin logout?")) {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = "login.html";
      }
      return;
    }

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
        localStorage.clear();
        sessionStorage.clear();

        Swal.fire({
          title: "Logout berhasil",
          text: "Anda akan diarahkan ke halaman login.",
          icon: "success",
          showConfirmButton: false,
          timer: 1500,
        });

        setTimeout(() => {
          window.location.href = "login.html";
        }, 1600);
      }
    });
  };

  // =============================
  // LOAD INCLUDES
  // =============================
  window.loadIncludes = async function () {
    console.log("🔄 Loading includes...");

    // Load sidebar
    try {
      const sidebarResponse = await fetch("assets/includes/sidebar.html");
      const sidebarHtml = await sidebarResponse.text();
      const sidebarPlaceholder = document.getElementById("sidebar-placeholder");
      
      if (sidebarPlaceholder) {
        sidebarPlaceholder.innerHTML = sidebarHtml;
        console.log("✅ Sidebar loaded");

        setTimeout(() => {
          window.attachSidebarEvents();
          window.highlightActiveMenu();
        }, 100);
      }
    } catch (err) {
      console.error("❌ Error loading sidebar:", err);
    }

    const isDashboard = window.location.pathname.endsWith("index.html") ||
                        window.location.pathname.endsWith("dashboard") ||
                        window.location.pathname.endsWith("/");

    if (!isDashboard) {
      // Load header
      try {
        const headerResponse = await fetch("assets/includes/header.html");
        const headerHtml = await headerResponse.text();
        const headerPlaceholder = document.getElementById("header-placeholder");
        
        if (headerPlaceholder) {
          headerPlaceholder.innerHTML = headerHtml;
          attachHeaderEvents();
          console.log("✅ Header loaded");
        }
      } catch (err) {
        console.error("❌ Error loading header:", err);
      }

      // Load footer
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
  window.handleFileUpload = function (e) {
    const file = e.target.files[0];
    const uploadArea = document.querySelector(".form-upload-area");
    const fileInfoDisplay = document.getElementById("fileInfoDisplay");

    if (!file) {
      if (uploadArea) uploadArea.classList.remove("has-file");
      if (fileInfoDisplay) fileInfoDisplay.innerHTML = "";
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
      Notification.error("Format file tidak didukung. Gunakan PDF, DOC, DOCX, JPEG, JPG, atau PNG");
      e.target.value = "";
      if (uploadArea) uploadArea.classList.remove("has-file");
      if (fileInfoDisplay) fileInfoDisplay.innerHTML = "";
      window.uploadedFile = null;
      return;
    }

    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      Notification.error("Ukuran file maksimal 50MB");
      e.target.value = "";
      if (uploadArea) uploadArea.classList.remove("has-file");
      if (fileInfoDisplay) fileInfoDisplay.innerHTML = "";
      window.uploadedFile = null;
      return;
    }

    window.uploadedFile = file;

    // Icon based on file type
    let iconClass = "bi-file-earmark-text-fill";
    if (file.type === "application/pdf") {
      iconClass = "bi-file-earmark-pdf-fill";
    } else if (file.type.includes("word") || file.type.includes("document")) {
      iconClass = "bi-file-earmark-word-fill";
    } else if (file.type.includes("image")) {
      iconClass = "bi-file-earmark-image-fill";
    }

    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);

    if (uploadArea) uploadArea.classList.add("has-file");
    if (fileInfoDisplay) {
      fileInfoDisplay.innerHTML = `
        <div class="file-display-card">
          <div class="file-display-icon">
            <i class="bi ${iconClass}"></i>
          </div>
          <div class="file-display-info">
            <div class="file-display-label">File Naskah</div>
            <div class="file-display-name">${Utils.escapeHtml(file.name)}</div>
            <div class="file-display-size">${fileSizeMB} MB</div>
          </div>
          <button type="button" class="file-remove-btn" onclick="removeUploadedFile(event)" title="Hapus file">
            <i class="bi bi-x"></i>
          </button>
        </div>
      `;
    }
    
    console.log("✅ File uploaded:", file.name);
  };

  window.removeUploadedFile = function(e) {
    e.stopPropagation();
    
    const fileInput = document.getElementById("fileInput");
    if (fileInput) fileInput.value = "";
    
    const uploadArea = document.querySelector(".form-upload-area");
    const fileInfoDisplay = document.getElementById("fileInfoDisplay");
    
    if (uploadArea) uploadArea.classList.remove("has-file");
    if (fileInfoDisplay) fileInfoDisplay.innerHTML = "";
    
    window.uploadedFile = null;
    
    console.log("🗑️ File removed");
  };

  // =============================
  // START INITIALIZATION
  // =============================
  loadIncludes();

  console.log("✅ Main.js initialization complete");
});