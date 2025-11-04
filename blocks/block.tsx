import { registerBlockType } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import { useBlockProps } from '@wordpress/block-editor';
import './styles/editor.scss';
import { BlockInspector, BookingPreview } from './components';

registerBlockType('appointease/booking-form', {
    apiVersion: 2,
    title: __('AppointEase Booking', 'appointease'),
    icon: 'clock',
    category: 'widgets',
    example: {},
    attributes: {
        columns: { type: 'number', default: 2 },
        width: { type: 'number', default: 100 },
        height: { type: 'number', default: 600 }
    },

    edit({ attributes, setAttributes }) {
        const { columns, width, height } = attributes;
        const blockProps = useBlockProps();

        return (
            <>
                <BlockInspector
                    columns={columns}
                    width={width}
                    height={height}
                    onColumnsChange={(value) => setAttributes({ columns: value })}
                    onWidthChange={(value) => setAttributes({ width: value })}
                    onHeightChange={(value) => setAttributes({ height: value })}
                />
                <div {...blockProps}>
                    <BookingPreview columns={columns} width={width} height={height} />
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