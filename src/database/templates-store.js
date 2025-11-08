const Store = require('electron-store');
const { v4: uuidv4 } = require('uuid');

// Initialize electron-store for templates
// Data is stored in: C:\Users\<username>\AppData\Roaming\excel-zztakeoff-connector\templates.json
const templatesStore = new Store({
  name: 'templates',
  defaults: {
    templates: {}
  }
});

console.log('✓ Templates storage initialized at:', templatesStore.path);

/**
 * Get all templates
 * @param {Object} params - Query parameters
 * @param {number} params.limit - Maximum number of templates to return
 * @returns {Array} Array of templates
 */
function getTemplates(params = {}) {
  try {
    const { limit } = params;
    const templatesObj = templatesStore.get('templates', {});
    let templates = Object.keys(templatesObj).map(id => ({
      id,
      ...templatesObj[id]
    }));

    // Sort by last modified (most recent first)
    templates = templates.sort((a, b) =>
      new Date(b.lastModified) - new Date(a.lastModified)
    );

    if (limit) {
      templates = templates.slice(0, limit);
    }

    return templates;
  } catch (err) {
    console.error('Error getting templates:', err);
    return [];
  }
}

/**
 * Get a single template by ID
 * @param {string} templateId - Template ID
 * @returns {Object|null} Template object or null if not found
 */
function getTemplate(templateId) {
  try {
    const templatesObj = templatesStore.get('templates', {});
    const template = templatesObj[templateId];

    if (!template) {
      return null;
    }

    return {
      id: templateId,
      ...template
    };
  } catch (err) {
    console.error('Error getting template:', err);
    return null;
  }
}

/**
 * Save a template (create or update)
 * @param {Object} template - Template object
 * @param {string} template.id - Template ID (optional for new templates)
 * @param {string} template.templateName - Template name
 * @param {Array} template.items - Array of items in the template
 * @returns {Object} Result object with success status
 */
function saveTemplate(template) {
  try {
    const templatesObj = templatesStore.get('templates', {});
    const templateId = template.id || uuidv4();
    const now = new Date().toISOString();

    const templateData = {
      templateName: template.templateName,
      items: template.items || [],
      createdAt: template.createdAt || now,
      lastModified: now,
      userId: 'default'
    };

    templatesObj[templateId] = templateData;
    templatesStore.set('templates', templatesObj);

    return {
      success: true,
      message: template.id ? 'Template updated successfully' : 'Template created successfully',
      data: {
        id: templateId,
        ...templateData
      }
    };
  } catch (err) {
    console.error('Error saving template:', err);
    return {
      success: false,
      error: err.message
    };
  }
}

/**
 * Delete a template
 * @param {string} templateId - Template ID to delete
 * @returns {Object} Result object with success status
 */
function deleteTemplate(templateId) {
  try {
    const templatesObj = templatesStore.get('templates', {});

    if (!templatesObj[templateId]) {
      return {
        success: false,
        error: 'Template not found'
      };
    }

    delete templatesObj[templateId];
    templatesStore.set('templates', templatesObj);

    return {
      success: true,
      message: 'Template deleted successfully'
    };
  } catch (err) {
    console.error('Error deleting template:', err);
    return {
      success: false,
      error: err.message
    };
  }
}

/**
 * Clear all templates
 * @returns {Object} Result object with success status
 */
function clearTemplates() {
  try {
    templatesStore.set('templates', {});

    return {
      success: true,
      message: 'All templates cleared'
    };
  } catch (err) {
    console.error('Error clearing templates:', err);
    return {
      success: false,
      error: err.message
    };
  }
}

module.exports = {
  getTemplates,
  getTemplate,
  saveTemplate,
  deleteTemplate,
  clearTemplates
};
