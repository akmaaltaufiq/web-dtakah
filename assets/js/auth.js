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

        // Set flag bahwa user BARU SAJA LOGIN (bukan dari session lama)
        sessionStorage.setItem("freshLogin", "true");

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
// FUNGSI LOGOUT (DENGAN FORCE CLEAR + PERSISTENCE RESET)
// ============================================
function logoutUser() {
  console.log("🚪 Logging out...");

  // STEP 1: Clear storage DULU sebelum signOut
  sessionStorage.clear();
  localStorage.clear();
  console.log("✅ Storage cleared");

  // STEP 2: SignOut dari Firebase DAN hapus persistence
  return auth
    .signOut()
    .then(() => {
      console.log("✅ Firebase signOut successful");

      // STEP 2.5: Reset Firebase persistence ke NONE (penting!)
      return auth.setPersistence(firebase.auth.Auth.Persistence.NONE);
    })
    .then(() => {
      console.log("✅ Firebase persistence cleared");

      // STEP 3: Show notification (optional)
      if (window.Swal) {
        Swal.fire({
          title: "Logout Berhasil",
          text: "Anda akan diarahkan ke halaman login",
          icon: "success",
          timer: 1000,
          showConfirmButton: false,
        });
      }

      // STEP 4: TUNGGU sedikit, baru redirect
      return new Promise((resolve) => {
        setTimeout(() => {
          console.log("🔄 Redirecting to login...");
          window.location.replace("login.html?logout=true");
          resolve();
        }, 1200);
      });
    })
    .catch((error) => {
      console.error("❌ Logout error:", error);

      // Kalau error tetap redirect
      sessionStorage.clear();
      localStorage.clear();
      window.location.replace("login.html?logout=true");
    });
}

// ============================================
// CEK STATUS LOGIN - FULL REWRITE (FIX PERSISTENCE)
// ============================================
function checkAuthState() {
  const currentPage = window.location.pathname;
  const isLoginPage = currentPage.includes("login.html");

  console.log("🔍 Checking auth state on:", currentPage);

  // KHUSUS LOGIN PAGE: Cek dulu apakah dari logout atau fresh visit
  if (isLoginPage) {
    const urlParams = new URLSearchParams(window.location.search);
    const isFromLogout = urlParams.get("logout") === "true";
    const freshLogin = sessionStorage.getItem("freshLogin");

    console.log("📍 Login page checks:", { isFromLogout, freshLogin });

    // Jika dari logout ATAU belum pernah fresh login, PAKSA LOGOUT
    if (isFromLogout || !freshLogin) {
      console.log("🔒 Forcing complete logout on login page...");

      // Clear everything
      sessionStorage.clear();
      localStorage.clear();

      // Force signOut dan reset persistence
      auth
        .signOut()
        .then(() => {
          return auth.setPersistence(firebase.auth.Auth.Persistence.NONE);
        })
        .then(() => {
          console.log("✅ Complete logout done");
          // Clean URL
          window.history.replaceState({}, document.title, "login.html");
        })
        .catch((err) => {
          console.error("Logout error:", err);
        });

      // STOP di sini, jangan lanjut ke onAuthStateChanged
      return;
    }
  }

  // Jika sedang registrasi, skip
  const isRegistering = sessionStorage.getItem("isRegistering");
  if (isRegistering === "true") {
    console.log("⏸️ Registration in progress, skipping auth check");
    return;
  }

  // Normal auth state checking
  auth.onAuthStateChanged((user) => {
    console.log("🔍 Auth state changed:", {
      user: user ? user.email : "Not logged in",
      currentPage: currentPage,
      isLoginPage: isLoginPage,
    });

    if (!user && !isLoginPage) {
      // User belum login dan bukan di halaman login
      console.log("⚠️ User not authenticated, redirecting to login...");
      window.location.href = "login.html";
    } else if (user && isLoginPage) {
      // User sudah login tapi masih di halaman login
      // CEK: apakah ini fresh login?
      const freshLogin = sessionStorage.getItem("freshLogin");

      if (!freshLogin) {
        console.log("⏸️ Old session detected on login page, forcing logout...");
        // Paksa logout jika bukan fresh login
        sessionStorage.clear();
        localStorage.clear();
        auth.signOut().then(() => {
          return auth.setPersistence(firebase.auth.Auth.Persistence.NONE);
        });
        return;
      }

      console.log("🔄 Fresh login detected, redirecting to dashboard...");

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
        unsubscribe();
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
            unsubscribe();
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

            if (userRole === "admin") {
              window.location.href = "index.html";
            } else if (userRole === "kapus") {
              window.location.href = "dashboard-kapus.html";
            } else {
              window.location.href = "login.html";
            }

            reject("Access denied");
            unsubscribe();
          } else {
            console.log("✅ Access granted for role:", userRole);
            resolve(userData);
            unsubscribe();
          }
        })
        .catch((error) => {
          console.error("❌ Error checking role:", error);
          reject(error);
          unsubscribe();
        });
    });
  });
}

// ============================================
// GET CURRENT USER DATA
// ============================================
function getCurrentUserData() {
  return new Promise((resolve, reject) => {
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

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        console.log("⚠️ No user logged in");
        reject("No user logged in");
        unsubscribe();
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

            sessionStorage.setItem("currentUser", JSON.stringify(userData));

            console.log("✅ User data from Firebase:", userData);
            resolve(userData);
            unsubscribe();
          } else {
            reject("User data not found");
            unsubscribe();
          }
        })
        .catch((error) => {
          reject(error);
          unsubscribe();
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
// HELPER: CLEAR SESSION
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
