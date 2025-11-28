// ==========================================
// STORAGE KEYS CONFIGURATION
// ==========================================
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
// UNIFIED DATABASE CLASS
// ==========================================
class KemhanDatabase {
  // ========== GENERIC CRUD OPERATIONS ==========

  static get(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  static save(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  static clear(key) {
    localStorage.removeItem(key);
  }

  static clearAll() {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
  }

  // ========== NOTIFIKASI ==========
  static getNotifications() {
    const data = this.get(STORAGE_KEYS.NOTIFICATIONS);
    return data.sort((a, b) => (a.isRead === b.isRead ? 0 : a.isRead ? 1 : -1));
  }

  static saveNotifications(data) {
    this.save(STORAGE_KEYS.NOTIFICATIONS, data);
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
  }

  // ========== SURAT MASUK ==========

  static getSuratMasuk(includeDeleted = false) {
    const data = this.get(STORAGE_KEYS.SURAT_MASUK);
    let filteredData = data;

    if (!includeDeleted) {
      filteredData = filteredData.filter((s) => !s.isDeleted);
    }

    const inboxData = filteredData.filter((s) => s.status === "Pending");
    return inboxData;
  }

  static getAllSuratMasuk(includeDeleted = false) {
    const data = this.get(STORAGE_KEYS.SURAT_MASUK);
    return includeDeleted ? data : data.filter((s) => !s.isDeleted);
  }

  static saveSuratMasuk(data) {
    this.save(STORAGE_KEYS.SURAT_MASUK, data);
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
    this.save(STORAGE_KEYS.SURAT_KELUAR, data);
  }

  static addSuratKeluar(surat) {
    const data = this.getSuratKeluar(true);
    const newId = data.length > 0 ? Math.max(...data.map((s) => s.id)) + 1 : 1;

    const newSurat = {
      ...surat,
      id: newId,
      type: "keluar",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDeleted: false,
      isFavorite: false,
      noNaskah: surat.noNaskah || "N/A",
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
    this.save(STORAGE_KEYS.NOTA_DINAS, data);
  }

  static addNotaDinas(notaDinas) {
    const data = this.getNotaDinas(true);
    const newId = data.length > 0 ? Math.max(...data.map((s) => s.id)) + 1 : 1;

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

  static addDisposisiToNotaDinas(notaDinasId, disposisi) {
    const notaDinas = this.getNotaDinasById(notaDinasId);
    if (!notaDinas) return null;

    if (!notaDinas.disposisi) notaDinas.disposisi = [];

    const newDisposisi = {
      ...disposisi,
      id: notaDinas.disposisi.length + 1,
      notaDinasId: notaDinasId,
      createdAt: new Date().toISOString(),
      status: "Proses",
    };

    notaDinas.disposisi.push(newDisposisi);

    const updated = this.updateNotaDinas(notaDinasId, {
      disposisi: notaDinas.disposisi,
      status: "Proses",
    });

    this.addToMonitoring({
      suratId: notaDinasId,
      disposisiId: newDisposisi.id,
      action: "nota_dinas_disposisi_created",
      type: "nota-dinas",
      data: {
        perihal: notaDinas.perihal,
        noSurat: notaDinas.noSurat,
        kepada: newDisposisi.kepada,
      },
    });

    this._addNotification({
      suratId: notaDinasId,
      type: "nota-dinas",
      title: `Disposisi Nota Dinas: ${disposisi.kepada}`,
      time: "Baru Saja",
    });

    return newDisposisi;
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

        this._addNotification({
          suratId: id,
          type: "masuk",
          title: `Surat Masuk Dihapus: ${surat.noSurat}`,
          time: "Baru Saja",
          isRead: true,
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

        this._addNotification({
          suratId: id,
          type: "keluar",
          title: `Surat Keluar Dihapus: ${data[index].noSurat}`,
          time: "Baru Saja",
          isRead: true,
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

        this._addNotification({
          suratId: id,
          type: "nota-dinas",
          title: `Nota Dinas Dihapus: ${data[index].noSurat}`,
          time: "Baru Saja",
          isRead: true,
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
      const data = this.getNotaDinas(true);
      const index = data.findIndex((s) => s.id === parseInt(id));
      if (index !== -1) {
        data[index].isFavorite = !data[index].isFavorite;
        this.saveNotaDinas(data);

        this.addToMonitoring({
          suratId: id,
          action: data[index].isFavorite
            ? "added_to_favorite"
            : "removed_from_favorite",
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
    return this.getMonitoring().filter(
      (log) => log.suratId === parseInt(suratId)
    );
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
    if (
      this.get(STORAGE_KEYS.SURAT_MASUK).length > 0 ||
      this.get(STORAGE_KEYS.MONITORING).length > 0
    ) {
      console.log("✅ Data sudah ada, tidak inisialisasi dummy.");
      return;
    }

    console.log("🔄 Initializing dummy data...");
    KemhanDatabase.clearAll();

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
        disposisi: [
          {
            id: 1,
            judul: "ACC Untuk ditindaklanjuti",
            kepada: "Kepala Bidang Banglola Sisfohan",
            oleh: "Kabag TU",
            dibuat: "2025-01-12T08:00:00Z",
            deadline: "15/01/2025",
            catatan: "Mohon segera ditindaklanjuti dan diproses",
            status: "Proses",
          },
        ],
      },
      {
        noSurat: "002/2025",
        tanggalSurat: "2025-01-12",
        tanggalDiterima: "2025-01-13",
        perihal: "Undangan Seminar Nasional Keamanan Siber",
        dari: "Universitas Pertahanan",
        kepada: "Kepala Pusat",
        jenisSurat: "Undangan",
        sifatSurat: "Penting",
        file: "Undangan_Seminar_UNHAN.pdf",
        status: "Pending",
        namaPengirim: "Prof. Dr. Sulistyo",
        jabatanPengirim: "Rektor",
        catatan: "",
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

    // DUMMY NOTA DINAS
    const dummyNotaDinas = [
      {
        noSurat: "001/ND/2025",
        tanggalSurat: "2025-08-01",
        tanggalTerima: "2025-08-04",
        perihal:
          "Surat Dinas Kunjungan Kerja ke Ditjen Potensi Pertahanan Kemhan",
        dari: "Pusdatin Kemhan",
        kepada: "Ditjen Potensi Pertahanan Kemhan",
        sifat: "Umum",
        jenisNaskah: "Nota Dinas",
        lampiran: "Surat Dinas Kunjungan Kerja ke Ditjen Pothan.pdf",
        catatan: "Kunjungan Kerja",
        diEntryOleh: "Staff TU Puslapbinkunhan",
        isDeleted: false,
        isFavorite: false,
        disposisi: [],
      },
      {
        noSurat: "002/ND/2025",
        tanggalSurat: "2025-08-10",
        tanggalTerima: "2025-08-10",
        perihal: "Kunjungan Dinas ke Satker Universitas Pertahanan",
        dari: "Kapusdatin Kemhan",
        kepada: "Satker Unhan",
        sifat: "Penting",
        jenisNaskah: "Nota Dinas",
        lampiran: "Kunjungan_Dinas_Unhan.pdf",
        catatan: "Koordinasi Program",
        diEntryOleh: "Kabag TU",
        isDeleted: false,
        isFavorite: false,
        disposisi: [],
      },
      {
        noSurat: "003/ND/2025",
        tanggalSurat: "2025-08-15",
        tanggalTerima: "2025-08-15",
        perihal: "Kunjungan Dinas ke Sekretariat Jenderal Kemhan",
        dari: "Kabid Infra TIK",
        kepada: "Satker Setjen Kemhan",
        sifat: "Umum",
        jenisNaskah: "Nota Dinas",
        lampiran: "Kunjungan_Setjen.pdf",
        catatan: "Pembahasan Infrastruktur",
        diEntryOleh: "Staff TU",
        isDeleted: false,
        isFavorite: false,
        disposisi: [],
      },
      {
        noSurat: "004/ND/2025",
        tanggalSurat: "2025-08-10",
        tanggalTerima: "2025-08-10",
        perihal: "Kunjungan Dinas ke Balitbang Kemhan",
        dari: "Kabid Banglola Sisfohan",
        kepada: "Satker Balitbang Kemhan",
        sifat: "Rahasia",
        jenisNaskah: "Nota Dinas",
        lampiran: "Kunjungan_Balitbang.pdf",
        catatan: "Penelitian dan Pengembangan",
        diEntryOleh: "Kabag TU",
        isDeleted: false,
        isFavorite: false,
        disposisi: [],
      },
      {
        noSurat: "005/ND/2025",
        tanggalSurat: "2025-08-20",
        tanggalTerima: "2025-08-20",
        perihal: "Kunjungan Dinas ke Inspektorat Jenderal Kemhan",
        dari: "Kabag TU",
        kepada: "Satker Itjen Kemhan",
        sifat: "Penting",
        jenisNaskah: "Nota Dinas",
        lampiran: "Kunjungan_Itjen.pdf",
        catatan: "Audit dan Pengawasan",
        diEntryOleh: "Staff TU Puslapbinkunhan",
        isDeleted: false,
        isFavorite: false,
        disposisi: [],
      },
    ];

    const processedNotaDinas = dummyNotaDinas.map((nota, idx) => ({
      ...nota,
      id: idx + 1,
      type: "nota-dinas",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    this.saveNotaDinas(processedNotaDinas);

    // DUMMY SURAT KELUAR
    const dummyKeluar = [
      {
        noSurat: "001/SK/2025",
        tanggalSurat: "2025-01-16",
        perihal: "Jawaban Pengajuan Magang",
        kepada: "UPN Veteran Jakarta",
        dari: "Kepala Bidang Banglola",
        jenisSurat: "Surat Balasan",
        sifatSurat: "Umum",
        referensi: "001/2025",
        file: "Jawaban_Magang.pdf",
        status: "Terkirim",
        isDeleted: false,
        isFavorite: false,
      },
    ];

    const processedKeluar = dummyKeluar.map((surat, idx) => ({
      ...surat,
      id: idx + 1,
      type: "keluar",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    this.saveSuratKeluar(processedKeluar);

    // INITIAL NOTIFICATIONS
    const initialNotifications = [
      {
        suratId: 2,
        type: "masuk",
        title: "Surat Baru: Undangan Seminar...",
        time: "10 Menit Lalu",
        isRead: false,
      },
      {
        suratId: 1,
        type: "masuk",
        title: "Surat 001 telah didisposisi.",
        time: "1 Jam Lalu",
        isRead: true,
      },
      {
        suratId: 1,
        type: "nota-dinas",
        title: "Nota Dinas Baru: 001/ND/2025",
        time: "2 Jam Lalu",
        isRead: false,
      },
    ];
    this.saveNotifications(initialNotifications);

    // MONITORING LOGS
    this.addToMonitoring({
      suratId: 1,
      action: "surat_created",
      type: "masuk",
      data: { perihal: dummyMasuk[0].perihal, noSurat: dummyMasuk[0].noSurat },
      timestamp: "2025-01-11T09:00:00Z",
    });
    this.addToMonitoring({
      suratId: 1,
      action: "disposisi_created",
      type: "masuk",
      data: {
        perihal: dummyMasuk[0].perihal,
        noSurat: dummyMasuk[0].noSurat,
        kepada: "Kepala Bidang Banglola Sisfohan",
        judul: "ACC Untuk ditindaklanjuti",
      },
      timestamp: "2025-01-12T08:00:00Z",
    });

    console.log("✅ Dummy data initialized successfully");
    console.log("📊 Statistics:", KemhanDatabase.getStatistics());
  }
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
class Utils {
  static formatDate(dateStr) {
    if (!dateStr) return "-";
    const date = new Date(dateStr);

    if (isNaN(date.getTime())) {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        if (!isNaN(d.getTime())) {
          return Utils._formatDate(d);
        }
      }
      return dateStr;
    }

    return Utils._formatDate(date);
  }

  static _formatDate(date) {
    const months = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];
    const day = date.getDate().toString().padStart(2, "0");
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  }

  static formatDateShort(dateStr) {
    if (!dateStr) return "-";
    const date = new Date(dateStr);

    if (isNaN(date.getTime())) {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        if (!isNaN(d.getTime())) {
          return Utils._formatDateShort(d);
        }
      }
      return dateStr;
    }
    return Utils._formatDateShort(date);
  }

  static _formatDateShort(date) {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  static getStatusBadge(status) {
    const badges = {
      Pending: "badge-pending",
      Proses: "badge-proses",
      Selesai: "badge-selesai",
      Terkirim: "badge-diterima",
      Ditolak: "badge-ditolak",
    };
    return badges[status] || "badge-pending";
  }

  static getSifatBadge(sifat) {
    const badges = {
      Umum: "badge-umum",
      Penting: "badge-penting",
      Rahasia: "badge-rahasia",
      "Sangat Rahasia": "badge-sangat-rahasia",
      Konfidensial: "badge-konfidensial",
    };
    return badges[sifat] || "badge-umum";
  }

  static getMonthName(monthIndex) {
    const months = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];
    return months[monthIndex];
  }
}

// ==========================================
// NAVIGATION & NOTIFICATION HELPERS
// ==========================================
class Navigation {
  static goToDetail(id, type = "masuk") {
    if (type === "masuk" && window.lihatSurat) {
      window.location.href = `surat-masuk.html`;
      setTimeout(() => {
        window.lihatSurat(id);
      }, 100);
    } else {
      console.log(`Navigasi ke detail surat ${type} ID ${id}`);
    }
  }

  static goToEdit(id, type = "masuk") {
    window.location.href = `surat-${type}.html?action=edit&id=${id}`;
  }

  static goToDisposisi(id) {
    if (window.disposisiSurat) {
      window.disposisiSurat(id);
    }
  }

  static goToMonitoring(suratId = null) {
    const url = suratId
      ? `monitoring.html?suratId=${suratId}`
      : "monitoring.html";
    window.location.href = url;
  }

  static getParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      action: params.get("action"),
      id: params.get("id"),
      type: params.get("type"),
      suratId: params.get("suratId"),
    };
  }

  static back() {
    window.history.back();
  }
}

class Notification {
  static success(message) {
    if (window.Swal) {
      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: message,
        timer: 2000,
        showConfirmButton: false,
      });
    } else {
      alert(`✅ ${message}`);
    }
  }

  static error(message) {
    if (window.Swal) {
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: message,
      });
    } else {
      alert(`❌ ${message}`);
    }
  }

  static confirm(message, onConfirm) {
    if (window.Swal) {
      Swal.fire({
        title: "Konfirmasi",
        text: message,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Ya",
        cancelButtonText: "Batal",
        confirmButtonColor: "#d33",
      }).then((result) => {
        if (result.isConfirmed && onConfirm) {
          onConfirm();
        }
      });
    } else {
      if (confirm(`⚠️ ${message}`)) {
        if (onConfirm) onConfirm();
      }
    }
  }
}

// ==========================================
// AUTO INITIALIZE
// ==========================================
KemhanDatabase.initializeDummyData();

document.addEventListener("DOMContentLoaded", function () {
  console.log("Kemhan Database Ready");
  console.log("Current Stats:", KemhanDatabase.getStatistics());
});

// ==========================================
// EXPORT TO GLOBAL SCOPE
// ==========================================
window.KemhanDatabase = KemhanDatabase;
window.Navigation = Navigation;
window.Notification = Notification;
window.Utils = Utils;
window.STORAGE_KEYS = STORAGE_KEYS;
