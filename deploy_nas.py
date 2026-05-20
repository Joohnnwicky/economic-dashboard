"""
NAS Deployment Script - Deploy economic dashboard to NAS via SSH
使用打包上传方式提高效率
"""
import paramiko
import os
import sys
import tarfile
import io
from pathlib import Path

# SSH Configuration
SSH_HOST = "192.168.31.153"
SSH_PORT = 10000
SSH_USER = "15233616788"
SSH_PASSWORD = "&*ETubd4"

# Deployment Configuration
REMOTE_DIR = "/tmp/economic-dashboard"
LOCAL_DIR = r"J:\经济指标看板"

# Files to exclude
EXCLUDE_DIRS = {'node_modules', '.git', 'dist', '.planning', 'coverage', 'test', '.idea', '.vscode'}
EXCLUDE_FILES = {'*.log', '*.test.ts', '*.spec.ts', '.env*', '.DS_Store'}

def create_ssh_client():
    """Create SSH client connection"""
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print(f"Connecting to {SSH_HOST}:{SSH_PORT}...")
    client.connect(SSH_HOST, port=SSH_PORT, username=SSH_USER, password=SSH_PASSWORD, timeout=30)
    return client

def run_sudo_command(client, command):
    """Run sudo command with password"""
    # 使用echo密码 | sudo -S 方式
    full_command = f"echo '{SSH_PASSWORD}' | sudo -S {command} 2>/dev/null"
    stdin, stdout, stderr = client.exec_command(full_command)
    return stdout.read().decode(), stderr.read().decode()

def run_command(client, command):
    """Run regular command"""
    stdin, stdout, stderr = client.exec_command(command)
    return stdout.read().decode(), stderr.read().decode()

def create_tarball(local_dir):
    """Create tar.gz archive excluding unnecessary files"""
    tar_buffer = io.BytesIO()
    local_path = Path(local_dir)

    with tarfile.open(fileobj=tar_buffer, mode='w:gz') as tar:
        for root, dirs, files in os.walk(local_dir):
            # Filter out excluded directories
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]

            for file in files:
                file_path = Path(root) / file
                # Skip excluded files
                if any(file_path.match(pattern) for pattern in EXCLUDE_FILES):
                    continue

                # Add to tarball
                arcname = str(file_path.relative_to(local_path))
                tar.add(str(file_path), arcname=arcname)
                print(f"  Added: {arcname}")

    tar_buffer.seek(0)
    return tar_buffer

def upload_and_extract(client, tar_buffer, remote_dir):
    """Upload tarball and extract on remote"""
    sftp = client.open_sftp()

    # Create remote directory
    try:
        run_sudo_command(client, f"mkdir -p {remote_dir}")
        run_sudo_command(client, f"chmod 777 {remote_dir}")
    except Exception as e:
        print(f"  Warning: {e}")

    # Upload tarball
    remote_tar = f"{remote_dir}.tar.gz"
    print(f"\n  Uploading tarball to {remote_tar}...")
    sftp.putfo(tar_buffer, remote_tar)
    print("  Upload completed!")
    sftp.close()

    # Extract tarball
    print(f"\n  Extracting...")
    output, error = run_sudo_command(client, f"tar -xzf {remote_tar} -C {remote_dir}")
    if error:
        print(f"  Extract errors: {error}")

    # Cleanup tarball
    run_sudo_command(client, f"rm {remote_tar}")

def deploy():
    """Main deployment function"""
    print("=" * 60)
    print("  NAS Deployment - Economic Dashboard")
    print("=" * 60)

    try:
        # Connect to NAS
        print("\n[1] Connecting to NAS via SSH...")
        client = create_ssh_client()
        print("  Connected!")

        # Check Docker
        print("\n[2] Checking Docker installation...")
        output, error = run_sudo_command(client, "docker --version")
        print(f"  Docker: {output.strip() if output else 'Not found'}")

        output, error = run_sudo_command(client, "docker compose version")
        print(f"  Docker Compose: {output.strip() if output else 'Checking docker-compose...'}")
        if not output:
            output, error = run_sudo_command(client, "docker-compose --version")
            print(f"  Docker Compose: {output.strip() if output else 'Not found'}")

        # Create tarball
        print("\n[3] Creating deployment package...")
        tar_buffer = create_tarball(LOCAL_DIR)
        print(f"  Package size: {tar_buffer.getbuffer().nbytes / 1024:.1f} KB")

        # Upload and extract
        print("\n[4] Uploading to NAS...")
        upload_and_extract(client, tar_buffer, REMOTE_DIR)

        # Build Docker containers
        print("\n[5] Building Docker containers...")
        output, error = run_sudo_command(client, f"cd {REMOTE_DIR} && docker compose build --no-cache")
        if output:
            print(output)
        if error and "error" in error.lower():
            print(f"  Build error: {error}")

        # Start containers
        print("\n[6] Starting containers...")
        output, error = run_sudo_command(client, f"cd {REMOTE_DIR} && docker compose up -d")
        print(output if output else "  Containers started!")

        # Check status
        print("\n[7] Container status...")
        output, error = run_sudo_command(client, f"cd {REMOTE_DIR} && docker compose ps")
        print(output)

        client.close()

        print("\n" + "=" * 60)
        print("  Deployment Completed!")
        print(f"  Local access: http://192.168.31.153:9000")
        print("=" * 60)

        return True

    except Exception as e:
        print(f"\n  Error: {e}")
        return False

if __name__ == "__main__":
    success = deploy()
    sys.exit(0 if success else 1)