// Armazenamento de dados
let operations = JSON.parse(localStorage.getItem('operations')) || [];
let closedOperations = JSON.parse(localStorage.getItem('closedOperations')) || [];
let financialValuesHidden = localStorage.getItem('financialValuesHidden') === 'true';

function updateFinancialVisibilityUI() {
    const toggle = document.getElementById('financialVisibilityToggle');
    const icon = document.getElementById('financialVisibilityIcon');
    if (!toggle || !icon) return;

    toggle.setAttribute('aria-checked', String(financialValuesHidden));
    toggle.setAttribute('aria-label', financialValuesHidden ? 'Mostrar valores financeiros' : 'Ocultar valores financeiros');
    toggle.title = financialValuesHidden ? 'Mostrar valores da Carteira e do P&L' : 'Ocultar valores da Carteira e do P&L';
    icon.textContent = financialValuesHidden ? '◉' : '👁';
}

function toggleFinancialVisibility() {
    financialValuesHidden = !financialValuesHidden;
    localStorage.setItem('financialValuesHidden', String(financialValuesHidden));
    updateFinancialVisibilityUI();
    updatePortfolioStats();
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    updateFinancialVisibilityUI();
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
    let operation = operations.find(op => op.id === id);
    if (!operation) {
        const calendarOperations = JSON.parse(localStorage.getItem('expiryOperations')) || [];
        const calOp = calendarOperations.find(op => op.id === id);
        if (calOp) {
            operation = {
                id: calOp.id,
                asset: calOp.asset,
                strike: calOp.strike,
                operationType: calOp.type,
                quantity: calOp.quantity,
                entryPrice: calOp.entryPrice,
                currentPrice: calOp.currentPrice !== undefined ? calOp.currentPrice : calOp.entryPrice,
                expiryDate: calOp.expiryDate,
                iv: calOp.iv || 0,
                delta: 0,
                theta: 0,
                notes: calOp.notes || '',
                status: 'open',
                fromCalendar: true
            };
        }
    }
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
    
    // Salvar no Firebase
    if (useFirebase && typeof saveOperationToFirebase === 'function') {
        saveOperationToFirebase(operation).catch(err => console.error('Erro ao salvar no Firebase:', err));
    }
    
    closeAddOperationModal();
    updatePortfolioStats();
    renderPositions();
    updateAnalytics();
}

// Salvar operação editada
function saveEditedOperation(event) {
    event.preventDefault();

    const id = parseInt(document.getElementById('editId').value);
    let operation = operations.find(op => op.id === id);
    let isCalendarOp = false;

    if (!operation) {
        const calendarOperations = JSON.parse(localStorage.getItem('expiryOperations')) || [];
        operation = calendarOperations.find(op => op.id === id);
        isCalendarOp = true;
    }

    if (operation) {
        operation.currentPrice = parseFloat(document.getElementById('editCurrentPrice').value);
        operation.status = document.getElementById('editStatus').value;

        if (operation.status === 'closed' || operation.status === 'expired') {
            operation.exitPrice = parseFloat(document.getElementById('editExitPrice').value) || operation.currentPrice;
            operation.closeDate = document.getElementById('editCloseDate').value || new Date().toISOString().split('T')[0];

            if (isCalendarOp) {
                const closedItem = {
                    id: operation.id,
                    asset: operation.asset,
                    strike: operation.strike,
                    operationType: operation.type || operation.operationType,
                    quantity: operation.quantity,
                    entryPrice: operation.entryPrice,
                    currentPrice: operation.currentPrice,
                    exitPrice: operation.exitPrice,
                    expiryDate: operation.expiryDate,
                    iv: operation.iv || 0,
                    delta: 0,
                    theta: 0,
                    notes: operation.notes || '',
                    status: operation.status,
                    closeDate: operation.closeDate,
                    createdAt: operation.createdAt || new Date().toISOString()
                };
                closedOperations.push(closedItem);

                let calendarOperations = JSON.parse(localStorage.getItem('expiryOperations')) || [];
                calendarOperations = calendarOperations.filter(op => op.id !== id);
                localStorage.setItem('expiryOperations', JSON.stringify(calendarOperations));

                if (useFirebase && typeof saveClosedOperationToFirebase === 'function') {
                    saveClosedOperationToFirebase(closedItem).catch(err => console.error('Erro ao salvar no Firebase:', err));
                }
                if (useFirebase && typeof deleteExpiryOperationFromFirebase === 'function') {
                    deleteExpiryOperationFromFirebase(id).catch(err => console.error('Erro ao deletar do Firebase:', err));
                }
            } else {
                closedOperations.push(operation);
                operations = operations.filter(op => op.id !== id);

                if (useFirebase && typeof saveClosedOperationToFirebase === 'function') {
                    saveClosedOperationToFirebase(operation).catch(err => console.error('Erro ao salvar no Firebase:', err));
                }
                if (useFirebase && typeof deleteOperationFromFirebase === 'function') {
                    deleteOperationFromFirebase(id).catch(err => console.error('Erro ao deletar do Firebase:', err));
                }
            }
        } else {
            if (isCalendarOp) {
                let calendarOperations = JSON.parse(localStorage.getItem('expiryOperations')) || [];
                const idx = calendarOperations.findIndex(op => op.id === id);
                if (idx !== -1) {
                    calendarOperations[idx].currentPrice = operation.currentPrice;
                    localStorage.setItem('expiryOperations', JSON.stringify(calendarOperations));
                    if (useFirebase && typeof saveExpiryOperationToFirebase === 'function') {
                        saveExpiryOperationToFirebase(calendarOperations[idx]).catch(err => console.error('Erro ao salvar no Firebase:', err));
                    }
                }
            } else {
                if (useFirebase && typeof saveOperationToFirebase === 'function') {
                    saveOperationToFirebase(operation).catch(err => console.error('Erro ao salvar no Firebase:', err));
                }
            }
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
        
        // Deletar do Firebase
        if (useFirebase && typeof deleteOperationFromFirebase === 'function') {
            deleteOperationFromFirebase(id).catch(err => console.error('Erro ao deletar do Firebase:', err));
        }
        
        updatePortfolioStats();
        renderPositions();
        updateAnalytics();
    }
}

// Renderizar posições abertas
function renderPositions() {
    const grid = document.getElementById('positionsGrid');
    
    // Carregar operações do calendário
    const calendarOperations = JSON.parse(localStorage.getItem('expiryOperations')) || [];
    
    // Combinar operações do dashboard com as do calendário
    const allOperations = [
        ...operations,
        ...calendarOperations.map(op => ({
            id: op.id,
            asset: op.asset,
            strike: op.strike,
            operationType: op.type,
            quantity: op.quantity,
            entryPrice: op.entryPrice,
            currentPrice: op.currentPrice !== undefined ? op.currentPrice : op.entryPrice,
            expiryDate: op.expiryDate,
            iv: op.iv || 0,
            delta: 0,
            theta: 0,
            notes: op.notes || '',
            fromCalendar: true,
            closures: op.closures || []
        }))
    ];

    if (allOperations.length === 0) {
        grid.innerHTML = '<div class="empty-state"><p>Nenhuma posição aberta. Clique em "+ Nova Operação" para começar.</p></div>';
        return;
    }

    // Ordenar por data de vencimento (mais próxima primeiro) e depois por nome do ativo (alfabético)
    allOperations.sort((a, b) => {
        const dateA = new Date(a.expiryDate);
        const dateB = new Date(b.expiryDate);
        
        // Primeiro, ordenar por data de vencimento
        if (dateA !== dateB) {
            return dateA - dateB;
        }
        
        // Se as datas são iguais, ordenar por nome do ativo (alfabético)
        return a.asset.localeCompare(b.asset);
    });

    grid.innerHTML = allOperations.map(op => {
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

    document.getElementById('portfolioValue').textContent = financialValuesHidden
        ? 'R$ ••••••'
        : `R$ ${totalValue.toFixed(2)}`;
    document.getElementById('totalPnL').textContent = financialValuesHidden
        ? 'R$ ••••••'
        : `R$ ${totalPnL.toFixed(2)}`;

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

    // Resumo por tipo de operação (Call Comprada, Call Vendida, Put Comprada, Put Vendida)
    const typesConfig = [
        { key: 'call', label: 'Call Comprada', isSold: false },
        { key: 'call-sold', label: 'Call Vendida', isSold: true },
        { key: 'put', label: 'Put Comprada', isSold: false },
        { key: 'put-sold', label: 'Put Vendida', isSold: true }
    ];

    // Combinar operações abertas do dashboard, calendário e fechadas para abranger todo o histórico / carteira
    const calendarOperations = JSON.parse(localStorage.getItem('expiryOperations')) || [];
    const allKnownOperations = [
        ...operations,
        ...closedOperations,
        ...calendarOperations.map(calOp => ({
            id: calOp.id,
            asset: calOp.asset,
            operationType: calOp.type || calOp.operationType,
            strike: calOp.strike,
            quantity: calOp.quantity,
            entryPrice: calOp.entryPrice,
            currentPrice: calOp.currentPrice || calOp.entryPrice,
            notes: calOp.notes || ''
        }))
    ];

    let grandTotalQuantity = 0;
    let grandTotalAllocated = 0;
    let grandTotalRational = 0;

    const summaryRowsHTML = typesConfig.map(cfg => {
        const matchingOps = allKnownOperations.filter(op => {
            const opType = (op.operationType || op.type || '').toLowerCase();
            return opType === cfg.key;
        });

        let totalQty = 0;
        let totalAllocated = 0;
        let totalRational = 0;

        matchingOps.forEach(op => {
            const qty = Number(op.quantity || 0);
            const price = Number(op.currentPrice !== undefined ? op.currentPrice : (op.entryPrice || 0));
            const strike = Number(op.strike || 0);
            const allocated = qty * price;
            const opRational = qty * strike;

            totalQty += qty;
            totalAllocated += allocated;
            totalRational += opRational;
        });

        // Compradas são positivas, vendidas são negativas
        const signedQty = cfg.isSold ? -totalQty : totalQty;
        const signedAllocated = cfg.isSold ? -totalAllocated : totalAllocated;
        const signedRational = cfg.isSold ? -totalRational : totalRational;

        grandTotalQuantity += signedQty;
        grandTotalAllocated += signedAllocated;
        grandTotalRational += signedRational;

        const qtyDisplay = cfg.isSold ? `-${Math.abs(signedQty).toFixed(2)}` : `${Math.abs(signedQty).toFixed(2)}`;
        const allocatedColor = signedAllocated >= 0 ? 'var(--success-color)' : 'var(--danger-color)';
        const allocatedDisplay = `${signedAllocated >= 0 ? '+' : ''}R$ ${Math.abs(signedAllocated).toFixed(2)}`;
        
        const rationalColor = signedRational >= 0 ? 'var(--success-color)' : 'var(--danger-color)';
        const rationalDisplay = matchingOps.length > 0 ? `${signedRational >= 0 ? '+' : ''}R$ ${Math.abs(signedRational).toFixed(2)}` : 'R$ 0,00';

        return `
            <tr style="border-bottom: 1px solid var(--border-color);">
                <td style="padding: 12px; font-weight: 600;">${cfg.label}</td>
                <td style="padding: 12px;">${qtyDisplay}</td>
                <td style="padding: 12px; color: ${allocatedColor}; font-weight: 600;">${allocatedDisplay}</td>
                <td style="padding: 12px; font-weight: 600; color: ${rationalColor};">${rationalDisplay}</td>
            </tr>
        `;
    }).join('');

    // Linha de Total Geral de Todas as Operações
    const grandAllocatedColor = grandTotalAllocated >= 0 ? 'var(--success-color)' : 'var(--danger-color)';
    const grandAllocatedDisplay = `${grandTotalAllocated >= 0 ? '+' : ''}R$ ${Math.abs(grandTotalAllocated).toFixed(2)}`;
    const grandQtyDisplay = `${grandTotalQuantity >= 0 ? '+' : ''}${grandTotalQuantity.toFixed(2)}`;
    const grandRationalColor = grandTotalRational >= 0 ? 'var(--success-color)' : 'var(--danger-color)';
    const grandRationalDisplay = `${grandTotalRational >= 0 ? '+' : ''}R$ ${Math.abs(grandTotalRational).toFixed(2)}`;

    const grandTotalRowHTML = `
        <tr style="background: rgba(59, 130, 246, 0.08); font-weight: bold; border-top: 2px solid var(--border-color);">
            <td style="padding: 14px; color: var(--primary-color);">VALOR TOTAL DE TODAS AS OPERAÇÕES</td>
            <td style="padding: 14px;">${grandQtyDisplay}</td>
            <td style="padding: 14px; color: ${grandAllocatedColor}; font-size: 1.05rem;">${grandAllocatedDisplay}</td>
            <td style="padding: 14px; font-size: 0.9rem; color: var(--text-primary);">
                Notion Total: <span style="color: ${grandRationalColor};">${grandRationalDisplay}</span> 
                <br><span style="font-size: 0.8rem; color: var(--text-secondary);">(Quantidade x Strike | Compradas positivas, Vendidas negativas)</span>
            </td>
        </tr>
    `;

    const summaryTableElement = document.getElementById('analyticsTypeSummaryTable');
    if (summaryTableElement) {
        summaryTableElement.innerHTML = summaryRowsHTML + grandTotalRowHTML;
    }

    // Renderizar gráfico de evolução patrimonial mensal
    renderPatrimonyChart(allKnownOperations);
}

let patrimonyChartInstance = null;

function renderPatrimonyChart(allKnownOps) {
    const ctx = document.getElementById('patrimonyChart');
    if (!ctx) return;

    // Agrupar operações por mês (baseado em createdAt ou expiryDate)
    const monthlyData = {};

    allKnownOps.forEach(op => {
        let dateStr = op.createdAt || op.expiryDate || new Date().toISOString();
        let date = new Date(dateStr);
        if (isNaN(date)) date = new Date();

        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { invested: 0, pnl: 0 };
        }

        const qty = Number(op.quantity || 0);
        const entryPrice = Number(op.entryPrice || 0);
        const invested = qty * entryPrice;
        const pnl = calculatePnL(op);

        monthlyData[monthKey].invested += invested;
        monthlyData[monthKey].pnl += pnl;
    });

    // Ordenar os meses cronologicamente
    const sortedMonths = Object.keys(monthlyData).sort();

    if (sortedMonths.length === 0) {
        // Mês atual como padrão se vazio
        const now = new Date();
        const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        sortedMonths.push(currentMonthKey);
        monthlyData[currentMonthKey] = { invested: 0, pnl: 0 };
    }

    const labels = [];
    const patrimonyValues = [];

    sortedMonths.forEach(monthKey => {
        const [year, month] = monthKey.split('-');
        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        labels.push(`${monthNames[parseInt(month, 10) - 1]}/${year}`);

        const dataObj = monthlyData[monthKey];
        // Patrimônio = Total investido somado com o lucro ou perda
        const totalPatrimony = dataObj.invested + dataObj.pnl;
        patrimonyValues.push(totalPatrimony);
    });

    if (patrimonyChartInstance) {
        patrimonyChartInstance.destroy();
    }

    patrimonyChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Patrimônio (Investido + P&L)',
                data: patrimonyValues,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.3,
                pointRadius: 5,
                pointBackgroundColor: '#3b82f6'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let value = context.parsed.y || 0;
                            return `Patrimônio: R$ ${value.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        callback: function(value) {
                            return `R$ ${value.toFixed(0)}`;
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
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

// Modal de segurança para limpar todos os dados
function clearAllData() {
    const modal = document.getElementById('clearDataModal');
    if (!modal) return;
    modal.classList.add('active');
    const cancelButton = modal.querySelector('.clear-data-cancel');
    if (cancelButton) cancelButton.focus();
}

function closeClearDataModal() {
    const modal = document.getElementById('clearDataModal');
    if (modal) modal.classList.remove('active');
}

function exportDataFromClearModal() {
    exportData();
    closeClearDataModal();
}

function confirmClearAllData() {
    operations = [];
    closedOperations = [];
    localStorage.removeItem('expiryOperations');
    saveData();
    updatePortfolioStats();
    renderPositions();
    renderHistory();
    updateAnalytics();
    closeClearDataModal();
    alert('Todos os dados foram limpos.');
}

// Fechar modais ao clicar fora deles
window.addEventListener('click', (event) => {
    const operationModal = document.getElementById('operationModal');
    const editModal = document.getElementById('editModal');
    const clearDataModal = document.getElementById('clearDataModal');

    if (event.target === operationModal) {
        closeAddOperationModal();
    }
    if (event.target === editModal) {
        closeEditModal();
    }
    if (event.target === clearDataModal) {
        closeClearDataModal();
    }
});
