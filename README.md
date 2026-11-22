# Moonvalesoft Web

Moonvalesoft'un firma sitesi (`moonvalesoft.com`): ürün tanıtımı, üyelik, ödeme ve müşteri paneli.

- Kurallar ve kararlar: `CLAUDE.md`
- Ekip (Claude agent'ları): `.claude/agents/` — pm, ui-ux, frontend, backend, qa, devops, security
- Tasarım kodları: `design/tokens.json` (Gece ve Gündüz modu)
- Tasarım tuvali: https://claude.ai/artifact/1SscxbqpGfU3zmStL96iVL

## Yerel deneme (Docker gerekmez)

```bash
npm install
npm run demo
```

Site http://localhost:3000, API http://localhost:4000. Veritabanı `.demo/` klasöründe gömülü PostgreSQL ile açılır. E-postalar (doğrulama bağlantısı dahil) terminale yazılır. Ödeme sahte sağlayıcıyla yapılır; `/test-odeme` sayfasında "Ödemeyi başarılı say" düğmesine basarsın. Randevu'ya yalnız denemede kullanılan bir fiyat verilir (`DEMO_PLAN_PRICES` ile değişir). Sıfırlamak için `.demo` klasörünü sil.
