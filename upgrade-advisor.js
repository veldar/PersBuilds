// استعارة سعر الصرف بأمان من النطاق العالمي لمنع أخطاء إعادة الإعلان
var currentRate = window.EXCHANGE_RATE || 6.5;

document.addEventListener('componentsLoaded', (e) => {
    window.allComponents = e.detail;
    console.log("مستشار التطوير: تم تبسيط الواجهة وإزالة الملصقات.");
    populateUpgradeDropdowns();
});

function populateUpgradeDropdowns() {
    const cpuSelect = document.getElementById('current-cpu');
    const gpuSelect = document.getElementById('current-gpu');
    const ramSelect = document.getElementById('current-ram');
    const storageSelect = document.getElementById('current-storage');

    if (!cpuSelect) return; 

    cpuSelect.innerHTML = '<option value="">-- اختر معالجك الحالي --</option>';
    gpuSelect.innerHTML = '<option value="">-- اختر كرت الشاشة الحالي --</option>';
    ramSelect.innerHTML = '<option value="">-- اختر حجم وسرعة الرام --</option>';
    storageSelect.innerHTML = '<option value="">-- اختر وحدة التخزين الحالية --</option>';

    if (window.allComponents.cpus) {
        window.allComponents.cpus.forEach(c => {
            cpuSelect.innerHTML += `<option value="${c.name}">${c.name} (${c.price} $)</option>`;
        });
    }
    if (window.allComponents.gpus) {
        window.allComponents.gpus.forEach(g => {
            gpuSelect.innerHTML += `<option value="${g.name}">${g.name} (${g.price} $)</option>`;
        });
    }
    if (window.allComponents.ram) {
        window.allComponents.ram.forEach(r => {
            ramSelect.innerHTML += `<option value="${r.name}">${r.name} (${r.price} $)</option>`;
        });
    }
    if (window.allComponents.storage) {
        window.allComponents.storage.forEach(s => {
            storageSelect.innerHTML += `<option value="${s.name}">${s.name} (${s.price} $)</option>`;
        });
    }
}

document.getElementById('upgrade-form').addEventListener('submit', (e) => {
    e.preventDefault();

    if (!window.allComponents) {
        alert("تنبيه: لم يتم تحميل بيانات القطع بعد.");
        return;
    }

    currentRate = window.EXCHANGE_RATE || currentRate;

    const currency = document.getElementById('currency-select').value;
    let rawBudget = parseFloat(document.getElementById('budget').value);
    let cashBudgetInUSD = currency === 'LYD' ? rawBudget / currentRate : rawBudget;

    const includeTradeIn = document.getElementById('sell-old-parts').checked;

    const currentCpu = window.allComponents.cpus.find(c => c.name === document.getElementById('current-cpu').value);
    const currentGpu = window.allComponents.gpus.find(g => g.name === document.getElementById('current-gpu').value);
    const currentRam = window.allComponents.ram.find(r => r.name === document.getElementById('current-ram').value);
    const currentStorage = window.allComponents.storage.find(s => s.name === document.getElementById('current-storage').value);

    if (!currentCpu || !currentGpu || !currentRam || !currentStorage) {
        alert("الرجاء اختيار كافة القطع الحالية لجهازك أولاً!");
        return;
    }

    const currentMobo = window.allComponents.motherboards.find(m => m.socket === currentCpu.socket) || window.allComponents.motherboards[0];

    processSmartUpgrade(cashBudgetInUSD, includeTradeIn, currentCpu, currentGpu, currentRam, currentStorage, currentMobo, currency);
});

function processSmartUpgrade(cashBudget, includeTradeIn, curCpu, curGpu, curRam, curStorage, curMobo, userCurrency) {
    const warningContainer = document.getElementById('advisor-warning-container');
    const resultContainer = document.getElementById('upgrade-result-container');
    
    warningContainer.classList.add('hidden');
    resultContainer.classList.add('hidden');

    let totalOldPartsValue = 0; 
    let availableBudget = cashBudget;

    let newCpu = curCpu;
    let newGpu = curGpu;
    let newRam = curRam;
    let newStorage = curStorage;

    let oldGpuTradeInValue = includeTradeIn ? (curGpu.price * 0.75) : 0;
    let oldCpuTradeInValue = includeTradeIn ? (curCpu.price * 0.75) : 0;
    let oldRamTradeInValue = includeTradeIn ? (curRam.price * 0.75) : 0;
    let oldStorageTradeInValue = includeTradeIn ? (curStorage.price * 0.75) : 0;

    // 1. ترقية الرام
    let currentRamSize = 8; 
    const sizeMatch = curRam.name.match(/(\d+)\s*GB/i);
    if (sizeMatch) currentRamSize = parseInt(sizeMatch[1]);

    let ramGeneration = "DDR4";
    if (curRam.name.toUpperCase().includes("DDR3")) ramGeneration = "DDR3";
    if (curRam.name.toUpperCase().includes("DDR5")) ramGeneration = "DDR5";

    let targetRamSize = currentRamSize < 16 ? 16 : 0; 

    if (targetRamSize > 0) {
        let validRams = window.allComponents.ram.filter(r => 
            r.name.toUpperCase().includes(`${targetRamSize}GB`) &&
            r.name.toUpperCase().includes(ramGeneration) &&
            (r.price - oldRamTradeInValue) <= availableBudget
        ).sort((a, b) => b.performance - a.performance);

        if (validRams.length > 0) {
            newRam = validRams[0];
            availableBudget -= (newRam.price - oldRamTradeInValue);
            totalOldPartsValue += oldRamTradeInValue;
        }
    }

    // 2. ترقية وحدة التخزين
    let curStoragePerf = parseFloat(curStorage.performance || 0);
    if (curStoragePerf < 0.70 && availableBudget > 35) {
        let validStorageOptions = window.allComponents.storage.filter(s => 
            s.performance > curStoragePerf &&
            (s.price - oldStorageTradeInValue) <= (availableBudget * 0.40)
        ).sort((a, b) => b.performance - a.performance);

        if (validStorageOptions.length > 0) {
            newStorage = validStorageOptions[0];
            availableBudget -= (newStorage.price - oldStorageTradeInValue);
            totalOldPartsValue += oldStorageTradeInValue;
        }
    }

    // 3. ترقية الحزم المشتركة (المعالج وكرت الشاشة)
    let allowedCPUs = window.allComponents.cpus.filter(c => c.socket === curCpu.socket && c.gamingPerf >= curCpu.gamingPerf);
    let allowedGPUs = window.allComponents.gpus.filter(g => g.gamingPerf >= curGpu.gamingPerf);

    let bestCombo = null;
    let bestComboScore = -1; 

    allowedCPUs.forEach(cpu => {
        allowedGPUs.forEach(gpu => {
            let cpuCost = cpu.name === curCpu.name ? 0 : (cpu.price - oldCpuTradeInValue);
            let gpuCost = gpu.name === curGpu.name ? 0 : (gpu.price - oldGpuTradeInValue);
            let totalNetCost = cpuCost + gpuCost;

            if (totalNetCost <= availableBudget) {
                let cpuPerf = parseFloat(cpu.gamingPerf || 30);
                let gpuPerf = parseFloat(gpu.gamingPerf || 0);
                let perfRatio = gpuPerf / cpuPerf;

                if (perfRatio >= 0.75 && perfRatio <= 1.35) {
                    let totalPerfScore = cpuPerf + (gpuPerf * 1.5);

                    if (totalPerfScore > bestComboScore) {
                        bestComboScore = totalPerfScore;
                        bestCombo = { cpu: cpu, gpu: gpu, cost: totalNetCost };
                    }
                }
            }
        });
    });

    if (bestCombo) {
        if (bestCombo.cpu.name !== curCpu.name) {
            newCpu = bestCombo.cpu;
            totalOldPartsValue += oldCpuTradeInValue;
        }
        if (bestCombo.gpu.name !== curGpu.name) {
            newGpu = bestCombo.gpu;
            totalOldPartsValue += oldGpuTradeInValue;
        }
        availableBudget -= bestCombo.cost;
    }

    let gpuUpgraded = (curGpu.name !== newGpu.name);
    let cpuUpgraded = (curCpu.name !== newCpu.name);
    let ramUpgraded = (curRam.name !== newRam.name);
    let storageUpgraded = (curStorage.name !== newStorage.name);

    if (!gpuUpgraded && !cpuUpgraded && !ramUpgraded && !storageUpgraded) {
        let factor = userCurrency === 'LYD' ? currentRate : 1;
        let symbol = userCurrency === 'LYD' ? ' د.ل' : ' $';

        if ((cashBudget + totalOldPartsValue) < 30) {
            warningContainer.innerHTML = `
                <strong>تنبيه: الميزانية الميزانية الحالية غير كافية للتطوير</strong><br>
                المبلغ المرصود بقيمة <strong>${(cashBudget * factor).toFixed(0)}${symbol}</strong> منخفض جداً ولا يغطي تكلفة ترقية أي قطعة في ملف البيانات.<br>
                يرجى رفع قيمة الميزانية لتتمكن الخوارزمية من إيجاد خيارات ترقية مناسبة.
            `;
        } else {
            warningContainer.innerHTML = `
                <strong>تنبيه: تم حفظ الميزانية لحمايتك من عدم التوافق</strong><br>
                الميزانية متوفرة، ولكن لم يتم العثور على حزمة ترقية متناسقة تجمع المعالج وكرت الشاشة دون التسبب في اختناق الأداء أو عنق الزجاجة.<br>
                تم حفظ المبلغ بالكامل كفائض متبقي. ننصحك بالتوجه لصفحة <a href="CusBuilds.html" style="color: #e94560; font-weight: bold; text-decoration: underline;">البناء الذكي</a> لتجميع منصة جديدة بالكامل.
            `;
        }
        warningContainer.classList.remove('hidden');
        warningContainer.scrollIntoView({ behavior: 'smooth' });
        return;
    }

    renderUpgradeResults(curCpu, curGpu, curRam, curStorage, newCpu, newGpu, newRam, newStorage, cashBudget, totalOldPartsValue, availableBudget, userCurrency);
}

function renderUpgradeResults(cCpu, cGpu, cRam, cStorage, nCpu, nGpu, nRam, nStorage, cash, oldPartsVal, leftover, currency) {
    const reportBox = document.getElementById('upgrade-financial-report');
    const partsList = document.getElementById('upgrade-parts-list');
    
    let factor = currency === 'LYD' ? currentRate : 1;
    let symbol = currency === 'LYD' ? ' د.ل' : ' $';

    reportBox.innerHTML = `
        <h4 style="margin: 0 0 10px 0; color: #fff; font-size:16px;">التقرير المالي لحسابات الترقية:</h4>
        <ul style="list-style: none; padding: 0; margin: 0; line-height: 1.7; color: #e0e0e0; font-size: 14px;">
            <li>الميزانية المضافة منك: <strong>${(cash * factor).toFixed(0)}${symbol}</strong></li>
            ${oldPartsVal > 0 ? `<li>العائد المالي المتوقع من بيع القطع المستبدلة (-25%): <strong style="color: #28a745;">${(oldPartsVal * factor).toFixed(0)}${symbol}</strong></li>` : ''}
            <li>إجمالي الميزانية الفعلية المتاحة: <strong>${((cash + oldPartsVal) * factor).toFixed(0)}${symbol}</strong></li>
            <li>المبلغ الفائض المتبقي والمحفوظ: <strong style="color: #e94560; font-size: 18px; text-shadow: 0 0 5px rgba(233,69,96,0.3);">${(leftover * factor).toFixed(0)}${symbol}</strong></li>
        </ul>
    `;

    partsList.innerHTML = '';

    const getRamDetails = (ramName) => {
        const freqMatch = ramName.match(/(\d+)\s*MHz/i);
        const genMatch = ramName.match(/(DDR3|DDR4|DDR5)/i);
        let details = "";
        if (genMatch) details += `[${genMatch[0].toUpperCase()}] `;
        if (freqMatch) details += `بسرعة ${freqMatch[1]}MHz`;
        return details ? details : "تردد قياسي";
    };

    const compareItems = [
        { label: 'المعالج (CPU)', old: cCpu.name, updated: nCpu.name, status: cCpu.name === nCpu.name ? 'ثابت، متوازن مع كرت الشاشة الحالي' : 'تمت الترقية لرفع الأداء الإجمالي ومنع اختناق الكرت' },
        { label: 'كرت الشاشة (GPU)', old: cGpu.name, updated: nGpu.name, status: cGpu.name === nGpu.name ? 'ثابت، للحفاظ على استقرار وتوازن المنصة ماليًا وهندسيًا' : 'تم اختيار الكرت الأعلى كفاءة والأكثر تناسقاً مع المعالج' },
        { label: 'الذاكرة العشوائية (RAM)', old: `${cRam.name} ${getRamDetails(cRam.name)}`, updated: `${nRam.name} ${getRamDetails(nRam.name)}`, status: cRam.name === nRam.name ? 'ثابتة، متطابقة مع متطلبات الجهاز الحالية' : 'تمت ترقية السعة مع الحفاظ على توافق جيل اللوحة الأم' },
        { label: 'وحدة التخزين (Storage)', old: cStorage.name, updated: nStorage.name, status: cStorage.name === nStorage.name ? 'ثابتة، الوحدة الحالية كافية للأداء العام' : 'تمت الترقية لوحدة تخزين أسرع لرفع استجابة النظام وسرعة التحميل' }
    ];

    compareItems.forEach(item => {
        const isUpgraded = item.old !== item.updated;
        
        const row = document.createElement('div');
        row.className = 'part-item';
        row.style.display = 'grid';
        row.style.gridTemplateColumns = '1.5fr 2fr 2fr 1.5fr';
        row.style.alignItems = 'center';
        row.style.padding = '15px';
        row.style.marginBottom = '10px';
        row.style.background = isUpgraded ? '#112233' : '#1a1a2e';
        row.style.border = isUpgraded ? '1px solid #28a745' : '1px solid #22254b';
        row.style.borderRadius = '8px';

        row.innerHTML = `
            <div><span style="color: #e94560; font-weight: bold;">${item.label}</span></div>
            <div style="color: #aaa; text-decoration: ${isUpgraded ? 'line-through' : 'none'}; font-size: 13px;">السابق: ${item.old}</div>
            <div style="color: ${isUpgraded ? '#28a745' : '#fff'}; font-weight: ${isUpgraded ? 'bold' : 'normal'}; font-size: 14px;">الجديد: ${item.updated}</div>
            <div style="text-align: left; font-size: 12px; color: ${isUpgraded ? '#28a745' : '#888'};">${item.status}</div>
        `;
        partsList.appendChild(row);
    });

    const lockRow = document.createElement('div');
    lockRow.style.padding = '15px';
    lockRow.style.marginTop = '15px';
    lockRow.style.background = '#022c22';
    lockRow.style.border = '1px dashed #059669';
    lockRow.style.borderRadius = '8px';
    lockRow.style.color = '#34d399';
    lockRow.style.fontSize = '13px';
    lockRow.style.textAlign = 'center';
    lockRow.innerHTML = `نظام الترقية الشامل نشط: تم فحص وتأمين توازن جميع القطع هندسياً لضمان أعلى كفاءة وتجنب مشاكل عنق الزجاجة.`;
    partsList.appendChild(lockRow);

    const container = document.getElementById('upgrade-result-container');
    container.classList.remove('hidden');
    container.scrollIntoView({ behavior: 'smooth' });
}