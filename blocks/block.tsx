import { registerBlockType } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import { useBlockProps } from '@wordpress/block-editor';
import './editor.scss';

registerBlockType('appointease/booking-form', {
    apiVersion: 2,
    title: __('AppointEase Booking', 'appointease'),
    icon: 'clock',
    category: 'widgets',
    example: {},

    edit() {
        const blockProps = useBlockProps();
        
        return (
            <div {...blockProps}>
                <div className="appointease-block-preview">
                    <div className="ae-preview-header">
                        <div className="ae-preview-logo">A</div>
                        <h3>AppointEase Booking Form</h3>
                    </div>
                    <div className="ae-preview-content">
                        <div className="preview-service">
                            <div className="service-icon"></div>
                            <div>
                                <h4>Select Service</h4>
                                <p>Choose from available services</p>
                            </div>
                        </div>
                        <div className="preview-note">
                            <em>Booking interface will be displayed on the frontend</em>
                        </div>
                    </div>
                </div>
            </div>
        );
    },
    
    save() {
        const blockProps = useBlockProps.save({
            className: 'appointease-booking-container',
            id: 'appointease-booking'
        });
        
        return <div {...blockProps}></div>;
    }
});