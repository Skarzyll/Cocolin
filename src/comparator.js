import fs from 'fs/promises';
import filter from './filter.js';

export default async function Comparator(receivesGames, storedLinks, LinksforDownload) {
    const games = [];
    const links = [];
    const linksFiltered = new Set();
    const notFoundGames = [];

    let gamesMatched = 0;
    let totalGames = 0;
    
    function normalizeFilename(name) {
        return name
            .replace(/\.(gba|zip|7z|nes|snes|32x|fds|sfds|sfc|bs|unf|z64|ndd|nds|min|vb|a26|a78|j64|lnx|sg|sms|gg|md|ngc|ngp|chd|iso|neo)$/i, '')  // Remove extensão
            .replace(/&/g, ' ')
            .replace(/()/g, '')
            .replace(/,/g, '')
            .replace(/\s+/g, ' ')          // Espaços extras
            .trim();
    }

    function extractFilenameFromLink(link) {
        const decoded = decodeURIComponent(link);
        return decoded.split('/').pop(); // Última parte do caminho (nome do arquivo)
    }

    try {
        const gamesData = await fs.readFile(receivesGames, 'utf-8');
        const linksData = await fs.readFile(storedLinks, 'utf-8');
        const gamesLine = gamesData.split(/\r?\n/);
        const linkLine = linksData.split(/\r?\n/);

        for (const line of gamesLine) {
            if (line.trim()) games.push(line.trim());
        }

        for (const line of linkLine) {
            if (line.trim()) links.push(line.trim());
        }

        totalGames = games.length;

        for (const game of games) {
            const gameBase = normalizeFilename(game);

            let matchFound = false;

            for (const link of links) {
                const filename = extractFilenameFromLink(link);
                const linkBase = normalizeFilename(filename);

                // Comparação exata: nome do jogo == nome do arquivo (sem extensão)
                if (gameBase === linkBase) {
                    if (!linksFiltered.has(link)) {
                        linksFiltered.add(link);
                        matchFound = true;
                    } 
                    break;
                }
            }

            if (matchFound) gamesMatched++;
            if (!matchFound) {
                notFoundGames.push(game);
            }
        }

        if (notFoundGames.length > 0) {
            console.log(`\n❌ Jogos sem link correspondente (${notFoundGames.length}):`);
            for (const notFound of notFoundGames) {
                console.log(`- ${notFound}`);
            }
        } else {
            console.log('\n✅ Todos os jogos foram encontrados!');
        }

        const successRate = (gamesMatched / totalGames) * 100;
        console.log(`\n📈 Sucesso: ${successRate.toFixed(2)}% dos jogos tiveram link correspondente exato.`);

        await fs.appendFile(LinksforDownload, Array.from(linksFiltered).join('\n'));

        filter(LinksforDownload);
    } catch (error) {
        console.error(error);
    }
}
