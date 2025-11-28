// =============================
// SURAT KELUAR - PAGE SPECIFIC
// =============================
(function () {
  "use strict";

  // Local variables
  let currentStep = 1;
  let currentPageKeluar = 1;
  const itemsPerPageKeluar = 7;
  let currentSuratKeluarId = null;
  let currentDate = new Date();
  let selectedDate = null;

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

  // =============================
  // INITIALIZATION
  // =============================
  window.initializePage = function () {
    console.log("Surat Keluar Page Initialized");
    renderTableKeluar();
    initializeCalendarEvents();
    initializeSifatFilter();
    attachGlobalKeluarEvents();
  };

  // =============================
  // DATA & RENDERING
  // =============================
  function getSuratKeluarData() {
    let data = KemhanDatabase.getSuratKeluar(false);

    const dummyData = [
      {
        id: 101,
        perihal: "Surat Pemberitahuan Kegiatan Minggu Bela Negara",
        deskripsi: "Memberikan pemberitahuan kegiatan bulanan",
        sifatSurat: "Umum",
        noNaskah: "63",
        status: "Selesai",
        type: "keluar",
      },
      {
        id: 102,
        perihal: "Pemberitahuan Cuti Bersama",
        deskripsi: "Memberikan pemberitahuan cuti bersama Natal & Tahun Baru",
        sifatSurat: "Umum",
        noNaskah: "13",
        status: "Proses",
        type: "keluar",
      },
      {
        id: 103,
        perihal: "Pemberitahuan Pemberian Anggaran",
        deskripsi:
          "Menyampaikan informasi realisasi penggunaan anggaran untuk transparansi.",
        sifatSurat: "Umum",
        noNaskah: "635",
        status: "Ditolak",
        type: "keluar",
      },
      {
        id: 104,
        perihal: "Pemberitahuan Perubahan Kebijakan",
        deskripsi:
          "Menginformasikan perubahan aturan, prosedur, atau kebijakan yang berlaku.",
        sifatSurat: "Umum",
        noNaskah: "67",
        status: "Selesai",
        type: "keluar",
      },
      {
        id: 105,
        perihal: "Pemberitahuan Penyerahan Dokumen",
        deskripsi:
          "Mengingatkan divisi Banglota untuk menyerahkan dan melengkapi dokumen.",
        sifatSurat: "Umum",
        noNaskah: "52",
        status: "Proses",
        type: "keluar",
      },
      {
        id: 106,
        perihal: "Pemberitahuan Kegiatan Outbond",
        deskripsi:
          "Pemberitahuan kegiatan outbonding untuk meningkatkan rasa kerja sama",
        sifatSurat: "Umum",
        noNaskah: "13",
        status: "Selesai",
        type: "keluar",
      },
      {
        id: 107,
        perihal: "Undangan Sosialisasi Program",
        deskripsi: "Menginformasikan akan dilaksanakannya Program Pelatihan",
        sifatSurat: "Umum",
        noNaskah: "635",
        status: "Ditunda",
        type: "keluar",
      },
    ];

    data = data.length > 0 ? data : dummyData;

    const filterText =
      document.getElementById("searchPerihal")?.value.toLowerCase() || "";
    const filterDate =
      document.getElementById("selectedDateText")?.dataset.dateValue || "";
    const filterSifat =
      document.getElementById("selectedSifatText")?.dataset.sifatValue || "";

    return data.filter((surat) => {
      const matchesText =
        !filterText ||
        surat.perihal.toLowerCase().includes(filterText) ||
        surat.deskripsi.toLowerCase().includes(filterText);

      const matchesDate =
        !filterDate ||
        (surat.tanggalSurat && surat.tanggalSurat.includes(filterDate));

      const matchesSifat = !filterSifat || surat.sifatSurat === filterSifat;

      return matchesText && matchesDate && matchesSifat;
    });
  }

  function renderTableKeluar() {
    const data = getSuratKeluarData();
    const tbody = document.getElementById("tableBody");

    if (!tbody) return;

    const startIndex = (currentPageKeluar - 1) * itemsPerPageKeluar;
    const endIndex = startIndex + itemsPerPageKeluar;
    const paginatedData = data.slice(startIndex, endIndex);

    tbody.innerHTML = "";

    if (paginatedData.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #999;">Tidak ada surat keluar yang sesuai dengan filter.</td></tr>';
      updatePaginationInfoKeluar(0);
      return;
    }

    paginatedData.forEach((surat, index) => {
      const row = document.createElement("tr");
      const statusClass = Utils.getStatusClass(surat.status);
      const deskripsi = surat.deskripsi || surat.perihal;

      row.innerHTML = `
        <td style="text-align: center;">${startIndex + index + 1}</td>
        <td>${surat.perihal}</td>
        <td>${deskripsi}</td>
        <td>${surat.sifatSurat}</td>
        <td style="text-align: center;">${surat.noNaskah}</td>
        <td style="text-align: center;"><span class="status ${statusClass}">${
        surat.status
      }</span></td>
        <td class="action-icons">
          <i class="bi bi-eye" title="Lihat/Preview" onclick="lihatSuratKeluar(${
            surat.id
          })"></i>
          <i class="bi bi-pencil" title="Edit" onclick="editSuratKeluar(${
            surat.id
          })"></i>
          <i class="bi bi-trash" title="Hapus" onclick="hapusSuratKeluar(${
            surat.id
          })"></i>
        </td>
      `;
      tbody.appendChild(row);
    });

    updatePaginationInfoKeluar(data.length);
  }

  function updatePaginationInfoKeluar(totalItems) {
    const startIndex = (currentPageKeluar - 1) * itemsPerPageKeluar + 1;
    const endIndex = Math.min(
      currentPageKeluar * itemsPerPageKeluar,
      totalItems
    );

    const infoElement = document.getElementById("paginationInfo");
    if (infoElement) {
      infoElement.textContent = `Showing ${Math.max(
        0,
        startIndex
      )}-${endIndex} of ${totalItems}`;
    }

    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");

    const maxPage = Math.ceil(totalItems / itemsPerPageKeluar);

    if (prevBtn) prevBtn.disabled = currentPageKeluar === 1;
    if (nextBtn) nextBtn.disabled = currentPageKeluar >= maxPage;
  }

  function attachGlobalKeluarEvents() {
    document.getElementById("prevBtn")?.addEventListener("click", () => {
      if (currentPageKeluar > 1) {
        currentPageKeluar--;
        renderTableKeluar();
      }
    });

    document.getElementById("nextBtn")?.addEventListener("click", () => {
      const totalItems = getSuratKeluarData().length;
      const maxPage = Math.ceil(totalItems / itemsPerPageKeluar);
      if (currentPageKeluar < maxPage) {
        currentPageKeluar++;
        renderTableKeluar();
      }
    });

    document.getElementById("searchPerihal")?.addEventListener("input", () => {
      currentPageKeluar = 1;
      renderTableKeluar();
    });

    document.getElementById("resetBtn")?.addEventListener("click", () => {
      document.getElementById("searchPerihal").value = "";
      document.getElementById("selectedDateText").textContent = "Tanggal";
      document.getElementById("selectedDateText").dataset.dateValue = "";
      document.getElementById("selectedSifatText").textContent = "Sifat";
      document.getElementById("selectedSifatText").dataset.sifatValue = "";
      selectedDate = null;
      currentPageKeluar = 1;
      renderTableKeluar();
    });
  }

  // =============================
  // MODAL FORM
  // =============================
  window.showTambahFormKeluar = function (surat = null) {
    currentSuratKeluarId = surat?.id || null;
    const formModal = document.getElementById("formModal");
    const formTitle = document.getElementById("formTitle");
    const submitBtn = document.getElementById("submitBtn");

    if (formModal) formModal.classList.add("active");

    const form = document.getElementById("suratKeluarForm");
    if (form) form.reset();

    const uploadArea = document.getElementById("uploadArea");
    if (uploadArea) {
      uploadArea.classList.remove("has-file");
      document.getElementById("fileInfoDisplay").innerHTML = "";
    }
    window.uploadedFile = null;

    if (surat) {
      formTitle.textContent = "Form Edit Surat Keluar";
      submitBtn.textContent = "Simpan Perubahan";

      document.getElementById("namaPengirim").value = surat.namaPengirim || "";
      document.getElementById("jabatanPengirim").value =
        surat.jabatanPengirim || "";
      document.getElementById("jenisSurat").value = surat.jenisSurat || "";
      document.getElementById("sifatSurat").value = surat.sifatSurat || "";
      document.getElementById("noSurat").value = surat.noNaskah || "";
      document.getElementById("perihal").value = surat.perihal || "";
      document.getElementById("tanggalNaskah").value = surat.tanggalSurat || "";
      document.getElementById("tanggalDiterima").value =
        surat.tanggalDiterima || "";
      document.getElementById("catatan").value = surat.catatan || "";
      document.getElementById("ditujukanKepada").value = surat.kepada || "";

      if (surat.file) {
        window.uploadedFile = { name: surat.file, size: 0 };
        uploadArea.classList.add("has-file");
        document.getElementById("fileInfoDisplay").innerHTML = `
          <div class="file-info">
            <i class="bi bi-file-earmark-text-fill"></i>
            <div>
              <div class="file-name">${surat.file}</div>
              <div class="preview-label">File Lama</div>
            </div>
          </div>
        `;
      }
    } else {
      formTitle.textContent = "Form Registrasi Surat Keluar";
      submitBtn.textContent = "Tambahkan";
    }

    currentStep = 1;
    updateFormStepDisplay();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  window.editSuratKeluar = function (id) {
    const surat =
      KemhanDatabase.getSuratKeluarById(id) ||
      getSuratKeluarData().find((s) => s.id === id);
    if (surat) {
      showTambahFormKeluar(surat);
    } else {
      Notification.error("Surat tidak ditemukan untuk diedit.");
    }
  };

  window.closeFormKeluar = function () {
    document.getElementById("formModal")?.classList.remove("active");
    document.getElementById("suratKeluarForm")?.reset();
    currentSuratKeluarId = null;
    window.uploadedFile = null;
  };

  window.nextStepKeluar = function () {
    if (currentStep === 1) {
      if (!validateSuratKeluarStep1()) return;
      currentStep = 2;
      updateFormStepDisplay();
    } else if (currentStep === 2) {
      if (!validateSuratKeluarStep2()) return;
      loadPreviewModal();
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  window.prevStepKeluar = function () {
    if (currentStep > 1) {
      currentStep--;
      updateFormStepDisplay();
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  function updateFormStepDisplay() {
    document.querySelectorAll("#formModal .step-content").forEach((el) => {
      el.classList.remove("active");
    });
    document
      .getElementById(`step${currentStep}Content`)
      ?.classList.add("active");

    for (let i = 1; i <= 2; i++) {
      const stepNum = document.getElementById(`step${i}Number`);
      if (stepNum) {
        if (i <= currentStep) {
          stepNum.classList.add("active");
          stepNum.classList.remove("inactive");
        } else {
          stepNum.classList.remove("active");
          stepNum.classList.add("inactive");
        }
      }
    }
  }

  function validateSuratKeluarStep1() {
    const required = [
      "namaPengirim",
      "jabatanPengirim",
      "jenisSurat",
      "sifatSurat",
      "noSurat",
      "perihal",
      "tanggalNaskah",
      "tanggalDiterima",
    ];
    for (let id of required) {
      const el = document.getElementById(id);
      if (!el || !el.value.trim()) {
        Notification.error("Mohon lengkapi semua field di Langkah 1.");
        if (el) el.focus();
        return false;
      }
    }
    if (!window.uploadedFile && !currentSuratKeluarId) {
      Notification.error("Mohon unggah file naskah.");
      return false;
    }
    return true;
  }

  function validateSuratKeluarStep2() {
    const kepada = document.getElementById("ditujukanKepada");
    if (!kepada || !kepada.value.trim()) {
      Notification.error("Mohon isi kolom Ditujukan Kepada.");
      if (kepada) kepada.focus();
      return false;
    }
    return true;
  }

  function loadPreviewModal() {
    const kepadaContent = document.getElementById("ditujukanKepada").value;
    const previewKepadaContent = document.getElementById(
      "previewKepadaContent"
    );
    const previewModal = document.getElementById("previewModal");
    const tambahkanSekarangBtn = document.getElementById(
      "tambahkanSekarangBtn"
    );

    previewKepadaContent.textContent = kepadaContent;

    if (currentSuratKeluarId) {
      document.querySelector(
        ".preview-status-success .success-message"
      ).textContent = "Surat Keluar Berhasil Diperbarui";
      tambahkanSekarangBtn.textContent = "Simpan Perubahan";
    } else {
      document.querySelector(
        ".preview-status-success .success-message"
      ).textContent = "Surat Keluar Berhasil Ditambahkan";
      tambahkanSekarangBtn.textContent = "Tambahkan Sekarang";
    }

    previewModal.classList.add("active");
    document.getElementById("formModal").classList.remove("active");
  }

  window.closePreviewModal = function () {
    document.getElementById("previewModal")?.classList.remove("active");
    document.getElementById("formModal")?.classList.add("active");
  };

  window.submitFinalForm = function () {
    const isEdit = !!currentSuratKeluarId;
    const suratId = currentSuratKeluarId;

    const newSurat = {
      namaPengirim: document.getElementById("namaPengirim").value,
      jabatanPengirim: document.getElementById("jabatanPengirim").value,
      jenisSurat: document.getElementById("jenisSurat").value,
      sifatSurat: document.getElementById("sifatSurat").value,
      noNaskah: document.getElementById("noSurat").value,
      perihal: document.getElementById("perihal").value,
      tanggalSurat: document.getElementById("tanggalNaskah").value,
      tanggalDiterima: document.getElementById("tanggalDiterima").value,
      catatan: document.getElementById("catatan").value,
      kepada: document.getElementById("ditujukanKepada").value,
      status: isEdit
        ? KemhanDatabase.getSuratKeluarById(suratId)?.status || "Selesai"
        : "Selesai",
      file: window.uploadedFile
        ? window.uploadedFile.name
        : KemhanDatabase.getSuratKeluarById(suratId)?.file || "dokumen.pdf",
      deskripsi: document.getElementById("catatan").value,
    };

    if (isEdit) {
      KemhanDatabase.updateSuratKeluar(suratId, newSurat);
      Notification.success(
        `Surat Keluar ${newSurat.noNaskah} berhasil diperbarui!`
      );
    } else {
      KemhanDatabase.addSuratKeluar(newSurat);
      Notification.success(
        `Surat Keluar ${newSurat.noNaskah} berhasil ditambahkan!`
      );
    }

    document.getElementById("previewModal")?.classList.remove("active");
    closeFormKeluar();
    renderTableKeluar();
  };

  window.lihatSuratKeluar = function (id) {
    const surat =
      KemhanDatabase.getSuratKeluarById(id) ||
      getSuratKeluarData().find((s) => s.id === id);
    if (surat) {
      loadSwal(() => {
        Swal.fire({
          title: `Preview Surat: ${surat.noNaskah}`,
          html: `
            <div style="text-align: left; font-size: 14px; line-height: 1.6;">
              <strong>Perihal:</strong> ${surat.perihal}<br>
              <strong>Deskripsi:</strong> ${
                surat.deskripsi || surat.catatan || "-"
              }<br>
              <strong>Sifat:</strong> <span class="status ${Utils.getStatusClass(
                surat.sifatSurat
              )}" style="font-size: 12px;">${surat.sifatSurat}</span><br>
              <strong>Status:</strong> <span class="status ${Utils.getStatusClass(
                surat.status
              )}" style="font-size: 12px;">${surat.status}</span><br>
              <strong>Tanggal Naskah:</strong> ${Utils.formatDateShort(
                surat.tanggalSurat
              )}<br>
              <strong>Ditujukan Kepada:</strong> <pre style="white-space: pre-wrap; margin: 5px 0; padding: 5px; background: #f0f0f0;">${
                surat.kepada || "-"
              }</pre><br>
              <strong>File:</strong> ${surat.file || "N/A"}
            </div>
          `,
          icon: "info",
          confirmButtonText: "Tutup",
        });
      });
    } else {
      Notification.error("Surat tidak ditemukan untuk dilihat.");
    }
  };

  window.hapusSuratKeluar = function (id) {
    loadSwal(() => {
      Notification.confirm(
        "Apakah Anda yakin ingin menghapus surat ini? Surat akan dipindahkan ke Surat Dihapus.",
        () => {
          const deleted = KemhanDatabase.deleteSurat(id, "keluar");
          if (deleted) {
            Notification.success(
              `Surat ${
                deleted.noNaskah || deleted.noSurat
              } berhasil dipindahkan ke Surat Dihapus!`
            );
            renderTableKeluar();
            if (window.loadMonitoringData) window.loadMonitoringData();
            if (window.loadDeletedData) window.loadDeletedData();
          } else {
            Notification.error("Gagal menghapus surat!");
          }
        }
      );
    });
  };

  // =============================
  // FILTERS
  // =============================
  function initializeSifatFilter() {
    const sifatBtn = document.getElementById("sifatFilterBtn");
    const sifatModal = document.getElementById("sifatModal");
    const selectedSifatText = document.getElementById("selectedSifatText");

    document.addEventListener("click", (e) => {
      if (!sifatBtn?.contains(e.target) && !sifatModal?.contains(e.target)) {
        sifatModal?.classList.remove("active");
      }
    });

    sifatBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      const rect = sifatBtn.getBoundingClientRect();
      sifatModal.style.top = `${rect.bottom + 8}px`;
      sifatModal.style.left = `${rect.left}px`;
      sifatModal.classList.toggle("active");

      const currentValue = selectedSifatText.dataset.sifatValue || "";
      document.querySelectorAll("#sifatModal .sifat-option").forEach((opt) => {
        opt.classList.remove("selected");
        if (opt.dataset.value === currentValue) {
          opt.classList.add("selected");
        }
      });
    });

    document.querySelectorAll("#sifatModal .sifat-option").forEach((opt) => {
      opt.addEventListener("click", function (e) {
        e.stopPropagation();
        document
          .querySelectorAll("#sifatModal .sifat-option")
          .forEach((b) => b.classList.remove("selected"));
        this.classList.add("selected");
      });
    });

    document
      .getElementById("applySifat")
      ?.addEventListener("click", function () {
        const selectedOption = document.querySelector(
          "#sifatModal .sifat-option.selected"
        );
        if (selectedOption) {
          const value = selectedOption.dataset.value;
          const text = value === "" ? "Sifat" : value;
          selectedSifatText.textContent = text;
          selectedSifatText.dataset.sifatValue = value;
          sifatModal.classList.remove("active");
          currentPageKeluar = 1;
          renderTableKeluar();
        } else {
          Notification.error("Pilih salah satu sifat!");
        }
      });
  }

  // =============================
  // CALENDAR FILTER
  // =============================
  function generateCalendar(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek =
      firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

    const calendarDays = document.getElementById("calendarDays");
    if (!calendarDays) return;
    calendarDays.innerHTML = "";

    const calendarMonthEl = document.getElementById("calendarMonth");
    if (calendarMonthEl)
      calendarMonthEl.textContent = `${monthNames[month]} ${year}`;

    for (let i = 0; i < startingDayOfWeek; i++) {
      const emptyDay = document.createElement("button");
      emptyDay.className = "calendar-day empty";
      calendarDays.appendChild(emptyDay);
    }

    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const dayButton = document.createElement("button");
      dayButton.className = "calendar-day";
      dayButton.textContent = day;

      if (
        year === today.getFullYear() &&
        month === today.getMonth() &&
        day === today.getDate()
      ) {
        dayButton.classList.add("today");
      }

      if (
        selectedDate &&
        selectedDate.getFullYear() === year &&
        selectedDate.getMonth() === month &&
        selectedDate.getDate() === day
      ) {
        dayButton.classList.add("selected");
      }

      dayButton.addEventListener("click", function () {
        document.querySelectorAll(".calendar-day").forEach((d) => {
          d.classList.remove("selected");
        });
        this.classList.add("selected");
        selectedDate = new Date(year, month, day);
      });

      calendarDays.appendChild(dayButton);
    }
  }

  function initializeCalendarEvents() {
    const datePickerBtn = document.getElementById("datePickerBtn");
    const calendarModal = document.getElementById("calendarModal");
    const prevMonthBtn = document.getElementById("prevMonth");
    const nextMonthBtn = document.getElementById("nextMonth");
    const applyDateBtn = document.getElementById("applyDate");
    const selectedDateText = document.getElementById("selectedDateText");

    if (
      !datePickerBtn ||
      !calendarModal ||
      !prevMonthBtn ||
      !nextMonthBtn ||
      !applyDateBtn ||
      !selectedDateText
    )
      return;

    const initialDateValue = selectedDateText.dataset.dateValue;
    if (initialDateValue) {
      currentDate = new Date(initialDateValue);
      selectedDate = new Date(initialDateValue);
      selectedDateText.textContent = Utils.formatDate(initialDateValue);
    } else {
      selectedDateText.textContent = "Tanggal";
      selectedDate = null;
    }

    datePickerBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      const rect = datePickerBtn.getBoundingClientRect();
      calendarModal.style.top = `${rect.bottom + 8}px`;
      calendarModal.style.left = `${rect.left}px`;
      calendarModal.classList.add("active");

      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth();
      generateCalendar(currentYear, currentMonth);
    });

    calendarModal.addEventListener("click", function (e) {
      if (e.target === this) {
        this.classList.remove("active");
      }
    });

    prevMonthBtn.addEventListener("click", function () {
      currentDate.setMonth(currentDate.getMonth() - 1);
      generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
    });

    nextMonthBtn.addEventListener("click", function () {
      currentDate.setMonth(currentDate.getMonth() + 1);
      generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
    });

    applyDateBtn.addEventListener("click", function () {
      if (selectedDate) {
        const dateISO = selectedDate.toISOString().split("T")[0];
        const formatted = Utils.formatDate(dateISO);

        selectedDateText.textContent = formatted;
        selectedDateText.dataset.dateValue = dateISO;
        calendarModal.classList.remove("active");
        currentPageKeluar = 1;
        renderTableKeluar();
      } else {
        Notification.error("Silakan pilih tanggal terlebih dahulu!");
      }
    });
  }
})();
