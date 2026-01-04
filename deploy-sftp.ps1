# 使用 WinSCP .NET 程序集进行 SFTP 上传的部署脚本
# 如果没有 WinSCP，则回退到 SCP

$server = "43.173.170.5"
$username = "ubuntu"
$remotePath = "/var/www/lifekline"
$localPath = "dist\*"

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  LifeKline 项目部署脚本" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "服务器: $server" -ForegroundColor White
Write-Host "用户名: $username" -ForegroundColor White
Write-Host "目标路径: $remotePath" -ForegroundColor White
Write-Host ""

# 检查 dist 文件夹
if (-not (Test-Path "dist")) {
    Write-Host "dist 文件夹不存在，请先运行 npm run build" -ForegroundColor Red
    exit 1
}

# 创建临时 batch 脚本使用 scp
$scpPath = "C:\Windows\System32\OpenSSH\scp.exe"
$sshPath = "C:\Windows\System32\OpenSSH\ssh.exe"

if (Test-Path $sshPath) {
    Write-Host "使用 Windows OpenSSH 进行部署..." -ForegroundColor Green
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Yellow
    Write-Host "如未配置 SSH 密钥，将在提示时输入密码（建议改为 SSH Key 免密部署）" -ForegroundColor Magenta
    Write-Host "================================================" -ForegroundColor Yellow
    Write-Host ""
    
    # 首先创建远程目录
    Write-Host "步骤 1/2: 创建远程目录..." -ForegroundColor Cyan
    & $sshPath -o StrictHostKeyChecking=no "${username}@${server}" "sudo mkdir -p $remotePath && sudo chown -R ubuntu:ubuntu $remotePath"
    
    Write-Host ""
    Write-Host "步骤 2/2: 上传文件 (再次输入密码)..." -ForegroundColor Cyan
    & $scpPath -o StrictHostKeyChecking=no -r "dist\*" "${username}@${server}:${remotePath}/"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "=====================================" -ForegroundColor Green
        Write-Host "  部署成功！" -ForegroundColor Green
        Write-Host "  访问地址: http://$server" -ForegroundColor Green
        Write-Host "=====================================" -ForegroundColor Green
    } else {
        Write-Host "部署失败，错误代码: $LASTEXITCODE" -ForegroundColor Red
    }
} else {
    Write-Host "未找到 SSH 客户端，请安装 OpenSSH" -ForegroundColor Red
}

