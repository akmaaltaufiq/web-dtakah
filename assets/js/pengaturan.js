// =============================
// PENGATURAN - PAGE SPECIFIC
// =============================
(function () {
  "use strict";

  // =============================
  // INITIALIZATION
  // =============================
  window.initializePage = function () {
    console.log("Pengaturan Page Initialized");
    setupPengaturanEvents();
  };

  // =============================
  // EVENT HANDLERS
  // =============================
  function setupPengaturanEvents() {
    // Photo upload
    const photoInput = document.getElementById("photoInput");
    if (photoInput) {
      photoInput.addEventListener("change", handlePhotoUpload);
    }

    // Edit button already handled by global function
  }

  function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (event) {
        const photoCircle = document.querySelector(".photo-circle");
        if (photoCircle) {
          photoCircle.innerHTML = `<img src="${event.target.result}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
        }
      };
      reader.readAsDataURL(file);
    }
  }

  // =============================
  // EDIT ACCOUNT FUNCTION
  // =============================
  window.enableEdit = function () {
    const inputs = document.querySelectorAll(".form-input");
    const button = document.querySelector(".edit-button");

    if (button && button.textContent === "Edit Akun") {
      inputs.forEach((input) => {
        input.disabled = false;
        input.style.background = "white";
      });
      button.textContent = "Simpan Perubahan";
      button.style.background = "#28a745";
    } else if (button) {
      inputs.forEach((input) => {
        input.disabled = true;
        input.style.background = "#f8f9fa";
      });
      button.textContent = "Edit Akun";
      button.style.background = "#8b0000";

      // Save to localStorage/database here if needed
      Notification.success("Perubahan berhasil disimpan!");
    }
  };
})();
