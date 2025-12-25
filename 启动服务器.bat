@echo off
chcp 65001 >nul
title 人生K线 - 命理分析系统

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                                                            ║
echo ║           🔮 人生K线 - 专业八字命理分析系统                ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

echo [1/2] 正在检查环境...

:: 检查 Node.js 是否安装
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo ❌ 错误: 未检测到 Node.js，请先安装 Node.js
    echo    下载地址: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: 显示 Node 版本
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo    ✓ Node.js 版本: %NODE_VERSION%

:: 检查 node_modules 是否存在
if not exist "node_modules" (
    echo.
    echo [!] 首次运行，正在安装依赖...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
)
echo    ✓ 依赖已就绪

echo.
echo [2/2] 正在启动开发服务器...
echo.
echo ════════════════════════════════════════════════════════════════
echo.
echo    🌐 服务器启动后，请在浏览器中访问:
echo.
echo       http://localhost:5173
echo.
echo    按 Ctrl+C 可停止服务器
echo.
echo ════════════════════════════════════════════════════════════════
echo.

:: 启动 Vite 开发服务器
call npx vite --host

:: 如果服务器停止，暂停以便查看错误
echo.
echo 服务器已停止
pause


