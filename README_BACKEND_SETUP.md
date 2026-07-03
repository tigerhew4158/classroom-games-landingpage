# 自动电邮 + WhatsApp 手动确认发送设置说明（Vercel）

本版本采用低成本方案：

1. 点击「确认购买」后，系统会自动提交到后端 API：

   `POST /api/confirm-purchase`

2. 后端会自动发送电邮：
   - 订单电邮给阿虎老师：`tigerhew@gmail.com`
   - 订单确认电邮给购买者
   - 付款截图会作为附件发送给阿虎老师

3. WhatsApp 不使用 Meta Cloud API 自动发送。
   - 系统会打开 WhatsApp / wa.me 订单讯息
   - 购买者需要手动按 Send / 发送 给阿虎老师：`+60167895429`

这样做不需要 Meta WhatsApp Cloud API Token，也不会产生 WhatsApp Business API 费用。

## 必须设置的 Vercel Environment Variables

在 Vercel Project → Settings → Environment Variables 添加：

```env
RESEND_API_KEY=你的 Resend API Key
FROM_EMAIL=Classroom Games <noreply@你的已验证域名>
ADMIN_EMAIL=tigerhew@gmail.com
```

`FROM_EMAIL` 必须使用 Resend 已验证的域名邮箱。

## 不需要设置的项目

本版本不需要：

```env
WHATSAPP_TOKEN
WHATSAPP_PHONE_NUMBER_ID
WHATSAPP_TO
WHATSAPP_API_VERSION
```

## 部署方式

将本文件夹整体上传到 GitHub / Vercel。Vercel 会自动识别：

`/api/confirm-purchase.js`

为 serverless function。
