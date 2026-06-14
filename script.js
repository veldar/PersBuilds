if (typeof window.EXCHANGE_RATE === 'undefined') window.EXCHANGE_RATE = 6.5; 
if (typeof window.currentCurrency === 'undefined') window.currentCurrency = 'USD';

// 🌐 دالة جلب البيانات الآمنة والمستقرة (تستخدمها صفحة Upgrade.html)
function loadComponents() {
    fetch('components.json')
        .then(response => {
            if (!response.ok) throw new Error("تعذر العثور على ملف components.json");
            return response.json();
        })
        .then(data => {
            window.allComponents = data; // تخزين البيانات عالمياً لكل الصفحات
            
            // إرسال الإشارة لمستشار الترقية في صفحة Upgrade.html
            const event = new CustomEvent('componentsLoaded', { detail: data });
            document.dispatchEvent(event);
            
            console.log("✅ تم جلب البيانات وتغذية المنصة بنجاح.");
        })
        .catch(error => {
            console.error("❌ خطأ أثناء جلب ملف البيانات:", error);
        });
}

// 🛡️ تشغيل العمليات واكتشاف عناصر الواجهة بأمان بعد اكتمال تحميل الـ DOM
document.addEventListener("DOMContentLoaded", () => {
    
    // تشغيل الجلب هنا يضمن أن المتصفح جاهز تماماً والصفحة مستقرة
    loadComponents();

    const currencySelect = document.getElementById('currency-select');
    const budgetInput = document.getElementById('budget');
    
    if (currencySelect) {
        currencySelect.addEventListener('change', (e) => {
            window.currentCurrency = e.target.value; 
            if (budgetInput) {
                if (window.currentCurrency === 'LYD') budgetInput.placeholder = `مثال: ${(1000 * window.EXCHANGE_RATE).toFixed(0)} د.ل`;
                else budgetInput.placeholder = "مثال: 1000 $";
            }
        });
    }
    
    const buildForm = document.getElementById('build-form');
    if (buildForm) {
        buildForm.addEventListener('submit', (e) => {
            e.preventDefault(); 
            if (!budgetInput || !budgetInput.value) return;
            let rawBudget = parseFloat(budgetInput.value);
            const selectedUsage = document.getElementById('usage') ? document.getElementById('usage').value : 'gaming';
            let budgetInUSD = window.currentCurrency === 'LYD' ? rawBudget / window.EXCHANGE_RATE : rawBudget;
            let minLyd = (150 * window.EXCHANGE_RATE).toFixed(0);
            if (budgetInUSD < 150) {
                alert(window.currentCurrency === 'LYD' ? `الميزانية منخفضة جداً! يرجى إدخال ميزانية أعلى من ${minLyd} د.ل` : "الميزانية منخفضة جداً! يرجى إدخال ميزانية أعلى من 150 دولار");
                return;
            }
            
            // استدعاء الخوارزمية المؤمنة
            generateSmartBuild(budgetInUSD, selectedUsage);
        });
    }
    
    if (document.getElementById("saved-builds-container")) displaySavedBuilds();
});

// 3. خوارزمية التجميع الذكي (النسخة الحديدية المضادة للانهيار والأخطاء)
function generateSmartBuild(budget, usage) {
    
    // إذا كانت البيانات محملة مسبقاً نستخدمها فوراً لتسريع التجربة
    if (typeof allComponents !== 'undefined' && allComponents && allComponents.cpus) {
        processBuildLogic(allComponents, budget, usage);
    } else {
        // 🚀 صمام الأمان الأخير: إذا ضغط المستخدم بسرعة والبيانات لم تجهز بعد، نقوم بعمل Fetch فوري ومباشر!
        fetch('components.json')
            .then(response => {
                if (!response.ok) throw new Error("تعذر جلب ملف components.json");
                return response.json();
            })
            .then(data => {
                window.allComponents = data;
                processBuildLogic(data, budget, usage);
            })
            .catch(error => {
                console.error("Error fetching components:", error);
                alert("تنبيه: تعذر قراءة بيانات القطع. تأكد من وجود ملف components.json في نفس المجلد وأن المتصفح يقرأه بشكل صحيح.");
            });
    }
}

// دالة معالجة المنطق الداخلي للتجميع بعد التأكد المطلق من وجود البيانات
function processBuildLogic(componentsData, budget, usage) {
    // النسب المبدئية لتوزيع الميزانية على القطع
    let cpuPercent = 0.22, gpuPercent = 0.30, ramPercent = 0.08, storagePercent = 0.08, moboPercent = 0.10;

    if (usage === 'rendering') {
        cpuPercent = 0.20; gpuPercent = 0.38; moboPercent = 0.08;
    } else if (usage === 'engineering_coding') {
        cpuPercent = 0.35; gpuPercent = 0.12; ramPercent = 0.15;
    } else if (usage === 'browsing') {
        cpuPercent = 0.40; gpuPercent = 0.00; ramPercent = 0.15;
    }

    if (budget >= 1200) {
        if (usage === 'gaming' || usage === 'rendering') {
            cpuPercent = usage === 'rendering' ? 0.25 : 0.20;
            gpuPercent = usage === 'rendering' ? 0.45 : 0.50;
        }
    }

    // دالة الانتقاء الذكية والمؤمنة ضد الانعدام
    function pickComponent(list, targetBudget, sortBy, isMobo = false, socket = null, enforceDdr5 = false) {
        if (!list || list.length === 0) return null;
        
        let filtered = list.filter(item => item.price <= targetBudget);
        
        if (isMobo && socket) {
            filtered = filtered.filter(m => m.socket === socket);
        }
        
        if (enforceDdr5) {
            let ddr5Filtered = filtered.filter(r => r.name && r.name.includes("DDR5"));
            if (ddr5Filtered.length > 0) filtered = ddr5Filtered;
        } else if (budget < 1000 && sortBy === 'performance' && !isMobo) {
            filtered = filtered.filter(r => r.name && !r.name.includes("DDR5"));
        }
        
        if (filtered.length > 0) {
            return filtered.sort((a, b) => b[sortBy] - a[sortBy])[0];
        } else {
            let fallbackList = (isMobo && socket) ? list.filter(m => m.socket === socket) : list;
            if (fallbackList.length === 0) fallbackList = list; 
            return fallbackList.sort((a, b) => a.price - b.price)[0];
        }
    }

    let perfType = usage === 'rendering' ? 'renderPerf' : 'gamingPerf';

    // عمليات الاختيار الآمنة من كائن المكونات الممرر للدالة
    let selectedCPU = pickComponent(componentsData.cpus, budget * cpuPercent, perfType);
    if (!selectedCPU) {
        alert("خطأ: لم يتم العثور على معالجات في ملف البيانات!");
        return;
    }
    
    let selectedGPU = null;
    if (usage !== 'browsing' && componentsData.gpus) {
        selectedGPU = pickComponent(componentsData.gpus, budget * gpuPercent, perfType);
    } else if (componentsData.gpus) {
        selectedGPU = componentsData.gpus.find(g => g.price === 0) || componentsData.gpus.sort((a,b)=>a.price-b.price)[0];
    }

    let selectedMobo = pickComponent(componentsData.motherboards, budget * moboPercent, 'performance', true, selectedCPU.socket);
    
    let needDdr5 = (selectedCPU.socket === "AM5" || (selectedCPU.socket === "LGA1700" && budget >= 1100));
    let selectedRAM = pickComponent(componentsData.ram, budget * ramPercent, 'performance', false, null, needDdr5);
    let selectedStorage = pickComponent(componentsData.storage, budget * storagePercent, 'performance');

    function pickPSUAndCase(currentCPU, currentGPU, currentMobo) {
        let totalW = (currentCPU ? (currentCPU.wattage || 65) : 65) + (currentGPU ? (currentGPU.wattage || 150) : 0) + 40; 
        let safeWattage = totalW * 1.25;
        
        let psu = componentsData.psus ? componentsData.psus.filter(p => p.capacity >= safeWattage).sort((a, b) => a.price - b.price)[0] : null;
        if (componentsData.psus && !psu) psu = componentsData.psus.sort((a, b) => a.price - b.price)[0];

        let form = (currentMobo && currentMobo.formFactor) ? currentMobo.formFactor : "ATX";
        let cse = componentsData.cases ? componentsData.cases.filter(c => c.formFactor === form || c.formFactor === "ATX").sort((a, b) => a.price - b.price)[0] : null;
        if (componentsData.cases && !cse) cse = componentsData.cases.sort((a, b) => a.price - b.price)[0];
        
        return { psu, cse, totalW };
    }

    // موازنة ذكية لعدم كسر الحاجز المالي
    let maxAllowedBudget = budget + 20;
    let safetyCounter = 0;

    while (safetyCounter < 20) {
        let extraParts = pickPSUAndCase(selectedCPU, selectedGPU, selectedMobo);
        
        let currentTotal = (selectedCPU ? selectedCPU.price : 0) +
                           (selectedGPU ? selectedGPU.price : 0) +
                           (selectedMobo ? selectedMobo.price : 0) +
                           (selectedRAM ? selectedRAM.price : 0) +
                           (selectedStorage ? selectedStorage.price : 0) +
                           (extraParts.psu ? extraParts.psu.price : 0) +
                           (extraParts.cse ? extraParts.cse.price : 0);

        if (currentTotal <= maxAllowedBudget) {
            break;
        }

        safetyCounter++;

        if (selectedGPU && selectedGPU.price > 0) {
            let cheaperGPUs = componentsData.gpus.filter(g => g.price < selectedGPU.price).sort((a, b) => b.price - a.price);
            if (cheaperGPUs.length > 0) { selectedGPU = cheaperGPUs[0]; continue; }
        }
        if (selectedCPU) {
            let cheaperCPUs = componentsData.cpus.filter(c => c.price < selectedCPU.price).sort((a, b) => b.price - a.price);
            if (cheaperCPUs.length > 0) {
                selectedCPU = cheaperCPUs[0];
                selectedMobo = pickComponent(componentsData.motherboards, budget * moboPercent, 'performance', true, selectedCPU.socket);
                continue;
            }
        }
        if (selectedRAM) {
            let cheaperRAM = componentsData.ram.filter(r => r.price < selectedRAM.price).sort((a, b) => b.price - a.price);
            if (cheaperRAM.length > 0) { selectedRAM = cheaperRAM[0]; continue; }
        }
        break;
    }

    // ترقية تلقائية في حال وجود فائض مالي
    let extraPartsCheck = pickPSUAndCase(selectedCPU, selectedGPU, selectedMobo);
    let checkTotal = (selectedCPU ? selectedCPU.price : 0) + (selectedGPU ? selectedGPU.price : 0) +
                     (selectedMobo ? selectedMobo.price : 0) + (selectedRAM ? selectedRAM.price : 0) +
                     (selectedStorage ? selectedStorage.price : 0) + (extraPartsCheck.psu ? extraPartsCheck.psu.price : 0) +
                     (extraPartsCheck.cse ? extraPartsCheck.cse.price : 0);
    
    let leftover = budget - checkTotal;

    if (leftover > 30) {
        if (selectedGPU) {
            let betterGPU = componentsData.gpus.filter(g => g.price <= (selectedGPU.price + leftover) && g.price > selectedGPU.price)
                                              .sort((a, b) => b[perfType] - a[perfType])[0];
            if (betterGPU && betterGPU[perfType] >= selectedGPU[perfType]) {
                let tempW = (selectedCPU ? (selectedCPU.wattage || 65) : 65) + betterGPU.wattage + 40;
                let testPsu = componentsData.psus ? componentsData.psus.filter(p => p.capacity >= (tempW * 1.25)).sort((a, b) => a.price - b.price)[0] : null;
                let psuPriceDiff = testPsu ? (testPsu.price - (extraPartsCheck.psu ? extraPartsCheck.psu.price : 0)) : 0;
                if ((betterGPU.price - selectedGPU.price + psuPriceDiff) <= leftover) {
                    leftover -= (betterGPU.price - selectedGPU.price + psuPriceDiff);
                    selectedGPU = betterGPU;
                    if (testPsu) extraPartsCheck.psu = testPsu;
                }
            }
        }

        if (leftover > 25) {
            let betterCPU = componentsData.cpus.filter(c => c.price <= (selectedCPU.price + leftover) && c.price > selectedCPU.price)
                                              .sort((a, b) => b[perfType] - a[perfType])[0];
            if (betterCPU && betterCPU[perfType] > selectedCPU[perfType]) {
                let matchingMobo = componentsData.motherboards.filter(m => m.socket === betterCPU.socket && m.price <= (selectedMobo.price + leftover - (betterCPU.price - selectedCPU.price)))
                                                             .sort((a,b) => b.performance - a.performance)[0];
                if (matchingMobo) {
                    leftover -= (betterCPU.price - selectedCPU.price + matchingMobo.price - selectedMobo.price);
                    selectedCPU = betterCPU;
                    selectedMobo = matchingMobo;
                }
            }
        }
    }

    let finalExtra = pickPSUAndCase(selectedCPU, selectedGPU, selectedMobo);

    const finalBuild = {
        cpu: selectedCPU,
        gpu: selectedGPU,
        motherboard: selectedMobo,
        ram: selectedRAM,
        storage: selectedStorage,
        psu: finalExtra.psu,
        case: finalExtra.cse,
        wattage: finalExtra.totalW
    };

    displayBuildResult(finalBuild);
}

// 4. دالة عرض النتيجة وتحديث واجهة المستخدم
function displayBuildResult(build) {
    const resultContainer = document.getElementById('result-container');
    const partsList = document.getElementById('parts-list');
    if (!resultContainer || !partsList) return;
    
    partsList.innerHTML = '';
    let totalPriceUSD = 0;

    const items = [
        { label: 'المعالج (CPU)', data: build.cpu },
        { label: 'كرت الشاشة (GPU)', data: build.gpu },
        { label: 'اللوحة الأم (Motherboard)', data: build.motherboard },
        { label: 'الذاكرة العشوائية (RAM)', data: build.ram },
        { label: 'وحدة التخزين (Storage)', data: build.storage },
        { label: 'مزود الطاقة (PSU)', data: build.psu },
        { label: 'صندوق الحاسوب (Case)', data: build.case }
    ];

    items.forEach(item => {
        if (item.data) { 
            totalPriceUSD += item.data.price;

            const partCard = document.createElement('div');
            partCard.className = 'part-item';
            partCard.innerHTML = `
                <div class="part-info">
                    <span class="part-label"><strong>${item.label}:</strong></span>
                    <span class="part-name">${item.data.name}</span>
                </div>
                <div class="part-price">${(item.data.price * (window.currentCurrency === 'LYD' ? window.EXCHANGE_RATE : 1)).toFixed(0)} ${window.currentCurrency === 'LYD' ? "د.ل" : "$"}</div>
            `;
            partsList.appendChild(partCard);
        }
    });

    const finalPriceConverted = (totalPriceUSD * (window.currentCurrency === 'LYD' ? window.EXCHANGE_RATE : 1)).toFixed(0);

    const totalCardElement = document.createElement('div');
    totalCardElement.className = 'part-item total-row';
    totalCardElement.innerHTML = `
        <div class="part-info">
            <span class="part-label"><strong>السعر الإجمالي للتجميعة:</strong></span>
        </div>
        <div class="part-price total-price">${finalPriceConverted} ${window.currentCurrency === 'LYD' ? "د.ل" : "$"}</div>
    `;
    partsList.appendChild(totalCardElement);

    let saveBtnContainer = document.getElementById('save-btn-wrapper');
    if (!saveBtnContainer) {
        saveBtnContainer = document.createElement('div');
        saveBtnContainer.id = 'save-btn-wrapper';
        saveBtnContainer.style.textAlign = 'center';
        saveBtnContainer.style.marginTop = '20px';
        resultContainer.appendChild(saveBtnContainer);
    }
    
    saveBtnContainer.innerHTML = `
        <button id="save-build-btn" class="btn-submit" style="background-color: #28a745; width: auto; padding: 10px 25px; cursor: pointer; border: none; border-radius: 5px; color: white; font-weight: bold;">
             حفظ هذه التجميعة في تجميعاتي
        </button>
    `;

    document.getElementById('save-build-btn').onclick = () => {
        saveCurrentBuild(build, totalPriceUSD);
    };

    resultContainer.classList.remove('hidden');
    resultContainer.scrollIntoView({ behavior: 'smooth' });
}

// 5. دالة حفظ البيانات في الـ LocalStorage 
function saveCurrentBuild(buildData, priceInUSD) {
    if (!buildData) return;

    let customName = prompt("الرجاء إدخال اسم مميز لهذه التجميعة:");
    if (customName === null) return; 

    if (customName.trim() === "") {
        const usageSelect = document.getElementById("usage");
        customName = usageSelect ? usageSelect.options[usageSelect.selectedIndex].text : "تجميعة مخصصة";
    }

    let savedBuilds = JSON.parse(localStorage.getItem("pers_builds")) || [];

    const buildToSave = {
        usageTitle: customName.trim(), 
        totalPriceUSD: priceInUSD.toFixed(0),
        totalPriceLYD: (priceInUSD * window.EXCHANGE_RATE).toFixed(0),
        totalWattage: buildData.wattage || 0,
        parts: {
            "المعالج (CPU)": buildData.cpu ? { name: buildData.cpu.name } : null,
            "كرت الشاشة (GPU)": buildData.gpu ? { name: buildData.gpu.name } : null,
            "اللوحة الأم (Motherboard)": buildData.motherboard ? { name: buildData.motherboard.name } : null,
            "الذاكرة العشوائية (RAM)": buildData.ram ? { name: buildData.ram.name } : null,
            "وحدة التخزين (Storage)": buildData.storage ? { name: buildData.storage.name } : null,
            "مزود الطاقة (PSU)": buildData.psu ? { name: buildData.psu.name } : null,
            "صندوق الحاسوب (Case)": buildData.case ? { name: buildData.case.name } : null
        }
    };

    savedBuilds.push(buildToSave);
    localStorage.setItem("pers_builds", JSON.stringify(savedBuilds));

    alert(`تم حفظ التجميعة باسم "${buildToSave.usageTitle}" بنجاح! `);
    if (document.getElementById("saved-builds-container")) displaySavedBuilds();
}

// 7. دالة جلب وعرض التجميعات المحفوظة
function displaySavedBuilds() {
    const container = document.getElementById("saved-builds-container");
    if (!container) return;
    
    let savedBuilds = JSON.parse(localStorage.getItem("pers_builds")) || [];

    // 🔙 إرجاع السطر الإرشادي باللون الأحمر عند خلو الصفحة من البيانات
    if (savedBuilds.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; grid-column: 1/-1; padding: 40px; color: #666;">
                <p style="font-size: 18px;">لا توجد تجميعات محفوظة حالياً.</p>
                <a href="CusBuilds.html" style="color: #e94560; text-decoration: none; font-weight: bold; font-size: 16px;">اضغط هنا لتبدأ بناء تجميعتك الأولى!</a>
            </div>
        `;
        return;
    }

    container.innerHTML = "";

    savedBuilds.forEach((build, index) => {
        const buildCard = document.createElement("div");
        buildCard.className = "builder-card saved-card";
        buildCard.style.marginBottom = "30px";
        buildCard.style.padding = "25px";
        buildCard.style.border = "1px solid #22254b";
        buildCard.style.borderRadius = "12px";
        buildCard.style.backgroundColor = "#1a1a2e"; 
        buildCard.style.color = "#ffffff";          

        let partsHTML = "";
        for (let partType in build.parts) {
            if (build.parts[partType]) {
                partsHTML += `<li style="margin-bottom: 8px; color: #e0e0e0;"><strong style="color: #e94560;">${partType}:</strong> ${build.parts[partType].name}</li>`;
            }
        }

        buildCard.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e94560; padding-bottom: 12px; margin-bottom: 15px;">
                <h3 style="margin: 0; color: #ffffff; font-size: 1.2rem;">${build.usageTitle}</h3>
                <button class="btn-submit" style="background-color: #d9534f; color: white; border:none; border-radius:5px; padding: 6px 15px; font-size: 13px; width:auto; cursor:pointer;" onclick="deleteBuild(${index})">حذف التجميعة</button>
            </div>
            <p style="font-size: 16px; margin: 8px 0;"><strong>التكلفة الإجمالية:</strong> <span style="color: #28a745; font-weight:bold;">$${build.totalPriceUSD}</span> / <span style="color: #28a745; font-weight:bold;">${build.totalPriceLYD} د.ل</span></p>
            <p style="font-size: 15px; margin: 8px 0; color: #b8b9ce;"><strong>استهلاك الطاقة التقديري:</strong> ${build.totalWattage} واط</p>
            <ul style="list-style-type: square; padding-right: 20px; line-height: 1.8; margin-top: 15px; border-top: 1px solid #22254b; padding-top: 15px; text-align: right; direction: rtl;">
                ${partsHTML}
            </ul>
        `;
        container.appendChild(buildCard);
    });
}

function deleteBuild(index) {
    if (confirm("هل أنت متأكد من رغبتك في حذف هذه التجميعة؟")) {
        let savedBuilds = JSON.parse(localStorage.getItem("pers_builds")) || [];
        savedBuilds.splice(index, 1);
        localStorage.setItem("pers_builds", JSON.stringify(savedBuilds));
        displaySavedBuilds();
    }
}