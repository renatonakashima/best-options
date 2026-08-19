// Módulo de Sincronização com Firebase Firestore e Isolamento por Usuário
let useFirebase = true;

// Obter ID do usuário atual ou fallback
function getEffectiveUserId() {
    if (typeof currentUser !== 'undefined' && currentUser && currentUser.uid) {
        return currentUser.uid;
    }
    // Fallback temporário antes do auth carregar
    return 'public_guest';
}

// Carregar operações do Firestore para o usuário atual
async function loadOperationsFromFirebase() {
    try {
        const uid = getEffectiveUserId();
        const snapshot = await db.collection('operations').where('userId', '==', uid).get();
        const ops = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            if (doc.id === 'setup' || data?.system === 'initialization') return;
            ops.push({ id: doc.id, ...data });
        });
        operations = ops;
        localStorage.setItem('operations', JSON.stringify(operations));
        console.log('Operações carregadas do Firebase para usuário:', uid, operations.length);
        return operations;
    } catch (error) {
        console.error('Erro ao carregar operações do Firebase:', error);
        operations = JSON.parse(localStorage.getItem('operations')) || [];
        return operations;
    }
}

// Salvar operação no Firestore com userId
async function saveOperationToFirebase(operation) {
    try {
        const uid = getEffectiveUserId();
        operation.userId = uid;
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

// Carregar operações de calendário do Firestore para o usuário atual
async function loadExpiryOperationsFromFirebase() {
    try {
        const uid = getEffectiveUserId();
        const snapshot = await db.collection('expiryOperations').where('userId', '==', uid).get();
        const ops = [];
        snapshot.forEach(doc => {
            const data = doc.data();
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

// Salvar operação de calendário no Firestore com userId
async function saveExpiryOperationToFirebase(operation) {
    try {
        const uid = getEffectiveUserId();
        operation.userId = uid;
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

// Carregar operações fechadas do Firestore para o usuário atual
async function loadClosedOperationsFromFirebase() {
    try {
        const uid = getEffectiveUserId();
        const snapshot = await db.collection('closedOperations').where('userId', '==', uid).get();
        const ops = [];
        snapshot.forEach(doc => {
            const data = doc.data();
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

// Salvar operação fechada no Firestore com userId
async function saveClosedOperationToFirebase(operation) {
    try {
        const uid = getEffectiveUserId();
        operation.userId = uid;
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

// Sincronizar dados do usuário ao carregar
async function syncAllDataFromFirebase() {
    console.log('Sincronizando dados do Firebase para usuário:', getEffectiveUserId());
    try {
        await Promise.all([
            loadOperationsFromFirebase(),
            loadExpiryOperationsFromFirebase(),
            loadClosedOperationsFromFirebase()
        ]);
        console.log('Sincronização completa!');
        // Atualizar renderizações se as funções existirem na página
        if (typeof renderPositions === 'function') renderPositions();
        if (typeof renderHistory === 'function') renderHistory();
        if (typeof renderTimeline === 'function') renderTimeline();
        return true;
    } catch (error) {
        console.error('Erro durante sincronização:', error);
        return false;
    }
}

// Inicializar autenticação e sincronização ao carregar o DOM
document.addEventListener('DOMContentLoaded', () => {
    if (typeof initAuth === 'function') {
        initAuth(async (user) => {
            if (useFirebase && typeof db !== 'undefined') {
                await syncAllDataFromFirebase();
            }
        });
    } else {
        setTimeout(async () => {
            if (useFirebase && typeof db !== 'undefined') {
                await syncAllDataFromFirebase();
            }
        }, 500);
    }
});

console.log('Firebase Sync module with user isolation loaded');
