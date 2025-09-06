/**
 * WordPress Color Panel Support
 * Handles dynamic color updates from the WordPress editor
 */

// Apply color changes dynamically in the editor
document.addEventListener('DOMContentLoaded', function() {
    // Watch for color changes in the editor
    if (window.wp && window.wp.data) {
        const { subscribe, select } = window.wp.data;
        
        subscribe(() => {
            const selectedBlock = select('core/block-editor').getSelectedBlock();
            if (selectedBlock && selectedBlock.name === 'appointease/booking-form') {
                updateBlockColors(selectedBlock);
            }
        });
    }
});

function updateBlockColors(block) {
    const blockElement = document.querySelector(`[data-block="${block.clientId}"]`);
    if (!blockElement) return;
    
    const { attributes } = block;
    const bookingWrapper = blockElement.querySelector('.appointease-booking-wrapper');
    
    if (bookingWrapper) {
        // Apply WordPress color attributes
        if (attributes.backgroundColor) {
            bookingWrapper.style.setProperty('--card-bg', `var(--wp--preset--color--${attributes.backgroundColor})`);
        }
        
        if (attributes.textColor) {
            bookingWrapper.style.setProperty('--text-primary', `var(--wp--preset--color--${attributes.textColor})`);
        }
        
        // Apply custom color styles
        if (attributes.style?.color?.background) {
            bookingWrapper.style.setProperty('--card-bg', attributes.style.color.background);
        }
        
        if (attributes.style?.color?.text) {
            bookingWrapper.style.setProperty('--text-primary', attributes.style.color.text);
        }
    }
}

// Export for use in other scripts
window.AppointEaseColorSupport = {
    updateBlockColors
};