// Google Apps Script — gửi email báo đặt bàn mới về hộp thư của quán.
//
// Cài đặt (làm 1 lần, bằng tài khoản Gmail của quán):
// 1) Vào https://script.google.com → Dự án mới → xóa hết code mẫu, dán toàn bộ file này vào.
// 2) Sửa SHOP_EMAIL bên dưới thành email của quán (có thể nhiều email, cách nhau dấu phẩy).
// 3) Bấm Triển khai (Deploy) → Tùy chọn triển khai mới → loại "Ứng dụng web" (Web app):
//      - Thực thi dưới dạng (Execute as): Tôi (Me)
//      - Người có quyền truy cập (Who has access): Bất kỳ ai (Anyone)
//    → Triển khai → cấp quyền cho Google (chọn tài khoản → Nâng cao → Đi tới dự án → Cho phép).
// 4) Copy "URL ứng dụng web" (dạng https://script.google.com/macros/s/.../exec)
//    và dán vào EMAIL_WEBHOOK trong booking.html.
//
// Chống spam: script chỉ gửi mail cho đặt bàn CÓ THẬT trong Firebase (kiểm tra theo mã đặt bàn),
// mỗi đặt bàn chỉ gửi 1 lần, và tối đa MAX_PER_HOUR mail mỗi giờ.

const SHOP_EMAIL = 'email-cua-quan@gmail.com';
const DB_URL = 'https://torishin-ace11-default-rtdb.asia-southeast1.firebasedatabase.app';
const ADMIN_URL = 'https://cungchiasetamtrangbuon-lang.github.io/torishin/booking_admin.html';
const MAX_PER_HOUR = 40;

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const id = String(body.id || '');
    if (!/^[A-Za-z0-9_-]{10,40}$/.test(id)) return reply({ ok: false, error: 'bad id' });

    const cache = CacheService.getScriptCache();
    if (cache.get('sent_' + id)) return reply({ ok: true, dup: true });
    const hourKey = 'count_' + Utilities.formatDate(new Date(), 'GMT', 'yyyyMMddHH');
    const count = Number(cache.get(hourKey) || 0);
    if (count >= MAX_PER_HOUR) return reply({ ok: false, error: 'rate limit' });

    // Lấy dữ liệu từ Firebase thay vì tin dữ liệu gửi lên
    const res = UrlFetchApp.fetch(DB_URL + '/torishin_bookings/' + id + '.json', { muteHttpExceptions: true });
    const b = JSON.parse(res.getContentText() || 'null');
    if (!b || !b.date || !b.time) return reply({ ok: false, error: 'not found' });

    const d = String(b.date).split('-').reverse().join('/');
    const subject = '🍶 Đặt bàn mới: ' + b.time + ' ' + d + ' — ' + b.guests + ' người — ' + b.name;
    const rows = [
      ['Ngày', d], ['Giờ', b.time], ['Số người', b.guests], ['Tên', b.name],
      ['Điện thoại', b.phone], ['Ghi chú', b.note || '—'], ['Ngôn ngữ', String(b.lang || 'vi').toUpperCase()],
    ];
    const text = rows.map(function (r) { return r[0] + ': ' + r[1]; }).join('\n') + '\n\nXác nhận tại: ' + ADMIN_URL;
    const html =
      '<h2 style="margin:0 0 12px">Đặt bàn mới — Torishin</h2>' +
      '<table style="border-collapse:collapse;font-size:15px">' +
      rows.map(function (r) {
        return '<tr><td style="padding:4px 12px 4px 0;color:#666">' + esc(r[0]) + '</td><td style="padding:4px 0"><b>' + esc(r[1]) + '</b></td></tr>';
      }).join('') +
      '</table>' +
      '<p><a href="tel:' + esc(String(b.phone).replace(/[^\d+]/g, '')) + '">📞 Gọi khách</a> &nbsp; ' +
      '<a href="' + ADMIN_URL + '">✔ Mở trang quản lý đặt bàn</a></p>';

    MailApp.sendEmail({ to: SHOP_EMAIL, subject: subject, body: text, htmlBody: html, name: 'Torishin Đặt bàn' });
    cache.put('sent_' + id, '1', 21600);
    cache.put(hourKey, String(count + 1), 3600);
    return reply({ ok: true });
  } catch (err) {
    return reply({ ok: false, error: String(err) });
  }
}

// Chạy thử trong trình soạn thảo: chọn hàm testMail → Chạy. Sẽ gửi 1 mail mẫu tới SHOP_EMAIL.
function testMail() {
  MailApp.sendEmail(SHOP_EMAIL, '🍶 Thử mail đặt bàn Torishin', 'Nếu bạn nhận được mail này, phần gửi mail đã hoạt động.');
}

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
