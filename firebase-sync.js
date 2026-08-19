// Firebase Synchronization Module
let useFirebase = true;

// Carregar operações do Firestore
async function loadOperationsFromFirebase() {
    try {
        const snapshot = await db.collection('operations').get();
        const ops = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            // Documentos técnicos usados apenas para materializar as coleções não são operações.
            if (doc.id === 'setup' || data?.system === 'initialization') return;
            ops.push({ id: doc.id, ...data });
        });
        operations = ops;
        localStorage.setItem('operations', JSON.stringify(operations));
        console.log('Operações carregadas do Firebase:', operations.length);
        return operations;
    } catch (error) {
        console.error('Erro ao carregar operações do Firebase:', error);
        operations = JSON.parse(localStorage.getItem('operations')) || [];
        return operations;
    }
}

// Salvar operação no Firestore
async function saveOperationToFirebase(operation) {
    try {
        if (!operation.id) {
            operation.id = db.collection('operations').doc().id;
        }
        await db.collection('operations').doc(String(operation.id)).set(operation, { merge: true });
        console.log('Operação salva no Firebase:', operation.id);
        return true;
    } catch (error) {
        console.error('Erro ao salvar operação no Firebase:', error);
        return false;
    }
}

// Deletar operação do Firestore
async function deleteOperationFromFirebase(operationId) {
    try {
        await db.collection('operations').doc(String(operationId)).delete();
        console.log('Operação deletada do Firebase:', operationId);
        return true;
    } catch (error) {
        console.error('Erro ao deletar operação do Firebase:', error);
        return false;
    }
}

// Carregar operações do calendário do Firestore
async function loadExpiryOperationsFromFirebase() {
    try {
        const snapshot = await db.collection('expiryOperations').get();
        const ops = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            // Documentos técnicos usados apenas para materializar as coleções não são operações.
            if (doc.id === 'setup' || data?.system === 'initialization') return;
            ops.push({ id: doc.id, ...data });
        });
        expiryOperations = ops;
        localStorage.setItem('expiryOperations', JSON.stringify(expiryOperations));
        console.log('Operações de calendário carregadas do Firebase:', expiryOperations.length);
        return expiryOperations;
    } catch (error) {
        console.error('Erro ao carregar operações de calendário do Firebase:', error);
        expiryOperations = JSON.parse(localStorage.getItem('expiryOperations')) || [];
        return expiryOperations;
    }
}

// Salvar operação de calendário no Firestore
async function saveExpiryOperationToFirebase(operation) {
    try {
        if (!operation.id) {
            operation.id = db.collection('expiryOperations').doc().id;
        }
        await db.collection('expiryOperations').doc(String(operation.id)).set(operation, { merge: true });
        console.log('Operação de calendário salva no Firebase:', operation.id);
        return true;
    } catch (error) {
        console.error('Erro ao salvar operação de calendário no Firebase:', error);
        return false;
    }
}

// Deletar operação de calendário do Firestore
async function deleteExpiryOperationFromFirebase(operationId) {
    try {
        await db.collection('expiryOperations').doc(String(operationId)).delete();
        console.log('Operação de calendário deletada do Firebase:', operationId);
        return true;
    } catch (error) {
        console.error('Erro ao deletar operação de calendário do Firebase:', error);
        return false;
    }
}

// Carregar operações fechadas do Firestore
async function loadClosedOperationsFromFirebase() {
    try {
        const snapshot = await db.collection('closedOperations').get();
        const ops = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            // Documentos técnicos usados apenas para materializar as coleções não são operações.
            if (doc.id === 'setup' || data?.system === 'initialization') return;
            ops.push({ id: doc.id, ...data });
        });
        closedOperations = ops;
        localStorage.setItem('closedOperations', JSON.stringify(closedOperations));
        console.log('Operações fechadas carregadas do Firebase:', closedOperations.length);
        return closedOperations;
    } catch (error) {
        console.error('Erro ao carregar operações fechadas do Firebase:', error);
        closedOperations = JSON.parse(localStorage.getItem('closedOperations')) || [];
        return closedOperations;
    }
}

// Salvar operação fechada no Firestore
async function saveClosedOperationToFirebase(operation) {
    try {
        if (!operation.id) {
            operation.id = db.collection('closedOperations').doc().id;
        }
        await db.collection('closedOperations').doc(String(operation.id)).set(operation, { merge: true });
        console.log('Operação fechada salva no Firebase:', operation.id);
        return true;
    } catch (error) {
        console.error('Erro ao salvar operação fechada no Firebase:', error);
        return false;
    }
}

// Sincronizar dados ao carregar a página
async function syncAllDataFromFirebase() {
    console.log('Sincronizando dados do Firebase...');
    try {
        await Promise.all([
            loadOperationsFromFirebase(),
            loadExpiryOperationsFromFirebase(),
            loadClosedOperationsFromFirebase()
        ]);
        console.log('Sincronização completa!');
        return true;
    } catch (error) {
        console.error('Erro durante sincronização:', error);
        return false;
    }
}

// Sincronizar dados ao carregar a página
document.addEventListener('DOMContentLoaded', async () => {
    if (useFirebase && typeof db !== 'undefined') {
        await syncAllDataFromFirebase();
    }
});

console.log('Firebase Sync module loaded');
