# AWS S3 Setup Guide

Follow these steps to create an S3 bucket and get the necessary credentials for CourseFlow.

## Step 1: Create an S3 Bucket

1.  **Log in** to the [AWS Management Console](https://console.aws.amazon.com/).
2.  Navigate to the **S3** service.
3.  Click **Create bucket**.
4.  **Bucket name**: Enter a globally unique name (e.g., `courseflow-uploads-yourname`).
    *   *Note this name, you will need it for the `.env` file.*
5.  **Region**: Choose a region (e.g., `us-east-1` N. Virginia).
    *   *Note this region, you will need it for the `.env` file.*
6.  **Object Ownership**: Keep "ACLs disabled" (recommended).
7.  **Block Public Access settings for this bucket**:
    *   **Uncheck** "Block all public access".
    *   Check the warning acknowledgment box.
    *   *Why?* The current application displays images directly via URL. For a production app, we would use private buckets with CloudFront or Presigned URLs, but for this setup, public read access is the simplest method.
8.  Click **Create bucket**.

### Add Bucket Policy (for Public Read Access)
1.  Click on your newly created bucket name.
2.  Go to the **Permissions** tab.
3.  Scroll down to **Bucket policy** and click **Edit**.
4.  Paste the following JSON (replace `YOUR_BUCKET_NAME` with your actual bucket name):
    ```json
    {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "PublicReadGetObject",
                "Effect": "Allow",
                "Principal": "*",
                "Action": "s3:GetObject",
                "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/uploads/*"
            }
        ]
    }
    ```
5.  Click **Save changes**.

## Step 2: Create IAM User (Get Credentials)

1.  Navigate to the **IAM** service in AWS Console.
2.  Click **Users** in the sidebar -> **Create user**.
3.  **User name**: Enter `courseflow-backend-user`.
4.  Click **Next**.
5.  **Permissions options**: Select **Attach policies directly**.
6.  Search for `AmazonS3FullAccess` (or create a stricter policy just for your bucket) and check the box.
7.  Click **Next** -> **Create user**.

### Generate Access Keys
1.  Click on the newly created user (`courseflow-backend-user`).
2.  Go to the **Security credentials** tab.
3.  Scroll down to **Access keys**.
4.  Click **Create access key**.
5.  Select **Local code** (or "Application running outside AWS").
6.  Check the confirmation box and click **Next**.
7.  Click **Create access key**.
8.  **Important**: Copy the **Access key** and **Secret access key**.
    *   *You will not be able to see the Secret key again!*

## Step 4: Update Environment Variables

### Local Development
Open the `backend/.env` file in your project and update the following values:

```env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your_bucket_name
```

### Production (AWS EC2)
If you are using the **CI/CD pipeline**, you must update the `.env` file on your server:
1. SSH into your server.
2. Navigate to `~/CourseFlow/backend`.
3. Edit the file: `nano .env`.
4. Paste your production S3 credentials and save.
5. Restart the app: `docker-compose restart backend`.
