# Production HTTPS Setup Guide (Ubuntu 24.04)

This guide explains how to set up **Nginx** on your EC2 host as a reverse proxy with **Let's Encrypt (Certbot)** for automatic SSL.

## 1. Install Nginx and Certbot

Run these commands on your EC2 instance:
```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx -y
```

## 2. Configure Host Nginx

Create a new configuration file for CourseFlow:
```bash
sudo nano /etc/nginx/sites-available/courseflow
```

Paste the following configuration (replace `YOUR_DOMAIN` with your actual domain):
```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN;

    # Backend API proxy
    location /api/ {
        proxy_pass http://localhost:4000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend SPA proxy
    location / {
        proxy_pass http://localhost:80/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/courseflow /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 3. Obtain SSL Certificate

Run Certbot to generate the certificate and automatically update the Nginx config:
```bash
sudo certbot --nginx -d YOUR_DOMAIN
```
*Follow the prompts to provide an email and agree to terms. Choose **Redirect** when asked.*

## 4. Verification

1. **Auto-renewal**: Test the renewal process with `sudo certbot renew --dry-run`.
2. **Security Groups**: Ensure your EC2 Security Group allows **HTTPS (443)** inbound from everywhere.
3. **Internal Only**: Now that Host Nginx is the entry point, you can technically stop exposing port 80 from Docker to the host if you change the proxy target to the container IP, but for simplicity, we keep Docker on `localhost:80`.

## Why this approach?
- **Isolation**: Docker handles the application logic; Host Nginx handles the networking/SSL.
- **Auto-renewal**: Certbot on the host is the most reliable way to manage Let's Encrypt on Ubuntu.
- **Standardization**: This is the industry-standard way to deploy Dockerized apps on a single VPS.
