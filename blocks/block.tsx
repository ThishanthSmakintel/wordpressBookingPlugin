import { registerBlockType } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import { useBlockProps } from '@wordpress/block-editor';
import { useEffect } from '@wordpress/element';
import './editor.scss';
import '../src/frontend.css';

registerBlockType('appointease/booking-form', {
    apiVersion: 2,
    title: __('AppointEase Booking', 'appointease'),
    icon: 'clock',
    category: 'widgets',
    example: {},

    edit() {
        const blockProps = useBlockProps();
        
        useEffect(() => {
            const container = document.getElementById('appointease-booking-editor');
            if (container && !container.querySelector('.appointease-booking')) {
                // Load the booking app in editor
                import('../src/frontend.tsx').then(() => {
                    // Frontend app will mount automatically
                });
            }
        }, []);
        
        return (
            <div {...blockProps}>
                <div className="appointease-booking-wrapper">
                    <div className="appointease-booking-container" id="appointease-booking-editor">
                        <div className="editor-loading">
                            <div className="spinner"></div>
                            <p>Loading booking interface...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    },
    
    save() {
        return null; // Dynamic block - rendered by PHP
    }
});