import { readFile, writeFile } from 'fs/promises'

const capitalize = (word) => {
    if (!word) return ""; // Handle empty strings or null
    return word.charAt(0).toUpperCase() + word.slice(1);
};

const generateIconDefinitions = async () => {
    let icons = JSON.parse(await readFile('fontawesome/whiteboard.json'));
    const iconNames = Object.keys(icons);
    const iconDefinitions = iconNames.map(iconName => {
        let constName = ['fa', ...iconName.split('-').map(el => capitalize(el))].join('');
        let iconDefinition = icons[iconName]
        iconDefinition[2] = iconDefinition[2].map(el => el.toString())
        let obj = {
            prefix: "fawsb",
            iconName: iconName,
            icon: iconDefinition
        }
        return `export const ${constName}:IconDefinition = ${JSON.stringify(obj, undefined, 3)}`
    })
    await writeFile('frontend/src/icons/wid.ts', ['import { IconDefinition } from "@fortawesome/angular-fontawesome"', ...iconDefinitions].join('\n'))
}
generateIconDefinitions().then(_ => process.exit())