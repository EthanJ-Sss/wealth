#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
部署到 4174 端口并配置防火墙
"""
import paramiko
import os
import sys
import io
import time

if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# 服务器配置
SERVER = "43.173.170.5"
PORT = 22
USERNAME = "ubuntu"
PASSWORD = "MTc1MjA0NDQ0MQ"
REMOTE_PATH = "/var/www/lifekline-4174"
LOCAL_DIST = "dist"
WEB_PORT = 4174
SERVICE_NAME = "lifekline-4174"

def upload_directory(sftp, local_path, remote_path):
    for item in os.listdir(local_path):
        local_item = os.path.join(local_path, item)
        remote_item = f"{remote_path}/{item}"
        
        if os.path.isfile(local_item):
            print(f"  Uploading: {item}")
            sftp.put(local_item, remote_item)
        elif os.path.isdir(local_item):
            try:
                sftp.mkdir(remote_item)
            except:
                pass
            upload_directory(sftp, local_item, remote_item)

def main():
    print("=" * 50)
    print("  Deploy to Port 4174")
    print("=" * 50)
    print(f"\nServer: {SERVER}")
    print(f"Target Port: {WEB_PORT}")
    print(f"Remote Path: {REMOTE_PATH}")
    print()
    
    if not os.path.exists(LOCAL_DIST):
        print("Error: dist directory not found!")
        return False
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        print("Connecting to server...")
        ssh.connect(SERVER, PORT, USERNAME, PASSWORD, timeout=30)
        print("[OK] Connected!")
        
        # 准备目录
        print("\nPreparing remote directory...")
        ssh.exec_command(f"sudo mkdir -p {REMOTE_PATH}")
        stdin, stdout, stderr = ssh.exec_command(f"sudo chown -R {USERNAME}:{USERNAME} {REMOTE_PATH}")
        stdout.read()
        print("[OK] Directory ready!")
        
        # 清理旧文件
        print("\nCleaning old files...")
        stdin, stdout, stderr = ssh.exec_command(f"rm -rf {REMOTE_PATH}/*")
        stdout.read()
        print("[OK] Cleaned!")
        
        # 上传文件
        print("\nUploading files...")
        sftp = ssh.open_sftp()
        
        for subdir in ['', 'assets']:
            try:
                sftp.mkdir(f"{REMOTE_PATH}/{subdir}")
            except:
                pass
        
        upload_directory(sftp, LOCAL_DIST, REMOTE_PATH)
        sftp.close()
        print("[OK] Upload complete!")
        
        # 配置防火墙
        print("\nConfiguring firewall...")
        firewall_commands = [
            f"sudo ufw allow {WEB_PORT}/tcp 2>/dev/null || true",
            f"sudo iptables -A INPUT -p tcp --dport {WEB_PORT} -j ACCEPT 2>/dev/null || true",
        ]
        for cmd in firewall_commands:
            stdin, stdout, stderr = ssh.exec_command(cmd)
            stdout.read()
        print("[OK] Firewall configured!")
        
        # 创建 systemd 服务
        print("\nCreating systemd service...")
        service_content = f"""[Unit]
Description=LifeKline Web Service (Port {WEB_PORT})
After=network.target

[Service]
Type=simple
User={USERNAME}
WorkingDirectory={REMOTE_PATH}
ExecStart=/usr/bin/serve -s . -l {WEB_PORT}
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
"""
        sftp = ssh.open_sftp()
        with sftp.file(f"/tmp/{SERVICE_NAME}.service", "w") as f:
            f.write(service_content)
        sftp.close()
        
        # 安装并启动服务
        commands = [
            f"sudo mv /tmp/{SERVICE_NAME}.service /etc/systemd/system/{SERVICE_NAME}.service",
            "sudo systemctl daemon-reload",
            f"pkill -f 'serve.*{WEB_PORT}' 2>/dev/null || true",
            f"sudo systemctl enable {SERVICE_NAME}",
            f"sudo systemctl restart {SERVICE_NAME}",
        ]
        
        for cmd in commands:
            print(f"  Running: {cmd[:50]}...")
            stdin, stdout, stderr = ssh.exec_command(cmd)
            stdout.read()
        
        time.sleep(3)
        
        # 验证服务
        print("\nVerifying service...")
        stdin, stdout, stderr = ssh.exec_command(f"sudo systemctl status {SERVICE_NAME} --no-pager | head -10")
        status = stdout.read().decode()
        print(status)
        
        stdin, stdout, stderr = ssh.exec_command(f"ss -tlnp | grep {WEB_PORT}")
        port_check = stdout.read().decode()
        
        if str(WEB_PORT) in port_check:
            print("[OK] Service is running on port 4174!")
        
        # 测试访问
        print("\nTesting local access...")
        stdin, stdout, stderr = ssh.exec_command(f"curl -s -o /dev/null -w '%{{http_code}}' http://localhost:{WEB_PORT}/")
        curl_result = stdout.read().decode().strip()
        print(f"Local curl test: HTTP {curl_result}")
        
        print("\n" + "=" * 50)
        print("  DEPLOYMENT COMPLETE!")
        print(f"  URL: http://{SERVER}:{WEB_PORT}")
        print("=" * 50)
        return True
            
    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        ssh.close()

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

