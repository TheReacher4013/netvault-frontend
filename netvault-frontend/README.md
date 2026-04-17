# NetVault Frontend

React + Tailwind CSS frontend for the NetVault Domain & Hosting Management SaaS.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Opens at http://localhost:5173

## .env
```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## Role-Based Themes

| Role       | Color Theme         | Login Background       |
|------------|---------------------|------------------------|
| Super Admin| Verified Black + Bancha Green | Tech/server image |
| Admin      | Kuro Green + Evening Green    | Forest image      |
| Staff      | English Holly + Teal          | Ocean image       |
| Client     | Deep Slate + Summer Moss      | Mountain image    |

## Page Flow

```
Login (role dropdown)
  └── Dashboard
        ├── Domains → DomainDetail → DNSManager
        ├── Hosting → HostingDetail
        ├── Clients → ClientProfile → CredentialVault
        ├── Billing → CreateInvoice / InvoiceDetail
        ├── Reports → RenewalReport / RevenueReport
        ├── Uptime Monitor
        ├── Alert Center
        └── Settings → UserManagement / ProfileSettings

Super Admin only:
  └── Tenants / Plans
```

## Build for Production

```bash
npm run build
# Deploy /dist folder to Vercel
```
