import { connect } from "puppeteer-real-browser";
import fs from "node:fs";
import Comparator from "./comparator.js";

(async () => {
	const { page, browser } = await connect({ headless: false });

	const nick = ""; 
	const password = "";
	//Exemple
	const Link =
		"https://retroachievements.org/game-list/play?page%5Bsize%5D=200&filter%5BachievementsPublished%5D=either&filter%5Bgame-type%5D=prototype%2Cunlicensed%2Cdemo%2Cretail&filter%5Bsystem%5D=41&filter%5Bsubsets%5D=only-games";
	const receivesGames = "games.txt";
	const storedLinks = "psplinks.txt";
	const LinksforDownload = "LinksforDownload.txt";
	const arcadeGames = false;

	const preferredRegions = [
		"Brazil",
		"USA",
		"Europe",
		"World",
		"Unknow",
		"Australia",
		"United Kingdom",
		"Canada",
		"France",
		"Russia",
		"Taiwan",
		"Demo",
		"Prototype",
		"Proto",
	];
	const fallbackRegions = ["Japan", "Taiwan", "Korea", "China", "Asia"];

	try {
		// Launch the browser and open a new blank page
		await page.goto("https://retroachievements.org/login", {
			waitUntil: "domcontentloaded",
		});

		try {
			await page.waitForSelector("img", { timeout: 20000 });
			console.log("tela de login carregado");
		} catch {
			console.log("nao carregou");
		}

		try {
			const userinput = await page.$('input[name="User"]', { timeout: 30000 });
			const passwordinput = await page.$(
				'div.flex.flex-row > input[name="password"]'
			);

			if (userinput) await userinput.type(nick, { delay: 100 });
			userinput.press("Enter");

			if (passwordinput) await passwordinput.type(password, { delay: 100 });
		} catch (e) {
			console.log("nao foi" + e);
		}

		try {
			await page.click("button.btn.whitespace-nowrap.w-full.text-center.py-2");
			console.log("Login feito");
		} catch {
			console.log("Erro ao fazer login");
		}

		try {
			await page.waitForSelector("footer", { timeout: 4000 });
			console.log("tela de login carregado");
		} catch {
			console.log("nao carregou");
		}

		await page.goto(Link);

		try {
			const hrefs = [];

			async function coletarHrefsDaPagina() {
				const games = await page.$$(
					"table a.flex.max-w-fit.items-center.gap-2"
				);
				const localHrefs = [];

				for (let game of games) {
					const href = await game.evaluate((el) => el.getAttribute("href"));
					if (href) localHrefs.push(href + "/hashes");
				}

				return localHrefs;
			}

			// Coleta os hrefs da página atual
			hrefs.push(...(await coletarHrefsDaPagina()));

			// Verifica se o botão de próxima página está habilitado
			const botaoProxima = await page.$("button[aria-label='Go to next page']");

			if (botaoProxima) {
				while (true) {
					const isDisabled = await botaoProxima.evaluate(
						(el) => el.disabled || el.getAttribute("aria-disabled") === "true"
					);

					if (isDisabled) {
						console.log("Botão desabilitado");
						break; // Sai do loop
					}

					await botaoProxima.click();

					// Aguarda carregamento da nova tabela (ajuste o seletor se necessário)
					await page.waitForSelector("table", { timeout: 10000 });

					// Coleta os hrefs da nova página
					hrefs.push(...(await coletarHrefsDaPagina()));
				}
			}

			for (const hr of hrefs) {
				await page.goto(hr);
				/* await page.waitForSelector("ul.flex.flex-col.gap-3", {
					timeout: 30000,
				}); */

				// Verifica se há uma mensagem indicando 0 hashes registrados
				const hashStatusParagraph = await page.$$eval("p", (ps) => {
					const target = ps.find(
						(p) =>
							p.textContent.includes("There are currently") &&
							p.textContent.includes(
								"supported game file hashes registered for this game."
							)
					);
					return target ? target.textContent.trim() : null;
				});

				if (hashStatusParagraph?.includes("0 supported game file hashes")) {
					console.log("⚠️ Jogo sem hashes registrados, pulando:", hr);
					continue;
				}

				// Coleta os hashes disponíveis
				const spanTexts = await page.$$eval(
					"ul.flex.flex-col.gap-3 li",
					(lis) => {
						const validNames = [];
						const invalidNames = ["megadriv/sks3.7z"];

						for (const li of lis) {
							const link = li.querySelector("a");
							if (link && link.textContent.includes("Download Patch File")) {
								continue; // pula essa <li> que tem "Download Patch File"
							}
							const span = li.querySelector("p.space-x-1.sm\\:space-x-2 span");
							if (span) {
								const isInvalid = invalidNames.some((invalid) =>
									span.textContent.includes(invalid)
								);
								if (isInvalid) continue;

								validNames.push(span.textContent.trim());
							}
						}
						return validNames;
					}
				);

				let chosen = null;

				if (arcadeGames === true) {
					// Pega o primeiro hash sem filtrar por região
					chosen = spanTexts.length > 0 ? spanTexts[0] : null;
				} else {
					// Filtro normal por região
					for (const region of preferredRegions) {
						chosen = spanTexts.find((text) => text.includes(region));
						if (chosen) break;
					}

					if (!chosen) {
						for (const region of fallbackRegions) {
							chosen = spanTexts.find((text) => text.includes(region));
							if (chosen) break;
						}
					}
				}

				// 3. Se encontrou algo, verificar se é multi-disc
				if (chosen) {
					if (chosen.includes("(Disc 1)")) {
						// É um jogo multi-disc, buscar os discos relacionados
						const baseName = chosen.replace(/\(Disc 1\)/, "").trim();
						const relatedDiscs = spanTexts.filter(
							(text) => text.startsWith(baseName) && /\(Disc \d+\)/.test(text)
						);

						if (relatedDiscs.length > 0) {
							const discosUnicos = new Map();

							for (const disc of relatedDiscs) {
								const match = disc.match(/\(Disc (\d+)\)/);
								if (match) {
									const numeroDisco = match[1];
									// Se ainda não adicionamos esse disco, salvamos
									if (!discosUnicos.has(numeroDisco)) {
										discosUnicos.set(numeroDisco, disc);
									}
								}
							}

							for (const [num, disc] of discosUnicos.entries()) {
								console.log("Adicionado:", disc);
								fs.appendFileSync(receivesGames, `${disc}\n`);
							}
						}
					} else {
						// Não é multi-disc
						console.log("Adicionado:", chosen);
						fs.appendFileSync(receivesGames, `${chosen}\n`);
					}
				} else {
					console.log("⚠️ Nenhum jogo com região válida encontrado nesta página.", hr);
				}
			}
		} catch (e) {
			console.log("erro ao pegar os games" + e);
		}

		console.log("Encerrou");

		Comparator(receivesGames, storedLinks, LinksforDownload);
	} catch (error) {
		console.log(error);
	} finally {
		await browser.close();
	}
})();
