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
  function loadSwal(callback) {
    if (window.Swal) return callback();
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/sweetalert2@11";
    script.onload = callback;
    document.head.appendChild(script);
  }

  // =============================
  // LOAD SIDEBAR DINAMIS
  // =============================
  fetch("assets/includes/sidebar.html")
    .then((res) => res.text())
    .then((html) => {
      document.getElementById("sidebar-placeholder").innerHTML = html;

      attachSidebarEvents();
      highlightActiveMenu();
      loadSwal(attachLogoutEvent); // pastikan Swal siap sebelum logout dipasang
    });

  // =============================
  // SIDEBAR EVENTS (notif & tutup)
  // =============================
  function attachSidebarEvents() {
    const notifBtn = document.querySelector(".notification");
    const sidebar = document.getElementById("notificationSidebar");
    const closeBtn = document.getElementById("closeSidebarBtn");
    if (!notifBtn || !sidebar || !closeBtn) return;

    notifBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      sidebar.classList.toggle("active");
    });

    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      sidebar.classList.remove("active");
    });

    document.addEventListener("click", (e) => {
      const logoutLink = document.getElementById("logoutLink");
      if (
        !sidebar.contains(e.target) &&
        !notifBtn.contains(e.target) &&
        !(logoutLink && logoutLink.contains(e.target)) &&
        !e.target.closest(".menu-link")
      ) {
        sidebar.classList.remove("active");
      }
    });
  }

  // =============================
  // HIGHLIGHT ACTIVE MENU
  // =============================
  function highlightActiveMenu() {
    const links = document.querySelectorAll(".sidebar-menu .menu-link");
    const currentPage =
      window.location.pathname.split("/").pop() || "index.html";

    links.forEach((link) => {
      // Abaikan logout
      if (link.id === "logoutLink") return;

      const href = link.getAttribute("href");
      if (
        href === currentPage ||
        (href === "#" && currentPage === "index.html")
      ) {
        link.parentElement.classList.add("active");
        const span = link.querySelector("span");
        if (span) span.classList.add("active");
      } else {
        link.parentElement.classList.remove("active");
        const span = link.querySelector("span");
        if (span) span.classList.remove("active");
      }
    });
  }

  // =============================
  // SURAT KELUAR
  // =============================
  // Calendar functionality
        let currentDate = new Date();
        let selectedDate = null;

        const monthNames = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];

        function generateCalendar(year, month) {
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            const daysInMonth = lastDay.getDate();
            const startingDayOfWeek = firstDay.getDay();

            const calendarDays = document.getElementById('calendarDays');
            calendarDays.innerHTML = '';

            // Update header
            document.getElementById('calendarMonth').textContent = `${monthNames[month]} ${year}`;

            // Add empty cells for days before the first day
            for (let i = 0; i < startingDayOfWeek; i++) {
                const emptyDay = document.createElement('button');
                emptyDay.className = 'calendar-day empty';
                calendarDays.appendChild(emptyDay);
            }

            // Add days
            const today = new Date();
            for (let day = 1; day <= daysInMonth; day++) {
                const dayButton = document.createElement('button');
                dayButton.className = 'calendar-day';
                dayButton.textContent = day;

                // Check if today
                if (year === today.getFullYear() && 
                    month === today.getMonth() && 
                    day === today.getDate()) {
                    dayButton.classList.add('today');
                }

                // Check if selected
                if (selectedDate && 
                    selectedDate.getFullYear() === year &&
                    selectedDate.getMonth() === month &&
                    selectedDate.getDate() === day) {
                    dayButton.classList.add('selected');
                }

                dayButton.addEventListener('click', function() {
                    // Remove previous selection
                    document.querySelectorAll('.calendar-day').forEach(d => {
                        d.classList.remove('selected');
                    });
                    
                    // Add selection to clicked day
                    this.classList.add('selected');
                    selectedDate = new Date(year, month, day);
                });

                calendarDays.appendChild(dayButton);
            }
        }

        // Open calendar modal
        document.getElementById('datePickerBtn').addEventListener('click', function() {
            document.getElementById('calendarModal').classList.add('active');
            generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
        });

        // Close modal when clicking outside
        document.getElementById('calendarModal').addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
            }
        });

        // Previous month
        document.getElementById('prevMonth').addEventListener('click', function() {
            currentDate.setMonth(currentDate.getMonth() - 1);
            generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
        });

        // Next month
        document.getElementById('nextMonth').addEventListener('click', function() {
            currentDate.setMonth(currentDate.getMonth() + 1);
            generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
        });

        // Apply date
        document.getElementById('applyDate').addEventListener('click', function() {
            if (selectedDate) {
                const day = String(selectedDate.getDate()).padStart(2, '0');
                const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                const year = selectedDate.getFullYear();
                const formatted = `${day}/${month}/${year}`;
                
                document.getElementById('selectedDateText').textContent = formatted;
                document.getElementById('calendarModal').classList.remove('active');
            } else {
                alert('Silakan pilih tanggal terlebih dahulu!');
            }
        });
  // Search functionality
      const searchInput = document.querySelector('.search-box input');
      searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('.table-surat tbody tr');
        
        rows.forEach(row => {
          const perihal = row.cells[1].textContent.toLowerCase();
          const deskripsi = row.cells[2].textContent.toLowerCase();
          
          if (perihal.includes(searchTerm) || deskripsi.includes(searchTerm)) {
            row.style.display = '';
          } else {
            row.style.display = 'none';
          }
        });
      });

      // Reset filter
      document.querySelector('.btn-reset').addEventListener('click', function() {
        searchInput.value = '';
        document.querySelectorAll('.select-input').forEach(select => {
          select.selectedIndex = 0;
        });
        document.querySelectorAll('.table-surat tbody tr').forEach(row => {
          row.style.display = '';
        });
      });

      // Action buttons
      document.querySelectorAll('.action-icons i').forEach(icon => {
        icon.addEventListener('click', function() {
          const row = this.closest('tr');
          const perihal = row.cells[1].textContent;
          
          if (this.classList.contains('bi-eye')) {
            alert('Melihat: ' + perihal);
          } else if (this.classList.contains('bi-pencil')) {
            alert('Mengedit: ' + perihal);
          } else if (this.classList.contains('bi-trash')) {
            if (confirm('Hapus surat: ' + perihal + '?')) {
              alert('Surat berhasil dihapus');
            }
          }
        });
      });

      // Tambah Baru button
      document.querySelector('.btn-primary').addEventListener('click', function() {
        alert('Form Tambah Surat Baru');
      });

 // =============================
  // NOTA DINAS
  // =============================
// Disposisi Modal
        const disposisiModal = document.getElementById('disposisiModal');
        const disposisiButtons = document.querySelectorAll('.btn-disposisi');
        const closeDisposisiBtn = document.getElementById('closeDisposisi');

        // Open disposisi modal
        disposisiButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const row = this.closest('tr');
                const tanggalTerima = row.cells[1].textContent;
                const noSurat = row.cells[2].textContent;
                const perihal = row.cells[3].textContent;
                const dari = row.cells[4].textContent;
                const kepada = row.cells[5].textContent;

                // Populate modal with data
                document.getElementById('modalTanggalTerima').textContent = tanggalTerima;
                document.getElementById('modalNoSurat').textContent = noSurat;
                document.getElementById('modalPerihal').textContent = perihal;
                document.getElementById('modalDari').textContent = dari;
                document.getElementById('modalKepada').textContent = kepada;

                // Show modal
                disposisiModal.classList.add('active');
                document.body.style.overflow = 'hidden';
            });
        });

        // Close disposisi modal
        closeDisposisiBtn.addEventListener('click', function() {
            disposisiModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        });

        // Close modal when clicking outside
        disposisiModal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        });

        // Kirim disposisi button
        document.querySelector('.btn-kirim').addEventListener('click', function() {
            const selectedOptions = [];
            document.querySelectorAll('.disposisi-checkbox input:checked').forEach(cb => {
                selectedOptions.push(cb.nextElementSibling.textContent);
            });
            
            const keterangan = document.querySelector('.form-textarea').value;
            const kepada = document.querySelector('.form-select').value;
            
            if (selectedOptions.length === 0) {
                alert('Pilih minimal satu tindak lanjut!');
                return;
            }
            
            if (!kepada) {
                alert('Pilih penerima disposisi!');
                return;
            }
            
            console.log('Disposisi:', {
                tindakLanjut: selectedOptions,
                keterangan: keterangan,
                kepada: kepada
            });
            
            alert('Disposisi berhasil dikirim!');
            disposisiModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
  // =============================
  // LOGOUT EVENT
  // =============================
  function attachLogoutEvent() {
    const logoutLink = document.getElementById("logoutLink");
    if (!logoutLink) return;

    logoutLink.addEventListener("click", (e) => {
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
    });
  }
});