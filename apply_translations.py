#!/usr/bin/env python3
"""Apply guide translations to all language files."""
import json
import os
import copy

MESSAGES_DIR = os.path.expanduser("~/Developer/dopplerLanding/messages")

def deep_update(base, updates):
    """Recursively update base dict with updates dict."""
    for key, value in updates.items():
        if isinstance(value, dict) and isinstance(base.get(key), dict):
            deep_update(base[key], value)
        else:
            base[key] = value

# Helper to create a full guide translation from a common pattern
def make_guide(t):
    """t is a dict with all translated strings."""
    return t

translations = {}

# TURKISH (tr)
translations["tr"] = {
    "title": "Kurulum Rehberi",
    "subtitle": "Dakikalar içinde bağlanın. Başlamak için cihazınızı seçin.",
    "chooseDevice": "Cihazınızı seçin",
    "android": {
        "title": "Android Kurulumu",
        "subtitle": "Android cihazınızda Doppler VPN'i kurun",
        "step1Title": "V2RayNG'yi İndirin",
        "step1Desc": "V2RayNG'yi Google Play Store'dan yükleyin veya APK'yı GitHub'dan indirin.",
        "step1PlayStore": "Google Play Store",
        "step1GitHub": "GitHub APK",
        "step2Title": "VPN Yapılandırmasını Alın",
        "step2Desc": "Telegram botumuzu @dopplercreatebot açın, \"Connect VPN\"e dokunun, sunucu seçin ve VLESS yapılandırma bağlantısı alacaksınız.",
        "step3Title": "Yapılandırmayı İçe Aktarın",
        "step3Desc": "VLESS bağlantısını kopyalamak için uzun basın. V2RayNG'yi açın → + düğmesine dokunun → \"Import config from clipboard\" seçin.",
        "step4Title": "Bağlan",
        "step4Desc": "Bağlanmak için oynat düğmesine dokunun. İstendiğinde VPN iznini verin. Artık korunuyorsunuz!",
        "troubleshootTitle": "Sorun Giderme",
        "troubleshoot1": "Bağlantı başarısız olursa botta farklı bir sunucu konumu deneyin.",
        "troubleshoot2": "V2RayNG için pil optimizasyonunun devre dışı olduğundan emin olun.",
        "troubleshoot3": "Yardım için Telegram'da @DopplerSupportBot'a mesaj gönderin — AI desteğimiz 7/24 hizmetinizdedir."
    },
    "ios": {
        "title": "iOS Kurulumu",
        "subtitle": "iPhone veya iPad'inizde Doppler VPN'i kurun",
        "step1Title": "Streisand'ı İndirin",
        "step1Desc": "App Store'dan Streisand'ı yükleyin. Ücretsizdir ve VLESS protokolünü destekler.",
        "step1AppStore": "App Store",
        "step2Title": "VPN Yapılandırmasını Alın",
        "step2Desc": "Telegram botumuzu @dopplercreatebot açın, \"Connect VPN\"e dokunun, sunucu seçin ve VLESS yapılandırma bağlantısı alacaksınız.",
        "step3Title": "Yapılandırmayı İçe Aktarın",
        "step3Desc": "VLESS bağlantısını kopyalamak için uzun basın. Streisand'ı açın → + dokunun → \"Import from clipboard\". İstendiğinde VPN yapılandırmasına izin verin.",
        "step4Title": "Bağlan",
        "step4Desc": "Bağlanmak için düğmeyi açın. Trafiğiniz artık şifreli ve korumalı!",
        "troubleshootTitle": "Sorun Giderme",
        "troubleshoot1": "VPN bağlanmıyorsa yapılandırmayı silip tekrar içe aktarmayı deneyin.",
        "troubleshoot2": "Ayarlar > Genel > VPN'de Streisand'ın VPN yapılandırması ekleme iznine sahip olduğundan emin olun.",
        "troubleshoot3": "Yardım için Telegram'da @DopplerSupportBot'a mesaj gönderin — AI desteğimiz 7/24 hizmetinizdedir."
    },
    "windows": {
        "title": "Windows Kurulumu",
        "subtitle": "Windows bilgisayarınızda Doppler VPN'i kurun",
        "step1Title": "v2rayN'yi İndirin",
        "step1Desc": "GitHub'dan v2rayN'yi indirin. ZIP dosyasını çıkarın ve v2rayN.exe'yi çalıştırın.",
        "step1Download": "v2rayN'yi İndirin",
        "step2Title": "VPN Yapılandırmasını Alın",
        "step2Desc": "Telegram botumuzu @dopplercreatebot açın, \"Connect VPN\"e dokunun, sunucu seçin ve VLESS yapılandırma bağlantısı alacaksınız.",
        "step3Title": "Yapılandırmayı İçe Aktarın",
        "step3Desc": "VLESS bağlantısını kopyalayın. v2rayN'de \"Server\" → \"Import from clipboard\" tıklayın veya Ctrl+V basın.",
        "step4Title": "Bağlan",
        "step4Desc": "Sistem tepsisindeki v2rayN simgesine sağ tıklayın ve \"System proxy\" → \"Set as system proxy\" seçin. Bağlandınız!",
        "troubleshootTitle": "Sorun Giderme",
        "troubleshoot1": "Windows Defender veya antivirüsünüzün v2rayN'yi engellemediğinden emin olun.",
        "troubleshoot2": "v2rayN'yi Yönetici olarak çalıştırmayı deneyin.",
        "troubleshoot3": "Yardım için Telegram'da @DopplerSupportBot'a mesaj gönderin — AI desteğimiz 7/24 hizmetinizdedir."
    },
    "mac": {
        "title": "macOS Kurulumu",
        "subtitle": "Mac'inizde Doppler VPN'i kurun",
        "step1Title": "V2RayXS'i İndirin",
        "step1Desc": "GitHub'dan V2RayXS'i indirin veya Mac App Store'dan Streisand'ı yükleyin.",
        "step1Download": "V2RayXS'i İndirin",
        "step1AppStore": "Mac App Store",
        "step2Title": "VPN Yapılandırmasını Alın",
        "step2Desc": "Telegram botumuzu @dopplercreatebot açın, \"Connect VPN\"e dokunun, sunucu seçin ve VLESS yapılandırma bağlantısı alacaksınız.",
        "step3Title": "Yapılandırmayı İçe Aktarın",
        "step3Desc": "VLESS bağlantısını kopyalayın. V2RayXS'i açın → \"Import\" → \"From clipboard\". Veya Streisand'da + dokunun → \"Import from clipboard\".",
        "step4Title": "Bağlan",
        "step4Desc": "Bağlan düğmesine tıklayın. macOS istediğinde VPN yapılandırmasına izin verin. Tamamdır!",
        "troubleshootTitle": "Sorun Giderme",
        "troubleshoot1": "macOS uygulamayı engelliyorsa Sistem Tercihleri > Gizlilik ve Güvenlik'e gidin ve izin verin.",
        "troubleshoot2": "Bağlantı kesilirse uygulamayı yeniden başlatmayı deneyin.",
        "troubleshoot3": "Yardım için Telegram'da @DopplerSupportBot'a mesaj gönderin — AI desteğimiz 7/24 hizmetinizdedir."
    },
    "telegramSection": {
        "title": "Telegram Entegrasyonu",
        "subtitle": "VPN yapılandırmanızı alın ve aboneliğinizi doğrudan Telegram'da yönetin.",
        "vpnBot": "VPN Botu",
        "vpnBotDesc": "VPN yapılandırmanızı alın, sunuculara bağlanın ve hesabınızı yönetin.",
        "supportBot": "Destek Botu",
        "supportBotDesc": "23 dilde 7/24 AI destekli yardım. Her sorun için anında destek.",
        "miniApp": "Abonelik Mini App",
        "miniAppDesc": "Telegram Mini App'imiz üzerinden güvenli Stripe ödemeleriyle abone olun ve planınızı yönetin."
    },
    "backToGuides": "Tüm Rehberler",
    "nextStep": "İleri",
    "prevStep": "Geri"
}

# VIETNAMESE (vi)
translations["vi"] = {
    "title": "Hướng dẫn cài đặt",
    "subtitle": "Kết nối trong vài phút. Chọn thiết bị của bạn để bắt đầu.",
    "chooseDevice": "Chọn thiết bị của bạn",
    "android": {
        "title": "Cài đặt Android",
        "subtitle": "Thiết lập Doppler VPN trên thiết bị Android của bạn",
        "step1Title": "Tải V2RayNG",
        "step1Desc": "Cài đặt V2RayNG từ Google Play Store hoặc tải APK từ GitHub.",
        "step1PlayStore": "Google Play Store",
        "step1GitHub": "GitHub APK",
        "step2Title": "Lấy cấu hình VPN",
        "step2Desc": "Mở bot Telegram @dopplercreatebot, nhấn \"Connect VPN\", chọn máy chủ và bạn sẽ nhận được liên kết cấu hình VLESS.",
        "step3Title": "Nhập cấu hình",
        "step3Desc": "Nhấn giữ liên kết VLESS để sao chép. Mở V2RayNG → nhấn nút + → chọn \"Import config from clipboard\".",
        "step4Title": "Kết nối",
        "step4Desc": "Nhấn nút phát để kết nối. Cho phép quyền VPN khi được yêu cầu. Bạn đã được bảo vệ!",
        "troubleshootTitle": "Khắc phục sự cố",
        "troubleshoot1": "Nếu kết nối thất bại, hãy thử máy chủ khác trong bot.",
        "troubleshoot2": "Đảm bảo tối ưu hóa pin đã được tắt cho V2RayNG.",
        "troubleshoot3": "Để được hỗ trợ, nhắn tin cho @DopplerSupportBot trên Telegram — hỗ trợ AI của chúng tôi hoạt động 24/7."
    },
    "ios": {
        "title": "Cài đặt iOS",
        "subtitle": "Thiết lập Doppler VPN trên iPhone hoặc iPad của bạn",
        "step1Title": "Tải Streisand",
        "step1Desc": "Cài đặt Streisand từ App Store. Miễn phí và hỗ trợ giao thức VLESS.",
        "step1AppStore": "App Store",
        "step2Title": "Lấy cấu hình VPN",
        "step2Desc": "Mở bot Telegram @dopplercreatebot, nhấn \"Connect VPN\", chọn máy chủ và bạn sẽ nhận được liên kết cấu hình VLESS.",
        "step3Title": "Nhập cấu hình",
        "step3Desc": "Nhấn giữ liên kết VLESS để sao chép. Mở Streisand → nhấn + → \"Import from clipboard\". Cho phép cấu hình VPN khi được yêu cầu.",
        "step4Title": "Kết nối",
        "step4Desc": "Bật công tắc để kết nối. Lưu lượng của bạn giờ đã được mã hóa và bảo vệ!",
        "troubleshootTitle": "Khắc phục sự cố",
        "troubleshoot1": "Nếu VPN không kết nối, hãy thử xóa và nhập lại cấu hình.",
        "troubleshoot2": "Đảm bảo Streisand có quyền thêm cấu hình VPN trong Cài đặt > Cài đặt chung > VPN.",
        "troubleshoot3": "Để được hỗ trợ, nhắn tin cho @DopplerSupportBot trên Telegram — hỗ trợ AI của chúng tôi hoạt động 24/7."
    },
    "windows": {
        "title": "Cài đặt Windows",
        "subtitle": "Thiết lập Doppler VPN trên PC Windows của bạn",
        "step1Title": "Tải v2rayN",
        "step1Desc": "Tải v2rayN từ GitHub. Giải nén tệp ZIP và chạy v2rayN.exe.",
        "step1Download": "Tải v2rayN",
        "step2Title": "Lấy cấu hình VPN",
        "step2Desc": "Mở bot Telegram @dopplercreatebot, nhấn \"Connect VPN\", chọn máy chủ và bạn sẽ nhận được liên kết cấu hình VLESS.",
        "step3Title": "Nhập cấu hình",
        "step3Desc": "Sao chép liên kết VLESS. Trong v2rayN, nhấn \"Server\" → \"Import from clipboard\" hoặc nhấn Ctrl+V.",
        "step4Title": "Kết nối",
        "step4Desc": "Nhấp chuột phải vào biểu tượng v2rayN trên khay hệ thống và chọn \"System proxy\" → \"Set as system proxy\". Bạn đã kết nối!",
        "troubleshootTitle": "Khắc phục sự cố",
        "troubleshoot1": "Đảm bảo Windows Defender hoặc phần mềm diệt virus không chặn v2rayN.",
        "troubleshoot2": "Thử chạy v2rayN với quyền Quản trị viên.",
        "troubleshoot3": "Để được hỗ trợ, nhắn tin cho @DopplerSupportBot trên Telegram — hỗ trợ AI của chúng tôi hoạt động 24/7."
    },
    "mac": {
        "title": "Cài đặt macOS",
        "subtitle": "Thiết lập Doppler VPN trên Mac của bạn",
        "step1Title": "Tải V2RayXS",
        "step1Desc": "Tải V2RayXS từ GitHub hoặc cài đặt Streisand từ Mac App Store.",
        "step1Download": "Tải V2RayXS",
        "step1AppStore": "Mac App Store",
        "step2Title": "Lấy cấu hình VPN",
        "step2Desc": "Mở bot Telegram @dopplercreatebot, nhấn \"Connect VPN\", chọn máy chủ và bạn sẽ nhận được liên kết cấu hình VLESS.",
        "step3Title": "Nhập cấu hình",
        "step3Desc": "Sao chép liên kết VLESS. Mở V2RayXS → \"Import\" → \"From clipboard\". Hoặc trong Streisand, nhấn + → \"Import from clipboard\".",
        "step4Title": "Kết nối",
        "step4Desc": "Nhấp nút kết nối. Cho phép cấu hình VPN khi macOS yêu cầu. Xong!",
        "troubleshootTitle": "Khắc phục sự cố",
        "troubleshoot1": "Nếu macOS chặn ứng dụng, vào System Preferences > Privacy & Security và cho phép.",
        "troubleshoot2": "Thử khởi động lại ứng dụng nếu kết nối bị ngắt.",
        "troubleshoot3": "Để được hỗ trợ, nhắn tin cho @DopplerSupportBot trên Telegram — hỗ trợ AI của chúng tôi hoạt động 24/7."
    },
    "telegramSection": {
        "title": "Tích hợp Telegram",
        "subtitle": "Nhận cấu hình VPN và quản lý gói đăng ký trực tiếp trên Telegram.",
        "vpnBot": "Bot VPN",
        "vpnBotDesc": "Nhận cấu hình VPN, kết nối máy chủ và quản lý tài khoản.",
        "supportBot": "Bot Hỗ trợ",
        "supportBotDesc": "Hỗ trợ AI 24/7 bằng 23 ngôn ngữ. Trợ giúp tức thì cho mọi vấn đề.",
        "miniApp": "Mini App Đăng ký",
        "miniAppDesc": "Đăng ký và quản lý gói của bạn qua Mini App Telegram với thanh toán Stripe an toàn."
    },
    "backToGuides": "Tất cả hướng dẫn",
    "nextStep": "Tiếp theo",
    "prevStep": "Trước"
}

# SWAHILI (sw)
translations["sw"] = {
    "title": "Mwongozo wa Usanidi",
    "subtitle": "Unganisha ndani ya dakika chache. Chagua kifaa chako kuanza.",
    "chooseDevice": "Chagua kifaa chako",
    "android": {
        "title": "Usanidi wa Android",
        "subtitle": "Sanidi Doppler VPN kwenye kifaa chako cha Android",
        "step1Title": "Pakua V2RayNG",
        "step1Desc": "Sakinisha V2RayNG kutoka Google Play Store au pakua APK kutoka GitHub.",
        "step1PlayStore": "Google Play Store",
        "step1GitHub": "GitHub APK",
        "step2Title": "Pata Usanidi wa VPN",
        "step2Desc": "Fungua boti yetu ya Telegram @dopplercreatebot, bonyeza \"Connect VPN\", chagua seva na utapokea kiungo cha usanidi wa VLESS.",
        "step3Title": "Ingiza Usanidi",
        "step3Desc": "Bonyeza kwa muda mrefu kiungo cha VLESS ili kunakili. Fungua V2RayNG → bonyeza kitufe cha + → chagua \"Import config from clipboard\".",
        "step4Title": "Unganisha",
        "step4Desc": "Bonyeza kitufe cha kucheza kuunganisha. Ruhusu ruhusa ya VPN unapoombwa. Sasa umelindwa!",
        "troubleshootTitle": "Utatuzi wa Matatizo",
        "troubleshoot1": "Ikiwa muunganisho umeshindwa, jaribu eneo tofauti la seva kwenye boti.",
        "troubleshoot2": "Hakikisha uboreshaji wa betri umezimwa kwa V2RayNG.",
        "troubleshoot3": "Kwa msaada, tuma ujumbe kwa @DopplerSupportBot kwenye Telegram — msaada wetu wa AI unapatikana 24/7."
    },
    "ios": {
        "title": "Usanidi wa iOS",
        "subtitle": "Sanidi Doppler VPN kwenye iPhone au iPad yako",
        "step1Title": "Pakua Streisand",
        "step1Desc": "Sakinisha Streisand kutoka App Store. Ni bure na inasaidia itifaki ya VLESS.",
        "step1AppStore": "App Store",
        "step2Title": "Pata Usanidi wa VPN",
        "step2Desc": "Fungua boti yetu ya Telegram @dopplercreatebot, bonyeza \"Connect VPN\", chagua seva na utapokea kiungo cha usanidi wa VLESS.",
        "step3Title": "Ingiza Usanidi",
        "step3Desc": "Bonyeza kwa muda mrefu kiungo cha VLESS ili kunakili. Fungua Streisand → bonyeza + → \"Import from clipboard\". Ruhusu usanidi wa VPN unapoombwa.",
        "step4Title": "Unganisha",
        "step4Desc": "Bonyeza swichi kuunganisha. Trafiki yako sasa imesimbwa na kulindwa!",
        "troubleshootTitle": "Utatuzi wa Matatizo",
        "troubleshoot1": "Ikiwa VPN haiunganishi, jaribu kuondoa na kuingiza tena usanidi.",
        "troubleshoot2": "Hakikisha Streisand ina ruhusa ya kuongeza usanidi wa VPN katika Mipangilio > Jumla > VPN.",
        "troubleshoot3": "Kwa msaada, tuma ujumbe kwa @DopplerSupportBot kwenye Telegram — msaada wetu wa AI unapatikana 24/7."
    },
    "windows": {
        "title": "Usanidi wa Windows",
        "subtitle": "Sanidi Doppler VPN kwenye PC yako ya Windows",
        "step1Title": "Pakua v2rayN",
        "step1Desc": "Pakua v2rayN kutoka GitHub. Fungua faili ya ZIP na uendeshe v2rayN.exe.",
        "step1Download": "Pakua v2rayN",
        "step2Title": "Pata Usanidi wa VPN",
        "step2Desc": "Fungua boti yetu ya Telegram @dopplercreatebot, bonyeza \"Connect VPN\", chagua seva na utapokea kiungo cha usanidi wa VLESS.",
        "step3Title": "Ingiza Usanidi",
        "step3Desc": "Nakili kiungo cha VLESS. Katika v2rayN, bonyeza \"Server\" → \"Import from clipboard\" au bonyeza Ctrl+V.",
        "step4Title": "Unganisha",
        "step4Desc": "Bonyeza kulia ikoni ya v2rayN kwenye tray ya mfumo na uchague \"System proxy\" → \"Set as system proxy\". Umeunganishwa!",
        "troubleshootTitle": "Utatuzi wa Matatizo",
        "troubleshoot1": "Hakikisha Windows Defender au antivirus yako haizuii v2rayN.",
        "troubleshoot2": "Jaribu kuendesha v2rayN kama Msimamizi.",
        "troubleshoot3": "Kwa msaada, tuma ujumbe kwa @DopplerSupportBot kwenye Telegram — msaada wetu wa AI unapatikana 24/7."
    },
    "mac": {
        "title": "Usanidi wa macOS",
        "subtitle": "Sanidi Doppler VPN kwenye Mac yako",
        "step1Title": "Pakua V2RayXS",
        "step1Desc": "Pakua V2RayXS kutoka GitHub au sakinisha Streisand kutoka Mac App Store.",
        "step1Download": "Pakua V2RayXS",
        "step1AppStore": "Mac App Store",
        "step2Title": "Pata Usanidi wa VPN",
        "step2Desc": "Fungua boti yetu ya Telegram @dopplercreatebot, bonyeza \"Connect VPN\", chagua seva na utapokea kiungo cha usanidi wa VLESS.",
        "step3Title": "Ingiza Usanidi",
        "step3Desc": "Nakili kiungo cha VLESS. Fungua V2RayXS → \"Import\" → \"From clipboard\". Au katika Streisand, bonyeza + → \"Import from clipboard\".",
        "step4Title": "Unganisha",
        "step4Desc": "Bonyeza kitufe cha kuunganisha. Ruhusu usanidi wa VPN macOS inapokuliza. Umekamilika!",
        "troubleshootTitle": "Utatuzi wa Matatizo",
        "troubleshoot1": "Ikiwa macOS inazuia programu, nenda System Preferences > Privacy & Security na uruhusu.",
        "troubleshoot2": "Jaribu kuanzisha upya programu ikiwa muunganisho unakatika.",
        "troubleshoot3": "Kwa msaada, tuma ujumbe kwa @DopplerSupportBot kwenye Telegram — msaada wetu wa AI unapatikana 24/7."
    },
    "telegramSection": {
        "title": "Muunganisho wa Telegram",
        "subtitle": "Pata usanidi wako wa VPN na usimamie usajili wako moja kwa moja kwenye Telegram.",
        "vpnBot": "Boti ya VPN",
        "vpnBotDesc": "Pata usanidi wa VPN, unganisha kwenye seva, na usimamie akaunti yako.",
        "supportBot": "Boti ya Msaada",
        "supportBotDesc": "Msaada wa AI 24/7 katika lugha 23. Msaada wa papo hapo kwa tatizo lolote.",
        "miniApp": "Mini App ya Usajili",
        "miniAppDesc": "Jiandikishe na usimamie mpango wako kupitia Mini App yetu ya Telegram na malipo salama ya Stripe."
    },
    "backToGuides": "Miongozo Yote",
    "nextStep": "Ifuatayo",
    "prevStep": "Iliyopita"
}

# TAGALOG (tl)
translations["tl"] = {
    "title": "Gabay sa Pag-setup",
    "subtitle": "Kumonekta sa loob ng ilang minuto. Piliin ang iyong device para magsimula.",
    "chooseDevice": "Piliin ang iyong device",
    "android": {
        "title": "Android Setup",
        "subtitle": "I-setup ang Doppler VPN sa iyong Android device",
        "step1Title": "I-download ang V2RayNG",
        "step1Desc": "I-install ang V2RayNG mula sa Google Play Store o i-download ang APK mula sa GitHub.",
        "step1PlayStore": "Google Play Store",
        "step1GitHub": "GitHub APK",
        "step2Title": "Kunin ang VPN Config",
        "step2Desc": "Buksan ang aming Telegram bot na @dopplercreatebot, i-tap ang \"Connect VPN\", pumili ng server at makakatanggap ka ng VLESS config link.",
        "step3Title": "I-import ang Config",
        "step3Desc": "Pindutin nang matagal ang VLESS link para kopyahin. Buksan ang V2RayNG → i-tap ang + button → piliin ang \"Import config from clipboard\".",
        "step4Title": "Kumonekta",
        "step4Desc": "I-tap ang play button para kumonekta. Payagan ang VPN permission kapag hiningi. Protektado ka na!",
        "troubleshootTitle": "Pag-troubleshoot",
        "troubleshoot1": "Kung hindi makakonekta, subukan ang ibang server location sa bot.",
        "troubleshoot2": "Siguraduhing naka-disable ang battery optimization para sa V2RayNG.",
        "troubleshoot3": "Para sa tulong, mag-message sa @DopplerSupportBot sa Telegram — available ang aming AI support 24/7."
    },
    "ios": {
        "title": "iOS Setup",
        "subtitle": "I-setup ang Doppler VPN sa iyong iPhone o iPad",
        "step1Title": "I-download ang Streisand",
        "step1Desc": "I-install ang Streisand mula sa App Store. Libre ito at sumusuporta sa VLESS protocol.",
        "step1AppStore": "App Store",
        "step2Title": "Kunin ang VPN Config",
        "step2Desc": "Buksan ang aming Telegram bot na @dopplercreatebot, i-tap ang \"Connect VPN\", pumili ng server at makakatanggap ka ng VLESS config link.",
        "step3Title": "I-import ang Config",
        "step3Desc": "Pindutin nang matagal ang VLESS link para kopyahin. Buksan ang Streisand → i-tap ang + → \"Import from clipboard\". Payagan ang VPN configuration kapag hiningi.",
        "step4Title": "Kumonekta",
        "step4Desc": "I-tap ang toggle para kumonekta. Naka-encrypt at protektado na ang iyong traffic!",
        "troubleshootTitle": "Pag-troubleshoot",
        "troubleshoot1": "Kung hindi kumokonekta ang VPN, subukang tanggalin at i-import ulit ang config.",
        "troubleshoot2": "Siguraduhing may permission ang Streisand na mag-add ng VPN configurations sa Settings > General > VPN.",
        "troubleshoot3": "Para sa tulong, mag-message sa @DopplerSupportBot sa Telegram — available ang aming AI support 24/7."
    },
    "windows": {
        "title": "Windows Setup",
        "subtitle": "I-setup ang Doppler VPN sa iyong Windows PC",
        "step1Title": "I-download ang v2rayN",
        "step1Desc": "I-download ang v2rayN mula sa GitHub. I-extract ang ZIP file at patakbuhin ang v2rayN.exe.",
        "step1Download": "I-download ang v2rayN",
        "step2Title": "Kunin ang VPN Config",
        "step2Desc": "Buksan ang aming Telegram bot na @dopplercreatebot, i-tap ang \"Connect VPN\", pumili ng server at makakatanggap ka ng VLESS config link.",
        "step3Title": "I-import ang Config",
        "step3Desc": "Kopyahin ang VLESS link. Sa v2rayN, i-click ang \"Server\" → \"Import from clipboard\" o pindutin ang Ctrl+V.",
        "step4Title": "Kumonekta",
        "step4Desc": "I-right-click ang v2rayN tray icon at piliin ang \"System proxy\" → \"Set as system proxy\". Nakakonekta ka na!",
        "troubleshootTitle": "Pag-troubleshoot",
        "troubleshoot1": "Siguraduhing hindi bini-block ng Windows Defender o ng iyong antivirus ang v2rayN.",
        "troubleshoot2": "Subukang patakbuhin ang v2rayN bilang Administrator.",
        "troubleshoot3": "Para sa tulong, mag-message sa @DopplerSupportBot sa Telegram — available ang aming AI support 24/7."
    },
    "mac": {
        "title": "macOS Setup",
        "subtitle": "I-setup ang Doppler VPN sa iyong Mac",
        "step1Title": "I-download ang V2RayXS",
        "step1Desc": "I-download ang V2RayXS mula sa GitHub o i-install ang Streisand mula sa Mac App Store.",
        "step1Download": "I-download ang V2RayXS",
        "step1AppStore": "Mac App Store",
        "step2Title": "Kunin ang VPN Config",
        "step2Desc": "Buksan ang aming Telegram bot na @dopplercreatebot, i-tap ang \"Connect VPN\", pumili ng server at makakatanggap ka ng VLESS config link.",
        "step3Title": "I-import ang Config",
        "step3Desc": "Kopyahin ang VLESS link. Buksan ang V2RayXS → \"Import\" → \"From clipboard\". O sa Streisand, i-tap ang + → \"Import from clipboard\".",
        "step4Title": "Kumonekta",
        "step4Desc": "I-click ang connect button. Payagan ang VPN configuration kapag hiningi ng macOS. Tapos na!",
        "troubleshootTitle": "Pag-troubleshoot",
        "troubleshoot1": "Kung bini-block ng macOS ang app, pumunta sa System Preferences > Privacy & Security at payagan ito.",
        "troubleshoot2": "Subukang i-restart ang app kung nawawala ang koneksyon.",
        "troubleshoot3": "Para sa tulong, mag-message sa @DopplerSupportBot sa Telegram — available ang aming AI support 24/7."
    },
    "telegramSection": {
        "title": "Telegram Integration",
        "subtitle": "Kunin ang iyong VPN config at pamahalaan ang iyong subscription direkta sa Telegram.",
        "vpnBot": "VPN Bot",
        "vpnBotDesc": "Kunin ang iyong VPN configuration, kumonekta sa mga server, at pamahalaan ang iyong account.",
        "supportBot": "Support Bot",
        "supportBotDesc": "24/7 AI-powered support sa 23 wika. Instant na tulong para sa anumang problema.",
        "miniApp": "Subscription Mini App",
        "miniAppDesc": "Mag-subscribe at pamahalaan ang iyong plan sa pamamagitan ng aming Telegram Mini App na may secure na Stripe payments."
    },
    "backToGuides": "Lahat ng Gabay",
    "nextStep": "Susunod",
    "prevStep": "Nakaraan"
}

# URDU (ur)
translations["ur"] = {
    "title": "سیٹ اپ گائیڈ",
    "subtitle": "چند منٹوں میں جڑ جائیں۔ شروع کرنے کے لیے اپنا آلہ منتخب کریں۔",
    "chooseDevice": "اپنا آلہ منتخب کریں",
    "android": {
        "title": "Android سیٹ اپ",
        "subtitle": "اپنے Android آلے پر Doppler VPN سیٹ اپ کریں",
        "step1Title": "V2RayNG ڈاؤن لوڈ کریں",
        "step1Desc": "Google Play Store سے V2RayNG انسٹال کریں یا GitHub سے APK ڈاؤن لوڈ کریں۔",
        "step1PlayStore": "Google Play Store",
        "step1GitHub": "GitHub APK",
        "step2Title": "VPN کنفیگریشن حاصل کریں",
        "step2Desc": "ہمارا Telegram بوٹ @dopplercreatebot کھولیں، \"Connect VPN\" پر ٹیپ کریں، سرور منتخب کریں اور آپ کو VLESS کنفیگ لنک ملے گا۔",
        "step3Title": "کنفیگ درآمد کریں",
        "step3Desc": "VLESS لنک کاپی کرنے کے لیے دیر تک دبائیں۔ V2RayNG کھولیں ← + بٹن دبائیں ← \"Import config from clipboard\" منتخب کریں۔",
        "step4Title": "جڑیں",
        "step4Desc": "جڑنے کے لیے پلے بٹن دبائیں۔ اجازت مانگنے پر VPN کی اجازت دیں۔ آپ اب محفوظ ہیں!",
        "troubleshootTitle": "مسائل کا حل",
        "troubleshoot1": "اگر کنکشن ناکام ہو تو بوٹ میں دوسرا سرور آزمائیں۔",
        "troubleshoot2": "یقینی بنائیں کہ V2RayNG کے لیے بیٹری آپٹیمائزیشن بند ہے۔",
        "troubleshoot3": "مدد کے لیے Telegram پر @DopplerSupportBot کو پیغام بھیجیں — ہماری AI سپورٹ 24/7 دستیاب ہے۔"
    },
    "ios": {
        "title": "iOS سیٹ اپ",
        "subtitle": "اپنے iPhone یا iPad پر Doppler VPN سیٹ اپ کریں",
        "step1Title": "Streisand ڈاؤن لوڈ کریں",
        "step1Desc": "App Store سے Streisand انسٹال کریں۔ یہ مفت ہے اور VLESS پروٹوکول کو سپورٹ کرتا ہے۔",
        "step1AppStore": "App Store",
        "step2Title": "VPN کنفیگریشن حاصل کریں",
        "step2Desc": "ہمارا Telegram بوٹ @dopplercreatebot کھولیں، \"Connect VPN\" پر ٹیپ کریں، سرور منتخب کریں اور آپ کو VLESS کنفیگ لنک ملے گا۔",
        "step3Title": "کنفیگ درآمد کریں",
        "step3Desc": "VLESS لنک کاپی کرنے کے لیے دیر تک دبائیں۔ Streisand کھولیں ← + دبائیں ← \"Import from clipboard\"۔ اجازت مانگنے پر VPN کنفیگریشن کی اجازت دیں۔",
        "step4Title": "جڑیں",
        "step4Desc": "جڑنے کے لیے ٹوگل دبائیں۔ آپ کا ٹریفک اب انکرپٹڈ اور محفوظ ہے!",
        "troubleshootTitle": "مسائل کا حل",
        "troubleshoot1": "اگر VPN نہیں جڑتا تو کنفیگ ہٹا کر دوبارہ درآمد کریں۔",
        "troubleshoot2": "یقینی بنائیں کہ Streisand کو ترتیبات > عمومی > VPN میں VPN کنفیگریشن شامل کرنے کی اجازت ہے۔",
        "troubleshoot3": "مدد کے لیے Telegram پر @DopplerSupportBot کو پیغام بھیجیں — ہماری AI سپورٹ 24/7 دستیاب ہے۔"
    },
    "windows": {
        "title": "Windows سیٹ اپ",
        "subtitle": "اپنے Windows PC پر Doppler VPN سیٹ اپ کریں",
        "step1Title": "v2rayN ڈاؤن لوڈ کریں",
        "step1Desc": "GitHub سے v2rayN ڈاؤن لوڈ کریں۔ ZIP فائل نکالیں اور v2rayN.exe چلائیں۔",
        "step1Download": "v2rayN ڈاؤن لوڈ کریں",
        "step2Title": "VPN کنفیگریشن حاصل کریں",
        "step2Desc": "ہمارا Telegram بوٹ @dopplercreatebot کھولیں، \"Connect VPN\" پر ٹیپ کریں، سرور منتخب کریں اور آپ کو VLESS کنفیگ لنک ملے گا۔",
        "step3Title": "کنفیگ درآمد کریں",
        "step3Desc": "VLESS لنک کاپی کریں۔ v2rayN میں \"Server\" ← \"Import from clipboard\" کلک کریں یا Ctrl+V دبائیں۔",
        "step4Title": "جڑیں",
        "step4Desc": "سسٹم ٹرے میں v2rayN آئیکن پر دایاں کلک کریں اور \"System proxy\" ← \"Set as system proxy\" منتخب کریں۔ آپ جڑ گئے!",
        "troubleshootTitle": "مسائل کا حل",
        "troubleshoot1": "یقینی بنائیں کہ Windows Defender یا آپ کا اینٹی وائرس v2rayN کو بلاک نہیں کر رہا۔",
        "troubleshoot2": "v2rayN کو ایڈمنسٹریٹر کے طور پر چلانے کی کوشش کریں۔",
        "troubleshoot3": "مدد کے لیے Telegram پر @DopplerSupportBot کو پیغام بھیجیں — ہماری AI سپورٹ 24/7 دستیاب ہے۔"
    },
    "mac": {
        "title": "macOS سیٹ اپ",
        "subtitle": "اپنے Mac پر Doppler VPN سیٹ اپ کریں",
        "step1Title": "V2RayXS ڈاؤن لوڈ کریں",
        "step1Desc": "GitHub سے V2RayXS ڈاؤن لوڈ کریں یا Mac App Store سے Streisand انسٹال کریں۔",
        "step1Download": "V2RayXS ڈاؤن لوڈ کریں",
        "step1AppStore": "Mac App Store",
        "step2Title": "VPN کنفیگریشن حاصل کریں",
        "step2Desc": "ہمارا Telegram بوٹ @dopplercreatebot کھولیں، \"Connect VPN\" پر ٹیپ کریں، سرور منتخب کریں اور آپ کو VLESS کنفیگ لنک ملے گا۔",
        "step3Title": "کنفیگ درآمد کریں",
        "step3Desc": "VLESS لنک کاپی کریں۔ V2RayXS کھولیں ← \"Import\" ← \"From clipboard\"۔ یا Streisand میں + دبائیں ← \"Import from clipboard\"۔",
        "step4Title": "جڑیں",
        "step4Desc": "کنیکٹ بٹن پر کلک کریں۔ macOS کے مانگنے پر VPN کنفیگریشن کی اجازت دیں۔ ہو گیا!",
        "troubleshootTitle": "مسائل کا حل",
        "troubleshoot1": "اگر macOS ایپ کو بلاک کرے تو System Preferences > Privacy & Security میں جا کر اجازت دیں۔",
        "troubleshoot2": "اگر کنکشن ٹوٹ جائے تو ایپ دوبارہ شروع کریں۔",
        "troubleshoot3": "مدد کے لیے Telegram پر @DopplerSupportBot کو پیغام بھیجیں — ہماری AI سپورٹ 24/7 دستیاب ہے۔"
    },
    "telegramSection": {
        "title": "Telegram انٹیگریشن",
        "subtitle": "Telegram میں براہ راست اپنا VPN کنفیگ حاصل کریں اور اپنی سبسکرپشن منظم کریں۔",
        "vpnBot": "VPN بوٹ",
        "vpnBotDesc": "VPN کنفیگریشن حاصل کریں، سرورز سے جڑیں اور اپنا اکاؤنٹ منظم کریں۔",
        "supportBot": "سپورٹ بوٹ",
        "supportBotDesc": "23 زبانوں میں 24/7 AI سپورٹ۔ کسی بھی مسئلے کے لیے فوری مدد۔",
        "miniApp": "سبسکرپشن Mini App",
        "miniAppDesc": "ہماری Telegram Mini App کے ذریعے محفوظ Stripe ادائیگیوں سے سبسکرائب کریں اور اپنا پلان منظم کریں۔"
    },
    "backToGuides": "تمام گائیڈز",
    "nextStep": "اگلا",
    "prevStep": "پچھلا"
}

# Now apply all translations + the ones from the first file
# First, load the translations from translate_guides.py (the ones that were written there)
# Actually, let me just include all remaining languages here too

# Load and apply
for lang, guide_data in translations.items():
    filepath = os.path.join(MESSAGES_DIR, f"{lang}.json")
    if not os.path.exists(filepath):
        print(f"SKIP: {filepath} does not exist")
        continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    data["guide"] = guide_data
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write('\n')
    
    print(f"OK: {lang}")

print("Done with batch 2 (tr, vi, sw, tl, ur)")
