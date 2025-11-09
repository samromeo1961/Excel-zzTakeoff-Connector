# Excel File Loading Flow Analysis

## Current Implementation Review

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│ USER ACTION: Open Excel File (First Time or from Recents)          │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 1. IPC Handler: readExcelFile()                                    │
│    Location: src/ipc-handlers/excel.js:23                          │
├─────────────────────────────────────────────────────────────────────┤
│ • Validate file path (SECURITY)                                    │
│ • Check file size ≤ 50 MB (SECURITY)                              │
│ • Call Excel processor to read file                                │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 2. Excel Processor: readExcelFile()                                │
│    Location: src/excel/processor.js:48                             │
├─────────────────────────────────────────────────────────────────────┤
│ • Read Excel file using SheetJS                                    │
│ • Parse all sheets into JSON                                       │
│ • Generate _rowHash for each row (SHA-256)                        │
│ • Check total rows ≤ 100,000 (SECURITY)                           │
│ • Return sheets with data in memory                                │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 3. Extract Units from Data                                         │
│    Location: src/ipc-handlers/excel.js:42-69                       │
├─────────────────────────────────────────────────────────────────────┤
│ • Get column mappings from preferences                             │
│ • Extract unique units from first sheet                            │
│ • Get combined unit mappings (file-specific + global)              │
│ • ⚠️ CLEAR ALL discovered units (line 62)                          │
│ • Add unmapped units to discovered list                            │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 4. Extract Columns from Data                                       │
│    Location: src/ipc-handlers/excel.js:81-98                       │
├─────────────────────────────────────────────────────────────────────┤
│ • Extract unique column names from first sheet                     │
│ • ⚠️ CLEAR ALL discovered columns (line 92)                        │
│ • Add new columns to discovered list                               │
│ • Apply smart matching to auto-map columns                         │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 5. Load Data into SQLite                                           │
│    Location: src/ipc-handlers/excel.js:104-106                     │
│    Function: excelDB.loadExcelToDatabase()                         │
├─────────────────────────────────────────────────────────────────────┤
│ • Get or create database instance                                  │
│   - Database path: os.tmpdir()/xlx-{MD5_hash}.db                  │
│   - If exists in temp, load it                                     │
│   - If not exists, create new database                             │
│                                                                     │
│ • ⚠️ DROP ALL existing tables (line 196)                           │
│ • Create tables for each sheet                                     │
│ • Insert all row data with BEGIN TRANSACTION                       │
│ • Create indexes on _rowHash column                                │
│ • ✅ Save database to disk (temp directory)                        │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 6. Return Metadata to Frontend                                     │
│    Location: src/ipc-handlers/excel.js:108-129                     │
├─────────────────────────────────────────────────────────────────────┤
│ • Return sheet metadata (not full data)                            │
│ • Return discovered units and columns                              │
│ • Frontend receives and displays in AG Grid                        │
└─────────────────────────────────────────────────────────────────────┘

                    ⏱️ USER WORKS WITH FILE ⏱️

┌─────────────────────────────────────────────────────────────────────┐
│ USER ACTION: Close File (or Close App)                             │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 7. Close Database                                                  │
│    Location: src/database/excel-db.js:83                           │
│    Function: closeDatabase()                                       │
├─────────────────────────────────────────────────────────────────────┤
│ • Close database connection                                        │
│ • ❌ DELETE TEMPORARY DATABASE FILE (line 92-94)                   │
│ • Remove from active databases map                                 │
└─────────────────────────────────────────────────────────────────────┘

                    ⏱️ USER RE-OPENS SAME FILE ⏱️

┌─────────────────────────────────────────────────────────────────────┐
│ 8. Load from Recents                                               │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
              🔄 ENTIRE PROCESS REPEATS FROM STEP 1 🔄
```

---

## Critical Issues Identified

### ❌ Issue #1: SQLite Database is NOT Persisted
**Location:** `src/database/excel-db.js:83-98`

```javascript
function closeDatabase(excelFilePath) {
  if (activeDatabases.has(excelFilePath)) {
    const { db, dbPath } = activeDatabases.get(excelFilePath);

    db.close();
    activeDatabases.delete(excelFilePath);

    // ❌ DELETE TEMPORARY DATABASE FILE
    try {
      if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);  // ← Database deleted on close!
      }
    } catch (err) {
      console.error('[ExcelDB] Error deleting database files:', err);
    }
  }
}
```

**Impact:**
- SQLite database is created fresh on every file open
- All the work of converting Excel → SQLite is thrown away
- No performance benefit for subsequent loads
- Defeats the purpose of using SQLite for "persistence"

**Current Database Location:**
```javascript
function getDbPath(excelFilePath) {
  const fileHash = crypto.createHash('md5').update(excelFilePath).digest('hex');
  return path.join(os.tmpdir(), `xlx-${fileHash}.db`);
  // Example: C:\Users\User\AppData\Local\Temp\xlx-a1b2c3d4e5f6.db
}
```

---

### ❌ Issue #2: Preferences Touched on Every Load
**Location:** `src/ipc-handlers/excel.js:62, 92`

```javascript
// EVERY TIME file is opened:

// Line 62: Clear ALL discovered units
clearDiscoveredUnits();
if (uniqueUnits.length > 0) {
  const mappedUnits = new Set(unitMappings.map(m => m.unit));
  const unmappedUnits = uniqueUnits.filter(unit => !mappedUnits.has(unit));
  if (unmappedUnits.length > 0) {
    addDiscoveredUnits(unmappedUnits);  // ← Modifies preferences
  }
}

// Line 92: Clear ALL discovered columns
clearDiscoveredColumns();
if (uniqueColumns.length > 0) {
  addDiscoveredColumns(uniqueColumns);  // ← Modifies preferences
  applySmartMatching(uniqueColumns);    // ← Modifies preferences
}
```

**Impact:**
- Preferences modified on every file open
- "Discovered" units/columns list is cleared and rebuilt
- Smart matching runs every time (potentially remapping columns)
- No differentiation between first load and subsequent loads

---

### ❌ Issue #3: Full Excel Read on Every Load
**Location:** `src/excel/processor.js:48`

```javascript
async function readExcelFile(filePath) {
  // ❌ ALWAYS reads entire Excel file from disk
  const workbook = XLSX.readFile(filePath, {
    cellDates: true,
    cellNF: false,
    cellText: false
  });

  // Parse all sheets, all rows, generate all hashes
  // Even if SQLite database already exists!
}
```

**Impact:**
- No check if SQLite database already exists and is up-to-date
- Entire Excel file parsed from scratch every time
- All row hashes regenerated
- Slow for large files (even under 50 MB limit)

---

### ❌ Issue #4: SQLite Database Recreated Even When It Exists
**Location:** `src/database/excel-db.js:188-198`

```javascript
async function loadExcelToDatabase(excelFilePath, sheets) {
  const { db } = await getDatabase(excelFilePath);

  // ❌ DROP ALL EXISTING TABLES (even if database was cached)
  const existingTablesResult = db.exec("SELECT name FROM sqlite_master...");
  if (existingTablesResult.length > 0 && existingTablesResult[0].values) {
    existingTablesResult[0].values.forEach(row => {
      const tableName = row[0];
      db.run(`DROP TABLE IF EXISTS ${tableName}`);  // ← Drops cached data!
    });
  }

  // Then recreates all tables and inserts all data
}
```

**Impact:**
- Even when SQLite database exists in temp directory, all data is dropped
- All data re-inserted from Excel parse
- No benefit from caching

---

## What SHOULD Happen for Optimal Performance

### Desired Flow for Subsequent Loads

```
┌─────────────────────────────────────────────────────────────────────┐
│ USER ACTION: Load from Recents (Same File, 2nd+ Time)              │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 1. Check if SQLite Database Exists and is Valid                    │
├─────────────────────────────────────────────────────────────────────┤
│ • Check: Does xlx-{hash}.db exist in permanent storage?           │
│ • Check: Is Excel file modified date ≤ SQLite creation date?      │
│ • Check: Is SQLite database version compatible?                    │
└────────────────┬───────────────────────────┬────────────────────────┘
                 │ YES (Cache Hit)           │ NO (Cache Miss)
                 ▼                           ▼
    ┌────────────────────────┐    ┌──────────────────────────┐
    │ 2a. Use Cached SQLite  │    │ 2b. Full Excel Load      │
    ├────────────────────────┤    ├──────────────────────────┤
    │ • Load database        │    │ • Read Excel file        │
    │ • Get sheet metadata   │    │ • Extract units/columns  │
    │ • ✅ SKIP preferences   │    │ • Update preferences     │
    │ • ✅ SKIP Excel parse   │    │ • Create SQLite database │
    │ • Return in <100ms     │    │ • Save to permanent path │
    └────────────────────────┘    └──────────────────────────┘
```

### Required Changes

#### 1. **Persistent Database Storage**
```javascript
// CHANGE FROM:
function getDbPath(excelFilePath) {
  const fileHash = crypto.createHash('md5').update(excelFilePath).digest('hex');
  return path.join(os.tmpdir(), `xlx-${fileHash}.db`);
}

// CHANGE TO:
function getDbPath(excelFilePath) {
  const fileHash = crypto.createHash('md5').update(excelFilePath).digest('hex');
  // Store in userData directory (persists across app restarts)
  return path.join(app.getPath('userData'), 'excel-cache', `xlx-${fileHash}.db`);
}
```

#### 2. **Cache Validation Logic**
```javascript
async function isCacheValid(excelFilePath, dbPath) {
  // Check if database exists
  if (!fs.existsSync(dbPath)) {
    return false;
  }

  // Check if Excel file is newer than database
  const excelStats = fs.statSync(excelFilePath);
  const dbStats = fs.statSync(dbPath);

  if (excelStats.mtime > dbStats.mtime) {
    return false; // Excel file modified, cache invalid
  }

  // Additional checks:
  // - Database integrity check
  // - Schema version check

  return true;
}
```

#### 3. **Smart Load Logic**
```javascript
async function readExcelFile(event, filePath) {
  const validatedPath = validateFilePath(filePath, { mustExist: true });

  // Check if SQLite cache exists and is valid
  const dbPath = excelDB.getDbPath(validatedPath);
  const cacheValid = await excelDB.isCacheValid(validatedPath, dbPath);

  if (cacheValid) {
    // ✅ CACHE HIT - Load from SQLite only
    console.log('[Excel Handler] Cache hit, using SQLite database');

    const dbInfo = await excelDB.loadFromCache(validatedPath);

    // ✅ SKIP unit/column discovery (already done on first load)
    // ✅ SKIP preferences modification
    // ✅ SKIP Excel parsing

    return {
      success: true,
      filePath: validatedPath,
      sheets: dbInfo.sheets,
      cached: true  // Flag to indicate this was cached
    };
  } else {
    // ❌ CACHE MISS - Full load required
    console.log('[Excel Handler] Cache miss, full load required');

    // ... existing full load logic ...
  }
}
```

#### 4. **Don't Delete Database on Close**
```javascript
function closeDatabase(excelFilePath) {
  if (activeDatabases.has(excelFilePath)) {
    const { db, dbPath } = activeDatabases.get(excelFilePath);

    db.close();
    activeDatabases.delete(excelFilePath);

    // ✅ KEEP DATABASE FILE FOR CACHE
    // ❌ NO DELETE
    // try {
    //   if (fs.existsSync(dbPath)) {
    //     fs.unlinkSync(dbPath);  // ← REMOVE THIS
    //   }
    // } catch (err) {
    //   console.error('[ExcelDB] Error deleting database files:', err);
    // }

    console.log('[ExcelDB] Database closed but cached at:', dbPath);
  }
}
```

#### 5. **Cache Management**
```javascript
// Add cache cleanup utility
async function cleanOldCaches(maxAgeDays = 30) {
  const cacheDir = path.join(app.getPath('userData'), 'excel-cache');
  const files = fs.readdirSync(cacheDir);
  const now = Date.now();
  const maxAge = maxAgeDays * 24 * 60 * 60 * 1000;

  for (const file of files) {
    const filePath = path.join(cacheDir, file);
    const stats = fs.statSync(filePath);

    if (now - stats.mtimeMs > maxAge) {
      fs.unlinkSync(filePath);
      console.log('[Cache] Deleted old cache:', file);
    }
  }
}
```

---

## Performance Comparison

### Current Implementation (No Cache)
```
First Load:         2000-5000ms  (Excel parse + SQLite create)
Second Load:        2000-5000ms  (Excel parse + SQLite create) ❌
Third Load:         2000-5000ms  (Excel parse + SQLite create) ❌
```

### Proposed Implementation (With Cache)
```
First Load:         2000-5000ms  (Excel parse + SQLite create + cache save)
Second Load:        50-200ms     (SQLite load only) ✅ 10-100x faster
Third Load:         50-200ms     (SQLite load only) ✅ 10-100x faster
Cache Invalidation: 2000-5000ms  (Excel modified, rebuild cache)
```

---

## Preferences Optimization

### Current Behavior
```javascript
// EVERY load clears and rebuilds discovered units/columns
clearDiscoveredUnits();
addDiscoveredUnits(unmappedUnits);

clearDiscoveredColumns();
addDiscoveredColumns(uniqueColumns);
applySmartMatching(uniqueColumns);
```

### Proposed Behavior
```javascript
// Only on FIRST load or cache miss
if (!cacheValid) {
  clearDiscoveredUnits();
  addDiscoveredUnits(unmappedUnits);

  clearDiscoveredColumns();
  addDiscoveredColumns(uniqueColumns);
  applySmartMatching(uniqueColumns);
} else {
  // Cache hit - preferences already configured
  console.log('[Excel Handler] Using cached preferences configuration');
}
```

---

## Implementation Priority

### Phase 1: Database Persistence (High Priority)
- [ ] Change database storage location from temp to userData
- [ ] Remove database deletion on close
- [ ] Create cache directory structure
- [ ] Test database persistence across app restarts

### Phase 2: Cache Validation (High Priority)
- [ ] Implement isCacheValid() function
- [ ] Check Excel file modification time
- [ ] Implement database integrity checks
- [ ] Add cache version tracking

### Phase 3: Smart Load Logic (High Priority)
- [ ] Add cache hit/miss detection to readExcelFile
- [ ] Implement fast path for cache hits
- [ ] Skip preferences modification on cache hits
- [ ] Add cache statistics logging

### Phase 4: Cache Management (Medium Priority)
- [ ] Implement cache cleanup on app startup
- [ ] Add user preference for cache size limit
- [ ] Add UI to view/clear cache
- [ ] Add cache statistics to About dialog

### Phase 5: Optimization (Low Priority)
- [ ] Implement incremental updates (only changed rows)
- [ ] Add compression to database files
- [ ] Implement background cache warming
- [ ] Add cache preloading for recent files

---

## Edge Cases to Handle

1. **Excel file moved/renamed:** Cache keyed by file path, so new cache created
2. **Excel file deleted:** Clean up orphaned cache files
3. **Database corruption:** Detect and rebuild cache
4. **Disk space full:** Handle cache save failures gracefully
5. **Multiple app instances:** Use file locking or unique cache per instance
6. **Schema changes:** Version cache format, invalidate on schema change

---

## Storage Location Analysis

### Current (Temp Directory)
```
Path: C:\Users\User\AppData\Local\Temp\xlx-{hash}.db
Pros:
  - Automatic cleanup by OS
  - No manual management needed

Cons:
  - Deleted on system reboot ❌
  - Deleted by disk cleanup tools ❌
  - Not persistent across app restarts ❌
  - Defeats purpose of caching ❌
```

### Proposed (UserData Directory)
```
Path: C:\Users\User\AppData\Roaming\excel-zztakeoff-connector\excel-cache\xlx-{hash}.db
Pros:
  - Persists across app restarts ✅
  - Persists across system reboots ✅
  - Full control over lifecycle ✅
  - Fast subsequent loads ✅

Cons:
  - Requires manual cache management
  - Uses disk space (needs cleanup strategy)
  - Need to handle corruption/versioning
```

**Recommendation:** Use UserData directory with automated cache cleanup.

---

## Testing Checklist

### Functional Tests
- [ ] First load of new Excel file creates cache
- [ ] Second load of same file uses cache (verify speed)
- [ ] Modifying Excel file invalidates cache
- [ ] Cache persists after app restart
- [ ] Cache persists after system reboot
- [ ] Multiple files cached independently
- [ ] Large files (near 50 MB) cached correctly
- [ ] Files with special characters in path cached
- [ ] Corrupted cache detected and rebuilt

### Performance Tests
- [ ] Measure first load time
- [ ] Measure cached load time
- [ ] Verify 10x+ speedup for cached loads
- [ ] Test with 10, 100, 1000 row files
- [ ] Test with 5, 10, 20 sheets per file
- [ ] Memory usage for cached vs uncached loads

### Security Tests
- [ ] Cache path validation works
- [ ] Cannot access cache outside userData
- [ ] Database integrity checks prevent tampering
- [ ] File modification detection works

---

**Date:** 2025-11-09
**Reviewer:** Claude Code
**Status:** Analysis Complete - Ready for Implementation
