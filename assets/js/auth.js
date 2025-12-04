// ==========================================
// FIREBASE AUTHENTICATION - COMPLETE FIX
// File: assets/js/auth.js
// ==========================================

// ============================================
// FUNGSI REGISTER USER
// ============================================
function registerUser(email, password, role, nama) {
  console.log("📝 Registering user:", { email, role, nama });

  sessionStorage.setItem("isRegistering", "true");

  return auth
    .createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      console.log("✅ User created in Auth:", user.uid);

      return db.collection("users").doc(user.uid).set({
        email: email,
        role: role,
        nama: nama,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    })
    .then(() => {
      console.log("✅ User data saved to Firestore");
      return auth.signOut();
    })
    .then(() => {
      console.log("✅ Auto logout after registration");
      sessionStorage.removeItem("isRegistering");

      alert(
        `✅ User berhasil didaftarkan!\n\nEmail: ${email}\nRole: ${role}\n\nSilakan login dengan akun yang baru dibuat.`
      );

      return true;
    })
    .catch((error) => {
      console.error("❌ Registration error:", error);
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
// FUNGSI LOGIN - NO REDIRECT, RETURN URL
// ============================================
function loginUser(email, password) {
  console.log("🔐 Attempting login for:", email);

  // Set flag untuk prevent auto-redirect dari checkAuthState
  sessionStorage.setItem("loginInProgress", "true");

  if (window.showLoading) {
    window.showLoading();
  }

  return auth
    .signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      console.log("✅ Login successful:", user.email);

      return db.collection("users").doc(user.uid).get();
    })
    .then((doc) => {
      if (!doc.exists) {
        throw new Error("Data user tidak ditemukan di database!");
      }

      const userData = doc.data();
      console.log("✅ User data retrieved:", userData);

      // Save to session
      sessionStorage.setItem(
        "currentUser",
        JSON.stringify({
          uid: auth.currentUser.uid,
          email: auth.currentUser.email,
          role: userData.role,
          nama: userData.nama,
        })
      );

      // PENTING: Set flag freshLogin UNTUK checkAuthState nanti
      sessionStorage.setItem("freshLogin", "true");
      sessionStorage.removeItem("loginInProgress");

      // Return URL berdasarkan role (TIDAK redirect di sini)
      if (userData.role === "admin") {
        return "index.html";
      } else if (userData.role === "kapus") {
        return "dashboard-kapus.html";
      } else {
        throw new Error("Role tidak dikenali!");
      }
    })
    .catch((error) => {
      console.error("❌ Login error:", error);

      sessionStorage.removeItem("loginInProgress");

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
      } else if (error.message) {
        errorMessage = error.message;
      }

      alert(`❌ ${errorMessage}`);

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

  sessionStorage.clear();
  localStorage.clear();
  console.log("✅ Storage cleared");

  return auth
    .signOut()
    .then(() => {
      console.log("✅ Firebase signOut successful");

      if (window.Swal) {
        Swal.fire({
          title: "Logout Berhasil",
          text: "Anda akan diarahkan ke halaman login",
          icon: "success",
          timer: 1000,
          showConfirmButton: false,
        });
      }

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
      sessionStorage.clear();
      localStorage.clear();
      window.location.replace("login.html?logout=true");
    });
}

// ============================================
// CEK STATUS LOGIN - TANPA AUTO REDIRECT DI LOGIN PAGE
// ============================================
function checkAuthState() {
  const currentPage = window.location.pathname;
  const isLoginPage = currentPage.includes("login.html");

  console.log("🔍 Checking auth state on:", currentPage);

  // KHUSUS LOGIN PAGE - CLEAR AUTH JIKA DARI LOGOUT
  if (isLoginPage) {
    const urlParams = new URLSearchParams(window.location.search);
    const isFromLogout = urlParams.get("logout") === "true";

    if (isFromLogout) {
      console.log("🔒 Detected logout, clearing auth...");
      sessionStorage.clear();
      localStorage.clear();

      auth.signOut().then(() => {
        window.history.replaceState({}, document.title, "login.html");
      });

      return; // STOP - jangan setup listener
    }

    // JANGAN setup onAuthStateChanged di login page untuk avoid conflict
    console.log("⏸️ Skipping auth listener on login page");
    return;
  }

  // Jika sedang registrasi, skip
  const isRegistering = sessionStorage.getItem("isRegistering");
  if (isRegistering === "true") {
    console.log("⏸️ Registration in progress");
    return;
  }

  // HANYA untuk NON-LOGIN pages, check auth
  auth.onAuthStateChanged((user) => {
    console.log("🔍 Auth state changed (non-login page):", {
      user: user ? user.email : "Not logged in",
      currentPage: currentPage,
    });

    if (!user) {
      console.log("⚠️ No user, redirect to login");
      window.location.href = "login.html";
    } else {
      console.log("✅ User authenticated:", user.email);

      // Update cache
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
// CEK ROLE USER
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
