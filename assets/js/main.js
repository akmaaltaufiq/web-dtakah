document.addEventListener("DOMContentLoaded", () => {
  const loadingScreen = document.getElementById("loadingScreen");

  // =============================
  // LOADING SCREEN
  // =============================
  window.showLoading = () => loadingScreen?.classList.add("show");
  window.hideLoading = () => loadingScreen?.classList.remove("show");

  // =============================
  // LOAD SWEETALERT2 SECARA DINAMIS
  // =============================
  window.loadSwal = function (callback) {
    if (window.Swal) return callback();
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/sweetalert2@11";
    script.onload = callback;
    document.head.appendChild(script);
  };

  // =============================
  // GLOBAL UTILS (Export ke window)
  // =============================
  window.Utils = {
    formatDate: (dateString) => {
      if (!dateString) return "-";
      const date = new Date(dateString);
      return date.toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
        day: "2-digit",
      });
    },
    formatDateShort: (dateString) => {
      if (!dateString) return "-";
      const date = new Date(dateString);
      return date.toLocaleDateString("id-ID", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    },
    getSifatBadge: (sifat) => {
      if (sifat === "Rahasia" || sifat === "Sangat Rahasia")
        return "badge-rahasia";
      if (sifat === "Penting") return "badge-penting";
      if (sifat === "Konfidensial") return "badge-konfidensial";
      return "badge-umum";
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
  };

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
      <a href="#" class="notif-item ${isReadClass}" data-surat-id="${
      data.suratId
    }" data-type="${data.type}" onclick="handleNotifClick(event)">
        <i class="bi ${icon}"></i>
        <div>
          <div class="notif-title">${data.title}</div>
          <div class="notif-time">${data.time || "Beberapa Waktu Lalu"}</div>
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
    if (unreadCountEl) unreadCountEl.textContent = unreadNotifs.length;

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
    }

    event.preventDefault();
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

    document
      .getElementById("markAllRead")
      ?.addEventListener("click", markAllAsRead);

    document.addEventListener("click", (e) => {
      const notifDropdown = document.getElementById("notificationDropdown");
      const notifBtn = document.getElementById("notificationBtn");

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
  };

  // =============================
  // SIDEBAR & LOGOUT LOGIC
  // =============================
  window.attachSidebarEvents = function () {
    document.querySelectorAll(".menu-dropdown").forEach((dropdown) => {
      dropdown
        .querySelector(".menu-dropdown-toggle")
        .addEventListener("click", (e) => {
          e.preventDefault();
          dropdown.classList.toggle("open");
        });
    });

    const logoutLink = document.getElementById("logoutBtn");
    if (logoutLink) {
      logoutLink.addEventListener("click", (e) => {
        e.preventDefault();
        window.loadSwal(window.attachLogoutEvent);
      });
    }
  };

  window.highlightActiveMenu = function () {
    const links = document.querySelectorAll(".sidebar-menu .menu-item");
    const currentPage =
      window.location.pathname.split("/").pop() || "index.html";

    links.forEach((item) => {
      const link = item.querySelector("a") || item;
      if (!link) return;

      const href = link.getAttribute("href");
      const normalizedHref = href ? href.split("/").pop() : "";

      if (
        normalizedHref === currentPage ||
        (currentPage === "index.html" && normalizedHref === "index.html")
      ) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });
  };

  window.attachLogoutEvent = function () {
    const logoutLink = document.getElementById("logoutBtn");
    if (!logoutLink) return;

    logoutLink.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();

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
          localStorage.clear();
          sessionStorage.clear();
          Swal.fire({
            title: "Logout berhasil",
            text: "Anda akan diarahkan ke halaman login.",
            icon: "success",
            showConfirmButton: false,
            timer: 1500,
          });
          setTimeout(() => (window.location.href = "login.html"), 1600);
        }
      });
    };
  };

  // =============================
  // LOAD INCLUDES DINAMIS
  // =============================
  window.loadIncludes = async function () {
    await fetch("assets/includes/sidebar.html")
      .then((res) => res.text())
      .then((html) => {
        const sidebarPlaceholder = document.getElementById(
          "sidebar-placeholder"
        );
        if (sidebarPlaceholder) {
          sidebarPlaceholder.innerHTML = html;
          window.attachSidebarEvents();
          window.highlightActiveMenu();
        }
      });

    const isDashboard =
      window.location.pathname.endsWith("index.html") ||
      window.location.pathname.endsWith("dashboard") ||
      window.location.pathname.endsWith("/");

    if (!isDashboard) {
      await fetch("assets/includes/header.html")
        .then((res) => res.text())
        .then((html) => {
          const headerPlaceholder =
            document.getElementById("header-placeholder");
          if (headerPlaceholder) {
            headerPlaceholder.innerHTML = html;
            attachHeaderEvents();
          }
        });

      await fetch("assets/includes/footer.html")
        .then((res) => res.text())
        .then((html) => {
          const footerPlaceholder =
            document.getElementById("footer-placeholder");
          if (footerPlaceholder) {
            footerPlaceholder.innerHTML = html;
          }
        });
    }

    // Trigger page-specific initialization
    if (window.initializePage) {
      window.initializePage();
    }
  };

  // =============================
  // FILE UPLOAD HANDLER (Global)
  // =============================
  window.handleFileUpload = function (e) {
    const file = e.target.files[0];
    if (!file) {
      // Hapus tampilan jika file dibatalkan
      const uploadArea = e.target.closest(".upload-area");
      if (uploadArea) uploadArea.classList.remove("has-file");
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
        "Format file tidak didukung. Gunakan PDF, DOC, DOCX, JPEG, JPG, atau PNG"
      );
      e.target.value = "";
      const uploadArea = e.target.closest(".upload-area");
      if (uploadArea) uploadArea.classList.remove("has-file");
      window.uploadedFile = null;
      return;
    }

    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("Ukuran file maksimal 50MB");
      e.target.value = "";
      const uploadArea = e.target.closest(".upload-area");
      if (uploadArea) uploadArea.classList.remove("has-file");
      window.uploadedFile = null;
      return;
    }

    // Menyimpan file secara global
    window.uploadedFile = file;

    const uploadArea = e.target.closest(".upload-area");
    const fileInfoDisplay = uploadArea.querySelector("#fileInfoDisplay");
    const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
    const iconClass = file.type.includes("image")
      ? "bi-image-fill"
      : "bi-file-earmark-text-fill";

    uploadArea.classList.add("has-file");
    fileInfoDisplay.innerHTML = `
    <div class="file-info">
      <i class="bi ${iconClass}"></i>
      <div>
        <div class="file-name">${file.name}</div>
        <div class="preview-label">${fileSizeMB} MB</div>
      </div>
    </div>
  `;
    console.log("File uploaded:", file.name);
  };

  // Start loading includes
  loadIncludes();
});
