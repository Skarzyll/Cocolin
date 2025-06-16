
# Game Hash Collector & Link Comparator

COllector of game names with available hash not associated with RA and COmparator of LINks (not provided).

Thank you **ZFC-Digital**, creators of `puppeteer-real-browser`, who made this project possible.

If possible, please consider sending any amount to help and motivate me to continue bringing updates. Feel free to help the project.

**PayPal account:** <cocolinproject@gmail.com>

---

## Observations

- Does not work with **Homebrews**
- Does not work with **Subsets**
- It is necessary to manually create the file with the links
- The other files will be created automatically
- The name of the file with the links **must be exactly the same** as the one in **storedLinks**

## 🎯 Future Goals

- Transform this project into a interface friendly application for common users.

- Get Homebrews.

---

## 🛠️ Requirements

### Dependencies

```bash
npm i puppeteer
```

```bash
npm i puppeteer-real-browser
```

### Chrome Extension

- **Link Klipper**

### VS Code Extension

- **Live Server**

### Desktop Software

- **JDownloader 2**
- **Google Chrome** (for testing, maybe)

### Recommended System Requirements

- **5G internet connection** (preferably wired)
- **PC with at least 4 strong cores** (so it won’t crash with multiple Chrome windows open)

---

## 📌 How it Works

1. **Setup**:
   - Enter your **username and password**
   - Provide the **direct link** to your Want to Play list **with filters**
   - Configure the `.txt` files
   - Set `true` if they are arcade games
   - `npm run start`

2. **Game Hash Collection**:
   - The script enters the **RA website**
   - Passes the **Captcha**
   - Logs in with your account
   - Enters your **Want to Play** list (using the link you provided)
   - Scans **all games** across all pages
   - Accesses the **Supported Game File** section for each game
   - Collects the **hash name** of each game
   - Outputs to both the **console** and **games.txt**

   If a game has no hash, you’ll see:

   - ⚠️ `Game with no registered hashes, skipping: game link without hash`
   - ⚠️ `No region-valid games found on this page: game link without hash`

3. **Link Comparison**:
   - Compares collected hashes with the links stored in **gamelinks.txt** (which is not provided in this project)
   - Shows in the console:
     - **Percentage of games found**
     - **Which games were not found**

4. **Output**:
   - Inserts the found links into:
     - **LinksforDownload.txt**
     - **index.html**

5. **Download Process**:
   - Open `index.html` using **Live Server**
   - Copy the **running link**
   - Open **JDownloader 2**
   - Go to the **Link Grabber** tab
   - Click **Add New Links**, and paste the link (it will auto-paste if possible)
   - Set your **download folder**
   - Start downloading!

---

✅ That’s it! Happy downloading.
