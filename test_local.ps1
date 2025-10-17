# 🧪 Script de Testes CDC Fidelidade V2.2 (PowerShell)
# Executa testes básicos no backend local apontando para o banco remoto Locaweb

$env:PORT=3001
$env:HOST="0.0.0.0"
$env:DB_HOST="fidelidadecdc.postgresql.dbaas.com.br"
$env:DB_PORT="5432"
$env:DB_USER="fidelidadecdc"
$env:DB_PASS="CasaDoCigano@2025"
$env:DB_NAME="fidelidadecdc"
$env:DB_SCHEMA="cdc_fidelidade"
$env:DB_SSL="true"
$env:JWT_SECRET="CasaDoCiganoFidelidade2025@jwtSecretKey"
$env:ALLOWED_ORIGINS="http://localhost:5173"

Write-Host "🔄 Iniciando backend localmente..."
cd backend
Start-Process powershell -ArgumentList "npm start" -WindowStyle Minimized
Start-Sleep -Seconds 10

Write-Host "✅ Testando /health..."
Invoke-RestMethod -Uri "http://localhost:3001/health"

Write-Host "🔐 Login como admin..."
$body = @{ username = "admin"; password = "Admin@123" } | ConvertTo-Json
$login = Invoke-RestMethod -Method Post -Uri "http://localhost:3001/api/auth/login" -ContentType "application/json" -Body $body
$token = $login.token
$headers = @{ Authorization = "Bearer $token" }
Write-Host "Token JWT obtido com sucesso."

Write-Host "👥 Listando clientes..."
Invoke-RestMethod -Headers $headers -Uri "http://localhost:3001/api/clients"

Write-Host "➕ Registrando visita..."
$reg = @{ identifier = "00011122233"; store_id = 1 } | ConvertTo-Json
Invoke-RestMethod -Method Post -Headers $headers -Uri "http://localhost:3001/api/visits/register" -ContentType "application/json" -Body $reg

Write-Host "📊 KPIs gerais:"
Invoke-RestMethod -Headers $headers -Uri "http://localhost:3001/api/reports/overview"

Write-Host "💾 Exportando CSV de clientes..."
Invoke-WebRequest -Headers $headers -Uri "http://localhost:3001/api/import-export/clients/export" -OutFile "./clientes.csv"

Write-Host "✅ Testes concluídos com sucesso! Arquivo CSV gerado em backend/clientes.csv"
