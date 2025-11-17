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
  // SURAT MASUK
  // =============================
    // Data surat untuk preview
      const suratData = [
        {
          no: 1,
          tanggal: '04 Agustus 2025',
          tanggalSurat: '01/08/2025',
          noSurat: '001/2025',
          perihal: 'Pengajuan Magang Mahasiswa Prodi Sistem Informasi',
          dari: 'UPN Veteran Jakarta',
          kepada: 'Kepala Bidang Banglola Sisfohan',
          file: 'Pengajuan_MagangMahasiswa_UPNVJ.pdf'
        },
        {
          no: 2,
          tanggal: '10 Agustus 2025',
          tanggalSurat: '08/08/2025',
          noSurat: '002/2025',
          perihal: 'Pengajuan Magang Mahasiswa Prodi Informatika',
          dari: 'Universitas Pertahanan',
          kepada: 'Kepala Bidang Infra TIK',
          file: 'Pengajuan_MagangMahasiswa_UNHAN.pdf'
        },
        {
          no: 3,
          tanggal: '04 Agustus 2025',
          tanggalSurat: '02/08/2025',
          noSurat: '007/2025',
          perihal: 'Undangan Seminar Nasional',
          dari: 'UPN Veteran Jakarta',
          kepada: 'Kasubbag TU',
          file: 'Undangan_Seminar_Nasional.pdf'
        },
        {
          no: 4,
          tanggal: '10 Agustus 2025',
          tanggalSurat: '07/08/2025',
          noSurat: '008/2025',
          perihal: 'Permintaan Data Penelitian',
          dari: 'Universitas Pertahanan',
          kepada: 'Kabid MSI',
          file: 'Permintaan_Data_Penelitian.pdf'
        },
        {
          no: 5,
          tanggal: '25 Agustus 2025',
          tanggalSurat: '23/08/2025',
          noSurat: '009/2025',
          perihal: 'Permohonan Izin Kegiatan',
          dari: 'Institut Teknologi Bandung',
          kepada: 'Kepala Bidang Banglola Sisfohan',
          file: 'Permohonan_Izin_Kegiatan.pdf'
        },
        {
          no: 6,
          tanggal: '30 Agustus 2025',
          tanggalSurat: '28/08/2025',
          noSurat: '010/2025',
          perihal: 'Laporan Kegiatan Bulan Agustus',
          dari: 'Kasubbag TU',
          kepada: 'Kepala Pusat',
          file: 'Laporan_Kegiatan_Agustus.pdf'
        }
      ];

      // Fungsi untuk menampilkan preview
      function lihatSurat(btn) {
        const row = btn.closest('tr');
        const rowIndex = Array.from(row.parentNode.children).indexOf(row);
        const surat = suratData[rowIndex];

        // Update data preview
        document.getElementById('previewDocTitle').textContent = surat.perihal;
        document.getElementById('infoNomorSurat').textContent = surat.noSurat;
        document.getElementById('infoAsalSurat').textContent = surat.dari;
        document.getElementById('infoTanggalSurat').textContent = surat.tanggalSurat;
        document.getElementById('infoTanggalDiterima').textContent = surat.tanggal;
        document.getElementById('infoKepada').textContent = surat.kepada;
        document.getElementById('infoPerihal').textContent = surat.perihal;
        document.getElementById('infoFileName').textContent = surat.file;

        // Hide list view, show detail view
        document.getElementById('listViewContainer').classList.add('hidden');
        document.getElementById('detailViewContainer').classList.add('active');
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

      // Fungsi untuk menutup preview dan kembali ke list
      function closePreview() {
        document.getElementById('detailViewContainer').classList.remove('active');
        document.getElementById('listViewContainer').classList.remove('hidden');
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

      // Fungsi placeholder lainnya
      function tambahSurat() {
        alert('Fungsi Tambah Surat akan ditambahkan');
      }

      function disposisiSurat(btn) {
        alert('Fungsi Disposisi akan ditambahkan');
      }

      function hapusSurat(btn) {
        if (confirm('Apakah Anda yakin ingin menghapus surat ini?')) {
          const row = btn.closest('tr');
          row.remove();
        }
      }

      function downloadFile() {
        alert('File akan didownload');
      }

      function printFile() {
        alert('File akan diprint');
      }

      function deleteFile() {
        if (confirm('Apakah Anda yakin ingin menghapus file ini?')) {
          closePreview();
        }
      }

      function previousPage() {
        console.log('Previous page');
      }

      function nextPage() {
        console.log('Next page');
      }

      // Search functionality
      document.getElementById('tableSearch').addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('#tableBody tr');
        
        rows.forEach(row => {
          const text = row.textContent.toLowerCase();
          row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
      });
      
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
     // Fungsi untuk menampilkan halaman disposisi
function showDisposisi(button) {
    console.log('Tombol Disposisi diklik!');
    
    // Ambil data dari baris tabel
    const row = button.closest('tr');
    const cells = row.cells;
    
    const tanggal = cells[1].textContent.trim();
    const noSurat = cells[2].textContent.trim();
    const perihal = cells[3].textContent.trim();
    const dari = cells[4].textContent.trim();
    const kepada = cells[5].textContent.trim();
    
    console.log('Data:', {tanggal, noSurat, perihal, dari, kepada});
    
    // Isi data ke halaman disposisi
    document.getElementById('detailTanggal').textContent = tanggal;
    document.getElementById('detailNoSurat').textContent = noSurat;
    document.getElementById('detailPerihal').textContent = perihal;
    document.getElementById('detailDari').textContent = dari;
    document.getElementById('detailKepada').textContent = kepada;
    document.getElementById('previewTitle').textContent = perihal;
    
    // Toggle View
    const tableView = document.getElementById('tableView');
    const disposisiView = document.getElementById('disposisiView');
    
    console.log('Ganti tampilan...');
    
    // Sembunyikan tabel, tampilkan disposisi
    tableView.classList.add('hidden');
    disposisiView.classList.add('active');
    
    console.log('Disposisi view aktif!');
    console.log('Table classes:', tableView.className);
    console.log('Disposisi classes:', disposisiView.className);
    
    // Scroll ke atas
    window.scrollTo({top: 0, behavior: 'smooth'});
}

// Fungsi kembali ke tabel
function backToTable() {
    console.log('Tombol Back diklik!');
    
    const tableView = document.getElementById('tableView');
    const disposisiView = document.getElementById('disposisiView');
    
    // Tampilkan tabel, sembunyikan disposisi
    disposisiView.classList.remove('active');
    tableView.classList.remove('hidden');
    
    console.log('Table view aktif!');
    
    // Scroll ke atas
    window.scrollTo({top: 0, behavior: 'smooth'});
}

// Fungsi kirim disposisi
function kirimDisposisi() {
    console.log('📤 Kirim disposisi');
    
    // Ambil checkbox yang dicentang
    const selectedOptions = [];
    document.querySelectorAll('.disposisi-checkbox input:checked').forEach(cb => {
        selectedOptions.push(cb.nextElementSibling.textContent);
    });
    
    const keterangan = document.getElementById('keteranganDisposisi').value;
    const kepada = document.getElementById('kepadaDisposisi').value;
    
    // Validasi
    if (selectedOptions.length === 0) {
        alert('Pilih minimal satu tindak lanjut!');
        return;
    }
    
    if (!kepada) {
        alert('Pilih penerima disposisi!');
        return;
    }
    
    console.log('Data disposisi:', {selectedOptions, keterangan, kepada});
    
    alert('Disposisi berhasil dikirim!');
    
    // Reset form
    document.querySelectorAll('.disposisi-checkbox input').forEach(cb => cb.checked = false);
    document.getElementById('keteranganDisposisi').value = '';
    document.getElementById('kepadaDisposisi').value = '';
    
    // Kembali ke table
    backToTable();
}

// Debug: Cek saat halaman load
window.addEventListener('DOMContentLoaded', function() {
    console.log('Halaman loaded!');
    console.log('tableView:', document.getElementById('tableView'));
    console.log('disposisiView:', document.getElementById('disposisiView'));
    console.log('Jumlah tombol disposisi:', document.querySelectorAll('.btn-disposisi').length);
});

  // =============================
  //  MONITORING SURAT
  // =============================
     // Tab switching
      const tabBtns = document.querySelectorAll('.tab-btn');
      tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
          tabBtns.forEach(b => b.classList.remove('active'));
          this.classList.add('active');
          
          const tab = this.getAttribute('data-tab');
          console.log('Switched to tab:', tab);
          // Here you can load different data based on tab
        });
      });

      // Reset filter
      document.getElementById('resetBtn').addEventListener('click', function() {
        document.getElementById('dateFilter').selectedIndex = 0;
        document.getElementById('sifatFilter').selectedIndex = 0;
        document.getElementById('searchPerihal').value = '';
        
        // Show all rows
        const rows = document.querySelectorAll('#tableBody tr');
        rows.forEach(row => row.style.display = '');
      });

      // Search filter
      document.getElementById('searchPerihal').addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('#tableBody tr');
        
        rows.forEach(row => {
          const perihal = row.cells[4].textContent.toLowerCase();
          if (perihal.includes(searchTerm)) {
            row.style.display = '';
          } else {
            row.style.display = 'none';
          }
        });
      });

      // Date filter change
      document.getElementById('dateFilter').addEventListener('change', function() {
        console.log('Date filter changed:', this.value);
        // Implement date filtering logic here
      });

      // Sifat filter change
      document.getElementById('sifatFilter').addEventListener('change', function() {
        console.log('Sifat filter changed:', this.value);
        // Implement sifat filtering logic here
      });

      // Delete confirmation
      document.querySelectorAll('.action-icon.delete').forEach(btn => {
        btn.addEventListener('click', function() {
          if (confirm('Apakah Anda yakin ingin menghapus data monitoring ini?')) {
            this.closest('tr').style.display = 'none';
          }
        });
      });

      // View action
      document.querySelectorAll('.action-icon.view').forEach(btn => {
        btn.addEventListener('click', function() {
          alert('Fitur detail monitoring akan segera ditambahkan');
        });
      });

  // =============================
  //  AGENDA SURAT MASUK
  // =============================
       // Delete confirmation
      document.querySelectorAll('.action-icon.delete').forEach(btn => {
        btn.addEventListener('click', function() {
          if (confirm('Apakah Anda yakin ingin menghapus agenda ini?')) {
            this.closest('tr').style.display = 'none';
          }
        });
      });

      // View action
      document.querySelectorAll('.action-icon.view').forEach(btn => {
        btn.addEventListener('click', function() {
          alert('Fitur detail agenda akan segera ditambahkan');
        });
      });

      // Edit action
      document.querySelectorAll('.action-icon.edit').forEach(btn => {
        btn.addEventListener('click', function() {
          alert('Fitur edit agenda akan segera ditambahkan');
        });
      });

      // Search button
      document.querySelector('.btn-search').addEventListener('click', function() {
        const searchValue = document.getElementById('searchSurat').value;
        if (searchValue) {
          alert('Mencari: ' + searchValue);
        }
      });

      // Print button
      document.querySelector('.btn-print').addEventListener('click', function() {
        window.print();
      });

      // Date inputs (placeholder for datepicker integration)
      document.getElementById('startDate').addEventListener('click', function() {
        this.type = 'date';
      });

      document.getElementById('endDate').addEventListener('click', function() {
        this.type = 'date';
      });

  // =============================
  // FAVORIT
  // =============================
      // View button click
      document.querySelectorAll('.action-btn.view').forEach(btn => {
        btn.addEventListener('click', function() {
          const card = this.closest('.favorit-card');
          const fromName = card.querySelector('.from-name').textContent;
          const perihal = card.querySelector('.perihal-text').textContent;
          alert(`Detail Surat:\n\nDari: ${fromName}\nPerihal: ${perihal}`);
        });
      });

      // Delete button click
      document.querySelectorAll('.action-btn.delete').forEach(btn => {
        btn.addEventListener('click', function() {
          const card = this.closest('.favorit-card');
          const fromName = card.querySelector('.from-name').textContent;
          
          if (confirm(`Apakah Anda yakin ingin menghapus surat dari "${fromName}" dari favorit?`)) {
            card.style.opacity = '0';
            card.style.transform = 'translateX(-100%)';
            setTimeout(() => {
              card.remove();
            }, 300);
          }
        });
      });

      // Star icon click to unfavorite
      document.querySelectorAll('.star-icon').forEach(icon => {
        icon.addEventListener('click', function() {
          const card = this.closest('.favorit-card');
          
          if (confirm('Hapus dari favorit?')) {
            card.style.opacity = '0';
            card.style.transform = 'scale(0.8)';
            setTimeout(() => {
              card.remove();
            }, 300);
          }
        });
      });

  // =============================
  // DAFTAR-TAKAH
  // =============================
    // Year filter
      document.getElementById('yearFilter').addEventListener('change', function() {
        const selectedYear = this.value;
        const cards = document.querySelectorAll('.takah-card');
        
        cards.forEach(card => {
          if (!selectedYear || card.getAttribute('data-year') === selectedYear) {
            card.style.display = '';
          } else {
            card.style.display = 'none';
          }
        });
      });

      // Search functionality
      function performSearch() {
        const searchTerm = searchInput.value.toLowerCase();
        const cards = document.querySelectorAll('.takah-card');
        
        cards.forEach(card => {
          const title = card.querySelector('.card-title').textContent.toLowerCase();
          const description = card.querySelector('.card-description').textContent.toLowerCase();
          
          if (title.includes(searchTerm) || description.includes(searchTerm)) {
            card.style.display = '';
          } else {
            card.style.display = 'none';
          }
        });
      }

      // Print functionality
      document.querySelector('.btn-print').addEventListener('click', function() {
        window.print();
      });

      // Card click to view details
      document.querySelectorAll('.takah-card').forEach(card => {
        card.addEventListener('click', function() {
          const number = this.querySelector('.card-number').textContent;
          const title = this.querySelector('.card-title').textContent;
          const description = this.querySelector('.card-description').textContent;
          
          alert(`Detail Takah:\n\nNomor: ${number}\nJudul: ${title}\nDeskripsi: ${description}`);
        });
      });

  // =============================
  // KONTAK EVENT
  // =============================
    // Select contact
        function selectContact(element, name, status) {
            // Remove active from all
            document.querySelectorAll('.contact-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // Add active to clicked
            element.classList.add('active');
            
            // Update chat header
            document.getElementById('chatUserName').textContent = name;
            document.getElementById('chatUserStatus').textContent = status;
            
            // Scroll to bottom
            const chatMessages = document.getElementById('chatMessages');
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        // Send message
        function sendMessage() {
            const input = document.getElementById('messageInput');
            const message = input.value.trim();
            
            if (message) {
                const chatMessages = document.getElementById('chatMessages');
                const messageGroup = chatMessages.querySelector('.message-group');
                
                const newMessage = document.createElement('div');
                newMessage.className = 'message sent';
                newMessage.innerHTML = `
                    <div class="message-content">
                        <div class="message-bubble">${message}</div>
                        <div class="message-time">
                            ${new Date().toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'})}
                            <i class="bi bi-check-all"></i>
                        </div>
                    </div>
                `;
                
                messageGroup.appendChild(newMessage);
                input.value = '';
                
                // Scroll to bottom
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        }

        // Send on Enter key
        document.getElementById('messageInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });

        // Search contacts
        document.getElementById('contactSearch').addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const contacts = document.querySelectorAll('.contact-item');
            
            contacts.forEach(contact => {
                const name = contact.querySelector('.contact-name').textContent.toLowerCase();
                const preview = contact.querySelector('.contact-preview').textContent.toLowerCase();
                
                if (name.includes(searchTerm) || preview.includes(searchTerm)) {
                    contact.style.display = 'flex';
                } else {
                    contact.style.display = 'none';
                }
            });
        });
  // =============================
  // PENGATURAN
  // =============================
    function enableEdit() {
            const inputs = document.querySelectorAll('.form-input');
            const button = document.querySelector('.edit-button');
            
            if (button.textContent === 'Edit Akun') {
                inputs.forEach(input => {
                    input.disabled = false;
                    input.style.background = 'white';
                });
                button.textContent = 'Simpan Perubahan';
                button.style.background = '#28a745';
            } else {
                inputs.forEach(input => {
                    input.disabled = true;
                    input.style.background = '#f8f9fa';
                });
                button.textContent = 'Edit Akun';
                button.style.background = '#8b0000';
                alert('Perubahan berhasil disimpan!');
            }
        }

        // Handle photo upload
        document.getElementById('photoInput').addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const photoCircle = document.querySelector('.photo-circle');
                    photoCircle.innerHTML = `<img src="${event.target.result}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
                };
                reader.readAsDataURL(file);
            }
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