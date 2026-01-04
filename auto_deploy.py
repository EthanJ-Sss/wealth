#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Auto Deploy Script - SSH/SFTP with paramiko
"""
import paramiko
import os
import sys
from pathlib import Path

# Fix Windows console encoding
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# Server config
SERVER = "43.173.170.5"
PORT = 22
USERNAME = "ubuntu"
PASSWORD = "MTc1MjA0NDQ0MQ"
REMOTE_PATH = "/var/www/lifekline"
LOCAL_DIST = "dist"
WEB_PORT = 4173

def upload_directory(sftp, local_path, remote_path):
    """Recursively upload directory"""
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
    print("  LifeKline Auto Deploy")
    print("=" * 50)
    print(f"\nServer: {SERVER}")
    print(f"Target Port: {WEB_PORT}")
    print(f"Remote Path: {REMOTE_PATH}")
    print()
    
    if not os.path.exists(LOCAL_DIST):
        print("Error: dist directory not found")
        return False
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        print("Connecting to server...")
        ssh.connect(SERVER, PORT, USERNAME, PASSWORD, timeout=30)
        print("[OK] Connected!")
        
        print("\nPreparing remote directory...")
        ssh.exec_command(f"sudo mkdir -p {REMOTE_PATH}")
        ssh.exec_command(f"sudo chown -R ubuntu:ubuntu {REMOTE_PATH}")
        print("[OK] Directory ready!")
        
        print("\nCleaning old files...")
        stdin, stdout, stderr = ssh.exec_command(f"rm -rf {REMOTE_PATH}/*")
        stdout.read()
        print("[OK] Cleaned!")
        
        print("\nUploading files...")
        sftp = ssh.open_sftp()
        
        try:
            sftp.mkdir(REMOTE_PATH)
        except:
            pass
        
        try:
            sftp.mkdir(f"{REMOTE_PATH}/assets")
        except:
            pass
        
        upload_directory(sftp, LOCAL_DIST, REMOTE_PATH)
        sftp.close()
        print("[OK] Upload complete!")
        
        print("\nStopping old services...")
        ssh.exec_command("pkill -f 'python.*http.server.*4173' 2>/dev/null || true")
        ssh.exec_command("pkill -f 'serve.*4173' 2>/dev/null || true")
        import time
        time.sleep(2)
        
        print("\nConfiguring port 4173 service...")
        
        # Check if serve is installed
        stdin, stdout, stderr = ssh.exec_command("which serve")
        serve_path = stdout.read().decode().strip()
        
        if serve_path:
            print("Starting service with 'serve'...")
            cmd = f"cd {REMOTE_PATH} && nohup serve -s . -l {WEB_PORT} > /tmp/serve.log 2>&1 &"
            ssh.exec_command(cmd)
            time.sleep(3)
        else:
            print("Installing 'serve'...")
            stdin, stdout, stderr = ssh.exec_command("sudo npm install -g serve 2>&1")
            install_output = stdout.read().decode()
            print(f"Install output: {install_output[:200]}...")
            
            stdin, stdout, stderr = ssh.exec_command("which serve")
            if stdout.read().decode().strip():
                print("Starting service with 'serve'...")
                cmd = f"cd {REMOTE_PATH} && nohup serve -s . -l {WEB_PORT} > /tmp/serve.log 2>&1 &"
                ssh.exec_command(cmd)
                time.sleep(3)
            else:
                print("Using Python http.server as fallback...")
                cmd = f"cd {REMOTE_PATH} && nohup python3 -m http.server {WEB_PORT} > /tmp/httpserver.log 2>&1 &"
                ssh.exec_command(cmd)
                time.sleep(3)
        
        print("\nVerifying service...")
        stdin, stdout, stderr = ssh.exec_command(f"ss -tlnp | grep {WEB_PORT}")
        result = stdout.read().decode()
        print(f"Port check result: {result}")
        
        if str(WEB_PORT) in result:
            print("\n[OK] Service is running!")
        else:
            # Try curl to check
            stdin, stdout, stderr = ssh.exec_command(f"curl -s -o /dev/null -w '%{{http_code}}' http://localhost:{WEB_PORT}/ 2>/dev/null || echo 'failed'")
            curl_result = stdout.read().decode().strip()
            print(f"Curl check: {curl_result}")
        
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
