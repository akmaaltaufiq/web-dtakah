// ========================================
// NOTA DINAS - FIREBASE REAL-TIME INTEGRATED
// ========================================
(function () {
  "use strict";

  console.log("🔄 Nota Dinas Script Loading...");

  // Local variables
  let currentPageNotaDinas = 1;
  const itemsPerPageNotaDinas = 10;
  let currentNotaDinasId = null;
  let currentStep = 1;
  let isEditMode = false;
  let currentUserData = null;
  let unsubscribeNotaDinas = null;

  // Calendar
  let selectedDate = null;
  let currentMonth = new Date().getMonth();
  let currentYear = new Date().getFullYear();

  // Global Nota Dinas Form Data State
  let notaDinasFormState = {
    uploadedFile: null,
    fileName: null,
  };

  // ========================================
  // INITIALIZATION
  // ========================================
  window.initializePage = function () {
    console.log("✅ Nota Dinas Page Initialized");

    // Wait for Firebase Auth
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        console.log("✅ User authenticated:", user.email);

        currentUserData = {
          uid: user.uid,
          email: user.email,
          nama: user.displayName || user.email,
        };

        console.log("👤 Current user data:", currentUserData);

        // Setup all components
        setupRealtimeListener();
        setupNotaDinasFilters();
        setupCalendar();
        setupPagination();
        setupFormNavigation();
        setupBackButtons();
        setupPopupOutsideClick();

        // Setup file upload
        setTimeout(() => setupFileUploadHandler(), 500);

        resetNotaDinasForm();
        showTableView();
      } else {
        console.error("❌ No user logged in!");
        window.location.href = "login.html";
      }
    });
  };

  // ========================================
  // REAL-TIME LISTENER (FIREBASE)
  // ========================================
  function setupRealtimeListener() {
    console.log("🔌 Setting up Firebase real-time listener...");

    if (unsubscribeNotaDinas) {
      console.log("⚠️ Unsubscribing previous listener");
      unsubscribeNotaDinas();
    }

    // Listen to ALL nota_dinas documents (client-side filtering)
    unsubscribeNotaDinas = db.collection("nota_dinas").onSnapshot(
      (snapshot) => {
        console.log(
          "📥 Real-time snapshot received:",
          snapshot.size,
          "documents"
        );

        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            console.log("➕ Nota Dinas added:", change.doc.id);
          }
          if (change.type === "modified") {
            console.log("✏️ Nota Dinas modified:", change.doc.id);
          }
          if (change.type === "removed") {
            console.log("➖ Nota Dinas removed:", change.doc.id);
          }
        });

        // Re-render table on any change
        renderNotaDinasTable();
      },
      (error) => {
        console.error("❌ Real-time listener error:", error);
        renderNotaDinasTable();
      }
    );

    console.log("✅ Real-time listener setup completed");
  }

  // ========================================
  // GET NOTA DINAS DATA FROM FIREBASE
  // ========================================
  async function getNotaDinasData() {
    try {
      console.log("🔍 Fetching nota dinas data from Firebase...");

      const snapshot = await db.collection("nota_dinas").get();
      console.log("📥 Firestore returned:", snapshot.size, "documents");

      let data = [];
      snapshot.forEach((doc) => {
        const docData = doc.data();

        // CLIENT-SIDE FILTER: Skip deleted documents
        if (docData.isDeleted === true) {
          return;
        }

        data.push({
          id: doc.id,
          ...docData,
          _createdAt: docData.createdAt?.toDate
            ? docData.createdAt.toDate()
            : new Date(docData.createdAt || Date.now()),
        });
      });

      console.log("📊 Data after filtering deleted:", data.length, "documents");

      // Apply filters
      const filterText =
        document.getElementById("searchPerihal")?.value.toLowerCase() || "";
      const filterDate = selectedDate;
      const filterSifat = document.getElementById("sifatFilter")?.value || "";

      const filteredData = data.filter((nota) => {
        const matchesText =
          !filterText ||
          (nota.perihal && nota.perihal.toLowerCase().includes(filterText)) ||
          (nota.noSurat && nota.noSurat.toLowerCase().includes(filterText)) ||
          (nota.noNaskah && nota.noNaskah.toLowerCase().includes(filterText)) ||
          (nota.dari && nota.dari.toLowerCase().includes(filterText)) ||
          (nota.kepada && nota.kepada.toLowerCase().includes(filterText));

        const matchesDate =
          !filterDate ||
          (nota.tanggalTerima &&
            isSameDate(new Date(nota.tanggalTerima), filterDate));

        const matchesSifat =
          !filterSifat ||
          (nota.sifat || nota.sifatNaskah || "").toLowerCase() ===
            filterSifat.toLowerCase();

        return matchesText && matchesDate && matchesSifat;
      });

      // Sort by createdAt (newest first)
      filteredData.sort((a, b) => b._createdAt - a._createdAt);

      console.log("📊 Data after filters:", filteredData.length, "documents");
      return filteredData;
    } catch (error) {
      console.error("❌ Error fetching data:", error);
      return [];
    }
  }

  function isSameDate(date1, date2) {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  }

  // ========================================
  // RENDER TABLE
  // ========================================
  async function renderNotaDinasTable() {
    const data = await getNotaDinasData();
    const tbody = document.getElementById("notaDinasTableBody");

    if (!tbody) {
      console.error("❌ Table body not found!");
      return;
    }

    console.log("🔄 Rendering table with", data.length, "items");

    // Pagination
    const startIndex = (currentPageNotaDinas - 1) * itemsPerPageNotaDinas;
    const paginatedData = data.slice(
      startIndex,
      startIndex + itemsPerPageNotaDinas
    );

    console.log(
      "📄 Page",
      currentPageNotaDinas,
      "showing",
      paginatedData.length,
      "items"
    );

    if (paginatedData.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #9ca3af;">Tidak ada nota dinas yang ditemukan</td></tr>';
      updatePaginationInfo(0);
      return;
    }

    tbody.innerHTML = paginatedData
      .map((item, index) => {
        const rowNumber = startIndex + index + 1;

        const tanggalTerima =
          item.tanggalTerima || item.tanggalDiterima || item.createdAt;
        let formattedDate = "-";
        if (tanggalTerima) {
          try {
            const date = tanggalTerima.toDate
              ? tanggalTerima.toDate()
              : new Date(tanggalTerima);
            if (!isNaN(date.getTime())) {
              formattedDate = date.toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              });
            }
          } catch (e) {
            formattedDate = tanggalTerima;
          }
        }

        const noSurat = item.noSurat || item.noNaskah || "-";
        const perihal = item.perihal || "-";
        const dari = item.dari || item.pengirim || item.namaPengirim || "-";
        const kepada =
          item.kepada || item.tujuan || item.ditujukanKepada || "-";

        return `
        <tr>
          <td style="text-align: center;">${rowNumber}</td>
          <td>${formattedDate}</td>
          <td>${Utils.escapeHtml(noSurat)}</td>
          <td>${Utils.escapeHtml(perihal)}</td>
          <td>${Utils.escapeHtml(dari)}</td>
          <td>${Utils.escapeHtml(kepada)}</td>
          <td>
            <div class="action-buttons">
              <button class="btn-action btn-preview" onclick="showPreviewNotaDinas('${
                item.id
              }')" title="Preview">
                <i class="bi bi-eye-fill"></i>
              </button>
              <button class="btn-action btn-edit" onclick="editNotaDinas('${
                item.id
              }')" title="Edit">
                <i class="bi bi-pencil-fill"></i>
              </button>
              <button class="btn-action btn-delete" onclick="hapusNotaDinas('${
                item.id
              }')" title="Hapus">
                <i class="bi bi-trash-fill"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
      })
      .join("");

    updatePaginationInfo(data.length);
    console.log("✅ Table rendered successfully!");
  }

  // ========================================
  // SHOW PREVIEW
  // ========================================
  window.showPreviewNotaDinas = async function (id) {
    console.log("👁️ Show Preview for Nota Dinas ID:", id);

    currentNotaDinasId = id;

    try {
      const doc = await db.collection("nota_dinas").doc(id).get();

      if (!doc.exists) {
        Notification.error("Nota dinas tidak ditemukan!");
        return;
      }

      const notaDinas = { id: doc.id, ...doc.data() };

      const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        try {
          const date = dateStr.toDate ? dateStr.toDate() : new Date(dateStr);
          if (!isNaN(date.getTime())) {
            return date.toLocaleDateString("id-ID", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            });
          }
        } catch (e) {
          console.warn("Error formatting date:", e);
        }
        return dateStr;
      };

      const setTextContent = (id, value) => {
        const element = document.getElementById(id);
        if (element) {
          element.textContent = value || "-";
        }
      };

      setTextContent("previewTitleMain", notaDinas.perihal || "Nota Dinas");
      setTextContent(
        "previewTanggalTerima",
        formatDate(notaDinas.tanggalTerima || notaDinas.createdAt)
      );
      setTextContent(
        "previewNoSurat",
        notaDinas.noSurat || notaDinas.noNaskah || "-"
      );
      setTextContent("previewTanggalSurat", formatDate(notaDinas.tanggalSurat));
      setTextContent(
        "previewDari",
        notaDinas.dari || notaDinas.pengirim || notaDinas.namaPengirim || "-"
      );
      setTextContent(
        "previewKepada",
        notaDinas.kepada || notaDinas.tujuan || notaDinas.ditujukanKepada || "-"
      );
      setTextContent("previewPerihalDetail", notaDinas.perihal || "-");
      setTextContent(
        "previewLampiran",
        notaDinas.lampiran || notaDinas.file || notaDinas.fileName || "-"
      );
      setTextContent(
        "previewSifat",
        notaDinas.sifat || notaDinas.sifatNaskah || "Umum"
      );
      setTextContent(
        "previewJenisNaskah",
        notaDinas.jenisNaskah || "Nota Dinas"
      );
      setTextContent("previewCatatanDetail", notaDinas.catatan || "-");
      setTextContent(
        "previewDientry",
        notaDinas.diEntryOleh || notaDinas.namaPengirim || currentUserData.nama
      );
      setTextContent(
        "previewFileName",
        notaDinas.fileName || notaDinas.file || "Tidak ada file"
      );

      // Status badge
      const statusBadge = document.getElementById("previewStatusBadge");
      if (statusBadge) {
        const status = notaDinas.status || "Proses";
        let badgeClass = "badge-proses";
        if (status === "Selesai" || status === "Disetujui Kapus")
          badgeClass = "badge-selesai";
        else if (
          status === "Pending" ||
          status === "Menunggu Persetujuan Kapus"
        )
          badgeClass = "badge-pending";
        else if (
          status === "Revisi" ||
          status === "Perlu Revisi" ||
          status === "Ditolak Kapus"
        )
          badgeClass = "badge-revisi";

        statusBadge.innerHTML = `<span class="${badgeClass}">${status}</span>`;
      }

      // Progress bar
      const progressFill = document.querySelector(
        "#previewProgressBar .progress-fill"
      );
      const progressText = document.getElementById("previewProgressText");
      let progress = 50;

      if (
        notaDinas.status === "Selesai" ||
        notaDinas.status === "Disetujui Kapus"
      )
        progress = 100;
      else if (notaDinas.status === "Menunggu Persetujuan Kapus") progress = 75;
      else if (notaDinas.status === "Proses") progress = 50;

      if (progressFill) progressFill.style.width = progress + "%";
      if (progressText) progressText.textContent = progress + "%";

      showPreviewView();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("❌ Error showing preview:", error);
      Notification.error("Gagal menampilkan preview.");
    }
  };

  // ========================================
  // EDIT NOTA DINAS
  // ========================================
  window.editNotaDinas = async function (id) {
    console.log("✏️ Edit Nota Dinas ID:", id);

    try {
      const doc = await db.collection("nota_dinas").doc(id).get();

      if (!doc.exists) {
        Notification.error("Nota dinas tidak ditemukan!");
        return;
      }

      const notaDinas = { id: doc.id, ...doc.data() };

      isEditMode = true;
      currentNotaDinasId = id;

      const formTitle = document.getElementById("formMainTitle");
      if (formTitle) {
        formTitle.textContent = "Edit Nota Dinas";
      }

      // Fill form
      document.getElementById("namaPengirim").value =
        notaDinas.namaPengirim || notaDinas.dari || "";
      document.getElementById("jabatanPengirim").value =
        notaDinas.jabatanPengirim || "";
      document.getElementById("jenisNaskah").value =
        notaDinas.jenisNaskah || "Nota Dinas";
      document.getElementById("sifatNaskah").value =
        notaDinas.sifatNaskah || notaDinas.sifat || "";
      document.getElementById("nomorNaskah").value =
        notaDinas.noNaskah || notaDinas.noSurat || "";
      document.getElementById("perihal").value = notaDinas.perihal || "";

      const tanggalSurat = notaDinas.tanggalSurat?.toDate
        ? notaDinas.tanggalSurat.toDate().toISOString().split("T")[0]
        : notaDinas.tanggalSurat || "";
      document.getElementById("tanggalSurat").value = tanggalSurat;

      document.getElementById("catatan").value = notaDinas.catatan || "";
      document.getElementById("ditujukanKepada").value =
        notaDinas.tujuan || notaDinas.kepada || notaDinas.ditujukanKepada || "";

      const tenggatWaktu = notaDinas.tenggatWaktu?.toDate
        ? notaDinas.tenggatWaktu.toDate().toISOString().split("T")[0]
        : notaDinas.tenggatWaktu || "";
      document.getElementById("tenggatWaktu").value = tenggatWaktu;

      document.getElementById("catatanTujuan").value =
        notaDinas.catatanTujuan || "";

      // Handle existing file
      if (notaDinas.fileName || notaDinas.file) {
        notaDinasFormState.fileName = notaDinas.fileName || notaDinas.file;
        displayExistingFile(notaDinasFormState.fileName);
      }

      showFormView();
      goToStep(1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("❌ Error editing:", error);
      Notification.error("Gagal memuat data nota dinas.");
    }
  };

  function displayExistingFile(filename) {
    const uploadArea = document.getElementById("uploadArea");
    const uploadContent = document.getElementById("uploadContent");
    const fileInfoDisplay = document.getElementById("fileInfoDisplay");

    if (!uploadArea || !fileInfoDisplay) return;

    uploadArea.classList.add("has-file");
    if (uploadContent) uploadContent.style.display = "none";

    let iconClass = "bi-file-earmark-text-fill";
    let iconColor = "#6b7280";

    if (filename.toLowerCase().endsWith(".pdf")) {
      iconClass = "bi-file-earmark-pdf-fill";
      iconColor = "#dc2626";
    } else if (filename.toLowerCase().match(/\.(doc|docx)$/)) {
      iconClass = "bi-file-earmark-word-fill";
      iconColor = "#2563eb";
    }

    fileInfoDisplay.innerHTML = `
      <div class="file-item">
        <i class="bi ${iconClass}" style="color: ${iconColor};"></i>
        <div class="file-details">
          <span class="file-name">${filename}</span>
          <span class="file-size">File existing</span>
        </div>
        <button class="file-remove" onclick="removeFile()" type="button">
          <i class="bi bi-x"></i>
        </button>
      </div>
    `;
    fileInfoDisplay.style.display = "block";
  }

  // ========================================
  // DELETE NOTA DINAS
  // ========================================
  window.hapusNotaDinas = async function (id) {
    try {
      const doc = await db.collection("nota_dinas").doc(id).get();

      if (!doc.exists) {
        Notification.error("Nota dinas tidak ditemukan!");
        return;
      }

      const notaDinas = { id: doc.id, ...doc.data() };

      window.loadSwal(() => {
        Swal.fire({
          title: "Hapus Nota Dinas?",
          html: `<p>Yakin menghapus:<br><strong>${notaDinas.perihal}</strong>?</p>`,
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Ya, Hapus!",
          cancelButtonText: "Batal",
          confirmButtonColor: "#dc2626",
          cancelButtonColor: "#6b7280",
        }).then(async (result) => {
          if (result.isConfirmed) {
            await db
              .collection("nota_dinas")
              .doc(id)
              .update({
                isDeleted: true,
                deletedAt: firebase.firestore.FieldValue.serverTimestamp(),
                deletedBy: currentUserData?.nama || currentUserData?.email,
              });

            Swal.fire({
              icon: "success",
              title: "Berhasil Dihapus!",
              text: "Nota dinas berhasil dihapus!",
              timer: 2000,
            });

            const previewView = document.getElementById("previewView");
            if (previewView && previewView.style.display !== "none") {
              backToTableView();
            }
          }
        });
      });
    } catch (error) {
      console.error("❌ Error deleting:", error);
      Notification.error("Gagal menghapus nota dinas.");
    }
  };

  window.hapusSuratFromPreview = function () {
    if (currentNotaDinasId) {
      hapusNotaDinas(currentNotaDinasId);
    }
  };

  // ========================================
  // SUBMIT FORM
  // ========================================
  window.confirmSubmitNotaDinas = function () {
    window.loadSwal(() => {
      Swal.fire({
        title: "Konfirmasi Pengiriman",
        text: "Apakah Anda yakin ingin mengirim nota dinas ini?",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#7f1d1d",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Ya, Kirim!",
        cancelButtonText: "Batal",
      }).then((result) => {
        if (result.isConfirmed) {
          submitNotaDinas();
        }
      });
    });
  };

  async function submitNotaDinas() {
    console.log("📤 Submitting Nota Dinas to Firebase...");
    console.log("📋 Form State:", notaDinasFormState);

    // Validate user
    if (!currentUserData || !currentUserData.uid) {
      const user = firebase.auth().currentUser;
      if (user) {
        currentUserData = {
          uid: user.uid,
          email: user.email,
          nama: user.displayName || user.email,
        };
        console.log("✅ User data refreshed:", currentUserData);
      } else {
        console.error("❌ No user authenticated!");
        Notification.error("Session expired. Please login again.");
        setTimeout(() => (window.location.href = "login.html"), 1500);
        return;
      }
    }

    // Validate form data
    if (!notaDinasFormState.perihal || !notaDinasFormState.nomorNaskah) {
      console.error("❌ Required fields missing!");
      Notification.error("Data tidak lengkap! Mohon isi semua field.");
      return;
    }

    // Determine status based on recipient
    const ditujukanKepada = notaDinasFormState.ditujukanKepada || "";
    let status = "Proses";

    // Check if sent to Kapus
    if (
      ditujukanKepada.toLowerCase().includes("kepala pusat") ||
      ditujukanKepada.toLowerCase().includes("kapus") ||
      ditujukanKepada.toLowerCase().includes("kapusdatin")
    ) {
      status = "Menunggu Persetujuan Kapus";
      console.log("📨 Status set to: Menunggu Persetujuan Kapus (untuk Kapus)");
    } else {
      status = "Proses";
      console.log("📨 Status set to: Proses (bukan untuk Kapus)");
    }

    const notaDinasData = {
      // Identitas Pengirim
      namaPengirim: notaDinasFormState.namaPengirim,
      jabatanPengirim: notaDinasFormState.jabatanPengirim,

      // Detail Naskah
      jenisNaskah: notaDinasFormState.jenisNaskah,
      sifatNaskah: notaDinasFormState.sifatNaskah,
      sifat: notaDinasFormState.sifatNaskah, // Alias
      noNaskah: notaDinasFormState.nomorNaskah,
      noSurat: notaDinasFormState.nomorNaskah, // Alias
      perihal: notaDinasFormState.perihal,
      tanggalSurat: notaDinasFormState.tanggalSurat,
      tanggalNaskah: notaDinasFormState.tanggalSurat, // Alias
      catatan: notaDinasFormState.catatan || "",
      fileName: notaDinasFormState.fileName || "dokumen.pdf",

      // Tujuan
      ditujukanKepada: ditujukanKepada,
      kepada: ditujukanKepada, // Alias
      tujuan: ditujukanKepada, // Alias
      tenggatWaktu: notaDinasFormState.tenggatWaktu || "",
      catatanTujuan: notaDinasFormState.catatanTujuan || "",

      // Metadata
      dari: notaDinasFormState.namaPengirim,
      pengirim: notaDinasFormState.namaPengirim, // Alias
      diEntryOleh: currentUserData.nama,
      tanggalTerima: new Date().toISOString(),
      tanggalDiterima: new Date().toISOString(), // Alias

      // Status
      status: status,
      isDeleted: false,
      isFavorite: false,
      disposisi: [],

      // Creator info
      createdBy: currentUserData.nama || currentUserData.email,
      createdByUid: currentUserData.uid,
      createdByEmail: currentUserData.email,
    };

    console.log("📦 Prepared data:", notaDinasData);

    try {
      if (window.showLoading) window.showLoading();

      if (isEditMode && currentNotaDinasId) {
        console.log("📝 Updating existing nota dinas:", currentNotaDinasId);

        await db
          .collection("nota_dinas")
          .doc(currentNotaDinasId)
          .update({
            ...notaDinasData,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          });

        console.log("✅ Nota dinas updated successfully");

        if (window.hideLoading) window.hideLoading();

        window.loadSwal(() => {
          Swal.fire({
            icon: "success",
            title: "Berhasil Diupdate!",
            html: `<p>Nota Dinas "<strong>${notaDinasData.perihal}</strong>" berhasil diupdate!</p>`,
            confirmButtonText: "OK",
            confirmButtonColor: "#7f1d1d",
            timer: 3000,
            timerProgressBar: true,
          }).then(() => {
            closeSuccessPopupAndBack();
          });
        });
      } else {
        console.log("➕ Adding new nota dinas to Firebase");

        const docRef = await db.collection("nota_dinas").add({
          ...notaDinasData,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });

        console.log("✅ Nota dinas created with ID:", docRef.id);
        console.log("📊 Status:", status);
        console.log("📨 Sent to:", ditujukanKepada);

        if (window.hideLoading) window.hideLoading();

        // Show success popup
        showSuccessPopup();

        // Auto redirect after 2 seconds
        setTimeout(() => {
          closeSuccessPopupAndBack();
        }, 2000);
      }
    } catch (error) {
      console.error("❌ Error saving nota dinas:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);

      if (window.hideLoading) window.hideLoading();

      let errorMsg = "Gagal menyimpan nota dinas: " + error.message;

      if (error.code === "permission-denied") {
        errorMsg = "Permission denied! Pastikan Firestore rules sudah benar.";
        console.error("🔒 FIRESTORE RULES ERROR");
        console.error("Check: https://console.firebase.google.com");
      } else if (error.code === "unauthenticated") {
        errorMsg = "Not authenticated! Please login again.";
        setTimeout(() => (window.location.href = "login.html"), 2000);
      }

      window.loadSwal(() => {
        Swal.fire({
          icon: "error",
          title: "Gagal Menyimpan!",
          text: errorMsg,
          confirmButtonColor: "#7f1d1d",
        });
      });
    }
  }

  // ========================================
  // VIEW MANAGEMENT
  // ========================================
  function hideAllViews() {
    console.log("🔒 Hiding all views...");

    const tableView = document.getElementById("tableView");
    const formView = document.getElementById("formView");
    const previewView = document.getElementById("previewView");
    const successPopup = document.getElementById("successPopup");

    if (tableView) {
      tableView.classList.remove("active");
      tableView.style.display = "none";
    }
    if (formView) {
      formView.classList.remove("active");
      formView.style.display = "none";
    }
    if (previewView) {
      previewView.classList.remove("active");
      previewView.style.display = "none";
    }
    if (successPopup) {
      successPopup.classList.remove("active");
      successPopup.style.display = "none";
    }
  }

  function showTableView() {
    console.log("📋 Showing table view...");
    hideAllViews();

    const tableView = document.getElementById("tableView");
    if (tableView) {
      tableView.style.display = "block";
      tableView.classList.add("active");
    }
  }

  function showFormView() {
    console.log("📝 Showing form view...");
    hideAllViews();

    const formView = document.getElementById("formView");
    if (formView) {
      formView.style.display = "block";
      formView.classList.add("active");
    }
  }

  function showPreviewView() {
    console.log("👁️ Showing preview view...");
    hideAllViews();

    const previewView = document.getElementById("previewView");
    if (previewView) {
      previewView.style.display = "block";
      previewView.classList.add("active");
    }
  }

  // ========================================
  // BACK TO TABLE VIEW
  // ========================================
  window.backToTableView = function () {
    console.log("🔙 Back to table view...");

    showTableView();
    resetNotaDinasForm();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ========================================
  // SETUP BACK BUTTONS
  // ========================================
  function setupBackButtons() {
    console.log("🔧 Setting up back buttons...");

    const backBtnForm = document.getElementById("backToTableViewForm");
    if (backBtnForm) {
      const newBackBtnForm = backBtnForm.cloneNode(true);
      backBtnForm.parentNode.replaceChild(newBackBtnForm, backBtnForm);

      newBackBtnForm.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        window.backToTableView();
      });
    }

    const backToTableFromPreview = document.getElementById(
      "backToTableFromPreview"
    );
    if (backToTableFromPreview) {
      const newBackBtn = backToTableFromPreview.cloneNode(true);
      backToTableFromPreview.parentNode.replaceChild(
        newBackBtn,
        backToTableFromPreview
      );

      newBackBtn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        window.backToTableView();
      });
    }
  }

  // ========================================
  // PAGINATION
  // ========================================
  function setupPagination() {
    const prevBtn = document.getElementById("prevPageBtn");
    const nextBtn = document.getElementById("nextPageBtn");

    if (prevBtn) {
      prevBtn.addEventListener("click", function () {
        if (currentPageNotaDinas > 1) {
          currentPageNotaDinas--;
          renderNotaDinasTable();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", async function () {
        const totalItems = (await getNotaDinasData()).length;
        const maxPage = Math.ceil(totalItems / itemsPerPageNotaDinas);
        if (currentPageNotaDinas < maxPage) {
          currentPageNotaDinas++;
          renderNotaDinasTable();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      });
    }
  }

  function updatePaginationInfo(totalItems) {
    const startIndex =
      totalItems > 0
        ? (currentPageNotaDinas - 1) * itemsPerPageNotaDinas + 1
        : 0;
    const endIndex = Math.min(
      currentPageNotaDinas * itemsPerPageNotaDinas,
      totalItems
    );

    const infoElement = document.getElementById("paginationInfo");
    if (infoElement) {
      infoElement.textContent = `Showing ${startIndex}-${endIndex} of ${totalItems}`;
    }

    const prevBtn = document.getElementById("prevPageBtn");
    const nextBtn = document.getElementById("nextPageBtn");
    const maxPage = Math.ceil(totalItems / itemsPerPageNotaDinas);

    if (prevBtn) prevBtn.disabled = currentPageNotaDinas === 1;
    if (nextBtn)
      nextBtn.disabled = currentPageNotaDinas >= maxPage || totalItems === 0;
  }

  // ========================================
  // FILTERS
  // ========================================
  function setupNotaDinasFilters() {
    const searchInput = document.getElementById("searchPerihal");
    const sifatFilter = document.getElementById("sifatFilter");
    const resetBtn = document.getElementById("resetBtn");

    searchInput?.addEventListener("input", function (e) {
      currentPageNotaDinas = 1;
      renderNotaDinasTable();
    });

    sifatFilter?.addEventListener("change", function () {
      currentPageNotaDinas = 1;
      renderNotaDinasTable();
    });

    resetBtn?.addEventListener("click", function () {
      if (sifatFilter) sifatFilter.selectedIndex = 0;
      if (searchInput) searchInput.value = "";
      selectedDate = null;

      const dateText = document.getElementById("selectedDateText");
      if (dateText) {
        dateText.textContent = "Semua Tanggal";
      }

      currentPageNotaDinas = 1;
      renderNotaDinasTable();
    });
  }

  // ========================================
  // CALENDAR
  // ========================================
  function setupCalendar() {
    const datePickerBtn = document.getElementById("datePickerBtn");
    const calendarModal = document.getElementById("calendarModal");
    const applyDateBtn = document.getElementById("applyDate");
    const prevMonthBtn = document.getElementById("prevMonth");
    const nextMonthBtn = document.getElementById("nextMonth");

    datePickerBtn?.addEventListener("click", function (e) {
      e.stopPropagation();
      calendarModal?.classList.add("active");
      renderCalendar();
    });

    calendarModal?.addEventListener("click", function (e) {
      if (e.target === calendarModal) {
        calendarModal.classList.remove("active");
      }
    });

    prevMonthBtn?.addEventListener("click", function () {
      currentMonth--;
      if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
      }
      renderCalendar();
    });

    nextMonthBtn?.addEventListener("click", function () {
      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
      renderCalendar();
    });

    applyDateBtn?.addEventListener("click", function () {
      if (selectedDate) {
        const dateText = selectedDate.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
        const dateTextEl = document.getElementById("selectedDateText");
        if (dateTextEl) {
          dateTextEl.textContent = dateText;
        }
        currentPageNotaDinas = 1;
        renderNotaDinasTable();
      }
      calendarModal?.classList.remove("active");
    });
  }

  function renderCalendar() {
    const calendarDays = document.getElementById("calendarDays");
    const calendarMonth = document.getElementById("calendarMonth");

    if (!calendarDays || !calendarMonth) return;

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    calendarMonth.textContent = `${monthNames[currentMonth]} ${currentYear}`;

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const today = new Date();

    calendarDays.innerHTML = "";

    for (let i = 0; i < firstDay; i++) {
      const emptyDay = document.createElement("button");
      emptyDay.className = "calendar-day empty";
      emptyDay.disabled = true;
      calendarDays.appendChild(emptyDay);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayButton = document.createElement("button");
      dayButton.className = "calendar-day";
      dayButton.textContent = day;

      const date = new Date(currentYear, currentMonth, day);

      if (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      ) {
        dayButton.classList.add("today");
      }

      if (
        selectedDate &&
        date.getDate() === selectedDate.getDate() &&
        date.getMonth() === selectedDate.getMonth() &&
        date.getFullYear() === selectedDate.getFullYear()
      ) {
        dayButton.classList.add("selected");
      }

      dayButton.addEventListener("click", function () {
        selectedDate = new Date(currentYear, currentMonth, day);
        renderCalendar();
      });

      calendarDays.appendChild(dayButton);
    }
  }

  // ========================================
  // TAMBAH BARU
  // ========================================
  window.tambahSurat = function () {
    isEditMode = false;
    currentNotaDinasId = null;

    const formTitle = document.getElementById("formMainTitle");
    if (formTitle) {
      formTitle.textContent = "Susun Nota Dinas";
    }

    showFormView();
    resetNotaDinasForm();
    goToStep(1);

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ========================================
  // FORM NAVIGATION
  // ========================================
  function setupFormNavigation() {
    // Called during initialization
  }

  function goToStep(step) {
    currentStep = step;
    const steps = document.querySelectorAll(".progress-steps .step");
    const stepContents = document.querySelectorAll(".step-content");

    steps.forEach((s) => s.classList.remove("active"));
    stepContents.forEach((c) => c.classList.remove("active"));

    const activeStep = document.querySelector(
      `.progress-steps [data-step="${step}"]`
    );
    const activeContent = document.getElementById(`step${step}Content`);

    if (activeStep) activeStep.classList.add("active");
    if (activeContent) activeContent.classList.add("active");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  window.goToStep1 = function () {
    goToStep(1);
  };

  window.goToStep2 = function () {
    if (!validateStep1()) return;
    saveStep1Data();
    goToStep(2);
  };

  window.goToStep3 = function () {
    if (!validateStep2()) return;
    saveStep2Data();
    updatePreview();
    goToStep(3);
  };

  function validateStep1() {
    const fields = [
      "namaPengirim",
      "jabatanPengirim",
      "jenisNaskah",
      "sifatNaskah",
      "nomorNaskah",
      "perihal",
      "tanggalSurat",
    ];
    for (const field of fields) {
      const input = document.getElementById(field);
      if (input && !input.value.trim()) {
        Notification.error(
          `Mohon lengkapi kolom ${
            document.querySelector(`label[for="${field}"]`)?.textContent ||
            field
          }!`
        );
        input.focus();
        return false;
      }
    }

    const fileInput = document.getElementById("fileInput");
    if (!isEditMode && !fileInput.files[0] && !notaDinasFormState.fileName) {
      Notification.error("Mohon upload file naskah!");
      return false;
    }

    return true;
  }

  function validateStep2() {
    const ditujukanKepada = document.getElementById("ditujukanKepada").value;

    if (!ditujukanKepada) {
      Notification.error("Mohon pilih tujuan nota dinas!");
      document.getElementById("ditujukanKepada").focus();
      return false;
    }

    return true;
  }

  function saveStep1Data() {
    notaDinasFormState.namaPengirim =
      document.getElementById("namaPengirim").value;
    notaDinasFormState.jabatanPengirim =
      document.getElementById("jabatanPengirim").value;
    notaDinasFormState.jenisNaskah =
      document.getElementById("jenisNaskah").value;
    notaDinasFormState.sifatNaskah =
      document.getElementById("sifatNaskah").value;
    notaDinasFormState.nomorNaskah =
      document.getElementById("nomorNaskah").value;
    notaDinasFormState.perihal = document.getElementById("perihal").value;
    notaDinasFormState.tanggalSurat =
      document.getElementById("tanggalSurat").value;
    notaDinasFormState.catatan = document.getElementById("catatan").value;

    const fileInput = document.getElementById("fileInput");
    if (fileInput.files[0]) {
      notaDinasFormState.uploadedFile = fileInput.files[0];
      notaDinasFormState.fileName = fileInput.files[0].name;
    }
  }

  function saveStep2Data() {
    notaDinasFormState.ditujukanKepada =
      document.getElementById("ditujukanKepada").value;
    notaDinasFormState.tenggatWaktu =
      document.getElementById("tenggatWaktu").value;
    notaDinasFormState.catatanTujuan =
      document.getElementById("catatanTujuan").value;
  }

  function updatePreview() {
    const formatDate = (dateStr) => {
      if (!dateStr) return "-";
      try {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          });
        }
      } catch (e) {
        return dateStr;
      }
      return dateStr;
    };

    document.getElementById("previewNamaPengirim").textContent =
      notaDinasFormState.namaPengirim || "-";
    document.getElementById("previewJabatanPengirim").textContent =
      notaDinasFormState.jabatanPengirim || "-";
    document.getElementById("previewJenisNaskahForm").textContent =
      notaDinasFormState.jenisNaskah || "-";

    const sifatBadge = document.getElementById("previewSifatNaskah");
    if (sifatBadge) {
      let badgeClass = "badge-umum";
      const sifat = notaDinasFormState.sifatNaskah || "Umum";
      if (sifat === "Rahasia") badgeClass = "badge-rahasia";
      else if (sifat === "Sangat Rahasia") badgeClass = "badge-sangat-rahasia";
      else if (sifat === "Penting") badgeClass = "badge-penting";

      sifatBadge.className = `badge-sifat ${badgeClass}`;
      sifatBadge.textContent = sifat;
    }

    document.getElementById("previewNomorNaskah").textContent =
      notaDinasFormState.nomorNaskah || "-";
    document.getElementById("previewPerihal").textContent =
      notaDinasFormState.perihal || "-";
    document.getElementById("previewTanggalSuratForm").textContent = formatDate(
      notaDinasFormState.tanggalSurat
    );
    document.getElementById("previewCatatan").textContent =
      notaDinasFormState.catatan || "-";

    const fileNameEl = document.getElementById("previewFileNameForm");
    if (fileNameEl) {
      fileNameEl.textContent = notaDinasFormState.fileName || "Tidak ada file";
    }

    document.getElementById("previewTujuan").textContent =
      notaDinasFormState.ditujukanKepada || "-";
    document.getElementById("previewTenggatWaktu").textContent = formatDate(
      notaDinasFormState.tenggatWaktu
    );
    document.getElementById("previewCatatanTujuan").textContent =
      notaDinasFormState.catatanTujuan || "-";
  }

  // ========================================
  // FILE UPLOAD HANDLER - FIXED
  // ========================================
  function setupFileUploadHandler() {
    console.log("🔧 Setting up file upload handler...");

    const fileInput = document.getElementById("fileInput");
    const uploadArea = document.getElementById("uploadArea");

    if (!fileInput) {
      console.warn("⚠️ File input not found");
      return;
    }

    if (!uploadArea) {
      console.warn("⚠️ Upload area not found");
      return;
    }

    // Remove old event listeners by cloning
    const newFileInput = fileInput.cloneNode(true);
    fileInput.parentNode.replaceChild(newFileInput, fileInput);

    const newUploadArea = uploadArea.cloneNode(true);
    uploadArea.parentNode.replaceChild(newUploadArea, uploadArea);

    // Click upload area to trigger file input
    newUploadArea.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      console.log("📁 Upload area clicked");
      newFileInput.click();
    });

    // Handle file selection
    newFileInput.addEventListener("change", function (e) {
      console.log("📎 File input changed");
      handleFileSelect(e);
    });

    // Drag & drop support
    newUploadArea.addEventListener("dragover", function (e) {
      e.preventDefault();
      e.stopPropagation();
      newUploadArea.classList.add("drag-over");
    });

    newUploadArea.addEventListener("dragleave", function (e) {
      e.preventDefault();
      e.stopPropagation();
      newUploadArea.classList.remove("drag-over");
    });

    newUploadArea.addEventListener("drop", function (e) {
      e.preventDefault();
      e.stopPropagation();
      newUploadArea.classList.remove("drag-over");

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        newFileInput.files = files;
        handleFileSelect({ target: { files: files } });
      }
    });

    console.log("✅ File upload handler setup completed");
  }

  function handleFileSelect(event) {
    const file = event.target.files[0];

    if (!file) {
      console.log("⚠️ No file selected");
      return;
    }

    console.log("📎 File selected:", file.name, file.type, file.size);

    // Validate file type
    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];

    if (!validTypes.includes(file.type)) {
      console.error("❌ Invalid file type:", file.type);

      if (window.Swal) {
        Swal.fire({
          icon: "error",
          title: "Tipe File Tidak Didukung!",
          text: "Hanya file PDF, DOC, DOCX, JPG, PNG yang diperbolehkan",
          confirmButtonColor: "#7f1d1d",
        });
      } else {
        alert("Tipe file tidak didukung! Gunakan PDF, Word, atau gambar.");
      }

      event.target.value = "";
      return;
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      console.error("❌ File too large:", file.size);

      if (window.Swal) {
        Swal.fire({
          icon: "error",
          title: "File Terlalu Besar!",
          text: "Ukuran file maksimal 50MB",
          confirmButtonColor: "#7f1d1d",
        });
      } else {
        alert("File terlalu besar! Maksimal 50MB");
      }

      event.target.value = "";
      return;
    }

    // Store file
    window.uploadedFile = file;
    notaDinasFormState.uploadedFile = file;
    notaDinasFormState.fileName = file.name;

    console.log("✅ File stored:", notaDinasFormState.fileName);

    // Display file info
    displayFileInfo(file);

    // Show success notification
    if (window.Swal) {
      Swal.fire({
        icon: "success",
        title: "File Berhasil Diunggah!",
        text: file.name,
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: "top-end",
      });
    }
  }

  function displayFileInfo(file) {
    const fileInfoDisplay = document.getElementById("fileInfoDisplay");
    const uploadContent = document.getElementById("uploadContent");
    const uploadArea = document.getElementById("uploadArea");

    if (!fileInfoDisplay || !uploadContent) {
      console.error("❌ File display elements not found");
      return;
    }

    console.log("📋 Displaying file info:", file.name);

    // Calculate file size
    const fileSize = (file.size / 1024).toFixed(2);
    const fileSizeText =
      fileSize > 1024 ? `${(fileSize / 1024).toFixed(2)} MB` : `${fileSize} KB`;

    // Determine icon
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

    // Hide upload content
    uploadContent.style.display = "none";

    // Show file info
    fileInfoDisplay.innerHTML = `
      <div class="file-item" style="display: flex; align-items: center; gap: 12px; padding: 16px; background: #f9fafb; border-radius: 8px;">
        <i class="bi ${iconClass}" style="font-size: 32px; color: ${iconColor};"></i>
        <div class="file-details" style="flex: 1;">
          <div class="file-name" style="font-weight: 500; color: #1f2937; margin-bottom: 4px;">${file.name}</div>
          <div class="file-size" style="font-size: 12px; color: #6b7280;">${fileSizeText}</div>
        </div>
        <button class="file-remove" onclick="removeFile()" type="button" style="padding: 8px; background: #fee2e2; color: #dc2626; border: none; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center;" title="Hapus file">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>
    `;

    fileInfoDisplay.style.display = "block";

    if (uploadArea) {
      uploadArea.classList.add("has-file");
    }

    console.log("✅ File info displayed");
  }

  window.removeFile = function (event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    console.log("🗑️ Removing file...");

    const fileInput = document.getElementById("fileInput");
    const fileInfoDisplay = document.getElementById("fileInfoDisplay");
    const uploadContent = document.getElementById("uploadContent");
    const uploadArea = document.getElementById("uploadArea");

    if (fileInput) fileInput.value = "";

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
    notaDinasFormState.uploadedFile = null;
    notaDinasFormState.fileName = null;

    console.log("✅ File removed");
  };

  // ========================================
  // SUCCESS POPUP
  // ========================================
  function showSuccessPopup() {
    hideAllViews();
    const successPopup = document.getElementById("successPopup");
    if (successPopup) {
      successPopup.style.display = "flex";
      successPopup.classList.add("active");
    }
  }

  window.closeSuccessPopupAndBack = function () {
    const successPopup = document.getElementById("successPopup");
    if (successPopup) {
      successPopup.classList.remove("active");
      successPopup.style.display = "none";
    }

    window.backToTableView();
  };

  function setupPopupOutsideClick() {
    const successPopup = document.getElementById("successPopup");
    if (successPopup) {
      successPopup.addEventListener("click", function (e) {
        if (e.target === successPopup) {
          closeSuccessPopupAndBack();
        }
      });
    }
  }

  // ========================================
  // RESET FORM
  // ========================================
  function resetNotaDinasForm() {
    console.log("🔄 Resetting Form...");

    isEditMode = false;
    currentNotaDinasId = null;
    currentStep = 1;

    notaDinasFormState = {
      uploadedFile: null,
      fileName: null,
    };

    const formInputs = [
      "namaPengirim",
      "jabatanPengirim",
      "jenisNaskah",
      "sifatNaskah",
      "nomorNaskah",
      "perihal",
      "tanggalSurat",
      "catatan",
      "ditujukanKepada",
      "tenggatWaktu",
      "catatanTujuan",
    ];

    formInputs.forEach((inputId) => {
      const input = document.getElementById(inputId);
      if (input) {
        if (input.tagName === "SELECT") {
          input.selectedIndex = 0;
        } else {
          input.value = "";
        }
      }
    });

    const fileInput = document.getElementById("fileInput");
    if (fileInput) fileInput.value = "";

    const fileInfoDisplay = document.getElementById("fileInfoDisplay");
    const uploadContent = document.getElementById("uploadContent");

    if (fileInfoDisplay) {
      fileInfoDisplay.innerHTML = "";
      fileInfoDisplay.style.display = "none";
    }

    if (uploadContent) {
      uploadContent.style.display = "flex";
    }

    const formTitle = document.getElementById("formMainTitle");
    if (formTitle) {
      formTitle.textContent = "Susun Nota Dinas";
    }

    goToStep(1);
  }

  // ========================================
  // PDF & PRINT
  // ========================================
  window.downloadPDF = function () {
    Notification.info("Fitur download PDF akan segera tersedia");
  };

  window.printSurat = function () {
    window.print();
  };

  // ========================================
  // CLEANUP
  // ========================================
  window.addEventListener("beforeunload", () => {
    if (unsubscribeNotaDinas) {
      console.log("🧹 Cleaning up real-time listener");
      unsubscribeNotaDinas();
    }
  });

  // ========================================
  // AUTO INIT
  // ========================================
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", window.initializePage);
  } else {
    window.initializePage();
  }

  console.log("✅ Nota Dinas Script Loaded - Firebase Real-time");
})();
