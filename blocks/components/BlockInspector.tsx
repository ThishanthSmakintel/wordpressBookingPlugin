import { createElement } from '@wordpress/element';
import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody, RangeControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

interface BlockInspectorProps {
    columns: number;
    width: number;
    height: number;
    onColumnsChange: (value: number) => void;
    onWidthChange: (value: number) => void;
    onHeightChange: (value: number) => void;
}

export const BlockInspector = ({
    columns,
    width,
    height,
    onColumnsChange,
    onWidthChange,
    onHeightChange
}: BlockInspectorProps) => (
    <InspectorControls>
        <PanelBody title={__('Layout Settings', 'appointease')}>
            <RangeControl
                label={__('Columns', 'appointease')}
                value={columns}
                onChange={onColumnsChange}
                min={1}
                max={4}
            />
            <RangeControl
                label={__('Width (%)', 'appointease')}
                value={width}
                onChange={onWidthChange}
                min={80}
                max={100}
            />
            <RangeControl
                label={__('Height (px)', 'appointease')}
                value={height}
                onChange={onHeightChange}
                min={400}
                max={800}
            />
        </PanelBody>
    </InspectorControls>
);
