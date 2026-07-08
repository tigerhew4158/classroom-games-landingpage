
# v17 Supabase 订单数据库后台设置说明

这个版本不再依赖 Resend / Gmail SMTP 来保存订单。  
订单会先写入 Supabase 数据库，付款截图上传到 Supabase Storage。  
管理员可以打开 `/admin.html` 查看订单与付款截图。

---

## 一、Supabase 需要做什么

### 1. 建立 Supabase Project

到 Supabase 创建一个新项目。

### 2. 创建订单表

打开 Supabase：

`SQL Editor → New Query`

把项目里的 `supabase_schema.sql` 内容复制进去执行。

### 3. 创建 Storage Bucket

到：

`Storage → New bucket`

建立 bucket：

```text
payment-proofs
```

建议先设为 Public，方便后台直接点击查看付款截图。

---

## 二、Vercel Environment Variables

到 Vercel：

`Project → Settings → Environment Variables`

添加：

```env
SUPABASE_URL=你的 Supabase Project URL
SUPABASE_SERVICE_ROLE_KEY=你的 Supabase service_role key
SUPABASE_STORAGE_BUCKET=payment-proofs
ADMIN_PASSWORD=你自己设置的后台密码
```

### SUPABASE_URL 哪里找？

Supabase：

`Project Settings → API → Project URL`

### SUPABASE_SERVICE_ROLE_KEY 哪里找？

Supabase：

`Project Settings → API → service_role key`

注意：service_role key 是最高权限密钥，只能放在 Vercel Environment Variables，不能放在前端代码或 GitHub。

---

## 三、后台入口

部署后打开：

```text
https://你的域名/admin.html
```

输入你在 Vercel 设置的：

```env
ADMIN_PASSWORD
```

即可查看订单。

---

## 四、购买流程

购买者点击「确认购买」后：

1. 订单资料写入 Supabase `orders` 表
2. 付款截图上传到 Supabase Storage `payment-proofs`
3. 前端显示成功提示
4. 自动打开 WhatsApp，让购买者手动发送订单给阿虎老师

即使电邮失败，订单也已经保存在后台，不会丢单。

---

## 五、Vercel 部署后必须 Redeploy

设置完 Environment Variables 后，必须重新部署：

`Deployments → Redeploy`
