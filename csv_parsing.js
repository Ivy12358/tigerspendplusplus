function parseCsvRows(csvText) {
	const rows = [];
	let row = [];
	let cell = "";
	let isQuoted = false;

	for (let index = 0; index < csvText.length; index += 1) {
		const character = csvText[index];
		const nextCharacter = csvText[index + 1];

		if (character === '"') {
			if (isQuoted && nextCharacter === '"') {
				cell += '"';
				index += 1;
			} else {
				isQuoted = !isQuoted;
			}
		} else if (character === "," && !isQuoted) {
			row.push(cell);
			cell = "";
		} else if ((character === "\n" || character === "\r") && !isQuoted) {
			if (character === "\r" && nextCharacter === "\n") {
				index += 1;
			}
			row.push(cell);
			rows.push(row);
			row = [];
			cell = "";
		} else {
			cell += character;
		}
	}

	if (cell !== "" || row.length > 0) {
		row.push(cell);
		rows.push(row);
	}

	return rows;
}

function balanceOverTime(csvRows) {
	const balanceByDate = new Map();

	for (const line of csvRows) {
		if (!Array.isArray(line) || typeof line[0] !== "string" || line.length < 4) {
			continue;
		}

		const date = line[0].slice(0, 10);
		const balance = Number(line[3]);

		if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(balance)) {
			continue;
		}

		// Rows are newest first, so the first balance encountered is the day's ending balance.
		if (!balanceByDate.has(date)) {
			balanceByDate.set(date, balance);
		}
	}

	const dates = [...balanceByDate.keys()].sort();

	if (dates.length === 0) {
		return [];
	}

	const startDate = new Date(`${dates[0]}T00:00:00`);
	const endDate = new Date(`${dates[dates.length - 1]}T00:00:00`);
	const balanceHistory = [];
	let currentBalance;

	for (const date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
		const dateString = [
			date.getFullYear(),
			String(date.getMonth() + 1).padStart(2, "0"),
			String(date.getDate()).padStart(2, "0")
		].join("-");

		if (balanceByDate.has(dateString)) {
			currentBalance = balanceByDate.get(dateString);
		}

		balanceHistory.push([dateString, currentBalance]);
	}

	return balanceHistory;
}

function balanceOverTimeByAccounts(accountFiles, requestedEndDate) {
	const accountBalances = {
		main: new Map(),
		rollover: new Map()
	};

	for (const accountFile of accountFiles) {
		const accountName = accountFile.name.toLowerCase().includes("rollover")
			? "rollover"
			: "main";
		const balancesByDate = accountBalances[accountName];

		for (const line of accountFile.rows) {
			if (!Array.isArray(line) || typeof line[0] !== "string" || line.length < 4) {
				continue;
			}

			const date = line[0].slice(0, 10);
			const balance = Number(line[3]);

			if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(balance)) {
				continue;
			}

			if (!balancesByDate.has(date)) {
				balancesByDate.set(date, balance);
			}
		}
	}

	const dates = [...new Set(
		[...accountBalances.main.keys(), ...accountBalances.rollover.keys()]
	)].sort();

	if (dates.length === 0) {
		return [];
	}

	const startDate = new Date(`${dates[0]}T00:00:00`);
	const latestDataDate = new Date(`${dates[dates.length - 1]}T00:00:00`);
	const requestedDate = /^\d{4}-\d{2}-\d{2}$/.test(requestedEndDate || "")
		? new Date(`${requestedEndDate}T00:00:00`)
		: latestDataDate;
	const endDate = requestedDate >= startDate ? requestedDate : latestDataDate;
	const balanceHistory = [];
	const currentBalances = {
		main: 0,
		rollover: 0
	};

	for (const date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
		const dateString = [
			date.getFullYear(),
			String(date.getMonth() + 1).padStart(2, "0"),
			String(date.getDate()).padStart(2, "0")
		].join("-");

		if (accountBalances.main.has(dateString)) {
			currentBalances.main = accountBalances.main.get(dateString);
		}

		if (accountBalances.rollover.has(dateString)) {
			currentBalances.rollover = accountBalances.rollover.get(dateString);
		}

		balanceHistory.push([
			dateString,
			currentBalances.main + currentBalances.rollover
		]);
	}

	return balanceHistory;
}

function getMostRecentCombinedBalance(accountFiles) {
	const balances = {
		main: [],
		rollover: []
	};

	for (const accountFile of accountFiles) {
		const accountName = accountFile.name.toLowerCase().includes("rollover")
			? "rollover"
			: "main";

		for (const line of accountFile.rows) {
			if (!Array.isArray(line) || typeof line[0] !== "string" || line.length < 4) {
				continue;
			}

			const date = line[0].slice(0, 10);
			const balance = Number(line[3]);

			if (/^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(balance)) {
				balances[accountName].push({ date, balance });
			}
		}
	}

	const latestBalances = Object.fromEntries(
		Object.entries(balances).map(([accountName, entries]) => {
			entries.sort((first, second) => first.date.localeCompare(second.date));
			return [accountName, entries.at(-1)?.balance || 0];
		})
	);

	const firstBalances = Object.fromEntries(
		Object.entries(balances).map(([accountName, entries]) => [
			accountName,
			entries.sort((first, second) => first.date.localeCompare(second.date))[0]?.balance || 0
		])
	);

	const balanceHistory = balanceOverTimeByAccounts(accountFiles);
	const latestHistoryEntry = balanceHistory.at(-1);
	let twoWeekAverage = null;

	if (latestHistoryEntry && balanceHistory.length >= 15) {
		const twoWeeksAgoBalance = balanceHistory.at(-15)[1];
		const currentBalance = latestHistoryEntry[1];
		twoWeekAverage = Math.max(0, (twoWeeksAgoBalance - currentBalance) / 14);
	}

	return {
		currentBalance: latestBalances.main + latestBalances.rollover,
		initialBalance: firstBalances.main + firstBalances.rollover,
		twoWeekAverage
	};
}

function preparePurchaseTimeData(csvRows) {
	const locationMatchers = [
		["Artesano", "Artesano"],
		["Beanz", "Beanz"],
		["Ben & Jerrys", "Ben"],
		["Bytes", "MICRO"],
		["Croads", "Crossroads"],
		["College Grind", "Grind"],
		["Commons", "Commons"],
		["Corner Store", "Corner"],
		["Ctrl Alt Deli", "Ctrl"],
		["Brick City", "Brick"],
		["Loaded Latke", "Loaded"],
		["GV Market", "Market"],
		["Midnight Oil", "Midnight"],
		["Nathan's", "Nathan"],
		["Patio", "Cantina"],
		["Petals", "Petals"],
		["RITZ", "RITZ"],
		["VendDrinks", "BEVERAGE"],
		["VendSnacks", "SNACK"]
	];
	const purchasesByHour = Array.from({ length: 24 }, (_, hour) => [
		hour,
		Object.fromEntries(locationMatchers.map(([location]) => [location, 0]))
	]);

	for (const line of csvRows) {
		if (!Array.isArray(line) || typeof line[0] !== "string" || typeof line[1] !== "string") {
			continue;
		}

		const timeMatch = line[0].match(/(?:T|\s)(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?/i);

		if (!timeMatch) {
			continue;
		}

		let hour = Number(timeMatch[1]);
		const meridiem = timeMatch[3]?.toUpperCase();

		if (meridiem) {
			if (hour === 12) {
				hour = 0;
			}
			if (meridiem === "PM") {
				hour += 12;
			}
		}

		if (hour >= 0 && hour < 24) {
			const location = locationMatchers.find(([, matcher]) => line[1].includes(matcher))?.[0];

			if (location) {
				purchasesByHour[hour][1][location] += 1;
			}
		}
	}

	return purchasesByHour.map(([hour, purchasesByLocation]) => [
		new Date(2000, 0, 1, hour).toLocaleTimeString([], {
			hour: "numeric",
			hour12: true
		}),
		purchasesByLocation
	]);
}

function prepareLocationVisitData(csvRows) {
	const artesano = ["Artesano", 0];
	const beanz = ["Beanz", 0];
	const benJerrys = ["Ben & Jerrys", 0];
	const bytes = ["Bytes", 0];
	const croads = ["Croads", 0];
	const collegeGrind = ["College Grind", 0];
	const commons = ["Commons", 0];
	const cornerStore = ["Corner Store", 0];
	const ctrlAltDeli = ["Ctrl Alt Deli", 0];
	const brickCity = ["Brick City", 0];
	const loadedLatke = ["Loaded Latke", 0];
	const market = ["GV Market", 0];
	const midnightOil = ["Midnight Oil", 0];
	const nathans = ["Nathan's", 0];
	const patio = ["Patio", 0];
	const petals = ["Petals", 0];
	const ritz = ["RITZ", 0];
	const vendDrinks = ["VendDrinks", 0];
	const vendSnacks = ["VendSnacks", 0];
	const locationVisitData = [
		artesano,
		beanz,
		benJerrys,
		bytes,
		croads,
		collegeGrind,
		commons,
		cornerStore,
		ctrlAltDeli,
		brickCity,
		loadedLatke,
		market,
		midnightOil,
		nathans,
		patio,
		petals,
		ritz,
		vendDrinks,
		vendSnacks
	];

	for (const line of csvRows) {
		if (!Array.isArray(line) || typeof line[1] !== "string") {
			continue;
		}

		if (line[1].includes("Artesano")) artesano[1] += 1;
		if (line[1].includes("Beanz")) beanz[1] += 1;
		if (line[1].includes("Ben")) benJerrys[1] += 1;
		if (line[1].includes("MICRO")) bytes[1] += 1;
		if (line[1].includes("Crossroads")) croads[1] += 1;
		if (line[1].includes("Grind")) collegeGrind[1] += 1;
		if (line[1].includes("Commons")) commons[1] += 1;
		if (line[1].includes("Corner")) cornerStore[1] += 1;
		if (line[1].includes("Ctrl")) ctrlAltDeli[1] += 1;
		if (line[1].includes("Brick")) brickCity[1] += 1;
		if (line[1].includes("Loaded")) loadedLatke[1] += 1;
		if (line[1].includes("Market")) market[1] += 1;
		if (line[1].includes("Midnight")) midnightOil[1] += 1;
		if (line[1].includes("Nathan")) nathans[1] += 1;
		if (line[1].includes("Cantina")) patio[1] += 1;
		if (line[1].includes("Petals")) petals[1] += 1;
		if (line[1].includes("RITZ")) ritz[1] += 1;
		if (line[1].includes("BEVERAGE")) vendDrinks[1] += 1;
		if (line[1].includes("SNACK")) vendSnacks[1] += 1;
	}

	return locationVisitData;
}

function PrepareLocationSpendData(csvRows) {
	const artesano = ["Artesano", 0];
	const beanz = ["Beanz", 0];
	const benJerrys = ["Ben & Jerrys", 0];
	const bytes = ["Bytes", 0];
	const croads = ["Croads", 0];
	const collegeGrind = ["College Grind", 0];
	const commons = ["Commons", 0];
	const cornerStore = ["Corner Store", 0];
	const ctrlAltDeli = ["Ctrl Alt Deli", 0];
	const brickCity = ["Brick City", 0];
	const loadedLatke = ["Loaded Latke", 0];
	const market = ["GV Market", 0];
	const midnightOil = ["Midnight Oil", 0];
	const nathans = ["Nathan's", 0];
	const patio = ["Patio", 0];
	const petals = ["Petals", 0];
	const ritz = ["RITZ", 0];
	const vendDrinks = ["VendDrinks", 0];
	const vendSnacks = ["VendSnacks", 0];
	const locationSpendData = [
		artesano,
		beanz,
		benJerrys,
		bytes,
		croads,
		collegeGrind,
		commons,
		cornerStore,
		ctrlAltDeli,
		brickCity,
		loadedLatke,
		market,
		midnightOil,
		nathans,
		patio,
		petals,
		ritz,
		vendDrinks,
		vendSnacks
	];

	for (const line of csvRows) {
		if (!Array.isArray(line) || typeof line[1] !== "string") {
			continue;
		}

		const spend = Math.abs(Number(line[2]));

		if (line[1].includes("Artesano")) artesano[1] += spend;
		if (line[1].includes("Beanz")) beanz[1] += spend;
		if (line[1].includes("Ben")) benJerrys[1] += spend;
		if (line[1].includes("MICRO")) bytes[1] += spend;
		if (line[1].includes("Crossroads")) croads[1] += spend;
		if (line[1].includes("Grind")) collegeGrind[1] += spend;
		if (line[1].includes("Commons")) commons[1] += spend;
		if (line[1].includes("Corner")) cornerStore[1] += spend;
		if (line[1].includes("Ctrl")) ctrlAltDeli[1] += spend;
		if (line[1].includes("Brick")) brickCity[1] += spend;
		if (line[1].includes("Loaded")) loadedLatke[1] += spend;
		if (line[1].includes("Market")) market[1] += spend;
		if (line[1].includes("Midnight")) midnightOil[1] += spend;
		if (line[1].includes("Nathan")) nathans[1] += spend;
		if (line[1].includes("Cantina")) patio[1] += spend;
		if (line[1].includes("Petals")) petals[1] += spend;
		if (line[1].includes("RITZ")) ritz[1] += spend;
		if (line[1].includes("BEVERAGE")) vendDrinks[1] += spend;
		if (line[1].includes("SNACK")) vendSnacks[1] += spend;
	}

	return locationSpendData;
}

async function processCsvFiles(csvFiles, selectedStartDate, selectedEndDate, endGoalValue) {
	if (csvFiles.length === 0) {
		console.log("No uploaded files to load.");
		return [];
	}

	const parsedFiles = [];
	const accountFiles = [];

	for (const csvFile of csvFiles) {
		const contents = await csvFile.text();
		const rows = parseCsvRows(contents);
		const dataRows = rows.slice(1);

		parsedFiles.push(dataRows);
		accountFiles.push({
			name: csvFile.name,
			rows: dataRows
		});
		console.log(`Parsed rows from ${csvFile.name}:`, dataRows);
	}

	const combinedRows = parsedFiles.flat();
	const visits = prepareLocationVisitData(combinedRows);
	const spend = PrepareLocationSpendData(combinedRows);
	const purchaseTimeData = preparePurchaseTimeData(combinedRows);
	const balanceHistory = balanceOverTimeByAccounts(accountFiles, selectedEndDate);
	const balanceSummary = getMostRecentCombinedBalance(accountFiles);

	console.log("Visits from all uploaded files:", visits);
	console.log("Spend from all uploaded files:", spend);
	console.log("Purchases by hour from all uploaded files:", purchaseTimeData);
	console.log("Balance over time from all uploaded files:", balanceHistory);
	renderVisitsPieChart(visits);
	renderSpendPieChart(spend);
	renderPurchaseTimeBarChart(purchaseTimeData);
	renderBalanceOverTimeChart(balanceHistory, selectedStartDate, selectedEndDate, endGoalValue);
	renderProgressSummary(balanceSummary);

	return parsedFiles;
}
