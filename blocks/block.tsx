import { registerBlockType } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, RangeControl } from '@wordpress/components';
import { useEffect } from '@wordpress/element';
import './editor.scss';
import '../src/frontend.css';

registerBlockType('appointease/booking-form', {
    apiVersion: 2,
    title: __('AppointEase Booking', 'appointease'),
    icon: 'clock',
    category: 'widgets',
    example: {},
    attributes: {
        columns: {
            type: 'number',
            default: 2
        },
        width: {
            type: 'number',
            default: 100
        },
        height: {
            type: 'number',
            default: 600
        }
    },

    edit({ attributes, setAttributes }) {
        const { columns, width, height } = attributes;
        const blockProps = useBlockProps();
        

        
        return (
            <>
                <InspectorControls>
                    <PanelBody title={__('Layout Settings', 'appointease')}>
                        <RangeControl
                            label={__('Columns', 'appointease')}
                            value={columns}
                            onChange={(value) => setAttributes({ columns: value })}
                            min={1}
                            max={4}
                        />
                        <RangeControl
                            label={__('Width (%)', 'appointease')}
                            value={width}
                            onChange={(value) => setAttributes({ width: value })}
                            min={80}
                            max={100}
                        />
                        <RangeControl
                            label={__('Height (px)', 'appointease')}
                            value={height}
                            onChange={(value) => setAttributes({ height: value })}
                            min={400}
                            max={800}
                        />
                    </PanelBody>
                </InspectorControls>
                <div {...blockProps}>
                    <div className="appointease-booking-wrapper" style={{width: `${width}%`, height: `${height}px`, overflow: 'auto', minWidth: '600px'}}>
                        <div className="appointease-booking-container">
                            <div className="appointease-booking">
                                <div className="appointease-booking-header">
                                    <div className="appointease-logo">
                                        <span className="logo-icon">A</span>
                                    </div>
                                    <div className="manage-appointment">
                                        <button className="login-btn">
                                            <i className="fas fa-sign-in-alt"></i>
                                            <strong>Existing Customer? Login Here</strong>
                                        </button>
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
                                        <div className="services-grid" style={{gridTemplateColumns: `repeat(${columns}, 1fr)`}}>
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
                </div>
            </>
        );
    },
    
    save({ attributes }) {
        const { columns, width, height } = attributes;
        return (
            <div data-columns={columns} data-width={width} data-height={height}>
                <div id="appointease-booking"></div>
            </div>
        );
    }
});