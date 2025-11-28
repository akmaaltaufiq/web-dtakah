// =============================
// SURAT DIHAPUS - PAGE SPECIFIC
// =============================
(function () {
  "use strict";

  // Local variables
  let currentPageDeleted = 1;
  const itemsPerPageDeleted = 6;
  let deletedData = [];
  let currentFilteredDeletedData = [];

  // =============================
  // INITIALIZATION
  // =============================
  window.initializePage = function () {
    console.log("Surat Dihapus Page Initialized");
    loadDeletedData();
  };

  window.loadDeletedData = function () {
    const cardGrid = document.getElementById("deletedCardGrid");
    if (!cardGrid) return;

    deletedData = KemhanDatabase.getAllDeleted();
    currentFilteredDeletedData = deletedData;
    renderDeletedCards(currentFilteredDeletedData);
    setupDeletedFilterEvents();
  };

  // =============================
  // FILTER EVENTS
  // =============================
  function setupDeletedFilterEvents() {
    const searchInput = document.getElementById("tableSearchDeleted");
    const dateFilter = document.getElementById("dateFilterDeleted");
    const sifatFilter = document.getElementById("sifatFilterDeleted");
    const resetBtn = document.getElementById("resetBtnDeleted");

    const applyFilter = () => {
      currentPageDeleted = 1;

      const searchTerm = searchInput?.value.toLowerCase() || "";
      const selectedDate = dateFilter?.value || "";
      const selectedSifat = sifatFilter?.value || "";

      currentFilteredDeletedData = deletedData.filter((s) => {
        const matchesSearch =
          searchTerm === "" ||
          s.perihal.toLowerCase().includes(searchTerm) ||
          s.noSurat.toLowerCase().includes(searchTerm);

        const deletedDate = s.deletedAt ? s.deletedAt.split("T")[0] : "";
        const matchesDate = selectedDate === "" || deletedDate === selectedDate;

        const matchesSifat =
          selectedSifat === "" || s.sifatSurat === selectedSifat;

        return matchesSearch && matchesDate && matchesSifat;
      });

      renderDeletedCards(currentFilteredDeletedData);
    };

    searchInput?.addEventListener("input", applyFilter);
    dateFilter?.addEventListener("change", applyFilter);
    sifatFilter?.addEventListener("change", applyFilter);

    resetBtn?.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      if (dateFilter) dateFilter.value = "";
      if (sifatFilter) sifatFilter.value = "";
      currentFilteredDeletedData = deletedData;
      renderDeletedCards(currentFilteredDeletedData);
    });

    // Populate unique date options
    const uniqueDates = [
      ...new Set(
        deletedData.map((s) => (s.deletedAt ? s.deletedAt.split("T")[0] : null))
      ),
    ]
      .filter(Boolean)
      .sort((a, b) => new Date(b) - new Date(a));

    if (dateFilter)
      dateFilter.innerHTML = '<option value="">Tanggal Hapus: Semua</option>';

    uniqueDates.forEach((date) => {
      const option = document.createElement("option");
      option.value = date;
      option.textContent = Utils.formatDate(date);
      dateFilter?.appendChild(option);
    });
  }

  // =============================
  // RENDER CARDS
  // =============================
  function renderDeletedCards(data) {
    const cardGrid = document.getElementById("deletedCardGrid");
    if (!cardGrid) return;

    const startIndex = (currentPageDeleted - 1) * itemsPerPageDeleted;
    const endIndex = startIndex + itemsPerPageDeleted;
    const paginatedData = data.slice(startIndex, endIndex);

    cardGrid.innerHTML = "";

    if (paginatedData.length === 0) {
      cardGrid.innerHTML =
        '<p style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #999;">Tidak ada surat di tempat sampah yang sesuai filter.</p>';
      updatePaginationInfoDeleted(0);
      return;
    }

    paginatedData.forEach((surat) => {
      const dariLabel = surat.type === "masuk" ? "Dari" : "Kepada";
      const dariValue = surat.type === "masuk" ? surat.dari : surat.kepada;

      const kepadaLabel = surat.type === "masuk" ? "Kepada" : "Dari";
      const kepadaValue = surat.type === "masuk" ? surat.kepada : surat.dari;

      const badgeClass = Utils.getSifatBadge(surat.sifatSurat);

      const card = document.createElement("div");
      card.className = "deleted-card";
      card.innerHTML = `
        <div class="card-header-deleted">
          <h5 class="card-title-deleted">${surat.perihal}</h5>
          <span class="badge-deleted ${badgeClass}">${surat.sifatSurat}</span>
        </div>
        <div class="card-body-deleted">
          <div class="card-info-row">
            <i class="bi bi-person-badge"></i>
            <span>${kepadaLabel}: ${kepadaValue || "N/A"}</span>
          </div>
          <div class="card-info-row">
            <i class="bi bi-send-check"></i>
            <span>${dariLabel}: ${dariValue || "N/A"}</span>
          </div>
          <div class="card-info-row">
            <i class="bi bi-envelope"></i>
            <span>Nomor Surat: ${surat.noSurat}</span>
          </div>
        </div>
        <div class="card-actions-deleted">
          <button class="btn-pulihkan" onclick="restoreSurat(${surat.id}, '${
        surat.type
      }')">
            Pulihkan
          </button>
          <button class="btn-hapus-permanen" onclick="permanentDeleteSurat(${
            surat.id
          }, '${surat.type}')">
            Hapus Permanen
          </button>
        </div>
      `;
      cardGrid.appendChild(card);
    });

    updatePaginationInfoDeleted(data.length);
  }

  // =============================
  // PAGINATION
  // =============================
  function updatePaginationInfoDeleted(totalItems) {
    const startIndex = (currentPageDeleted - 1) * itemsPerPageDeleted + 1;
    const endIndex = Math.min(
      currentPageDeleted * itemsPerPageDeleted,
      totalItems
    );
    const infoElement = document.getElementById("deletedPaginationInfo");
    if (infoElement) {
      infoElement.textContent = `Showing ${Math.max(
        0,
        startIndex
      )}-${endIndex} of ${totalItems}`;
    }

    const prevBtn = document.getElementById("prevBtnDeleted");
    const nextBtn = document.getElementById("nextBtnDeleted");
    const maxPage = Math.ceil(totalItems / itemsPerPageDeleted);

    if (prevBtn) prevBtn.disabled = currentPageDeleted === 1;
    if (nextBtn) nextBtn.disabled = currentPageDeleted >= maxPage;
  }

  window.previousPageDeleted = function () {
    if (currentPageDeleted > 1) {
      currentPageDeleted--;
      renderDeletedCards(currentFilteredDeletedData);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  window.nextPageDeleted = function () {
    const maxPage = Math.ceil(
      currentFilteredDeletedData.length / itemsPerPageDeleted
    );
    if (currentPageDeleted < maxPage) {
      currentPageDeleted++;
      renderDeletedCards(currentFilteredDeletedData);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // =============================
  // ACTIONS
  // =============================
  window.restoreSurat = function (id, type) {
    loadSwal(() => {
      Notification.confirm("Pulihkan surat ini?", () => {
        const restored = KemhanDatabase.restoreSurat(id, type);
        if (restored) {
          Notification.success(
            "Surat berhasil dipulihkan dan kembali ke Inbox!"
          );

          // Reload data
          deletedData = KemhanDatabase.getAllDeleted();
          currentFilteredDeletedData = deletedData;
          renderDeletedCards(currentFilteredDeletedData);

          // Refresh other pages if functions exist
          if (window.loadMonitoringData) window.loadMonitoringData();
          if (window.renderTable && type === "masuk") window.renderTable();
          if (window.renderTableKeluar && type === "keluar")
            window.renderTableKeluar();
        } else {
          Notification.error("Gagal memulihkan surat!");
        }
      });
    });
  };

  window.permanentDeleteSurat = function (id, type) {
    loadSwal(() => {
      Notification.confirm(
        "Hapus surat ini PERMANEN? Aksi ini tidak bisa dibatalkan.",
        () => {
          const deleted = KemhanDatabase.permanentDelete(id, type);
          if (deleted) {
            Notification.success("Surat berhasil dihapus permanen!");

            // Reload data
            deletedData = KemhanDatabase.getAllDeleted();
            currentFilteredDeletedData = deletedData;
            renderDeletedCards(currentFilteredDeletedData);
          } else {
            Notification.error("Gagal menghapus permanen surat!");
          }
        }
      );
    });
  };
})();
