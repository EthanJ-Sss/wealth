# 部署脚本 - 将项目上传到服务器
# 服务器信息
$server = "43.173.170.5"
$username = "ubuntu"
$remotePath = "/var/www/lifekline"

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  LifeKline 项目部署脚本" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# 检查 dist 文件夹是否存在
if (-not (Test-Path "dist")) {
    Write-Host "未找到 dist 文件夹，正在构建项目..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "构建失败！" -ForegroundColor Red
        exit 1
    }
}

Write-Host "开始部署到服务器 $server ..." -ForegroundColor Green

# 使用 scp 上传文件 (需要用户输入密码)
Write-Host ""
Write-Host "正在上传文件..." -ForegroundColor Yellow
Write-Host "如未配置 SSH 密钥，将在提示时输入密码（建议改为 SSH Key 免密部署）" -ForegroundColor Magenta
Write-Host ""

# 首先在服务器上创建目录
ssh -o StrictHostKeyChecking=no "${username}@${server}" "sudo mkdir -p $remotePath && sudo chown -R ubuntu:ubuntu $remotePath"

# 上传 dist 文件夹内容
scp -o StrictHostKeyChecking=no -r dist/* "${username}@${server}:${remotePath}/"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host "  部署成功！" -ForegroundColor Green
    Write-Host "  访问地址: http://$server" -ForegroundColor Green
    Write-Host "=====================================" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "部署失败，请检查网络连接和服务器配置" -ForegroundColor Red
}

