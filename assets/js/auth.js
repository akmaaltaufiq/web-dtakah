// ==========================================
// FIREBASE AUTHENTICATION - COMPLETE FIX v2.1
// File: assets/js/auth.js
// ==========================================

console.log("🔧 Loading auth.js v2.1...");

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
// FUNGSI LOGIN - FIXED WITH PROPER SESSION
// ============================================
function loginUser(email, password) {
  console.log("🔐 Login attempt for:", email);

  // Clear any stale sessions first
  sessionStorage.clear();

  // Set flag to prevent checkAuthState interference
  sessionStorage.setItem("loginInProgress", "true");

  if (window.showLoading) {
    window.showLoading();
  }

  return auth
    .signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      console.log("✅ Firebase login successful:", user.email);

      // Fetch user data from Firestore
      return db.collection("users").doc(user.uid).get();
    })
    .then((doc) => {
      if (!doc.exists) {
        throw new Error("Data user tidak ditemukan di database!");
      }

      const userData = doc.data();
      console.log("✅ User data retrieved:", userData);

      // Create complete user session object
      const sessionData = {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        role: userData.role,
        nama: userData.nama,
        loginTime: new Date().toISOString(),
      };

      // Save to sessionStorage with multiple keys for redundancy
      sessionStorage.setItem("currentUser", JSON.stringify(sessionData));
      sessionStorage.setItem("isAuthenticated", "true");
      sessionStorage.setItem("userRole", userData.role);
      sessionStorage.setItem("loginComplete", "true");

      // Mark as fresh login (prevents auto-logout on page load)
      sessionStorage.setItem("freshLogin", "true");

      // Remove login in progress flag
      sessionStorage.removeItem("loginInProgress");

      console.log("✅ Session data saved:", sessionData);

      // Hide loading
      if (window.hideLoading) {
        window.hideLoading();
      }

      // Determine redirect URL based on role
      let redirectUrl;
      if (userData.role === "admin") {
        redirectUrl = "index.html";
      } else if (userData.role === "kapus") {
        redirectUrl = "dashboard-kapus.html";
      } else {
        throw new Error("Role tidak dikenali: " + userData.role);
      }

      console.log("✅ Login complete, redirecting to:", redirectUrl);

      // Return redirect URL (will be handled by login form)
      return redirectUrl;
    })
    .catch((error) => {
      console.error("❌ Login error:", error);

      // Clean up
      sessionStorage.clear();

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

  // Clear all session data
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

      // Add small delay before redirect
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
// CEK AUTH STATE - IMPROVED VERSION
// ============================================
function checkAuthState() {
  const currentPage = window.location.pathname;
  const isLoginPage = currentPage.includes("login.html");

  console.log("🔍 Checking auth state on:", currentPage);

  // SPECIAL HANDLING FOR LOGIN PAGE
  if (isLoginPage) {
    const urlParams = new URLSearchParams(window.location.search);
    const isFromLogout = urlParams.get("logout") === "true";

    if (isFromLogout) {
      console.log("🔒 Logout detected, clearing auth...");
      sessionStorage.clear();
      localStorage.clear();

      auth.signOut().then(() => {
        window.history.replaceState({}, document.title, "login.html");
      });
    }

    // Don't set up auth listener on login page
    console.log("⏸️ Skipping auth listener on login page");
    return;
  }

  // Skip if registering
  if (sessionStorage.getItem("isRegistering") === "true") {
    console.log("⏸️ Registration in progress, skipping auth check");
    return;
  }

  // FOR NON-LOGIN PAGES: Check authentication
  auth.onAuthStateChanged((user) => {
    console.log("👤 Auth state changed:", {
      user: user ? user.email : "Not logged in",
      page: currentPage,
      sessionAuth: sessionStorage.getItem("isAuthenticated"),
      freshLogin: sessionStorage.getItem("freshLogin"),
    });

    if (!user) {
      console.log("⚠️ No user found, redirecting to login...");
      sessionStorage.clear();
      window.location.replace("login.html");
      return;
    }

    console.log("✅ User authenticated:", user.email);

    // Update session cache if needed
    const cachedUser = sessionStorage.getItem("currentUser");
    if (!cachedUser) {
      console.log("📝 Updating session cache...");

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
            sessionStorage.setItem("isAuthenticated", "true");
            console.log("✅ Session cache updated");
          }
        })
        .catch((error) => {
          console.error("❌ Error updating cache:", error);
        });
    }
  });
}

// ============================================
// CEK ROLE USER (FIXED FOR SURAT KELUAR)
// ============================================
function checkUserRole(allowedRoles) {
  return new Promise((resolve, reject) => {
    console.log("🔍 Checking user role...");
    console.log("📋 Allowed roles:", allowedRoles);

    // First check session cache
    const cachedUser = sessionStorage.getItem("currentUser");
    const isAuthenticated = sessionStorage.getItem("isAuthenticated");

    if (cachedUser && isAuthenticated === "true") {
      try {
        const userData = JSON.parse(cachedUser);
        const userRole = userData.role;

        console.log("🔐 Checking role from cache:", {
          userRole: userRole,
          allowedRoles: allowedRoles,
        });

        if (!allowedRoles.includes(userRole)) {
          console.warn("⚠️ Access denied for role:", userRole);
          alert(
            `⚠️ Anda tidak memiliki akses ke halaman ini!\n\nRole Anda: ${userRole}`
          );

          if (userRole === "admin") {
            window.location.replace("index.html");
          } else if (userRole === "kapus") {
            window.location.replace("dashboard-kapus.html");
          } else {
            window.location.replace("login.html");
          }

          reject(new Error("Access denied"));
          return;
        }

        console.log("✅ Access granted from cache");

        // Return complete user data including uid
        const completeUserData = {
          ...userData,
          id: userData.uid,
        };

        resolve(completeUserData);
        return;
      } catch (e) {
        console.warn("⚠️ Invalid cached data, checking Firebase...");
      }
    }

    // If no cache or invalid, check Firebase with timeout
    console.log("🔄 Checking Firebase Auth...");

    const checkAuth = () => {
      if (!window.auth) {
        console.warn("⚠️ Firebase Auth not ready, retrying...");
        setTimeout(checkAuth, 100);
        return;
      }

      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (!user) {
          console.log("⚠️ No user logged in");
          window.location.replace("login.html");
          reject(new Error("No user logged in"));
          unsubscribe();
          return;
        }

        console.log("✅ User found in Firebase Auth:", user.email);

        db.collection("users")
          .doc(user.uid)
          .get()
          .then((doc) => {
            if (!doc.exists) {
              console.error("❌ User data not found in Firestore");
              alert("Data user tidak ditemukan!");
              logoutUser();
              reject(new Error("User data not found"));
              unsubscribe();
              return;
            }

            const userData = doc.data();
            const userRole = userData.role;

            console.log("🔐 Checking role from Firebase:", {
              userRole: userRole,
              allowedRoles: allowedRoles,
            });

            if (!allowedRoles.includes(userRole)) {
              console.warn("⚠️ Access denied for role:", userRole);
              alert(
                `⚠️ Anda tidak memiliki akses ke halaman ini!\n\nRole Anda: ${userRole}`
              );

              if (userRole === "admin") {
                window.location.replace("index.html");
              } else if (userRole === "kapus") {
                window.location.replace("dashboard-kapus.html");
              } else {
                window.location.replace("login.html");
              }

              reject(new Error("Access denied"));
              unsubscribe();
            } else {
              console.log("✅ Access granted for role:", userRole);

              // Create complete user data object
              const completeUserData = {
                uid: user.uid,
                id: user.uid,
                email: user.email,
                role: userData.role,
                nama: userData.nama,
              };

              // Update cache
              sessionStorage.setItem(
                "currentUser",
                JSON.stringify(completeUserData)
              );
              sessionStorage.setItem("isAuthenticated", "true");

              console.log("✅ Resolved with user data:", completeUserData);
              resolve(completeUserData);
              unsubscribe();
            }
          })
          .catch((error) => {
            console.error("❌ Error checking role:", error);
            reject(error);
            unsubscribe();
          });
      });
    };

    checkAuth();
  });
}

// ============================================
// GET CURRENT USER DATA
// ============================================
function getCurrentUserData() {
  return new Promise((resolve, reject) => {
    // Try cache first
    const cachedUser = sessionStorage.getItem("currentUser");
    const isAuthenticated = sessionStorage.getItem("isAuthenticated");

    if (cachedUser && isAuthenticated === "true") {
      try {
        const userData = JSON.parse(cachedUser);
        console.log("✅ User data from cache:", userData);
        resolve(userData);
        return;
      } catch (e) {
        console.warn("⚠️ Invalid cached user data");
      }
    }

    // Fetch from Firebase if no cache
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        console.log("⚠️ No user logged in");
        reject(new Error("No user logged in"));
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
              id: user.uid,
              email: user.email,
              ...doc.data(),
            };

            sessionStorage.setItem("currentUser", JSON.stringify(userData));
            sessionStorage.setItem("isAuthenticated", "true");

            console.log("✅ User data from Firebase:", userData);
            resolve(userData);
            unsubscribe();
          } else {
            reject(new Error("User data not found"));
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
      reject(new Error("No user logged in"));
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
  localStorage.clear();
}

// ============================================
// GET CURRENT USER (ALIAS FOR COMPATIBILITY)
// ============================================
window.getCurrentUser = getCurrentUserData;

// ============================================
// PROTECT PAGE (ALIAS FOR COMPATIBILITY)
// ============================================
window.protectPage = function (allowedRoles) {
  console.log("🛡️ Protecting page for roles:", allowedRoles);
  return checkUserRole(allowedRoles);
};

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

console.log("✅ Auth.js v2.1 loaded successfully");
