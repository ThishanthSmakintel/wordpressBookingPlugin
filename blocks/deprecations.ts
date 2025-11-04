/**
 * Block Deprecation Strategy
 * Handles backward compatibility for block attribute changes
 */

export const blockDeprecations = [
    // Version 1.0.0 - Initial release
    {
        attributes: {
            columns: { type: 'number', default: 2 },
            width: { type: 'number', default: 100 },
            height: { type: 'number', default: 600 }
        },
        save: ({ attributes }: any) => {
            const { columns, width, height } = attributes;
            return (
                <div data-columns={columns} data-width={width} data-height={height}>
                    <div id="appointease-booking"></div>
                </div>
            );
        }
    }
    
    // Future deprecations will be added here
    // Example for v2.0.0:
    // {
    //     attributes: {
    //         columns: { type: 'number', default: 2 },
    //         width: { type: 'number', default: 100 },
    //         height: { type: 'number', default: 600 },
    //         theme: { type: 'string', default: 'light' } // New attribute
    //     },
    //     migrate: (attributes: any) => {
    //         return {
    //             ...attributes,
    //             theme: attributes.theme || 'light'
    //         };
    //     },
    //     save: ({ attributes }: any) => {
    //         // Old save function
    //     }
    // }
];

/**
 * Migration helper for attribute changes
 */
export const migrateBlockAttributes = (oldAttributes: any, newVersion: string) => {
    switch (newVersion) {
        case '2.0.0':
            return {
                ...oldAttributes,
                // Add new attributes with defaults
                theme: oldAttributes.theme || 'light'
            };
        default:
            return oldAttributes;
    }
};

/**
 * Validate block attributes
 */
export const isValidBlockAttributes = (attributes: any): boolean => {
    return (
        typeof attributes.columns === 'number' &&
        typeof attributes.width === 'number' &&
        typeof attributes.height === 'number' &&
        attributes.columns >= 1 &&
        attributes.columns <= 4 &&
        attributes.width >= 80 &&
        attributes.width <= 100 &&
        attributes.height >= 400 &&
        attributes.height <= 800
    );
};
