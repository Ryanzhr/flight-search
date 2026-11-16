# 值飞 ZhiFei

高性价比机票搜索平台：聚合航司与中外预订平台行情，按**有效成本**（票价 + 时间成本 + 不便成本 − 行李/退改价值）与历史分位排序，而不是只看最低价。

## 能力

- **多源适配层**：Amadeus（真实 API，可选）、携程 / 去哪儿 / 飞猪 / Skyscanner / 航司直销（分钟级样本行情 + 健康探测）
- **分钟级票价**：按分钟桶抖动与落库 `price_ticks`，前端每 60s 自动刷新
- **性价比引擎**：直飞偏好、时薪估值、历史分位、行李与退改、临近机场提示
- **产品界面**：灵活日期条、走势图、渠道状态、价格提醒

## 本地运行

```bash
npm install
env -u DATABASE_URL npm run dev
```

打开 http://127.0.0.1:3000 。

可选：配置 `AMADEUS_CLIENT_ID` / `AMADEUS_CLIENT_SECRET` 后，搜索会叠加 Amadeus test API 实时报价。

```bash
npm test
env -u DATABASE_URL npm run build
```

## 数据

发布环境通过 `cursor-app.json` 申请 Postgres；本地无 `DATABASE_URL` 时自动使用 PGlite + `migrations/`。
