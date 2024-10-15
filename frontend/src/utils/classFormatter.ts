export function formatClassString(jsonStr: string, indent: number = 0): string {
    const obj = JSON.parse(jsonStr);
    const className = obj.class_name;
    const { class_name, ...attributes } = obj; // Exclude class_name from attributes

    const indentStr = ' '.repeat(indent);

    if (indent > 0) {
        const attrs = Object.entries(attributes)
            .map(([key, value]) => {
                // Format the value to match Python-style representations
                const formattedValue =
                    typeof value === 'string' ? `'${value}'` : value;
                return `${indentStr}${key}=${formattedValue},`;
            })
            .join('\n');
        return `${className}(\n${attrs}\n)`;
    } else {
        const attrs = Object.entries(attributes)
            .map(([key, value]) => {
                const formattedValue =
                    typeof value === 'string' ? `'${value}'` : value;
                return `${key}=${formattedValue}`;
            })
            .join(', ');
        return `${className}(${attrs})`;
    }
}
