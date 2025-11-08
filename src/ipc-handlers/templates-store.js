const {
  getTemplates,
  getTemplate,
  saveTemplate,
  deleteTemplate,
  clearTemplates
} = require('../database/templates-store');

/**
 * Get all templates
 * IPC Handler: 'templates-store:get-list'
 */
async function handleGetTemplates(event, params) {
  try {
    const templates = getTemplates(params);
    return {
      success: true,
      data: templates
    };
  } catch (err) {
    console.error('Error getting templates:', err);
    return {
      success: false,
      error: 'Failed to get templates',
      message: err.message,
      data: []
    };
  }
}

/**
 * Get a single template
 * IPC Handler: 'templates-store:get'
 */
async function handleGetTemplate(event, templateId) {
  try {
    const template = getTemplate(templateId);
    if (!template) {
      return {
        success: false,
        error: 'Template not found',
        data: null
      };
    }
    return {
      success: true,
      data: template
    };
  } catch (err) {
    console.error('Error getting template:', err);
    return {
      success: false,
      error: 'Failed to get template',
      message: err.message,
      data: null
    };
  }
}

/**
 * Save a template (create or update)
 * IPC Handler: 'templates-store:save'
 */
async function handleSaveTemplate(event, template) {
  try {
    return saveTemplate(template);
  } catch (err) {
    console.error('Error saving template:', err);
    return {
      success: false,
      error: 'Failed to save template',
      message: err.message
    };
  }
}

/**
 * Delete a template
 * IPC Handler: 'templates-store:delete'
 */
async function handleDeleteTemplate(event, templateId) {
  try {
    return deleteTemplate(templateId);
  } catch (err) {
    console.error('Error deleting template:', err);
    return {
      success: false,
      error: 'Failed to delete template',
      message: err.message
    };
  }
}

/**
 * Clear all templates
 * IPC Handler: 'templates-store:clear'
 */
async function handleClearTemplates(event, params) {
  try {
    return clearTemplates();
  } catch (err) {
    console.error('Error clearing templates:', err);
    return {
      success: false,
      error: 'Failed to clear templates',
      message: err.message
    };
  }
}

module.exports = {
  handleGetTemplates,
  handleGetTemplate,
  handleSaveTemplate,
  handleDeleteTemplate,
  handleClearTemplates
};
