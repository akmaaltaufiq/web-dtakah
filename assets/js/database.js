// ==========================================
// KEMHAN DATABASE - LOCAL STORAGE MANAGER
// ==========================================

// Storage Keys Configuration
const STORAGE_KEYS = {
  SURAT_MASUK: "kemhan_surat_masuk",
  SURAT_KELUAR: "kemhan_surat_keluar",
  NOTA_DINAS: "kemhan_nota_dinas",
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
  // ========== GENERIC CRUD ==========
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
      console.log("✅ All data cleared");
      return true;
    } catch (error) {
      console.error("Error clearing all data:", error);
      return false;
    }
  }

  // ========== NOTIFICATIONS ==========
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

  // ========== SURAT MASUK ==========
  static getSuratMasuk(includeDeleted = false) {
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

      if (!updates.disposisi && !updates.deletedAt && updates.isDeleted !== true) {
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

  // ========== SURAT KELUAR ==========
  static getSuratKeluar(includeDeleted = false) {
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
    const data = this.getSuratKeluar(true);
    const newId = data.length > 0 ? Math.max(...data.map((s) => s.id)) + 1 : 101;

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

  // ========== NOTA DINAS ==========
  static getNotaDinas(includeDeleted = false) {
    const data = this.get(STORAGE_KEYS.NOTA_DINAS);
    return includeDeleted ? data : data.filter((s) => !s.isDeleted);
  }

  static getNotaDinasById(id) {
    const data = this.get(STORAGE_KEYS.NOTA_DINAS);
    return data.find((s) => s.id === parseInt(id));
  }

  static saveNotaDinas(data) {
    return this.save(STORAGE_KEYS.NOTA_DINAS, data);
  }

  static addNotaDinas(notaDinas) {
    const data = this.getNotaDinas(true);
    const newId = data.length > 0 ? Math.max(...data.map((s) => s.id)) + 1 : 201;

    const newNotaDinas = {
      ...notaDinas,
      id: newId,
      type: "nota-dinas",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDeleted: false,
      isFavorite: false,
      disposisi: notaDinas.disposisi || [],
    };

    data.push(newNotaDinas);
    this.saveNotaDinas(data);

    this.addToMonitoring({
      suratId: newId,
      action: "nota_dinas_created",
      type: "nota-dinas",
      data: { perihal: notaDinas.perihal, noSurat: notaDinas.noSurat },
    });

    this._addNotification({
      suratId: newId,
      type: "nota-dinas",
      title: `Nota Dinas Baru: ${notaDinas.noSurat}`,
      time: "Baru Saja",
    });

    return newNotaDinas;
  }

  static updateNotaDinas(id, updates) {
    const data = this.get(STORAGE_KEYS.NOTA_DINAS);
    const index = data.findIndex((s) => s.id === parseInt(id));

    if (index !== -1) {
      data[index] = {
        ...data[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      this.saveNotaDinas(data);

      this.addToMonitoring({
        suratId: id,
        action: "nota_dinas_updated",
        type: "nota-dinas",
        data: updates,
      });

      return data[index];
    }
    return null;
  }

  // ========== SOFT DELETE ==========
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
      const data = this.getNotaDinas(true);
      const index = data.findIndex((s) => s.id === parseInt(id));
      if (index !== -1) {
        data[index].isDeleted = true;
        data[index].deletedAt = new Date().toISOString();
        this.saveNotaDinas(data);

        this.addToMonitoring({
          suratId: id,
          action: "nota_dinas_deleted",
          type: "nota-dinas",
          data: { perihal: data[index].perihal, noSurat: data[index].noSurat },
        });

        return data[index];
      }
    }
    return null;
  }

  static getAllDeleted() {
    const masuk = this.getAllSuratMasuk(true).filter((s) => s.isDeleted);
    const keluar = this.getSuratKeluar(true).filter((s) => s.isDeleted);
    const notaDinas = this.getNotaDinas(true).filter((s) => s.isDeleted);
    return [...masuk, ...keluar, ...notaDinas];
  }

  // ========== RESTORE ==========
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
      const data = this.getNotaDinas(true);
      const index = data.findIndex((s) => s.id === parseInt(id));
      if (index !== -1 && data[index].isDeleted) {
        data[index].isDeleted = false;
        data[index].deletedAt = null;
        this.saveNotaDinas(data);

        this.addToMonitoring({
          suratId: id,
          action: "nota_dinas_restored",
          type: "nota-dinas",
          data: { perihal: data[index].perihal, noSurat: data[index].noSurat },
        });

        return data[index];
      }
    }
    return null;
  }

  // ========== PERMANENT DELETE ==========
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
      const data = this.getNotaDinas(true);
      const index = data.findIndex((s) => s.id === parseInt(id));
      if (index !== -1) {
        const deleted = data[index];
        data.splice(index, 1);
        this.saveNotaDinas(data);

        this.addToMonitoring({
          suratId: id,
          action: "nota_dinas_permanent_deleted",
          type: "nota-dinas",
          data: { perihal: deleted.perihal, noSurat: deleted.noSurat },
        });

        return deleted;
      }
    }
    return null;
  }

  // ========== FAVORIT ==========
  static toggleFavorite(id, type = "masuk") {
    if (type === "masuk") {
      const surat = this.getSuratMasukById(id);
      if (surat) {
        const updated = this.updateSuratMasuk(id, {
          isFavorite: !surat.isFavorite,
        });

        this.addToMonitoring({
          suratId: id,
          action: updated.isFavorite ? "added_to_favorite" : "removed_from_favorite",
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
          action: data[index].isFavorite ? "added_to_favorite" : "removed_from_favorite",
          type: "keluar",
          data: { perihal: data[index].perihal, noSurat: data[index].noSurat },
        });

        return data[index];
      }
    } else if (type === "nota-dinas") {
      const data = this.getNotaDinas(true);
      const index = data.findIndex((s) => s.id === parseInt(id));
      if (index !== -1) {
        data[index].isFavorite = !data[index].isFavorite;
        this.saveNotaDinas(data);

        this.addToMonitoring({
          suratId: id,
          action: data[index].isFavorite ? "added_to_favorite" : "removed_from_favorite",
          type: "nota-dinas",
          data: { perihal: data[index].perihal, noSurat: data[index].noSurat },
        });

        return data[index];
      }
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
    const notaDinas = this.getNotaDinas()
      .filter((s) => s.isFavorite)
      .map((s) => ({ ...s, type: "nota-dinas" }));
    return [...masuk, ...keluar, ...notaDinas].sort(
      (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
    );
  }

  // ========== DISPOSISI ==========
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

    const index = surat.disposisi.findIndex((d) => d.id === parseInt(disposisiId));
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

  // ========== MONITORING ==========
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
    return this.getMonitoring().filter((log) => log.suratId === parseInt(suratId));
  }

  // ========== STATISTICS ==========
  static getStatistics() {
    const masuk = this.getAllSuratMasuk();
    const keluar = this.getSuratKeluar();
    const notaDinas = this.getNotaDinas();
    const deleted = this.getAllDeleted();
    const favorites = this.getAllFavorites();

    return {
      totalMasuk: masuk.length,
      totalKeluar: keluar.length,
      totalNotaDinas: notaDinas.length,
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
      console.log("✅ Data sudah ada, skip dummy initialization");
      return;
    }

    console.log("🔄 Initializing dummy data...");

    // DUMMY SURAT MASUK
    const dummyMasuk = [
      {
        noSurat: "001/2025",
        tanggalSurat: "2025-01-10",
        tanggalDiterima: "2025-01-11",
        perihal: "Pengajuan Magang Mahasiswa Prodi Sistem Informasi",
        dari: "UPN Veteran Jakarta",
        kepada: "Kepala Bidang Banglola Sisfohan",
        jenisSurat: "Permohonan Kerja Sama",
        sifatSurat: "Umum",
        file: "Pengajuan_Magang_UPNVJ.pdf",
        status: "Proses",
        namaPengirim: "Dr. Ahmad Budiman",
        jabatanPengirim: "Dekan Fakultas Ilmu Komputer",
        catatan: "Mohon diproses segera",
        isDeleted: false,
        isFavorite: false,
        disposisi: [],
      },
    ];

    const processedMasuk = dummyMasuk.map((surat, idx) => ({
      ...surat,
      id: idx + 1,
      type: "masuk",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    this.saveSuratMasuk(processedMasuk);

    // DUMMY SURAT KELUAR - Empty initially
    this.saveSuratKeluar([]);

    // DUMMY NOTA DINAS - Empty initially
    this.saveNotaDinas([]);

    // INITIAL NOTIFICATIONS
    const initialNotifications = [
      {
        id: 1,
        suratId: 1,
        type: "masuk",
        title: "Surat Baru: Pengajuan Magang...",
        time: "10 Menit Lalu",
        isRead: false,
        createdAt: new Date().toISOString(),
      },
    ];
    this.saveNotifications(initialNotifications);

    // MONITORING LOGS
    this.save(STORAGE_KEYS.MONITORING, []);
    this.addToMonitoring({
      suratId: 1,
      action: "surat_created",
      type: "masuk",
      data: { perihal: dummyMasuk[0].perihal, noSurat: dummyMasuk[0].noSurat },
      timestamp: "2025-01-11T09:00:00Z",
    });

    console.log("✅ Dummy data initialized successfully");
    console.log("📊 Statistics:", KemhanDatabase.getStatistics());
  }
}

// ==========================================
// AUTO INITIALIZE
// ==========================================
document.addEventListener("DOMContentLoaded", function () {
  KemhanDatabase.initializeDummyData();
  console.log("✅ Kemhan Database Ready");
  console.log("📊 Current Stats:", KemhanDatabase.getStatistics());
});

// ==========================================
// EXPORT TO GLOBAL SCOPE
// ==========================================
if (typeof window !== 'undefined') {
  window.KemhanDatabase = KemhanDatabase;
  window.STORAGE_KEYS = STORAGE_KEYS;
}

// For module environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { KemhanDatabase, STORAGE_KEYS };
}