// Armazenamento de dados
let expiryOperations = JSON.parse(localStorage.getItem('expiryOperations')) || [];
let dashboardOperations = JSON.parse(localStorage.getItem('operations')) || [];
let allOperations = [];

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    loadDashboardOperations();
    renderTimeline();
});

// Carregar operações do dashboard
function loadDashboardOperations() {
    dashboardOperations = JSON.parse(localStorage.getItem('operations')) || [];
}

// Combinar todas as operações
function combineOperations() {
    allOperations = [...expiryOperations];
    
    // Adicionar operações do dashboard que têm data de vencimento
    dashboardOperations.forEach(dashOp => {
        if (dashOp.expiryDate && !expiryOperations.find(op => op.id === dashOp.id)) {
            allOperations.push({
                id: dashOp.id,
                expiryDate: dashOp.expiryDate,
                asset: dashOp.asset,
                strike: dashOp.strike,
                type: dashOp.operationType,
                quantity: dashOp.quantity,
                entryPrice: dashOp.entryPrice,
                iv: dashOp.iv || 0,
                notes: dashOp.notes || '',
                closures: [],
                fromDashboard: true,
                createdAt: dashOp.createdAt
            });
        }
    });

    // Ordenar por data de vencimento
    allOperations.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
}

// Salvar dados
function saveExpiryData() {
    localStorage.setItem('expiryOperations', JSON.stringify(expiryOperations));
}

// Modal de Adição
function openAddExpiryModal() {
    document.getElementById('addExpiryModal').classList.add('active');
}

function closeAddExpiryModal() {
    document.getElementById('addExpiryModal').classList.remove('active');
    document.querySelector('#addExpiryModal form').reset();
}

// Modal de Encerramento
function openClosePartialModal(operationId) {
    const operation = allOperations.find(op => op.id === operationId);
    if (!operation) return;

    const openQuantity = operation.quantity - (operation.closures?.reduce((sum, c) => sum + c.quantity, 0) || 0);
    
    document.getElementById('closeOperationId').value = operationId;
    document.getElementById('closeQuantity').value = '';
    document.getElementById('closePrice').value = '';
    document.getElementById('closeDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('availableQty').textContent = `Quantidade aberta: ${openQuantity.toFixed(2)}`;
    document.getElementById('closePartialModal').classList.add('active');
}

function closeClosePartialModal() {
    document.getElementById('closePartialModal').classList.remove('active');
}

// Adicionar operação com vencimento
function addExpiryOperation(event) {
    event.preventDefault();

    const operation = {
        id: Date.now(),
        expiryDate: document.getElementById('expiryDate').value,
        asset: document.getElementById('expiryAsset').value,
        strike: parseFloat(document.getElementById('expiryStrike').value),
        type: document.getElementById('expiryType').value,
        quantity: parseFloat(document.getElementById('expiryQuantity').value),
        entryPrice: parseFloat(document.getElementById('expiryEntryPrice').value),
        iv: parseFloat(document.getElementById('expiryIV').value) || 0,
        notes: document.getElementById('expiryNotes').value,
        closures: [],
        createdAt: new Date().toISOString()
    };

    expiryOperations.push(operation);
    
    saveExpiryData();
    closeAddExpiryModal();
    renderTimeline();
}

// Salvar encerramento parcial
function savePartialClose(event) {
    event.preventDefault();

    const operationId = parseInt(document.getElementById('closeOperationId').value);
    const operation = allOperations.find(op => op.id === operationId);

    if (!operation) return;

    const closeQuantity = parseFloat(document.getElementById('closeQuantity').value);
    const closePrice = parseFloat(document.getElementById('closePrice').value);
    const closeDate = document.getElementById('closeDate').value;

    // Validar quantidade
    const openQuantity = operation.quantity - (operation.closures?.reduce((sum, c) => sum + c.quantity, 0) || 0);
    if (closeQuantity > openQuantity) {
        alert(`Quantidade inválida! Aberta: ${openQuantity.toFixed(2)}`);
        return;
    }

    // Adicionar encerramento
    if (!operation.closures) {
        operation.closures = [];
    }

    operation.closures.push({
        quantity: closeQuantity,
        price: closePrice,
        date: closeDate,
        timestamp: Date.now()
    });

    // Se a operação é do dashboard, não salvar em expiryOperations
    // Se é do calendário, salvar
    if (!operation.fromDashboard) {
        saveExpiryData();
    }

    closeClosePartialModal();
    renderTimeline();
}

// Deletar operação
function deleteExpiryOperation(operationId) {
    if (confirm('Tem certeza que deseja deletar esta operação?')) {
        const operation = allOperations.find(op => op.id === operationId);
        
        if (operation && !operation.fromDashboard) {
            expiryOperations = expiryOperations.filter(op => op.id !== operationId);
            saveExpiryData();
        }
        
        renderTimeline();
    }
}

// Deletar encerramento
function deleteClosureItem(operationId, timestamp) {
    const operation = allOperations.find(op => op.id === operationId);
    if (operation && operation.closures) {
        operation.closures = operation.closures.filter(c => c.timestamp !== timestamp);
        
        if (!operation.fromDashboard) {
            saveExpiryData();
        }
        
        renderTimeline();
    }
}

// Calcular P&L de um encerramento
function calculateClosurePnL(operation, closure) {
    const entryValue = operation.entryPrice * closure.quantity;
    const exitValue = closure.price * closure.quantity;

    if (operation.type.includes('sold')) {
        return entryValue - exitValue;
    }

    return exitValue - entryValue;
}

// Calcular preço médio de encerramentos
function calculateAverageClosePrice(closures) {
    if (closures.length === 0) return 0;
    const totalValue = closures.reduce((sum, c) => sum + (c.price * c.quantity), 0);
    const totalQty = closures.reduce((sum, c) => sum + c.quantity, 0);
    return totalValue / totalQty;
}

// Calcular P&L total
function calculateTotalClosurePnL(operation) {
    if (!operation.closures || operation.closures.length === 0) return 0;
    return operation.closures.reduce((sum, closure) => sum + calculateClosurePnL(operation, closure), 0);
}

// Renderizar timeline
function renderTimeline() {
    loadDashboardOperations();
    combineOperations();
    
    const timeline = document.getElementById('timeline');

    if (allOperations.length === 0) {
        timeline.innerHTML = '<div class="timeline-empty"><p>Nenhuma operação com vencimento. Clique em "+ Adicionar Operação" para começar.</p></div>';
        return;
    }

    timeline.innerHTML = allOperations.map((operation, index) => {
        const expiryDate = new Date(operation.expiryDate);
        const daysToExpiry = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
        const closedQuantity = operation.closures?.reduce((sum, c) => sum + c.quantity, 0) || 0;
        const openQuantity = operation.quantity - closedQuantity;
        const typeBadge = operation.type.includes('call') ? 'badge-call' : 'badge-put';
        const typeLabel = getTypeLabel(operation.type);
        const totalPnL = calculateTotalClosurePnL(operation);
        const avgClosePrice = calculateAverageClosePrice(operation.closures || []);
        const sourceLabel = operation.fromDashboard ? ' (Dashboard)' : '';

        let statusBadge = 'status-open';
        if (closedQuantity > 0 && openQuantity > 0) {
            statusBadge = 'status-partial';
        } else if (openQuantity === 0) {
            statusBadge = 'status-closed';
        }

        return `
            <div class="timeline-item">
                <div class="timeline-marker">${index + 1}</div>
                <div class="timeline-content">
                    <div class="timeline-date">${expiryDate.toLocaleDateString('pt-BR')} (${daysToExpiry} dias)</div>
                    
                    <div class="expiry-card">
                        <div class="expiry-header">
                            <div>
                                <div class="expiry-title">${operation.asset} - Strike ${operation.strike.toFixed(2)}${sourceLabel}</div>
                                <small style="color: var(--text-secondary);">${operation.notes || ''}</small>
                            </div>
                            <span class="expiry-badge ${typeBadge}">${typeLabel}</span>
                        </div>

                        <div class="expiry-details">
                            <div class="detail-row">
                                <span class="detail-label">Qtd Total:</span>
                                <span class="detail-value">${operation.quantity.toFixed(2)}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Preço Entrada:</span>
                                <span class="detail-value">R$ ${operation.entryPrice.toFixed(2)}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Qtd Aberta:</span>
                                <span class="detail-value" style="color: var(--primary-color);">${openQuantity.toFixed(2)}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Qtd Encerrada:</span>
                                <span class="detail-value" style="color: var(--success-color);">${closedQuantity.toFixed(2)}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">IV:</span>
                                <span class="detail-value">${operation.iv.toFixed(1)}%</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Preço Médio Saída:</span>
                                <span class="detail-value">R$ ${avgClosePrice.toFixed(2)}</span>
                            </div>
                        </div>

                        ${operation.closures && operation.closures.length > 0 ? `
                            <div class="closures-section">
                                <div class="closures-title">📊 Encerramentos</div>
                                ${operation.closures.map(closure => {
                                    const closurePnL = calculateClosurePnL(operation, closure);
                                    const pnlClass = closurePnL >= 0 ? 'positive' : 'negative';
                                    const pnlSign = closurePnL >= 0 ? '+' : '';
                                    return `
                                        <div class="closure-item">
                                            <div class="closure-info">
                                                <div class="closure-qty">Qtd: ${closure.quantity.toFixed(2)} @ R$ ${closure.price.toFixed(2)}</div>
                                                <div class="closure-price">${new Date(closure.date).toLocaleDateString('pt-BR')}</div>
                                            </div>
                                            <div class="closure-pnl ${pnlClass}">${pnlSign}R$ ${Math.abs(closurePnL).toFixed(2)}</div>
                                            <button class="btn-delete" onclick="deleteClosureItem(${operation.id}, ${closure.timestamp})" style="padding: 4px 8px; font-size: 0.75rem; margin-left: 8px;">×</button>
                                        </div>
                                    `;
                                }).join('')}
                            </div>

                            <div class="summary-section">
                                <div class="summary-row">
                                    <span class="summary-label">Preço Médio Saída:</span>
                                    <span class="summary-value">R$ ${avgClosePrice.toFixed(2)}</span>
                                </div>
                                <div class="summary-row">
                                    <span class="summary-label">P&L Total:</span>
                                    <span class="summary-value" style="color: ${totalPnL >= 0 ? 'var(--success-color)' : 'var(--danger-color)'};">${totalPnL >= 0 ? '+' : ''}R$ ${totalPnL.toFixed(2)}</span>
                                </div>
                            </div>
                        ` : ''}

                        <div class="position-status">
                            <span class="status-badge ${statusBadge}">
                                ${statusBadge === 'status-open' ? '🟢 Aberta' : statusBadge === 'status-partial' ? '🟡 Parcial' : '🟢 Encerrada'}
                            </span>
                        </div>

                        <div class="expiry-actions">
                            <button class="btn-close" onclick="openClosePartialModal(${operation.id})">💰 Encerrar</button>
                            ${!operation.fromDashboard ? `<button class="btn-delete" onclick="deleteExpiryOperation(${operation.id})">🗑️ Deletar</button>` : '<span style="color: var(--text-secondary); font-size: 0.8rem; padding: 6px 10px;">Sincronizado com Dashboard</span>'}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Função auxiliar
function getTypeLabel(type) {
    const labels = {
        'call': 'Call Comprada',
        'put': 'Put Comprada',
        'call-sold': 'Call Vendida',
        'put-sold': 'Put Vendida'
    };
    return labels[type] || type;
}

// Fechar modais ao clicar fora
window.addEventListener('click', (event) => {
    const addModal = document.getElementById('addExpiryModal');
    const closeModal = document.getElementById('closePartialModal');

    if (event.target === addModal) {
        closeAddExpiryModal();
    }
    if (event.target === closeModal) {
        closeClosePartialModal();
    }
});
