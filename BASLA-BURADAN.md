# FillOut site yedeği

Bu paket sitenin düzenlenebilir HTML, CSS ve JavaScript dosyalarını içerir. Dosyalar `dist` klasöründedir; küçültülmüş bir derleme değil, doğrudan düzenlenen uygulama kaynaklarıdır.

## Başka bir AI ile devam etmek

Bu klasörü yeni AI aracında aç ve şunu söyle:

> FillOut projesinde devam ediyoruz. Önce BASLA-BURADAN.md, README.md ve docs/contracts.md dosyalarını oku. Siteyi dist içinden düzenle. OpenBook ve FillOut iki ayrı koleksiyondur; kontrat adreslerini karıştırma. İngilizce ve Çince çevirilerini birlikte güncelle. Gerçek para harcayan işlemler başlatma. Yapılan değişikliklerden sonra npm test çalıştır. Canlı yayına geçmeden önce hangi barındırma hesabının kullanılacağını kontrol et.

## Bilgisayarda açmak

Node.js 22 veya üzerini kur. Bu klasörde terminal aç:

```sh
npm start
```

Tarayıcıda http://127.0.0.1:8080 aç. Durdurmak için terminalde Ctrl+C kullan. index.html dosyasına çift tıklamak modül yüklemesi nedeniyle yeterli değildir. Ek paket kurulumu gerekmez.

```sh
npm test
```

## Hangi dosya ne işe yarar?

- `dist/app.mjs`: Sayfalar, cüzdan, mint, market, holdings ve devre oluşturma işlemleri.
- `dist/studio.mjs`: Canvas, proje seçimi ve Studio kontrolleri.
- `dist/engine.mjs`: Devre doğrulama, simülasyon ve netlist kodlama.
- `dist/ui.mjs`: Dil seçimi ve ortak yardımcılar.
- `dist/styles.css`: Tasarım ve boyutlar.
- `dist/config.json`: Kullanılan ağ ve iki projenin kontrat adresleri.
- `dist/index.html`: Sayfanın giriş dosyası.
- `hosting-backup/hosting.json`: Mevcut Sites projesinin bağlantı bilgisi.

## Yayın ve domain

Mevcut yayın Sites üzerinde, özel domain fillout.work ve domain yönetimi Namecheap üzerindedir. Bu dosyaları almak hesap erişimi sağlamaz: mevcut siteye yeniden yayınlamak için Sites sahibinin hesabıyla yetki gerekir. Yeni AI Sites bağlantısını destekliyorsa hosting-backup/hosting.json içindeki mevcut proje kimliğini kullanmalıdır; yeni proje oluşturmamalıdır. Sites çalışma kopyasında bu dosya `.openai/hosting.json` konumuna yerleştirilir.

Başka bir statik barındırmaya geçilebilir: `dist` klasörü yayın kökü olarak kullanılır. Yeni sağlayıcının verdiği DNS kayıtları Namecheap'te ayarlanır. Mevcut yayını değiştirmeden önce yeni adreste sayfaları ve cüzdan bağlantısını kontrol et. HTTPS gerekir. Bu pakette otomatik yayın veya GitHub bağlantısı kurulmuş değildir.

## Bu paketin sınırları

Kontratlar blokzincirde kalır; siteyi taşıma işlemi onları silmez veya yeniden dağıtmaz. Bu yedek Solidity kaynaklarını, derleyici ayarlarını veya bağımsız kontrat denetimini içermez. Bunlar eldeki site klasöründe bulunmuyordu. Kontrat değişikliği yapılacaksa Remix'teki gerçek kaynakları ayrıca dışa aktar.

Cüzdan anahtarları, kurtarma kelimeleri, hesap şifreleri ve yayın erişim anahtarları pakete dahil değildir. Bunları AI sohbetine gönderme.

Studio taslakları ve bazı tercihler tarayıcıda saklanır. Önemli devreleri Studio'daki Export draft ile ayrıca indir. Eski site adresinden fillout.work adresine geçmek tarayıcı taslaklarını otomatik taşımaz.

Ana ağ işlemleri gerçek ETH kullanır. Testler yerel simülasyonu doğrular; kontratların bütün işlemlerinin güvenli olduğunu kanıtlamaz.
