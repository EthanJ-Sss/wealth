@echo off
chcp 65001 >nul
echo =========================================
echo   人生K线 - 后端服务启动
echo =========================================
echo.

cd /d "%~dp0server"

:: 检查是否安装了依赖
if not exist "node_modules" (
    echo [1/4] 正在安装依赖...
    call npm install
    echo.
)

:: 检查是否生成了 Prisma Client
if not exist "node_modules\.prisma" (
    echo [2/4] 正在生成 Prisma Client...
    call npm run db:generate
    echo.
)

:: 检查数据库是否存在
if not exist "prisma\dev.db" (
    echo [3/4] 正在初始化数据库...
    call npm run db:push
    echo.
    
    echo [3.5/4] 正在生成测试账号...
    call npm run accounts:generate -- --count=10 --uses=3
    echo.
)

echo [4/4] 正在启动服务...
echo.
echo =========================================
echo   服务地址: http://localhost:3001
echo   健康检查: http://localhost:3001/health
echo =========================================
echo.

call npm run dev

pause
