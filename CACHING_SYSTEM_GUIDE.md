# SQLite Database Caching System - User Guide

## Overview

The Excel-zzTakeoff-Connector now includes a high-performance caching system that makes subsequent Excel file loads **10-100x faster**.

**Performance Comparison:**

| Load Type | Time | Operations |
|-----------|------|------------|
| **First Load (Cache Miss)** | 2-5 seconds | Full Excel parse + SQLite creation |
| **Subsequent Load (Cache Hit)** | 50-200ms ⚡ | SQLite metadata load only |

---

## How It Works

### First Load (Cache Miss)

When you open an Excel file for the first time:

```
1. ⏱️ Read entire Excel file from disk (using SheetJS)
2. ⏱️ Extract units from data
3. ⏱️ Extract columns from data
4. ⏱️ Update preferences (discovered units/columns)
5. ⏱️ Run smart column matching
6. ⏱️ Create SQLite database
7. ✅ Save database to cache directory
8. 📊 Display in AG Grid

Total Time: 2-5 seconds (depending on file size)
```

**Console Output:**
```
[Excel Handler] Reading file: C:\...\MyFile.xlsx
[Excel Handler] ❌ CACHE MISS - Full Excel load required
[Excel Processor] File processed successfully: 1500 total rows
[ExcelDB] Creating new database: C:\Users\...\excel-cache\xlx-abc123.db
[Excel Handler] SQLite database ready: 3 sheets
```

### Subsequent Loads (Cache Hit)

When you reopen the same Excel file (from Recents or by browsing):

```
1. ✅ Check cache validity (file modification time)
2. ✅ Load metadata from SQLite database only
3. 📊 Display in AG Grid

Total Time: 50-200ms ⚡ 10-100x FASTER!

SKIPPED OPERATIONS:
❌ Excel file parsing
❌ Unit extraction
❌ Column extraction
❌ Preferences modification
❌ Smart column matching
```

**Console Output:**
```
[Excel Handler] Reading file: C:\...\MyFile.xlsx
[ExcelDB] Cache HIT: Valid cache found for C:\...\MyFile.xlsx
[Excel Handler] ✅ CACHE HIT - Using cached database
[ExcelDB] Loaded existing database from cache: C:\Users\...\excel-cache\xlx-abc123.db
[Excel Handler] Cache load complete: 3 sheets
```

**Frontend Console:**
```
✅ CACHE HIT: File loaded from cache in <200ms
```

---

## Cache Location

The SQLite database files are stored in your user data directory:

**Windows:**
```
C:\Users\{YourUsername}\AppData\Roaming\excel-zztakeoff-connector\excel-cache\
```

**Example Cache Files:**
```
excel-cache\
  ├── xlx-a1b2c3d4e5f6789.db  (MyProject.xlsx)
  ├── xlx-9z8y7x6w5v4u321.db  (Budget2024.xlsx)
  └── xlx-fedcba987654321.db  (Estimates.xlsx)
```

Each Excel file gets its own database file, named using an MD5 hash of the file path.

---

## Cache Validation

The cache is automatically invalidated and rebuilt when:

### 1. Excel File Modified
If you edit the Excel file externally (e.g., in Microsoft Excel) and save it, the modification time changes:

```
[ExcelDB] Cache invalid: Excel file modified since cache created
[ExcelDB]   Excel mtime: 2025-11-09 15:30:00
[ExcelDB]   DB mtime:    2025-11-09 14:20:00
[Excel Handler] ❌ CACHE MISS - Full Excel load required
```

The cache will be rebuilt with the new data.

### 2. Excel File Moved/Renamed
If you move or rename the Excel file, the file path changes, so a new cache entry is created:

```
Old: C:\Projects\Budget.xlsx  → Cache: xlx-abc123.db
New: C:\Archive\Budget.xlsx   → Cache: xlx-xyz789.db (new cache created)
```

The old cache remains until manually cleaned up.

### 3. Database Corruption
If the SQLite database becomes corrupted, it's automatically rebuilt:

```
[ExcelDB] Cache invalid: Database integrity check failed
[Excel Handler] ❌ CACHE MISS - Full Excel load required
```

### 4. Database File Deleted
If you manually delete the cache file, it's recreated on next load:

```
[ExcelDB] Cache miss: Database does not exist for C:\...\MyFile.xlsx
[Excel Handler] ❌ CACHE MISS - Full Excel load required
```

---

## Testing the Caching System

### Test 1: First Load (Cache Miss)

1. Open a new Excel file (never opened before in the app)
2. Check console output:
   - Should see: `❌ CACHE MISS - Full Excel load required`
   - Should see: `Creating new database`
   - Load time: 2-5 seconds

3. Check cache directory:
   ```bash
   dir "C:\Users\{YourUsername}\AppData\Roaming\excel-zztakeoff-connector\excel-cache"
   ```
   - Should see a new `.db` file created

### Test 2: Subsequent Load (Cache Hit)

1. Close the file in the app
2. Reopen the same file (from Recent Files or by browsing)
3. Check console output:
   - Should see: `✅ CACHE HIT - Using cached database`
   - Should see: `Loaded existing database from cache`
   - Load time: 50-200ms ⚡ (much faster!)

4. Frontend console should show:
   ```
   ✅ CACHE HIT: File loaded from cache in <200ms
   ```

### Test 3: Cache Invalidation (File Modified)

1. Open an Excel file (should be cache hit if already loaded before)
2. Close the app
3. Edit the Excel file in Microsoft Excel:
   - Add a new row
   - Modify some data
   - Save and close Excel
4. Reopen the file in the app
5. Check console output:
   - Should see: `❌ CACHE MISS - Full Excel load required`
   - Should see: `Cache invalid: Excel file modified since cache created`
   - Cache automatically rebuilt with new data

### Test 4: Multiple Files

1. Open File A → Cache miss (first time)
2. Open File B → Cache miss (first time)
3. Reopen File A → Cache hit ✅
4. Reopen File B → Cache hit ✅

Both files should have their own cache entries.

### Test 5: App Restart Persistence

1. Open an Excel file → Cache miss (first time)
2. Close the file
3. **Close the entire app**
4. **Restart the app**
5. Reopen the same file → Should still be cache hit ✅

Cache survives app restarts!

---

## Cache Management

### View Cache Size

Check how much disk space the cache is using:

**Windows:**
```bash
cd "C:\Users\{YourUsername}\AppData\Roaming\excel-zztakeoff-connector\excel-cache"
dir
```

### Clear Cache Manually

To clear all cached databases:

**Windows:**
```bash
rd /s /q "C:\Users\{YourUsername}\AppData\Roaming\excel-zztakeoff-connector\excel-cache"
```

The cache directory will be automatically recreated on next file load.

### Clear Cache for Single File

To clear cache for just one Excel file:

1. Find the cache file in the cache directory
2. Delete the specific `.db` file
3. On next load of that file, cache will be rebuilt

---

## Benefits

### Performance
- **10-100x faster subsequent loads** (2-5 sec → 50-200ms)
- Reduced memory usage (no Excel file in memory on cache hits)
- Faster Recent Files workflow

### Preferences
- **No preferences modification on cache hits**
- Discovered units/columns not cleared and rebuilt
- Smart column matching not re-run
- Cleaner preferences management

### User Experience
- Near-instant file reopening
- Better workflow for frequently accessed files
- Visual feedback (loading messages show cache status)

---

## Troubleshooting

### Issue: File always shows "CACHE MISS"

**Possible Causes:**
1. Excel file is being modified between loads
2. Cache directory doesn't have write permissions
3. Cache files are being deleted by antivirus/cleanup tools

**Solution:**
- Check file modification time isn't changing
- Verify cache directory exists and is writable
- Add cache directory to antivirus exclusions

### Issue: Cache directory not created

**Cause:** Permissions issue with userData directory

**Solution:**
- Check app has write permissions to:
  ```
  C:\Users\{YourUsername}\AppData\Roaming\excel-zztakeoff-connector\
  ```
- Try running app as administrator once to create directory

### Issue: "Database integrity check failed"

**Cause:** Corrupted SQLite database file

**Solution:**
- Cache will automatically rebuild
- If issue persists, manually delete the cache file
- Check disk for errors (chkdsk)

### Issue: Slow loads even with cache hit

**Possible Causes:**
1. Large file with many rows (>50,000)
2. Slow disk (HDD instead of SSD)
3. Antivirus scanning database files

**Solution:**
- Expected: Cache hits are 50-200ms, not instant
- Move to SSD if using HDD
- Add cache directory to antivirus exclusions

---

## Advanced: Cache File Format

The SQLite database file contains:

### Tables
One table per Excel sheet:
```sql
CREATE TABLE sheet_{SheetName} (
  _id INTEGER PRIMARY KEY AUTOINCREMENT,
  _rowHash TEXT,
  _rowIndex INTEGER,
  _zzType TEXT,
  _markupPercent TEXT,
  {ExcelColumn1} TEXT,
  {ExcelColumn2} TEXT,
  ...
)
```

### Indexes
Index on `_rowHash` for fast lookups:
```sql
CREATE INDEX idx_sheet_{SheetName}_rowHash ON sheet_{SheetName}(_rowHash)
```

### Verification
You can inspect the cache database with any SQLite browser:
```bash
# Install SQLite command-line tool
sqlite3 "xlx-abc123.db"

# List tables
.tables

# View sheet structure
.schema sheet_Sheet1

# Count rows
SELECT COUNT(*) FROM sheet_Sheet1;
```

---

## Future Enhancements (Planned)

### Phase 1: ✅ COMPLETE
- [x] Persistent database storage
- [x] Cache validation (modification time)
- [x] Cache hit/miss detection
- [x] Skip preferences on cache hit

### Phase 2: Planned
- [ ] Cache cleanup on app startup (delete old caches)
- [ ] User preference for cache size limit
- [ ] UI to view/clear cache
- [ ] Cache statistics in About dialog

### Phase 3: Advanced
- [ ] Incremental updates (only changed rows)
- [ ] Database compression
- [ ] Background cache warming
- [ ] Cache preloading for recent files

---

## Summary

The caching system provides:

✅ **10-100x faster** subsequent loads
✅ **Persistent across app restarts**
✅ **Automatic cache invalidation** when files change
✅ **No preferences modification** on cache hits
✅ **Better user experience** for frequently accessed files

**First Load:** 2-5 seconds (full Excel parse)
**Subsequent Loads:** 50-200ms ⚡ (cache only)

The cache is stored in:
```
C:\Users\{YourUsername}\AppData\Roaming\excel-zztakeoff-connector\excel-cache\
```

---

**Date:** 2025-11-09
**Version:** 1.0
**Status:** Production Ready
