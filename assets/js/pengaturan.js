// =============================
// PENGATURAN.JS - FIXED VERSION
// Load User Profile Based on Role
// =============================
(function () {
  "use strict";

  console.log("⚙️ pengaturan.js loading...");

  // =============================
  // GLOBAL STATE
  // =============================
  let currentUserData = null;

  // =============================
  // INITIALIZATION
  // =============================
  window.initializePage = function () {
    console.log("🚀 Initializing Pengaturan page...");
    loadUserProfile();
    setupPengaturanEvents();
  };

  // =============================
  // LOAD USER PROFILE
  // =============================
  function loadUserProfile() {
    console.log("👤 Loading user profile...");

    // Wait for Firebase auth
    if (!firebase.auth().currentUser) {
      console.log("⏳ Waiting for Firebase auth...");
      setTimeout(loadUserProfile, 300);
      return;
    }

    const user = firebase.auth().currentUser;
    const userEmail = user.email;

    // Get user data from Firestore
    db.collection("users")
      .where("email", "==", userEmail)
      .limit(1)
      .get()
      .then((snapshot) => {
        if (snapshot.empty) {
          console.warn("⚠️ User not found in Firestore");
          return;
        }

        const userData = snapshot.docs[0].data();
        currentUserData = { id: snapshot.docs[0].id, ...userData };

        console.log("✅ User profile loaded:", currentUserData);

        // Populate form fields
        populateProfileForm(currentUserData);
      })
      .catch((error) => {
        console.error("❌ Error loading user profile:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Gagal memuat profil: " + error.message,
        });
      });
  }

  // =============================
  // POPULATE PROFILE FORM
  // =============================
  function populateProfileForm(userData) {
    console.log("📝 Populating profile form...");

    // Basic info
    const namaInput = document.getElementById("nama");
    const emailInput = document.getElementById("email");
    const nrpInput = document.getElementById("nrp");
    const jabatanInput = document.getElementById("jabatan");
    const unitInput = document.getElementById("unit");
    const teleponInput = document.getElementById("telepon");
    const alamatInput = document.getElementById("alamat");

    if (namaInput) namaInput.value = userData.nama || userData.name || "";
    if (emailInput) emailInput.value = userData.email || "";
    if (nrpInput) nrpInput.value = userData.nrp || userData.nip || "";
    if (jabatanInput) {
      jabatanInput.value =
        userData.jabatan ||
        (userData.role === "kapus" ? "Kepala Pusat" : "Administrator");
    }
    if (unitInput) {
      unitInput.value =
        userData.unit || userData.bagian || "Balai Sistem Informasi Pertahanan";
    }
    if (teleponInput)
      teleponInput.value = userData.telepon || userData.phone || "";
    if (alamatInput)
      alamatInput.value = userData.alamat || userData.address || "";

    // Role display
    const roleDisplay = document.getElementById("roleDisplay");
    if (roleDisplay) {
      const roleName =
        userData.role === "kapus" ? "Kepala Pusat" : "Administrator";
      roleDisplay.textContent = roleName;
    }

    // Photo/Avatar
    const photoCircle = document.querySelector(".photo-circle");
    if (photoCircle && userData.photoURL) {
      photoCircle.innerHTML = `<img src="${userData.photoURL}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
    }

    console.log("✅ Profile form populated");
  }

  // =============================
  // EVENT HANDLERS
  // =============================
  function setupPengaturanEvents() {
    console.log("🎨 Setting up event handlers...");

    // Photo upload
    const photoInput = document.getElementById("photoInput");
    if (photoInput) {
      photoInput.addEventListener("change", handlePhotoUpload);
    }

    // Save button handled by enableEdit function
    console.log("✅ Event handlers setup complete");
  }

  // =============================
  // PHOTO UPLOAD HANDLER
  // =============================
  function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    console.log("📸 Photo selected:", file.name);

    // Validate file type
    if (!file.type.startsWith("image/")) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "File harus berupa gambar (JPG, PNG, dll)",
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Ukuran file maksimal 2MB",
      });
      return;
    }

    // Preview image
    const reader = new FileReader();
    reader.onload = function (event) {
      const photoCircle = document.querySelector(".photo-circle");
      if (photoCircle) {
        photoCircle.innerHTML = `<img src="${event.target.result}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
      }
      console.log("✅ Photo preview updated");
    };
    reader.readAsDataURL(file);
  }

  // =============================
  // EDIT ACCOUNT FUNCTION
  // =============================
  window.enableEdit = function () {
    console.log("✏️ Edit button clicked");

    const inputs = document.querySelectorAll(".form-input");
    const button = document.querySelector(".edit-button");

    if (!button) return;

    if (button.textContent.includes("Edit")) {
      // Enable editing
      inputs.forEach((input) => {
        if (input.id !== "email") {
          // Email tidak bisa diedit
          input.disabled = false;
          input.style.background = "white";
        }
      });
      button.textContent = "Simpan Perubahan";
      button.style.background = "#28a745";
      console.log("✅ Edit mode enabled");
    } else {
      // Save changes
      saveProfileChanges(inputs, button);
    }
  };

  // =============================
  // SAVE PROFILE CHANGES
  // =============================
  function saveProfileChanges(inputs, button) {
    console.log("💾 Saving profile changes...");

    if (!currentUserData || !currentUserData.id) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Data pengguna tidak ditemukan",
      });
      return;
    }

    Swal.fire({
      title: "Menyimpan Perubahan...",
      html: "Mohon tunggu sebentar",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    // Collect form data
    const updatedData = {
      nama: document.getElementById("nama")?.value || "",
      nrp: document.getElementById("nrp")?.value || "",
      jabatan: document.getElementById("jabatan")?.value || "",
      unit: document.getElementById("unit")?.value || "",
      telepon: document.getElementById("telepon")?.value || "",
      alamat: document.getElementById("alamat")?.value || "",
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    // Update Firestore
    db.collection("users")
      .doc(currentUserData.id)
      .update(updatedData)
      .then(() => {
        console.log("✅ Profile updated successfully");

        // Disable inputs
        inputs.forEach((input) => {
          input.disabled = true;
          input.style.background = "#f8f9fa";
        });
        button.textContent = "Edit Akun";
        button.style.background = "#8b0000";

        // Update current user data
        Object.assign(currentUserData, updatedData);

        // Update header display
        if (window.updateHeaderUserInfo) {
          window.updateHeaderUserInfo();
        }

        // Update sidebar
        const sidebarUserName = document.getElementById("sidebarUserName");
        if (sidebarUserName) {
          sidebarUserName.textContent = updatedData.nama;
        }

        Swal.fire({
          icon: "success",
          title: "Berhasil!",
          text: "Perubahan profil berhasil disimpan",
          timer: 2000,
          showConfirmButton: false,
        });
      })
      .catch((error) => {
        console.error("❌ Error updating profile:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Gagal menyimpan perubahan: " + error.message,
        });
      });
  }

  // =============================
  // AUTO-INIT WHEN PAGE LOADS
  // =============================
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      // Wait for auth
      firebase.auth().onAuthStateChanged((user) => {
        if (user) {
          setTimeout(() => {
            if (window.initializePage) {
              window.initializePage();
            }
          }, 500);
        }
      });
    });
  }

  console.log("✅ pengaturan.js loaded");
})();
