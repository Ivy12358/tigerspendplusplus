let visitsChart;
let spendChart;
let mobileOrdersChart;
let mobileLocationChart;
let balanceChart;
let purchaseTimeChart;

function resizeVisitsChart() {
	if (visitsChart) {
		visitsChart.resize();
	}
}

function resizeSpendChart() {
	if (spendChart) {
		spendChart.resize();
	}
}

function resizeMobileOrdersChart() {
	if (mobileOrdersChart) {
		mobileOrdersChart.resize();
	}
}

function resizeMobileLocationChart() {
	if (mobileLocationChart) {
		mobileLocationChart.resize();
	}
}

function resizeBalanceChart() {
	if (balanceChart) {
		balanceChart.resize();
	}
}

function resizePurchaseTimeChart() {
	if (purchaseTimeChart) {
		purchaseTimeChart.resize();
	}
}

function renderVisitsPieChart(visits) {
	const chartElement = document.querySelector(".visits-chart");

	if (!chartElement || !Array.isArray(visits)) {
		return;
	}

	if (visitsChart) {
		visitsChart.dispose();
	}

	const topVisitIndexes = new Set(
		visits
			.map(([, visitCount], index) => ({ index, visitCount }))
			.sort((left, right) => right.visitCount - left.visitCount)
			.slice(0, 5)
			.map(({ index }) => index)
	);

	visitsChart = echarts.init(chartElement);
	visitsChart.setOption({
		animation: true,
		animationDuration: 700,
		tooltip: {
			trigger: "item",
			formatter: "{b}: {c} visits ({d}%)"
		},
		legend: {
			bottom: 4,
			left: "center",
			type: "scroll"
		},
		series: [
			{
				name: "Visits",
				type: "pie",
				radius: ["28%", "52%"],
				center: ["50%", "38%"],
				left: 8,
				right: 8,
				top: 0,
				bottom: 30,
				avoidLabelOverlap: true,
				labelLayout: {
					hideOverlap: true,
					moveOverlap: "shiftY"
				},
				itemStyle: {
					borderColor: "#ffffff",
					borderWidth: 2
				},
				label: {
					show: false
				},
				labelLine: {
					show: false
				},
				data: visits.map(([location, visitCount], index) => ({
					name: location,
					value: visitCount,
					label: {
						show: topVisitIndexes.has(index),
						formatter: "{b}\n{c}",
						alignTo: "edge",
						edgeDistance: 8,
						bleedMargin: 0
					},
					labelLine: {
						show: topVisitIndexes.has(index),
						length: 8,
						length2: 10
					}
				}))
			}
		]
	});

}

function renderSpendPieChart(spend) {
	const chartElement = document.querySelector(".spend-chart");

	if (!chartElement || !Array.isArray(spend)) {
		return;
	}

	if (spendChart) {
		spendChart.dispose();
	}

	const topSpendIndexes = new Set(
		spend
			.map(([, spendAmount], index) => ({ index, spendAmount }))
			.sort((left, right) => right.spendAmount - left.spendAmount)
			.slice(0, 5)
			.map(({ index }) => index)
	);

	spendChart = echarts.init(chartElement);
	spendChart.setOption({
		animation: true,
		animationDuration: 700,
		tooltip: {
			trigger: "item",
			formatter: ({ name, value, percent }) => `${name}: $${Number(value).toFixed(2)} (${percent}%)`
		},
		legend: {
			bottom: 4,
			left: "center",
			type: "scroll"
		},
		series: [
			{
				name: "Spend",
				type: "pie",
				radius: ["28%", "52%"],
				center: ["50%", "38%"],
				left: 8,
				right: 8,
				top: 0,
				bottom: 30,
				avoidLabelOverlap: true,
				labelLayout: {
					hideOverlap: true,
					moveOverlap: "shiftY"
				},
				itemStyle: {
					borderColor: "#ffffff",
					borderWidth: 2
				},
				label: {
					show: false
				},
				labelLine: {
					show: false
				},
				data: spend.map(([location, spendAmount], index) => ({
					name: location,
					value: spendAmount,
					label: {
						show: topSpendIndexes.has(index),
						formatter: ({ name, value }) => `${name}\n$${Number(value).toFixed(2)}`,
						alignTo: "edge",
						edgeDistance: 8,
						bleedMargin: 0
					},
					labelLine: {
						show: topSpendIndexes.has(index),
						length: 8,
						length2: 10
					}
				}))
			}
		]
	});
}

function renderMobileOrdersPieChart(mobileOrders) {
	const chartElement = document.querySelector(".mobile-orders-chart");

	if (!chartElement || !Array.isArray(mobileOrders)) {
		return;
	}

	if (mobileOrdersChart) {
		mobileOrdersChart.dispose();
	}

	mobileOrdersChart = echarts.init(chartElement);
	mobileOrdersChart.setOption({
		animation: true,
		animationDuration: 700,
		tooltip: {
			trigger: "item",
			formatter: "{b}: {c} orders ({d}%)"
		},
		legend: {
			bottom: 4,
			left: "center"
		},
		series: [
			{
				name: "Orders",
				type: "pie",
				radius: ["28%", "58%"],
				center: ["50%", "44%"],
				itemStyle: {
					borderColor: "#ffffff",
					borderWidth: 2
				},
				label: {
					show: false
				},
				data: mobileOrders.map(([name, orderCount], index) => ({
					name,
					value: orderCount,
					itemStyle: {
						color: ["#e66b0b", "#2f7f9f"][index % 2]
					}
				}))
			}
		]
	});
}

function renderMobileLocationBarChart(mobileLocationData) {
	const chartElement = document.querySelector(".mobile-location-chart");

	if (!chartElement || !Array.isArray(mobileLocationData)) {
		return;
	}

	if (mobileLocationChart) {
		mobileLocationChart.dispose();
	}

	mobileLocationChart = echarts.init(chartElement);
	mobileLocationChart.setOption({
		animation: true,
		animationDuration: 700,
		grid: {
			left: 48,
			right: 18,
			top: 20,
			bottom: 70,
			containLabel: true
		},
		tooltip: {
			trigger: "axis",
			axisPointer: {
				type: "shadow"
			},
			formatter: ([{ axisValue, value }]) => `${axisValue}: ${value} mobile orders`
		},
		xAxis: {
			type: "category",
			data: mobileLocationData.map(([location]) => location),
			axisLabel: {
				interval: 0,
				rotate: 45
			}
		},
		yAxis: {
			type: "value",
			name: "Orders",
			nameLocation: "middle",
			nameGap: 34,
			minInterval: 1
		},
		series: [
			{
				name: "Mobile orders",
				type: "bar",
				data: mobileLocationData.map(([, visitCount]) => visitCount),
				barMaxWidth: 32,
				itemStyle: {
					color: "#e66b0b",
					borderRadius: [4, 4, 0, 0]
				}
			}
		]
	});
}

function renderPurchaseTimeBarChart(purchaseTimeData) {
	const chartElement = document.querySelector(".purchase-time-chart");

	if (!chartElement || !Array.isArray(purchaseTimeData)) {
		return;
	}

	if (purchaseTimeChart) {
		purchaseTimeChart.dispose();
	}

	purchaseTimeChart = echarts.init(chartElement);
	purchaseTimeChart.setOption({
		animation: true,
		animationDuration: 700,
		grid: {
			left: 48,
			right: 18,
			top: 16,
			bottom: 56,
			containLabel: true
		},
		tooltip: {
			trigger: "axis",
			axisPointer: {
				type: "shadow"
			},
			formatter: (params) => {
				const purchaseLines = params
					.filter(({ value }) => value > 0)
					.map(({ marker, seriesName, value }) => `${marker} ${seriesName}: ${value}`);

				return `${params[0].axisValue}<br>${purchaseLines.join("<br>")}`;
			}
		},
		xAxis: {
			type: "category",
			data: purchaseTimeData.map(([hour]) => hour),
			axisLabel: {
				interval: 0,
				rotate: 45
			}
		},
		yAxis: {
			type: "value",
			name: "Purchases",
			nameLocation: "middle",
			nameGap: 34,
			minInterval: 1
		},
		legend: {
			bottom: 4,
			left: "center",
			type: "scroll"
		},
		series: Object.keys(purchaseTimeData[0]?.[1] || {}).map((location, index) => ({
			name: location,
			type: "bar",
			stack: "purchases",
			data: purchaseTimeData.map(([, purchasesByLocation]) => purchasesByLocation[location]),
			barMaxWidth: 24,
			itemStyle: {
				color: [
					"#e66b0b", "#2f7f9f", "#d94f70", "#5f9e52", "#8c5a9e",
					"#c58b2a", "#4e6fae", "#b75d3d", "#3d8b7d", "#9b6b43"
				][index % 10]
			}
		}))
	});
}

function renderBalanceOverTimeChart(balanceHistory, selectedStartDate, selectedEndDate, endGoalValue) {
	const chartElement = document.querySelector(".balance-chart");

	if (!chartElement || !Array.isArray(balanceHistory)) {
		return;
	}

	if (balanceChart) {
		balanceChart.dispose();
	}

	const chartData = balanceHistory.filter(([date]) => {
		return (!selectedStartDate || date >= selectedStartDate)
			&& (!selectedEndDate || date <= selectedEndDate);
	});

	if (chartData.length === 0) {
		return;
	}

	const firstDate = chartData[0][0];
	const lastDate = selectedEndDate || chartData[chartData.length - 1][0];
	const startingBalance = chartData[0][1];
	const targetBalance = Number.isFinite(endGoalValue) ? endGoalValue : 0;
	const chartStartDate = selectedStartDate || firstDate;
	const chartStartTime = `${chartStartDate}T00:00:00`;
	const chartEndTime = `${lastDate}T00:00:00`;
	const actualBalanceData = [...chartData];

	while (actualBalanceData.length > 1
		&& actualBalanceData.at(-1)[1] === actualBalanceData.at(-2)[1]) {
		actualBalanceData.pop();
	}

	balanceChart = echarts.init(chartElement);
	balanceChart.setOption({
		animation: true,
		animationDuration: 700,
		grid: {
			left: 48,
			right: 18,
			top: 16,
			bottom: 42,
			containLabel: true
		},
		tooltip: {
			trigger: "axis",
			formatter: (params) => {
				const date = new Date(params[0].axisValue).toISOString().slice(0, 10);
				const lines = params
					.filter(({ value }) => Array.isArray(value))
					.map(({ marker, seriesName, value }) => {
						return `${marker} ${seriesName}: $${Number(value[1]).toFixed(2)}`;
					});

				return `${date}<br>${lines.join("<br>")}`;
			}
		},
		xAxis: {
			type: "time",
			min: chartStartTime,
			max: chartEndTime,
			boundaryGap: false,
			axisLabel: {
				formatter: (value) => new Date(value).toISOString().slice(0, 10),
				rotate: 30
			}
		},
		yAxis: {
			type: "value",
			name: "Balance",
			nameLocation: "middle",
			nameGap: 36,
			axisLabel: {
				formatter: (value) => `$${value}`
			}
		},
		series: [
			{
				name: "Balance",
				type: "line",
				data: actualBalanceData.map(([date, balance]) => [`${date}T00:00:00`, balance]),
				smooth: true,
				symbol: "circle",
				symbolSize: 6,
				lineStyle: {
					color: "#e66b0b",
					width: 3
				},
				itemStyle: {
					color: "#e66b0b",
					borderColor: "#fff4d6",
					borderWidth: 2
				},
				areaStyle: {
					color: "rgba(242, 139, 34, 0.2)"
				}
			},
			{
				name: "End goal",
				type: "line",
				data: [
					[`${firstDate}T00:00:00`, startingBalance],
					[chartEndTime, targetBalance]
				],
				symbol: "circle",
				symbolSize: 6,
				lineStyle: {
					color: "#5d6878",
					width: 2,
					type: "dashed"
				},
				itemStyle: {
					color: "#5d6878"
				}
			}
		]
	});
}

window.addEventListener("resize", resizeVisitsChart);
window.addEventListener("resize", resizeSpendChart);
window.addEventListener("resize", resizeMobileOrdersChart);
window.addEventListener("resize", resizeMobileLocationChart);
window.addEventListener("resize", resizeBalanceChart);
window.addEventListener("resize", resizePurchaseTimeChart);
