// ==========================================
// KEMHAN DATABASE - HYBRID SYSTEM
// Primary: Firebase Firestore
// Fallback: localStorage (for legacy support)
// ==========================================

console.log("📦 Loading Kemhan Database (Hybrid Mode)...");

// Storage Keys Configuration (localStorage only)
const STORAGE_KEYS = {
  SURAT_MASUK: "kemhan_surat_masuk",
  SURAT_KELUAR: "kemhan_surat_keluar",
  NOTA_DINAS: "kemhan_nota_dinas", // DEPRECATED - now in Firebase
  DISPOSISI: "kemhan_disposisi",
  FAVORIT: "kemhan_favorit",
  DELETED: "kemhan_surat_deleted",
  AGENDA: "kemhan_agenda",
  TAKAH: "kemhan_takah",
  MONITORING: "kemhan_monitoring",
  NOTIFICATIONS: "kemhan_notifications",
  SETTINGS: "kemhan_settings",
  CURRENT_USER: "kemhan_current_user",
};

// ==========================================
// KEMHAN DATABASE CLASS
// ==========================================
class KemhanDatabase {
  // ========== GENERIC CRUD (localStorage) ==========
  static get(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Error getting ${key}:`, error);
      return [];
    }
  }

  static save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
      return false;
    }
  }

  static clear(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error clearing ${key}:`, error);
      return false;
    }
  }

  static clearAll() {
    try {
      Object.values(STORAGE_KEYS).forEach((key) => {
        localStorage.removeItem(key);
      });
      console.log("✅ All localStorage data cleared");
      return true;
    } catch (error) {
      console.error("Error clearing all data:", error);
      return false;
    }
  }

  // ========== NOTIFICATIONS (localStorage) ==========
  static getNotifications() {
    const data = this.get(STORAGE_KEYS.NOTIFICATIONS);
    return data.sort((a, b) => (a.isRead === b.isRead ? 0 : a.isRead ? 1 : -1));
  }

  static saveNotifications(data) {
    return this.save(STORAGE_KEYS.NOTIFICATIONS, data);
  }

  static markAllNotificationsAsRead() {
    const data = this.getNotifications();
    const updatedData = data.map((n) => ({ ...n, isRead: true }));
    this.saveNotifications(updatedData);
    return updatedData;
  }

  static markNotificationAsRead(suratId, type) {
    const data = this.get(STORAGE_KEYS.NOTIFICATIONS);
    const index = data.findIndex(
      (n) => n.suratId == suratId && n.type === type && !n.isRead
    );

    if (index !== -1) {
      data[index].isRead = true;
      this.saveNotifications(data);
      return data[index];
    }
    return null;
  }

  static _addNotification(notif) {
    const data = this.get(STORAGE_KEYS.NOTIFICATIONS);
    const newNotif = {
      ...notif,
      isRead: notif.isRead || false,
      id: data.length > 0 ? Math.max(...data.map((n) => n.id)) + 1 : 1,
      createdAt: new Date().toISOString(),
    };
    data.unshift(newNotif);
    this.saveNotifications(data);
    return newNotif;
  }

  // ========== SURAT MASUK (LEGACY - localStorage) ==========
  static getSuratMasuk(includeDeleted = false) {
    console.warn("⚠️ getSuratMasuk() is legacy - prefer Firebase directly");
    const data = this.get(STORAGE_KEYS.SURAT_MASUK);
    let filteredData = data;

    if (!includeDeleted) {
      filteredData = filteredData.filter((s) => !s.isDeleted);
    }

    return filteredData;
  }

  static getAllSuratMasuk(includeDeleted = false) {
    const data = this.get(STORAGE_KEYS.SURAT_MASUK);
    return includeDeleted ? data : data.filter((s) => !s.isDeleted);
  }

  static saveSuratMasuk(data) {
    return this.save(STORAGE_KEYS.SURAT_MASUK, data);
  }

  static getSuratMasukById(id) {
    const data = this.get(STORAGE_KEYS.SURAT_MASUK);
    return data.find((s) => s.id === parseInt(id));
  }

  static addSuratMasuk(surat) {
    console.warn("⚠️ addSuratMasuk() is legacy - prefer Firebase directly");
    const data = this.get(STORAGE_KEYS.SURAT_MASUK);
    const newId = data.length > 0 ? Math.max(...data.map((s) => s.id)) + 1 : 1;

    const newSurat = {
      ...surat,
      id: newId,
      type: "masuk",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDeleted: false,
      isFavorite: false,
      status: surat.status || "Pending",
      disposisi: surat.disposisi || [],
    };

    data.push(newSurat);
    this.saveSuratMasuk(data);

    this.addToMonitoring({
      suratId: newId,
      action: "surat_created",
      type: "masuk",
      data: { perihal: surat.perihal, noSurat: surat.noSurat },
    });

    this._addNotification({
      suratId: newId,
      type: "masuk",
      title: `Surat Baru: ${surat.perihal}`,
      time: "Baru Saja",
    });

    return newSurat;
  }

  static updateSuratMasuk(id, updates) {
    const data = this.get(STORAGE_KEYS.SURAT_MASUK);
    const index = data.findIndex((s) => s.id === parseInt(id));

    if (index !== -1) {
      data[index] = {
        ...data[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      this.saveSuratMasuk(data);

      if (
        !updates.disposisi &&
        !updates.deletedAt &&
        updates.isDeleted !== true
      ) {
        this.addToMonitoring({
          suratId: id,
          action: "surat_updated",
          type: "masuk",
          data: updates,
        });
      }

      return data[index];
    }
    return null;
  }

  // ========== SURAT KELUAR (LEGACY - localStorage) ==========
  static getSuratKeluar(includeDeleted = false) {
    console.warn("⚠️ getSuratKeluar() is legacy - prefer Firebase directly");
    const data = this.get(STORAGE_KEYS.SURAT_KELUAR);
    const processedData = data.map((s) => ({
      ...s,
      noNaskah: s.noNaskah || s.noSurat || "N/A",
    }));
    return includeDeleted
      ? processedData
      : processedData.filter((s) => !s.isDeleted);
  }

  static getSuratKeluarById(id) {
    const data = this.get(STORAGE_KEYS.SURAT_KELUAR);
    return data.find((s) => s.id === parseInt(id));
  }

  static saveSuratKeluar(data) {
    return this.save(STORAGE_KEYS.SURAT_KELUAR, data);
  }

  static addSuratKeluar(surat) {
    console.warn("⚠️ addSuratKeluar() is legacy - prefer Firebase directly");
    const data = this.getSuratKeluar(true);
    const newId =
      data.length > 0 ? Math.max(...data.map((s) => s.id)) + 1 : 101;

    const newSurat = {
      ...surat,
      id: newId,
      type: "keluar",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDeleted: false,
      isFavorite: false,
      noNaskah: surat.noNaskah || surat.noSurat || "N/A",
      noSurat: surat.noSurat || surat.noNaskah || "N/A",
    };

    data.push(newSurat);
    this.saveSuratKeluar(data);

    this.addToMonitoring({
      suratId: newId,
      action: "surat_created",
      type: "keluar",
      data: { perihal: surat.perihal, noNaskah: surat.noNaskah },
    });

    this._addNotification({
      suratId: newId,
      type: "keluar",
      title: `Surat Keluar Dibuat: ${surat.noNaskah}`,
      time: "Baru Saja",
    });

    return newSurat;
  }

  static updateSuratKeluar(id, updates) {
    const data = this.get(STORAGE_KEYS.SURAT_KELUAR);
    const index = data.findIndex((s) => s.id === parseInt(id));

    if (index !== -1) {
      data[index] = {
        ...data[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      this.saveSuratKeluar(data);

      this.addToMonitoring({
        suratId: id,
        action: "surat_keluar_updated",
        type: "keluar",
        data: updates,
      });

      return data[index];
    }
    return null;
  }

  // ========================================
  // NOTA DINAS - FIREBASE WRAPPERS
  // ========================================

  /**
   * Get Nota Dinas from FIREBASE (not localStorage)
   * Returns empty array - use Firebase directly instead
   */
  static getNotaDinas(includeDeleted = false) {
    console.warn(
      "⚠️ DEPRECATED: Use Firebase db.collection('nota_dinas') directly"
    );
    console.warn("⚠️ Nota Dinas is now stored in Firebase, not localStorage");

    // Return empty array to prevent errors
    // If old code calls this, it won't crash but should be updated
    return [];
  }

  static getNotaDinasById(id) {
    console.warn(
      "⚠️ DEPRECATED: Use Firebase db.collection('nota_dinas').doc(id).get() directly"
    );
    return null;
  }

  static saveNotaDinas(data) {
    console.warn(
      "⚠️ DEPRECATED: Nota Dinas should be saved to Firebase, not localStorage"
    );
    return false;
  }

  static addNotaDinas(notaDinas) {
    console.error(
      "❌ DEPRECATED: Use Firebase db.collection('nota_dinas').add() instead"
    );
    console.error(
      "❌ This function no longer works - Nota Dinas is Firebase-only"
    );

    // Return null to indicate failure
    return null;
  }

  static updateNotaDinas(id, updates) {
    console.error(
      "❌ DEPRECATED: Use Firebase db.collection('nota_dinas').doc(id).update() instead"
    );
    return null;
  }

  static deleteNotaDinas(id) {
    console.error("❌ DEPRECATED: Use Firebase to soft-delete nota_dinas");
    return null;
  }

  // ========== SOFT DELETE (LEGACY) ==========
  static deleteSurat(id, type = "masuk") {
    if (type === "masuk") {
      const surat = this.getSuratMasukById(id);
      if (surat) {
        this.updateSuratMasuk(id, {
          isDeleted: true,
          deletedAt: new Date().toISOString(),
        });

        this.addToMonitoring({
          suratId: id,
          action: "surat_deleted",
          type: "masuk",
          data: { perihal: surat.perihal, noSurat: surat.noSurat },
        });

        return surat;
      }
    } else if (type === "keluar") {
      const data = this.getSuratKeluar(true);
      const index = data.findIndex((s) => s.id === parseInt(id));
      if (index !== -1) {
        data[index].isDeleted = true;
        data[index].deletedAt = new Date().toISOString();
        this.saveSuratKeluar(data);

        this.addToMonitoring({
          suratId: id,
          action: "surat_deleted",
          type: "keluar",
          data: { perihal: data[index].perihal, noSurat: data[index].noSurat },
        });

        return data[index];
      }
    } else if (type === "nota-dinas") {
      console.error("❌ Use Firebase to delete nota-dinas documents");
      return null;
    }
    return null;
  }

  static getAllDeleted() {
    const masuk = this.getAllSuratMasuk(true).filter((s) => s.isDeleted);
    const keluar = this.getSuratKeluar(true).filter((s) => s.isDeleted);

    // Note: Nota Dinas deleted items should come from Firebase
    console.warn("⚠️ getAllDeleted() doesn't include Firebase nota_dinas");

    return [...masuk, ...keluar];
  }

  // ========== RESTORE (LEGACY) ==========
  static restoreSurat(id, type = "masuk") {
    if (type === "masuk") {
      const surat = this.getSuratMasukById(id);
      if (surat && surat.isDeleted) {
        this.updateSuratMasuk(id, {
          isDeleted: false,
          deletedAt: null,
        });

        this.addToMonitoring({
          suratId: id,
          action: "surat_restored",
          type: "masuk",
          data: { perihal: surat.perihal, noSurat: surat.noSurat },
        });

        return surat;
      }
    } else if (type === "keluar") {
      const data = this.getSuratKeluar(true);
      const index = data.findIndex((s) => s.id === parseInt(id));
      if (index !== -1 && data[index].isDeleted) {
        data[index].isDeleted = false;
        data[index].deletedAt = null;
        this.saveSuratKeluar(data);

        this.addToMonitoring({
          suratId: id,
          action: "surat_restored",
          type: "keluar",
          data: { perihal: data[index].perihal, noSurat: data[index].noSurat },
        });

        return data[index];
      }
    } else if (type === "nota-dinas") {
      console.error("❌ Use Firebase to restore nota-dinas documents");
      return null;
    }
    return null;
  }

  // ========== PERMANENT DELETE (LEGACY) ==========
  static permanentDelete(id, type = "masuk") {
    if (type === "masuk") {
      const data = this.getAllSuratMasuk(true);
      const index = data.findIndex((s) => s.id === parseInt(id));
      if (index !== -1) {
        const deleted = data[index];
        data.splice(index, 1);
        this.saveSuratMasuk(data);

        this.addToMonitoring({
          suratId: id,
          action: "surat_permanent_deleted",
          type: "masuk",
          data: { perihal: deleted.perihal, noSurat: deleted.noSurat },
        });

        return deleted;
      }
    } else if (type === "keluar") {
      const data = this.getSuratKeluar(true);
      const index = data.findIndex((s) => s.id === parseInt(id));
      if (index !== -1) {
        const deleted = data[index];
        data.splice(index, 1);
        this.saveSuratKeluar(data);

        this.addToMonitoring({
          suratId: id,
          action: "surat_permanent_deleted",
          type: "keluar",
          data: { perihal: deleted.perihal, noSurat: deleted.noSurat },
        });

        return deleted;
      }
    } else if (type === "nota-dinas") {
      console.error(
        "❌ Use Firebase to permanently delete nota-dinas documents"
      );
      return null;
    }
    return null;
  }

  // ========== FAVORIT (LEGACY) ==========
  static toggleFavorite(id, type = "masuk") {
    if (type === "masuk") {
      const surat = this.getSuratMasukById(id);
      if (surat) {
        const updated = this.updateSuratMasuk(id, {
          isFavorite: !surat.isFavorite,
        });

        this.addToMonitoring({
          suratId: id,
          action: updated.isFavorite
            ? "added_to_favorite"
            : "removed_from_favorite",
          type: "masuk",
          data: { perihal: surat.perihal, noSurat: surat.noSurat },
        });

        return updated;
      }
    } else if (type === "keluar") {
      const data = this.getSuratKeluar(true);
      const index = data.findIndex((s) => s.id === parseInt(id));
      if (index !== -1) {
        data[index].isFavorite = !data[index].isFavorite;
        this.saveSuratKeluar(data);

        this.addToMonitoring({
          suratId: id,
          action: data[index].isFavorite
            ? "added_to_favorite"
            : "removed_from_favorite",
          type: "keluar",
          data: { perihal: data[index].perihal, noSurat: data[index].noSurat },
        });

        return data[index];
      }
    } else if (type === "nota-dinas") {
      console.error("❌ Use Firebase to toggle favorite for nota-dinas");
      return null;
    }
    return null;
  }

  static getAllFavorites() {
    const masuk = this.getAllSuratMasuk()
      .filter((s) => s.isFavorite)
      .map((s) => ({ ...s, type: "masuk" }));
    const keluar = this.getSuratKeluar()
      .filter((s) => s.isFavorite)
      .map((s) => ({ ...s, type: "keluar" }));

    console.warn("⚠️ getAllFavorites() doesn't include Firebase nota_dinas");

    return [...masuk, ...keluar].sort(
      (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
    );
  }

  // ========== DISPOSISI (LEGACY) ==========
  static addDisposisi(suratId, disposisi) {
    const surat = this.getSuratMasukById(suratId);
    if (!surat) return null;

    if (!surat.disposisi) surat.disposisi = [];

    const newDisposisi = {
      ...disposisi,
      id: surat.disposisi.length + 1,
      suratId: suratId,
      createdAt: new Date().toISOString(),
      status: disposisi.status || "Proses",
    };

    surat.disposisi.push(newDisposisi);

    const updatedSurat = this.updateSuratMasuk(suratId, {
      disposisi: surat.disposisi,
      status: "Proses",
    });

    this.addToMonitoring({
      suratId: suratId,
      disposisiId: newDisposisi.id,
      action: "disposisi_created",
      type: "masuk",
      data: {
        perihal: surat.perihal,
        noSurat: surat.noSurat,
        kepada: newDisposisi.kepada,
        judul: newDisposisi.judul,
      },
    });

    this._addNotification({
      suratId: suratId,
      type: "masuk",
      title: `Disposisi Baru: ${disposisi.kepada}`,
      time: "Baru Saja",
    });

    return newDisposisi;
  }

  static updateDisposisi(suratId, disposisiId, updates) {
    const surat = this.getSuratMasukById(suratId);
    if (!surat || !surat.disposisi) return null;

    const index = surat.disposisi.findIndex(
      (d) => d.id === parseInt(disposisiId)
    );
    if (index !== -1) {
      surat.disposisi[index] = {
        ...surat.disposisi[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      const allSelesai = surat.disposisi.every((d) => d.status === "Selesai");
      const anyProses = surat.disposisi.some((d) => d.status === "Proses");

      let newStatus = "Pending";
      if (allSelesai) newStatus = "Selesai";
      else if (anyProses) newStatus = "Proses";

      this.updateSuratMasuk(suratId, {
        disposisi: surat.disposisi,
        status: newStatus,
      });

      this.addToMonitoring({
        suratId: suratId,
        disposisiId: disposisiId,
        action: "disposisi_updated",
        type: "masuk",
        data: updates,
      });

      return surat.disposisi[index];
    }
    return null;
  }

  // ========== MONITORING (localStorage) ==========
  static getMonitoring() {
    return this.get(STORAGE_KEYS.MONITORING);
  }

  static addToMonitoring(log) {
    const data = this.getMonitoring();
    const newLog = {
      ...log,
      id: data.length + 1,
      timestamp: log.timestamp || new Date().toISOString(),
    };
    data.push(newLog);
    this.save(STORAGE_KEYS.MONITORING, data);
    return newLog;
  }

  static getMonitoringBySurat(suratId) {
    return this.getMonitoring().filter(
      (log) => log.suratId === parseInt(suratId)
    );
  }

  // ========== STATISTICS ==========
  static getStatistics() {
    const masuk = this.getAllSuratMasuk();
    const keluar = this.getSuratKeluar();
    const deleted = this.getAllDeleted();
    const favorites = this.getAllFavorites();

    // Note: Nota Dinas count should come from Firebase
    console.warn(
      "⚠️ getStatistics() nota dinas count is 0 (use Firebase instead)"
    );

    return {
      totalMasuk: masuk.length,
      totalKeluar: keluar.length,
      totalNotaDinas: 0, // Use Firebase for real count
      totalDeleted: deleted.length,
      totalFavorites: favorites.length,
      pending: masuk.filter((s) => s.status === "Pending").length,
      proses: masuk.filter((s) => s.status === "Proses").length,
      selesai: masuk.filter((s) => s.status === "Selesai").length,
    };
  }

  // ========== DUMMY DATA INITIALIZER ==========
  static initializeDummyData() {
    // Check if data already exists
    const existingMasuk = this.get(STORAGE_KEYS.SURAT_MASUK);
    const existingKeluar = this.get(STORAGE_KEYS.SURAT_KELUAR);

    if (existingMasuk.length > 0 || existingKeluar.length > 0) {
      console.log("✅ localStorage data exists, skip initialization");
      return;
    }

    console.log("🔄 Initializing localStorage dummy data...");

    // Initialize empty arrays for localStorage
    this.saveSuratMasuk([]);
    this.saveSuratKeluar([]);
    this.saveNotifications([]);
    this.save(STORAGE_KEYS.MONITORING, []);

    console.log("✅ localStorage initialized (empty)");
    console.log("📊 localStorage Stats:", this.getStatistics());
    console.log("⚠️ NOTE: Nota Dinas uses Firebase - not in localStorage");
  }
}

// ==========================================
// AUTO INITIALIZE
// ==========================================
document.addEventListener("DOMContentLoaded", function () {
  KemhanDatabase.initializeDummyData();
  console.log("✅ Kemhan Database Ready (Hybrid Mode)");
  console.log("📊 localStorage Stats:", KemhanDatabase.getStatistics());
  console.log(
    "🔥 Firebase: Use db.collection() for surat_masuk, surat_keluar, nota_dinas"
  );
  console.log("💾 localStorage: Legacy fallback only");
});

// ==========================================
// EXPORT TO GLOBAL SCOPE
// ==========================================
if (typeof window !== "undefined") {
  window.KemhanDatabase = KemhanDatabase;
  window.STORAGE_KEYS = STORAGE_KEYS;
}

// For module environments
if (typeof module !== "undefined" && module.exports) {
  module.exports = { KemhanDatabase, STORAGE_KEYS };
}

console.log("✅ Kemhan Database loaded successfully (Hybrid Mode)");
