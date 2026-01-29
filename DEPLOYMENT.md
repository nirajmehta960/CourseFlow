# Deployment Guide: AWS EC2 (Free Tier)

This guide will walk you through deploying the CourseFlow application to the AWS Cloud using Docker and AWS EC2.

We use Amazon EC2 t4g.small (ARM-based) because it is:
1.  Free Tier Eligible (checks apply).
2.  Faster than older generations.
3.  Compatible with Apple Silicon (M1/M2/M3) builds natively.

---

## Prerequisites

1.  AWS Account.
2.  Docker Hub Account.
3.  Docker Desktop installed and running on your computer.

---

## Phase 1: Infrastructure Setup (Once)

### 1. Launch EC2 Instance
1.  Log in to the AWS Console > EC2 > Launch Instance.
2.  Name: "CourseFlow-Production".
3.  OS Image: Ubuntu Server 24.04 LTS (ARM64).
    *   Important: Select "64-bit (Arm)" architecture.
4.  Instance Type: t4g.small.
5.  Key Pair: Create new "courseflow-key", download the .pem file. Keep this file safe!
6.  Network Settings:
    *   Allow SSH traffic from Anywhere (or My IP).
    *   Allow HTTP traffic from the Internet.
7.  Click Launch.

### 2. Configure Firewall (Security Groups)
1.  Go to your Instance summary > Security tab > Click the Security Group.
2.  Click "Edit inbound rules".
3.  Add the following rules:
    *   Type: HTTP | Port: 80 | Source: 0.0.0.0/0 (Allows web traffic).
    *   Type: Custom TCP | Port: 4000 | Source: 0.0.0.0/0 (Allows API calls).
    *   Type: SSH | Port: 22 | Source: 0.0.0.0/0 (Allows you to connect).
4.  Save rules.

### 3. Install Docker on Server
1.  Open your terminal where the .pem key is.
2.  Connect to the server:
    ```bash
    chmod 400 courseflow-key.pem
    ssh -i "courseflow-key.pem" ubuntu@<YOUR_EC2_PUBLIC_IP>
    ```
3.  Run the installation commands:
    ```bash
    # Update and install Docker
    sudo apt-get update
    sudo apt-get install -y docker.io ubuntu-fan
    
    # Enable Docker
    sudo systemctl start docker
    sudo systemctl enable docker
    
    # Add permission to current user
    sudo usermod -aG docker $USER
    
    # Install Docker Compose
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.5/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    
    # EXIT to apply changes
    exit
    ```

---

---

## Phase 2: Deployment

There are two ways to deploy: **Automated (Recommended)** and **Manual**.

### Option A: Automated via GitHub Actions (Recommended)
This is the modern way to deploy. Every time you push to the `main` branch, GitHub will automatically build your images and update your server.

**[Follow the CI/CD Guide (CICD.md)](CICD.md)**

### Option B: Manual Deployment
Use this only if you don't want to set up GitHub Actions.

#### 1. Build & Push Images (Local)
Run these on your computer. Replace `<username>` with your Docker Hub username.
```bash
docker build -t <username>/courseflow-backend:latest ./backend
docker build -t <username>/courseflow-frontend:latest ./frontend
docker push <username>/courseflow-backend:latest
docker push <username>/courseflow-frontend:latest
```

#### 2. Run (Server)
SSH into your server and create a `docker-compose.yml` file. Then run:
```bash
docker-compose up -d
```

---

## Post-Deployment: AWS S3 & Environment
After deploying, ensure your application has the correct environment variables (Database URL, S3 Keys, etc.).

**[Follow the AWS S3 Setup Guide (AWS_S3_SETUP.md)](AWS_S3_SETUP.md)**
