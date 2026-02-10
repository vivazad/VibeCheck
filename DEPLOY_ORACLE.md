# Deploying on Oracle Cloud (Always Free Tier)

Oracle Cloud Infrastructure (OCI) offers one of the most generous free tiers available, known as "Always Free".

## ✅ What You Get (Free Forever)
1.  **2x AMD Compute VMs** (1/8 OCPU, 1GB RAM) - *Okay for small apps.*
2.  **ARM Ampere A1 Compute** (Up to **4 OCPUs**, **24 GB RAM**) - **🔥 HIGHLY RECOMMENDED**. This is powerful enough for production workloads.
3.  **200 GB Block Storage**.
4.  **10 GB Object Storage** (S3 compatible backups).

## 🚀 Step 1: Create an Account & Instance

1.  **Sign Up**: Go to [oracle.com/cloud/free](https://www.oracle.com/cloud/free/).
    *   *Note: Verification can be strict. Use a valid credit card (no charge) and real details.*
2.  **Create VM Instance**:
    *   Dashboard -> **Create a VM instance**.
    *   **Image**: Ubuntu 22.04 or 24.04 (Minimal or Regular).
    *   **Shape**: Select **Ampere** (VM.Standard.A1.Flex).
        *   Set OCPUs to 2 or 4.
        *   Set RAM to 12GB or 24GB.
    *   **Networking**: Create new VCN (Virtual Cloud Network). **Ensure "Assign a public IPv4 address" is checked.**
    *   **SSH Keys**: **Save the Private Key** (`.key` file). You will need this to login!
3.  **Click Create**. Wait for it to turn "Running" (green).

## 🛡️ Step 2: Open Ports (Firewall)

By default, Oracle blocks port 80/443.

1.  Click on your **Instance** name.
2.  Click on the **Subnet** link (under Primary VNIC).
3.  Click on the **Security List** (e.g., `Default Security List for...`).
4.  **Add Ingress Rules**:
    *   Source CIDR: `0.0.0.0/0`
    *   IP Protocol: GCP (Wait, no used TCP) -> TCP
    *   Destination Port Range: `80, 443`
    *   Description: `Allow HTTP/HTTPS`
5.  Click **Add Ingress Rules**.

*Note: You also need to open ports on the Ubuntu firewall (iptables) itself. Our setup script handles some of this, but you might need to run:*
```bash
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

## 📦 Step 3: Deploy VibeCheck

Now that you have a running VPS, follow our **VPS Deployment Guide**.

1.  **Login**:
    ```bash
    # Move key to safe place
    chmod 400 ssh-key-2024-xx-xx.key
    ssh -i ssh-key-2024-xx-xx.key ubuntu@<YOUR_INSTANCE_PUBLIC_IP>
    ```

2.  **Run Setup**:
    Refer to `DEPLOY_VPS.md` in this repository for the exact commands to transfer files and start the app.
    
    *Summary of commands:*
    ```bash
    # On your LOCAL machine:
    scp -i path/to/key.key -r . ubuntu@<IP>:~/vibecheck
    
    # On ORACLE machine:
    cd ~/vibecheck
    sudo ./setup-vps.sh
    ```

## ⚠️ Important Note on ARM (M1/M2 chips & Oracle Ampere)
If you chose the **Ampere (ARM)** instance, everything should work fine because:
*   `node:20-alpine` supports ARM64.
*   `mongo:7` supports ARM64.
*   `nginx:alpine` supports ARM64.

Docker will automatically pull the correct image architecture for the Oracle server.
