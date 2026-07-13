// Armazenamento de dados
let operations = JSON.parse(localStorage.getItem('operations')) || [];
let closedOperations = JSON.parse(localStorage.getItem('closedOperations')) || [];

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    updatePortfolioStats();
    renderPositions();
    renderHistory();
    updateAnalytics();
});

// Salvar dados no localStorage
function saveData() {
    localStorage.setItem('operations', JSON.stringify(operations));
    localStorage.setItem('closedOperations', JSON.stringify(closedOperations));
}

// Modal de Nova Operação
function openAddOperationModal() {
    document.getElementById('operationModal').classList.add('active');
}

function closeAddOperationModal() {
    document.getElementById('operationModal').classList.remove('active');
    document.querySelector('#operationModal form').reset();
}

// Modal de Edição
function openEditModal(id) {
    const operation = operations.find(op => op.id === id);
    if (!operation) return;

    document.getElementById('editId').value = id;
    document.getElementById('editCurrentPrice').value = operation.currentPrice || operation.entryPrice;
    document.getElementById('editStatus').value = operation.status || 'open';
    document.getElementById('editExitPrice').value = operation.exitPrice || '';
    document.getElementById('editCloseDate').value = operation.closeDate || '';
    document.getElementById('editModal').classList.add('active');
}

function closeEditModal() {
    document.getElementById('editModal').classList.remove('active');
    document.querySelector('#editModal form').reset();
}

// Adicionar nova operação
function addOperation(event) {
    event.preventDefault();

    const operation = {
        id: Date.now(),
        asset: document.getElementById('asset').value,
        operationType: document.getElementById('operationType').value,
        strike: parseFloat(document.getElementById('strike').value),
        quantity: parseInt(document.getElementById('quantity').value),
        entryPrice: parseFloat(document.getElementById('entryPrice').value),
        currentPrice: parseFloat(document.getElementById('entryPrice').value),
        expiryDate: document.getElementById('expiryDate').value,
        iv: parseFloat(document.getElementById('iv').value) || 0,
        delta: parseFloat(document.getElementById('delta').value) || 0,
        theta: parseFloat(document.getElementById('theta').value) || 0,
        notes: document.getElementById('notes').value,
        status: 'open',
        createdAt: new Date().toISOString(),
    };

    operations.push(operation);
    saveData();
    closeAddOperationModal();
    updatePortfolioStats();
    renderPositions();
    updateAnalytics();
}

// Salvar operação editada
function saveEditedOperation(event) {
    event.preventDefault();

    const id = parseInt(document.getElementById('editId').value);
    const operation = operations.find(op => op.id === id);

    if (operation) {
        operation.currentPrice = parseFloat(document.getElementById('editCurrentPrice').value);
        operation.status = document.getElementById('editStatus').value;

        if (operation.status === 'closed' || operation.status === 'expired') {
            operation.exitPrice = parseFloat(document.getElementById('editExitPrice').value) || operation.currentPrice;
            operation.closeDate = document.getElementById('editCloseDate').value || new Date().toISOString().split('T')[0];

            // Mover para histórico
            closedOperations.push(operation);
            operations = operations.filter(op => op.id !== id);
        }

        saveData();
        closeEditModal();
        updatePortfolioStats();
        renderPositions();
        renderHistory();
        updateAnalytics();
    }
}

// Deletar operação
function deleteOperation(id) {
    if (confirm('Tem certeza que deseja deletar esta operação?')) {
        operations = operations.filter(op => op.id !== id);
        saveData();
        updatePortfolioStats();
        renderPositions();
        updateAnalytics();
    }
}

// Renderizar posições abertas
function renderPositions() {
    const grid = document.getElementById('positionsGrid');

    if (operations.length === 0) {
        grid.innerHTML = '<div class="empty-state"><p>Nenhuma posição aberta. Clique em "+ Nova Operação" para começar.</p></div>';
        return;
    }

    grid.innerHTML = operations.map(op => {
        const pnl = calculatePnL(op);
        const pnlClass = pnl >= 0 ? 'pnl-positive' : 'pnl-negative';
        const pnlSign = pnl >= 0 ? '+' : '';
        const typeBadge = getTypeBadge(op.operationType);

        const daysToExpiry = Math.ceil((new Date(op.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));

        return `
            <div class="position-card">
                <div class="position-header">
                    <div>
                        <div class="position-title">${op.asset}</div>
                        <small style="color: var(--text-secondary);">Strike: ${op.strike.toFixed(2)}</small>
                    </div>
                    <span class="position-badge ${typeBadge}">${getTypeLabel(op.operationType)}</span>
                </div>

                <div class="position-details">
                    <div class="detail-item">
                        <span class="detail-label">Quantidade:</span>
                        <span class="detail-value">${op.quantity}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Preço Entrada:</span>
                        <span class="detail-value">R$ ${op.entryPrice.toFixed(2)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Preço Atual:</span>
                        <span class="detail-value">R$ ${op.currentPrice.toFixed(2)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Vencimento:</span>
                        <span class="detail-value">${daysToExpiry} dias</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">IV:</span>
                        <span class="detail-value">${op.iv.toFixed(1)}%</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Delta:</span>
                        <span class="detail-value">${op.delta.toFixed(2)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Theta:</span>
                        <span class="detail-value">${op.theta.toFixed(2)}</span>
                    </div>
                </div>

                <div class="position-pnl ${pnlClass}">
                    <div style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 5px;">P&L</div>
                    <div class="pnl-value">${pnlSign}R$ ${Math.abs(pnl).toFixed(2)}</div>
                </div>

                ${op.notes ? `<div style="padding: 10px; background: var(--surface-color); border-radius: 6px; font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 15px;"><strong>Notas:</strong> ${op.notes}</div>` : ''}

                <div class="position-actions">
                    <button class="btn-edit" onclick="openEditModal(${op.id})">✏️ Editar</button>
                    <button class="btn-delete" onclick="deleteOperation(${op.id})">🗑️ Deletar</button>
                </div>
            </div>
        `;
    }).join('');
}

// Renderizar histórico
function renderHistory() {
    const tbody = document.getElementById('historyTable');

    if (closedOperations.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">Nenhum histórico disponível</td></tr>';
        return;
    }

    tbody.innerHTML = closedOperations.map(op => {
        const pnl = calculatePnL(op);
        const pnlClass = pnl >= 0 ? 'text-success' : 'text-danger';

        return `
            <tr>
                <td>${op.closeDate || new Date(op.createdAt).toLocaleDateString('pt-BR')}</td>
                <td>${op.asset}</td>
                <td>${getTypeLabel(op.operationType)}</td>
                <td>Strike ${op.strike.toFixed(2)}</td>
                <td>${op.quantity}</td>
                <td>R$ ${op.entryPrice.toFixed(2)}</td>
                <td>R$ ${op.exitPrice.toFixed(2)}</td>
                <td class="${pnlClass}"><strong>R$ ${pnl.toFixed(2)}</strong></td>
            </tr>
        `;
    }).join('');
}

// Calcular P&L
function calculatePnL(operation) {
    const entryValue = operation.entryPrice * operation.quantity;
    const exitValue = (operation.exitPrice || operation.currentPrice) * operation.quantity;

    // Para operações vendidas, o cálculo é inverso
    if (operation.operationType.includes('sold')) {
        return entryValue - exitValue;
    }

    return exitValue - entryValue;
}

// Atualizar estatísticas da carteira
function updatePortfolioStats() {
    let totalValue = 0;
    let totalPnL = 0;

    operations.forEach(op => {
        totalValue += op.currentPrice * op.quantity;
        totalPnL += calculatePnL(op);
    });

    closedOperations.forEach(op => {
        totalPnL += calculatePnL(op);
    });

    document.getElementById('portfolioValue').textContent = `R$ ${totalValue.toFixed(2)}`;
    document.getElementById('totalPnL').textContent = `R$ ${totalPnL.toFixed(2)}`;

    // Cor do P&L
    const pnlElement = document.getElementById('totalPnL');
    if (totalPnL >= 0) {
        pnlElement.style.color = 'var(--success-color)';
    } else {
        pnlElement.style.color = 'var(--danger-color)';
    }
}

// Atualizar análise
function updateAnalytics() {
    const totalOps = operations.length + closedOperations.length;
    const expiredOps = operations.filter(op => new Date(op.expiryDate) < new Date()).length;

    let positivePnL = 0;
    let negativePnL = 0;
    let maxGain = 0;
    let maxLoss = 0;
    let totalDelta = 0;
    let totalTheta = 0;
    let totalIV = 0;

    closedOperations.forEach(op => {
        const pnl = calculatePnL(op);
        if (pnl >= 0) {
            positivePnL += pnl;
            maxGain = Math.max(maxGain, pnl);
        } else {
            negativePnL += Math.abs(pnl);
            maxLoss = Math.min(maxLoss, pnl);
        }
    });

    operations.forEach(op => {
        totalDelta += op.delta;
        totalTheta += op.theta;
        totalIV += op.iv;
    });

    const avgDelta = operations.length > 0 ? (totalDelta / operations.length).toFixed(2) : 0;
    const avgTheta = operations.length > 0 ? (totalTheta / operations.length).toFixed(2) : 0;
    const avgIV = operations.length > 0 ? (totalIV / operations.length).toFixed(1) : 0;

    const winRate = totalOps > 0 ? ((closedOperations.filter(op => calculatePnL(op) >= 0).length / totalOps) * 100).toFixed(1) : 0;

    document.getElementById('totalOps').textContent = totalOps;
    document.getElementById('expiredOps').textContent = expiredOps;
    document.getElementById('winRate').textContent = `${winRate}%`;
    document.getElementById('positivePnL').textContent = `R$ ${positivePnL.toFixed(2)}`;
    document.getElementById('negativePnL').textContent = `R$ ${negativePnL.toFixed(2)}`;
    document.getElementById('maxGain').textContent = `R$ ${maxGain.toFixed(2)}`;
    document.getElementById('maxLoss').textContent = `R$ ${Math.abs(maxLoss).toFixed(2)}`;
    document.getElementById('avgDelta').textContent = avgDelta;
    document.getElementById('avgTheta').textContent = avgTheta;
    document.getElementById('avgVolatility').textContent = `${avgIV}%`;
}

// Funções auxiliares
function getTypeLabel(type) {
    const labels = {
        'call': 'Call Comprada',
        'put': 'Put Comprada',
        'call-sold': 'Call Vendida',
        'put-sold': 'Put Vendida',
        'spread': 'Spread'
    };
    return labels[type] || type;
}

function getTypeBadge(type) {
    if (type.includes('call')) return 'badge-call';
    if (type.includes('put')) return 'badge-put';
    return 'badge-spread';
}

// Trocar abas
function switchTab(tabName) {
    // Esconder todas as abas
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });

    // Remover classe active de todos os botões
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Mostrar aba selecionada
    document.getElementById(tabName).classList.add('active');

    // Adicionar classe active ao botão clicado
    event.target.classList.add('active');

    // Atualizar dados se necessário
    if (tabName === 'history') {
        renderHistory();
    } else if (tabName === 'analytics') {
        updateAnalytics();
    }
}

// Exportar dados
function exportData() {
    const data = {
        operacoes_abertas: operations,
        operacoes_fechadas: closedOperations,
        data_exportacao: new Date().toISOString()
    };

    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `best-options-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
}

// Limpar todos os dados
function clearAllData() {
    if (confirm('Tem certeza que deseja limpar TODOS os dados? Esta ação não pode ser desfeita!')) {
        operations = [];
        closedOperations = [];
        saveData();
        updatePortfolioStats();
        renderPositions();
        renderHistory();
        updateAnalytics();
        alert('Todos os dados foram limpos.');
    }
}

// Fechar modais ao clicar fora deles
window.addEventListener('click', (event) => {
    const operationModal = document.getElementById('operationModal');
    const editModal = document.getElementById('editModal');

    if (event.target === operationModal) {
        closeAddOperationModal();
    }
    if (event.target === editModal) {
        closeEditModal();
    }
});
