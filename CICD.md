# CourseFlow CI/CD Guide

This guide explains how to set up the Continuous Integration and Deployment (CI/CD) pipeline for CourseFlow using GitHub Actions.

## Overview

The pipeline performs the following steps automatically whenever code is pushed to the `main` branch:
1.  **Builds** the Docker images for Backend and Frontend.
2.  **Pushes** the images to the GitHub Container Registry (GHCR).
3.  **Connects** to your AWS EC2 instance via SSH.
4.  **Pulls** the new images and **restarts** the containers.

## Prerequisites

1.  **AWS EC2 Instance**: Running Ubuntu or Amazon Linux, with Docker and Docker Compose installed.
2.  **GitHub Repository**: This code must be pushed to a GitHub repository.

## Setup Instructions

### 1. Server Setup (EC2)

Ensure your EC2 instance is ready.
1.  SSH into your server.
2.  Make sure you have a `docker-compose.yml` file on your server (usually in `~/app` or similar). The pipeline expects to run docker-compose commands in a specific directory.
3.  **App Configuration (.env)**: Your backend requires an `.env` file for secrets.
    *   The deployment script creates an empty `backend/.env` file if it doesn't exist.
    *   **IMPORTANT**: You should manually SSH into the server and add your production secrets (DB URL, API keys, etc.) to `~/CourseFlow/backend/.env`.
4.  *Note: The pipeline provided assumes the app runs from the home directory `~/CourseFlow`. You may need to adjust the `deploy.yml` if your path is different.*

### 2. GitHub Secrets

You need to add the following secrets to your GitHub Repository to allow it to access your server.

Go to **Settings** > **Secrets and variables** > **Actions** > **New repository secret**.

| Secret Name | Description | Example Value |
| :--- | :--- | :--- |
| `EC2_HOST` | The Public IP address or DNS of your EC2 instance. | `54.123.45.67` |
| `EC2_USER` | The username to log in with. | `ubuntu` or `ec2-user` |
| `EC2_KEY` | The **private key** (.pem content) used to SSH into the server. | `-----BEGIN RSA PRIVATE KEY----- ...` |

### 3. GitHub Container Registry (GHCR) Access

The pipeline uses the standard `GITHUB_TOKEN` to publish packages. You generally don't need to configure anything here, but ensure your repository settings allow **Read and Write permissions** for workflows.
*   Go to **Settings** > **Actions** > **General** > **Workflow permissions**.
*   Select **Read and write permissions**.

## Deploying

Once the secrets are set up:
1.  Push a change to the `main` branch.
2.  Go to the **Actions** tab in your GitHub repository.
3.  You will see a workflow run named "Deploy to EC2".
4.  Click on it to monitor the progress.

## Troubleshooting

*   **ssh: no key found**: This means GitHub could not find your `EC2_KEY` secret. Double check that the secret is named exactly `EC2_KEY` and contains the full text of your private key.
*   **Permission Denied (publickey)**: Check that `EC2_KEY` is pasted correctly without extra newlines, and that it is the correct key for `EC2_USER` on `EC2_HOST`.
*   **Docker login failed**: Ensure you have enabled "Read and write permissions" in the repository settings.

## Common Issues and Solutions

### 1. "ssh: no key found" or Handshake Failure
If the deployment fails during the "Deploy to EC2" step with an error like `ssh: no key found` or `handshake failed`:
*   **Check Secret Name**: Ensure you named the secret exactly `EC2_KEY` (case-sensitive) in GitHub.
*   **Verify Key Content**: Open your `.pem` file (e.g., `courseflow-key.pem`) and copy the **entire** content, including the start and end lines:
    ```
    -----BEGIN RSA PRIVATE KEY-----
    ... (the key content) ...
    -----END RSA PRIVATE KEY-----
    ```
*   **Correct Secret Type**: Ensure you added it under **Settings > Secrets and variables > Actions > Secrets** (NOT Variables).

### 2. "Permission denied (publickey)"
*   **Check User**: Ensure `EC2_USER` is correct for your OS (usually `ubuntu` for Ubuntu, `ec2-user` for Amazon Linux).
*   **Check Security Group**: Ensure your EC2 instance allows inbound traffic on port 22 (SSH) from all IPs or at least from GitHub Actions IP ranges.

### 3. "env file ... not found"
*   **Fix**: This issue is now handled automatically by the script (it creates an empty file if missing). However, your app will still need the correct secrets inside `~/CourseFlow/backend/.env` to function correctly.

### 4. Docker Login Failed
*   **Workflow Permissions**: Ensure you enabled **Read and write permissions** under **Settings > Actions > General > Workflow permissions**.
