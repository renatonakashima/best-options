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
                closures: Array.isArray(dashOp.closures) ? dashOp.closures : [],
                currentPrice: dashOp.currentPrice,
                status: dashOp.status || 'open',
                fromDashboard: true,
                createdAt: dashOp.createdAt
            });
        }
    });

    // Ordenar por data de vencimento
    allOperations.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
}

// Gerar datas de vencimento B3
function generateB3ExpiryDates() {
    const dates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Encontrar a primeira operação para começar do passado
    let startDate = new Date(today);
    if (allOperations.length > 0) {
        const firstOpDate = new Date(allOperations[0].expiryDate);
        startDate = new Date(firstOpDate);
        startDate.setHours(0, 0, 0, 0);
    }
    
    // Gerar datas para 24 meses para frente
    const endDate = new Date(today);
    endDate.setMonth(endDate.getMonth() + 24);
    
    // Começar do mês anterior à primeira operação
    let currentDate = new Date(startDate);
    currentDate.setMonth(currentDate.getMonth() - 1);
    currentDate.setDate(1);
    
    while (currentDate <= endDate) {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        // Encontrar todas as sextas-feiras do mês (padrão B3 para opções sobre ações)
        const fridays = [];
        const tempDate = new Date(year, month, 1);
        
        while (tempDate.getMonth() === month) {
            if (tempDate.getDay() === 5) { // 5 = sexta-feira
                fridays.push(new Date(tempDate));
            }
            tempDate.setDate(tempDate.getDate() + 1);
        }
        
        // Adicionar as sextas-feiras como W1, W2, W3 (ou estrela), W4, W5
        fridays.forEach((fri, index) => {
            const weekNum = index + 1;
            const weekLabel = weekNum === 3 ? '⭐' : `W${weekNum}`;
            dates.push({
                date: new Date(fri),
                label: weekLabel,
                month: month,
                year: year,
                monthColor: getMonthColor(month)
            });
        });
        
        currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    return dates;
}

// Obter cor do mês
function getMonthColor(month) {
    const monthColors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#6366f1', '#14b8a6', '#f97316', '#a855f7', '#0891b2', '#dc2626'];
    return monthColors[month];
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
    const operation = allOperations.find(op => String(op.id) === String(operationId));
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
    
    // Salvar no Firebase
    if (useFirebase && typeof saveExpiryOperationToFirebase === 'function') {
        saveExpiryOperationToFirebase(operation).catch(err => console.error('Erro ao salvar no Firebase:', err));
    }
    
    closeAddExpiryModal();
    renderTimeline();
}

// Salvar encerramento parcial
function savePartialClose(event) {
    event.preventDefault();

    const rawOperationId = document.getElementById('closeOperationId').value;
    const operation = allOperations.find(op => String(op.id) === String(rawOperationId));

    if (!operation) return;

    const closeQuantity = parseFloat(document.getElementById('closeQuantity').value);
    const closePrice = parseFloat(document.getElementById('closePrice').value);
    const closeDate = document.getElementById('closeDate').value;

    if (!Number.isFinite(closeQuantity) || closeQuantity <= 0 || !Number.isFinite(closePrice) || !closeDate) {
        alert('Informe quantidade, preço de saída e data válidos.');
        return;
    }

    const closedQuantityBefore = (operation.closures || []).reduce((sum, c) => sum + Number(c.quantity || 0), 0);
    const openQuantity = Number(operation.quantity || 0) - closedQuantityBefore;
    if (closeQuantity > openQuantity) {
        alert(`Quantidade inválida! Aberta: ${openQuantity.toFixed(2)}`);
        return;
    }

    if (!operation.closures) operation.closures = [];
    operation.closures.push({ quantity: closeQuantity, price: closePrice, date: closeDate, timestamp: Date.now() });

    const totalClosedQuantity = operation.closures.reduce((sum, c) => sum + Number(c.quantity || 0), 0);
    const remainingQuantity = Number(operation.quantity || 0) - totalClosedQuantity;

    if (operation.fromDashboard) {
        const dashOpIndex = dashboardOperations.findIndex(op => String(op.id) === String(operation.id));
        if (dashOpIndex !== -1) {
            const sourceOperation = dashboardOperations[dashOpIndex];
            sourceOperation.closures = operation.closures;

            if (remainingQuantity <= 0) {
                const closedItem = {
                    ...sourceOperation,
                    id: sourceOperation.id,
                    operationType: sourceOperation.operationType || operation.type,
                    status: 'closed',
                    exitPrice: calculateAverageClosePrice(operation.closures),
                    currentPrice: calculateAverageClosePrice(operation.closures),
                    closeDate
                };
                closedOperations = [...(closedOperations || []), closedItem];
                dashboardOperations.splice(dashOpIndex, 1);
                localStorage.setItem('closedOperations', JSON.stringify(closedOperations));
                localStorage.setItem('operations', JSON.stringify(dashboardOperations));
                if (useFirebase && typeof saveClosedOperationToFirebase === 'function') {
                    saveClosedOperationToFirebase(closedItem).catch(err => console.error('Erro ao salvar operação fechada no Firebase:', err));
                }
                if (useFirebase && typeof deleteOperationFromFirebase === 'function') {
                    deleteOperationFromFirebase(sourceOperation.id).catch(err => console.error('Erro ao remover operação aberta do Firebase:', err));
                }
            } else {
                localStorage.setItem('operations', JSON.stringify(dashboardOperations));
                if (useFirebase && typeof saveOperationToFirebase === 'function') {
                    saveOperationToFirebase(sourceOperation).catch(err => console.error('Erro ao atualizar operação do Dashboard no Firebase:', err));
                }
            }
        }
    } else {
        const expiryOpIndex = expiryOperations.findIndex(op => String(op.id) === String(operation.id));
        if (expiryOpIndex !== -1) expiryOperations[expiryOpIndex].closures = operation.closures;

        if (remainingQuantity <= 0) {
            const sourceOperation = expiryOpIndex !== -1 ? expiryOperations[expiryOpIndex] : operation;
            const closeAverage = calculateAverageClosePrice(operation.closures);
            const closedItem = {
                ...sourceOperation,
                operationType: sourceOperation.operationType || sourceOperation.type,
                status: 'closed',
                exitPrice: closeAverage,
                currentPrice: closeAverage,
                closeDate
            };
            closedOperations = [...(closedOperations || []), closedItem];
            expiryOperations = expiryOperations.filter(op => String(op.id) !== String(operation.id));
            localStorage.setItem('closedOperations', JSON.stringify(closedOperations));
            saveExpiryData();
            if (useFirebase && typeof saveClosedOperationToFirebase === 'function') {
                saveClosedOperationToFirebase(closedItem).catch(err => console.error('Erro ao salvar operação de calendário fechada no Firebase:', err));
            }
            if (useFirebase && typeof deleteExpiryOperationFromFirebase === 'function') {
                deleteExpiryOperationFromFirebase(operation.id).catch(err => console.error('Erro ao remover operação de calendário do Firebase:', err));
            }
        } else {
            saveExpiryData();
            if (useFirebase && typeof saveExpiryOperationToFirebase === 'function') {
                saveExpiryOperationToFirebase(operation).catch(err => console.error('Erro ao atualizar operação do Calendário no Firebase:', err));
            }
        }
    }

    closeClosePartialModal();
    renderTimeline();
}

// Deletar operação
function deleteExpiryOperation(operationId) {
    if (confirm('Tem certeza que deseja deletar esta operação?')) {
        const operation = allOperations.find(op => String(op.id) === String(operationId));
        
        if (operation) {
            if (operation.fromDashboard) {
                dashboardOperations = dashboardOperations.filter(op => String(op.id) !== String(operationId));
                localStorage.setItem('operations', JSON.stringify(dashboardOperations));
                if (useFirebase && typeof deleteOperationFromFirebase === 'function') {
                    deleteOperationFromFirebase(operationId).catch(err => console.error('Erro ao deletar do Firebase:', err));
                }
            } else {
                expiryOperations = expiryOperations.filter(op => String(op.id) !== String(operationId));
                saveExpiryData();
                
                // Deletar do Firebase
                if (useFirebase && typeof deleteExpiryOperationFromFirebase === 'function') {
                    deleteExpiryOperationFromFirebase(operationId).catch(err => console.error('Erro ao deletar do Firebase:', err));
                }
            }
        }
        
        renderTimeline();
    }
}

// Deletar encerramento
function deleteClosureItem(operationId, timestamp) {
    const operation = allOperations.find(op => String(op.id) === String(operationId));
    if (operation && operation.closures) {
        operation.closures = operation.closures.filter(c => c.timestamp !== timestamp);
        
        if (operation.fromDashboard) {
            const dashOpIndex = dashboardOperations.findIndex(op => String(op.id) === String(operation.id));
            if (dashOpIndex !== -1) {
                dashboardOperations[dashOpIndex].closures = operation.closures;
                localStorage.setItem('operations', JSON.stringify(dashboardOperations));
                if (useFirebase && typeof saveOperationToFirebase === 'function') {
                    saveOperationToFirebase(dashboardOperations[dashOpIndex]).catch(err => console.error('Erro ao salvar no Firebase:', err));
                }
            }
        } else {
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

// Renderizar timeline horizontal com datas B3
function renderTimeline() {
    loadDashboardOperations();
    combineOperations();
    
    const timeline = document.getElementById('timeline');
    const timelineAxis = document.getElementById('timelineAxis');

    if (!timeline || !timelineAxis) return;

    if (allOperations.length === 0) {
        const emptyState = '<div class="timeline-empty"><p>Nenhuma operação com vencimento. Clique em "+ Adicionar Operação" para começar.</p></div>';
        timelineAxis.innerHTML = '';
        timeline.innerHTML = emptyState;
        return;
    }

    // Gerar todas as datas B3
    const b3Dates = generateB3ExpiryDates();
    
    // Agrupar operações por data
    const operationsByDate = {};
    allOperations.forEach(operation => {
        const dateKey = operation.expiryDate;
        if (!operationsByDate[dateKey]) {
            operationsByDate[dateKey] = [];
        }
        operationsByDate[dateKey].push(operation);
    });

    // Criar itens de timeline com todas as datas B3
    const timelineItems = b3Dates.map((b3Date, index) => {
        const dateString = b3Date.date.toISOString().split('T')[0];
        const operations = operationsByDate[dateString] || [];
        const expiryDate = b3Date.date;
        const daysToExpiry = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
        const monthColor = b3Date.monthColor;
        const weekLabel = b3Date.label;

        // Nomenclatura B3: Calls usam A-L e Puts usam M-X conforme o mês
        const callLetter = String.fromCharCode('A'.charCodeAt(0) + b3Date.month);
        const putLetter = String.fromCharCode('M'.charCodeAt(0) + b3Date.month);

        // Renderizar cards das operações da mesma data
        const cardsHTML = operations.map(operation => {
            const closedQuantity = operation.closures?.reduce((sum, c) => sum + c.quantity, 0) || 0;
            const openQuantity = operation.quantity - closedQuantity;
            const typeBadge = operation.type.includes('call') ? 'badge-call' : 'badge-put';
            const typeLabel = getTypeLabel(operation.type);
            const totalPnL = calculateTotalClosurePnL(operation);
            const avgClosePrice = calculateAverageClosePrice(operation.closures || []);
            const sourceLabel = '';

            let statusBadge = 'status-open';
            if (closedQuantity > 0 && openQuantity > 0) {
                statusBadge = 'status-partial';
            } else if (openQuantity === 0) {
                statusBadge = 'status-closed';
            }

            return `
                <div class="expiry-card">
                    <div class="expiry-header">
                        <div>
                            <div class="expiry-title">${operation.asset} - Strike ${operation.strike.toFixed(2)}${sourceLabel}</div>
                            <small style="color: var(--text-secondary); font-size: 0.7rem;">${operation.notes || ''}</small>
                        </div>
                        <span class="expiry-badge ${typeBadge}">${typeLabel}</span>
                    </div>

                    <div class="expiry-details">
                        <div class="detail-row">
                            <span class="detail-label">Qtd:</span>
                            <span class="detail-value">${operation.quantity.toFixed(2)}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Entrada:</span>
                            <span class="detail-value">R$ ${operation.entryPrice.toFixed(2)}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Aberta:</span>
                            <span class="detail-value" style="color: var(--primary-color);">${openQuantity.toFixed(2)}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Encerrada:</span>
                            <span class="detail-value" style="color: var(--success-color);">${closedQuantity.toFixed(2)}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">IV:</span>
                            <span class="detail-value">${operation.iv.toFixed(1)}%</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Preço Saída:</span>
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
                                            <div class="closure-price">${new Date(closure.date + 'T00:00:00').toLocaleDateString('pt-BR')}</div>
                                        </div>
                                        <div class="closure-pnl ${pnlClass}">${pnlSign}R$ ${Math.abs(closurePnL).toFixed(2)}</div>
                                        <button class="btn-delete" onclick="deleteClosureItem(${operation.id}, ${closure.timestamp})">×</button>
                                    </div>
                                `;
                            }).join('')}
                        </div>

                        <div class="summary-section">
                            <div class="summary-row">
                                <span class="summary-label">Preço Médio:</span>
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
                        ${!operation.fromDashboard ? `<button class="btn-delete" onclick="deleteExpiryOperation(${operation.id})">🗑️ Deletar</button>` : '<span>Sincronizado</span>'}
                    </div>
                </div>
            `;
        }).join('');

        // Renderizar item de timeline com rótulo B3
        return `
            <div class="timeline-item" data-expiry-date="${dateString}">
                <div class="timeline-marker" style="border-color: ${monthColor};"></div>
                <div class="timeline-date" style="color: ${monthColor};">
                    <div class="timeline-week-label" aria-label="Códigos B3 de Call e Put">
                        <span class="timeline-option-call" title="Código mensal da Call">${callLetter}</span>
                        <span class="timeline-week-text">${weekLabel}</span>
                        <span class="timeline-option-put" title="Código mensal da Put">${putLetter}</span>
                    </div>
                    <div class="timeline-date-text">${expiryDate.toLocaleDateString('pt-BR')}</div>
                    <div class="timeline-days">${daysToExpiry} dias</div>
                </div>
                <div class="timeline-content">
                    ${cardsHTML}
                </div>
            </div>
        `;
    }).join('');

    // O eixo e os cards usam os mesmos itens para que a posição horizontal permaneça alinhada.
    timelineAxis.innerHTML = timelineItems;
    timeline.innerHTML = timelineItems;
    bindTimelineScrollSync();

    // Rolar automaticamente: prioriza data futura (>= atual) com operação cadastrada; senão, data mais próxima da atual
    setTimeout(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const timelineContainer = document.querySelector('.timeline-cards-container');
        const items = timeline.querySelectorAll('.timeline-item');
        
        let targetItem = null;
        let minDiffFutureWithOp = Infinity;
        let minDiffAny = Infinity;
        let fallbackItem = null;

        b3Dates.forEach((b3Date, idx) => {
            const dateStr = b3Date.date.toISOString().split('T')[0];
            const hasOperations = operationsByDate[dateStr] && operationsByDate[dateStr].length > 0;
            const diff = b3Date.date - today;

            // 1. Procurar data futura (ou hoje) que tenha operação cadastrada mais próxima
            if (diff >= 0 && hasOperations && diff < minDiffFutureWithOp) {
                minDiffFutureWithOp = diff;
                targetItem = items[idx];
            }

            // 2. Fallback geral: data mais próxima da atual (>= atual)
            if (diff >= 0 && diff < minDiffAny) {
                minDiffAny = diff;
                fallbackItem = items[idx];
            }
        });

        // Se não encontrou nenhuma data futura com operação, usa o fallback (data mais próxima >= atual)
        if (!targetItem) {
            targetItem = fallbackItem;
        }

        // Se ainda não houver (ex: todas passadas), pega a última
        if (!targetItem && items.length > 0) {
            targetItem = items[items.length - 1];
        }

        if (targetItem && timelineContainer) {
            const scrollLeftPos = targetItem.offsetLeft - (timelineContainer.clientWidth / 2) + (targetItem.clientWidth / 2);
            syncTimelineScrollPosition(scrollLeftPos, 'smooth');
        }
    }, 100);
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


let isSyncingTimelineScroll = false;

// Manter o eixo das datas e a faixa de cards na mesma posição horizontal.
function syncTimelineScrollPosition(scrollLeft, behavior = 'auto') {
    document.querySelectorAll('.timeline-container').forEach(container => {
        const maxScrollLeft = Math.max(0, container.scrollWidth - container.clientWidth);
        const targetScrollLeft = Math.min(Math.max(0, scrollLeft), maxScrollLeft);

        if (behavior === 'smooth') {
            container.scrollTo({ left: targetScrollLeft, behavior: 'smooth' });
        } else {
            container.scrollLeft = targetScrollLeft;
        }
    });
}

function bindTimelineScrollSync() {
    document.querySelectorAll('.timeline-container').forEach(container => {
        if (container.dataset.timelineSyncBound === 'true') return;

        container.dataset.timelineSyncBound = 'true';
        container.addEventListener('scroll', () => {
            if (isSyncingTimelineScroll) return;

            isSyncingTimelineScroll = true;
            syncTimelineScrollPosition(container.scrollLeft);
            window.requestAnimationFrame(() => {
                isSyncingTimelineScroll = false;
            });
        }, { passive: true });
    });
}

// Mover uma data por vez, mantendo o centro do eixo e dos cards alinhados.
function scrollTimeline(direction) {
    const cardsContainer = document.querySelector('.timeline-cards-container');
    const axisContainer = document.querySelector('.timeline-axis-container');
    const axisTimeline = document.getElementById('timelineAxis');
    const cardsTimeline = document.getElementById('timeline');
    if (!cardsContainer || !axisContainer || !axisTimeline || !cardsTimeline) return;

    const axisItems = [...axisTimeline.querySelectorAll('.timeline-item')];
    if (axisItems.length === 0) return;

    const viewportRect = axisContainer.getBoundingClientRect();
    const viewportCenter = viewportRect.left + (axisContainer.clientWidth / 2);
    const tolerance = 4;

    const itemCenters = axisItems.map(item => {
        const rect = item.getBoundingClientRect();
        return rect.left + (rect.width / 2);
    });

    const targetIndex = direction === 'right'
        ? itemCenters.findIndex(center => center > viewportCenter + tolerance)
        : itemCenters
            .map((center, index) => ({ center, index }))
            .reverse()
            .find(entry => entry.center < viewportCenter - tolerance)?.index;

    // Já está no primeiro/último item: não ultrapassar os limites da timeline.
    if (targetIndex === undefined || targetIndex === -1) return;

    const targetAxisItem = axisItems[targetIndex];
    const targetDate = targetAxisItem.dataset.expiryDate;
    const targetCardsItem = cardsTimeline.querySelector(`[data-expiry-date="${targetDate}"]`);
    const targetRect = targetAxisItem.getBoundingClientRect();
    const targetScrollLeft = axisContainer.scrollLeft +
        (targetRect.left + (targetRect.width / 2) - viewportCenter);

    // Posicionamento imediato evita que o listener de sincronização interrompa uma animação.
    syncTimelineScrollPosition(targetScrollLeft);

    [targetAxisItem, targetCardsItem].filter(Boolean).forEach(item => {
        item.classList.remove('timeline-item-focus');
        requestAnimationFrame(() => item.classList.add('timeline-item-focus'));
        setTimeout(() => item.classList.remove('timeline-item-focus'), 700);
    });
}

// Ir diretamente para a primeira ou última data que possui operação.
function jumpToOperationDate(target) {
    const cardsContainer = document.querySelector('.timeline-cards-container');
    const axisContainer = document.querySelector('.timeline-axis-container');
    const cardsTimeline = document.getElementById('timeline');
    const axisTimeline = document.getElementById('timelineAxis');
    if (!cardsContainer || !axisContainer || !cardsTimeline || !axisTimeline) return;

    // Recalcular a fonte das operações para que o atalho reflita a lista atual.
    loadDashboardOperations();
    combineOperations();

    const operationDates = [...new Set(
        allOperations
            .map(operation => String(operation.expiryDate || '').slice(0, 10))
            .filter(date => /^\d{4}-\d{2}-\d{2}$/.test(date))
    )].sort();

    if (operationDates.length === 0) {
        alert('Nenhuma operação com data de vencimento foi cadastrada.');
        return;
    }

    const targetDate = target === 'last'
        ? operationDates[operationDates.length - 1]
        : operationDates[0];
    const targetCardItem = cardsTimeline.querySelector(`[data-expiry-date="${targetDate}"]`);
    const targetAxisItem = axisTimeline.querySelector(`[data-expiry-date="${targetDate}"]`);

    if (!targetCardItem || !targetAxisItem) {
        alert(`A data ${targetDate.split('-').reverse().join('/')} está fora do período exibido na linha do tempo.`);
        return;
    }

    // Calcula a distância entre o centro real da data no eixo e o centro visível do eixo.
    // Usar getBoundingClientRect evita o erro causado por padding e offsets diferentes
    // entre a faixa fixa do eixo e a faixa rolável dos cards.
    const axisRect = axisContainer.getBoundingClientRect();
    const targetRect = targetAxisItem.getBoundingClientRect();
    const targetCenter = targetRect.left + (targetRect.width / 2);
    const axisCenter = axisRect.left + (axisRect.width / 2);
    const centeredPosition = axisContainer.scrollLeft + (targetCenter - axisCenter);

    // O salto deve ser imediato: uma animação suave dispararia o listener de sincronização
    // repetidamente e poderia interromper a posição antes de chegar ao centro.
    syncTimelineScrollPosition(centeredPosition);

    targetCardItem.classList.remove('timeline-item-focus');
    targetAxisItem.classList.remove('timeline-item-focus');
    // Fornece um retorno visual discreto sem deslocar o restante da página.
    requestAnimationFrame(() => {
        targetCardItem.classList.add('timeline-item-focus');
        targetAxisItem.classList.add('timeline-item-focus');
    });
    setTimeout(() => {
        targetCardItem.classList.remove('timeline-item-focus');
        targetAxisItem.classList.remove('timeline-item-focus');
    }, 700);
}
