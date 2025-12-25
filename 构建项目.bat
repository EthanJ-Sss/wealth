@echo off
chcp 65001 >nul
title 人生K线 - 构建生产版本

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                                                            ║
echo ║           🔮 人生K线 - 构建生产版本                        ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

:: 检查 node_modules 是否存在
if not exist "node_modules" (
    echo [!] 正在安装依赖...
    call npm install
)

echo [1/2] 正在构建生产版本...
call npm run build

if %errorlevel% neq 0 (
    echo.
    echo ❌ 构建失败
    pause
    exit /b 1
)

echo.
echo ════════════════════════════════════════════════════════════════
echo.
echo    ✅ 构建完成！
echo.
echo    生产文件位于 dist 目录
echo.
echo    您可以将 dist 目录部署到任意静态服务器
echo.
echo ════════════════════════════════════════════════════════════════
echo.

echo [2/2] 是否预览构建结果？
set /p preview="输入 Y 预览，其他键退出: "

if /i "%preview%"=="Y" (
    echo.
    echo 正在启动预览服务器...
    echo 访问: http://localhost:4173
    echo.
    call npm run preview
)

pause


