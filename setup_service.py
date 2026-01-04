#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Setup systemd service for persistent deployment
"""
import paramiko
import sys
import io

if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

SERVER = "43.173.170.5"
PORT = 22
USERNAME = "ubuntu"
PASSWORD = "MTc1MjA0NDQ0MQ"
REMOTE_PATH = "/var/www/lifekline"
WEB_PORT = 4173

SERVICE_CONTENT = f"""[Unit]
Description=LifeKline Web Service
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory={REMOTE_PATH}
ExecStart=/usr/bin/serve -s . -l {WEB_PORT}
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
"""

def main():
    print("Setting up persistent service...")
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(SERVER, PORT, USERNAME, PASSWORD, timeout=30)
        print("[OK] Connected!")
        
        # Create service file
        print("Creating systemd service...")
        sftp = ssh.open_sftp()
        with sftp.file("/tmp/lifekline.service", "w") as f:
            f.write(SERVICE_CONTENT)
        sftp.close()
        
        # Install and start service
        commands = [
            "sudo mv /tmp/lifekline.service /etc/systemd/system/lifekline.service",
            "sudo systemctl daemon-reload",
            "pkill -f 'serve.*4173' 2>/dev/null || true",  # Stop nohup process
            "sudo systemctl enable lifekline",
            "sudo systemctl restart lifekline",
        ]
        
        for cmd in commands:
            print(f"Running: {cmd}")
            stdin, stdout, stderr = ssh.exec_command(cmd)
            stdout.read()
        
        import time
        time.sleep(2)
        
        # Check service status
        stdin, stdout, stderr = ssh.exec_command("sudo systemctl status lifekline --no-pager")
        status = stdout.read().decode()
        print(f"\nService status:\n{status}")
        
        print("\n" + "=" * 50)
        print("  SERVICE CONFIGURED!")
        print(f"  URL: http://{SERVER}:{WEB_PORT}")
        print("  Service will auto-start on reboot")
        print("=" * 50)
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        ssh.close()

if __name__ == "__main__":
    main()

