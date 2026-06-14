// config.js - الإعدادات العامة والعملات للموقع بالكامل
const EXCHANGE_RATE = 6.5; // سعر صرف الدولار مقابل الدينار الليبي
let currentCurrency = 'USD'; // العملة الافتراضية
let allComponents = null;    // المتغير العالمي لتخزين بيانات الـ JSON

// دالة جلب البيانات من ملف الـ JSON
async function loadComponents() {
    try {
        const response = await fetch('components.json');
        allComponents = await response.json();
        console.log("تم تحميل قاعدة البيانات بنجاح في ملف الـ Config!", allComponents);
    } catch (error) {
        console.error("خطأ في جلب بيانات القطع:", error);
    }
}

// دالة تنسيق وتحويل السعر بناءً على العملة الحالية
function formatPrice(priceInUSD) {
    if (currentCurrency === 'LYD') {
        return `${(priceInUSD * EXCHANGE_RATE).toFixed(2)} د.ل`;
    }
    return `$${priceInUSD}`;
}