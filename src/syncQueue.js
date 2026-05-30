const DB_NAME = "weather-app";
const STORE_NAME = "pending-searches";

// Some ref: https://wslisam.medium.com/unleashing-the-power-of-indexeddb-a-modern-approach-to-client-side-storage-e2d7b1fef93d

const openDB = () =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

export const enqueueSearch = async (query) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const trx = db.transaction(STORE_NAME, "readwrite");
    trx.objectStore(STORE_NAME).add({ query, createdAt: Date.now() });
    trx.oncomplete = () => resolve();
    trx.onerror = () => reject(trx.error);
  });
};

export const getPendingSearches = async () => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const request = db
      .transaction(STORE_NAME, "readonly")
      .objectStore(STORE_NAME)
      .getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const removePendingSearch = async (id) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const trx = db.transaction(STORE_NAME, "readwrite");
    trx.objectStore(STORE_NAME).delete(id);
    trx.oncomplete = () => resolve();
    trx.onerror = () => reject(trx.error);
  });
};
