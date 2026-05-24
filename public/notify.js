// نظام الإشعارات + Service Worker - سوريا الإلكترونية

// تسجيل Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(function(err) {
        console.log('SW skipped (localhost)');
    });
}

// إشعار داخل الصفحة (Toast)
function showToast(title, body, icon) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position:fixed;top:20px;right:20px;left:20px;background:#1A1A1A;color:white;
        padding:14px 18px;border-radius:14px;z-index:99999;font-size:14px;
        box-shadow:0 8px 32px rgba(0,0,0,0.3);animation:slideIn 0.4s ease;
        display:flex;align-items:center;gap:10px;
    `;
    toast.innerHTML = '<span style="font-size:24px;">' + (icon || '🔔') + '</span><div><strong>' + title + '</strong><br><span style="font-size:12px;opacity:0.8;">' + body + '</span></div>';
    document.body.appendChild(toast);
    setTimeout(function() { toast.style.opacity = '0'; toast.style.transition = '0.3s'; setTimeout(function() { toast.remove(); }, 300); }, 4000);
}

// إشعارات جاهزة
function notifyNewOrder(name, total) { showToast('📦 طلب جديد!', name + ' طلب بـ ' + total + ' ل.س', '📦'); }
function notifyDriver(name) { showToast('🛵 سائق في الطريق', 'السائق ' + name + ' في طريقه إليك', '🛵'); }
function notifyDelivered() { showToast('✅ تم التوصيل', 'شكراً لثقتك!', '✅'); }
function notifyRating(stars) { showToast('⭐ تقييم جديد', 'حصلت على ' + stars + ' نجوم', '⭐'); }
function notifyOffer(title, discount) { showToast('🔥 عرض جديد', title + ' - خصم ' + discount + '%', '🔥'); }

// عرض نافذة الترحيب مرة واحدة
if (!localStorage.getItem('onboarded')) {
    setTimeout(function() {
        var overlay = document.createElement('div');
        overlay.id = 'onboarding';
        overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);z-index:99999;display:flex;align-items:center;justify-content:center;';
        overlay.innerHTML = '<div style="background:white;border-radius:20px;padding:30px 20px;text-align:center;max-width:350px;width:90%;">' +
            '<div style="font-size:48px;margin-bottom:10px;">🇸🇾</div>' +
            '<h3 style="margin-bottom:8px;">مرحباً بك في سوريا الإلكترونية</h3>' +
            '<p style="color:#6C757D;font-size:13px;margin-bottom:20px;">نحتاج بعض الصلاحيات لتقديم أفضل تجربة</p>' +
            '<button id="allowAll" style="width:100%;padding:14px;background:#007A3D;color:white;border:none;border-radius:25px;font-size:16px;font-weight:700;cursor:pointer;margin-bottom:8px;">✅ السماح بكل الصلاحيات</button>' +
            '<button id="skipAll" style="width:100%;padding:12px;background:transparent;color:#6C757D;border:2px solid #ddd;border-radius:25px;font-size:14px;cursor:pointer;">تخطي</button></div>';
        document.body.appendChild(overlay);
        
        document.getElementById('allowAll').onclick = function() {
            if (navigator.geolocation) navigator.geolocation.getCurrentPosition(function(){}, function(){});
            if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
            document.getElementById('onboarding').remove();
            localStorage.setItem('onboarded', '1');
        };
        document.getElementById('skipAll').onclick = function() {
            document.getElementById('onboarding').remove();
            localStorage.setItem('onboarded', '1');
        };
    }, 500);
}
