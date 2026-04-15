document.addEventListener('DOMContentLoaded', () => {

    /* ==================================
       TABS NAVIGATION LOGIC
       ================================== */
    const navTabs = document.querySelectorAll('.nav-tab');
    const tabViews = document.querySelectorAll('.tab-view');
    const btnClearGrid = document.getElementById('btn-clear-grid');

    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Update buttons
            navTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Update views
            const targetId = tab.getAttribute('data-target');
            tabViews.forEach(view => {
                view.classList.remove('active');
                view.classList.add('hidden');
            });
            document.getElementById(targetId).classList.remove('hidden');
            document.getElementById(targetId).classList.add('active');
            
            // Toggle specific floating buttons
            if (targetId === 'view-grid') {
                btnClearGrid.classList.remove('hidden');
            } else {
                btnClearGrid.classList.add('hidden');
            }
        });
    });

    /* ==================================
       VISTA 1: INVENTARIO ESTRUCTURADO
       ================================== */
    let inventory = JSON.parse(localStorage.getItem('v1_inventory')) || [];
    let historyLogs = JSON.parse(localStorage.getItem('v1_history')) || [];

    const form = document.getElementById('inventory-form');
    const summaryGrid = document.getElementById('summary-grid');
    const historyTbody = document.getElementById('history-tbody');
    const btnClearHistory = document.getElementById('btn-clear-history');
    
    // Elementos de calibre
    const productSelect = document.getElementById('product');
    const unitSelect = document.getElementById('unit');
    const calibreGroup = document.getElementById('calibre-group');
    const calibreInput = document.getElementById('calibre');

    // Init Date
    document.getElementById('current-date').textContent = new Date().toLocaleDateString('es-ES', { weekday: 'long', month: 'long', day: 'numeric' });

    function initV1() {
        updateUIV1();
        
        // Listener para mostrar Calibre solo si es Caja y (Manzana o Pera)
        const toggleCalibre = () => {
            const isFruit = productSelect.value === 'Manzanas' || productSelect.value === 'Peras';
            const isBox = unitSelect.value === 'Cajas';
            if (isFruit && isBox) {
                calibreGroup.classList.remove('hidden');
            } else {
                calibreGroup.classList.add('hidden');
                calibreInput.value = ''; // limpiar al ocultar
            }

            const lblQuantity = document.getElementById('lbl-quantity');
            const inputQuantity = document.getElementById('quantity');

            if (lblQuantity && inputQuantity) {
                if (unitSelect.value) {
                    lblQuantity.textContent = `Cantidad de ${unitSelect.value}`;
                    inputQuantity.placeholder = `Ej: 50 ${unitSelect.value}`;
                } else {
                    lblQuantity.textContent = 'Cantidad';
                    inputQuantity.placeholder = 'Ej: 50 Cajas';
                }
            }
        };
        productSelect.addEventListener('change', toggleCalibre);
        unitSelect.addEventListener('change', toggleCalibre);

        form.addEventListener('submit', handleFormSubmit);
        btnClearHistory.addEventListener('click', () => {
            if (confirm('¿Vaciar historial estructurado?')) { historyLogs = []; saveV1(); updateUIV1(); }
        });
    }

    function handleFormSubmit(e) {
        e.preventDefault();
        const type = document.getElementById('type').value;
        const product = document.getElementById('product').value;
        const unit = document.getElementById('unit').value;
        const calibre = document.getElementById('calibre').value.trim();
        const quantity = parseFloat(document.getElementById('quantity').value);

        if (!product || !unit || isNaN(quantity) || quantity <= 0) return;

        const displayUnit = calibre ? `${unit} (Cal. ${calibre})` : unit;

        const key = `${product}-${displayUnit}`;
        const existingId = inventory.findIndex(i => i.id === key);

        if (type === 'out') {
            if (existingId === -1 || inventory[existingId].quantity < quantity) {
                alert(`No hay suficiente ${product} en ${displayUnit}.`); return;
            }
            inventory[existingId].quantity -= quantity;
            if(inventory[existingId].quantity <= 0) inventory.splice(existingId, 1);
        } else {
            if (existingId === -1) inventory.push({ id: key, product, unit: displayUnit, quantity, rawCalibre: calibre });
            else inventory[existingId].quantity += quantity;
        }

        historyLogs.unshift({ id: Date.now().toString(), date: new Date().toISOString(), type, product, unit: displayUnit, quantity, rawCalibre: calibre });
        if(historyLogs.length > 50) historyLogs.pop();

        saveV1(); updateUIV1();
        document.getElementById('quantity').value = '';
    }

    function saveV1() {
        localStorage.setItem('v1_inventory', JSON.stringify(inventory));
        localStorage.setItem('v1_history', JSON.stringify(historyLogs));
    }

    function updateUIV1() {
        // Summary
        summaryGrid.innerHTML = '';
        if (inventory.length === 0) {
            summaryGrid.innerHTML = `<div class="empty-state" style="grid-column: 1/-1;">Inventario vacío.</div>`;
        } else {
            inventory.forEach(item => {
                let totalPiecesLabel = '';
                if (item.rawCalibre && !isNaN(parseFloat(item.rawCalibre))) {
                    const totalPieces = Math.round(parseFloat(item.rawCalibre) * item.quantity);
                    totalPiecesLabel = ` <span style="opacity:0.9;">(${totalPieces} pzs)</span>`;
                }

                // Determinar el color del cuadro según la fruta
                let bgColor = 'rgba(255,255,255,0.1)';
                let textColor = 'var(--text-main)';
                let borderColor = 'rgba(255,255,255,0.2)';

                if (item.product === 'Manzanas') {
                    bgColor = 'rgba(239, 68, 68, 0.15)';
                    textColor = '#f87171';
                    borderColor = 'rgba(239, 68, 68, 0.4)';
                } else if (item.product === 'Peras') {
                    bgColor = 'rgba(132, 204, 22, 0.15)';
                    textColor = '#a3e635';
                    borderColor = 'rgba(132, 204, 22, 0.4)';
                } else if (item.product === 'Tomates') {
                    bgColor = 'rgba(249, 115, 22, 0.15)';
                    textColor = '#fb923c';
                    borderColor = 'rgba(249, 115, 22, 0.4)';
                } else if (item.product === 'Ajos') {
                    bgColor = 'rgba(255, 255, 255, 0.1)';
                    textColor = '#f1f5f9';
                    borderColor = 'rgba(255, 255, 255, 0.3)';
                }

                const badgeHtml = `<div style="display:inline-block; padding: 0.3rem 0.6rem; border-radius: 6px; background-color: ${bgColor}; color:${textColor}; font-size: 0.85rem; font-weight:600; border: 1px solid ${borderColor}; margin-top: 0.25rem;">
                    ${item.product}${totalPiecesLabel}
                </div>`;

                summaryGrid.innerHTML += `
                    <div class="summary-card">
                        <div class="card-header"><span>${item.unit}</span></div>
                        <div class="card-value">${parseFloat(item.quantity.toFixed(2))}</div>
                        <div>${badgeHtml}</div>
                    </div>`;
            });

            // NUEVO: Dibujar tarjetas extra por el TOTAL GLOBAL DE UNIDADES (PIEZAS) sumadas
            const aggregatedPieces = {};
            inventory.forEach(item => {
                if (item.rawCalibre && !isNaN(parseFloat(item.rawCalibre))) {
                    const pieces = Math.round(parseFloat(item.rawCalibre) * item.quantity);
                    if (!aggregatedPieces[item.product]) aggregatedPieces[item.product] = 0;
                    aggregatedPieces[item.product] += pieces;
                }
            });

            for (const product in aggregatedPieces) {
                if (aggregatedPieces[product] > 0) {
                    let bgColor = 'rgba(255,255,255,0.1)';
                    let textColor = 'var(--text-main)';
                    let borderColor = 'rgba(255,255,255,0.2)';

                    if (product === 'Manzanas') {
                        bgColor = 'rgba(239, 68, 68, 0.15)'; textColor = '#f87171'; borderColor = 'rgba(239, 68, 68, 0.4)';
                    } else if (product === 'Peras') {
                        bgColor = 'rgba(132, 204, 22, 0.15)'; textColor = '#a3e635'; borderColor = 'rgba(132, 204, 22, 0.4)';
                    } else if (product === 'Tomates') {
                        bgColor = 'rgba(249, 115, 22, 0.15)'; textColor = '#fb923c'; borderColor = 'rgba(249, 115, 22, 0.4)';
                    } else if (product === 'Ajos') {
                        bgColor = 'rgba(255, 255, 255, 0.1)'; textColor = '#f1f5f9'; borderColor = 'rgba(255, 255, 255, 0.3)';
                    }

                    const badgeHtml = `<div style="display:inline-block; padding: 0.3rem 0.6rem; border-radius: 6px; background-color: ${bgColor}; color:${textColor}; font-size: 0.85rem; font-weight:600; border: 1px solid ${borderColor}; margin-top: 0.25rem;">
                        ${product}
                    </div>`;

                    summaryGrid.innerHTML += `
                        <div class="summary-card" style="border-left: 4px solid #facc15; background: rgba(250, 204, 21, 0.15);">
                            <div class="card-header" style="color: #facc15; font-weight:bold;"><span>∑ TOTAL PIEZAS</span></div>
                            <div class="card-value" style="color: #facc15; font-size: 2.2rem; margin: 0.2rem 0;">${aggregatedPieces[product]}</div>
                            <div>${badgeHtml}</div>
                        </div>`;
                }
            }
        }
        
        // History
        historyTbody.innerHTML = '';
        if (historyLogs.length === 0) {
            document.getElementById('table-empty-state').classList.remove('hidden');
        } else {
            document.getElementById('table-empty-state').classList.add('hidden');
            historyLogs.forEach(log => {
                const dateStr = new Date(log.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                const badge = log.type === 'in' ? '<span class="badge-in">+ Entrada</span>' : '<span class="badge-out">- Salida</span>';
                let calcText = '';
                if(log.rawCalibre && !isNaN(parseFloat(log.rawCalibre))) {
                    const pieces = Math.round(parseFloat(log.rawCalibre) * log.quantity);
                    calcText = ` <br><small style="color:#10b981">(${pieces} pzs)</small>`;
                }
                historyTbody.innerHTML += `
                    <tr>
                        <td>${dateStr}</td><td>${badge}</td><td><b>${log.product}</b></td>
                        <td>${log.unit}</td><td>${log.quantity}${calcText}</td>
                    </tr>`;
            });
        }
    }

    /* ==================================
       VISTA 2: CUADERNO MÓVIL (GRID)
       ================================== */
    const textareas = document.querySelectorAll('.notepad');
    
    function initV2() {
        textareas.forEach(textarea => {
            textarea.value = localStorage.getItem('v2_' + textarea.id) || '';
            calculateSum(textarea);
            textarea.addEventListener('input', () => {
                localStorage.setItem('v2_' + textarea.id, textarea.value);
                calculateSum(textarea);
            });
        });

        btnClearGrid.addEventListener('click', () => {
            if(confirm('¿Borrar TODO el cuaderno de la Feria?')) {
                textareas.forEach(textarea => {
                    textarea.value = '';
                    localStorage.removeItem('v2_' + textarea.id);
                    calculateSum(textarea);
                });
            }
        });
    }

    function calculateSum(element) {
        const sumElement = document.getElementById(element.getAttribute('data-sum-target'));
        const tokens = element.value.split(/[\n\s,+]+/); 
        let total = 0;
        tokens.forEach(token => {
            const num = parseFloat(token.replace(',', '.'));
            if (!isNaN(num)) total += num;
        });
        sumElement.textContent = Number.isInteger(total) ? total : total.toFixed(2);
    }


    /* ==================================
       DESCARGA GLOBAL (FOTO)
       ================================== */
    document.getElementById('btn-download').addEventListener('click', () => {
        const captureArea = document.getElementById('capture-area');
        document.activeElement.blur();
        
        const btn = document.getElementById('btn-download');
        btn.innerHTML = '⏳';
        
        html2canvas(captureArea, {
            scale: 2,
            backgroundColor: '#0f172a' // Dark background matching app
        }).then(canvas => {
            const a = document.createElement('a');
            a.href = canvas.toDataURL('image/png');
            a.download = `ReporteApp_${new Date().toLocaleDateString('es-ES').replace(/\//g,'-')}.png`;
            a.click();
            btn.innerHTML = '📸';
        }).catch(() => {
            alert('Error en descarga.');
            btn.innerHTML = '📸';
        });
    });

    // Run Initializers
    initV1();
    initV2();

});
