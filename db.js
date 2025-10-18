// Database configuration
const DB_NAME = 'todoDB';
const DB_VERSION = 1;
const STORE_NAME = 'tasks';

let db = null;

// Open or create the database
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error('Error opening database:', event.target.error);
            reject('Error opening database');
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            resolve(db);
        };

        // This event is only triggered if the database version changes
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Create object store (similar to a table in SQL)
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
                
                // Create indexes for faster queries
                store.createIndex('date', 'date', { unique: false });
                store.createIndex('completed', 'completed', { unique: false });
                store.createIndex('priority', 'priority', { unique: false });
            }
        };
    });
}

// Add or update a task
async function saveTask(task) {
    if (!db) await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        
        // If task has an ID, update it; otherwise, add a new task
        const request = task.id ? store.put(task) : store.add(task);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => {
            console.error('Error saving task:', event.target.error);
            reject('Error saving task');
        };
    });
}

// Get all tasks
async function getAllTasks() {
    if (!db) await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => {
            console.error('Error getting tasks:', event.target.error);
            reject('Error getting tasks');
        };
    });
}

// Get tasks by date
async function getTasksByDate(date) {
    if (!db) await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const dateIndex = store.index('date');
        const request = dateIndex.getAll(date);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => {
            console.error('Error getting tasks by date:', event.target.error);
            reject('Error getting tasks by date');
        };
    });
}

// Delete a task
async function deleteTask(taskId) {
    if (!db) await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(taskId);
        
        request.onsuccess = () => resolve(true);
        request.onerror = (event) => {
            console.error('Error deleting task:', event.target.error);
            reject('Error deleting task');
        };
    });
}

// Toggle task completion status
async function toggleTaskCompletion(taskId) {
    if (!db) await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(taskId);
        
        request.onsuccess = () => {
            const task = request.result;
            if (task) {
                task.completed = !task.completed;
                task.updatedAt = new Date().toISOString();
                
                const updateRequest = store.put(task);
                updateRequest.onsuccess = () => resolve(task);
                updateRequest.onerror = (event) => {
                    console.error('Error updating task:', event.target.error);
                    reject('Error updating task');
                };
            } else {
                reject('Task not found');
            }
        };
        
        request.onerror = (event) => {
            console.error('Error getting task:', event.target.error);
            reject('Error getting task');
        };
    });
}

// Export the database functions
export {
    initDB,
    saveTask,
    getAllTasks,
    getTasksByDate,
    deleteTask,
    toggleTaskCompletion
};
