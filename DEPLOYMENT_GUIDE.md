# Google Cloud Deployment Guide

This guide covers deploying the VWAT chatbot to Google Cloud using three different services.

## Prerequisites

1. **Google Cloud Account**: Sign up at https://cloud.google.com
2. **Install Google Cloud SDK**: Download from https://cloud.google.com/sdk/docs/install
3. **Verify Installation**:
   ```powershell
   gcloud --version
   ```

## Initial Setup

### 1. Authenticate with Google Cloud
```powershell
gcloud auth login
```

### 2. Create a New Project (or use existing)
```powershell
# Create project
gcloud projects create vwat-chatbot --name="VWAT Chatbot"

# Set as active project
gcloud config set project vwat-chatbot

# Enable billing (required for deployment)
# Go to: https://console.cloud.google.com/billing
```

### 3. Enable Required APIs
```powershell
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable appengine.googleapis.com
```

## Deployment Options

You have three options for deploying to Google Cloud:

---

## Option 1: Google Cloud Run (Recommended for Containers)

**Pros**: Serverless, scales to zero, pay-per-use, supports Docker
**Cons**: Stateless (Qdrant data needs persistent storage)

### Steps:

1. **Build and Submit Docker Image**
   ```powershell
   cd C:\Data\AIG\Project\RAG\chatbot_VWAT
   
   gcloud builds submit --tag gcr.io/vwat-chatbot/chatbot-app
   ```

2. **Deploy to Cloud Run**
   ```powershell
   gcloud run deploy vwat-chatbot `
     --image gcr.io/vwat-chatbot/chatbot-app `
     --platform managed `
     --region us-central1 `
     --allow-unauthenticated `
     --memory 2Gi `
     --cpu 2 `
     --timeout 300
   ```

3. **Access Your App**
   - Cloud Run will provide a URL like: `https://vwat-chatbot-xxxxx.run.app`

### Important Notes for Cloud Run:
- **Persistent Storage**: Qdrant data will be lost on restart. Consider:
  - Using Google Cloud Storage for vector database
  - Switching to Qdrant Cloud (managed service)
  - Re-indexing on startup (slower but works)

---

## Option 2: Google App Engine (Recommended for Flask Apps)

**Pros**: Managed platform, good for Flask, automatic scaling
**Cons**: More expensive, always running (min 1 instance)

### Steps:

1. **Initialize App Engine**
   ```powershell
   gcloud app create --region=us-central
   ```

2. **Deploy Application**
   ```powershell
   cd C:\Data\AIG\Project\RAG\chatbot_VWAT
   
   gcloud app deploy app.yaml
   ```

3. **Access Your App**
   ```powershell
   gcloud app browse
   ```
   - URL will be: `https://vwat-chatbot.uc.r.appspot.com`

### Monitoring and Logs:
```powershell
# View logs
gcloud app logs tail -s default

# Open dashboard
gcloud app open-console
```

---

## Option 3: Google Compute Engine (Full VM Control)

**Pros**: Full control, persistent storage, can run Qdrant locally
**Cons**: More expensive, requires manual management

### Steps:

1. **Create VM Instance**
   ```powershell
   gcloud compute instances create vwat-chatbot-vm `
     --zone=us-central1-a `
     --machine-type=e2-medium `
     --image-family=ubuntu-2004-lts `
     --image-project=ubuntu-os-cloud `
     --boot-disk-size=20GB `
     --tags=http-server,https-server
   ```

2. **Configure Firewall**
   ```powershell
   gcloud compute firewall-rules create allow-flask `
     --allow tcp:8080 `
     --target-tags=http-server
   ```

3. **SSH into VM**
   ```powershell
   gcloud compute ssh vwat-chatbot-vm --zone=us-central1-a
   ```

4. **Setup Application on VM**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Python 3.11
   sudo apt install -y python3.11 python3.11-venv python3-pip git
   
   # Clone or upload your code
   git clone https://github.com/your-repo/chatbot_VWAT.git
   # OR use gcloud compute scp to upload files
   
   cd chatbot_VWAT
   
   # Create virtual environment
   python3.11 -m venv venv
   source venv/bin/activate
   
   # Install dependencies
   pip install -r requirements_rag.txt
   
   # Initialize RAG system
   python rag_system.py
   
   # Run app with gunicorn
   gunicorn -w 4 -b 0.0.0.0:8080 app:app
   ```

5. **Setup as System Service** (for auto-restart)
   ```bash
   sudo nano /etc/systemd/system/vwat-chatbot.service
   ```
   
   Add:
   ```ini
   [Unit]
   Description=VWAT Chatbot Service
   After=network.target

   [Service]
   User=your-username
   WorkingDirectory=/home/your-username/chatbot_VWAT
   ExecStart=/home/your-username/chatbot_VWAT/venv/bin/gunicorn -w 4 -b 0.0.0.0:8080 app:app
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```
   
   Enable service:
   ```bash
   sudo systemctl enable vwat-chatbot
   sudo systemctl start vwat-chatbot
   sudo systemctl status vwat-chatbot
   ```

6. **Get External IP**
   ```powershell
   gcloud compute instances list
   ```
   Access at: `http://EXTERNAL_IP:8080`

---

## Recommended Approach

For your application, I recommend **Option 2 (App Engine)** because:

1. ✅ Native Flask support
2. ✅ Managed infrastructure (no server management)
3. ✅ Automatic scaling
4. ✅ Built-in load balancing
5. ✅ HTTPS by default
6. ✅ Easy deployment and updates

**However**, you need to address the Qdrant persistence issue:

### Solution A: Use Qdrant Cloud (Recommended)
1. Sign up at https://cloud.qdrant.io
2. Create a cluster
3. Update `rag_system.py` to use remote Qdrant:
   ```python
   client = QdrantClient(
       url="https://your-cluster.qdrant.io",
       api_key="your-api-key"
   )
   ```

### Solution B: Re-index on Startup
- Keep current local Qdrant setup
- App will re-index documents on each startup (~30 seconds)
- Acceptable for small datasets (<1000 documents)

### Solution C: Use Google Cloud Storage
- Store Qdrant data in GCS bucket
- Mount bucket to App Engine (complex setup)

---

## Post-Deployment Tasks

### 1. Setup Custom Domain (Optional)
```powershell
# For App Engine
gcloud app domain-mappings create chat.vwat.org --certificate-management=AUTOMATIC
```

### 2. Monitor Application
```powershell
# View logs
gcloud app logs tail

# View metrics
gcloud app open-console
```

### 3. Set Environment Variables
```powershell
gcloud app deploy --set-env-vars DEBUG=False,HOST=0.0.0.0
```

### 4. Update Application
```powershell
# Make changes, then redeploy
gcloud app deploy app.yaml
```

---

## Cost Estimation

### App Engine (Option 2 - Recommended)
- **F4_1G instance**: ~$0.15/hour
- **1 instance running 24/7**: ~$110/month
- **With auto-scaling (1-10 instances)**: $110-$1,100/month depending on traffic

### Cloud Run (Option 1)
- **Free tier**: 2 million requests/month
- **After free tier**: ~$0.00002 per request
- **Cost for 100K requests/month**: ~$2/month
- **BUT**: Need Qdrant Cloud (~$25-50/month)

### Compute Engine (Option 3)
- **e2-medium VM**: ~$25/month (24/7)
- **Persistent disk**: ~$2/month (20GB)
- **Total**: ~$27/month

---

## Troubleshooting

### Issue: Build Fails (Large Docker Image)
**Solution**: Reduce image size or use `.dockerignore` (already created)

### Issue: Out of Memory
**Solution**: Increase instance size in `app.yaml`:
```yaml
instance_class: F4  # 512MB → 1GB
```

### Issue: Qdrant Lock Error
**Solution**: Already fixed with `use_reloader=False` in app.py

### Issue: Cold Start (First Request Slow)
**Solution**: Keep min_instances=1 in `app.yaml` to prevent cold starts

---

## Quick Deploy (App Engine)

If you're ready to deploy right now:

```powershell
# Navigate to project
cd C:\Data\AIG\Project\RAG\chatbot_VWAT

# Authenticate
gcloud auth login

# Set project (create if needed)
gcloud config set project vwat-chatbot

# Enable required APIs
gcloud services enable appengine.googleapis.com

# Create App Engine app (first time only)
gcloud app create --region=us-central

# Deploy
gcloud app deploy app.yaml

# Open in browser
gcloud app browse
```

---

## Security Recommendations

1. **Add Authentication**: Not everyone should access the admin features
2. **Use HTTPS**: App Engine provides this by default
3. **Rate Limiting**: Protect against abuse
4. **Environment Variables**: Store sensitive data (API keys) securely:
   ```powershell
   gcloud app deploy --set-env-vars API_KEY=your-secret-key
   ```

---

## Support

- Google Cloud Documentation: https://cloud.google.com/docs
- App Engine Python: https://cloud.google.com/appengine/docs/standard/python3
- Cloud Run: https://cloud.google.com/run/docs
- Qdrant Cloud: https://qdrant.tech/documentation/cloud/

---

## Next Steps

1. Choose deployment option (recommend App Engine)
2. Setup Google Cloud project and billing
3. Deploy using commands above
4. Test the deployed application
5. Setup custom domain (optional)
6. Monitor performance and costs
