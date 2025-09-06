import { registerBlockType } from '@wordpress/blocks';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, ColorPalette } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

registerBlockType('appointease/booking-form', {
    title: __('AppointEase Booking', 'booking-plugin'),
    description: __('Add a booking form to your page', 'booking-plugin'),
    category: 'widgets',
    icon: 'calendar-alt',
    supports: {
        html: false,
        align: ['wide', 'full'],
        spacing: {
            margin: true,
            padding: true
        },
        color: {
            background: true,
            text: true,
            gradients: true
        },
        typography: {
            fontSize: true,
            lineHeight: true,
            fontFamily: true,
            fontWeight: true
        },
        dimensions: {
            minHeight: true
        },
        __experimentalBorder: {
            color: true,
            radius: true,
            style: true,
            width: true
        }
    },
    attributes: {
        headerBgColor: { type: 'string', default: '' },
        headerTextColor: { type: 'string', default: '' },
        cardBgColor: { type: 'string', default: '' },
        cardBorderColor: { type: 'string', default: '' },
        buttonBgColor: { type: 'string', default: '' },
        buttonTextColor: { type: 'string', default: '' }
    },
    edit: ({ attributes, setAttributes }) => {
        const blockProps = useBlockProps();
        const { headerBgColor, headerTextColor, cardBgColor, cardBorderColor, buttonBgColor, buttonTextColor } = attributes;

        const customStyles = {
            '--header-bg': headerBgColor || 'var(--wp--preset--color--primary, #1CBC9B)',
            '--header-text': headerTextColor || 'var(--wp--preset--color--white, #ffffff)',
            '--card-bg': cardBgColor || 'var(--wp--preset--color--white, #ffffff)',
            '--card-border': cardBorderColor || 'var(--wp--preset--color--light-gray, #e9ecef)',
            '--button-bg': buttonBgColor || 'var(--wp--preset--color--primary, #1CBC9B)',
            '--button-text': buttonTextColor || 'var(--wp--preset--color--white, #ffffff)'
        };

        return (
            <>
                <InspectorControls>
                    <PanelBody title={__('Header Colors', 'booking-plugin')} initialOpen={false}>
                        <p>{__('Header Background Color', 'booking-plugin')}</p>
                        <ColorPalette
                            value={headerBgColor}
                            onChange={(color) => setAttributes({ headerBgColor: color })}
                        />
                        <p>{__('Header Text Color', 'booking-plugin')}</p>
                        <ColorPalette
                            value={headerTextColor}
                            onChange={(color) => setAttributes({ headerTextColor: color })}
                        />
                    </PanelBody>
                    <PanelBody title={__('Card Colors', 'booking-plugin')} initialOpen={false}>
                        <p>{__('Card Background Color', 'booking-plugin')}</p>
                        <ColorPalette
                            value={cardBgColor}
                            onChange={(color) => setAttributes({ cardBgColor: color })}
                        />
                        <p>{__('Card Border Color', 'booking-plugin')}</p>
                        <ColorPalette
                            value={cardBorderColor}
                            onChange={(color) => setAttributes({ cardBorderColor: color })}
                        />
                    </PanelBody>
                    <PanelBody title={__('Button Colors', 'booking-plugin')} initialOpen={false}>
                        <p>{__('Button Background Color', 'booking-plugin')}</p>
                        <ColorPalette
                            value={buttonBgColor}
                            onChange={(color) => setAttributes({ buttonBgColor: color })}
                        />
                        <p>{__('Button Text Color', 'booking-plugin')}</p>
                        <ColorPalette
                            value={buttonTextColor}
                            onChange={(color) => setAttributes({ buttonTextColor: color })}
                        />
                    </PanelBody>
                </InspectorControls>
                <div {...blockProps} style={customStyles}>
                    <div className="appointease-booking-container" id="appointease-booking-editor">
                        <div className="appointease-booking">
                            <div className="appointease-booking-header">
                                <div className="appointease-logo">
                                    <span className="logo-icon">A</span>
                                    <span className="logo-text">AppointEase</span>
                                </div>
                                <div className="manage-appointment">
                                    <input type="text" placeholder="Enter Appointment ID" />
                                    <button>Manage</button>
                                </div>
                            </div>
                            <div className="appointease-booking-content">
                                <div className="appointease-steps">
                                    <div className="step active">
                                        <span className="step-number">1</span>
                                        <span className="step-label">Service</span>
                                    </div>
                                    <div className="step">
                                        <span className="step-number">2</span>
                                        <span className="step-label">Employee</span>
                                    </div>
                                    <div className="step">
                                        <span className="step-number">3</span>
                                        <span className="step-label">Date</span>
                                    </div>
                                    <div className="step">
                                        <span className="step-number">4</span>
                                        <span className="step-label">Time</span>
                                    </div>
                                    <div className="step">
                                        <span className="step-number">5</span>
                                        <span className="step-label">Info</span>
                                    </div>
                                </div>
                                <div className="appointease-step-content">
                                    <h2>Choose Your Service</h2>
                                    <p className="step-description">Select the service you'd like to book</p>
                                    <div className="services-grid">
                                        <div className="service-card">
                                            <div className="service-icon"><i className="fas fa-stethoscope"></i></div>
                                            <div className="service-info">
                                                <h3>Consultation</h3>
                                                <p>Initial consultation session</p>
                                                <div className="service-meta">
                                                    <span className="duration">30 min</span>
                                                    <span className="price">$75.00</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="service-card">
                                            <div className="service-icon"><i className="fas fa-user-md"></i></div>
                                            <div className="service-info">
                                                <h3>Premium Service</h3>
                                                <p>Extended premium service</p>
                                                <div className="service-meta">
                                                    <span className="duration">60 min</span>
                                                    <span className="price">$150.00</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    },
    save: () => null
});