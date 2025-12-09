# How To: Set Up the Web App Script

## Step 1 — Create a New Apps Script Project
Open Google Apps Script and click the **New project** button.

![Step 1 – Create New Apps Script Project](YOUR_IMAGE_URL_HERE)

## Step 2 — Copy and Paste the Script Code
Before pasting anything, **delete any pre-generated code** inside the default `Code.gs` file.

Then copy and paste the full script from **UtilityAppScript.js** (included in this GitHub project).

![Step 2 – Copy/Paste Script Code](YOUR_IMAGE_URL_HERE)

### Step 2.1 — Obtain Your Root Folder ID and Apply It
1. Open Google Drive and navigate to the folder you want to use.
2. Open the folder and copy the long ID from the URL.
3. Insert it into this line of your script:

```
var ROOT_FOLDER_ID = "YOUR_ROOT_FOLDER_ID";
```

## Step 3 — Create a New Deployment
Click the **Deploy** button in the top-right corner and select **New deployment**.

![Step 3 – New Deployment](YOUR_IMAGE_URL_HERE)

## Step 4 — Select “Web App”
In the deployment window, click **Select type**, then choose **Web app**.

![Step 4 – Select Web App](YOUR_IMAGE_URL_HERE)

## Step 5 — Configure Deployment Settings and Deploy
Adjust the deployment fields as needed, then click **Deploy**.

![Step 5 – Configure Deployment](YOUR_IMAGE_URL_HERE)

## Step 6 — Copy the Web App URL and Update HTML
Copy the **Web app URL**, then replace the placeholder in `UtilityApp.html`:

```
const WEB_APP_URL = "YOUR_WEB_APP_URL";
```

![Step 6 – Copy Web App URL](YOUR_IMAGE_URL_HERE)


# How To: Use the App

## Step 1 — Upload the Reference CSV File
Upload the reference CSV file (**Sample Data.csv**) included in this GitHub project.

![Step 1 – Upload Reference CSV](YOUR_IMAGE_URL_HERE)

## Step 2 — Enter or Scan Your Input Value
You may type a value and press **Enter**, or scan a barcode to auto-submit.

![Step 2 – Enter or Scan Value](YOUR_IMAGE_URL_HERE)

## Step 3 — Successful Lookup Result
A successful scan displays item details pulled from **Sample Data.csv**.

*Each submission plays an audio cue — one sound for success and a different sound for failure.*

![Step 3 – Successful Lookup Result](YOUR_IMAGE_URL_HERE)

## Step 4 — New Successful Scan With Visual Highlight
A new valid scan updates the total and changes the banner color for quick visual confirmation.

![Step 4 – Color Change Success](YOUR_IMAGE_URL_HERE)

## Step 5 — Invalid Scan Result
If a value is not found, an **Item Not Found** message appears in red. Existing totals remain unchanged.

![Step 5 – Invalid Result](YOUR_IMAGE_URL_HERE)
