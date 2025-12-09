// ==========================================
// COMPATIBILITY WRAPPER - ENHANCED
// Bridges old localStorage-based code with new Firebase
// ==========================================

// Initialize caches
KemhanDatabase._cachedSuratMasuk = [];
KemhanDatabase._cachedSuratKeluar = [];
KemhanDatabase._cachedNotaDinas = [];
KemhanDatabase._dataLoaded = false;

// Extend KemhanDatabase with synchronous-style methods
KemhanDatabase.getSuratMasukSync = function() {
  return this._cachedSuratMasuk || [];
};

KemhanDatabase.getSuratKeluarSync = function() {
  return this._cachedSuratKeluar || [];
};

KemhanDatabase.getNotaDinasSync = function() {
  return this._cachedNotaDinas || [];
};

// Setup caching for real-time data
KemhanDatabase.on('surat_masuk:updated', (data) => {
  console.log('📦 Caching Surat Masuk:', data.length);
  KemhanDatabase._cachedSuratMasuk = data;
});

KemhanDatabase.on('surat_keluar:updated', (data) => {
  console.log('📦 Caching Surat Keluar:', data.length);
  KemhanDatabase._cachedSuratKeluar = data;
});

KemhanDatabase.on('nota_dinas:updated', (data) => {
  console.log('📦 Caching Nota Dinas:', data.length);
  KemhanDatabase._cachedNotaDinas = data;
});

// PERBAIKAN: Load initial data immediately when authenticated
firebase.auth().onAuthStateChanged(async (user) => {
  if (user && !KemhanDatabase._dataLoaded) {
    console.log('🔄 Loading initial data into cache...');
    
    try {
      // Load all data in parallel
      const [masuk, keluar, notaDinas] = await Promise.all([
        KemhanDatabase.getSuratMasuk(),
        KemhanDatabase.getSuratKeluar(),
        KemhanDatabase.getNotaDinas()
      ]);
      
      KemhanDatabase._cachedSuratMasuk = masuk;
      KemhanDatabase._cachedSuratKeluar = keluar;
      KemhanDatabase._cachedNotaDinas = notaDinas;
      KemhanDatabase._dataLoaded = true;
      
      console.log('✅ Initial data cached:', {
        suratMasuk: masuk.length,
        suratKeluar: keluar.length,
        notaDinas: notaDinas.length
      });
      
      // Emit events to trigger UI updates
      KemhanDatabase.emit('surat_masuk:updated', masuk);
      KemhanDatabase.emit('surat_keluar:updated', keluar);
      KemhanDatabase.emit('nota_dinas:updated', notaDinas);
      
    } catch (error) {
      console.error('❌ Error loading initial cache:', error);
    }
  }
});

console.log("✅ Database Compatibility Wrapper Loaded");