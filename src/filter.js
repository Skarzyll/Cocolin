import fs from 'node:fs/promises'

export default async function filter(LinksforDownload) {
    const linksData = await fs.readFile(LinksforDownload, 'utf-8');

    const links = linksData
        .split(/\r?\n/)   // separa cada linha (cada link)
        .filter(link => link.trim());  // ignora linhas vazias

    const htmlLines = links.map(link => `<a href="${link}">${link}</a>`).join('\n');

    await fs.writeFile('index.html', htmlLines, 'utf-8');
}
