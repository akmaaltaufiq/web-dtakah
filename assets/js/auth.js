// ==========================================
// FIREBASE AUTHENTICATION - FIXED VERSION
// File: assets/js/auth.js
// ==========================================

// ============================================
// FUNGSI REGISTER USER (DENGAN AUTO LOGOUT)
// ============================================
function registerUser(email, password, role, nama) {
  console.log("📝 Registering user:", { email, role, nama });

  // Set flag registering
  sessionStorage.setItem("isRegistering", "true");

  return auth
    .createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      console.log("✅ User created in Auth:", user.uid);

      // Simpan data user ke Firestore
      return db.collection("users").doc(user.uid).set({
        email: email,
        role: role, // 'admin' atau 'kapus'
        nama: nama,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    })
    .then(() => {
      console.log("✅ User data saved to Firestore");

      // PENTING: Logout otomatis setelah registrasi
      return auth.signOut();
    })
    .then(() => {
      console.log("✅ Auto logout after registration");

      // Remove flag
      sessionStorage.removeItem("isRegistering");

      alert(
        `✅ User berhasil didaftarkan!\n\n` +
          `Email: ${email}\n` +
          `Role: ${role}\n\n` +
          `Silakan login dengan akun yang baru dibuat.`
      );

      return true;
    })
    .catch((error) => {
      console.error("❌ Registration error:", error);

      // Remove flag jika error
      sessionStorage.removeItem("isRegistering");

      let errorMessage = "Terjadi kesalahan saat registrasi.";

      if (error.code === "auth/email-already-in-use") {
        errorMessage = "Email sudah terdaftar!";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password terlalu lemah! Minimal 6 karakter.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Format email tidak valid!";
      }

      alert(`❌ ${errorMessage}\n\nDetail: ${error.message}`);
      throw error;
    });
}

// ============================================
// FUNGSI LOGIN
// ============================================
function loginUser(email, password) {
  console.log("🔐 Attempting login for:", email);

  // Show loading jika ada
  if (window.showLoading) {
    window.showLoading();
  }

  return auth
    .signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      console.log("✅ Login successful:", user.email);

      // Ambil data user dari Firestore
      return db.collection("users").doc(user.uid).get();
    })
    .then((doc) => {
      if (doc.exists) {
        const userData = doc.data();
        console.log("✅ User data retrieved:", userData);

        // Simpan ke sessionStorage untuk referensi cepat
        sessionStorage.setItem(
          "currentUser",
          JSON.stringify({
            uid: auth.currentUser.uid,
            email: auth.currentUser.email,
            role: userData.role,
            nama: userData.nama,
          })
        );

        // Redirect berdasarkan role
        setTimeout(() => {
          if (userData.role === "admin") {
            window.location.href = "index.html";
          } else if (userData.role === "kapus") {
            window.location.href = "dashboard-kapus.html";
          } else {
            alert("⚠️ Role tidak dikenali!");
            logoutUser();
          }
        }, 500);
      } else {
        throw new Error("Data user tidak ditemukan di database!");
      }
    })
    .catch((error) => {
      console.error("❌ Login error:", error);

      if (window.hideLoading) {
        window.hideLoading();
      }

      let errorMessage = "Login gagal!";

      if (error.code === "auth/user-not-found") {
        errorMessage = "Email tidak terdaftar!";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Password salah!";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Format email tidak valid!";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage =
          "Terlalu banyak percobaan login!\nSilakan coba lagi nanti.";
      } else if (error.code === "auth/invalid-credential") {
        errorMessage = "Email atau password salah!";
      }

      alert(`❌ ${errorMessage}`);

      // Clear password field
      const passwordInput = document.getElementById("password");
      if (passwordInput) {
        passwordInput.value = "";
        passwordInput.focus();
      }

      throw error;
    });
}

// ============================================
// FUNGSI LOGOUT
// ============================================
function logoutUser() {
  console.log("🚪 Logging out...");

  return auth
    .signOut()
    .then(() => {
      console.log("✅ User logged out");

      // Clear all storage
      sessionStorage.clear();
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("userData");

      // Show notification jika SweetAlert tersedia
      if (window.Swal) {
        Swal.fire({
          title: "Logout Berhasil",
          text: "Anda akan diarahkan ke halaman login",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
      }

      // Redirect ke login
      setTimeout(() => {
        window.location.href = "login.html";
      }, 1500);
    })
    .catch((error) => {
      console.error("❌ Logout error:", error);
      alert("Terjadi kesalahan saat logout");
    });
}

// ============================================
// CEK STATUS LOGIN (AUTO REDIRECT) - FIXED
// ============================================
function checkAuthState() {
  // PENTING: Jangan redirect jika sedang registrasi
  const isRegistering = sessionStorage.getItem("isRegistering");

  if (isRegistering === "true") {
    console.log("⏸️ Registration in progress, skipping auto-redirect");
    return;
  }

  auth.onAuthStateChanged((user) => {
    const currentPage = window.location.pathname;
    const isLoginPage = currentPage.includes("login.html");

    console.log("🔍 Auth state changed:", {
      user: user ? user.email : "Not logged in",
      currentPage: currentPage,
      isLoginPage: isLoginPage,
      isRegistering: isRegistering,
    });

    if (!user && !isLoginPage) {
      // User belum login dan bukan di halaman login
      console.log("⚠️ User not authenticated, redirecting to login...");
      window.location.href = "login.html";
    } else if (user && isLoginPage && !isRegistering) {
      // User sudah login tapi masih di halaman login (dan tidak sedang registrasi)
      console.log("🔄 User already logged in, redirecting to dashboard...");

      db.collection("users")
        .doc(user.uid)
        .get()
        .then((doc) => {
          if (doc.exists) {
            const userData = doc.data();

            if (userData.role === "admin") {
              window.location.href = "index.html";
            } else if (userData.role === "kapus") {
              window.location.href = "dashboard-kapus.html";
            }
          }
        })
        .catch((error) => {
          console.error("❌ Error getting user data:", error);
        });
    } else if (user) {
      // User sudah login dan di halaman yang benar
      console.log("✅ User authenticated:", user.email);

      // Update sessionStorage
      db.collection("users")
        .doc(user.uid)
        .get()
        .then((doc) => {
          if (doc.exists) {
            const userData = doc.data();
            sessionStorage.setItem(
              "currentUser",
              JSON.stringify({
                uid: user.uid,
                email: user.email,
                role: userData.role,
                nama: userData.nama,
              })
            );
          }
        });
    }
  });
}

// ============================================
// CEK ROLE USER (untuk proteksi halaman)
// ============================================
function checkUserRole(allowedRoles) {
  return new Promise((resolve, reject) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        console.log("⚠️ No user logged in");
        window.location.href = "login.html";
        reject("No user logged in");
        unsubscribe(); // Cleanup listener
        return;
      }

      db.collection("users")
        .doc(user.uid)
        .get()
        .then((doc) => {
          if (!doc.exists) {
            console.error("❌ User data not found");
            alert("Data user tidak ditemukan!");
            logoutUser();
            reject("User data not found");
            unsubscribe(); // Cleanup listener
            return;
          }

          const userData = doc.data();
          const userRole = userData.role;

          console.log("🔐 Checking role:", {
            userRole: userRole,
            allowedRoles: allowedRoles,
          });

          if (!allowedRoles.includes(userRole)) {
            console.warn("⚠️ Access denied for role:", userRole);
            alert(
              `⚠️ Anda tidak memiliki akses ke halaman ini!\n\nRole Anda: ${userRole}`
            );

            // Redirect ke dashboard sesuai role
            if (userRole === "admin") {
              window.location.href = "index.html";
            } else if (userRole === "kapus") {
              window.location.href = "dashboard-kapus.html";
            } else {
              window.location.href = "login.html";
            }

            reject("Access denied");
            unsubscribe(); // Cleanup listener
          } else {
            console.log("✅ Access granted for role:", userRole);
            resolve(userData);
            unsubscribe(); // Cleanup listener
          }
        })
        .catch((error) => {
          console.error("❌ Error checking role:", error);
          reject(error);
          unsubscribe(); // Cleanup listener
        });
    });
  });
}

// ============================================
// GET CURRENT USER DATA
// ============================================
function getCurrentUserData() {
  return new Promise((resolve, reject) => {
    // Cek cache di sessionStorage dulu
    const cachedUser = sessionStorage.getItem("currentUser");
    if (cachedUser) {
      try {
        const userData = JSON.parse(cachedUser);
        console.log("✅ User data from cache:", userData);
        resolve(userData);
        return;
      } catch (e) {
        console.warn("⚠️ Invalid cached user data");
      }
    }

    // Jika tidak ada cache, ambil dari Firebase
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        console.log("⚠️ No user logged in");
        reject("No user logged in");
        unsubscribe(); // Cleanup listener
        return;
      }

      db.collection("users")
        .doc(user.uid)
        .get()
        .then((doc) => {
          if (doc.exists) {
            const userData = {
              uid: user.uid,
              email: user.email,
              ...doc.data(),
            };

            // Cache ke sessionStorage
            sessionStorage.setItem("currentUser", JSON.stringify(userData));

            console.log("✅ User data from Firebase:", userData);
            resolve(userData);
            unsubscribe(); // Cleanup listener
          } else {
            reject("User data not found");
            unsubscribe(); // Cleanup listener
          }
        })
        .catch((error) => {
          reject(error);
          unsubscribe(); // Cleanup listener
        });
    });
  });
}

// ============================================
// UPDATE USER PROFILE
// ============================================
function updateUserProfile(updates) {
  return new Promise((resolve, reject) => {
    const user = auth.currentUser;

    if (!user) {
      reject("No user logged in");
      return;
    }

    db.collection("users")
      .doc(user.uid)
      .update({
        ...updates,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      })
      .then(() => {
        console.log("✅ User profile updated");

        // Clear cache
        sessionStorage.removeItem("currentUser");

        resolve(true);
      })
      .catch((error) => {
        console.error("❌ Error updating profile:", error);
        reject(error);
      });
  });
}

// ============================================
// HELPER: CLEAR SESSION (untuk logout manual)
// ============================================
function clearUserSession() {
  console.log("🧹 Clearing user session...");
  sessionStorage.clear();
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("userData");
  localStorage.removeItem("currentUser");
}

// ============================================
// EXPORT TO GLOBAL SCOPE
// ============================================
if (typeof window !== "undefined") {
  window.registerUser = registerUser;
  window.loginUser = loginUser;
  window.logoutUser = logoutUser;
  window.checkAuthState = checkAuthState;
  window.checkUserRole = checkUserRole;
  window.getCurrentUserData = getCurrentUserData;
  window.updateUserProfile = updateUserProfile;
  window.clearUserSession = clearUserSession;
}

console.log("✅ Auth.js loaded successfully");
