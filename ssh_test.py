"""
Quick NAS SSH connection test
"""
import sys
try:
    import paramiko

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    # Try different passwords
    passwords = ['Qq123456', 'admin', 'synology']

    for pwd in passwords:
        try:
            print(f"Trying password: {pwd}")
            ssh.connect('192.168.31.153', port=10000, username='admin', password=pwd, timeout=10)
            print(f"SUCCESS with password: {pwd}")

            # Run commands
            stdin, stdout, stderr = ssh.exec_command('cd /volume1/docker/economic-dashboard && docker compose ps')
            print("=== Docker Status ===")
            print(stdout.read().decode())

            stdin, stdout, stderr = ssh.exec_command('cd /volume1/docker/economic-dashboard && docker compose logs --tail=30 backend')
            print("=== Backend Logs ===")
            print(stdout.read().decode())

            ssh.close()
            sys.exit(0)
        except Exception as e:
            print(f"Failed with {pwd}: {e}")
            continue

    print("All passwords failed")
    sys.exit(1)

except ImportError:
    print("paramiko not installed. Run: pip install paramiko")
    sys.exit(1)