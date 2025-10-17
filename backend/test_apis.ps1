<# 
CDC Fidelidade — Teste de APIs (PowerShell)
- Cobra login por username/senha
- Cria cliente (com email opcional)
- Lista clientes
- Registra visitas (N vezes)
- Tenta resgatar brinde
- Consulta KPIs e séries
- Exporta CSVs

MODO DE USO:
1) Abra PowerShell na pasta do projeto (ou qualquer pasta).
2) Execute: .\test_apis.ps1
3) Para apontar para LOCAL, edite $BASE para http://localhost:3001
#>

# ====== CONFIGURAÇÃO ======
# Backend base URL (Render ou local)
$BASE = "https://fidelidade-backend.onrender.com"   # PROD/Render
# $BASE = "http://localhost:3001"                   # DEV/Local

# Credenciais ADMIN (username login)
$ADMIN_USER = "admin"
$ADMIN_PASS = "Admin@123"

# Dados de teste para cliente/visitas
$TEST_NAME  = "Cliente Teste API"
$TEST_CPF   = "00011122233"  # use um que exista ou será criado
$TEST_PHONE = "11999990000"
$TEST_EMAIL = "teste.api@exemplo.com"  # opcional; apenas dado
$STORE_ID   = 1                        # ajuste conforme sua loja (ou deixe vazio para null)

# Número de visitas para tentar atingir a meta
$VISITS_TO_REGISTER = 5

# ====== FUNÇÕES AUXILIARES ======
function Call-Json {
    param([string]$Method, [string]$Url, [hashtable]$Headers, $BodyObj)

    if ($BodyObj -ne $null) {
        $json = $BodyObj | ConvertTo-Json -Depth 8
        return Invoke-RestMethod -Method $Method -Uri $Url -ContentType "application/json" -Headers $Headers -Body $json
    } else {
        return Invoke-RestMethod -Method $Method -Uri $Url -Headers $Headers
    }
}

function Print-Section { param([string]$Title) Write-Host "`n==== $Title ====" -ForegroundColor Cyan }

# ====== TESTE /health ======
Print-Section "Health Check"
$health = Invoke-RestMethod -Uri "$BASE/health"
$health | ConvertTo-Json -Depth 5 | Write-Host

# ====== LOGIN ======
Print-Section "Login (username)"
$loginBody = @{ username = $ADMIN_USER; password = $ADMIN_PASS }
$login = Call-Json -Method "POST" -Url "$BASE/api/auth/login" -Headers @{} -BodyObj $loginBody
$TOKEN   = $login.token
$HEADERS = @{ Authorization = "Bearer $TOKEN" }
Write-Host "OK: Token obtido." -ForegroundColor Green

# ====== /auth/me ======
Print-Section "Sessão atual (/auth/me)"
Call-Json -Method "GET" -Url "$BASE/api/auth/me" -Headers $HEADERS -BodyObj $null | ConvertTo-Json -Depth 5 | Write-Host

# ====== CRIAR CLIENTE ======
Print-Section "Criar cliente (/api/clients)"
$clientBody = @{
    name     = $TEST_NAME
    cpf      = $TEST_CPF
    phone    = $TEST_PHONE
    email    = $TEST_EMAIL  # opcional
    store_id = $STORE_ID
}
$created = Call-Json -Method "POST" -Url "$BASE/api/clients" -Headers $HEADERS -BodyObj $clientBody
$CLIENT_ID = $created.id
if (-not $CLIENT_ID) {
    Write-Host "Obs: Cliente pode já existir; vamos listar e procurar pelo CPF..." -ForegroundColor Yellow
    $found = Call-Json -Method "GET" -Url "$BASE/api/clients?q=$TEST_CPF" -Headers $HEADERS -BodyObj $null
    if ($found.Count -gt 0) { $CLIENT_ID = $found[0].id }
}
Write-Host "CLIENT_ID = $CLIENT_ID"

# ====== LISTAR CLIENTES (busca) ======
Print-Section "Listar clientes (q=nome/CPF/telefone/email)"
Call-Json -Method "GET" -Url "$BASE/api/clients?q=$TEST_NAME" -Headers $HEADERS -BodyObj $null | ConvertTo-Json -Depth 5 | Write-Host

# ====== REGISTRAR VISITAS ======
Print-Section "Registrar visitas (/api/visits/register)"
for ($i=1; $i -le $VISITS_TO_REGISTER; $i++) {
    $visitBody = @{ identifier = $TEST_CPF }
    if ($STORE_ID) { $visitBody.store_id = [int]$STORE_ID }
    try {
        $resp = Call-Json -Method "POST" -Url "$BASE/api/visits/register" -Headers $HEADERS -BodyObj $visitBody
        $msg = "Visita #$i → visits_since_last=${0} achieved=${1}" -f $resp.visits_since_last, $resp.achieved
        Write-Host $msg
    } catch {
        Write-Host "Falha ao registrar visita #$i: $($_.Exception.Message)" -ForegroundColor Red
        break
    }
}

# ====== KPIs ======
Print-Section "KPIs (/api/reports/overview)"
Call-Json -Method "GET" -Url "$BASE/api/reports/overview" -Headers $HEADERS -BodyObj $null | ConvertTo-Json -Depth 5 | Write-Host

# ====== VISITAS POR DIA ======
Print-Section "Visitas por dia (/api/reports/visits_by_day)"
Call-Json -Method "GET" -Url "$BASE/api/reports/visits_by_day" -Headers $HEADERS -BodyObj $null | ConvertTo-Json -Depth 5 | Write-Host

# ====== TENTAR RESGATE ======
Print-Section "Resgatar brinde (/api/redemptions/redeem)"
try {
    $redeemBody = @{ client_id = [int]$CLIENT_ID }
    if ($STORE_ID) { $redeemBody.store_id = [int]$STORE_ID }
    $redeem = Call-Json -Method "POST" -Url "$BASE/api/redemptions/redeem" -Headers $HEADERS -BodyObj $redeemBody
    "Resgate OK: " + ($redeem | ConvertTo-Json -Depth 5) | Write-Host
} catch {
    Write-Host "Resgate falhou (provável meta não atingida): $($_.Exception.Message)" -ForegroundColor Yellow
}

# ====== LISTAR RESGATES ======
Print-Section "Listar resgates (/api/redemptions)"
Call-Json -Method "GET" -Url "$BASE/api/redemptions" -Headers $HEADERS -BodyObj $null | ConvertTo-Json -Depth 5 | Write-Host

# ====== EXPORTS ======
Print-Section "Exportar CSVs"
$dl = Join-Path (Get-Location) "exports"
New-Item -ItemType Directory -Force -Path $dl | Out-Null

Invoke-WebRequest -Headers $HEADERS -Uri "$BASE/api/import-export/clients/export" -OutFile (Join-Path $dl "clientes.csv")
Invoke-WebRequest -Headers $HEADERS -Uri "$BASE/api/visits/export"               -OutFile (Join-Path $dl "visits.csv")
Invoke-WebRequest -Headers $HEADERS -Uri "$BASE/api/redemptions/export"          -OutFile (Join-Path $dl "redemptions.csv")
Write-Host "CSVs salvos em: $dl" -ForegroundColor Green

Print-Section "Concluído ✅"
