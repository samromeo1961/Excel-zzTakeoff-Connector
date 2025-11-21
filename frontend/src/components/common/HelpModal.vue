<template>
  <div class="modal fade" id="helpModal" tabindex="-1" aria-labelledby="helpModalLabel" aria-hidden="true" ref="helpModal">
    <div class="modal-dialog modal-xl modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="helpModalLabel">
            <i class="bi bi-question-circle me-2"></i>
            XLx Connector Help
          </h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <!-- Help Content -->
          <div class="help-content">

            <!-- Overview Section -->
            <section id="overview" class="help-section">
              <h2 class="section-title"><i class="bi bi-house-door me-2"></i>Overview</h2>
              <p class="lead">
                XLx Connector is a powerful desktop application that bridges Microsoft Excel with zzTakeoff,
                enabling construction estimators to efficiently manage takeoff items and synchronize data with the zzTakeoff cloud platform.
              </p>
              <div class="feature-highlights">
                <h4>Key Features:</h4>
                <ul>
                  <li><strong>Excel Integration:</strong> Open and edit Excel spreadsheets directly within the application</li>
                  <li><strong>AG Grid Interface:</strong> Modern, fast data grid for viewing and editing large datasets</li>
                  <li><strong>zzTakeoff Sync:</strong> Send items directly to zzTakeoff projects with a single click</li>
                  <li><strong>Template Management:</strong> Create and manage reusable templates for common takeoff items</li>
                  <li><strong>Send History:</strong> Track all items sent to zzTakeoff with full history</li>
                  <li><strong>Dark Mode:</strong> Eye-friendly dark theme for extended work sessions</li>
                </ul>
              </div>
            </section>

            <hr>

            <!-- Getting Started -->
            <section id="getting-started" class="help-section">
              <h2 class="section-title"><i class="bi bi-play-circle me-2"></i>Getting Started</h2>
              <ol class="steps-list">
                <li>
                  <strong>Open an Excel File:</strong>
                  <ul>
                    <li>Click File → Open (or press <kbd>Ctrl+O</kbd>)</li>
                    <li>Navigate to your Excel file (.xlsx, .xls, .xlsm, .csv)</li>
                    <li>The file will load into the Excel Grid tab</li>
                  </ul>
                </li>
                <li>
                  <strong>Configure Column Mappings:</strong>
                  <ul>
                    <li>Go to Preferences tab</li>
                    <li>Expand "Column Mappings" section</li>
                    <li>Map your Excel columns to preferred display names (SKU, Description, Units, etc.)</li>
                    <li>Toggle column visibility as needed</li>
                  </ul>
                </li>
                <li>
                  <strong>Connect to zzTakeoff:</strong>
                  <ul>
                    <li>Navigate to the "zzTakeoff Web" tab</li>
                    <li>Log in to your zzTakeoff account</li>
                    <li>Open or create a project</li>
                  </ul>
                </li>
              </ol>
            </section>

            <hr>

            <!-- Excel Grid Tab -->
            <section id="excel-grid" class="help-section">
              <h2 class="section-title"><i class="bi bi-grid-3x3-gap me-2"></i>Excel Grid Tab</h2>
              <p>The Excel Grid tab provides a powerful interface for viewing and editing your Excel data.</p>

              <h4>Column Types:</h4>
              <div class="column-types">
                <div class="column-type-item">
                  <span class="column-badge data-column">Data Columns</span>
                  <p>Mapped from your Excel file based on Preferences → Column Mappings</p>
                </div>
                <div class="column-type-item">
                  <span class="column-badge markup-column">Markup %</span>
                  <p>Purple - Set markup percentage (editable, tracked per row)</p>
                </div>
                <div class="column-type-item">
                  <span class="column-badge cost-type-column">Cost Type</span>
                  <p>Teal - Labour, Plant, Material, or Subcontractor</p>
                </div>
                <div class="column-type-item">
                  <span class="column-badge zz-type-column">zzType</span>
                  <p>Blue - Takeoff type: area, linear, segment, or count</p>
                </div>
                <div class="column-type-item">
                  <span class="column-badge actions-column">Actions</span>
                  <p>Send items to zzTakeoff</p>
                </div>
              </div>

              <h4>Working with Data:</h4>
              <ul>
                <li><strong>Edit Cells:</strong> Single-click to edit any editable cell</li>
                <li><strong>Filter Data:</strong> Use column headers to filter rows</li>
                <li><strong>Select Rows:</strong> Use checkboxes to select multiple rows</li>
                <li><strong>Send to zzTakeoff:</strong> Click the Send button in the Actions column</li>
                <li><strong>Save Changes:</strong> Press <kbd>Ctrl+S</kbd> to save your Excel file</li>
              </ul>

              <h4>Toolbar Actions:</h4>
              <ul>
                <li><i class="bi bi-funnel-fill"></i> <strong>Clear Filters:</strong> Remove all active column filters</li>
                <li><i class="bi bi-check-square"></i> <strong>Select All:</strong> Select all visible (filtered) rows</li>
                <li><i class="bi bi-x-square"></i> <strong>Deselect All:</strong> Clear all row selections</li>
                <li><i class="bi bi-folder-plus"></i> <strong>Send to Template:</strong> Add selected rows to a template</li>
              </ul>
            </section>

            <hr>

            <!-- Recent Files Tab -->
            <section id="recent-files" class="help-section">
              <h2 class="section-title"><i class="bi bi-clock-history me-2"></i>Recent Files Tab</h2>
              <p>Quick access to recently opened Excel files.</p>
              <ul>
                <li>Shows last modified date and file size</li>
                <li>Click any file to reopen it instantly</li>
                <li>Remove files from the list with the trash icon</li>
              </ul>
            </section>

            <hr>

            <!-- Send History Tab -->
            <section id="send-history" class="help-section">
              <h2 class="section-title"><i class="bi bi-list-check me-2"></i>Send History Tab</h2>
              <p>Track all items you've sent to zzTakeoff with detailed history.</p>

              <h4>Features:</h4>
              <ul>
                <li><strong>Send Count:</strong> See how many times each item has been sent (highlighted in green)</li>
                <li><strong>Last Sent:</strong> Timestamp of the most recent send</li>
                <li><strong>Project Links:</strong> Click project IDs to navigate directly to that project in zzTakeoff Web</li>
                <li><strong>Search:</strong> Filter history by code, description, type, or project</li>
                <li><strong>Clear History:</strong> Remove all send history (cannot be undone)</li>
              </ul>

              <div class="alert alert-info">
                <i class="bi bi-info-circle me-2"></i>
                <strong>Tip:</strong> Items sent multiple times are highlighted with a green background to help identify frequently used items.
              </div>
            </section>

            <hr>

            <!-- Templates Tab -->
            <section id="templates" class="help-section">
              <h2 class="section-title"><i class="bi bi-folder me-2"></i>Templates Tab</h2>
              <p>Create and manage reusable templates for common takeoff items.</p>

              <h4>Template Management:</h4>
              <ul>
                <li><i class="bi bi-plus-circle"></i> <strong>New Template:</strong> Create a blank template</li>
                <li><i class="bi bi-filetype-csv"></i> <strong>Import CSV:</strong> Import items from a CSV file</li>
                <li><i class="bi bi-clipboard"></i> <strong>Paste from Clipboard:</strong> Paste Excel data directly</li>
                <li><i class="bi bi-arrow-clockwise"></i> <strong>Refresh:</strong> Reload template list</li>
                <li><i class="bi bi-trash"></i> <strong>Delete:</strong> Remove selected items or entire template</li>
              </ul>

              <h4>Using Templates:</h4>
              <ol>
                <li>Select a template from the dropdown</li>
                <li>View and edit items in the AG Grid</li>
                <li>Click Send button to send items to zzTakeoff</li>
                <li>Delete individual items or select multiple for bulk delete</li>
              </ol>

              <div class="alert alert-success">
                <i class="bi bi-lightbulb me-2"></i>
                <strong>Best Practice:</strong> Create templates for commonly used materials, labor types, or equipment to speed up your estimating workflow.
              </div>
            </section>

            <hr>

            <!-- zzTakeoff Web Tab -->
            <section id="zztakeoff-web" class="help-section">
              <h2 class="section-title"><i class="bi bi-globe me-2"></i>zzTakeoff Web Tab</h2>
              <p>The zzTakeoff web interface opens in a separate window for multi-monitor productivity.</p>

              <h4>Features:</h4>
              <ul>
                <li><strong>Separate Window:</strong> zzTakeoff opens in its own window - move it to a second monitor</li>
                <li><strong>Persistent Login:</strong> Stay logged in across sessions</li>
                <li><strong>Full Web Access:</strong> Complete zzTakeoff functionality within the app</li>
                <li><strong>Project Sync:</strong> The current project URL is captured for send operations</li>
              </ul>

              <h4>zzTakeoff Window Navigation:</h4>
              <p>The zzTakeoff window has its own menu bar with helpful navigation options:</p>
              <ul>
                <li><strong>Navigation → Back to XLx Connector</strong> (<kbd>Ctrl+B</kbd>): Focus the main window (reopens if closed)</li>
                <li><strong>Navigation → Reload Page</strong> (<kbd>Ctrl+R</kbd>): Refresh the current page</li>
                <li><strong>Navigation → Go to Login:</strong> Navigate to zzTakeoff login page</li>
                <li><strong>View → Zoom In/Out/Reset</strong> (<kbd>Ctrl++/-/0</kbd>): Adjust page zoom</li>
                <li><strong>View → Toggle DevTools</strong> (<kbd>F12</kbd>): Open developer tools</li>
              </ul>

              <div class="alert alert-info">
                <i class="bi bi-info-circle me-2"></i>
                <strong>Tip:</strong> If you accidentally close the main XLx Connector window, use <kbd>Ctrl+B</kbd> in the zzTakeoff window to reopen it.
              </div>

              <div class="alert alert-warning">
                <i class="bi bi-exclamation-triangle me-2"></i>
                <strong>Important:</strong> Make sure you have a zzTakeoff project open before sending items from Excel Grid or Templates.
              </div>
            </section>

            <hr>

            <!-- Preferences Tab -->
            <section id="preferences" class="help-section">
              <h2 class="section-title"><i class="bi bi-gear me-2"></i>Preferences Tab</h2>
              <p>Customize the application to match your workflow.</p>

              <h4>Settings Sections:</h4>

              <h5><i class="bi bi-percent me-2"></i>Default Markup %</h5>
              <ul>
                <li>Set a default markup percentage applied to all new rows</li>
                <li>Click "Apply to All Rows" to update existing rows</li>
                <li>Manually edited markup values are preserved and highlighted</li>
              </ul>

              <h5><i class="bi bi-rulers me-2"></i>Unit Mappings</h5>
              <ul>
                <li>Auto-detect zzType based on unit of measurement</li>
                <li>Example: "m²" → area, "m" → linear, "each" → count</li>
                <li>Add custom unit mappings for your specific needs</li>
              </ul>

              <h5><i class="bi bi-table me-2"></i>Column Mappings</h5>
              <ul>
                <li>Map Excel columns to preferred display names</li>
                <li>Control which columns are visible in Excel Grid and Templates</li>
                <li>Reorder columns using the order field</li>
                <li>Available mappings: SKU, Description, Units, SC#, Category, Sub Category, Cost Each, Markup %</li>
              </ul>

              <div class="alert alert-info">
                <i class="bi bi-info-circle me-2"></i>
                <strong>Note:</strong> Column mappings affect both Excel Grid and Templates tabs for consistency.
              </div>
            </section>

            <hr>

            <!-- Keyboard Shortcuts -->
            <section id="shortcuts" class="help-section">
              <h2 class="section-title"><i class="bi bi-keyboard me-2"></i>Keyboard Shortcuts</h2>
              <div class="shortcuts-grid">
                <div class="shortcut-item">
                  <kbd>Ctrl+1</kbd>
                  <span>Excel Grid</span>
                </div>
                <div class="shortcut-item">
                  <kbd>Ctrl+2</kbd>
                  <span>Recent Files</span>
                </div>
                <div class="shortcut-item">
                  <kbd>Ctrl+3</kbd>
                  <span>Send History</span>
                </div>
                <div class="shortcut-item">
                  <kbd>Ctrl+4</kbd>
                  <span>Templates</span>
                </div>
                <div class="shortcut-item">
                  <kbd>Ctrl+5</kbd>
                  <span>zzTakeoff Web</span>
                </div>
                <div class="shortcut-item">
                  <kbd>Ctrl+O</kbd>
                  <span>Open File</span>
                </div>
                <div class="shortcut-item">
                  <kbd>Ctrl+S</kbd>
                  <span>Save File</span>
                </div>
                <div class="shortcut-item">
                  <kbd>Ctrl+Shift+S</kbd>
                  <span>Save As</span>
                </div>
                <div class="shortcut-item">
                  <kbd>F1</kbd>
                  <span>Show Help (this window)</span>
                </div>
                <div class="shortcut-item">
                  <kbd>F12</kbd>
                  <span>Developer Tools</span>
                </div>
                <div class="shortcut-item">
                  <kbd>Ctrl+B</kbd>
                  <span>Back to XLx (from zzTakeoff window)</span>
                </div>
              </div>
            </section>

            <hr>

            <!-- Tips & Best Practices -->
            <section id="tips" class="help-section">
              <h2 class="section-title"><i class="bi bi-star me-2"></i>Tips & Best Practices</h2>

              <div class="tip-card">
                <h5><i class="bi bi-check2-circle text-success me-2"></i>Workflow Optimization</h5>
                <ul>
                  <li>Set up column mappings before opening Excel files for the first time</li>
                  <li>Configure default markup % in Preferences to save time</li>
                  <li>Use templates for standardized material lists</li>
                  <li>Keep zzTakeoff Web tab open to the active project for quick sends</li>
                </ul>
              </div>

              <div class="tip-card">
                <h5><i class="bi bi-lightning-charge text-warning me-2"></i>Performance Tips</h5>
                <ul>
                  <li>Filter large datasets before selecting all rows</li>
                  <li>Save Excel files regularly (<kbd>Ctrl+S</kbd>)</li>
                  <li>Close unused tabs to free up resources</li>
                </ul>
              </div>

              <div class="tip-card">
                <h5><i class="bi bi-shield-check text-primary me-2"></i>Data Safety</h5>
                <ul>
                  <li>Excel files are saved with metadata in a hidden sheet (_zzTakeoffMetadata)</li>
                  <li>Original Excel data is preserved - metadata is separate</li>
                  <li>Send history is stored locally and persists across sessions</li>
                  <li>Templates are saved in: <code>%APPDATA%\excel-zztakeoff-connector\templates.json</code></li>
                </ul>
              </div>
            </section>

            <hr>

            <!-- Troubleshooting -->
            <section id="troubleshooting" class="help-section">
              <h2 class="section-title"><i class="bi bi-tools me-2"></i>Troubleshooting</h2>

              <h4>Common Issues:</h4>

              <div class="faq-item">
                <h5>Q: Excel file won't open</h5>
                <p><strong>A:</strong> Ensure the file is not open in Microsoft Excel. Close Excel and try again. Supported formats: .xlsx, .xls, .xlsm, .csv</p>
              </div>

              <div class="faq-item">
                <h5>Q: Columns not showing correctly</h5>
                <p><strong>A:</strong> Check Preferences → Column Mappings. Ensure columns are marked as visible and properly mapped to your Excel column names.</p>
              </div>

              <div class="faq-item">
                <h5>Q: Send to zzTakeoff not working</h5>
                <p><strong>A:</strong> Verify you're logged in to zzTakeoff Web tab and have a project open. The project URL is captured automatically.</p>
              </div>

              <div class="faq-item">
                <h5>Q: Dark mode text hard to read</h5>
                <p><strong>A:</strong> Click the sun/moon icon in the top navigation to toggle between light and dark themes. Preference is saved automatically.</p>
              </div>

              <div class="faq-item">
                <h5>Q: Application won't start</h5>
                <p><strong>A:</strong> Try clearing the cache: Delete the folder at <code>%APPDATA%\excel-zztakeoff-connector</code> and restart the application.</p>
              </div>
            </section>

            <hr>

            <!-- Support -->
            <section id="support" class="help-section">
              <h2 class="section-title"><i class="bi bi-headset me-2"></i>Support & Feedback</h2>
              <p>Need additional help or want to report an issue?</p>
              <div class="contact-info">
                <p><i class="bi bi-envelope me-2"></i>Email: <a href="mailto:support@zztakeoff.com">support@zztakeoff.com</a></p>
                <p><i class="bi bi-globe me-2"></i>Website: <a href="https://www.zztakeoff.com" target="_blank">www.zztakeoff.com</a></p>
                <p><i class="bi bi-book me-2"></i>Documentation: <a href="https://docs.zztakeoff.com" target="_blank">docs.zztakeoff.com</a></p>
              </div>

              <div class="version-info mt-4">
                <p class="text-muted">
                  <small>
                    <strong>Version:</strong> 1.1.4<br>
                    <strong>Electron:</strong> {{ electronVersion }}<br>
                    <strong>Node:</strong> {{ nodeVersion }}
                  </small>
                </p>
              </div>
            </section>

          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Modal } from 'bootstrap';

const helpModal = ref(null);
let modalInstance = null;

// Version info (would be populated from Electron in a real app)
const electronVersion = ref('39.1.1');
const nodeVersion = ref('22.21.1');

onMounted(() => {
  if (helpModal.value) {
    modalInstance = new Modal(helpModal.value);
  }
});

// Expose show method for parent components
defineExpose({
  show: () => {
    if (modalInstance) {
      modalInstance.show();
    }
  },
  hide: () => {
    if (modalInstance) {
      modalInstance.hide();
    }
  }
});
</script>

<style scoped>
.help-content {
  font-size: 1rem;
  line-height: 1.6;
}

.help-section {
  margin-bottom: 2rem;
}

.section-title {
  color: #0d6efd;
  font-size: 1.75rem;
  font-weight: 600;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #0d6efd;
}

[data-theme="dark"] .section-title {
  color: #6ea8fe;
  border-bottom-color: #6ea8fe;
}

.lead {
  font-size: 1.1rem;
  color: #495057;
}

[data-theme="dark"] .lead {
  color: #adb5bd;
}

.feature-highlights {
  background-color: #f8f9fa;
  padding: 1.5rem;
  border-radius: 0.5rem;
  margin: 1rem 0;
}

[data-theme="dark"] .feature-highlights {
  background-color: #2d2d2d;
}

.feature-highlights h4 {
  color: #0d6efd;
  margin-bottom: 1rem;
}

[data-theme="dark"] .feature-highlights h4 {
  color: #6ea8fe;
}

.steps-list {
  padding-left: 1.5rem;
}

.steps-list > li {
  margin-bottom: 1rem;
}

.steps-list ul {
  margin-top: 0.5rem;
}

.column-types {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin: 1rem 0;
}

.column-type-item {
  padding: 1rem;
  border: 1px solid #dee2e6;
  border-radius: 0.5rem;
  background-color: #fff;
}

[data-theme="dark"] .column-type-item {
  border-color: #495057;
  background-color: #2d2d2d;
}

.column-badge {
  display: inline-block;
  padding: 0.35rem 0.65rem;
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1;
  color: #fff;
  text-align: center;
  white-space: nowrap;
  vertical-align: baseline;
  border-radius: 0.25rem;
  margin-bottom: 0.5rem;
}

.column-badge.data-column {
  background-color: #6c757d;
}

.column-badge.markup-column {
  background-color: #6f42c1;
}

.column-badge.cost-type-column {
  background-color: #20c997;
}

.column-badge.zz-type-column {
  background-color: #0d6efd;
}

.column-badge.actions-column {
  background-color: #fd7e14;
}

.shortcuts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin: 1rem 0;
}

.shortcut-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background-color: #f8f9fa;
  border-radius: 0.5rem;
}

[data-theme="dark"] .shortcut-item {
  background-color: #2d2d2d;
}

kbd {
  padding: 0.25rem 0.5rem;
  font-size: 0.875em;
  color: #fff;
  background-color: #212529;
  border-radius: 0.25rem;
  box-shadow: inset 0 -1px 0 rgba(0, 0, 0, 0.25);
}

[data-theme="dark"] kbd {
  background-color: #495057;
  color: #e4e4e4;
}

.tip-card {
  background-color: #f8f9fa;
  border-left: 4px solid #0d6efd;
  padding: 1rem 1.5rem;
  margin-bottom: 1rem;
  border-radius: 0.25rem;
}

[data-theme="dark"] .tip-card {
  background-color: #2d2d2d;
  border-left-color: #6ea8fe;
}

.faq-item {
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #dee2e6;
}

[data-theme="dark"] .faq-item {
  border-bottom-color: #495057;
}

.faq-item:last-child {
  border-bottom: none;
}

.faq-item h5 {
  color: #0d6efd;
  font-weight: 600;
}

[data-theme="dark"] .faq-item h5 {
  color: #6ea8fe;
}

.contact-info p {
  margin-bottom: 0.5rem;
}

.contact-info a {
  color: #0d6efd;
  text-decoration: none;
}

.contact-info a:hover {
  text-decoration: underline;
}

[data-theme="dark"] .contact-info a {
  color: #6ea8fe;
}

.version-info {
  background-color: #f8f9fa;
  padding: 1rem;
  border-radius: 0.5rem;
}

[data-theme="dark"] .version-info {
  background-color: #2d2d2d;
}

.alert {
  padding: 1rem;
  margin: 1rem 0;
  border-radius: 0.5rem;
  border-left: 4px solid;
}

.alert-info {
  background-color: #cfe2ff;
  border-left-color: #0d6efd;
  color: #084298;
}

.alert-success {
  background-color: #d1e7dd;
  border-left-color: #198754;
  color: #0f5132;
}

.alert-warning {
  background-color: #fff3cd;
  border-left-color: #ffc107;
  color: #664d03;
}

[data-theme="dark"] .alert-info {
  background-color: #1a3a52;
  color: #6ea8fe;
}

[data-theme="dark"] .alert-success {
  background-color: #1e4620;
  color: #8fd19e;
}

[data-theme="dark"] .alert-warning {
  background-color: #4d3800;
  color: #ffda6a;
}

/* Dark mode modal styling */
[data-theme="dark"] .modal-content {
  background-color: #2d2d2d;
  color: #e4e4e4;
}

[data-theme="dark"] .modal-header,
[data-theme="dark"] .modal-footer {
  border-color: #495057;
}

[data-theme="dark"] .modal-header .btn-close {
  filter: invert(1);
}

/* Scrollbar styling */
.modal-body::-webkit-scrollbar {
  width: 8px;
}

.modal-body::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.modal-body::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.modal-body::-webkit-scrollbar-thumb:hover {
  background: #555;
}

[data-theme="dark"] .modal-body::-webkit-scrollbar-track {
  background: #1e1e1e;
}

[data-theme="dark"] .modal-body::-webkit-scrollbar-thumb {
  background: #495057;
}

[data-theme="dark"] .modal-body::-webkit-scrollbar-thumb:hover {
  background: #6c757d;
}
</style>
